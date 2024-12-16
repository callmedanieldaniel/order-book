interface ColumnConfig {
  title: string;
  key: string;
  width: number;
  align: "left" | "right" | "center";
  color: string;
}

interface OrderBookDataValue {
  value: number;
  color: string;
}

interface OrderBookData {
  [key: string]: OrderBookDataValue;
}

interface GradientStop {
  position: number;
  color: string;
  opacity: number;
}

interface WorkerOptions {
  rows: number;
  dataRange: [number, number];
  showBgBar: boolean;
  bgColor: string;
  textColor: string;
  barColor: string | {
    stops: GradientStop[];
  };
  barOpacity: number;
  fontFamily: string;
  fontSize: number;
  scale: number;
  rowGap: number;
  rowHeight: number;
  columns: ColumnConfig[];
}

let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;
let sharedBuffer: SharedArrayBuffer | null = null;
let options: WorkerOptions;

let frame = 0;
let transTime = 0;

setInterval(() => {
  console.log("worker frame rate", frame, transTime);
  frame = 0;
}, 1000);

self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "init":
      canvas = event.data.canvas;
      options = event.data.options;
      sharedBuffer = event.data.sharedBuffer;
      ctx = canvas.getContext("2d", {
        alpha: false,
      }) as OffscreenCanvasRenderingContext2D;
      initCanvas();
      break;

    case "update":
      if (event.data.buffer) {
        processBuffer(event.data.buffer);
      }
      drawOrderBook(data);
      break;

    case "destroy":
      break;
  }
};

function processBuffer(buffer: SharedArrayBuffer | ArrayBuffer) {
  const view = new Float64Array(buffer);
  return view;
}

function initCanvas() {
  if (!ctx) return;
  const scale = options.scale || 1;
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  setFont();
}

function setFont() {
  if (!ctx) return;
  const scaledFontSize = Math.round(options.fontSize * options.scale);
  ctx.font = `${scaledFontSize}px ${options.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
}

function getTextX(x: number, width: number, align: string): number {
  switch (align) {
    case "left":
      return x + 5;
    case "right":
      return x + width - 5;
    case "center":
      return x + width / 2;
    default:
      return x;
  }
}

function drawBackgroundBar(x: number, y: number, width: number, value: number) {
  if (!options.showBgBar) return;

  const [min, max] = options.dataRange;
  const percentage = Math.max(0, Math.min((value - min) / (max - min), 1));
  const barWidth = width * percentage;
  const startX = x + width;

  // Create gradient
  const gradient = ctx.createLinearGradient(
    startX - barWidth,  // start x
    0,                  // start y
    startX,            // end x
    0                  // end y
  );

  if (typeof options.barColor === 'string') {
    // Single color with opacity gradient
    gradient.addColorStop(0, options.barColor.replace(')', ', 0.9)'));
    gradient.addColorStop(1, options.barColor.replace(')', ', 0.5)'));
  } else {
    // Multiple color stops with positions
    options.barColor.stops.forEach(({ position, color, opacity }) => {
      gradient.addColorStop(
        position,
        color.includes('rgba') ? color : color.replace(')', `, ${opacity})`)
      );
    });
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(
    startX - barWidth,
    y - options.rowHeight/2,
    barWidth,
    options.rowHeight
  );
}

function formatValue(value: number, key: string): string {
  switch (key) {
    case "volume":
    case "total":
      return value.toFixed(5);
    case "price":
      return value.toFixed(1);
    default:
      return value.toString();
  }
}

function drawOrderBook(data: OrderBookData[]) {
  const ts = Date.now();
  const pre = data[0].ts;
  transTime = ts - pre;

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  setFont();

  const rowHeight = options.rowHeight;
  const rowGap = options.rowGap;
  const totalRowHeight = rowHeight + rowGap;

  // Calculate vertical center of first row (header)
  const headerY = rowHeight / 2;

  // Draw headers
  let currentX = 0;
  options.columns.forEach((column) => {
    ctx.textAlign = column.align;
    ctx.fillStyle = column.color;
    const x = getTextX(currentX, column.width, column.align);
    // Draw header text vertically centered
    ctx.fillText(column.title, x, headerY);
    currentX += column.width;
  });

  // Draw data rows
  data.slice(0, options.rows).forEach((row, index) => {
    // Calculate vertical center of each row
    const rowCenter = headerY + totalRowHeight * (index + 1);

    if (options.showBgBar) {
      drawBackgroundBar(
        0,
        rowCenter,
        canvas.width / options.scale,
        row[options.columns[0].key].value
      );
    }

    currentX = 0;
    options.columns.forEach((column) => {
      const cellData = row[column.key];
      ctx.textAlign = column.align;
      ctx.fillStyle = cellData.color;
      const x = getTextX(currentX, column.width, column.align);
      // Draw cell text vertically centered
      ctx.fillText(formatValue(cellData.value, column.key), x, rowCenter);
      currentX += column.width;
    });
  });
  frame++;
}
