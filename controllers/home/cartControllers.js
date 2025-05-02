const cartModel = require("../../models/cartModel")
const { responseReturn } = require('../../utils/response')

class cartControllers {
    add_to_cart = async(req, res) => {
        // console.log(req.body)
        const {userId, productId, quantity} = req.body
        try {
            const product = await cartModel.findOne({
                $and: [{
                    productId : {
                        $eq : productId
                    }
                },
                {
                    userId : {
                        $eq : userId
                    }
                }
            ]
            })

            if (product) {
                responseReturn(res, 404, {error : "Product Already Added to Cart"})
            } else {
                const product = await cartModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseReturn(res, 201, {message : "Added to Cart Successfully", product})
            }

        } catch (error) {
            console.log(error.message)
        }
    }

}

module.exports = new cartControllers()