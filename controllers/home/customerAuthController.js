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
                responseReturn(res, 404, {error : 'E-posta mevcut'})
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
                responseReturn(res, 201, { message : "Başarıyla Kayıt Olundu", token})
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    customer_login = async(req, res) => {
        // console.log(req.body)
        const {email , password} = req.body
        try {
            const customer = await customerModel.findOne({email}).select('+password')
            //console.log(admin)
            if (customer) {
                const match = await bcrypt.compare(password, customer.password)
                //console.log(match)
                if (match) {
                    const token = await createToken({
                        id : customer.id,
                        name : customer.name,
                        email : customer.email,
                        method : customer.method
                    })
                    res.cookie('customerToken', token, {
                        expires : new Date(Date.now() + 7*24*60*60*1000)
                    })
                    responseReturn(res, 200, {token, message : "Başarıyla giriş yapıldı"})
                } else {
                    responseReturn(res, 404, {error : "Parola yanlış"})
                } 
            } else {
                responseReturn(res, 404, {error : 'Böyle bir kullanıcı bulunamadı'})
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    customer_logout = async(req, res) => {
        res.cookie('customerToken', "", {
            expires : new Date(Date.now())
        })
        responseReturn(res, 200, {message : "Çıkış yapıldı"})
    }

    change_password_user = async(req, res) => {
        const {email, old_password, new_password} = req.body
        
        try {
            const user = await customerModel.findOne({email}).select('+password')
            if(!user) return res.status(404).json({message : 'Kullanıcı bulunamadı'})

            const isMatch = await bcrypt.compare(old_password, user.password)
            if(!isMatch) return res.status(400).json({message : 'Hatalı eski şifre'})

            user.password = await bcrypt.hash(new_password, 10)
            await user.save()
            res.json({message : 'Şifreniz başarıyla değiştirildi'})

        } catch (error) {
            res.status(500).json({message : 'Server error'})
        }
    }

}
module.exports = new customerAuthController()