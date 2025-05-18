const stripeModel = require('../../models/stripeModel')
const sellerModel = require('../../models/sellerModel')
const sellerWallet = require('../../models/sellerWallet')
const withdrawRequest = require('../../models/withdrawRequest')
const {v4: uuidv4} = require('uuid')
const {responseReturn} = require('../../utils/response')
const { mongo: {ObjectId}} = require('mongoose')
const stripe = require('stripe')('sk_test_51ROa83PGnGtg4tWmBZekmSAZGDan1ZbCWLiXUJYCdDj1ONsSKjPvmnEamZqEI7Nhn00dhDIBHR0AMLpBw2447K1Z00AXtuo4fH')

class paymentController {
    create_stripe_connect_account = async(req, res) => {
        const {id} = req
        const uid = uuidv4()

        try {
            const stripeInfo = await stripeModel.findOne({ sellerId : id})
            if (stripeInfo) {
                await stripeModel.deleteOne({sellerId : id})
                const account = await stripe.accounts.create({type : 'express'})

                const accountLink = await stripe.accountLinks.create({
                    account : account.id,
                    refresh_url : 'http://localhost:3001/refresh',
                    return_url : `http://localhost:3001/success?activeCode=${uid}`,
                    type : 'account_onboarding'
                })
                await stripeModel.create({
                    sellerId : id,
                    stripeId : account.id,
                    code : uid
                })
                responseReturn(res, 201, {
                    url : accountLink.url
                }) 
            } else {
                const account = await stripe.accounts.create({type : 'express'})

                const accountLink = await stripe.accountLinks.create({
                    account : account.id,
                    refresh_url : 'http://localhost:3001/refresh',
                    return_url : `http://localhost:3001/success?activeCode=${uid}`,
                    type : 'account_onboarding'
                })
                await stripeModel.create({
                    sellerId : id,
                    stripeId : account.id,
                    code : uid
                })
                responseReturn(res,201,{url:accountLink.url })
            }

        } catch (error) {
            console.log('stripe connect account error ' + error.message)
        }

    } // end method

    active_stripe_connect_account = async(req, res) => {
        const {activeCode} = req.params
        const {id} = req

        try {
            const userStripeInfo = await stripeModel.findOne({code : activeCode})

            if (userStripeInfo) {
                await sellerModel.findById(id, {
                    payment : 'active'
                })
                responseReturn(res, 200, {message : 'Ödeme aktif'})
            } else {
                responseReturn(res, 404, {message : 'Ödeme Aktif Başarısız oldu'})
            }
        } catch (error) {
            responseReturn(res, 500, {message : 'Internal Server Error'})
        }
    }

    sumAmount = (data) => {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum = sum + data[i].amount;            
        }
        return sum
    }

    get_seller_payment_details = async (req, res) => {
    const {sellerId} = req.params
    
    try {
        const payments = await sellerWallet.find({ sellerId }) 

        const pendingWithdraws = await withdrawRequest.find({
            $and: [
                {
                    sellerId: {
                        $eq: sellerId
                    }
                },
                {
                    status: {
                        $eq: 'pending'
                    }
                }
            ]
        })

        const successWithdraws = await withdrawRequest.find({
            $and: [
                {
                    sellerId: {
                        $eq: sellerId
                    }
                },
                {
                    status: {
                        $eq: 'success'
                    }
                }
            ]
        })

        const pendingAmount = this.sumAmount(pendingWithdraws)
        const withdrawAmount = this.sumAmount(successWithdraws)
        const totalAmount = this.sumAmount(payments)

        let availableAmount = 0;

        if (totalAmount > 0) {
            availableAmount = totalAmount - (pendingAmount + withdrawAmount)
        }

        responseReturn(res, 200,{
            totalAmount,
            pendingAmount,
            withdrawAmount,
            availableAmount,
            pendingWithdraws,
            successWithdraws 
        })
        
    } catch (error) {
        console.log(error.message)
    } 
     
    }

    withdrawal_request = async(req, res) => {
        const {sellerId, amount} = req.body
        try {
            const withdrawal = withdrawRequest.create({
                sellerId,
                amount : parseInt(amount)
            })

            responseReturn(res, 200, {
                withdrawal,
                message : 'Para çekme talebi gönderildi'
            })


        } catch (error) {
            responseReturn(res, 500, {
                message : 'Internal Server Error'
            })
        }
    }

    get_payment_request = async(req, res) => {
        try {
            const withdrawalRequest = await withdrawRequest.find({
                status : 'pending'
            })

            responseReturn(res, 200, {withdrawalRequest})

        } catch (error) {
            responseReturn(res, 500, {
                message : 'Internal Server Error'
            })
        }
    }

    payment_request_confirm = async(req, res) => {
        const {paymentId} = req.body
        console.log(paymentId)
        try {
            const payment = await withdrawRequest.findById(paymentId)
            const {stripeId} = await stripeModel.findOne({
                sellerId: new ObjectId(payment.sellerId)
            })

            await stripe.transfers.create({
                amount: payment.amount * 100,
                currency: 'usd',
                destination: stripeId
            })
             
            await withdrawRequest.findByIdAndUpdate(paymentId, {status: 'success'})
            responseReturn(res, 200, {payment, message: 'Para çekme talebi onaylandı'})
        } catch (error) {
            console.log(error)
            responseReturn(res, 500,{ message: 'Internal Server Error'})
        }
    }
}

module.exports = new paymentController()