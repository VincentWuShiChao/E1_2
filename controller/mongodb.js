const MongoClient=require('mongodb').MongoClient;
const assert = require('assert');

const MongoDBClient= function () {};
//connection
MongoDBClient.prototype.conn=function(config,callback){
    MongoClient.connect(config.url, function (err,client) {
        console.log("Connected successfully to server");
        var db = client.db(config.dbName);
        callback(db,client);
        client.on("close", function () {
            console.log("数据库关闭");
        })
    });
};

//find
MongoDBClient.prototype.findDocuments = function(db,collectionName, callback) {
    // Get the documents collection
    const collection = db.collection(collectionName);
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        callback(docs);
    });
};
//find by key
MongoDBClient.prototype.findDocumentsByKey = function(db,collectionName,json, callback) {
    // Get the documents collection
    const collection = db.collection(collectionName);
    // Find some documents
    collection.find(json).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        callback(docs);
    });
};

//update
MongoDBClient.prototype.updateDocument = function(db,collectionName,json_old,json_new, callback) {
    // Get the documents collection
    const collection = db.collection(collectionName);
    // Update document where a is 2, set b equal to 1
    collection.updateOne(json_old
        , { $set: json_new }, function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            console.log("Updated the document with the field a equal to 2");
            callback(result);
        });
};

//delete
MongoDBClient.prototype.removeDocument = function(db,collectionName,json_key, callback) {
    // Get the documents collection
    const collection = db.collection(collectionName);
    // Delete document where a is 3
    collection.deleteOne(json_key, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed the document with the field a equal to 3");
        callback(result);
    });
};

//index
MongoDBClient.prototype.indexCollection = function(db,collectionName,json, callback) {
    db.collection('documents').createIndex(
        json,
        null,
        function(err, results) {
            callback(results);
        }
    );
};

//insert
MongoDBClient.prototype.insertDocuments= function (db,collectionName,list,callback) {
    //get the documents collection
    const collection=db.collection(collectionName);
    //insert some documents
    collection.insertMany(list,function(err,result){
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log("Inserted 3 documents into the collection");
        callback(result);
    });
}



exports.MongoDBClient=MongoDBClient;