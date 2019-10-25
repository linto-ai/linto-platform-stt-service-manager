const dotenv = require('dotenv')
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
let url = "mongodb://"

//user access
if (process.env.MONGODB_REQUIRE_LOGIN)
    url = `${url}${process.env.MONGODB_USER}:${process.env.MOGODB_PSWD}@`
//host+port
url = `${url}${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/`
//database
if (process.env.MONGODB_REQUIRE_LOGIN)
    url = `${url}?authSource=${process.env.MONGODB_DBNAME_SMANAGER}`

const option = {
    numberOfRetries: 5,
    auto_reconnect: true,
    poolSize: 40,
    connectTimeoutMS: 500,
    useNewUrlParser: true,
    useUnifiedTopology: true
};


let p_cnx = {}; //connexion pool variable

function MongoPool() { }

function initPool(cb) {
    MongoClient.connect(url, option, function (err, cnx) {
        if (err) throw err;
        p_cnx = cnx;
    });
    return MongoPool;
}
MongoPool.initPool = initPool;

// Insert one query
async function insertOne(DB_NAME, collection, query) {
    return new Promise((resolve, reject) => {
        try {
            db = p_cnx.db(DB_NAME)
            db.collection(collection).insertOne(query, (err, res) => {
                if (err) reject(err)
                resolve("done")
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.insertOne = insertOne;

// delete one query
async function deleteOne(DB_NAME, collection, query) {
    return new Promise((resolve, reject) => {
        try {
            db = p_cnx.db(DB_NAME)
            db.collection(collection).deleteOne(query, (err, res) => {
                if (err) reject(err)
                resolve("done")
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.deleteOne = deleteOne

// update one query
async function updateOne(DB_NAME, collection, query, ...modesAndvalues) {
    return new Promise((resolve, reject) => {
        try {
            let operators = {}
            modesAndvalues.forEach((component) => {
                switch (component.mode) {
                    case '$set': operators.$set = component.value; break
                    case '$push': operators.$push = component.value; break
                    case '$pull': operators.$pull = component.value; break
                    default: console.log('updateQ switch mode error'); break
                }
            })
            db = p_cnx.db(DB_NAME)
            db.collection(collection).updateOne(query, operators, (err, res) => {
                if (err) reject(err)
                resolve("done")
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.updateOne = updateOne

// update many query
async function updateMany(DB_NAME, collection, query, ...modesAndvalues) {
    return new Promise((resolve, reject) => {
        try {
            let operators = {}
            modesAndvalues.forEach((component) => {
                switch (component.mode) {
                    case '$set': operators.$set = component.value; break
                    case '$push': operators.$push = component.value; break
                    case '$pull': operators.$pull = component.value; break
                    default: console.log('updateQ switch mode error'); break
                }
            })
            db = p_cnx.db(DB_NAME)
            db.collection(collection).updateMany(query, operators, (err, res) => {
                if (err) reject(err)
                resolve("done")
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.updateMany = updateMany


//drop collection query
async function dropCollection(DB_NAME, collection) {
    return new Promise((resolve, reject) => {
        try {
            db = p_cnx.db(DB_NAME)
            db.collection(collection).drop((err, res) => {
                if (err) reject(err)
                resolve("done")
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.dropCollection = dropCollection

// find one query
async function findOne(DB_NAME, collection, query) {
    return new Promise((resolve, reject) => {
        try {
            db = p_cnx.db(DB_NAME)
            db.collection(collection).findOne(query,(err, res) => {
                if (err) reject(err)
                resolve(res)
            })
        } catch (err) {
            throw err
        }
    })
}
MongoPool.findOne = findOne

// find many query
async function findMany(DB_NAME, collection, query={}) {
    return new Promise((resolve, reject) => {
        try {
            db = p_cnx.db(DB_NAME)
            db.collection(collection).find(query).toArray((err, res) => {
                if (err) reject(err)
                resolve(res)
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.findMany = findMany

// find list of collections query
async function getCollections(DB_NAME) {
    return new Promise((resolve, reject) => {
        try {
            db = p_cnx.db(DB_NAME)
            db.listCollections().toArray((err, res) => {
                if (err) reject(err)
                resolve(res)
            })
        } catch (err) {
            reject(err)
        }
    })
}
MongoPool.getCollections = getCollections


module.exports = MongoPool;