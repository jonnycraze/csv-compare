var express 	= require('express');
var bodyParser  = require('body-parser');
var fs = require('fs');
var multiparty 	= require('multiparty');
var router 		= express.Router();


module.exports = function(app){

	app.post('/api/files/upload', function(req,res,next){
	    var form = new multiparty.Form();

	    form.parse(req, function(err, fields, files) {

	        var file = files.file[0];
	        var contentType = file.headers['content-type'];
	        var tmpPath = file.path;
	        var fileName = file.originalFilename;
	        var destPath = './client/uploads/' + fileName;

	        console.log(file);

	        fs.rename(tmpPath, destPath, function(err) {
	            if (err) {
	                return res.status(400).send('File was not uploaded: ' + err);
	            }
	            return res.json(destPath);
	        });
	    });

	});
	
	// frontend routes =========================================================
	// route to handle all angular requests
	app.get('*', function(req, res, next) {
		res.sendfile('./client/index.html');
	});	
}


