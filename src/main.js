var socket = io("https://stock-tracker-nodejs.herokuapp.com/");

var stockExchange;

let listContainer = $(".stock-list");

socket.on("connect", () => console.log("Socket Connected"));

let checkList = ([...stockList]) => {
  let array = [];

  stockList.map((x) => {
    let found = array.includes(x.company);
    if (found) {
      $(`.card .card-header:contains('${x.company}')`)
        .parent("li")
        .append(
          `<p class="card-text card-stock"> ${x.stock} </p> <p class="card-text card-price"> ${x.price} </p>`
        );
    } else {
      array.push(x.company);
      listContainer.append(
        `<li class="card card-body list-group-item row"> <p class="card-header"> ${x.company} </p> <p class="card-text card-stock"> ${x.stock} </p> <p class="card-text card-price"> ${x.price} </p> </li>`
      );
    }
  });
};

let addStock = (data) => {
  let companyList = [...$(".stock-list .card-header")];
  let t = false;
  if (listContainer[0].childNodes.length < 1) {
    listContainer.append(
      `<li class="card card-body list-group-item row"> <p class="card-header"> ${data.company} </p> <p class="card-text card-stock"> ${data.stock} </p> <p class="card-text card-price"> ${data.price} </p> </li>`
    );
  } else {
    for (let i = 0; i < companyList.length; i++) {
      console.log("For Loop index: ", i);
      let n = companyList[i].innerText;
      if (n === data.company) {
        console.log(
          n,
          "match",
          companyList[i].innerText,
          "match",
          data.company
        );
        companyList[
          i
        ].parentElement.innerHTML += `<p class="card-text card-stock"> ${data.stock} </p> <p class="card-text card-price"> ${data.price} </p>`;
        t = true;
      } else {
        console.log("no name exists");
      }
    }
    if (!t) {
      listContainer.append(
        `<li class="card card-body list-group-item row"> <p class="card-header"> ${data.company} </p> <p class="card-text card-stock"> ${data.stock} </p> <p class="card-text card-price"> ${data.price} </p> </li>`
      );
    }
  }
};

let refresh = (update) => {
  let listStocks = [...$(".card-stock")];
  let listPrices = [...$(".card-price")];
  let updatePrice = [];
  let updateStock = [];

  for (let i = 0; i < update.length; i++) {
    updateStock.push(update[i].stock);
    updatePrice.push(update[i].price);
  }

  listStocks.map((x, i) => {
    if (x.innerText === updateStock[i]) {
      listPrices.map((y, i) => {
        let currentPrice = y.innerText.substring(1).replace(",", "");
        let newPrice = updatePrice[i].substring(1).replace(",", "");
        let change = Number(newPrice - currentPrice);

        if (currentPrice < newPrice) {
          console.log("green", change);
          // listPrices[i].innerText = updatePrice[i], change;
          listPrices[i].style.color = "green";
        } else if ((currentPrice = newPrice)) {
          // listPrices[i].innerText = updatePrice[i], change;

          console.log(listPrices[i].innerText);
        } else if (currentPrice > newPrice) {
          // listPrices[i].innerText = updatePrice[i], change;
          console.log("red", change);
          // listPrices[i].innerText +=  ` ${change}`;
          listPrices[i].style.color = "red";
          // console.log(listPrices[i].innerText);
        }
        y.innerText = updatePrice[i];
      });
    }
  });
};

$(".dropdown-item").click((e) => {
  stockExchange = e.target.textContent;
  $("#dropdownMenu")[0].innerHTML = e.target.textContent;
});

$("#btn-server").click(() => {
  if (!stockExchange) {
    alert("Please select a stock exchange");
  } else {
    let search = {
      name: $("#search-bar")[0].value.toUpperCase().replace(/\s/g, ""),
      stock: stockExchange,
    };
    console.log("Search Clicked");
    searchStock(search);
  }
});

let searchError = (errStock, errStockExchange) => {
  alert(
    `The stock symbol ${errStock} does not belong to ${errStockExchange} or it doesn't exist.`
  );
};

let searchStock = (search) => $.post("http://localhost:3000", search);

let test = (data) => console.log(data)


socket.on("test", test);

socket.on("search", addStock);

socket.on("sendList", checkList);

socket.on("refresh", refresh);

socket.on("error", searchError);
