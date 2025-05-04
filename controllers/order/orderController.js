const moment = require("moment")
const authOrderModel = require('../../models/authOrderModel')
const customerOrderModel = require('../../models/customerOrderModel')
const cartModel = require('../../models/cartModel')
const { responseReturn } = require('../../utils/response')

class orderController {

    paymentCheck = async (id) => {
        try {
            const order = await customerOrderModel.findById(id)
            if (order.payment_status == 'unpaid') {
                await customerOrderModel.findByIdAndUpdate(id, {
                    delivery_status: 'cancelled'
                })
                await authOrderModel.updateMany({
                    orderId: id
                },{
                    delivery_status: 'cancelled'
                })
            }
            return true
        } catch (error) {
            console.log(error)
        }
    }

    place_order = async(req, res) => {
        // console.log(req.body)
        const { price, products, shipping_fee, items, shippingInfo, userId } = req.body
        let authorOrderData = []
        let cartId = []
        const tempDate = moment(Date.now()).format('LLL')
        
        let customerOrderProduct = []

        for (let i = 0; i < products.length; i++) {
            const pro = products[i].products; // getting products inside the products(you can understand clearly by this command: console.log(req.body))
            for (let j = 0; j < pro.length; j++) {
                const tempCusPro = pro[j].productInfo;
                // console.log(tempCusPro)
                tempCusPro.quantity = pro[j].quantity
                customerOrderProduct.push(tempCusPro)
                if(pro[j]._id) {
                    cartId.push(pro[j]._id)
                }
            }
        }
        // console.log(customerOrderProduct)
        // console.log(cartId)

        try {
            const order = await customerOrderModel.create({
                customerId : userId, 
                shippingInfo,
                products : customerOrderProduct,
                price : price + shipping_fee,
                payment_status : 'unpaid',
                delivery_status : 'pending',
                date : tempDate

            })

            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products;
                const pri = products[i].price
                const sellerId = products[i].sellerId
                let storePro = []
                for (let j = 0; j < pro.length; j++) {
                    const tempPro = pro[j].productInfo;
                    tempPro.quantity = pro[j].quantity
                    storePro.push(tempPro)
                }
                authorOrderData.push({
                    orderId : order.id, sellerId,
                    products : storePro,
                    price : pri,
                    payment_status : 'unpaid',
                    shippingInfo : 'QuickCart Warehouse',
                    delivery_status : 'pending',
                    date : tempDate
                })
            }

            await authOrderModel.insertMany(authorOrderData)

            for (let k = 0; k < cartId.length; k++) {
                await cartModel.findByIdAndDelete(cartId[k])
            }

            setTimeout(() => {
                this.paymentCheck(order.id)
            }, 15000)

            responseReturn(res, 200, {message : "Order Placed Successfully", orderId : order.id})

        } catch (error) {
            console.log(error.message)
        }

    }
}

module.exports = new orderController()