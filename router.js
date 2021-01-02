let express = require('express');
let { requiresAuth } = require('express-openid-connect');
let imgur = require('imgur');
let mongoose = require('mongoose');
var router = express.Router();

imgur.setAPIUrl('https://api.imgur.com/3/');

// Mongoose Models
let Thing = require('./models/things.js');

// Locals used in multiple pages
router.use((req, res, next) => {
    res.locals.isAuthenticated = req.oidc.isAuthenticated();
    res.locals.activeRoute = req.originalUrl;
    res.locals.user = req.oidc.isAuthenticated() ? req.oidc.user.name : '';
    res.locals.userId = req.oidc.isAuthenticated() ? req.oidc.user.sub : '';
    res.locals.userPicture = req.oidc.isAuthenticated() ? req.oidc.user.picture : '';
    next(); 
});

// Auth0 Sign-In Route
router.get('/login/:page?', (req, res) => {
    let page = req.params == "/" ? req.params : "/profile";

    res.oidc.login({
        returnTo: page
    });

    user = req.oidc.isAuthenticated() ? req.oidc.user.name : '';
    userId = req.oidc.isAuthenticated() ? req.oidc.user.sub : '';
});

// Auth0 Sign-Up Route
router.get('/sign-up/:page?', (req, res) => {
    let page = req.params == "/" ? req.params : "/profile";

    res.oidc.login({
        returnTo: page,
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});

// Auth0 Sign-Out Route
router.get('/logout/:page', (req, res) => {    
    res.oidc.logout({
        returnTo: '/',
    });
});

// Helper Route - returns current username and Auth0 ID
router.get('/currentUser', requiresAuth(), (req, res) => {
    res.status(200).json({
        userId: res.locals.userId,
        userName: res.locals.user,
        picture: res.locals.userPicture
    });
})

// Landing Page Route
router.get('/', (req, res) => {
    res.render("landing.html");
});

// Profile Page Route
router.get('/profile', requiresAuth(), (req, res) => {
    res.render("profile.html");
});

// User's Things Page Route 
router.get('/things', requiresAuth(), (req, res) => {
    Thing.find({user: req.oidc.user.sub}).populate('Users').exec(function(err, things) {
        if (err) throw err;
        res.render("things.html", {data: things});
    });
});

// Helper Route - Get JSON Data for a specific Thing
router.get("/getOneThing", requiresAuth(), (req, res) => {
    let itemId = req.query.itemId;

    Thing.findById(itemId).populate('Users').exec(function(err, thing) {
        if (err) throw err;
        if (thing.user != res.locals.userId) {
            res.status(401).send("Provided User ID does not match user ID in item.")
        } else {
            res.status(200).json(thing);
        }
    });
})

// Helper Route - Add Thing 
router.post('/addThing', requiresAuth(), async (req, res, next) => {
    let imgBase64 = req.body.imageB64;
    let imgUrl = "";
    
    // If the user has provided an image, upload it to Imgur and return the URL. 
    if (imgBase64 != undefined && imgBase64 != "" && imgBase64 != null) {
        console.log("Attempting to upload to imgur.")
        await imgur.uploadBase64(imgBase64).then(function (json) {
            imgUrl = json.data.link
            console.log("URL is " + imgUrl);
        }).catch(err => {
            next(err);
            return; // prevent continued execution
        });
    };

    let newThing = Thing({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        date: req.body.date,
        imageUrl: imgUrl,
        user: res.locals.userId
    });
    newThing.save((err) => {
        if (err) next(err);
        // Send all values aside from userId
        res.status(200).json({
            _id: newThing._id,
            name: newThing.name,
            price: newThing.price,
            description: newThing.description,
            date: newThing.date,
            imageUrl: newThing.imageUrl
        });
    });
});

// Helper Route - Delete Thing
router.delete('/deleteThing', requiresAuth(), (req, res, next) => {
    Thing.deleteOne({_id: new mongoose.Types.ObjectId(req.body.id)}).exec((err) => {
        if (err) {
            console.log(error);
            next(err);
        }
    });
    res.status(200).send();
});

// Catch-All / 404 Page
router.get("*", (req, res) => {
    res.status(404).render("404.html");
})

module.exports = router;