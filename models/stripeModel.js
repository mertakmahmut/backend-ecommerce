const {Schema, model} = require("mongoose");
// Her satıcı için ayrı bir kayıt açılır. Bu kayıt, ilgili satıcının müşteriden gelen hangi ürünleri göndermesi gerektiğini içerir. orderId üzerinden customerOrders ile ilişkilidir (bir nevi foreign key gibi).
const stripeSchema = new Schema({
    sellerId: {
        type: Schema.ObjectId,
        required : true
    },
    stripeId: {
        type: String,
        required : true
    },
    code: {
        type: String,
        required : true
    }
},{ timestamps: true })

module.exports = model('stripe',stripeSchema)