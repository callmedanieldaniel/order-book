interface ColumnConfig {
  title: string;
  key: string;
  width: number;
  align: "left" | "right" | "center";
  color: string;
}

interface OrderBookOptions {
  rows?: number;
  scale?: number;
  dataRange?: [number, number];
  showBgBar?: boolean;
  bgColor?: string;
  textColor?: string;
  barColor?: string;
  barOpacity?: number;
  fontFamily?: string;
  fontSize?: number;
  rowGap?: number;
  rowHeight?: number;
  columns?: ColumnConfig[];
  hoverStyle?: {
    backgroundColor?: string;
    transition?: string;
  };
}

interface OrderBookDataValue {
  value: number;
  color: string;
}

interface OrderBookData {
  [key: string]: OrderBookDataValue;
}

export default class OrderBook {
  private canvas: HTMLCanvasElement;
  private worker: Worker;
  private offscreen: OffscreenCanvas;
  private options: Required<OrderBookOptions>;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private rowElements: HTMLDivElement[] = [];
  private currentData: OrderBookData[] = [];
  private eventHandlers: { [key: string]: Function[] } = {};
  private wrapper: HTMLDivElement;

  // Simplified event handling methods
  on(eventName: "hover" | "click", handler: Function) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    this.eventHandlers[eventName].push(handler);
  }

  off(eventName: "hover" | "click", handler: Function) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(
        (h) => h !== handler
      );
    }
  }

  private emitEvent(eventName: "hover" | "click", detail: any) {
    const handlers = this.eventHandlers[eventName] || [];
    console.log("emitEvent", eventName, detail);
    handlers.forEach((handler) => handler(detail));
  }

  private clearRowStyles() {
    this.rowElements.forEach((row) => {
      row.style.backgroundColor = "transparent";
    });
  }

  constructor(canvasId: string, options: OrderBookOptions = {}) {
    this.options = {
      rows: options.rows || 20,
      scale: options.scale || window.devicePixelRatio || 1,
      dataRange: options.dataRange || [0, 100],
      showBgBar: options.showBgBar ?? true,
      bgColor: options.bgColor || "#000000",
      textColor: options.textColor || "#ffffff",
      barColor: options.barColor || "#333333",
      barOpacity: options.barOpacity || 0.5,
      fontFamily: options.fontFamily || "Arial",
      fontSize: options.fontSize || 12,
      rowGap: options.rowGap || 4,
      rowHeight: options.rowHeight || 20,
      hoverStyle: options.hoverStyle || {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        transition: "background-color 0.1s ease",
      },
      columns: options.columns || [
        {
          title: "Price",
          key: "price",
          width: 100,
          align: "right",
          color: "white",
        },
        {
          title: "Volume",
          key: "volume",
          width: 100,
          align: "right",
          color: "white",
        },
        {
          title: "Total",
          key: "total",
          width: 100,
          align: "right",
          color: "white",
        },
      ],
    };

    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    // Calculate dimensions once
    const totalWidth = this.options.columns.reduce(
      (sum, col) => sum + col.width,
      0
    );
    const totalHeight =
      (this.options.rows + 1) * (this.options.rowHeight + this.options.rowGap);
    const headerHeight = this.options.rowHeight + this.options.rowGap;

    // Create wrapper div with exact canvas dimensions
    this.wrapper = document.createElement("div");
    this.wrapper.style.position = "relative";
    this.wrapper.style.width = `${totalWidth}px`;
    this.wrapper.style.height = `${totalHeight}px`;
    this.wrapper.style.overflow = "hidden";
    this.canvas.parentNode?.insertBefore(this.wrapper, this.canvas);
    this.wrapper.appendChild(this.canvas);

    // Create row divs
    for (let i = 0; i < this.options.rows; i++) {
      const rowDiv = document.createElement("div");
      rowDiv.style.position = "absolute";
      rowDiv.style.left = "0";
      rowDiv.style.width = `${totalWidth}px`;
      rowDiv.style.height = `${this.options.rowHeight}px`;
      rowDiv.style.top = `${
        headerHeight + i * (this.options.rowHeight + this.options.rowGap)
      }px`;
      rowDiv.style.cursor = "pointer";
      rowDiv.style.transition = this.options.hoverStyle.transition;
      rowDiv.dataset.rowIndex = i.toString();

      this.wrapper.appendChild(rowDiv);
      this.rowElements.push(rowDiv);
    }

    // Add event listeners to wrapper
    this.wrapper.addEventListener("mouseover", (e) => {
      const target = e.target as HTMLElement;
      const rowIndex = target.dataset.rowIndex;

      if (rowIndex !== undefined) {
        this.clearRowStyles();
        const rowData = this.currentData[parseInt(rowIndex)];
        if (rowData) {
          target.style.backgroundColor =
            this.options.hoverStyle.backgroundColor;
          this.emitEvent("hover", {
            index: parseInt(rowIndex),
            data: rowData,
          });
        }
      }
    });



    this.wrapper.addEventListener("mouseout", (e) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget && relatedTarget !== this.wrapper && !this.wrapper.contains(relatedTarget)) {
        this.clearRowStyles();
        // this.emitEvent("hover", null);
      }
    });

    this.wrapper.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const rowIndex = target.dataset.rowIndex;

      if (rowIndex !== undefined) {
        const rowData = this.currentData[parseInt(rowIndex)];
        this.emitEvent("click", { index: parseInt(rowIndex), data: rowData });
      }
    });

    // Set canvas size and position
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.style.width = `${totalWidth}px`;
    this.canvas.style.height = `${totalHeight}px`;
    this.canvas.width = totalWidth * this.options.scale;
    this.canvas.height = totalHeight * this.options.scale;
    this.canvas.style.zIndex = "0";

    if (!("transferControlToOffscreen" in this.canvas)) {
      throw new Error("OffscreenCanvas is not supported in this browser");
    }

    try {
      this.sharedBuffer = new SharedArrayBuffer(1024);
    } catch (e) {
      console.warn(
        "SharedArrayBuffer not supported, falling back to regular ArrayBuffer"
      );
    }

    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.offscreen = this.canvas.transferControlToOffscreen();
    this.worker.postMessage(
      {
        type: "init",
        canvas: this.offscreen,
        options: this.options,
        sharedBuffer: this.sharedBuffer,
      },
      [this.offscreen]
    );
  }

  update(data: OrderBookData[]) {
    this.currentData = data;

    // Update row data attributes
    data.slice(0, this.options.rows).forEach((rowData, index) => {
      const rowDiv = this.rowElements[index];
      if (rowDiv) {
        rowDiv.dataset["index"] = index.toString();
      }
    });

    // Send data to worker
    this.worker.postMessage({
      type: "update",
      data,
      buffer: this.sharedBuffer || new ArrayBuffer(1024),
    });
  }

  destroy() {
    // Clear event handlers
    this.eventHandlers = {};

    // Remove row elements
    this.rowElements.forEach((row) => row.remove());
    this.rowElements = [];

    this.worker.postMessage({ type: "destroy" });
    this.worker.terminate();
  }
}
