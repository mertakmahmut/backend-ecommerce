const cartControllers = require('../../controllers/home/cartControllers')

const router = require('express').Router()

router.post('/home/product/add-to-cart', cartControllers.add_to_cart)
router.post('/home/product/add-to-wishlist', cartControllers.add_to_wishlist)
router.get('/home/product/get-cart-products/:userId', cartControllers.get_cart_products)
router.get('/home/product/get-wishlist-products/:userId', cartControllers.get_wishlist_products)
router.delete('/home/product/delete-cart-product/:cartId', cartControllers.delete_cart_products)
router.delete('/home/product/remove-wishlist/:wishlistId', cartControllers.remove_wishlist)
router.put('/home/product/quantity-inc/:cartId', cartControllers.quantity_inc)
router.put('/home/product/quantity-dec/:cartId', cartControllers.quantity_dec)

module.exports = router