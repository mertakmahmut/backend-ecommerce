const cartControllers = require('../../controllers/home/cartControllers')

const router = require('express').Router()

router.post('/home/product/add-to-cart', cartControllers.add_to_cart)

module.exports = router