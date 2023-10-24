const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
const sequelize = new Sequelize('AugustCode','root','root', {
    dialect: 'mysql'
});
const Redis = require('ioredis');
const redis = new Redis.Cluster([
    { host:'localhost',port:6379 }
])

//start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})
app.use(express.json());
app.use(express.urlencoded({extends: true}))

//define model 
const Product = sequelize.define('products', {
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL
})

app.get('/products', async(req,res) => {    
    const page = req.query.page || 1;
    const pageSize = parseInt(req.query.pageSize, 10);
    const offset = (page - 1) * pageSize;
    const order = req.query.sortBy || 'id';
    const cachedKey = `products_${page}_${pageSize}_${order}`;
    
    //check if data in cache
    const cachedData = await redis.get(cachedKey,(err,result) => {
        if(err){
            console.log('Redis Error', err);
        }
    });

    if(cachedData){
        res.json(JSON.parse(cachedData));
    }
    else{

        const productList = await Product.findAll({
            limit: pageSize,
            offset: offset,
            order: [[order, 'ASC']]
        })

        redis.set(cachedKey,JSON.stringify(productList))

        res.json(productList);
    }
});