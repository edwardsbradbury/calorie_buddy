// Import the Express library
var express = require('express');
// Import the Node body parser module for accessing data from the body of HTML pages
var bodyParser = require('body-parser');
// Import session manager module
var session = require('express-session');
// Import Express validator module
var validator = require ('express-validator');
// Import Express sanitizer
const expressSanitizer = require('express-sanitizer');
// Import MySQL so I can connect database to server
const mysql = require('mysql');

// Create new Express app instance
const app = express();
// Specify the port to listen for connections to
const port = 8000;

// Gives access to data from the body of HTML pages
app.use(bodyParser.urlencoded({extended:true}));

// Allows linking of CSS stylesheet in HTML page head
app.use(express.static(__dirname + '/'));
// Use the data sanitization module
app.use(expressSanitizer());

// Session manager
app.use(session({
	secret: 'somerandomstuff',
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: 600000
	}
}));

// Configure database connection
const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'Wh4t3vs!',
	database: 'calorieBuddy'
});

// Connect to database
db.connect((err) => {
	if (err) {
		throw err;
	}
	console.log('Database connected');
});
global.db = db;

// Import the routing from main.js
require('./routes/main')(app);
// Specify the directory holding the page templates to display in the browser
app.set('views', __dirname + '/views');
// Set up rendering engine
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// Event listener checking for connections to the app via browsers
app.listen(port, () => console.log(`Listening on port ${port}.`));
