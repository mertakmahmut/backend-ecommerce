const categoryModel = require('../../models/categoryModel')
const { responseReturn } = require('../../utils/response')
const productModel = require('../../models/productModel')
const queryProducts = require('../../utils/queryProducts')
const moment = require('moment')
const reviewModel = require('../../models/reviewModel')

class homeControllers{

    formateProduct = (products) => { // Bu fonksiyon, gelen ürün listesini 3'erli gruplara ayırıyor. Frontend’de ürünleri grid şeklinde 3 sütunlu olarak göstermek istiyorsun (örneğin: her satırda 3 ürün). Bu nedenle ürünleri 3’erli parçalara bölüyorsun.
        const productArray = [];
        let i = 0;
        while (i < products.length) {
            let temp = []
            let j = i
            while (j < i + 3) {
                if (products[j]) {
                    temp.push(products[j])
                }
                j++
            }
            productArray.push([...temp])
            i = j
        }
        return productArray
    }

    get_categories = async(req, res) => {
        try {
            const categories = await categoryModel.find({})
            responseReturn(res, 200, {
                categories
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }

    get_products = async(req, res) => { // api oluşturuyoruz. tek bir api (istek) ile hepsini alıcaz.
        try {
            const products = await productModel.find({}).limit(12).sort({
                created : -1 // -1 means descending order command 
            })
            const allProduct1 = await productModel.find({}).limit(9).sort({
                created : -1 // Yeni Eklenenler
            })
            const latest_product = this.formateProduct(allProduct1);
            const allProduct2 = await productModel.find({}).limit(9).sort({
                rating : -1 // En Yüksek Puanlılar
            })
            const topRated_product = this.formateProduct(allProduct2);
            const allProduct3 = await productModel.find({}).limit(9).sort({
                discount : -1 //En Çok İndirime Girenler
            })
            const discount_product = this.formateProduct(allProduct3);

            responseReturn(res, 200, {
                products,
                latest_product,
                topRated_product,
                discount_product
            })
            
        } catch (error) {
            console.log(error.message)
        }
    } 

    price_range_product = async(req, res) => { //max ve min fiyat bulan fonksiyon
        try { 
            const priceRange = {
                low : 0,
                high : 0
            }
            const products = await productModel.find({}).limit(9).sort({
                createdAt : -1 // 1 for asc, -1 for Desc
            })
            const latest_product = this.formateProduct(products);
            const getForPrice = await productModel.find({}).sort({
                'price' : 1 // fiyat artana göre
            })

            if(getForPrice.length > 0){
                priceRange.high = getForPrice[getForPrice.length -1].price
                priceRange.low = getForPrice[0].price
            }
            // console.log(priceRange) 
            responseReturn(res, 200, {
                latest_product,
                priceRange
            })


        } catch (error) {
            console.log(error.message)
        }
    }

    query_products = async (req, res) => {
        // console.log(req.query)
        const parPage = 12
        req.query.parPage = parPage
        
        try {
            const products = await productModel.find({}).sort({
                createdAt : -1
            })

            const totalProduct = new queryProducts(products, req.query).categoryQuery().ratingQuery().priceQuery().searchQuery().sortByPrice().countProducts();

            const result = new queryProducts(products, req.query).categoryQuery().ratingQuery().priceQuery().searchQuery().sortByPrice().skip().limit().getProducts();

            responseReturn(res, 200, {
                products : result,
                totalProduct,
                parPage
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    product_details = async(req, res) => {
        const {slug} = req.params
        //console.log(slug)
        try {
            const product = await productModel.findOne({slug})
            // console.log(products)
            const relatedProducts = await productModel.find({ // benzer ürünleri bul
                $and: [{
                    _id: {
                        $ne: product.id // ürün sayfasındaki ana ürün olmasın. (ne = not equal) başka ürünler listelensin
                    }
                },
                {
                    category: {
                        $eq: product.category  // ve aynı kategorideki diğer ürünler listelensin
                    }
                }
               ]
            }).limit(12)
            const moreProducts = await productModel.find({
                $and: [{
                    _id: {
                        $ne: product.id
                    }
                },
                {
                    sellerId: {
                        $eq: product.sellerId
                    }
                }
               ]
            }).limit(3)
            responseReturn(res, 200, {
                product,
                relatedProducts,
                moreProducts
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }

    submit_review = async(req, res) => {
        const {name, productId, review, rating} = req.body
        try {
            await reviewModel.create({
                name,
                productId,
                review,
                rating,
                date : moment(Date.now()).format('LL')
            })

            let rate = 0;
            const reviews = await reviewModel.find({ // hangi üründe geziniyorsak o ürün için tüm değerlendirmeleri çeker.
                productId
            })
            for (let i = 0; i < reviews.length; i++) { // 
                rate = rate + reviews[i].rating // spesifik ürün için tüm değerlendirmelerin puanını toplar
            }
            let productRating = 0
            if (reviews.length !== 0) {
                productRating = (rate / reviews.length).toFixed(1) // topladığı puanı kullanıcı değerlendirme sayısına bölerek ortalama rating bulur
            }
    
            await productModel.findByIdAndUpdate(productId,{
                rating : productRating // Ortalama rating bulunduktan sonra ürün tablosuna gidip değeri güncellememiz gerekir.
            })
            responseReturn(res, 201, {
                message: "Değerlendirmeniz Başarıyla Eklendi"
            })
        } catch (error) {
            console.log(error.message)
        }
    } 

}
 

module.exports = new homeControllers()