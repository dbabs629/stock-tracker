// 1. Fix refresh separates same company stocks
// 2. Update stock prices every 5
// 3. Delete button

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http").Server(app);
var io = require("socket.io")(http);
const rp = require("request-promise");
const cheerio = require("cheerio");
const port = process.env.PORT || 5000;
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");

//Serves static index.html file to the browser
app.use(express.static(__dirname));
//app will parse the res.body into JSON
app.use(bodyParser.json());
//browser data is urlencoded and must be parsed accordingly
app.use(bodyParser.urlencoded({ extended: false }));

//stores the user's search data
let stockList = [];

/*
  Due to the webpage being dynamic, classes are changed frequently by Google but I found that the overall structure of the DOM stays the same.
  I couldn't rely on finding the elements with the class name I wanted to pull data from since they changed so frequently and their names were abstract.
  I had to traverse the DOM to find each element's relative position to the <main> tag. Then I found each parent <div> tag until I got to the element I wanted to retrieve and it's text.
*/

app.post("/", (req, res) => {
  let url =
    "https://www.google.com/finance/quote/" +
    req.body.name +
    ":" +
    req.body.stock;
  let searchUrl =
    "https://www.google.com/finance/quote/" +
    req.body.name +
    ":" +
    req.body.stock;
  try {
    rp(url)
      .then((html) => {
        const $ = cheerio.load(html);
        let stock = `${req.body.name} : ${req.body.stock}`;
        let company = $("main > div:eq(0)", html)
          .children("div:eq(1)")
          .text(); /* NAVIGATE TO GET THE MAIN DIV, SUBSEQUENT DIVS name should not change */
        let price = $("main > div:eq(1)", html)
          .find("span > div:eq(0)")
          .children("div")
          .text();

        //if all data are true
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
      .catch(function (err) {
        console.log(err);
      });
  } catch {
    console.log(err.message);
  }

  res.sendStatus(200);
});

setInterval(() => {
  let array = [...stockList];
  for (let i = 0; i < array.length; i++) {
    rp(array[i].searchUrl).then((html) => {
      const $ = cheerio.load(html);
      array[i].price = $("main > div:eq(1)", html)
        .find("span > div:eq(0)")
        .children("div")
        .text();
      console.log(array[i].price);
    });
  }
  io.emit("refresh", array);
}, 5000);

io.on("connection", (socket) => {
  //sends existing stocks in array to the browser
  io.emit("sendList", stockList);
});

var server = http.listen(3000, () => {
  console.log("server is listening on port", server.address().port);
});
