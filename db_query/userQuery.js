const User = require('./../models/user');
const UserOTPVerification = require('./../models/userOTPVerification')
const RefreshTokenSchema = require('./../models/refreshTokensDB')


exports.checkUserExists_DB = async function (email) {
    const userExist = await User.findOne({ email: email })
    console.log(userExist);
    return userExist
}

exports.saveUser_DB = async function (name, email, hashpass, verified) {
    const user = new User({ name: name, email: email, password: hashpass, verified: verified })
    await user.save()

}

exports.updateUser_DB = async function (query, update) {
    await User.updateOne(query, update, { upsert: true })
}




exports.saveOTP_DB = async function (email, otp) {
    const saveOTP = new UserOTPVerification({ email: email, otp: otp })
    await saveOTP.save()

}

exports.updateOTP_DB = async function (email, otp) {
    var newOTP = { $set: { otp: otp } };
    var query = { 'email': email };

    await UserOTPVerification.updateOne(query, newOTP, { upsert: true })

}


exports.matchOTP_DB = async function (otp) {
    const otpMatched = await UserOTPVerification.findOne({ otp: otp })
    if (otpMatched) {
        return true
    } else {
        return false
    }

}

exports.deleteOTP_DB = async function (otp) {
    await UserOTPVerification.deleteOne({ otp: otp })
}

exports.update_refreshToken_DB = async function (query, update) {
    await RefreshTokenSchema.updateOne(query, update, { upsert: true })
}


