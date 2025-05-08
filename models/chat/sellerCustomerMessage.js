const {Schema, model} = require("mongoose");

const sellerCustomerMsgSchema = new Schema({
    senderName: {
        type : String,
        required : true
    },
    senderId: {
        type : String,
        required : true
    },
    receiverId: {
        type : String,
        required : true
    },
    message: {
        type : String,
        required : true
    },
    status: {
        type : Array,
        default : 'unseen'
    },
}, {timestamps : true})

module.exports = model('seller_customers_msg', sellerCustomerMsgSchema)