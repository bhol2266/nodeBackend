const express = require("express");
const router = express.Router()
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const User = require('./../models/user');
const RefreshTokenSchema = require('./../models/refreshTokensDB')
const accessTokenExpiry = '300s'
const CLIENT_URL = 'http://localhost:3000/'
const UserOTPVerification = require('./../models/userOTPVerification')
const nodemailer = require('nodemailer');


router.post("/login", async (req, res) => {
    const { email, password } = req.body

    try {

        //User not found
        const userExist = await User.findOne({ email: email })
        if (!userExist) {
            return res.status(401).send({ sucess: false, message: 'User not found' })
        }


        //Incorrect passowrd
        const passwordMatched = await bcrypt.compare(password, userExist.password);
        if (!passwordMatched) {
            return res.status(401).send({ sucess: false, message: 'Passowrd Incorrect' })
        }

        //Not Verfied , Maybe user closed the browser in OTP enter page
        if (!userExist.verified) {
            const sendOTPforVerification = async (email) => {

                let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: true,
                    service: 'Gmail',

                    auth: {
                        user: 'ukdevelopers007@gmail.com',
                        pass: 'mgwazngquiafczws',
                    }

                });

                var otp = Math.floor(1000 + Math.random() * 9000);
                otp = parseInt(otp);

                var mailOptions = {
                    to: email,
                    subject: "Otp for registration is: ",
                    html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
                };

                transporter.sendMail(mailOptions, async (error, info) => {
                    if (error) {
                        return res.status(200).send({ sucess: false, message: error })
                    }

                    var newOTP = { $set: { otp: otp } };
                    var query = { 'email': email };


                    await UserOTPVerification.updateOne(query, newOTP, { upsert: true })

                });
            }
            sendOTPforVerification(email)
            return res.status(200).send({ sucess: true, message: 'OTP Sent' })
        }

        const payload = {
            email: email,
            id: userExist._id
        }


        //After logged in a token is generated, which have to be saved in the  cookie  in browser
        const accessToken = jwt.sign(payload, process.env.ACCESSTOKEN_SECRET_CODE, { expiresIn: accessTokenExpiry })
        const refreshToken = jwt.sign(payload, process.env.REFRESHTOKEN_SECRET_CODE, { expiresIn: '100d' })


        //Saving Refresh token into Mongodb database
        var newRefreshtoken = { $set: { refreshToken: refreshToken } };
        var query = { 'email': email };
        await RefreshTokenSchema.updateOne(query, newRefreshtoken, { upsert: true })


        res.status(200).send({ sucess: true, accountType: "credentials", email: email, accessToken: "Bearer " + accessToken, refreshToken: refreshToken, message: 'Logged In' })
    } catch (error) {
        console.log(error);
    }

});


router.post('/register', async (req, res) => {

    const { name, email, password } = req.body

    const userExist = await User.findOne({ email: email })
    if (userExist) {
        res.status(400).send({ sucess: false, message: 'Already Resgistered' })
        return
    }

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(password, salt)
    const user = new User({ name: name, email: email, password: hashpass })
    await user.save()

    const sendOTPforVerification = async (email) => {

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: true,
            service: 'Gmail',

            auth: {
                user: 'ukdevelopers007@gmail.com',
                pass: 'mgwazngquiafczws',
            }

        });

        var otp = Math.floor(1000 + Math.random() * 9000);
        otp = parseInt(otp);

        var mailOptions = {
            to: email,
            subject: "Otp for registration is: ",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                return res.status(200).send({ sucess: false, message: error })
            }
            console.log(info);
            const saveOTP = new UserOTPVerification({ email: email, otp: otp })
            await saveOTP.save()

            return res.status(200).send({ sucess: true, email: email, name: name, message: 'OTP Sent' })

        });
    }


    sendOTPforVerification(email)



})

router.post('/forgotPassword', async (req, res) => {

    const { email, password } = req.body

    const userExist = await User.findOne({ email: email })
    if (!userExist) {
        res.status(400).send({ sucess: false, message: 'User not found' })
        return
    }

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(password, salt)

    var newPassword = { $set: { password: hashpass } };
    var query = { 'email': email };
    await User.updateOne(query, newPassword, { upsert: true })

    return res.status(200).send({ sucess: true, email: email, message: 'Password Updated' })

})

//OTP stuffs


