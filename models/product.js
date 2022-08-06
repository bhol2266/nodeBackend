const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({

    productId: { type: String, required: true },
    title: { type: String, required: true },
    imagePath: { type: String, required: true },
    mrp: { type: String, required: true },
    discountAmount: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, required: true },
    manufacturer: { type: String, required: true },
    availibility: { type: Boolean, required: true },
    creator: { type: String, required: true },//creator name and creatorId
    color: [
        { name: { type: String, required: true }, size: [{ type: String, required: true }] }
    ],
    description: { type: String, required: true },
    // review , rating  , comment, pictures uploaded by user ,user details, date, location



}, { collection: "products", useCreateIndex: true, timestamps: true })
const model = mongoose.model('ProductSchema', ProductSchema)
module.exports = model;