const cartControllers = require('../../controllers/home/cartControllers')

const router = require('express').Router()

router.post('/home/product/add-to-cart', cartControllers.add_to_cart)
router.get('/home/product/get-cart-products/:userId', cartControllers.get_cart_products) 
router.delete('/home/product/delete-cart-product/:cartId', cartControllers.delete_cart_products)

module.exports = router