const mongoose = require('mongoose');
const RefreshTokenSchema = new mongoose.Schema({

    email: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true, unique: true },


}, { collection: "refreshTokens", useCreateIndex: true, timestamps: false , },)

const model = mongoose.model('RefreshTokenSchema', RefreshTokenSchema)
module.exports = model;



// 5184000