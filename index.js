const express= require ('express');

const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=> res.sendFile('index.html',{root:__dirname}));

const port = process.env.PORT || 4000;
app.listen(port,()=> console.log('App listening on port',+port));

app.set('view engine','jade');
app.use(express.static('Login_v13'));

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect to bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS for jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); //redirect to css bootstrap
app.use(express.static(__dirname +'Login_v2'));// used to acess the files in a directory

 
/* MONGOOSE SETUP */

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/MyDatabase');

const Schema= mongoose.Schema;
const Schema2=mongoose.Schema;

const UserCred= new Schema2({
	username:String,
	firstname:String,
	lastname:String,
	email:String,
	phone:String,
	department:String
});


const UserDetail = new Schema({

	username : String ,
	password : String
});

const UserDetails = mongoose.model('userInfo',UserDetail,'userInfo');
const UserCredentails = mongoose.model('staffInfo',UserCred,'staffInfo');
/* PASSPORT SETUP */

const passport = require('Passport');
app.use(passport.initialize());
app.use(passport.session());




app.get('/success',(req,res)=> res.send("Welcome "+req.query.username+"!!"));
app.get('/error',(req,res)=> res.send("Error loging in"));
 
passport.serializeUser(function(id,cb){

	UserDetails.findById(id,function(err,user){

		cb(err,user);
	});
});


/* Passport local authentication */

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(

function(username,password,done){

UserDetails.findOne({

	username:username
},function(err,user){

	if(err){
		return done(err);
	}
	if(!user){
		return done(null,false);
	}
	if(user.password!=password)
	{
		return done(null,false);
	}
	return done(null, user);
}

);
}
	));

// Staff Login //
app.post('/login',
passport.authenticate('local',{failureRedirect:'/error'}),
function(req,res){

	res.sendfile('./login_v13/index.html');
} 
	);


app.get('/login',function(req,res){

    res.sendfile("./student.html");
});


//Admin Login // 
var path = require('path');// This is used to resolve the path issues as we can not use ../ in node


app.post('/adminLogin',
passport.authenticate('local',{failureRedirect:'/error'}),
function(req,res){

	res.sendfile(path.resolve('admin_fast.html'));// using path to connec to the required fille 
}
	);


app.get('/adminLogin',function(req,res){

    res.sendfile("login_v2/index.html");
});


// Update User Information ***************************

app.get('/updateUser',function(req,res){

	res.sendfile("./Login_v13/index.html");

});

app.post('/updateUser',function(req,res){

	var addCred = new UserCredentails();

	var response = {};

	addCred.username = req.body.username;
	addCred.firstname= req.body.firstname;
	addCred.lastname= req.body.lastname;
	addCred.email= req.body.email;
	addCred.phone= req.body.phone;
	addCred.department= req.body.department;


	
	addCred.save(function(err){
        // save() will run insert() command of MongoDB.
        // it will add new data in collection.
        console.log("did u get fuckedup");
        if(err) {
            response = {"error" : true,"message" : err};
        } else {
            response = {"error" : false,"message" : "Data added go check ur data "};
        }
         res.redirect('/userDetails')

    });


});

app.get('/userDetails',function(req,res){
	var addCred = new UserCredentails();

	var response = {};

UserCredentails.find({username:"prasanth"},function(err,staffIn){

		if(err){

			response = {"error" : true , "message" : "No courses found under the given rollno"};
		}
		else{
                response = {"error" : false , "message" : "data found"};
            }

            res.render('details',{staffInfo:staffIn})

	});
});

//  Admin Area User adding and other approvals 

app.get('/adminDashboard',function(req,res){

    res.sendfile("./courses.html");
});

// user resgitration fusntion . new users are added here 
app.post('/adminDashboard',function(req,res){
    //var newUser = new UserDetails();
    var response = {};
    var newUser = new UserDetails();
        // fetch email and password from REST request.
        // Add strict validation when you use this in Production.
        newUser.username = req.body.uname; 
        // Hash the password using SHA1 algorithm.
        newUser.password = req.body.psw;
        
        console.log(newUser.username);

        console.log(newUser.password);

		//md5(non_existant); // This variable does not exist
       // sha1(non_existant);                  
       newUser.save(function(err){
        // save() will run insert() command of MongoDB.
        // it will add new data in collection.
        console.log("did u get fuckedup");
        if(err) {
            response = {"error" : true,"message" : err};
        } else {
            response = {"error" : false,"message" : "Data added go check ur data "};
            console.log("data added ");
        }
        res.sendfile('./courses.html');

    });
   });
   