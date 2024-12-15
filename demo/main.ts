import OrderBook from "../src/index";

const orderBook = new OrderBook("orderBookCanvas", {
  rows: 20,
  fontSize: 6,
  //   scale: 2,
  width: 250,
  height: 1800,
  dataRange: [10000, 20000],
  showBgBar: true,
  bgColor: "#555",
  textColor: "#ffffff",
  barColor: "#0f0",
  barOpacity: 0.2,
  rowGap: 6,
  rowHeight: 20,
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
  ],
});

setInterval(() => {
  const base = 10000;
  const data = Array.from({ length: 20 }, (_, i) => ({
    price: { value: base + base * Math.random(), color: "red" },
    volume: { value: 0.003 + 100 * Math.random(), color: "white" },
    total: { value: 1.66634 + i * 0.001, color: "white" },
  }));

  orderBook.update(data);
}, 1000);
