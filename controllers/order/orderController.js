const moment = require("moment")

class orderController {
    place_order = async(req, res) => {
        // console.log(req.body)
        const { price, products, shipping_fee, items, shippingInfo, userId } = req.body
        let authorOrderData = []
        let cartId = []
        const tempDate = moment(Date.now()).format('LLL')
        console.log(tempDate)
    }
}

module.exports = new orderController()