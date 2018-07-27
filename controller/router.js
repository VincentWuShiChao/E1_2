var url=require("url");
var qs=require('querystring');
var path=require('path');
var fs=require('fs');
var crypto=require('crypto');
var http=require('http');
var mongodb=require('./mongodb.js');
var wxpay=require('./wxpay.js');

var result_appear={
    result:"ok",
    appearable:"false",
};
var result={
    result:"ok",
    msg:""
};

var result_skip={
    result:"ok",
    url:""
}

function setheader(res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    return res;
}
//---------------h5客户端请求--------------------
exports.appear= function (req,res) {
    console.log("已进入appear");
    res=setheader(res);
    res.send(JSON.stringify(result_appear));
};
exports.skip= function (req,res) {
    res=setheader(res);
    res.send(JSON.stringify(result_skip));
};


//----------------后台管理系统请求----------------------
exports.login= function (req,res) {
    console.log(JSON.stringify(result_appear));
    console.log(JSON.stringify(result_skip));
    res.render("login");
};
exports.management= function (req,res) {
    var arg=url.parse(req.url).query;
    var tag=qs.parse(arg)['tag'];
    console.log(tag);
    if(tag=="false"){
        result_appear.appearable="false";
    }else if(tag=="true"){
        result_appear.appearable="true";
    }else if(tag==""){
        result_skip.url="";
    }else{
        result_skip.url=tag;
    }
    console.log(JSON.stringify(result_appear));
    console.log(JSON.stringify(result_skip));
    res.render("login");
};
exports.controll= function (req,res) {
    var body = '', jsonStr;
    req.on('data', function (chunk) {
        body += chunk; //读取参数流转化为字符串
    });
    req.on('end', function () {
        //读取参数流结束后将转化的body字符串解析成 JSON 格式
        console.log(body);
        json_json=JSON.parse(body);
        console.log(json_json.tag);
        if(json_json.tag=="clickable"){
            result_appear.appearable="true";
        }
        if(json_json.tag=="clickunable"){
            result_appear.appearable="false";
        }
        if(json_json.tag=="url"){
            url=json_json.name;
            if(url==""){
                result_skip.url="";
            }else {
                result_skip.url=url;
            }
        }
        res=setheader(res);
        res.end();
    });
};
//---------------------------支付宝服务端-------------------------
var Alipay=require('./alipay');
var utl=require('./utl');
var outTradeId=Date.now().toString();
var ali=new Alipay({
    appId:"2016091500520718",
    notifyUrl:'http://58.87.73.146:6666/alipay',
    rsaPrivate:path.resolve("./config/sandbox_private.pem"),
    rsaPublic:path.resolve("./config/sandbox_ali_public.pem"),
    sandbox:true,
    signType:"RSA2"
});
exports.sendAlipay= function (req, res) {
    console.log("1"+typeof req.body);
    var result_client=req.body;
    //将客户端发送的数据进行签名
    if(result_client.tag=="1"){
        var signature_data=ali.pay({
            body: "ttt",
            subject: "ttt1",
            outTradeId: outTradeId,
            timeout: '90m',
            amount: "0.1",
            sellerId: '',
            product_code: 'FAST_INSTANT_TRADE_PAY',
            goods_type: "1",
            return_url:"58.87.73.146:6666/alipay",
        });
        console.log(signature_data.toString());
        result.msg=signature_data;
        res.send(JSON.stringify(result));

    }
    //----------------------向支付宝验证此用户是否真正付款-------------------------------
    if(result_client.tag=="zfre"){

        console.log(result_client);
        //-----------验签----------------------
        ali.signVerify(JSON.parse(result_client.name), function (result_alipay) {
            console.log(result_alipay);


        });
        //-------------查询订单--------------------------
        /*ali.query(JSON.parse(result_client.name), function (data) {
             console.log(data);
             var json_data=JSON.parse(data);
             console.log(json_data.alipay_trade_query_response.msg);
             if(json_data.alipay_trade_query_response.msg=="Success"){
                console.log("充值成功");
             }
         });*/

    }
    //-----------------------------------微信登录--------------------------------------
    if(result_client.tag=="wxhd"){
        console.log("wxhd");
        console.log(result_client.name);
        /*var config={
            "openid":result_client.password,
            "access_token":result_client.name
        }*/
        if(result_client.name.openid=="undefined"){

        }else {
            wxpay.loginVerify(result_client.name, function (data) {
                var json_data=JSON.parse(data);
                console.log("json_data:"+json_data);
                if(json_data.errmsg=="ok"){
                    console.log("登录成功");
                }
            })
        }

    }
    //-----------------------------------微信支付-----------------------------
    if(result_client.tag=="wxpay"){
        wxpay.wxPay(req, function (data) {
            result={
               result:"ok",
               msg:""
            };
            result.msg=data;
            res.send(JSON.stringify(result));

        });
    }
    if(result_client.tag=="wxpay_success"){
        wxpay.verify(result_client.name,result_client.password, function (data) {
            console.log(data.toString());
        })
    }


};
//------------------------mongodb数据库-----------http://mongodb.github.io/node-mongodb-native/3.0/api/--------------
/*var mongodb_client=mongodb.MongoDBClient;
var config={
    dbName:"test",
    url:"mongodb://localhost:27017/"
}
mongodb_emp=new mongodb_client();
mongodb_emp.conn(config, function (db,client) {
  /!*  mongodb_emp.findDocuments(db,"yiibai", function (result_db) {
        console.log(result_db);
        client.close();
    });*!/
    mongodb_emp.findDocumentsByKey(db,"yiibai",{"_id":15}, function (result_db) {
        console.log(result_db);
        client.close();
    });
   /!* mongodb_emp.indexCollection(db,"yiibai",{"_id":17}, function (result_db) {
        console.log(result_db);
        client.close();
    });*!/
  /!*  mongodb_emp.removeDocument(db,"yiibai",{"_id":13}, function (result_db) {
        console.log(result_db);
        client.close();
    })*!/
    /!*mongodb_emp.updateDocument(db,"yiibai", {"_id":13},{ _id: 13, password: '111111', name: 'haha', sex: '女' }, function (result_db) {
        console.log(result_db);
        client.close();
    });*!/
   /!* var list=[{ _id: 13, password: '111111', name: 'haha', sex: '男'}
        ,{ _id: 14, password: '111111', name: 'haha', sex: '男'}
        ,{ _id: 15, password: '111111', name: 'haha', sex: '男'}];
    mongodb_emp.insertDocuments(db,"yiibai",list, function (result_status) {
        console.log(result_status);
    })*!/


});*/

