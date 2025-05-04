const {Schema, model} = require("mongoose");
// Her satıcı için ayrı bir kayıt açılır. Bu kayıt, ilgili satıcının müşteriden gelen hangi ürünleri göndermesi gerektiğini içerir. orderId üzerinden customerOrders ile ilişkilidir (bir nevi foreign key gibi).
const authOrderSchema = new Schema({
orderId: {
    type: Schema.ObjectId,
    required : true
},
sellerId: {
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
    type: String,
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

module.exports = model('authorOrders',authOrderSchema)