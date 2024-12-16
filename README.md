# 2024-12-14

# description

1. this repo is a library that provide a offscreencanvas api to transfer all canvas draw calls to a webworker.
2. and use update method to update the canvas.
3. you can use the API in the webworker thread, and the update API will transfer data to SharedArrayBuffer.
4. if your website don't support SharedArrayBuffer, the API will tranfer data to ArrayBuffer Instead.
5. the update method will draw background color bar according to the dataRange and the row data price value and color, color opacity is 0.5. the bar draw from right to left. bar length is determined by (price-dataRange[0])/(dataRange[1] - dataRange[0]) \* canvas width.
6. the text color dafault is white, you can change it by set color property.
7. one row only have one background color bar,and the bar length is only determined by the price value and dataRange.
8. the volume and total text color is white, you can change it by set color property.
9. default row height is auto decide by the font size and font family.
10. the canvas style width and height is auto decide by the canvas dom width and height.
11. default the row gap is 0.
12. colume text is right align, price text is left align, total text is right align.
13. the text positon must align with the background bar position
14. the columns is an array, each item is a column config, you can set the title, key, width, align, color, and the order of the columns is the order of the columns in the canvas, and row data will be sorted by the key of the columns.
15. the columns width is decide by the column config width.
16. the row height is decide by the rowHeight.
17. the row gap is decide by the rowGap. and the bar height is decide by the rowHeight
18. the scale can be set by the scale property and default is Window.devicePixelRatio or 1.
19. the on method is implemented by the dom event listener. all row element hava a empty div element over the canvas, and there is a data-index attribute on the div element, you can use it to get the row data index when the event is triggered. event listener is delegated to the parent div element which is also the parent of the canvas element.
20. the dom drawed over the canvas width is canvas.width, and the every row element div height is rowHeight.
21. when hover the row, the row will be highlighted, you can set the highlight style by the hoverStyle property to the row div element, but the default row div element is transparent.

# params

- rows: number; // to decide the row background color bar width
- dataRange: [number, number]; // to decide the row background color bar width
- showBgBar: boolean // to decide if draw data color bar background
- bgColor: string; // the canvas background color
- textColor: string; // the text color
- barColor: string; // the bar background color
- barOpacity: number; // the bar background color opacity
- fontFamily: string; // the font family
- fontSize: number; // the font size
- width: number; // the canvas width
- height: number; // the canvas height
- rowHeight: number; // the row height
- rowGap: number; // the row gap
- scale: number; // the scale of the canvas, default is 1
- hoverStyle:{},  constrol the hover div style when hover the row, default is transparent and background color is rgba(255, 255, 255, 0.5)
- columns: [
  {title:'price', key:'price', width:100, align:'left', color:'white'},
  {title:'volume', key:'volume', width:100, align:'right', color:'white'},
  {title:'total', key:'total', width:100, align:'right', color:'white'},
  ]

# methods

### on

on method works same as dom.addEventListener, you can listen the event on the every row data and get the callback when the event is triggered.
the event listener is implemented by the dom event listener. because thers is a not visible div element over the canvas.

```js
orderBook.on("hover", (data) => {
  console.log(data);
});
```

### update

```js
orderBook.update(data);

data: {
  price: string;
  volume: string;
  total: string;
}
```

### data structure

- price: { value: number; color: string }
- volume: { value: number; color: string }
- total: { value: number; color: string }

### destroy

```js
orderBook.destroy();
```

# usage

```js
import OrderBook from "orderbook";

const orderBook = new OrderBook("orderBookCanvas", {
  rows: 20,
  dataRage: [10, 200], // to decide the row background color bar width
  showBgBar: true, // to decide if draw data color bar background
  bgColor: "#fff",
  barColor: "#555",
  barOpacity: 0.5,
  fontFamily: "monospace",
  fontSize: 7,
  hoverStyle:{
    border:'1px solid red',
    backgroundColor:'rgba(0, 0, 255, 0.5)',
  }
});

// Update with real data
orderBook.update([
  {
    price: { value: 101835.9, color: "red" },
    volume: { value: 0.003, color: "blue" },
    total: { value: 1.66634, color: "green" },
  },
  {
    price: { value: 101835.8, color: "red" },
    volume: { value: 0.003, color: "blue" },
    total: { value: 1.66334, color: "green" },
  },
]);

// the hover eventlistener should like this, and the data is the row data
orderBook.on("hover", (data) => {
  console.log(data);
});

// Clean up when done
orderBook.destroy();
```

# API

## OrderBook

### constructor

```js
new OrderBook(canvasId, options);
```

# demo

the demo will run with https server to enable SharedArrayBuffer
[demo](./demo/index.html)
