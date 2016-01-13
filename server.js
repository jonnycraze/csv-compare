// modules =================================================
var express             = require('express');
var app                 = express();
var mongoose            = require('mongoose');
var methodOverride    	= require('method-override');
var router              = express.Router();
var bodyParser 			= require('body-parser');
var expressSession		= require('express-session');
var port 				= 8585;
var http 				= require('http');
var server 				= http.createServer(app);
var io 					= require('socket.io').listen(server);
server.listen(port);


// configuration ===========================================
var dburl = '';
//set dburl var
if(process.env.VCAP_SERVICES){
	console.log('process.env.VCAP_SERVICES IS set'); 
	var vcap_services = JSON.parse(process.env.VCAP_SERVICES)
	dburl = vcap_services.mongolab[0].credentials.uri
} else {
	console.log('process.env.VCAP_SERVICES NOT set');
	var db = require('./helpers/db');
	dburl = db.url
}


// config files
mongoose.connect(dburl, function (err, res) {                               
  if (err) { 
    console.log ('ERROR connecting to: ' + dburl + '. ' + err);
  } 
});


// get all data/stuff of the body (POST) parameters
app.use(methodOverride('X-HTTP-Method-Override'));               // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/client'));                         // set the static files location /public/img will be /img for usersapp.use(morgan('dev')); // log every request to the console
app.use(bodyParser.json()); 								// for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); 		// for parsing application/x-www-form-urlencoded
// app.use(multer()); 											// for parsing multipart/form-data


// routes ==================================================
require('./server/routes')(app); // pass our application into our routes

// start app ===============================================
console.log('Magic happens on port ' + port); 			// shoutout to the user
exports = module.exports = app; 						// expose app