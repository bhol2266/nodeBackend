const express = require("express");
const router = express.Router()
const passport = require("passport");


const { register, login, forgotPassword, verifyOtp, OTP_verfiedLogin, resendOTP, login_success, login_failed, auth_logout, facebook, facebook_cb, google, google_cb } = require('../controller/auth.controller')


//Credentials login auth routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/forgotPassword").post(forgotPassword);
router.route("/verifyOtp").post(verifyOtp);
router.route("/OTP_verfiedLogin").post(OTP_verfiedLogin);
router.route("/resendOTP").post(resendOTP);



//Google, facebook auth routes
router.route("/facebook").get(passport.authenticate('facebook', { scope: 'email' }), facebook);
router.route("/google").get(passport.authenticate('google', { scope: ['email', 'profile'] }), google);
router.route("/auth/facebook/callback").get(passport.authenticate('facebook', { successRedirect: "/user/login/success", failureRedirect: "/user/login/failed", }), facebook_cb);
router.route("/auth/google/callback").get(passport.authenticate("google", { successRedirect: "/user/login/success", failureRedirect: "/user/login/failed", }), google_cb);
router.route("/login/success").get(login_success);
router.route("/login/failed").get(login_failed);
router.route("/auth/logout").get(auth_logout);


module.exports = router

