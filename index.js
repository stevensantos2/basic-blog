require('dotenv').config();
const $ = require('jquery');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
//secret is used to decrypt and encrypt session cookies
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));
app.set('view engine', 'ejs');

//express configuration for passport and sessions
app.use(passport.initialize());
app.use(passport.session());


const url = "mongodb://localhost:27017/musicDB";


mongoose.connect(url);


//Embedded Document Schema
const userSchema = new mongoose.Schema({
    googleId: String,
    username: String
});


let commentSchema = {
    author: userSchema,
    target: String,
    content: String,
    stamp: {
        date: String ,
        time: String 
    }
};
let postSchema = {
    author:userSchema,
    title: String,
    content: String,
    comments: [commentSchema],
    stamp: {
        date: String,
        time: String 
    }
};

const topicSchema = new mongoose.Schema({
    section: String,
    posts: [postSchema]
});





userSchema.plugin(findOrCreate);

//Models
const User = new mongoose.model("User", userSchema);
const Topic = new mongoose.model("Topic", topicSchema);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/music',
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    (accessToken, refreshToken, profile, cb) => {
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
}));


//Routes
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/music');
    } else {
        res.redirect('login');
    }
});


app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/music');
    } else {
        res.render('login');
    }
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('login');
})

app.get("/auth/google",
    passport.authenticate("google", {
        scope: ['profile']
    }));

app.get("/auth/google/music",
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        res.redirect('/music');
    });



app.get("/music", (req, res) => {
    if (req.isAuthenticated()) {
        if(req.user.username){//checking if there is a username connected to user
        Topic.find({}, (err, allPosts) => {//getting all posts
            if (err) {
                console.log(err);
            }
            else {
                res.render('music', {  allPosts: allPosts, section: "No Filter", user:req.user });
            }
        });
        }else{
            res.render('user');
        }
        
    } else {
        res.redirect("/login");
    }
});


app.get("/music/albums", (req, res) => {
    if (req.isAuthenticated()) {
        Topic.find({section:"albums"}, (err, allPosts) => {//finding all posts in albums section
            if (err) {
                console.log(err);
            }
            else {
                res.render('music', {  allPosts: allPosts, section: "Albums", user:req.user });
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/music/artists", (req, res) => {
    if (req.isAuthenticated()) {
        Topic.find({section:"artists"}, (err, allPosts) => {//finding all posts in artists section
            if (err) {
                console.log(err);
            }
            else {
                res.render('music', {  allPosts: allPosts, section: "Artists", user:req.user });
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/music/songs", (req, res) => {
    if (req.isAuthenticated()) {
        Topic.find({section:"songs"}, (err, allPosts) => {//finding all posts in songs section
            if (err) {
                console.log(err);
            }
            else {
                res.render('music', {  allPosts: allPosts, section: "Songs", user:req.user });
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.post('/login', passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: '/music'
}));


app.post("/music", (req, res) => {
    //checking if a topic was specified
    let topic = req.body.topic;
    if(!topic){
        topic="no filters";
    }
    //getting req information from request
    const content = req.body.content;
    const title = req.body.title;
    const user = req.user;
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = date.getFullYear();
    const today = mm + '/' + dd + '/' + yyyy;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = hours + ':' + minutes;
    //creating the new post
    const newPost = {
        author: user,
        title: title,
        content: content,
        stamp: {
            date: today,
            time: time
        }
    };

    Topic.find({ section: topic }, (err, collection) => {//finding the collection based on the topic
        if (!err) {
            if (collection.length === 0) {//if no collection was found, create a new one
                newTopic = new Topic({
                    section: topic,
                    posts: newPost
                });
                newTopic.save();
            }
            else {
                Topic.findOne(
                    { section: topic }, 
                    (err,result)=>{
                        if(!err){
                            result.posts.push(newPost);//adding the post to collection
                            result.save();
                        }
                    }
                );
               
            }
            res.redirect('/music'); //redirecting to music view to display new post
        }
        else {
            console.log(err);
        }
    });

});

app.post("/music/comments", (req, res) => {
    //getting req information
    const postID=req.body.postID;
    const topic = req.body.topicID;
    const commentID = req.body.commentID;
    const user = req.user;
    const content = req.body.content;
    const date= new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = date.getFullYear();
    const today = mm + '/' + dd + '/' + yyyy;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = hours + ':' + minutes;
    //creating the new comment
    const newComment = {
        author: user,
        content: content,
        target: commentID,
        stamp: {
            date: today,
            time: time
        }
    };
    Topic.findOne({section: topic}, (err, collection)=>{ //finding the collection
        const foundPost = collection.posts.find(post => post.id===postID); //finding the post
        //locating the target
        if(!commentID){
            newComment.target=postID;
        }
        else{
            newComment.target=commentID;
        }
        //adding the comment to post comments
        foundPost.comments.push(newComment);
        collection.save();
    });
    
    
    res.redirect('/music');
});


app.post("/update/:section/:postId", (req,res)=>{
    //getting req information
    const section = req.params.section;
    const postId = req.params.postId;
    const updatedComment = req.body.updatedComment;
    Topic.findOne({section: section}, (err, collection)=>{//finding collection
        const foundPost = collection.posts.find(post => post.id === postId);//finding post
        //updating the post
        foundPost.content = updatedComment;
        collection.save();
        
    })
    res.redirect('/music');
})

app.post("/update/:section/:postId/:commentId", (req,res)=>{
    //getting req information
    const section = req.params.section;
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const updatedComment = req.body.updatedComment;
    Topic.findOne({section: section}, (err, collection)=>{//finding collection
        const foundPost = collection.posts.find(post => post.id === postId);//finding post
        const foundComment = foundPost.comments.find(comment => comment.id === commentId );//finding comment
        //updating comment
        foundComment.content = updatedComment;
        collection.save();
        
    })
    res.redirect('/music');
})


app.get("/delete/:section/:postId", (req,res)=>{
    //getting req information
    const section = req.params.section;
    const postId = req.params.postId;
    Topic.findOne({section:section}, (err,collection)=>{//finding collection
        const newPosts = collection.posts.filter(post=> post.id != postId);//creating array without the deleted post
        //updating posts array 
        collection.posts = newPosts;
        collection.save();
    })
    res.redirect('/music');
});

app.get("/delete/:section/:postId/:commentId", (req,res)=>{
    //getting req information
    const section = req.params.section;
    const postId = req.params.postId;
    const commentId=req.params.commentId;
    Topic.findOne({section:section}, (err,collection)=>{//finding collection
        const foundPost = collection.posts.find(post => post.id === postId);//finding post
        const newComments = foundPost.comments.filter(comment => comment.id != commentId);//creating array without the deleted comment
        //updating comments array
        foundPost.comments = newComments;
        collection.save();
    })
    res.redirect('/music');
});


app.post("/user/username",(req,res)=>{
    if (req.isAuthenticated()){//checking if user is authenticated
        const googleId = req.user.googleId;
        const userName = req.body.userName;
        User.findOne({googleId:googleId},(err, user)=>{//finding the user
            if(user){
                //updating user's username
                user.username = userName;
                user.save();
            }
            else{
                console.log("Error");
            }
        });
        res.redirect('/music');
    }
})

app.listen(3000, (req, res) => {
    console.log("Server Started");
});




