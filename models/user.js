const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },
    verified: { type: Boolean, default: false }


}, { collection: "users", useCreateIndex: true, timestamps: true })
const model = mongoose.model('UserSchema', UserSchema)
module.exports = model;