const cartModel = require("../../models/cartModel")
const { responseReturn } = require('../../utils/response')
const { mongo: {ObjectId}} = require('mongoose')

class cartControllers {
    add_to_cart = async(req, res) => {
        // console.log(req.body)
        const {userId, productId, quantity} = req.body
        try {
            const product = await cartModel.findOne({
                $and: [{
                    productId : {
                        $eq : productId
                    }
                },
                {
                    userId : {
                        $eq : userId
                    }
                }
            ]
            })

            if (product) {
                responseReturn(res, 404, {error : "Product Already Added to Cart"})
            } else {
                const product = await cartModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseReturn(res, 201, {message : "Added to Cart Successfully", product})
            }

        } catch (error) {
            console.log(error.message)
        }
    }
    // Aşağıdaki fonksiyon, frontend'den gelen bir userId'ye göre o kullanıcının sepetindeki ürünleri getirir, ürünleri stok durumuna göre stokta olanlar ve olmayanlar olarak ayırır, geçerli ürünlerin toplam fiyatını hesaplar, ve satıcı bazlı ürün listesi ile komisyon düşülmüş fiyatları oluşturur.
    get_cart_products = async(req, res) => {
        const co = 5; // co means commission
        const {userId} = req.params // Frontend'den api.get(`/home/product/get-cart-products/${userId}`) gibi bir endpoint'e istek geldiğinde, URL'deki userId'yi alıyorsun.
        try {
            const cart_products = await cartModel.aggregate([{
                $match : { // match, SQL'deki WHERE filtresi gibidir.
                    userId : {
                        $eq : new ObjectId(userId) //  Bu aşamada sadece userId'si eşleşen sepet kayıtlarını getiriyorsun.
                    }
                }
            },
            {
                $lookup : {
                    from : 'products',
                    localField : 'productId',
                    foreignField : "_id",
                    as : 'products' // Her bir sepet ürününe, ürün bilgilerini (name, price, stock, discount, sellerId vs) products array'i olarak iliştiriyoruz (lookup)
                }
            }
            ])
            let buy_product_item = 0
            let calculatePrice = 0
            let cart_product_count = 0
            const outOfStockProduct = cart_products.filter(p => p.products[0].stock < p.quantity) // Stokta yeterli olmayan ürünleri outOfStockProduct olarak ayırıyorsun.
            for (let i = 0; i < outOfStockProduct.length; i++) { // Bu ürünlerin toplam adedini cart_product_count'a ekliyorsun.
                cart_product_count = cart_product_count + outOfStockProduct[i].quantity
            } 
            const stockProduct = cart_products.filter(p => p.products[0].stock >= p.quantity) // Bu da stokta yeterli olan ürünleri ayırıyor.
            for (let i = 0; i < stockProduct.length; i++) { // Stokta olan ürünlerin fiyatını ve adedini hesaplama
                const { quantity } = stockProduct[i]
                cart_product_count = buy_product_item + quantity

                buy_product_item = buy_product_item + quantity
                const {price, discount} = stockProduct[i].products[0]
                if (discount !== 0) {
                    calculatePrice = calculatePrice + quantity * (price - Math.floor((price * discount) / 100))
                } else {
                    calculatePrice = calculatePrice + quantity * price
                }
                 
            }

            let p = [] // Satıcı bazlı gruplayıp komisyon düşülerek listeleme
            let unique = [...new Set(stockProduct.map(p => p.products[0].sellerId.toString()))] // Sepetteki ürünlerden tüm satıcıları alıyoruz, tekrarları kaldırıp unique dizisine atıyoruz.
            for (let i = 0; i < unique.length; i++) { // Aynı satıcıya ait tüm ürünlerin: İndirimli fiyatı hesaplanıyor, Komisyon düşülüyor, Miktarla çarpılıp toplam satıcı geliri elde ediliyor
                let price = 0 
                for (let j = 0; j < stockProduct.length; j++) {
                    const tempProduct = stockProduct[j].products[0]
                    if (unique[i] === tempProduct.sellerId.toString()) {
                        let pri = 0;
                        if (tempProduct.discount !== 0) {
                            pri = tempProduct.price - Math.floor((tempProduct.price * tempProduct.discount) / 100 )
                        } else {
                            pri = tempProduct.price
                        }
                        pri = pri - Math.floor((pri * co) / 100)
                        price = price + pri * stockProduct[j].quantity
                        p[i] = {
                            sellerId: unique[i], 
                            shopName: tempProduct.shopName,
                            price,
                            products: p[i] ? [
                                ...p[i].products,
                                {
                                    _id: stockProduct[j]._id,
                                    quantity: stockProduct[j].quantity,
                                    productInfo: tempProduct 
                                }
                            ] : [{
                                _id: stockProduct[j]._id,
                                quantity: stockProduct[j].quantity,
                                productInfo: tempProduct 
                            }]
                        } 
                    }
                }
            }
            // console.log(p)
            responseReturn(res, 200, {
                cart_products : p,
                price : calculatePrice,
                cart_product_count,
                shipping_fee : 20 * p.length,
                buy_product_item,
                outOfStockProduct,
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    delete_cart_products = async(req, res) => {
        const {cartId} = req.params
        // console.log(cartId)
        try {
            await cartModel.findByIdAndDelete(cartId)
            responseReturn(res, 200, {message : "Product Removed Successfully"})
            
        } catch (error) {
            console.log(error.message)   
        }
    }

    quantity_inc = async(req,res) => {
        const {cartId} = req.params
        // console.log(cartId)
        try {
            const product = await cartModel.findById(cartId)
            const {quantity} = product
            await cartModel.findByIdAndUpdate(cartId, {quantity : quantity + 1})
            responseReturn(res, 200, {message : "Quantity Updated"})
        } catch (error) {
            console.log(error.message)
        }
    }

}

module.exports = new cartControllers()