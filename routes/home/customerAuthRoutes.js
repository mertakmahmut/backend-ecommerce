const customerAuthController = require('../../controllers/home/customerAuthController')
const { authMiddleware } = require('../../middlewares/authMiddleware')

const router = require('express').Router()

router.post('/customer/customer-register', customerAuthController.customer_register)
router.post('/customer/customer-login', customerAuthController.customer_login)
router.get('/customer/logout', customerAuthController.customer_logout)
router.post('/customer/change-password',authMiddleware, customerAuthController.change_password_user)

module.exports = router