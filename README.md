# stock-response
This application allows users to input a company's stock symbol and it's index which will scrape Google's finance quote webpage (https://www.google.com/finance/ + company symbol : market index) to collect the latest price and new's. The user can save stocks they wish to track into a database to be viewed anytime they access the website. They will also have an option to have an email sent to them when a stock price changes or for the latest news item.



Problem #1:
I used Cheerio to request a HTML Document and selected elements based on class. However, the webpage I retrieved was dynamic and the classes changed often based on the data. 

Solution #1: 
I had to find the parents of the elements I wanted to select and traverse the DOM that way.



Problem #2:
Check if the stock already exists in the array named "searches" on the server.

Solution #2:
First I checked if the searches array on the server is empty and if so, it pushes the results to the array, and if it isn't empty it loops through the array's content.
I used the .includes() method on the searches array ie: searches[i].stock.includes( stock ),  and loop through it to see if the array already contained the stock that the user searched for.
I used an if statement which checked if the includes method returned true or false.
If true the server emits a message to the client and stops the app from pushing the data to the searches array on the server.
If false the server pushes the new object and it's properties to the searches array and emits the contents of the array to the client to be displayed to the user's screen.
*Later I will adjust this solution to allow user's to save/delete the stocks that they search for and store them on a Mongo database.



Problem #3
Check if the stock already exists and is displayed on the client

Solution #3
I copied my solution #2 and adjusted the if statement so that it checks the searches-list unordered list for elements that contain the same company stock symbol.
I used the includes method again and an if statement which displays each new stock search.


Problem #4
User refreshes the page, display stocks that were already searched.

Solution#4
I emitted the data from the server which contained the searched stocks. Then used the spread operator to map it an array of objects that had properties. I then created an empty array, mapped over each object.company in the array that contained the data. I then pushed each object.company to the empty array and used .includes method to check if the new array already contained that company name. I then used an if statement; if the company's name was already included in the new array (true), it appended the existing company's new stock to it's li element in the ul, or it ran an else statement and appended all of the object's properties to a new li element in the ul. The result is that when a user searches for the same company stock from a different stock market the browser will display the stock symbols, indexes and prices together without duplicating the Company's header, keeping each of the company's stocks together making it easier for the user to find.