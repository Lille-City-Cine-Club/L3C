// Code server CCC 
// Version: 0.0.0
// Author : Sufiane 'DonDiego' Souissi
//			Benjamin 'BennyP' Parant

var express = require('express')		// main FW
var bodyParser = require('body-parser')	// to parse req
var fs = require('fs')					// to read Files
var mongoose = require('mongoose') 		// for DB
var moment = require('moment'); 		// for date
var multer = require('multer');

var app = express()

// to store img in form (i.e poster)
app.use(multer({dest: './ressources/poster',
				rename: function(fieldname, filename){
					return filename+moment().format('MMMM Do YYYY, h:mm:ss a');
				},
				onFileUploadStart: function(file){
					console.log(file.name + 'uploading . . .');
				},
				onFileUploadComplete: function(file){
					console.log(file.name + ' successfully uploaded to :'+ file.path);
					done=true;
				},
				onError: function(error, next){
					console.log('Error! Uploading '+ file.name+'failed!');
					next(error);
				}
}));

//for post request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));


// -------------------------------------------------------- Start -------------------------------------------------------------------------
console.log("City Ciné Club, a.k.a CCC, Web Server!\nListening on : 7777 \n https://gist.github.com/aheckmann/2408370 \n http://coding.paulandkana.com/?p=12 \n http://stackoverflow.com/questions/12046703/store-images-in-mongodb-using-mongoose-how-to");

//connection to the DB
// mongoose.connect('mongodb://localhost:27017'); // connect to test DB collection
mongoose.connect('mongodb://localhost:27017/CCC');
var db = mongoose.connection;


//to switch DB, not working at the moment.... Will be using it if needing other DB
//db.useDb('CCC');
db.once('connected', function(){
	console.log('Connected to DataBase');
});

// -------------------------------------------------------- DB model ----------------------------------------------------------------------
var Schema = mongoose.Schema;

var movieSchema = new Schema({
	title: String,
	director: String,
	actors: [String],
	genre:[String],
	synopsis: String,
	/*affiche:String Chemin de l'image ,*/
	poster: String,
	why: String,
	date: String
});

var movieModel = mongoose.model('Movie', movieSchema,'Movie');


// -------------------------------------------------------- Routes ------------------------------------------------------------------------
//Home page
app.get('/', function(req,res){
	console.log('\nHome loaded');
	
	var html;
	fs.readFile(__dirname+'/html/home.html','utf8',function(err,data){
		if(err){
			console.log('Error Home!');
			throw err;
		}
		html=data;
		
		res.charset='utf-8';
		res.setHeader("Access-Control-Allow-Origin","*");
		res.send(html);
	});
})

//Suggestion page
app.get('/suggestion', function(req,res){
	
	
	movieModel.findOne({},null,{sort:{'date':-1}},function(err,movie){
		if(err){
			console.log('Error find!');
			throw err;
		}
		console.log('\nSuggestion Loaded! Movie:'+ movie.title +'\n');
		
		var html;
		fs.readFile(__dirname+'/html/suggestion.html','utf8',function(err,data){
			if(err){
				console.log('Error Suggestion!');
				throw err;
			}
			
			// disable "actors1, undefined ..."
			var actors = "";
			for(var i = 0; i<movie.actors.length ; i++){
				actors += movie.actors[i];
			}
			
			html = data;
			html = html.replace('%%title%%',movie.title);
			html = html.replace('%%genre%%',movie.genre[0]+", "+movie.genre[1]+", "+movie.genre[2]);
			html = html.replace('%%real%%',movie.director);
			html = html.replace('%%actors%%',actors +" ...");
			html = html.replace('%%why%%',movie.why);
			html = html.replace('%%synopsis%%',movie.synopsis);
			
			res.charset='utf-8';
			res.setHeader("Access-Control-Allow-Origin","*");
			res.send(html);
		
		});
	});
})

// Admin page/Adding content page
app.get('/admin', function(req,res){
	console.log('\nAdmin loaded');
	
	var html;
	fs.readFile(__dirname+'/html/admin.html','utf8',function(err,data){
		if(err){
			console.log('Error admin!');
			throw err;
		}
		
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allow-Origin","*");
		res.send(html);
	});
})

//About page
app.get('/about', function(req,res){
	console.log('\nAbout loaded');
	
	var html;
	fs.readFile(__dirname+'/html/about.html','utf8',function(err,data){
		if(err){
			console.log('Error about!');
			throw err;
		}
		
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allow-Origin","*");
		res.send(html);
	});
})

//posting content to DB
app.post('/postContent',function(req,res){
	console.log('posting content...\n');
	console.dir(req.headers['content-type']); // PB HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	var title,director,actors,genre,synopsis,poster,why,date;
	title = req.body.title;
	director=req.body.director;
	actors = req.body.actors.split(', '); 	// transformation of string to array, parsing to ', '
	genre = []; 							// creating an array of genre
	genre.push(req.body.genre1,req.body.genre2,req.body.genre3);
	synopsis=req.body.synopsis;
	poster=req.body.poster;					/* Will change soon /!\*/
	why=req.body.why;
	date=moment().format('MMMM Do YYYY, h:mm:ss a');
	
	console.log("file");
	console.log(req.files);
	
	console.log('title: '+title+'\n director: '+director+'\n actors: '+actors+'\n synopsis: '+synopsis+'\n poster:'+poster+'\n why:'+why+'\n Date: '+ date+'\n');
	
	var movie = {
		"title":title,
		"director":director,
		"actors":actors,
		"genre":genre,
		"synopsis":synopsis,
		"poster":poster,
		"why":why,
		"date":date
	};

	var movie = new movieModel(movie);
	
	movie.save(function(err,data){
		if(err){
			console.log('Error saving movie!');
			throw err;
		}
		console.log('movie added!\n');
		res.send("success! Movie added to DB.");
	});	
})

// to get CSS/ressourcs etc...
var staticMiddleware = express.static(__dirname);
app.get("*:file", function(req, res, next) {
	staticMiddleware(req, res, next);
	var file = req.params.file + req.params[0];
	console.log(file+" loaded ");
	/*
    var file = req.params.file + req.params[0];
	file = file.toLowerCase();
    // res.send(401);
	*/
});

// ------------------------------------------------------- Finish -------------------------------------------------------------------------
app.on('close',function(){
	console.log('Closing server...');
	console.log('Closing DB...');
	db.disconnect();
	console.log('DB closed.');
	console.log('Serv closed, see you next time!!');
});

app.listen(7777);