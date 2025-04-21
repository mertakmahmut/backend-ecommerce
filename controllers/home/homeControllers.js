const categoryModel = require('../../models/categoryModel')
const { responseReturn } = require('../../utils/response')
const productModel = require('../../models/productModel')

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
}
 

module.exports = new homeControllers()