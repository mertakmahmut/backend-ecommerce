const chatController = require('../controllers/chat/chatController')
const { authMiddleware } = require('../middlewares/authMiddleware')

const router = require('express').Router()

router.post('/chat/customer/add-customer-friend', chatController.add_customer_friend)

module.exports = router