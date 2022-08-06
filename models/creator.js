const mongoose = require('mongoose');
const CreatorSchema = new mongoose.Schema({

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    creator: { name: { type: String, required: true }, creatorID: { type: String, required: true } },//creator name and creatorId
    creatorProducts: [
        {
            productID: { type: String, required: true }, // This ID wil come from youtuber created product objectId

        }
    ]



}, { collection: "users", useCreateIndex: true, timestamps: true })




const model = mongoose.model('CreatorSchema', CreatorSchema)
module.exports = model;