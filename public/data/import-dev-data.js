const mongoose = require('mongoose')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config({path: './../../config.env'})
const Product = require('./../../models/Product')
const DB = process.env.DATABASE.replace('<PASSWORD>' , process.env.DATABASE_PASSWORD)


mongoose.connect(DB , {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(con => {
    console.log("Connected successfully");
})

const products = JSON.parse(fs.readFileSync(`${__dirname}/products.json` , 'utf-8'))

const importData = async () => {
    try{
        await Product.create(products)

        console.log('Data successfully loaded')
    }
    catch(err){
        console.log(err);
    }
    process.exit()

}

const deleteData = async ()=>{
    try{
        await Product.deleteMany()

        console.log('Data successfully deleted');
    }
    catch(err){
        console.log(err);
    }
    process.exit()
}

if(process.argv[2] === '--import')
{
    importData()
}
else if (process.argv[2] === '--delete')
{
    deleteData()
}

console.log(process.argv);