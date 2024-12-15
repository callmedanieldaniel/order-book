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
      columns: options.columns || [
        {
          title: "Price",
          key: "price",
          width: 100,
          align: "right",
          color: "white"
        },
        {
          title: "Volume",
          key: "volume",
          width: 100,
          align: "right",
          color: "white"
        },
        {
          title: "Total",
          key: "total",
          width: 100,
          align: "right",
          color: "white"
        }
      ]
    };

    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    // Calculate canvas size based on columns
    const totalWidth = this.options.columns.reduce((sum, col) => sum + col.width, 0);
    const totalHeight = (this.options.rows + 1) * (this.options.rowHeight + this.options.rowGap);

    // Set canvas size
    this.canvas.style.width = `${totalWidth}px`;
    this.canvas.style.height = `${totalHeight}px`;
    this.canvas.width = totalWidth * this.options.scale;
    this.canvas.height = totalHeight * this.options.scale;

    if (!("transferControlToOffscreen" in this.canvas)) {
      throw new Error("OffscreenCanvas is not supported in this browser");
    }

    try {
      this.sharedBuffer = new SharedArrayBuffer(1024);
    } catch (e) {
      console.warn("SharedArrayBuffer not supported, falling back to regular ArrayBuffer");
    }

    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.offscreen = this.canvas.transferControlToOffscreen();
    this.worker.postMessage({
      type: "init",
      canvas: this.offscreen,
      options: this.options,
      sharedBuffer: this.sharedBuffer
    }, [this.offscreen]);
  }

  update(data: OrderBookData[]) {
    this.worker.postMessage({
      type: "update",
      data,
      buffer: this.sharedBuffer || new ArrayBuffer(1024)
    });
  }

  destroy() {
    this.worker.postMessage({ type: "destroy" });
    this.worker.terminate();
  }
}
