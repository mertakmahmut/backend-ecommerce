const moment = require("moment")

class orderController {
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
            
        } catch (error) {
            
        }

    }
}

module.exports = new orderController()