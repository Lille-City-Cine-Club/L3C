// Code server CCC 
// Version: 0.0.0
// Author : Sufiane 'DonDiego' Souissi
//			Benjamin 'BennyP' Parant

var express = require('express')		// main FW
var bodyParser = require('body-parser')	// to parse req
var fs = require('fs')					// to read Files
var mongoose = require('mongoose') 		// for DB
var moment = require('moment'); 		// for date //date=moment().format('MMMM Do YYYY, h:mm:ss a');
var multer = require('multer');			// for receiving multipart form
var passport = require('passport')		// to identify members etc...
	, LocalStrategy = require('passport-local').Strategy
	, ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
	
var app = express()


// to store img in form (i.e poster)
var done = false;
var posterPath;
app.use(multer({dest: './ressources/poster',
				/*changeDest : function(dest, req, res){
					if(req.body.form_id =="carousel"){
						console.log('Changement du fichier de destination pour les fichiers du carousel');
						return dest +'/carousel';
					};
				},*/
				rename: function(fieldname, filename, req, res){
					// if(req.body.form_id =="carousel"){
						// return filename;
					// }else{
						// return moment().format('YYYY_MM_DD')+'_'+filename;
					// }
					return moment().format('YYYY_MM_DD')+'_'+filename;
				},
				onFileUploadStart: function(file, req, res){
					console.log(file.name + ' uploading . . .');
				},
				onFileUploadComplete: function(file, req, res){
					console.log(file.name + ' successfully uploaded to :'+ file.path);
					posterPath = file.path;
					done=true;
				},
				onError: function(error, next){
					console.log('Error! Uploading failed! ');
					console.log(error);
					next(error);
				}
}));

//for post request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

//credientials for localStrategy {usernameField:'email',passwordField:'password'}
passport.use(new LocalStrategy({usernameField:'email',passwordField:'password'},function(email,password,done){
	userModel.findOne({'email':email,'password': password },
				{'_id':1,'email':1}, function(err, user){
					if(err){
						console.log('Erreur loggin user!');
						return done(err);
						throw err;
					}
					if(!user){
						return done(null,false,{message:'Incorrect username!'});
					}
					return done(null,user);	
				});
}));

passport.serializeUser(function(user,done){
	done(null,user);
});

passport.deserializeUser(function(user,done){
	done(null,user);
});

// for passport
app.use(passport.initialize());
app.use(passport.session());

// -------------------------------------------------------- Start -------------------------------------------------------------------------
console.log("City Ciné Club, a.k.a CCC, Web Server!\nListening on : 7777 \n");

//connection to the DB

//mongoose.connect('mongodb://adminL3C:Herculesproject@ds045031.mongolab.com:45031/lille_city_cine_club');
mongoose.connect('mongodb://localhost:27017/CCC');

var db = mongoose.connection;
db.on('error',function(){
	console.log("Error connecting to DB ! Check your network and restart the server.");
});
db.once('connected', function(){
	console.log('Connected to DataBase');
});

// -------------------------------------------------------- DB model ----------------------------------------------------------------------
var Schema = mongoose.Schema;

var movieSchema = new Schema({
	title: String,
	director: String,
	actors: [String],
	genre: [String],
	synopsis: String,
	poster: String,
	poster: String,
	why: String,
	date: {type:Date, default:Date.now}
});

var userSchema = new Schema({
	name: String,
	email: String,
	password: String,
	isAdmin:{type: Boolean, default: false},
	description:String,
	genre:[String],
	date:{type:Date, default:Date.now}
});

var movieModel = mongoose.model('Movie', movieSchema,'Movie');
var userModel = mongoose.model('Users', userSchema, 'Users');

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
	
	movieModel.findOne({},{},{sort:{date:-1}},function(err,movie){
		if(err){
			console.log('Error find!');
			throw err;
		}
		console.log('\nSuggestion Loaded! Movie: '+ movie.title +'\n');
		var img;
		var html;
		fs.readFile(__dirname+'/html/suggestion.html','utf8',function(err,data){
			if(err){
				console.log('Error Suggestion!');
				throw err;
			}		
			// disable "actors1, undefined ..."
			var actors = "";
			for(var i = 0; i<movie.actors.length ; i++){
				actors += movie.actors[i]+', ';
			}

			html = data;
			html = html.replace('%%title%%',movie.title);
			html = html.replace('%%genre%%',movie.genre[0]+", "+movie.genre[1]+", "+movie.genre[2]);
			html = html.replace('%%real%%',movie.director);
			html = html.replace('%%actors%%',actors +" ...");
			html = html.replace('%%why%%',movie.why);
			html = html.replace('%%synopsis%%',movie.synopsis);
			html = html.replace('%%poster%%', movie.poster);
			
			res.charset='utf-8';
			res.setHeader("Access-Control-Allow-Origin","*");
			res.send(html);
		
		});
	});
})

