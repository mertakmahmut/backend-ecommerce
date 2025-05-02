const customerModel = require("../../models/customerModel")
const { responseReturn } = require('../../utils/response')
const bcrypt = require('bcrypt')
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel")
const { createToken } = require('../../utils/tokenCreate')

class customerAuthController {
    customer_register = async(req, res) => {
        // console.log(req.body)
        const {name, email, password} = req.body

        try {
            const customer = await customerModel.findOne({email})
            if (customer) {
                responseReturn(res, 404, {error : 'Email Already Exists'})
            } else {
                const createCustomer = await customerModel.create({
                    name : name.trim(),
                    email : email.trim(),
                    password : await bcrypt.hash(password, 10),
                    method : 'manually'
                })
                await sellerCustomerModel.create({
                    myId : createCustomer.id
                })
                const token = await createToken({
                    id : createCustomer.id,
                    name : createCustomer.name,
                    email : createCustomer.email,
                    method : createCustomer.method
                })
                res.cookie('customerToken', token, {
                    expires : new Date(Date.now() + 7*24*60*60*1000)
                })
                responseReturn(res, 201, { message : "User Register Success", token})
            }
        } catch (error) {
            console.log(error.message)
        }
    }
}

module.exports = new customerAuthController()