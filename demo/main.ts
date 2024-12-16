import OrderBook from "../src/index";

const orderBook = new OrderBook("orderBookCanvas", {
  rows: 20,
  fontSize: 6,
  //   scale: 2,
  dataRange: [10000, 20000],
  showBgBar: true,
  bgColor: "#000",
  textColor: "#ffffff",
  barColor: {
    stops: [
      { position: 0, color: "rgb(0, 255, 0)", opacity: 0.6 },
      { position: 0.5, color: "rgb(0, 255, 0)", opacity: 0.4 },
      { position: 1, color: "rgb(0, 255, 0)", opacity: 0.2 }
    ]
  },
  barOpacity: 0.2,
  rowGap: 6,
  rowHeight: 20,
  hoverStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    // transition: 'background-color 0.15s ease'
  },
  columns: [
    {
      title: "Price",
      key: "price",
      width: 100,
      align: "left",
      color: "white",
    },
    {
      title: "Volume",
      key: "volume",
      width: 50,
      align: "right",
      color: "white",
    },
    {
      title: "Total",
      key: "total",
      width: 130,
      align: "right",
      color: "white",
    },
    {
      title: "Random",
      key: "random",
      width: 100,
      align: "right",
      color: "white",
    },
  ],
});

let frame = 0;
let order = 0;
let len = 0;
const update = () => {
  const base = 10000;
  order++;
  frame++;
  len = 2000 + (order % 1000);
  const ts = Date.now();
  const data = Array.from({ length: len }, (_, i) => ({
    ts: ts,
    price: { value: base + base * Math.random(), color: "red" },
    volume: { value: 0.003 + 100 * Math.random(), color: "white" },
    total: { value: 1.66634 + i * 0.001, color: "yellow" },
    random: { value: 200 - (100 * Math.random()).toFixed(2), color: "blue" },
  }));
  orderBook.update(data);
  //   requestAnimationFrame(update);
};
// setInterval(update, 2000);
update();

setInterval(() => {
  console.log("--main frame rate", frame, len, order);
  frame = 0;
}, 1000);

// Listen for row hover
orderBook.on("hover", (e) => {
  const { index, data } = e;
  console.warn("hover:", index, data);
});

// Listen for row clicks
orderBook.on("click", (e) => {
  const { index, data } = e;
  console.warn("click:", index, data);
});
