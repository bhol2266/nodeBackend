const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({

    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    role: { type: String },
    password: { type: String },
    verified: { type: Boolean, default: false },
    wishlists: [{ type: String, default: false }], //product objectid
    cart: [{
        productId: { type: String },
        quantity: { type: String },
        color: [
            { name: { type: String }, size: [{ type: String }] }
        ]
    }],

    shippingAddress: [{
        firstName: { type: String },
        lastName: { type: String },
        mobileNumber: { type: String },
        alter_MobileNumber: { type: String },
        state: { type: String },
        pincode: { type: String },
        city: { type: String },
        landmark: { type: String },
        address: { type: String }, // complete address including house number...
    }],
    order: [

        {
            // [{
            //     orderID: { type: String },
            //     productId: { type: String },
            //     quantity: { type: String },
            //     color: [
            //         { name: { type: String }, size: [{ type: String }] }
            //     ],
            //     payment: { type: Boolean },
            //     transactionId: { type: String },
            // }]
        },

    ],

    paymentDetail: [
        {
            orderID: { type: String },
            transactionId: { type: String },
            transactionAmount: { type: String },
            transactionData: { type: String },
        }
    ]


}, { collection: "users", useCreateIndex: true, timestamps: true })
const model = mongoose.model('UserSchema', UserSchema)
module.exports = model;