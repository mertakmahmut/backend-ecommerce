const stripeModel = require('../../models/stripeModel')
const {v4: uuidv4} = require('uuid')
const responseReturn = require('../../utils/response')
const stripe = require('stripe')('sk_test_51ROa83PGnGtg4tWmBZekmSAZGDan1ZbCWLiXUJYCdDj1ONsSKjPvmnEamZqEI7Nhn00dhDIBHR0AMLpBw2447K1Z00AXtuo4fH')

class paymentController {
    create_stripe_connect_account = async(req, res) => {
        const id = req
        const uuid = uuidv4()

        try {
            const stripeInfo = await stripeModel.findOne({ sellerId : id})
            if (stripeInfo) {
                await stripeModel.deleteOne({sellerId : id})
                const account = await stripe.accounts.create({type : 'express'})

                const accountLink = await stripe.accountLinks.create({
                    account : account.id,
                    refresh_url : 'http://localhost:3001/refresh',
                    return_url : `http://localhost:3001/success?activeCode=${uuid}`,
                    type : 'account_onboarding'
                })
                await stripeModel.create({
                    sellerId : id,
                    stripeId : account.id,
                    code : uuid
                })
                responseReturn(res, 201, {
                    url : accountLink.url
                }) 
            } else {
                const account = await stripe.accounts.create({type : 'express'})

                const accountLink = await stripe.accountLinks.create({
                    account : account.id,
                    refresh_url : 'http://localhost:3001/refresh',
                    return_url : `http://localhost:3001/success?activeCode=${uuid}`,
                    type : 'account_onboarding'
                })
                await stripeModel.create({
                    sellerId : id,
                    stripeId : account.id,
                    code : uuid
                })
                responseReturn(res, 201, {
                    url : accountLink.url
                }) 
            }

        } catch (error) {
            console.log('stripe connect account error' + error.message)
        }

    } // end method
}

module.exports = new paymentController()