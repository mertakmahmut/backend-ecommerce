const {Schema, model} = require("mongoose");
// Kullanıcının verdiği siparişi içerir. Farklı satıcılardan gelen tüm ürünleri tek sipariş altında toplar. Bu nedenle products dizisi birden fazla satıcıya ait ürün içerebilir.
const customerOrderSchema = new Schema({
customerId: {
    type: Schema.ObjectId,
    required : true
},
products: {
    type: Array,
    required : true
},
price: {
    type: Number,
    required : true  
},     
payment_status: {
    type: String,
    required : true  
},
shippingInfo: {
    type: Object,
    required : true  
},
delivery_status: {
    type: String,
    required : true  
},
date: {
    type: String,
    required : true
} 
},{ timestamps: true })

module.exports = model('customerOrders',customerOrderSchema)