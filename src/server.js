const path = require('path');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);

let port = process.env.PORT || 80;

server.listen(port, () => console.log('listening on port: ', port));

// const request = require("request");
// const rp = require("request-promise");

const axios = require("axios");
const cheerio = require("cheerio");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
//Serves static index.html file to the browser
app.use(express.static(__dirname + "/public"));
//app will parse the res.body into JSON
app.use(bodyParser.json());
//browser data is urlencoded and must be parsed accordingly
app.use(bodyParser.urlencoded({ extended: false }));
// app.listen(port);
//stores the user's search data
let stockList = [];
console.log(port);

/*
  Due to the webpage being dynamic, classes are changed frequently by Google but I found that the overall structure of the DOM stays the same.
  I couldn't rely on finding the elements with the class name I wanted to pull data from since they changed so frequently and their names were abstract.
  I had to traverse the DOM to find each element's relative position to the <main> tag. Then I found each parent <div> tag until I got to the element I wanted to retrieve and it's text.
*/

app.post("/", async (req, res) => {
    let searchUrl =
    "https://www.google.com/finance/quote/" +
    req.body.name +
    ":" +
    req.body.stock;
    await axios.get(searchUrl)
    .then(res => {
      const $ = cheerio.load(res.data);
      let stock = `${req.body.name} : ${req.body.stock}`;
      let indexStart = $.html("main > div:eq(0) > div:eq(1)").indexOf(">") + 1;
      let indexEnd = $.html("main > div:eq(0) > div:eq(1)").indexOf("<", ("<".indexOf("<") + 1));
      let company = $.html("main > div:eq(0) > div:eq(1)").substring(indexStart, indexEnd);
      let index$ = $.html("span:contains($) > div:eq(0) > div").indexOf("$");
      let indexCents = $.html("span:contains($) > div:eq(0) > div").indexOf(".") + 3;
      let price = $.html("span:contains($) > div:eq(0) > div").substring(index$, indexCents);
      if (stock && company && price) {
        //if statement runs if stockList array in server is greater than 0, should check if null as well
        if (stockList.length > 0) {
          var n;
          for (let i = 0; i < stockList.length; i++) {
            //checking if stock exists in array meaning it's been searched before
            n = stockList[i].stock.includes(stock);
            if (n === true) {
              //stock exists in array
              break;
            } else {
              //stock does not exist in array
              console.log("doesn't exist");
            }
          }

          if (n === true) {
            console.log("exists");
            let repeatStock = "This stock already exists";
            io.emit(repeatStock);
          } else {
            stockList.push({
              searchUrl: searchUrl,
              company: company,
              stock: stock,
              price: price,
            });
            let stockData = { company: company, stock: stock, price: price };
            io.emit("search", stockData);
          }
          //if array length is greater than 0 add new stock to array and send data to the browser
        } else {
          stockList.push({
            searchUrl: searchUrl,
            company: company,
            stock: stock,
            price: price,
          });
          let stockData = { company: company, stock: stock, price: price };
          io.emit("search", stockData);
        }
      } else {
        console.log("User Search Error");
        io.emit("error", req.body.name, req.body.stock);
      }
    })

  .catch (error => {
    console.error(error);
  })
  res.sendStatus(200);
});

setInterval(async () => {
  let array = [...stockList];
  for (let i = 0; i < array.length; i++) {
    await axios.get(array[i].searchUrl)
    .then(res => {
      const $ = cheerio.load(res.data);
      let index$ = $.html("span:contains($) > div:eq(0) > div").indexOf("$");
      let indexCents = $.html("span:contains($) > div:eq(0) > div").indexOf(".") + 3;
      array[i].price = $.html("span:contains($) > div:eq(0) > div").substring(index$, indexCents);
      console.log(array[i].price);
    });
  }
  io.emit("refresh", array);
}, 5000);

io.on("connection", (socket) => {
  //sends existing stocks in array to the browser
  io.emit("sendList", stockList);
});