
module.exports = function(app){

	suggestion = function(req,res){
		console.log('get called');
		if(typeof sess == "undefined"){
			console.log('ici sess invalid');
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
				//console.log('Seul les membres peuvent se rendre sur la page de suggestion. Inscrivez vous!');
				res.redirect('/login');
			}
		}
	}
}
