R1 Home Page:
	
	views/index.ejs and '/' route in routes/main.js, line 82.

	navigation() method in main.js (line 27) returns a div containing a <h1> for the app name and also <a> links to all views.  All files in views are in EJS template format; routes pass the result from calling navigation() as props to the EJS templates. Hence, all views have consistent bar across the top with the same heading and navigation.

	Register, login and logout routes redirect to '/' route on success and the index.ejs template renders success messages passed from those server routes.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R2 About page:

	views/about.ejs and '/about' route in main.js line 269.

	Nothing here to draw your attention to. Is passed navigation() from main.js, but so are all pages. It fulfills the requirements and has very little scope to offer much else.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R3 Registration:

	Lots to draw your attention to here! File is views/register.ejs, route '/register' (line 92) renders the form and '/registered' (line 101) handles form data.

	register.ejs form:
		'/register' route passes the template navigation bar to render.
		'/registered' re-renders the form template (line 138) if any input fails validation. EJS template renders error prompts to the user so they know what input they need to correct and what will be valid. In the event of data validation failures, all originally input data is passed back to the template and input fields repopulated on rendering, so user can just correct what they need to and doesn't have to re-enter everything.

	'/registered' route:
		(Line 101) Tests first & last names against a regex which fails any string containing any characters other than letters and hyphens. Also tests length constraints.
		(line 101) Username tested against a regex which fails if username input contains characters other than letters, digits, underscores and hyphens.
		(Line 101) Email tested using node/express validator's isEmail method. Password tested against a regex which fails if it's not 8-20 characters with 1 uppercase, 1 lowercase letter and a number.
		(Lines 104-138) Create HTML and strings to display error prompts, then re-render the registration form with prompts to user and original input repopulated, ready for alterations.
		(Lines 142-148) Input has passed validation. Check there's not already a user in db with the requested username. If there is, then re-render the registration form with prompt to user and original input repopulated, ready for alterations.
		(Lines 149-169) Input is valid and username isn't a duplicate. Hash the password, sanitize all form data, connect to the database and create the new record. Then redirect user's browser to homepage with success message.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R4 Login:

	views/login.ejs, '/login' (line 183) and '/verify' (line 191)

	login.ejs:
		Template with navigation and conditional messages to user, similar to those previously described.


	'/verify' route:
		(Line 191) Uses regex (same as used in /registered) to check the username input will be a valid username per my own specification (contains only letters, numbers, hyphens and underscores).
		(Line 194-215) Creates error prompts to correct input (including if login button was clicked with nothing entered in either or both fields) and re-renders EJS template.
		(Lines 218-241) Checks users table in database for a record with matching username. If no matching record found, re-render the template with message that user not found. Else, bcrypt.compare passwords. IF matched, render index.ejs with success message. If not matched, re-render login form with wrong password message.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R5 Logout:

	No file in views. '/logout' route on line 255

	Destroy the session object. Then redirect browser to index with confirmation message.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R6 Add food:

	'/addfood' (line 320) renders views/addfood.ejs
	'/foodadded' (line 328) handles form data

	So much to draw your attention to...

	addfood.ejs:
		Navigation same as previously described.
		(Lines 14-38) Different paragraphs and headings rendered to browser, depending on which route renders the template (update food route and recipe route make use of the same template).
		(Lines 41-43) Various messages displayed, error prompts etc.
		(lines 46-50) Form data passed to different routes, depending which route rendered the template and which props were passed to it.
		(Lines 54-115) Wanted to make the input fields readonly if the user arrived at the template via /searchupdate/recipe/calculatedata/addfood and the name entered for recipe/meal was either empty or invalid. Along with the error prompt and greyed out fields, makes it obvious they must change the recipe/meal name in order to save it. So in lines 54-115 of addfood.ejs, different input fields are rendered depending which route renders the template, because I couldn't make the readonly attribute conditional.
		(Lines 120-126) Display an option to delete the record, if (and only if!) the template was rendered by the '/searchupdate' route. Hidden name input because the name input text field is in a separate form with a separate post/submit method. Hence, /deletefood also needs to know the name of which food item to delete.
		(line 124) Makes user confirm or cancel delete operation before the post request is submitted to '/deletefood'.

	'/foodadded' route:
		(Line 328) Blocks users who aren't logged in from submitting new food data to db.
			Validates item name against regex which fails if it contains any characters except letters, numbers and spaces. Length also constrained.
			The number that nutritional values are measured against tested against regex which rejects values with more than 10 digits (almost definitely unnecessarily large, but I didn't see much point constraining it when I don't know how things might be measured by people from different heritage. 10 digits seems to be the maximum for an int in MySQL server).
			Unit must only be 1-15 letters.
			Nutritional values with more than 4 digits before decimal place and/or more than 2dp and/or negative sign are rejected.
		(Lines 331-363) Creating error messages and re-rendering template. Should be a familiar pattern to you by now.
		(Lines 363-366) The 'modes' props passed back to the template control which form is displayed (e.g. readonly for recipe), where it's submitted to and whether the delete option is available.
		(Lines 371-374) Same as in registered route; check the proposed new record won't be a duplicate and if so, reject it with prompt to change name.
		(Lines 384-402) Sanitize the input data, create the new record, redirect to /list route, so user can see that their input has been added.
		(Line 385) New database record has an 'input_by' property which is their session.userId and is used to prevent anybody except the inputting user from updating the record.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R7 Search food:

	views/search.ejs
	'/search' route (line 277)
	'/search-results' (line 285)

	search.ejs:
		Conditional messages similar to other pages.
		Conditionally submit form to different routes, depending on which route rendered the form. Similar to what I did in addfood.ejs and described above.
		The same template is used to generally search for information and also to search for an item to update.

	'/search-results' route:
		(Line 285) Validator rejects search keywords containing anything other than letters, numbers and spaces.
		(Lines 287-291) Hopefully, by now, this is familiar to you and doesn't warrant explaining.
		(Lines 295-310) Sanitize the keyword. Write an SQL query string with wildcards surround keyword. Query database. If result object isn't empty, create HTML tables to format each result, then res.send a new page with the results rendered to it. If result object was empty, re-render search form with message that nothing was found.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R8 Update food:

	'/updatefood' (line 413) route renders the views/search.ejs form
	
	'/searchupdate' (line 422) route:
		Probably could have done this without having to copy and paste the whole '/search-result' route only to change very small parts...
		Works very similarly to search-result route already described above.
		Except (line 440) different error message.
		(Lines 446-448) checks whether the user trying to edit the item is the one who originally input it. If so, renders the addfood.ejs template, conditionally using the update form rather than addfood form.
		(Lines 450-451)If not, search template re-rendered with message that only original user can alter the record.
		
	When /searchupdate line 448 renders addfood.ejs (look at the addfood.ejs template):
		User is shown all the parts of the template which are conditional on updatemode: the text/headings/messages and form is posted to /foodupdated route.

	'/foodupdated' (line 464) route:
		(Line 464) Input validation is identical to as described above in section about foodadded route.
		(Lines 467-500) Should be familiar and not require explanation.
		(Line 500) updatemode = true prop controls how addfood.ejs template is rendered when refreshed with error prompts, i.e. in updatemode.
		(Lines 509-510) Prevent renaming a record if that results in records with duplicate names. Tell user to alter name to something different.
		(Lines 512-533) Input passed validation and doesn't cause duplicate naming. Sanitise input, update db record & redirect to list, so user can see updated record.

	Deleting food:
		When addfood.ejs is rendered in updatemode (main.js line 448), the updatemode prop passed to template tells it to render the delete option (already described above in section 6).
		(Lines 120-126 of addfood.ejs) Display an option to delete the record, if (and only if!) the template was rendered by the '/searchupdate' route. Hidden name input because the name input text field is in a separate form with a separate post/submit method. Hence, /deletefood also needs to know the name of which food item to delete.
                (line 124) Makes user confirm or cancel delete operation before the post request is submitted to '/deletefood'.

	'/deletefood' (line 546 in main.js):
		(Line 546) Blocks users who are not logged in from deleting anything.
		Sanitize the name again, in case user might have changed it in dev tools.
		Send delete query to db. If error, log error, otherwise, redirect to list page so user can see record is gone.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R9 List food:
	
	views/list.ejs
	'/list' route (line 563 in main.js)

	listfood.ejs:
		(Lines 15-52) If template was passed a value for the foods prop by the '/list' route, create a table for each item found.
		Each table has a checkbox so it can be selected.
		(Lines 52-54) foods prop has null value, render message that database is empty.

	'/list' route:
		Query db to retrieve all data.
		If error, log error.
		Else if result is empty, render template with message that db is empty.
		Else, pass the results to ejs template as foods prop.

	'/calculatenutrition' route 583:
		From the list page in browser, tick ingredients checkboxes and click 'Calculate' to get a table with total nutritional values based on the ingredients.
		(Line 585) ingredients is an array of which ingredient checkboxes were ticked when form was submitted.
		(Line 586) Ingredients is empty if no ingredients in list were ticked. Redirect to list page (effectively refreshing it).
		(Lines 589-598) Initialize counters for nutritional totals.
		(Lines 600-608) Create SQL query string to retrieve data for each ingredient.
		(Lines 610-621) For each item in the result in db, add its nutritional values to counter.
		(Line 624) Round the total values and pass to recipe.ejs template for rendering.

	recipe.ejs template:
		Formats a table to display the total nutritional values, with caption which is list of ingredients included.
		Render error prompt if user clicks save recipe without entering a name or an invalid name entered.
		Form to save recipe data as new db record if user clicks save button.
		Input field are hidden so user can't mess up the calculated nutrition values.
		Clicking save recipe submits the data to /foodadded route, with recipeMode = true.
		Then (as desribed above in section 6), '/foodadded' route validates input.
		From section 6 above: "(Lines 54-115) Wanted to make the input fields readonly if the user arrived at the template via /searchupdate/recipe/calculatedata/addfood and the name entered for recipe/meal was either empty or invalid. Along with the error prompt and greyed out fields, makes it obvious they must change the recipe/meal name in order to save it. So in lines 54-115 of addfood.ejs, different input fields are rendered depending which route renders the template, because I couldn't make the readonly attribute conditional."
		Clicking save recipe will keep triggering /foodadded route, which will keep re-rendering addfood.ejs template with the recipe data readonly until either name is valid or user navigates away.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R10 API:
	
	'/api' route, line 634:
		Basic implementation: hitting the /api route from a browser retrieves (via HTTP GET request) all food items in db as an array of JSON objects e.g. [{id:1, name: 'plain flour', ... etc}, ... {}]


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R11 Form validation:

	Extensive validation! As desribed in sections 3, 4, 6, 7, 8 & 9:

	Section 3: " (Line 101) Tests first & last names against a regex which fails any string containing any characters other than letters and hyphens. Also tests length constraints.
                (line 101) Username tested against a regex which fails if username input contains characters other than letters, digits, underscores and hyphens.
                (Line 101) Email tested using node/express validator's isEmail method. Password tested against a regex which fails if it's not 8-20 characters with 1 uppercase, 1 lowercase letter and a number."

	Section 4: "(Line 191) Uses regex (same as used in /registered) to check the username input will be a valid username per my own specification (contains only letters, numbers, hyphens and underscores)."
	
	Section 6: "(Line 328) Blocks users who aren't logged in from submitting new food data to db.
                        Validates item name against regex which fails if it contains any characters except letters, numbers and spaces. Length also constrained.
                        The number that nutritional values are measured against tested against regex which rejects values with more than 10 digits (almost definitely unnecessarily large, but I didn't see much point constraining it when I don't know how things might be measured by people from different heritage. 10 digits seems to be the maximum for an int in MySQL server).
                        Unit must only be 1-15 letters.
                        Nutritional values with more than 4 digits before decimal place and/or more than 2dp and/or negative sign are rejected."
	
	Section 7: "(Line 285) Validator rejects search keywords containing anything other than letters, numbers and spaces."

	Section 8: "(Line 464) Input validation is identical to as described above in section about foodadded route."

	Section 9: " Render error prompt if user clicks save recipe without entering a name or an invalid name entered. Input field are hidden so user can't mess up the calculated nutrition values." Well they can change hidden inout values but much less easily and have to know how to use dev tools.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

