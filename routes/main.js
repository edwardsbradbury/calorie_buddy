module.exports = function(app)
{
    
    // Use the Express validator module
    const { check, validationResult } = require('express-validator');
    // Create instance of bcrypt password hashing/checking module to use in register and login routes
    const bcrypt = require('bcrypt');
    const saltRounds = 10;

    // Regular expressions for checking input validity
    const nameRegex = /^[a-zA-Z]+(-[a-zA-Z]+)*$/;
    const usernameRegex = /^[a-zA-Z0-9_-]*$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,20}$/;
    const twoDecPlaces = /^(([0-9]{1,4})(\.[0-9]{1,2})?)$/;
    const tenDigit = /^[0-9]{0,10}$/;
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Function to generate HTML head to send in post requests, so I can link CSS stylesheet

    function formatHead(pageTitle) {
        return `<head><title>Calorie Buddy: ${pageTitle}</title><link rel='stylesheet' type='text/css' href='styles.css'></head><body><div class='main-content'>${navigation()}`;
    };

    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Function to generate navigation bar (passed to EJS page templates for rendering; minimising code duplication)

    function navigation() {

    	return "<div class='navigation'>" +
            "<h1>Calorie Buddy</h1>" +
	    "<a href='/'>Home</a>" +
            "<a href='/register'>Register</a>" +
            "<a href='/login'>Login</a>" +
            "<a href='/logout'>Logout</a>" +
            "<a href='/about'>About</a>" +
            "<a href='/search'>Search</a>" +
            "<a href='/addfood'>Add food</a>" +
            "<a href='/updatefood'>Update food</a>" +
            "<a href='/list'>List foods</a>" +
            "</div>";

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Function to create HTML tables for displaying food item data

    function foodItemTable (name, values_per, unit, calories, carbs, fat, protein, salt, sugar) {

	return "<div class='food-item'>" +
		"<table>" +
		`<caption>${name}</caption>`+
		"<tr><th>Typical nutrition per</th><th>Calories</th><th>Carbohydrates</th><th>Fat</th><th>Protein</th><th>Salt</th><th>Sugar</th></tr>" +
		`<tr><td>${values_per} ${unit}</td><td>${calories}</td><td>${carbs}</td><td>${fat}</td><td>${protein}</td><td>${salt}</td><td>${sugar}</td></tr>` +
		"</table>" +
		"</div>";

    }


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Restrict users who aren't logged in from seeing certain pages of the app
    
    const notLoggedIn = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login');
        } else { next(); }
    };


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Also restrict users who are logged in from accessing the login & register pages

    const alreadyLoggedIn = (req, res, next) => {
	if (req.session.userId) {
	    res.redirect('./');
	} else { next(); }
    };


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Homepage routing
    
    app.get('/', function(req, res) {
    	res.render('index.ejs', {navigation: navigation(), messages: null});
    });


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Registration page routing
    
    app.get('/register', alreadyLoggedIn, function(req, res) {
        const saltRounds = 10;
        res.render('register.ejs', {navigation: navigation(), errorMessages: null, first: null, last: null, email: null, username: null, password: null});
    });


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Registration form handling
    
    app.post('/registered', alreadyLoggedIn, [check('first').matches(nameRegex).withMessage('chars').isLength({min: 2, max: 32}).withMessage('length')], [check('last').matches(nameRegex).withMessage('chars').isLength({min: 2, max: 32}).withMessage('length')], [check('username').matches(usernameRegex).withMessage('chars').isLength({min: 8, max: 25}).withMessage('length')], [check('email').isEmail()], [check('password').matches(passwordRegex, 'i')], function(req, res) {
	
	// Whether the Express validator raised any errors (invalid email or password too short/long) determines whether the form data is posted to database or not
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		
		// Create list of error prompt messages to display on the registration form page
		let errorPrompts = '<div class="errors"><p>Invalid registration data:</p><ul>';
		for (const anError of errors.errors) {
			errorPrompts += '<li>';
			if (anError.param === 'first') {
				if (anError.msg === 'chars') {
                                        errorPrompts += 'First name can only contain letters and hyphens';
                                } else if (anError.msg === 'length') {
                                        errorPrompts += 'First name must be 2-32 characters long';
                                }
			} else if (anError.param === 'last') {
				if (anError.msg === 'chars') {
                                        errorPrompts += 'Last name can only contain letters and hyphens';
                                } else if (anError.msg === 'length') {
                                        errorPrompts += 'Last name must be 2-32 characters long';
                                }
			} else if (anError.param === 'username') {
				if (anError.msg === 'chars') {
                                        errorPrompts += 'Username can only contain letters, digits, hyphens and underscores';
                                } else if (anError.msg === 'length') {
                                        errorPrompts += 'Username must be 8-25 characters long';
                                }
			} else if (anError.param === 'email') {
				errorPrompts += 'Invalid email address'
			} else if (anError.param === 'password') {
				errorPrompts += 'Password must be 8-20 characters long, with at least 1 uppercase letter, 1 lowercase letter and 1 number';
			}
			errorPrompts += '</li>';
		}
		errorPrompts += '</ul></div>';
		// Re-render the form with the error prompt messages displayed to the user
		res.render('register.ejs', {navigation: navigation(), errorMessages: errorPrompts, first: req.body.first, last: req.body.last, email: req.body.email, username: req.body.username, password: req.body.password})
	
	} else {
		
		const checkAlreadyExists = `SELECT * FROM users WHERE username = '${req.sanitize(req.body.username)}' OR email = '${req.sanitize(req.body.email)}';`;
		db.query(checkAlreadyExists, (error, result) => {
			if (error) {
				return console.log(error);
			} else if (result.length > 0) {
				const errorPrompt = `<div class='errors'><p>There is already an account in our system with either the username '${req.body.username}' or email address '${req.body.email}'.<br>Login to your account instead of re-registering</p></div>`;
				res.render('login.ejs', {navigation: navigation(), errorMessages: errorPrompt, username: null});
			} else {
				// Store the plain text password ready to hash
                		const plainPassword = req.body.password;
				// Create SQL query string
                		let sqlQuery = 'INSERT INTO users (first, last, email, username, password) VALUES (?, ?, ?, ?, ?);';
                		bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
					if (err) throw err;
					else {
						const first = req.sanitize(req.body.first);
                                		const last = req.sanitize(req.body.last);
                                		const email = req.sanitize(req.body.email);
                                		const username = req.sanitize(req.body.username);
                                		const newRecord = [first, last, email, username, hashedPassword];
						db.query(sqlQuery, newRecord, (error, result) => {
							if (err) {
                                                		return console.log(error)
                                        		} else {
                                                		req.session.userId = username;
								const success = `<h3>Welcome, ${first} ${last}, you have been registered with the username ${username} and you are now logged into your account.</h3>`;
								res.render('index.ejs', {navigation: navigation(), messages: success});
							}
						})
					}
				})
			}
		})
	}

    });


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Login page routing
    
    app.get('/login', function(req, res) {
        res.render('login.ejs', {navigation: navigation(), errorMessages: null, username: null});
    });


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Login form handling
    
    app.post('/verify', [check('username').matches(usernameRegex)], function(req, res) {

	// Whether the Express validator raised an error (invalid username) determines whether or not the database is queried
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
		const errorPrompt = `<div class='errors'><h3>'${req.body.username}' is not a valid username</h3></div>`;
		res.render('login.ejs', {navigation: navigation(), errorMessages: errorPrompt, username: null});
	} else {

		// Store the username. Sanitize it before using it in an SQL query (to avoid SQL injections from user input)
        	const username = req.sanitize(req.body.username);
        	// Store the plain text password for hashing (to check against the hashed password recorded in database)
        	const plainPassword = req.sanitize(req.body.password);

		// If a credential is missing, re-render the login form with error prompts displayed to user
        	if (username === undefined || plainPassword === undefined) {
                	let errorPrompts = '<div class="errors"><p>Missing credentials:</p><ul>';
                	if (username === undefined) {
                        	errorPrompts += '<li>You did not enter a username</li>';
                	}	
                	if (plainPassword === undefined) {
                        	errorPrompts += '<li>You did not enter a password</li>';
                	}
                	errorPrompts += '</ul></div>';
                	res.render('login.ejs', {navigation: navigation(), errorMessages: errorPrompts, username: null});
        	} else {
		
			// Create SQL query string
                	const sqlQuery = `SELECT username, password FROM users WHERE username='${username}';`;

                	// Check for a user record in database with matching username
                	db.query(sqlQuery, (err, result) => {
				if (err) {
                                	console.log(err)
                        	} else if (result.length < 1) {
                                	const errorPrompt = `<div class="errors"><h3>No account found with the username: ${username}</h3></div>`;
                                	res.render('login.ejs', {navigation: navigation(), errorMessages: errorPrompt, username: null});
                        	} else {
					// Check the password on record matches the input password
                                	const passwordFromRecord = result[0].password;
                                	bcrypt.compare(plainPassword, passwordFromRecord, function (error, passResult) {

						if (error) console.log(error);
                                        	else if (passResult === false) {
                                                	const errorPrompt = `<div class="errors"><h3>Invalid password for: ${username}</h3></div>`;
                                                	res.render('login.ejs', {navigation: navigation(), errorMessages: errorPrompt, username: username});
                                        	} else {
                                                	req.session.userId = username;
                                                	const success = `<div class='errors'><h3>Welcome, ${username}, you are now logged in</h3></div>`;
                                                	res.render('index.ejs', {navigation: navigation(), messages: success});
                                        	}
					
					})
				}
			})
		}
	}
	
    });  


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Logout routing
    
    app.get('/logout', notLoggedIn, (req, res) => {
        req.session.destroy(err => {
                if (err) {
                        return res.redirect('./');
                }
		const conf = '<h3>You have been logged out from your account</h3>';
		res.render('index.ejs', {navigation: navigation(), messages: conf});
        })
    });


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // About page routing
    
    app.get('/about', function(req, res) {
        res.render('about.ejs', {navigation: navigation()});
    });    

    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Search page routing
    
    app.get('/search', function(req, res) {
        res.render('search.ejs', {navigation: navigation(), messages: null, searchMode: true, updateMode: false});
    });   

    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Process the search query
    
    app.get('/search-results', [check('keyword').matches(/^[a-z0-9 ]+$/i)], function(req, res) {

	const errors = validationResult(req);
        if (!errors.isEmpty()) {
		// Create error prompt message to display on the search form page
		const errorPrompt = `<div class="errors"><h3>Search keyword can only contain letters, numbers and spaces</h3></div>`;
		res.render('search.ejs', {navigation: navigation(), messages: errorPrompt, searchMode: true, updateMode: false});
	} else {
	
        	// Store the search keyword
        	const keyword = req.sanitize(req.query.keyword);
		// Generate SQL query
		query = `SELECT * FROM food_item WHERE name LIKE '%${keyword}%';`;
		// Search the database
		db.query(query, (err, result) => {
			if (err){
                		res.redirect('./search');
                	} else if (result.length < 1){
				const noResults = `<div class="errors"><h3>You searched for: ${keyword}. Nothing was found.</h3></div>`;
				res.render('search.ejs', {navigation: navigation(), messages: noResults, searchMode: true, updateMode: false});	
                	} else {
				let resultTables = '';
                        	for (const item of result) {
					resultTables += foodItemTable(item.name, item.values_per, item.unit, item.calories, item.carbs, item.fat, item.protein, item.salt, item.sugar);
                        	}
                        	res.send(`${formatHead('Search results')}<h2>You searched for: ${keyword}. The result of your search is:</h2>${resultTables}</div></body>`);
			}	
		})
	}
    });      

    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Routing for the add food form
    
    app.get('/addfood', notLoggedIn, function(req, res) {
        res.render('addfood.ejs', {navigation: navigation(), messages: null, updateMode: false, name: null, values_per: null, unit: null, calories: null, carbs: null, fat: null, protein: null, salt: null, sugar: null, recipeMode: false});
    });    

    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Add food form handling
    
    app.post('/foodadded', notLoggedIn, [check('name').matches(/^[a-z0-9 ]+$/i).withMessage('chars').isLength({min: 2, max: 30}).withMessage('length')], [check('values_per').matches(tenDigit)], [check('unit').isAlpha().isLength({min: 1, max: 15})], [check('calories').matches(twoDecPlaces)], [check('carbs').matches(twoDecPlaces)], [check('fat').matches(twoDecPlaces)], [check('protein').matches(twoDecPlaces)], [check('salt').matches(twoDecPlaces)], [check('sugar').matches(twoDecPlaces)], function(req, res) {
	
	// Whether the Express validator raised any errors determines whether the form data is posted to database or not
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
		// Create list of error prompt messages to display on the registration form page
                let errorPrompts = '<div class="errors"><p>Invalid input:</p><ul>';
                for (const anError of errors.errors) {
			errorPrompts += '<li>';
			if (anError.param === 'name') {
				if (anError.msg === 'chars') {
					errorPrompts += `Invalid name: '${req.body.name}'. Item name can only contain letters, numbers and spaces`;
				} else if (anError.msg === 'length') {
					errorPrompts += `Invalid name: '${req.body.name}'. Item name must be 2-30 characters long and can only contain letters, numbers and spaces`;
				}
			} else if (anError.param === 'values_per') {
				errorPrompts += `Invalid input: '${req.body.values_per}': values per should be a whole number, greater than 0, representing the weight or volume that typical nutritional values are measured per`;
			} else if (anError.param === 'unit') {
				errorPrompts += `Invalid unit: '${req.body.unit}'. Unit values per should be 1-15 alphabetic characters representing a unit of volume or weight, e.g. litres/lb/oz/g/kg etc`;
			} else if (anError.param === 'calories') {
				errorPrompts += `Invalid calories: '${req.body.calories}'. Calories must be a numeric value greater than 0, with a maximum of 2 decimal places`;
			} else if (anError.param === 'carbs') {
				errorPrompts += `Invalid carbohydrates: '${req.body.carbs}'. Carbohydrates must be a numeric value greater than 0, with a maximum of 2 decimal places`;
			} else if (anError.param === 'fat') {
				errorPrompts += `Invalid fat: '${req.body.fat}'. Fat must be a numeric value greater than 0, with a maximum of 2 decimal places`;
			} else if (anError.param === 'protein') {
				errorPrompts += `Invalid protein: '${req.body.protein}'. Protein must be a numeric value greater than 0, with a maximum of 2 decimal places`;
			} else if (anError.param === 'salt') {
				errorPrompts += `Invalid salt: '${req.body.salt}'. Salt must be a numeric value greater than 0, with a maximum of 2 decimal places`;
			} else if (anError.param === 'sugar') {
				errorPrompts += `Invalid sugar: '${req.body.sugar}'. Sugar must be a numeric value greater than 0, with a maximum of 2 decimal places`;
			}
			errorPrompts += '</li>';
		}
		errorPrompts += '</ul></div>';
		if (req.body.recipeMode === 'false') {
			res.render('addfood.ejs', {navigation: navigation(), messages: errorPrompts, updateMode: false, name: req.body.name, values_per: req.body.values_per, unit: req.body.unit, calories: req.body.calories, carbs: req.body.carbs, fat: req.body.fat, protein: req.body.protein, salt: req.body.salt, sugar: req.body.sugar, recipeMode: false});
		} else {
			res.render('addfood.ejs', {navigation: navigation(), messages: errorPrompts, updateMode: false, name: req.body.name, values_per: req.body.values_per, unit: req.body.unit, calories: req.body.calories, carbs: req.body.carbs, fat: req.body.fat, protein: req.body.protein, salt: req.body.salt, sugar: req.body.sugar, recipeMode: true});
		}	
	} else {

		// To avoid duplication, check whether there's already an item of food in the database with the same name	
		const checkAlreadyExists = `SELECT * FROM food_item WHERE name = '${req.sanitize(req.body.name)}';`;
		db.query(checkAlreadyExists, (error, result) => {
                        if (error) {
                                return console.log(error);
                        } else if (result.length > 0) {
                                const errorPrompt = `<div class='errors'><p>There is already a '${req.body.name}' food item in the database.<br>Enter a different name or <a href='/updatefood'>update</a> the nutritional information for '${req.body.name}'.</p></div>`;
				if (!req.body.recipeMode) {
					res.render('addfood.ejs', {navigation: navigation(), messages: errorPrompt, updateMode: false, name: req.body.name, values_per: req.body.values_per, unit: req.body.unit, calories: req.body.calories, carbs: req.body.carbs, fat: req.body.fat, protein: req.body.protein, salt: req.body.salt, sugar: req.body.sugar, recipeMode: false});
				} else {
					res.render('addfood.ejs', {navigation: navigation(), messages: errorPrompt, updateMode: false, name: req.body.name, values_per: req.body.values_per, unit: req.body.unit, calories: req.body.calories, carbs: req.body.carbs, fat: req.body.fat, protein: req.body.protein, salt: req.body.salt, sugar: req.body.sugar, recipeMode: true});
				}
                        } else {
				// Create SQL query string
                                let sqlQuery = 'INSERT INTO food_item (name, values_per, unit, calories, carbs, fat, protein, salt, sugar, input_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
				const name = req.sanitize(req.body.name);
				const values_per = req.sanitize(req.body.values_per);
				const unit = req.sanitize(req.body.unit);
				const calories = req.sanitize(req.body.calories);
				const carbs = req.sanitize(req.body.carbs);
				const fat = req.sanitize(req.body.fat);
				const protein = req.sanitize(req.body.protein);
				const salt = req.sanitize(req.body.salt);
				const sugar = req.sanitize(req.body.sugar);
				const input_by = req.session.userId;
				const newRecord = [name, values_per, unit, calories, carbs, fat, protein, salt, sugar, input_by];

				db.query(sqlQuery, newRecord, (someErr, outcome) => {
					if (someErr) {
						return console.log(someErr);
					} else {
						res.redirect('./list');
					}
				})
			}
		})
	}

    });    
    

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    
    app.get('/updatefood', notLoggedIn, function(req, res) {
        res.render('search.ejs', {navigation: navigation(), messages: null, searchMode: false, updateMode: true});
    });    
    

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 

    app.get('/search-update', notLoggedIn, [check('keyword').matches(/^[a-z0-9 ]+$/i)], function(req, res) {
	
	const errors = validationResult(req);
        if (!errors.isEmpty()) {
                // Create error prompt message to display on the search form page
                const errorPrompt = `<div class="errors"><h3>Search keyword can only contain letters, numbers and spaces</h3></div>`;
                res.render('search.ejs', {navigation: navigation(), messages: errorPrompt, searchMode: false, updateMode: true});
        } else {

                // Store the search keyword
                const keyword = req.sanitize(req.query.keyword);
                // Generate SQL query
                query = `SELECT * FROM food_item WHERE name = '${keyword}';`;
                // Search the database
                db.query(query, (err, result) => {
                        if (err){
                                res.redirect('./search');
                        } else if (result.length < 1){
                                const errorPrompt = `<div class="errors"><h3>No food item '${keyword}' in the database to update</h3></div>`;
				res.render('search.ejs', {navigation: navigation(), messages: errorPrompt, searchMode: false, updateMode: true});
                        } else {
                                // Store the record data from db
				const item = result[0];
				// Check whether the user trying to edit the item is the user who originally entered it
                		if (item.input_by === req.session.userId) {
					const resultTable = foodItemTable(item.name, item.values_per, item.unit, item.calories, item.carbs, item.fat, item.protein, item.salt, item.sugar);
                                	res.render('addfood.ejs', {navigation: navigation(), messages: resultTable, updateMode: true, origName: item.name, name: item.name, values_per: null, unit: null, calories: null, carbs: null, fat: null, protein: null, salt: null, sugar: null, recipeMode: false});
				} else {
					const errorPrompt = `<div class='errors'><h3>Only the user ${item.input_by} can update ${keyword}</h3></div>`;
					res.render('search.ejs', {navigation: navigation(), messages: errorPrompt, searchMode: false, updateMode: true});
				}

			}
                })
        }

    })

    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //

    app.post('/foodupdated', notLoggedIn, [check('name').matches(/^[a-z0-9 ]+$/i).withMessage('chars').isLength({min: 2, max: 30}).withMessage('length')], [check('values_per').matches(tenDigit)], [check('unit').isAlpha().isLength({min: 1, max: 15})], [check('calories').matches(twoDecPlaces)], [check('carbs').matches(twoDecPlaces)], [check('fat').matches(twoDecPlaces)], [check('protein').matches(twoDecPlaces)], [check('salt').matches(twoDecPlaces)], [check('sugar').matches(twoDecPlaces)], function(req, res) {

	// Whether the Express validator raised any errors determines whether the form data is posted to database or not
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
		
		// Create list of error prompt messages to display on the registration form page
                let errorPrompts = '<div class="errors"><p>Invalid input:</p><ul>';
                for (const anError of errors.errors) {
			errorPrompts += '<li>';
                        if (anError.param === 'name') {
				if (anError.msg === 'chars') {
                                        errorPrompts += `Invalid name: '${req.body.name}'. Item name can only contain letters, numbers and spaces`;
                                } else if (anError.msg === 'length') {
                                        errorPrompts += `Invalid name: '${req.body.name}'. Item name must be 2-30 characters long and can only contain letters, numbers and spaces`;
                                }
			} else if (anError.param === 'values_per') {
                                errorPrompts += `Invalid input: '${req.body.values_per}'. Values per should be a whole number, greater than 0, representing the weight or volume that typical nutritional values are measured per`;
                        } else if (anError.param === 'unit') {
                                errorPrompts += `Invalid unit: '${req.body.unit}'. Unit values per should be 1-15 alphabetic characters representing a unit of volume or weight, e.g. litres/lb/oz/g/kg etc`;
                        } else if (anError.param === 'calories') {
                                errorPrompts += `Invalid calories: '${req.body.calories}'. Calories must be a numeric value greater than 0, with a maximum of 2 decimal places`;
                        } else if (anError.param === 'carbs') {
                                errorPrompts += `Invalid carbohydrates: '${req.body.carbs}'. Carbohydrates must be a numeric value greater than 0, with a maximum of 2 decimal places`;
                        } else if (anError.param === 'fat') {
                                errorPrompts += `Invalid fat: '${req.body.fat}'. Fat must be a numeric value greater than 0, with a maximum of 2 decimal places`;
                        } else if (anError.param === 'protein') {
                                errorPrompts += `Invalid protein: '${req.body.protein}'. Protein must be a numeric value greater than 0, with a maximum of 2 decimal places`;
                        } else if (anError.param === 'salt') {
                                errorPrompts += `Invalid salt: '${req.body.salt}'. Salt must be a numeric value greater than 0, with a maximum of 2 decimal places`;
                        } else if (anError.param === 'sugar') {
                                errorPrompts += `Invalid sugar: '${req.body.sugar}'. Sugar must be a numeric value greater than 0, with a maximum of 2 decimal places`;
                        }
                        errorPrompts += '</li>';
		}
		errorPrompts += '</ul></div>';
                res.render('addfood.ejs', {navigation: navigation(), messages: errorPrompts, updateMode: true, origName: req.body.origName, name: req.body.name, values_per: req.body.values_per, unit: req.body.unit, calories: req.body.calories, carbs: req.body.carbs, fat: req.body.fat, protein: req.body.protein, salt: req.body.salt, sugar: req.body.sugar, recipeMode: false});

        } else {

		// To avoid duplication, check whether there's already an item of food in the database with the same name       
                const checkAlreadyExists = `SELECT * FROM food_item WHERE name = '${req.sanitize(req.body.name)}';`;
                db.query(checkAlreadyExists, (error, result) => {
			if (error) {
                                return console.log(error);
                        } else if (result.length > 0) {
				const errorPrompt = `<div class='errors'><p>There is already a '${req.body.name}' food item in the database.<br>Enter a different name or <a href='/updatefood'>update</a> the nutritional information for '${req.body.name}'.</p></div>`;
				res.render('addfood.ejs', {navigation: navigation(), messages: errorPrompt, updateMode: true, origName: req.body.origName, name: req.body.name, values_per: req.body.values_per, unit: req.body.unit, calories: req.body.calories, carbs: req.body.carbs, fat: req.body.fat, protein: req.body.protein, salt: req.body.salt, sugar: req.body.sugar, recipeMode: false});
			} else {
				// Sanitize input data
                		const origName = req.sanitize(req.body.origName);
                		const name = req.sanitize(req.body.name);
                		const values_per = req.sanitize(req.body.values_per);
                		const unit = req.sanitize(req.body.unit);
                		const calories = req.sanitize(req.body.calories);
                		const carbs = req.sanitize(req.body.carbs);
                		const fat = req.sanitize(req.body.fat);
                		const protein = req.sanitize(req.body.protein);
                		const salt = req.sanitize(req.body.salt);
                		const sugar = req.sanitize(req.body.sugar);

				// Prepare SQL query to update the record in database
                		const sqlQuery = `UPDATE food_item SET name='${name}', values_per='${values_per}', unit='${unit}', calories='${calories}', carbs='${carbs}', fat='${fat}', protein='${protein}', salt='${salt}', sugar='${sugar}' WHERE name='${origName}';`;

				db.query(sqlQuery, (someErr, outcome) => {
                        		if (someErr) {
                                		return console.log(someErr);
                        		} else {
						res.redirect('./list');
                        		}
                		})
			}
		})

	}

    });

	
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Route to delete a food_item record from the database

    app.post('/deletefood', notLoggedIn, function(req, res) {

	const itemToDelete = req.sanitize(req.body.name);
	const sqlQuery = `DELETE FROM food_item WHERE name = '${itemToDelete}'`;

	db.query(sqlQuery, (error, result) => {
		if (error) {
			return console.log(error);
		} else {
			res.redirect('./list');
		}
	})
    });

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Route to list all food information currently in the database
    
    app.get('/list', function(req, res) {
        
	const sqlQuery = 'SELECT * FROM food_item;';

	db.query(sqlQuery, (error, result) => {
		if (error) {
			return console.log(error);
		} else if (result.length > 0)  {
			res.render('list.ejs', {navigation: navigation(), foods: result, message: null});
		} else {
			const message = '<div class="errors"><h3>No ingredients, recipes or meals in the database to show you!</h3></div>';
			res.render('list.ejs', {navigation: navigation(), foods: null, message: message});
		}
	})

    });

	
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.get('/calculatenutrition', function (req, res) {

	const ingredients = Object.keys(req.query);

	if (!(ingredients.length > 0)) {
		res.redirect('./list');
	} else {

		let values_per = 0;
        	let unit = 'g';
        	let calories = 0;
        	let carbs = 0;
        	let fat = 0;
        	let protein = 0;
        	let salt = 0;
        	let sugar = 0;	
		
		let query = 'SELECT * FROM food_item WHERE ';

        	for (let i = 0; i < ingredients.length; i++) {
                	if (i !== (ingredients.length - 1)) {
                        	query += `name='${ingredients[i]}' OR `;
                	} else {
                        	query += `name='${ingredients[i]}';`;
                	}
        	}

		db.query(query, (error, result) => {
			if (error) {
                        	return console.log(error);
                	} else {
				for (let anIngredient of result) {
                                	values_per += anIngredient.values_per;
					calories += anIngredient.calories;
                                	carbs += anIngredient.carbs;
                                	fat += anIngredient.fat;
                                	protein += anIngredient.protein;
                                	salt += anIngredient.salt;
                                	sugar += anIngredient.sugar;
                        	}
				values_per = Math.round(values_per / ingredients.length);
				res.render('recipe.ejs', {navigation: navigation(), ingredients: ingredients, values_per: values_per, unit: unit, calories: +calories.toFixed(2), carbs: +carbs.toFixed(2), fat: +fat.toFixed(2), protein: +protein.toFixed(2), salt: +salt.toFixed(2), sugar: +sugar.toFixed(2), message: null});	
			}
		})

	}

    })

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.get('/api', function (req, res) {

	let query = 'SELECT * FROM food_item';
	db.query(query, (error, result) => {
                if (error) {
                        return console.log(error);
                } else {
                        res.json(result);
                }
        })

    })

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}