// Admin Home page
app.get('/admin', function(req,res){
	console.log('\n Admin Home page loaded');
	
	var html;
	fs.readFile(__dirname+'/html/admin/admin.html','utf8',function(err, data){
		if(err){
			console.log('Error Admin home page!');
			throw err;
		}
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allow-Origin","*");
		res.send(html);
	});
})

// Admin Adding content page
app.get('/admin-suggestion', function(req,res){
	console.log('\nAdminSuggestion loaded');
	
	var html;
	fs.readFile(__dirname+'/html/admin/admin-suggestion.html','utf8',function(err,data){
		if(err){
			console.log('Error adminSuggestion!');
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

//Inscription page
app.get('/inscription',function(req,res){
	console.log('\nInscription loaded');
	
	var html;
	fs.readFile(__dirname+'/html/inscription.html','utf8',function(err,data){
		if(err){
			console.log('Error inscription page!');
			throw err;
		}
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allow-Origin","*");
		res.send(html);
	});
})

//Login page
app.get('/login',function(req,res){
	console.log('\nLogin page loaded');
	
	var html;
	fs.readFile(__dirname+'/html/login.html','utf8',function(err,data){
		if(err){
			console.log('Error login page!');
			throw err;
		}
		
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allows-Origin","*");
		res.send(html);
	});
})

// Admin modif carousel page
app.get('/admin-carousel', function(req,res){
	console.log('\n Admin carousel loaded');
	
	var html;
	fs.readFile(__dirname+'/html/admin/admin-carousel.html','utf8',function(err,data){
		if(err){
			console.log('Error Admin carousel!');
			throw err;
		};
		
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allows-Origin","*");
		res.send(html);
	});
})


//posting content to DB
app.post('/postContent',function(req,res){
	console.log('posting content...\n');
	
	var title,director,actors,genre,synopsis,why;	// le poster est géré par multer. On rajoute juste le chemmin du poster à la base(cf posterPath)
	
	response = checkFormFilm(req);					// verification du formulaire
	if(response.codeResponse == "ko"){
		res.send(response.message);
	}else{
	
		title = req.body.title;
		director=req.body.director;
		actors = req.body.actors.split(', '); 		// transformation of string to array, parsing to ', '
		
		genre = []; 								// creating an array of genre
		genre.push(req.body.genre1);
		
		if(req.body.genre2!=""){
			genre.push(req.body.genre2);
		};
		if(req.body.genre3!=""){
			genre.push(req.body.genre3);
		};
		synopsis=req.body.synopsis;
		why=req.body.why;
		
		console.log('title: '+title+'\n director: '+director+'\n actors: '+actors+'\n synopsis: '+synopsis+'\n poster:'+posterPath+'\n why:'+why+'\n');
		
		var movie = {
			"title":title,
			"director":director,
			"actors":actors,
			"genre":genre,
			"synopsis":synopsis,
			"poster":posterPath,
			"why":why
		};

		if(done){										//used with multer to notify the upload sucess
			console.log("uploading files complete!");
		};
		
		var movie = new movieModel(movie);
		
		movie.save(function(err,data){
			if(err){
				console.log('Error saving movie!');
				throw err;
			};
			console.log('movie added!\n');
			res.send("success! Movie added to DB.");
		});	
	};
})

// Adding new member into DB
app.post('/newMember', function(req,res){
	console.log('Adding new member...');
	console.log(req.headers['content-type']);
	
	var pseudo,mail,password,genre,description;
	
	var response = checkFormMember(req);
	if(response.codeResponse == "ko"){
		console.log("Adding failed! form wasn't valid.");
		res.send(response.message);
	}else{
		pseudo = req.body.pseudo;
		mail = req.body.mail;
		password = req.body.password;
		
		genre =[]; 
		genre.push(req.body.genre1);
		
		if(req.body.genre2 != undefined){
			genre.push(req.body.genre2);
		};
		if(req.body.genre3 != undefined){
			genre.push(req.body.genre3);
		};
		
		if(req.body.description != undefined){
			description = req.body.description;
		}else{
			description = pseudo +" est encore un peu timide.. Souhaitez lui la bienvenue ! ";
		};
		
		var user = {
			"name":pseudo,
			"email":mail,
			"password":password,
			"isAdmin":false,
			"description":description,
			"genre":genre
		};

		user = new userModel(user);
		user.save(function(err,member){
			if(err){
				console.log('Error saving new member!!');
				throw err;
			};
			console.log('New member '+user.name+' added!!');
			console.log(user);
			res.send('New member '+user.name+' added!!');
		});
	};
})

app.post('/postCarousel', function(req,res){
	console.log('\nAdding new movie poster to the carousel');
	console.log(req.headers['content-type']);
	console.log(req.files);
	console.log('film1'+req.body.film1);

	var response = checkFormCarousel(req);
	if(response.codeResponse =="ko"){
		console.log('Error! Invalid form.');
		res.send(response.message);
	}else{
		console.log("\nSuccess! All movies correctly added into Server.");
		res.send("Success! All movies correctly added into Server.");
	};
})

/*
app.post('/loginConnection',function(req,res){
	console.log('log COnnectionn');
})
*/

// ------------------------------------------------------- PASSPORT -----------------------------------------------------------------------
// login
app.post('/loginConnection',passport.authenticate('local',{succesReturntoOrRedirect:'/home', failureRedirect:'/login'}),function(req,res){
	console.log('test login');
});

// logout
app.get('/logout', function(req,res){
	req.logout();
	res.redirect('/');
})

// Function that assure that isAdmin = T for all pages in admin folder
var requiresAdmin = function(){
	return[ensureLoggedIn('/login'),function(req,res,next){
			console.log(req.user);
			if(req.user && req.user.isAdmin == true){
				next();
			}else{
				res.send(401,'Vous n\'êtes pas autorisé à acceder à cette partie du site !');
			}
		}
	]
};

app.all('/admin/*',requiresAdmin());

// ------------------------------------------------------- Fonction de verification des forms ---------------------------------------------
var checkFormFilm = function(req){	
	var response = {
		codeResponse:"",
		message:""
	};
	if(req.body.title == "" || req.body.title === null ){
		response.codeResponse = "ko";
		response.message ="Le TITRE doit au moins être completé !";
		return response;
	};
	if(req.body.director == "" || req.body.director == null ){
		response.codeResponse = "ko";
		response.message ="Le REALISATEUR doit au moins être completé !";
		return response;
	};
	if(req.body.actors == "" || req.body.actors == null ){
		response.codeResponse = "ko";
		response.message ="Les ACTEURS doivent au moins être completés !";
		return response;
	};
	if(req.body.genre1 == "" || req.body.genre1 == null ){
		response.codeResponse = "ko";
		response.message ="Le premier GENRE doit au moins être completé !";
		return response;
	};
	if(req.body.synopsis == "" || req.body.synopsis == null ){
		response.codeResponse = "ko";
		response.message ="Le SYNOPSIS doit au moins être completé !";
		return response;
	};
	if(req.body.why == "" || req.body.why == null ){
		response.codeResponse = "ko";
		response.message ="La JUSTIFICATION doit au moins être completée !";
		return response;
	};
	response.codeResponse = "ok";
	response.message ="Success ! Movie " + req.body.title + " added into L3C DB;" 
	return response;
};

var checkFormMember = function(req){
	var response = {
		codeResponse:"",
		message:""
	};
	if(req.body.pseudo == "" || req.body.pseudo === null ){
		response.codeResponse = "ko";
		response.message ="Le PSEUDO doit au moins être completé !";
		return response;
	};
	if(req.body.mail == "" || req.body.mail === null ){
		response.codeResponse = "ko";
		response.message ="Le MAIL doit au moins être completé !";
		return response;
	};
	if(req.body.password == "" || req.body.password == null ){
		response.codeResponse = "ko";
		response.message ="Le REALISATEUR doit au moins être completé !";
		return response;
	};
	if(req.body.genre1 == "" || req.body.genre1 == null ){
		response.codeResponse = "ko";
		response.message ="Le premier GENRE doit au moins être completé !";
		return response;
	};
	
	response.codeResponse = "ok";
	response.message ="Success ! Movie " + req.body.title + " added into L3C DB;" 
	return response;
};
	
var checkFormLogin = function(req){
	var response = {
			codeResponse:"",
			message:""
		};
	if(req.body.email == "" || req.body.email === null ){
		response.codeResponse = "ko";
		response.message ="Le E-MAIL doit au moins être completé !";
		return response;
	};
	if(req.body.password == "" || req.body.password === null ){
		response.codeResponse = "ko";
		response.message = "Le MOT DE PASSE doit au moins être completé !";
		return response;
	};
	response.codeResponse = "ok";
	response.message ="";
	return response;
};	

var checkFormCarousel = function(req){
	var response = {
			codeResponse:"",
			message:""
		};
	if(req.body.film1 == undefined ){
		response.codeResponse = "ko";
		response.message = "Toutes les affiches de films doivent être complété!(1)";
		return response;
	};
	if(req.body.film2 == undefined ){
		response.codeResponse = "ko";
		response.message = "Toutes les affiches de films doivent être complété!(2)";
		return response;
	};
	if(req.body.film3 == undefined ){
		response.codeResponse = "ko";
		response.message = "Toutes les affiches de films doivent être complété!(3)";
		return response;
	};
	if(req.body.film4 == undefined){
		response.codeResponse = "ko";
		response.message = "Toutes les affiches de films doivent être complété!(4)";
		return response;
	};
	if(req.body.film5 == undefined ){
		response.codeResponse = "ko";
		response.message = "Toutes les affiches de films doivent être complété!(5)";
		return response;
	};
	if(req.body.film6 == undefined ){
		response.codeResponse = "ko";
		response.message = "Toutes les affiches de films doivent être complété!(6)";
		return response;
	};
	
	response.codeResponse = "ok";
	response.message ="" ;
	return response;
};	



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