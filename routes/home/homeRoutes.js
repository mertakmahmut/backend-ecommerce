const homeControllers = require('../../controllers/home/homeControllers')

const router = require('express').Router()

router.get('/get-categories', homeControllers.get_categories)
router.get('/get-products', homeControllers.get_products)
router.get('/price-range-latest-product', homeControllers.price_range_product)

module.exports = router