/*---------------------------------------redis数据库-----------------------------*/
/*
var redis=require('redis');
//redis.debug_mode=true;//调试模式
//第一种密码连接数据库
/!*PORT=6379;
HOST="127.0.0.1";
PWD="03251222yxn";
OPTS={auth_pass:PWD};
var client=redis.createClient(PORT,HOST,OPTS);*!/
//end
//第二种密码连接数据库
PORT=6379;
HOST="127.0.0.1";
PWD="03251222yxn";
OPTS={};
var client=redis.createClient(PORT,HOST,OPTS);
client.auth(PWD, function () {
    console.log("通过认证");
});
//end

client.on("error", function (error) {
    console.log(error);
});
client.on("connect", function () {
    console.log("connect");
    //--------------------单值set和get-----------------------
    //client.set('author','Wilson',redis.print);
    //client.get("author",redis.print);
    //-------------------多值get和set-----------------------
    //client.hmset('short',{'js':'javascript','c#':'C Sharp'},redis.print);
    //client.hmset('short','SQL','Structured Query Language','HTML',"HyperText",redis.print);
    /!*client.hgetall('short', function (err,res) {
        if(err){
            console.log("Error:"+err);
            return ;
        }
        console.log(res);
    });*!/
    //-----------------打包执行多个命令（事务）-------------------------
    var key='skills';
    client.sadd(key,"c#");
    client.sadd(key,"nodejs");
    client.sadd(key,"mysql");
    //sismember(key,value,[callback])：元素value是否存在于集合key中，存在返回1，不存在返回0
    //smembers(key,[callback])：返回集合 key 中的所有成员，不存在的集合key也不会报错，而是当作空集返回
    client.multi().sismember(key,'c#').smembers(key).exec(function (err,replies) {
        console.log("MULTI got "+replies.length+" replies");
        replies.forEach(function (reply,index) {
            console.log("Reply"+index+":"+reply.toString());
        });
        client.quit();
    });

});
client.on("ready", function (err) {
    console.log("ready");
});
client.on("end", function (err) {
    console.log("end");
});
*/




