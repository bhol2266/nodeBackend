
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const app = process.env.PORT || 5000;
var express_Session = require('express-session')
const jwt = require('jsonwebtoken');
const RefreshTokenSchema = require('./models/refreshTokensDB')
const accessTokenExpiry = '300s'
const CLIENT_URL = 'http://localhost:3000/'
const UserOTPVerification = require('./models/userOTPVerification')
//----------------------------------------- END OF IMPORTS---------------------------------------------------
mongoose.connect(
    "mongodb+srv://bhola:IyNs48Pf1SNHUWpu@cluster0.acjho.mongodb.net/closm?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log("Mongoose Is Connected");
    }
);

// Middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("*", cors());
app.use(cors());



app.use(express_Session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))
app.use(passport.initialize());
app.use(passport.session());

require("./middlewares/passport_JWT");
require("./middlewares/passport_AUTH");

//----------------------------------------- END OF MIDDLEWARE---------------------------------------------------


//This route is for login stuffs
const userRoute = require('./routes/user')
app.use('/user', userRoute)





app.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {

    //In this route JWT token which is passed in Authorization header is verified whether that token contains the information(email,_id) 
    // of any registered users or not,if found the user is returned in the req.user object ,if not found the token passed is incorrect
    const { email, _id } = req.user;
    res.status(200).send({ sucess: true, _id, email, message: 'Got Access!' })
})


// Call everytime before calling any api;
app.get("/refresh", async (req, res) => {
    const refreshToken = req.headers.authorization;

    const refreshTokenExists = await RefreshTokenSchema.findOne({ refreshToken: refreshToken })
    if (!refreshTokenExists) return res.json({ message: "Refresh token not found, login again" });


    // If the refresh token is valid, create a new accessToken and return it.
    jwt.verify(refreshToken, process.env.REFRESHTOKEN_SECRET_CODE, (err, user) => {
        if (!err) {
            const payload = {
                email: user.email,
                id: user.id
            }
            const accessToken = jwt.sign(payload, process.env.ACCESSTOKEN_SECRET_CODE, {
                expiresIn: accessTokenExpiry
            });
            res.status(200).send({ sucess: true, accessToken: "Bearer " + accessToken, message: 'Token Refreshed' })
        } else {
            return res.json({
                success: false,
                message: "Invalid refresh token"
            });
        }
    });
});









// -----------------------------------------------------------------------------

// START THE SERVER 
app.listen(port, function () {
    console.log(`The Application Started Sucessfully at port: ${port}`);
});

