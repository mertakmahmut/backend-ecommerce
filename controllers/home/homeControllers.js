const categoryModel = require('../../models/categoryModel')
const { responseReturn } = require('../../utils/response')

class homeControllers{
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
}
 

module.exports = new homeControllers()