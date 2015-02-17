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

/* needed to use multer?!
var router =  express.Router(); 
app.use('/postContent', router);	
*/

// to store img in form (i.e poster)
var done = false;
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
// mongoose.connect('mongodb://localhost:27017'); // connect to test DB collection
mongoose.connect('mongodb://localhost:27017/CCC');
var db = mongoose.connection;

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
	/*poster:String Chemin de l'image ,*/
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


//posting content to DB
app.post('/postContent',function(req,res){
	console.log('posting content...\n');
	console.dir(req.headers['content-type']); // bien recu en mutlipart/form-data
	
	// https://www.google.fr/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=0CCMQFjAA&url=http%3A%2F%2Fstackoverflow.com%2Fquestions%2F26994439%2Fnode-js-expressjs-multer-req-files-outputs-empty&ei=S7vZVIPYMMi1UaXSgagK&usg=AFQjCNHIr8mHKBpzh1rZ407ggM-dH5I7lQ&sig2=1cVFST83yUyh6mCX_JhNWg&bvm=bv.85464276,d.d24
	// https://www.google.fr/url?sa=t&rct=j&q=&esrc=s&source=web&cd=6&cad=rja&uact=8&ved=0CEoQFjAF&url=http%3A%2F%2Fexpertland.net%2Fquestion%2Fq3l8l31c21925b53r2t518520b9mwa7r6241%2Fdetail.html&ei=S7vZVIPYMMi1UaXSgagK&usg=AFQjCNFz-gWMIev8JVem3TOQhwdi7gUFKg&sig2=2UgUYQPuWuTvHdWHIxaoWw&bvm=bv.85464276,d.d24
	// https://www.google.fr/url?sa=t&rct=j&q=&esrc=s&source=web&cd=9&cad=rja&uact=8&ved=0CGIQFjAI&url=http%3A%2F%2Fwww.hacksparrow.com%2Fhandle-file-uploads-in-express-node-js.html&ei=S7vZVIPYMMi1UaXSgagK&usg=AFQjCNG91TPy4_ryrTOf4F6nxofrzORuxg&sig2=MoWZxjee8Qr3Z-4Zzr9E1g&bvm=bv.85464276,d.d24
	
	var title,director,actors,genre,synopsis,poster,why,date;
	
	title = req.body.title;
	director=req.body.director;
	actors = req.body.actors.split(', '); 	// transformation of string to array, parsing to ', '
	
	genre = []; 							// creating an array of genre
	if(req.body.genre1!=""){				// Needed to disable server crash when they're is no genre /!\ need to be changed
		genre.push(req.body.genre1);
	}
	if(req.body.genre2!=""){
		genre.push(req.body.genre2);
	}
	if(req.body.genre3!=""){
		genre.push(req.body.genre3);
	}
	synopsis=req.body.synopsis;
	poster=req.body.poster;					// Will change soon /!\ pb here multer seems to not work
	why=req.body.why;
	
	console.log("file: "+req.files);
	
	console.log('title: '+title+'\n director: '+director+'\n actors: '+actors+'\n synopsis: '+synopsis+'\n poster:'+poster+'\n why:'+why+'\n');
	
	var movie = {
		"title":title,
		"director":director,
		"actors":actors,
		"genre":genre,
		"synopsis":synopsis,
		"poster":poster,
		"why":why
	};

	if(done){
		console.log("uploading files complete!");
	}
	
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

// Adding new member into DB
app.post('/newMember', function(req,res){
	console.log('Adding new member...');
	console.log(req.headers['content-type']);
	
	var pseudo,mail,password,genre,description;
	
	pseudo = req.body.pseudo;
	mail = req.body.mail;
	password = req.body.password;
	
	genre =[]; //need to be changed! Verification will be made ClientSide
	if(req.body.genre1 !="" || req.body.genre1 != undefined){
		genre.push(req.body.genre1);
	}
	if(req.body.genre2 !="" || req.body.genre2 != undefined){
		genre.push(req.body.genre2);
	}
	if(req.body.genre3 !="" || req.body.genre3 != undefined){
		genre.push(req.body.genre3);
	}
	
	description = req.body.description;
	
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
		}
		console.log('New member '+user.name+' added!!');
		res.send('New member '+user.name+' added!!');
	});
})



// ------------------------------------------------------- PASSPORT -----------------------------------------------------------------------
// login
app.post('/loginConnection',passport.authenticate('local',{succesReturntoOrRedirect:'/home', failureRedirect:'/login'}));;

// logout
app.get('/logout', function(req,res){
	req.logout();
	res.redirect('/');
})

// Function that assure that isAdmin = T for all pages in admin folder
var requiresAdmin = function(){
	return[ensureLoggedIn('/login'),function(req,res,next){
			if(req.user && req.user.isAdmin == true){
				next();
			}else{
				res.send(401,'Vous n\'êtes pas autorisé à acceder à cette partie du site !');
			}
		}
	]
};

app.all('/admin/*',requiresAdmin());

	
	


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