const moment = require("moment")
const authOrderModel = require('../../models/authOrderModel')
const customerOrderModel = require('../../models/customerOrderModel')
const cartModel = require('../../models/cartModel')
const myShopWallet = require('../../models/myShopWallet')
const sellerWallet = require('../../models/sellerWallet')
const { responseReturn } = require('../../utils/response')
const { mongo: {ObjectId}} = require('mongoose')
const stripe = require('stripe')('sk_test_51ROa83PGnGtg4tWmBZekmSAZGDan1ZbCWLiXUJYCdDj1ONsSKjPvmnEamZqEI7Nhn00dhDIBHR0AMLpBw2447K1Z00AXtuo4fH')


class orderController { // Hem müşteri hem satıcı siparişini ayrı tabloda tutman veri yönetimini kolaylaştırır.

    paymentCheck = async (id) => { // Bu fonksiyon, ödeme yapılmamışsa siparişi iptal eder. Yani hem müşterinin siparişi hem de tüm ilgili satıcı siparişleri iptal edilir. Gerçek dünyada bu kontrol genelde ödeme servisinden gelen webhook ile yapılır ama senin geçici çözümün gayet mantıklı test ortamı için.
        try {
            const order = await customerOrderModel.findById(id)
            if (order.payment_status == 'unpaid') {
                await customerOrderModel.findByIdAndUpdate(id, {
                    delivery_status: 'cancelled'
                })
                await authOrderModel.updateMany({
                    orderId: id
                },{
                    delivery_status: 'cancelled'
                })
            }
            return true
        } catch (error) {
            console.log(error)
        }
    }

    place_order = async(req, res) => {
        // console.log(req.body)
        const { price, products, shipping_fee, items, shippingInfo, userId } = req.body // Frontend'den gelen veri alınır
        let authorOrderData = [] // Satıcılara özel siparişler bu dizide toplanır.
        let cartId = [] // Sipariş sonrası silinecek sepet ürünlerinin ID’leri.
        const tempDate = moment(Date.now()).format('LLL')
        
        let customerOrderProduct = []
        // Amaç: customerOrders tablosu için tüm ürünleri tek bir yerde toplamak.
        for (let i = 0; i < products.length; i++) {
            const pro = products[i].products; // getting products inside the products(you can understand clearly by this command: console.log(req.body))
            for (let j = 0; j < pro.length; j++) {
                const tempCusPro = pro[j].productInfo;
                // console.log(tempCusPro)
                tempCusPro.quantity = pro[j].quantity
                customerOrderProduct.push(tempCusPro)
                if(pro[j]._id) {
                    cartId.push(pro[j]._id)
                }
            }
        }
        // console.log(customerOrderProduct)
        // console.log(cartId)

        try {
            const order = await customerOrderModel.create({ // customerOrders tablosuna kayıt yapılır: Bu işlem tamamlandıktan sonra artık sipariş oluşturulmuş sayılır.
                customerId : userId, 
                shippingInfo,
                products : customerOrderProduct,
                price : price + shipping_fee,
                payment_status : 'unpaid',
                delivery_status : 'pending',
                date : tempDate

            })

            for (let i = 0; i < products.length; i++) { // Satıcıya özel sipariş kayıtları hazırlanır ve kaydedilir: Yani her satıcı için ayrı bir kayıt oluşturuluyor. Böylece satıcılar sadece kendi ürünlerini görür.
                const pro = products[i].products;
                const pri = products[i].price
                const sellerId = products[i].sellerId
                let storePro = []
                for (let j = 0; j < pro.length; j++) {
                    const tempPro = pro[j].productInfo;
                    tempPro.quantity = pro[j].quantity
                    storePro.push(tempPro)
                }
                authorOrderData.push({
                    orderId : order.id, sellerId,
                    products : storePro,
                    price : pri,
                    payment_status : 'unpaid',
                    shippingInfo : 'Genel Merkez',
                    delivery_status : 'pending',
                    date : tempDate
                })
            }

            await authOrderModel.insertMany(authorOrderData)

            for (let k = 0; k < cartId.length; k++) { // Sipariş edilen ürünler sepetten silinir: Bu işlem kullanıcı açısından “artık sepetim boş” anlamına gelir.
                await cartModel.findByIdAndDelete(cartId[k])
            }

            setTimeout(() => { // 15 saniye sonra ödeme durumu kontrol edilir.
                this.paymentCheck(order.id)
            }, 180000)

            responseReturn(res, 200, {message : "Sipariş başarıyla gerçekleştirildi", orderId : order.id})

        } catch (error) {
            console.log(error.message)
        }

    }

    get_customer_dashboard_data = async(req, res) => {
        const { userId } = req.params
        try {
            const recentOrders = await customerOrderModel.find({
                customerId : new ObjectId(userId)
            }).limit(5)
            const pendingOrders = await customerOrderModel.find({
                customerId : new ObjectId(userId),
                delivery_status : 'pending'
            }).countDocuments()
            const cancelledOrders = await customerOrderModel.find({
                customerId : new ObjectId(userId),
                delivery_status : 'cancelled'
            }).countDocuments()
            const totalOrder = await customerOrderModel.find({
                customerId : new ObjectId(userId)
            }).countDocuments()

            responseReturn(res, 200, {
                recentOrders,
                pendingOrders,
                cancelledOrders,
                totalOrder
            })

        } catch (error) {
            console.log(error.message)
        }
    }

