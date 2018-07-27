/**
 * @api {get} /login Request App information
 * @apiName GetUser
 * @apiGroup App
 *
 * @apiParam {Number} id Users unique ID.
 *
 * @apiSuccess {ejs} login 显示登录界面.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "firstname": "John",
 *       "lastname": "Doe"
 *     }
 *
 * @apiError {ejs} htmlNotFound The request was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 */
var express=require('express');
var bodyParser=require('body-parser');
var app=express();
var router=require('./../controller/router.js');


app.set("view engine",'ejs');

//路由中间件
app.use(express.static("../public"));
app.use(bodyParser.json({limit: '1mb'}));  //body-parser 解析json格式数据
app.use(bodyParser.urlencoded({            //此项必须在 bodyParser.json 下面,为参数编码
    extended: true
}));
app.post("/appearable",router.appear);

app.post("/skipable",router.skip);

app.get("/login",router.login);
app.get("/management",router.management);
app.post("/cotl",router.controll);


app.post("/pay",router.sendAlipay);

app.use(function (req,res) {
    return res.render("err");
});
app.listen(6000,"0.0.0.0", function () {
    console.log("连接");
});