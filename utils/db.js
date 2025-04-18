const mongooese = require('mongoose')

module.exports.dbConnect = async()=>{
    try {
        await mongooese.connect(process.env.DB_URL, {useNewURLParser: true})
        console.log("Database Connected..")
    } catch (error) {
        console.log(error.message)
    }
}