const formidable = require("formidable")
const { responseReturn } = require("../../utils/response")
const cloudinary = require('cloudinary').v2
const productModel = require('../../models/productModel')

class productController {
    add_product = async(req, res) => {
        const {id} = req;
        // console.log('product ok')

        const form = formidable({ multiples : true })
        form.parse(req, async(err, field, files) => {
            // console.log(files.images[0])
            // console.log(field)

            let {name, category, description, stock, price, discount, shopName, brand} = field;
            const {images} = files;
            name = name.trim()
            const slug = name.split(' ').join('-')

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {
                let allImageUrl = [];
                for (let i = 0; i < images.length; i++) {
                    const result = await cloudinary.uploader.upload(images[i].filepath, {folder : 'products'});
                    allImageUrl = [...allImageUrl, result.url]
                }

                await productModel.create({
                    sellerId : id,
                    name,
                    slug,
                    shopName,
                    category : category.trim(),
                    description : description.trim(),
                    stock : parseInt(stock),
                    price : parseInt(price),
                    discount : parseInt(discount),
                    images : allImageUrl,
                    brand : brand.trim()
                })

                responseReturn(res, 201,{ message : 'Product Added Successfully'})

            } catch (error) {
                responseReturn(res, 500,{ error : error.message})
            }
        })

    }
}

module.exports = new productController()