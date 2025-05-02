const {Schema, model} = require("mongoose");

const cartSchema = new Schema({
    userId: {
        type : Schema.ObjectId,
        required : true
    },
    productId: {
        type : Schema.ObjectId,
        required : true
    },
    quantity: {
        type : Number,
        required : true
    }
})

module.exports = model('cartProducts', cartSchema)