const router = require('express').Router();
const { authMiddleware } = require('../../middlewares/authMiddleware');
const bankAccountController = require('../../controllers/dashboard//bankAccountController');

router.post('/payment/add-bank-account', authMiddleware, bankAccountController.add_bank_account);

module.exports = router;
