// Code server CCC 
// Version: 0.0.0
// Author : Sufiane 'DonDiego' Souissi
//			Benjamin 'BennyP' Parant

var express = require('express')			// main FW
var bodyParser = require('body-parser')		// to parse req
var fs = require('fs')						// to read Files
var mongoose = require('mongoose') 			// for DB
var moment = require('moment'); 			// for date //date=moment().format('MMMM Do YYYY, h:mm:ss a');
var multer = require('multer');				// for receiving multipart form
var session = require('express-session');	// to handle session storage
var bcrypt = require('bcryptjs');			// to crypt password before puting them into DB
var nodemailer = require('nodemailer');		// to send emails
var chance = require('chance').Chance()		// to generate random things
var passport = require('passport')			// to identify members etc...
	, LocalStrategy = require('passport-local').Strategy
	, ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
	
var app = express()

// for the session
var sess;
app.use(session({secret:'Hercules Project'}));

// for sending mails
var mailer = nodemailer.createTransport({
	service: "Gmail",
	auth:{
		user: "bennyp.dondiego@gmail.com",
		pass: "herculesproject"
	}
});

//for post request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

// to store img in form (i.e poster)
var done = false;
var posterPath;
app.use(multer({dest: './ressources/poster',
				/*changeDest : function(dest, req, res){
					if(req.body.form_id =="formCarousel"){
						console.log('Changement du fichier de destination pour les fichiers du carousel');
						return dest +'/carousel';
					};
				},*/
				rename: function(fieldname, filename, req, res){
					// if(req.body.form_id =="formCarousel"){
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
mongoose.connect('mongodb://adminL3C:Herculesproject@ds045031.mongolab.com:45031/lille_city_cine_club');
//mongoose.connect('mongodb://localhost:27017/CCC');

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
	duration: String,
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
	
	if(req.session.email == undefined){
		console.log('on cree une session.');
		sess = req.session;
	}else{
		console.log('Il y à deja une session');
	}
	
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

	if(typeof sess == "undefined"){
		console.log('redirection car pas de sess');
		res.redirect('/');
	}else{
		if(sess.email){
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
					// Disable the 'undefined' genre when a movie have less than 3 genre. 
					var genre ="";
					genre += movie.genre[0];
					if (typeof movie.genre[1] != 'undefined'){
						genre +=", "+movie.genre[1];
					};
					if(typeof movie.genre[2] != 'undefined'){
						genre +=", "+movie.genre[2];
					};
					
					var duration;
					if( typeof movie.duration === 'undefined'){
						duration = "Un film sans durée :O !";
					}else{
						duration = movie.duration;
					};
				
					html = data;
					html = html.replace('%%title%%',movie.title);
					html = html.replace('%%duration%%',duration);
					html = html.replace('%%genre%%', genre);
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
		}else{
			console.log('Seul les membres peuvent se rendre sur la page de suggestion. Inscrivez vous!');
			res.redirect('/login');
		}
	}
})

// Admin Home page
app.get('/admin', function(req,res){
	
	if(typeof sess == "undefined"){
		console.log('redirection car pas de sess');
		res.redirect('/');
	}else{
		if(!sess.isAdmin){
			console.log('\nVous n\'avez pas les droit pour vous rendre sur cette page.');
			res.redirect('/');
		}else{
		
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
		}
	}
})

// Admin Adding content page
app.get('/admin-suggestion', function(req,res){
	
	if(typeof sess == "undefined"){
		console.log('redirection car pas de sess');
		res.redirect('/');
	}else{
		if(!sess.isAdmin){
			console.log('\nVous n\'avez pas les droits pour vous rendre sur cette page.\n');
			res.redirect('/');
		}else{

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
		}
	}
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
	
	if(typeof sess == "undefined"){
		console.log('redirection car pas de sess');
		res.redirect('/');
	}else{
		if(!sess.isAdmin){
			console.log('Vous n\'avez pas les droits pour vous rendre sur cette page');
			res.redirect('/');
		}else{
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
		}
	}
})

// Admin management
app.get('/admin-management', function(req,res){
	if(typeof sess == "undefined"){
		console.log('Admin management: session non defini. Redirecion vers home');
		res.redirect('/');
	}else{
		if(sess.isAdmin){
			var html;
			fs.readFile(__dirname+'/html/admin/admin-management.html', 'utf8', function(err, data){
				if(err){
					console.log('Admin management : Error loadin page');
					throw err;
				}
				console.log('\nAdmin management page loaded!');
				
				html = data;
				
				res.charset='utf-8';
				res.setHeader("Access-Control-Allows-Origin","*");
				res.send(html);
			})
		}else{
			console.log('Admin management: Vous n\'etes pas autorisés à vous rendre sur cette page.');
			res.redirect('/');
		}
	}
})

// ChangePass
app.get('/changePass', function(req,res){
	if(typeof sess == 'undefined'){
		console.log('\nredirection car pas de session');
		res.redirect('/');
	}else{
		if(sess.email){
			var html;
			fs.readFile(__dirname+'/html/changePass.html','utf-8',function(err,data){
				if(err){
					console.log('Error! Error loading changePass');
					throw err;
				}
				console.log('\nchangePass loaded!');
				html = data;
				
				res.charset='utf-8';
				res.setHeader("Access-Control-Allows-Origin","*");
				res.send(html);
			});
		}else{
			console.log("redirection car vous n\'etes pas connecté");
			res.redirect('/login');
		}
	}
})

// forgottenPass
app.get('/forgottenPass', function (req,res){
	/*
	if(typeof sess == "undefined"){
		console.log('\nForgotPass : redirection car pas de session.');
		res.redirect('/');
	}else{
	*/
	var html;
	fs.readFile(__dirname+'/html/forgottenPass.html','utf8',function(err, data){
		if(err){
			console.log('\nForgotPass: error loading forgotpass page');
			throw err;
		}
		console.log('\nForgotPass page loaded!');
		html = data;
		
		res.charset='utf-8';
		res.setHeader("Access-Control-Allows-Origin","*");
		res.send(data)
	});	
})	

// logout
app.get('/logout', function(req,res){
	console.log('Merci de votre visite et à bientôt ! ');
	req.session.destroy(function(err){
		if(err){
			console.log('Error logout!');
			console.log(err);
			throw err;
		}
		res.redirect('/');
	});
	/*
	req.logout();
	res.redirect('/');
	*/
})

//posting content to DB
app.post('/postContent',function(req,res){
	console.log('posting content...\n');
	
	var title,director,actors,genre,duration,synopsis,why;	// le poster est géré par multer. On rajoute juste le chemmin du poster à la base(cf posterPath)
	
	response = checkFormFilm(req);					// verification du formulaire
	if(response.codeResponse == "ko"){
		res.send(response);
	}else{
	
		title = req.body.title;
		director=req.body.director;
		actors = req.body.actors.split(', '); 		// transformation of string to array, parsing to ', '
		
		genre = []; 								// creating an array of genre
		genre.push(req.body.genre1);
		
		// Allow a movie to have less than 3 genre
		if(typeof req.body.genre2 != 'undefined'){
			genre.push(req.body.genre2);
		};
		if(typeof req.body.genre3 != 'undefined'){
			genre.push(req.body.genre3);
		};
		duration = req.body.duree;
		synopsis=req.body.synopsis;
		why=req.body.why;
		
		console.log('title: '+title+'\n genre: '+genre+'\n duration: '+duration+'\ndirector: '+director+'\n actors: '+actors+'\n synopsis: '+synopsis+'\n poster:'+posterPath+'\n why:'+why+'\n');
		
		var movie = {
			"title":title,
			"director":director,
			"actors":actors,
			"genre":genre,
			"synopsis":synopsis,
			"poster":posterPath,
			"duration":duration,
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
			res.send(response);
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
		res.send(response);
	}else{
		pseudo = req.body.pseudo;
		mail = req.body.mail;
		var salt = bcrypt.genSaltSync(10);
		password = bcrypt.hashSync(req.body.password,salt);
		
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
			
			mailer.sendMail({
				from:"Admin L3C <bennyp.dondiego@gmail.com>",
				to:mail,
				subject:"Bienvenue au sein du L3C!",
				//text: "ne s''affiche pas je ne sais pas pourquoi",
				html: '<b>Test Nodemailer!</b><br/>Bienvenue au sein de la communauté Lilloise City Cine Club!<br/>Vous retrouverez chaque semaine une suggestion de film choisis par nos soins.<br/> Nous avons deja hâte d\'entendre vos retours sur notre service/projet! A tout de suite sur le site!<br/> Benny-P & DonDiego'
			},function(err,mail){
				if(err){
					console.log("\nNew member: Error Sending mail!");
					throw err;
				}
				console.log('\nMessage successfully sent! Message:'+ mail.response);
			});
			
			res.send('New member '+user.name+' added!!');
		});
	};
})

// Adding new poster for the carousel
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

// Post loggin page
app.post('/loginConnection', function(req,res){
	
	var response = {
		codeResponse:"",
		message:"",
		isAdmin:""
	};

	userModel.findOne({"email":req.body.email},{},function(err,user){
		if(err){
			console.log('Error login! User not found!');
			throw err;
		}
		
		if(user == null || !bcrypt.compareSync(req.body.password, user.password)){
		
			response.codeResponse = "ko"
			response.message="Email ou Mot de Passe incorrect!";
			response.isAdmin = "";
			
			console.log('email or password invalid');
			res.send(response);
		}else{
			sess = req.session;
			console.log(user);
			if(user.isAdmin != true){
				sess.email = user.email;
				sess.name = user.name;
				sess.isAdmin = user.isAdmin;
				//rajout dans la sessions des autres attributs d'un membre possible ici.
				
				response.codeResponse = "ok";
				response.message = "Bienvenue "+user.name+" !";
				res.send(response);
			}else{
				console.log('session');
				console.log(sess);
				
				sess.email = user.email;
				sess.name = user.name;
				sess.isAdmin = user.isAdmin;
				
				response.codeResponse = "ok";
				response.message = "Au boulot "+user.name+" !";
				response.isAdmin = user.isAdmin;
				
				res.send(response);
			}
		}
	});
})

// ChangeMDP
app.post('/changeMdp', function(req,res){
	var response = checkFormMdp(req);
	if(response.codeResponse == "ok"){
		userModel.findOne({"email":sess.email},{},function(err,user){
			if(err){
				console.log('Error login! User not found!');
				throw err;
			}
			if(user == null || !bcrypt.compareSync(req.body.oldMdp, user.password)){
			
				response.codeResponse = "ko"
				response.message="L'ANCIEN MDP n'est pas correct!";
				response.isAdmin = "";
				
				console.log('old mdp invalid');
				res.send(response);
			}else{
				var salt = bcrypt.genSaltSync(10);
				userModel.findOneAndUpdate({email: sess.email},{password: bcrypt.hashSync(req.body.password,salt)},{}, function(err,user){
					if(err){
						console.log('ChangeMdp: Error modify password!');
						throw err;
					}
					console.log('\nChangePass: Password successfully changed!');
					res.send(response);
				})
			}
		})
	}else{
		console.log('\nChangePass: new & confirm not equals');
		res.send(response)
	}
})

// forgottenPass
app.post('/forgottenPass', function(req,res){
	var tmpPass, userEmail, response, mail, salt;
	tmpPass = chance.string({length: 8, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'});
	userEmail = req.body.email;
	salt = bcrypt.genSaltSync(10);
	
	console.log('email :' + userEmail);
	console.log('MDP provisoire : '+ tmpPass);
	
	response = {
		codeResponse :"",
		message :""
	};
	userModel.findOneAndUpdate({email: userEmail},{password: bcrypt.hashSync(tmpPass,salt)},{}, function(err,user){
		if(err){
			console.log('ForgottenPass : error searching user.');
			throw err;
		}
		if(user == null){
			console.log('ForgottenPass : no user found');
			response.codeResponse = "ko";
			response.message = "Adresse mail non trouvé!";
			res.send(response);
		}else{
			mail = user.email;
			
			mailer.sendMail({
					from:"Admin L3C <bennyp.dondiego@gmail.com>",
					to:mail,
					subject:"Mot de passe provisoire",
					//text: "ne s''affiche pas je ne sais pas pourquoi",
					html: '<b>Mot de pass provisoire</b><br/>Voici votre mdp provisoire: <strong>'+tmpPass+'</strong><br/>Changez vite votre mot de passe pour en a voir un plus parlant! Et surtout ne l\'oubliez plus cette fois ahah!<br/> Benny-P & DonDiego'
				},function(err,mail){
					if(err){
						console.log("\nForgottenPass: Error Sending mail!");
						throw err;
					}
					console.log('\nForgottenPass : Message successfully sent! Message:'+ mail.response);
					
					response.codeResponse = "ok";
					response.message = "Mdp provisoire envoyé";
					
					res.send(response);
				}
			);
		}
	})
});	

// adminManagement
app.post('/adminManagement', function(req,res){
	
	userModel.findOne({"name":req.body.pseudo},{}, function(err, user){
		if(err){
			console.log('adminManagement : error finding membre');
			throw err;
		}
		
		var response = {
			codeResponse :"",
			message :""
		}
		
		if(user == null){
			response.codeResponse = "ko";
			response.message = "Membre non trouvé!";
			
			res.send(response);
		}else{
		
			response.pseudo = user.name;
			response.email = user.email;
			response.date = moment(user.date).format('DD-MM-YYYY'); 
			response.genre = "";
			for(var i = 0; i < user.genre.length ; i++){
				response.genre += user.genre[i]+", ";
			}
			response.description = user.description;
			
			res.send(response);	
		}
	})	
})

// electAdmin
app.post('/electAdmin', function(req,res){
	userModel.findOneAndUpdate({name:req.body.pseudo},{isAdmin:true},{}, function(err, user){
		if(err){
			console.log('adminManagement : error finding membre');
			throw err;
		}
		
		var response = {
			codeResponse :"",
			message :""
		}
		console.log(req.body);
		
		if(user == null){
			response.codeResponse = "ko";
			response.message = "Membre non trouvé!";
			
			res.send(response);
		}else{
			console.log('\nElectAdmin : '+req.body.pseudo+'is now an admin!');
			response.codeResponse = "ok";
			response.message = req.body.pseudo+' is now an admin!';
			
			res.send(response);
		}
	})
})

// whatsMyName
app.post('/whatsMyName', function(req,res){
	console.log('Session asked : ');
	console.log(sess);
	res.send(sess);
});

// ------------------------------------------------------- PASSPORT -----------------------------------------------------------------------
// login
/*app.post('/loginConnection',passport.authenticate('local',{succesReturntoOrRedirect:'/home', failureRedirect:'/login'}),function(req,res){
	console.log('test login');
});
*/

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
// checkForm for admin-suggestion
var checkFormFilm = function(req){	
	var response = {
		codeResponse:"",
		message:""
	};
	if(req.body.title == "" || req.body.title == null ){
		response.codeResponse = "ko";
		response.message ="Le champ TITRE doit au moins être complété !";
		return response;
	};
	if(req.body.director == "" || req.body.director == null ){
		response.codeResponse = "ko";
		response.message ="Le champ REALISATEUR doit au moins être complété !";
		return response;
	};
	if(req.body.actors == "" || req.body.actors == null ){
		response.codeResponse = "ko";
		response.message ="Les champ ACTEURS doivent au moins être complétés !";
		return response;
	};
	if(req.body.genre1 == "" || req.body.genre1 == null ){
		response.codeResponse = "ko";
		response.message ="Le premier GENRE doit au moins être complété !";
		return response;
	};
	if(req.body.synopsis == "" || req.body.synopsis == null ){
		response.codeResponse = "ko";
		response.message ="Le champ SYNOPSIS doit au moins être complété !";
		return response;
	};
	if(req.body.why == "" || req.body.why == null ){
		response.codeResponse = "ko";
		response.message ="Le champ JUSTIFICATION doit au moins être complétée !";
		return response;
	};
	response.codeResponse = "ok";
	response.message ="Success ! Movie " + req.body.title + " added into L3C DB;" 
	return response;
};

// CheckForm for inscription
var checkFormMember = function(req){
	var response = {
		codeResponse:"",
		message:""
	};
	if(req.body.pseudo == "" || req.body.pseudo === null ){
		response.codeResponse = "ko";
		response.message ="Le champ PSEUDO doit au moins être complété !";
		return response;
	};
	if(req.body.mail == "" || req.body.mail === null ){
		response.codeResponse = "ko";
		response.message ="Le champ MAIL doit au moins être complété !";
		return response;
	};
	if(req.body.password == "" || req.body.password == null ){
		response.codeResponse = "ko";
		response.message ="Le champ MOT DE PASSE doit au moins être complété !";
		return response;
	};
	if(req.body.password != req.body.confirmPass){
		response.codeResponse = "ko";
		response.message = "Les champs MOT DE PASSE et CONFIRMATION doivent être IDENTIQUES !";
		return response;
	};
	if(req.body.genre1 == "" || req.body.genre1 == null ){
		response.codeResponse = "ko";
		response.message ="Le premier GENRE doit au moins être completé !";
		return response;
	};
	
	response.codeResponse = "ok";
	response.message ="Success ! User " + req.body.pseudo + " added into L3C DB;" 
	return response;
};

// checkForm for login	
var checkFormLogin = function(req){
	var response = {
			codeResponse:"",
			message:""
		};
	if(req.body.email == "" || req.body.email === null ){
		response.codeResponse = "ko";
		response.message ="Le champ E-MAIL doit au moins être complété !";
		return response;
	};
	if(req.body.password == "" || req.body.password === null ){
		response.codeResponse = "ko";
		response.message = "Le champ MOT DE PASSE doit au moins être complété !";
		return response;
	};
	response.codeResponse = "ok";
	response.message ="";
	return response;
};	

// checkForm for admin-carousel
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

// checkFormMdp
var checkFormMdp = function(req){
	
	var response = {
		codeResponse:"",
		message:""
	};
	
	if(req.body.password != req.body.confirmPass){
		response.codeResponde = "ko";
		response.message = "Le NOUVEAU MDP et la CONFIRMATION doivent être IDENTIQUES!";
	
		return response;
	}
	response.codeResponse = "ok";
	response.message = "Le MDP a bien été changé!";
	
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

// 404 page
app.use(function(req,res,next){
	console.log('\n404 page loaded');
	var html;
	fs.readFile(__dirname+'/html/pageNotFound.html','utf8',function(err,data){
		if(err){
			console.log('Error PageNotFound!');
			throw err;
		};
		
		html = data;
		res.charset='utf-8';
		res.setHeader("Access-Control-Allows-Origin","*");
		res.send(html);
	});
});

app.listen(7777);