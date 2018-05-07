const express= require ('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

var session = require('client-sessions');

app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

const port = process.env.PORT || 4000;
app.listen(port,() => console.log('App listening on port',+port));

app.set('view engine','jade');
app.use(express.static('Login_v2'));
app.use(express.static('Login_v13'));

app.use("/css", express.static(__dirname + '/public/css'));
app.use("/css", express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect to bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS for jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); //redirect to css bootstrap
app.use(express.static(__dirname +'Login_v2'));// used to acess the files in a directory

/* MONGOOSE SETUP */

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/MyDatabase');
var db = mongoose.connect('mongodb://localhost/MyDatabase');

const Schema= mongoose.Schema;
const Schema2=mongoose.Schema;

const Admin = new Schema2({
	username:String,
	password:String
});

const UserDetail = new Schema({

	username:String,
	password:String,
	name:String,
	
	gender:String,
	doj: String,
	department:String,
	position:String,
	room:String,
	casual:{
		credits:String
		
	},
	halfpay:{
		halfpay:String,
		//active_now:String
	},
	commuted:{count : String},
	earned:{
		credits:String,
		count:String,
		excess:String
	},
	vacation:{count:String},
	notdue:{count:String},
	children:[{name:String,age:String,dob:String}],
	Num_Children:String,
	maternity:{credits:String},
	paternity:{credits:String,spells:String},
	adoption:{credits:String},
	careleave:{credits:String,spells:String},
	extraordinary:{days:String},
	//Extraordinary_leave:{active_now:String,Years_left:String}
});

const Schema3=mongoose.Schema;

const Requests = new Schema3({
	username : String,
	name:String,
	leavetype:String,
	startdate:String,
	enddate:String,
	comment:String
});

const UserDetails = mongoose.model('employee', UserDetail,'employee');
const Admin1 = mongoose.model('admin', Admin,'admin');
const Requests1=mongoose.model('requests', Requests,'requests');

// app.get('/',(req,res)=> res.sendFile('index.html',{root:__dirname}));

app.get ('/', function (req,res) {
	var date = new Date();
	if (date.getMonth() == 11 && date.getDate() == 31) {
		UserDetails.update({}, {$set: {'casual.credits': 24}}, {multi:true}, function (err){
			if (!err) {
				console.log ('Reset all casual credits to 5');
			} else {
				console.log ("Couldn't reset casual credits");
			}
		})
	} 
	// res.sendFile('index.html',{root:__dirname});
	res.sendfile(path.resolve('index.html'));
});

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
passport.use(new LocalStrategy(function(username,password,done) {

	UserDetails.findOne({username:username},function(err,user){

		if (err){
			return done(err);
		}
		if (!user){
			return done(null,false);
		}
		if (user.password!=password)
		{
			return done(null,false);
		}
		return done(null, user);
	});
}));

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    UserDetails.findById(id, function(err, user) {
        done(err, user);
    });
})

// AdminAccept
app.post('/accept',function(req,res){

	var leavetype;
	var username;
	var num_days;
	var startdate, enddate;

	var reqid= req.body.reqid;
	Requests1.findOne ({_id:reqid}, function (err, reqdoc) {
		leavetype = reqdoc.leavetype;
		username = reqdoc.username;
		startdate = new Date (reqdoc.startdate);
		enddate = new Date (reqdoc.enddate);
		num_days = parseInt ((enddate - startdate) / (24 * 3600 * 1000));
		switch (leavetype) {
			case 'casual':
				UserDetails.findOne ({username: username}, function (err, userdoc) {
					userdoc.casual.credits -= num_days;
					userdoc.save();
				})
				Requests1.remove({ _id: reqid}, function(err) {
				    if (!err) {
				    	console.log ('Request removed'); // todo: move requests
				    }
				    else {
				    	console.log ('Request not removed. Check the code');
				    }
				});
				break;
			case 'halfpay':
				UserDetails.findOne ({username: username}, function (err, userdoc) {
					userdoc.halfpay.credits -= num_days;
					userdoc.save();
				})
				Requests1.remove({ _id: reqid}, function(err) {
				    if (!err) {
				    	console.log ('Request removed'); // todo: move requests
				    }
				    else {
				    	console.log ('Request not removed. Check the code');
				    }
				});
				break;
		}	
	});

});


// Staff Login //
app.post('/login',
passport.authenticate('local'), function(req,res) {
	UserDetails.findOne({username:req.body.username},function(err,user){
	req.session.user = user;
});
	
var User=new UserDetails();
// confirm that user typed same password twice
	if (User.password !== req.body.passwordConf) {
			var err = new Error('Password Wrong');
			err.status = 400;
			res.send("password wrong");
			return next(err);
	} else if(User.username !==req.body.Username){
		var err = new Error('Usernames wrong');
			err.status = 400;
			res.send("Username wrong");
			return next(err);

	} else{	
		UserDetails.distinct().find({username:req.body.username},function(err,user){
				if(err){
		            response = {"error" : true , "message" : "No courses found under the given rollno"};
		        }else{
		            response = {"error" : false , "message" : "data found"};
		        }
		        res.render('details',{"employee":user})

		});
}});