R12:

	The whole app is built using only Node, Express, EJS templating and MySQL server.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

mysql> desc users;
+----------+--------------+------+-----+---------+----------------+
| Field    | Type         | Null | Key | Default | Extra          |
+----------+--------------+------+-----+---------+----------------+
| id       | int(11)      | NO   | PRI | NULL    | auto_increment |
| first    | varchar(35)  | YES  |     | NULL    |                |
| last     | varchar(35)  | YES  |     | NULL    |                |
| email    | varchar(100) | YES  |     | NULL    |                |
| username | varchar(25)  | YES  |     | NULL    |                |
| password | varchar(75)  | YES  |     | NULL    |                |
+----------+--------------+------+-----+---------+----------------+
6 rows in set (0.18 sec)

mysql> desc food_item;
+------------+-----------------------+------+-----+---------+----------------+
| Field      | Type                  | Null | Key | Default | Extra          |
+------------+-----------------------+------+-----+---------+----------------+
| id         | int(11)               | NO   | PRI | NULL    | auto_increment |
| name       | varchar(30)           | YES  |     | NULL    |                |
| values_per | int(10) unsigned      | YES  |     | NULL    |                |
| unit       | varchar(15)           | YES  |     | NULL    |                |
| calories   | decimal(6,2) unsigned | YES  |     | NULL    |                |
| carbs      | decimal(6,2) unsigned | YES  |     | NULL    |                |
| fat        | decimal(6,2) unsigned | YES  |     | NULL    |                |
| protein    | decimal(6,2) unsigned | YES  |     | NULL    |                |
| salt       | decimal(6,2) unsigned | YES  |     | NULL    |                |
| sugar      | decimal(6,2) unsigned | YES  |     | NULL    |                |
| input_by   | varchar(25)           | YES  |     | NULL    |                |
+------------+-----------------------+------+-----+---------+----------------+
11 rows in set (0.00 sec)

