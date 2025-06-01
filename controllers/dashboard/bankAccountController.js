const bankAccountModel = require('../../models/bankAccountModel');
const sellerModel = require('../../models/sellerModel');
const { responseReturn } = require('../../utils/response');

const add_bank_account = async (req, res) => {
    const { id: sellerId } = req; // authMiddleware'den gelen ID
    const { bankName, accountHolderName, IBAN, note } = req.body;

    try {
        const exists = await bankAccountModel.findOne({ sellerId });
        if (exists) {
            return responseReturn(res, 400, { message: 'Zaten banka bilgisi mevcut.' });
        }
        console.log('selam')

        await bankAccountModel.create({
            sellerId,
            bankName,
            accountHolderName,
            IBAN,
            note
        });

        await sellerModel.findByIdAndUpdate(sellerId, {
            payment: 'active'
        });

        return responseReturn(res, 201, { message: 'Banka bilgileri eklendi ve ödeme durumu aktif edildi.' });

    } catch (error) {
        console.error(error);
        return responseReturn(res, 500, { message: 'Bir hata oluştu.' });
    }
};

module.exports = { add_bank_account };
