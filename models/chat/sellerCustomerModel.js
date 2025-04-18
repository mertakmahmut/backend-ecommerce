const {Schema, model} = require("mongoose");

const sellerCustomerScheme = new Schema({
    myId: {
        type : String,
        required : true
    },
    myFriends: {
        type : Array,
        default : []
    },
}, {timestamps : true})

module.exports = model('seller_customers', sellerCustomerScheme)