router.post('/verifyOtp', async (req, res) => {

    const { email, otp } = req.body;
    const otpMatched = await UserOTPVerification.findOne({ otp: otp })

    if (!otpMatched) {
        return res.status(200).send({ sucess: false, message: 'OTP Incorrect' })
    }
    await UserOTPVerification.deleteOne({ otp: otp })


    var query = { 'email': email };
    var newOTP = { $set: { verified: true } };
    await User.updateOne(query, newOTP, { upsert: true })

    return res.status(200).send({ sucess: true, email: email, message: 'OTP Verified' })


})


router.post('/OTP_verfiedLogin', async (req, res) => {

    const { email } = req.body;

    const userID = await User.findOne({ email: email })

    const payload = {
        email: email,
        id: userID._id
    }

    //After logged in a token is generated, which have to be saved in the  cookie  in browser
    const accessToken = jwt.sign(payload, process.env.ACCESSTOKEN_SECRET_CODE, { expiresIn: accessTokenExpiry })
    const refreshToken = jwt.sign(payload, process.env.REFRESHTOKEN_SECRET_CODE, { expiresIn: '100d' })


    //Saving Refresh token into Mongodb database
    var newRefreshtoken = { $set: { refreshToken: refreshToken } };
    var query = { 'email': email };
    await RefreshTokenSchema.updateOne(query, newRefreshtoken, { upsert: true })


    res.status(200).send({ sucess: true, accountType: "credentials", email: email, accessToken: "Bearer " + accessToken, refreshToken: refreshToken, message: 'Logged In' })



})

router.post('/resendOTP', async (req, res) => {
    const { email } = req.body

    const sendOTPforVerification = async (email) => {

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: true,
            service: 'Gmail',

            auth: {
                user: 'ukdevelopers007@gmail.com',
                pass: 'mgwazngquiafczws',
            }

        });

        var otp = Math.floor(1000 + Math.random() * 9000);
        otp = parseInt(otp);

        var mailOptions = {
            to: email,
            subject: "Otp for registration is: ",
            html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                return res.status(200).send({ sucess: false, message: error })
            }
            var newOTP = { $set: { otp: otp } };
            var query = { 'email': email };


            await UserOTPVerification.updateOne(query, newOTP, { upsert: true })
            return res.status(200).send({ sucess: true, message: 'OTP Sent Again!' })

        });
    }

    //User not found
    const userExist = await User.findOne({ email: email })
    if (!userExist) {
        return res.status(401).send({ sucess: false, message: 'User not found' })
    }
    await sendOTPforVerification(email)



})



//Facebook Auth

router.get('/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: "/user/login/success",
    failureRedirect: "/user/login/failed",
}), (req, res) => {
}
);


//  Google Auth

router.get('/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    }
    ));
router.get("/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/user/login/success",
        failureRedirect: "/user/login/failed",
    }), (req, res) => {

    }
);




router.get("/login/success", async (req, res) => {
    if (req.user) {

        const { email, accountType } = req.user;

        const userExist = await User.findOne({ email: email })
        if (!userExist) {
            const salt = await bcrypt.genSalt(10);
            const hashpass = await bcrypt.hash("NOT SET", salt)
            const user = new User({ name: req.user.displayName, email: email, password: hashpass, verified: true })
            await user.save()
        }


        const userID = await User.findOne({ email: email })

        const payload = {
            email: email,
            id: userID._id
        }

        //After logged in a token is generated, which have to be saved in the  cookie  in browser
        const accessToken = jwt.sign(payload, process.env.ACCESSTOKEN_SECRET_CODE, { expiresIn: accessTokenExpiry })
        const refreshToken = jwt.sign(payload, process.env.REFRESHTOKEN_SECRET_CODE, { expiresIn: '100d' })




        //Saving Refresh token into Mongodb database
        var newRefreshtoken = { $set: { refreshToken: refreshToken } };
        var query = { 'email': email };
        await RefreshTokenSchema.updateOne(query, newRefreshtoken, { upsert: true })




        res.cookie('email', email, { maxAge: 900000, httpOnly: false });
        res.cookie('accessToken', "Bearer " + accessToken, { maxAge: 900000, httpOnly: false });
        res.cookie('refreshToken', refreshToken, { maxAge: 900000, httpOnly: false });
        res.redirect(CLIENT_URL)

    }
});

router.get("/login/failed", (req, res) => {
    res.status(401).json({
        success: false,
        message: "Something went wrong!",
    });
});

router.get("/auth/logout", (req, res) => {
    req.logout();
    res.status(400).send({ sucess: true, message: 'Logged Out!' })
});



module.exports = router