app.get('/login',function(req,res){
    res.sendfile("./student.html");
});
app.get('/leave',function(req,res){
    res.sendfile("./leave.html");
});

app.post('/leave', function(req,res) {
	var a = req.body.leavetype;
	var startdate = new Date (req.body.startdate);
	var enddate = new Date (req.body.enddate);
	var num_days = parseInt((enddate - startdate) / (24 * 3600 * 1000));
	var comment = req.body.comment;
	var success = true;


	switch (a) {
		case 'casual':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				if (doc.casual.credits - num_days < 0) {
					// alert user -> Proceed or Cancel -> success variable
				}
			});
			break;
		case 'halfpay':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				if (doc.halfpay.credits - num_days < 0) {
					// alert user -> Cut from no-due -> Proceed or Cancel
					if (success) {
						a = 'notdue';
					}
					
				}
			});
			break;
		case 'commute':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				if (doc.commuted.count + doc.earned.count + num_days > 240) {
					// alert user -> Commuted + Earned + curr_commute > 240 -> Proceed or Cancel
				}
				if (doc.commuted.count + num_days > 180) {
					// alert user -> Commuted > 180 -> Proceed or Cancel
				}
			});
			break;
		case 'earned':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.earned.credits -= num_days;
				doc.earned.count += num_days;
			});
			break;
		case 'vacation':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.earned.credits -= num_days/2;
				doc.vacation.count += num_days;
			});
			break;
		case 'maternity':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.Maternity_leave_credit -= req.body.number;
				doc.save();
			});
			break;
		case 'paternity':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.Paternity_leave.credit -= req.body.number;
				doc.save();
			});
			break;
		case 'adoption':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.Child_Adop_Leave -= req.body.number;
				doc.save();
			});
			break;
		case 'child_care':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.Child_care_leave.credit -= req.body.number;
				doc.save();
			});
			break;
		case 'extraordinary':
			UserDetails.findOne ({username:req.session.user.username}, function (err, doc) {
				doc.Extraordinary_leave.active_now -= req.body.number;
				doc.save();
			});
			break;
		default:
			console.log ('Invalid Leave Type');
			break;
	}
	if (success) {
		var newRequest = new Requests1 ();
		newRequest.username = req.session.user.username;
		newRequest.name = req.session.user.name;
		newRequest.leavetype = a;
		newRequest.startdate = startdate;
		newRequest.enddate = enddate;
		newRequest.comment = comment;
		newRequest.save (function (err) {
			if (err) {
				console.log ('Your request has not been added');
			} else {
				console.log ('Request has been added. Please wait for admin to approve');
			}
		});
	}
});

//Admin Login // 
var path = require('path');// This is used to resolve the path issues as we can not use ../ in node


app.post('/adminLogin',
passport.authenticate('local',{failureRedirect:'/error'}),
function(req,res,next){


Requests1.find({}, function(err, docs){
		if(err) res.json(err);
		else    res.render('admin', {requests: docs});
	});


	
	//res.sendfile(path.resolve('admin_fast.html'));// using path to connec to the required fille 
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
        console.log("did u get ");
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

    // confirm that user typed same password twice
		if (newUser.username !== req.body.username) {
				var err = new Error('Username already Exists');
				err.status = 400;
				res.send("Please try again username already exists");
				return next(err);
		}

else{
        // fetch email and password from REST request.
        // Add strict validation when you use this in Production.
        newUser.username = req.body.uname;
        console.log("Please etop"+req.body.uname);
        // Hash the password using SHA1 algorithm.
        newUser.password = req.body.psw;
        newUser.name="Praaa";
        newUser.gender="M";
        newUser.doj=Date();
        newUser.department="CSE",
        newUser.position="Assistant Prof",
        newUser.room="F402",
        newUser.casual.credits="5";
        newUser.halfpay.credits="10";
        newUser.commuted.count="0";
        newUser.earned.credits="15";
        newUser.earned.count="0";
        newUser.earned.excess="0";
        newUser.vacation.count="0";
        newUser.notdue.count="0";
        children=[{"name":"priya","age":"20","DOB":"Sat May 05 2018 21:12:30 GMT+0530 (IST)"}];
        newUser.children=children;
        newUser.maternity.maternity="180";
        newUser.paternity.credits="15";
        newUser.paternity.spells="0"
        newUser.adoption.credits="180";
        newUser.careleave.credits="730";
        newUser.careleave.spells="3"
        newUser.extraordinary.days="0";


        console.log(newUser.username);

        console.log(newUser.password);

		//md5(non_existant); // This variable does not exist
       // sha1(non_existant);                  
       newUser.save(function(err){
        // save() will run insert() command of MongoDB.
        // it will add new data in collection.
        console.log("did u get");
        if(err) {
            response = {"error" : true,"message" : err};
        } else {
            response = {"error" : false,"message" : "Data added go check ur data "};
            console.log("data added ");
        }
        res.sendfile('./courses.html');

    });
}


   });
   