    get_orders = async(req, res) => {
        const {customerId, status} = req.params
        try {
            let orders = []
            if (status != 'all') {
                orders = await customerOrderModel.find({
                    customerId : new ObjectId(customerId),
                    delivery_status : status
                })
            } else {
                orders = await customerOrderModel.find({
                    customerId : new ObjectId(customerId)
                })
            }
            responseReturn(res, 200, {
                orders
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    get_order_details = async(req, res) => {
        const {orderId} = req.params
        
        try {
            const order = await customerOrderModel.findById(orderId)
            responseReturn(res,200, {
                order
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }

    get_admin_orders = async(req, res) => {
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage= parseInt(parPage)
    
        const skipPage = parPage * (page - 1)
    
        try {
            if (searchValue) {
                
            } else {
                const orders = await customerOrderModel.aggregate([
                    {
                        $lookup: {
                            from: 'authororders',
                            localField: "_id",
                            foreignField: 'orderId',
                            as: 'suborder'
                        }
                    }
                ]).skip(skipPage).limit(parPage).sort({ createdAt: -1})
    
                const totalOrder = await customerOrderModel.aggregate([
                    {
                        $lookup: {
                            from: 'authororders',
                            localField: "_id",
                            foreignField: 'orderId',
                            as: 'suborder'
                        }
                    }
                ])
    
                responseReturn(res,200, { orders, totalOrder: totalOrder.length })
            }
        } catch (error) {
            console.log(error.message)
        } 
    
    }

    get_admin_order = async (req, res) => {
    const { orderId } = req.params
    try {
        const order = await customerOrderModel.aggregate([
            {
                $match: {_id: new ObjectId(orderId)}
            },
            {
                $lookup: {
                    from: 'authororders',
                    localField: "_id",
                    foreignField: 'orderId',
                    as: 'suborder'
                }
            }
        ])
        responseReturn(res,200, { order: order[0] })
    } catch (error) {
        console.log('get admin order details' + error.message)
    }
    }

    admin_order_status_update = async(req, res) => {
        const { orderId } = req.params
        const { status } = req.body
    
        try {
            await customerOrderModel.findByIdAndUpdate(orderId, {
                delivery_status : status
            })
            responseReturn(res,200, {message: 'Sipariş durumu başarıyla değiştirildi'})
        } catch (error) {
            console.log('get admin status error' + error.message)
            responseReturn(res,500, {message: 'internal server error'})
        }
         
    }

    get_seller_orders = async (req,res) => {
        const {sellerId} = req.params
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage= parseInt(parPage)

        const skipPage = parPage * (page - 1)

        try {
            if (searchValue) {
                
            } else {
                const orders = await authOrderModel.find({
                    sellerId,
                }).skip(skipPage).limit(parPage).sort({ createdAt: -1})
                const totalOrder = await authOrderModel.find({
                    sellerId
                }).countDocuments()
                responseReturn(res,200, {orders,totalOrder})
            }
            
        } catch (error) {
         console.log('get seller Order error' + error.message)
         responseReturn(res,500, {message: 'internal server error'})
        }
    }

    get_seller_order = async (req,res) => {
        const { orderId } = req.params
        console.log(orderId)
        try {
            const order = await authOrderModel.findById(orderId)
            responseReturn(res, 200, { order })
        } catch (error) {
            console.log('get seller details error' + error.message)
        }
    }

    seller_order_status_update = async(req,res) => {
        const {orderId} = req.params
        const { status } = req.body
    
        try {
            await authOrderModel.findByIdAndUpdate(orderId,{
                delivery_status: status
            })
            responseReturn(res,200, {message: 'Sipariş durumu başarıyla güncellendi'})
        } catch (error) {
            console.log('get seller Order error' + error.message)
            responseReturn(res,500, {message: 'internal server error'})
        }
    }

    create_payment = async (req, res) => {
    const { price } = req.body
    try {
        const payment = await stripe.paymentIntents.create({
            amount: price * 100,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true
            }
        })
        responseReturn(res, 200, { clientSecret: payment.client_secret })
    } catch (error) {
        console.log(error.message)
    }
    }

    order_confirm = async (req,res) => {
        const {orderId} = req.params
        try {
            await customerOrderModel.findByIdAndUpdate(orderId, { payment_status: 'paid' })
            await authOrderModel.updateMany({ orderId: new ObjectId(orderId)},{
                payment_status: 'paid', delivery_status: 'pending'  
            })
            const cuOrder = await customerOrderModel.findById(orderId)

            const auOrder = await authOrderModel.find({
                orderId: new ObjectId(orderId)
            })

            const time = moment(Date.now()).format('l')
            const splitTime = time.split('/')

            await myShopWallet.create({
                amount : cuOrder.price,
                month : splitTime[0],
                year : splitTime[2] // month/day/year
            })

            for (let i = 0; i < auOrder.length; i++) {
             await sellerWallet.create({
                sellerId: auOrder[i].sellerId.toString(),
                amount: auOrder[i].price,
                month: splitTime[0],
                year: splitTime[2]
             }) 
            }

        } catch (error) {
            console.log(error.message)
        }
    }

}

module.exports = new orderController()