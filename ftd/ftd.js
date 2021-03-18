// https://www.freecodecamp.org/news/express-explained-with-examples-installation-routing-middleware-and-more/
// https://medium.com/@viral_shah/express-middlewares-demystified-f0c2c37ea6a1
// https://www.sohamkamani.com/blog/2018/05/30/understanding-how-expressjs-works/

var port = 8000; 
var express = require('express');
var app = express();

const { Pool } = require('pg')
const pool = new Pool({
    user: 'webdbuser',
    host: 'localhost',
    database: 'webdb',
    password: 'password',
    port: 5432
});

const bodyParser = require('body-parser'); // we used this middleware to parse POST bodies

function isObject(o){ return typeof o === 'object' && o !== null; }
function isNaturalNumber(value) { return /^\d+$/.test(value); }

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(bodyParser.raw()); // support raw bodies

// Non authenticated route. Can visit this without credentials
app.post('/api/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got here"}); 
});

//Restful API-registration: insert new accounts into database
//This one dont need credential
app.post('/api/register', function (req, res) {
	if (!req.headers.authorization) {
		return res.status(403).json({ error: 'No credentials sent!' });
  	}
	try {
		// var credentialsString = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);

		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];
		var password = m[2];

		console.log(username+" "+password);

		let sql = 'SELECT * FROM ftduser WHERE username=$1';
		pool.query(sql, [username], (err, pgRes) => {
			if (err){
				res.status(403).json({ error: 'query failure'});
		  	} else if (pgRes.rowCount!=0) {
			  	res.status(400);
			  	res.json({"insert failure":"username already exist"}); 
			}else{
				let sql = 'INSERT INTO ftduser (username, password) VALUES ($1, sha512($2))';
				pool.query(sql, [username, password], (err, pgRes) => {
				if (err){
					res.status(403).json({ error: 'Insert failure'});
				} else {
					res.status(200);
					res.json({"message":"registration success"}); 
					}
				});
			}
	  	});
	} catch(err) {
               	res.status(403).json({ error: 'Not registered'});
	}
});




/** 
 * This is middleware to restrict access to subroutes of /api/auth/ 
 * To get past this middleware, all requests should be sent with appropriate
 * credentials. Now this is not secure, but this is a first step.
 *
 * Authorization: Basic YXJub2xkOnNwaWRlcm1hbg==
 * Authorization: Basic " + btoa("arnold:spiderman"); in javascript
**/
app.use('/api/auth', function (req, res,next) {
	if (!req.headers.authorization) {
		return res.status(403).json({ error: 'No credentials sent!' });
  	}
	try {
		// var credentialsString = Buffer.from(req.headers.authorization.split(" ")[1], 'base64').toString();
		var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);

		var user_pass = Buffer.from(m[1], 'base64').toString()
		m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this

		var username = m[1];
		var password = m[2];

		console.log(username+" "+password);

		let sql = 'SELECT * FROM ftduser WHERE username=$1 and password=sha512($2)';
        	pool.query(sql, [username, password], (err, pgRes) => {
  			if (err){
                res.status(403).json({ error: 'Not authorized'});
			} else if(pgRes.rowCount == 1){
				next(); 
			} else {
                res.status(403).json({ error: 'Not authorized'});
        	}
		});
	} catch(err) {
               	res.status(403).json({ error: 'Not authorized'});
	}
});


// All routes below /api/auth require credentials 
app.post('/api/auth/login', function (req, res) {
	res.status(200); 
	res.json({"message":"authentication success"}); 
});

app.get('/api/auth/statistics', function (req, res) {
	let sql = 'SELECT * FROM ftduser';
	pool.query(sql, [], (err, pgRes) => {
		if (err){
			res.status(403).json({ error: 'query error'});
		} else {
			res.json(pgRes.rows);
			res.status(200);
		}
	});
});

app.delete('/api/auth/delete', function (req, res) {
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];
	// var password = m[2];
	let sql = 'DELETE FROM ftduser WHERE username=$1';
	pool.query(sql, [username], (err, pgRes) => {
		if (err){
			res.status(403).json({ error: 'query error'});
		} else {
			res.json({"message":"delete success!"});
			res.status(200);
		}
	});
});

app.put('/api/auth/update', function (req, res) {
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];
	var score = m[2];
	let sql = 'UPDATE stats SET kill=kill+$1 WHERE username=$2';
	pool.query(sql, [score,username], (err, pgRes) => {
		if (err){
			res.status(403).json({ error: 'query error'});
		} else {
			res.json({"message":"update success!"});
			res.status(200);
		}
	});
});

app.get('/api/auth/update', function (req, res) {
	var m = /^Basic\s+(.*)$/.exec(req.headers.authorization);
	var user_pass = Buffer.from(m[1], 'base64').toString()
	m = /^(.*):(.*)$/.exec(user_pass); // probably should do better than this
	var username = m[1];
	let sql = 'SELECT kill FROM stats WHERE username=$1';
	pool.query(sql, [username], (err, pgRes) => {
		if (err){
			res.status(403).json({ error: 'query error'});
		} else {
			res.json(psRes);
			res.status(200);
		}
	});
});


app.post('/api/auth/test', function (req, res) {
	res.status(200); 
	res.json({"message":"got to /api/auth/test"}); 
});

app.use('/',express.static('static_content')); 

app.listen(port, function () {
  	console.log('Example app listening on port '+port);
});

