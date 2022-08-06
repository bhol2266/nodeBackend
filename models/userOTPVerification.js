
const mongoose = require('mongoose');


const UserOTPVerificationSchema = new mongoose.Schema({

    email: { type: String, required: true, unique: true },

    otp: { type: String, required: true },


}, { collection: "otp" });

const UserOTPVerification = mongoose.model('UserOTPVerification', UserOTPVerificationSchema)
module.exports = UserOTPVerification;