const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const accessTokenExpiry = '300s'
const CLIENT_URL = 'http://localhost:3000/'
const nodemailer = require('nodemailer');
const { checkUserExists_DB, matchOTP_DB, saveOTP_DB, saveUser_DB, updateOTP_DB, updateUser_DB, deleteOTP_DB, update_refreshToken_DB } = require('../db_query/userQuery')


// 200 - Success
// 404- Not Found
// 400 - Error
// 500 - Network Error
// 500 - Network Error



exports.register = async (req, res) => {
    const { name, email, password } = req.body

    console.log(await checkUserExists_DB(email), 'NEXT');
    if (checkUserExists_DB(email)) {
        res.status(400).send({ sucess: false, message: 'Already Resgistered' })
        return
    }

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(password, salt)

    await saveUser_DB(name, email, hashpass, false)
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

            await saveOTP_DB(email, otp)
            return res.status(200).send({ sucess: true, email: email, name: name, message: 'OTP Sent' })

        });
    }


    sendOTPforVerification(email)
}


exports.login = async (req, res) => {
    const { email, password } = req.body

    try {
        //User not found
        const userExist = await checkUserExists_DB(email)
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

                    await updateOTP_DB(email, otp)

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
        var query = { 'email': email };
        var update = { $set: { refreshToken: refreshToken } };
        await update_refreshToken_DB(query, update)


        res.status(200).send({ sucess: true, accountType: "credentials", email: email, accessToken: "Bearer " + accessToken, refreshToken: refreshToken, message: 'Logged In' })
    } catch (error) {
        console.log(error);
    }
}


exports.forgotPassword = async (req, res) => {
    const { email, password } = req.body

    if (!checkUserExists_DB(email)) {
        res.status(400).send({ sucess: false, message: 'User not found' })
        return
    }

    const salt = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(password, salt)

    var query = { 'email': email };
    var update = { $set: { password: hashpass } };
    await updateUser_DB(query, update)

    return res.status(200).send({ sucess: true, email: email, message: 'Password Updated' })

}


exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!matchOTP_DB(otp)) {
        return res.status(200).send({ sucess: false, message: 'OTP Incorrect' })
    }

    //After verified delete the otp from DB
    await deleteOTP_DB(otp)

    var query = { 'email': email };
    var update = { $set: { verified: true } };
    await updateUser_DB(query, update)

    return res.status(200).send({ sucess: true, email: email, message: 'OTP Verified' })

}


exports.OTP_verfiedLogin = async (req, res) => {
    const { email } = req.body;

    const userID = await checkUserExists_DB(email)

    const payload = {
        email: email,
        id: userID._id
    }

    //After logged in a token is generated, which have to be saved in the  cookie  in browser
    const accessToken = jwt.sign(payload, process.env.ACCESSTOKEN_SECRET_CODE, { expiresIn: accessTokenExpiry })
    const refreshToken = jwt.sign(payload, process.env.REFRESHTOKEN_SECRET_CODE, { expiresIn: '100d' })

    //Saving Refresh token into Mongodb database
    var query = { 'email': email };
    var update = { $set: { refreshToken: refreshToken } };
    await update_refreshToken_DB(query, update)


    res.status(200).send({ sucess: true, accountType: "credentials", email: email, accessToken: "Bearer " + accessToken, refreshToken: refreshToken, message: 'Logged In' })


}


exports.resendOTP = async (req, res) => {
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

            await updateOTP_DB(email, otp)
            return res.status(200).send({ sucess: true, message: 'OTP Sent Again!' })

        });
    }

    //User not found
    const userExist = await checkUserExists_DB(email)
    if (!userExist) {
        return res.status(401).send({ sucess: false, message: 'User not found' })
    }
    await sendOTPforVerification(email)


}




exports.facebook = async (req, res) => {

}
exports.facebook_cb = async (req, res) => {

}

exports.google = async (req, res) => {

}
exports.google_cb = async (req, res) => {

}


//Facebook, Google, for both same route for success and failed and logout
exports.login_success = async (req, res) => {
    if (req.user) {

        const { email, accountType } = req.user;

        const userExist = await checkUserExists_DB(email)
        if (!userExist) {
            const salt = await bcrypt.genSalt(10);
            const hashpass = await bcrypt.hash("NOT SET", salt)

            await saveUser_DB(req.user.displayName, email, hashpass, true)
        }

        const payload = {
            email: email,
            id: userExist._id
        }

        //After logged in a token is generated, which have to be saved in the  cookie  in browser
        const accessToken = jwt.sign(payload, process.env.ACCESSTOKEN_SECRET_CODE, { expiresIn: accessTokenExpiry })
        const refreshToken = jwt.sign(payload, process.env.REFRESHTOKEN_SECRET_CODE, { expiresIn: '100d' })


        //Saving Refresh token into Mongodb database
        var query = { 'email': email };
        var update = { $set: { refreshToken: refreshToken } };
        await update_refreshToken_DB(query, update)


        res.cookie('email', email, { maxAge: 900000, httpOnly: false });
        res.cookie('accessToken', "Bearer " + accessToken, { maxAge: 900000, httpOnly: false });
        res.cookie('refreshToken', refreshToken, { maxAge: 900000, httpOnly: false });
        res.redirect(CLIENT_URL)

    }
}


exports.login_failed = async (req, res) => {
    res.status(401).json({
        success: false,
        message: "Something went wrong!",
    });

}

exports.auth_logout = async (req, res) => {
    req.logout();
    res.status(400).send({ sucess: true, message: 'Logged Out!' })
}






