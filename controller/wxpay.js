/**
 * Created by Administrator on 2018/5/17.
 */
//获取客户端发送的数据后，拿此数据向微信发起验证(向微信发送验证请求)
var request=require('request');
var crypto=require('crypto');
//微信登录
exports.loginVerify=function(body,callback){
    console.log(JSON.parse(body).openid);
    var config={//发送请求路径的配置参数
        method: 'GET',
        url: "https://api.weixin.qq.com/sns/auth?openid="+JSON.parse(body).openid+"&access_token="+JSON.parse(body).access_token
    };
    request(config, function(err, res, body){
        //body为支付宝验证后回传的数据
        console.log("微信的返回值："+res.body);
        callback(res.body);
    });
};
//微信支付
exports.wxPay= function (req,callback) {
    var appid = "wx72f9006d0b1d9b7f";
    var mch_id = "1503004221";                                  //微信支付分配的商户号;
    var attach = "asd";
    var nonce_str = Math.random().toString(36).substr(2, 15);    //随机串最好存储进数据库,支付流程最后的查询支付状态需传参
    var total_fee = "1";                                        //总价
    var notify_url = "http://192.168.1.127";                  //支付成功后,接收微信服务器的回调信息(微信数据传递都是xml格式,所以路由设置里应该要设置可以接收xml数据)
    var body = "asd";                                            //商品描述
    var trade_type = "APP";
    var spbill_create_ip = getIp(req);                     //客户端ip
    var out_trade_no = time();                                    //订单号 不可重复可拿时间
    var timeStamp = time();                                       //这个不是统一下单必传参数,这个是二次签名的时间戳,以秒为单位;
    var sign = paysignApp(appid,body,mch_id,nonce_str,notify_url,out_trade_no,spbill_create_ip,total_fee,trade_type,attach,timeStamp);
    console.log(sign+"aaa");
    //这个是第一次签名,签名规则按照文档,签名成功之后,变成xml格式的数据,向微信服务器发送https请求,若成功,微信服务器会返回xml格式数据
    //解析之后会得到预付交易回话表示prepay_id
    var formData = "<xml>";
    formData += "<appid>"+appid+"</appid>"; //appid
    formData += "<attach>"+attach+"</attach>";
    formData += "<body>"+body+"</body>";
    formData += "<mch_id>"+mch_id+"</mch_id>"; //商户号
    formData += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
    formData += "<notify_url>"+notify_url+"</notify_url>";
    formData += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
    formData += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
    formData += "<total_fee>"+total_fee+"</total_fee>";
    formData += "<trade_type>"+trade_type+"</trade_type>";
    formData += "<sign>"+sign+"</sign>";                        //第一次签名的sign
    formData += "</xml>";
    request({
        url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
        method: 'POST',
        body: formData
    }, function (err, response, body) {
        console.log(formData+"aaaaaaaaaaaa");
        if (!err && response.statusCode == 200) {
            //console.log(body.toString());
            console.log("body:"+body.toString('utf-8'));
            var prepay_id = getXMLNodeValue('prepay_id', body.toString('utf-8'));
            var paySign= paysign2(appid,nonce_str,"Sign=WXPay",mch_id,prepay_id,timeStamp);
            console.log(paySign+"+++++++++++++")
            var data = {
                out_trade_no:out_trade_no,
                nonce_str:nonce_str,
                prepay_id:prepay_id,                            //或得到微信服务器给的订单号
                timeStamp:timeStamp,                            //秒为单位的事件戳
                paySign:paySign
            };
            callback(data);
        }});
};
//订单查询
exports.verify = function (nonce_str,out_trade_no,callback) {

    var appid = "wx72f9006d0b1d9b7f";
    var mch_id = "1503004221";
    var nonce_str = nonce_str;//在统一下单时生成的唯一的随机字符串
    var out_trade_no=out_trade_no;//在统一下单时生成的唯一的随机订单号
    //var sign=querySign(appid,mch_id,nonce_str,out_trade_no);//查询签名，传参需要注意
    var sign=querySign("wx72f9006d0b1d9b7f","1503004221",nonce_str,out_trade_no);//测试 appid mch_id 写死了
    console.log(sign)
    var formData  = "<xml>";
    formData  += "<appid>"+appid+"</appid>";  //appid
    formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
    formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
    formData  += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
    formData  += "<sign>"+sign+"</sign>";
    formData  += "</xml>";
    var regUrl= "https://api.mch.weixin.qq.com/pay/orderquery";
    console.log(formData)
    request({
        url: regUrl,
        method: 'POST',
        body: formData
    }, function (err, response, body) {
        //console.log(body.toString());
        var body = getXMLNodeValue('trade_state_desc', body.toString('utf-8'));
        callback(body);
    })
};

/*-----------------------------------------以下方法为上面服务-----------------------------------------------------------*/
//排序
function raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key.toLowerCase()] = args[key];
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};


//一次签名sign
function paysignApp(appid,body,mch_id,nonce_str,notify_url,out_trade_no,spbill_create_ip,total_fee,trade_type,attach) {
    var ret = {
        appid: appid,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url:notify_url,
        out_trade_no:out_trade_no,
        spbill_create_ip:spbill_create_ip,
        total_fee:total_fee,
        trade_type:trade_type,//这些参数左边的参数名是参加签名的参数名，跟文档保持一致
        attach:attach,
    };
    console.log("第一次签名验证的参数",ret);
    var string = raw(ret);
    var key = "LzJ6598pppdasfasgFAsasfasfsdgdgD";
    string = string + '&key=' + key;
    return crypto.createHash('md5').update(string,'utf8').digest('hex').toUpperCase();

};


//二次签名sign
function paysign2(appid,nonceStr,package,partnerid,prepayid,timeStamp) {
    var ret = {
        appid: appid,
        noncestr: nonceStr,
        package:package,
        partnerid:partnerid,
        prepayid:prepayid,
        timestamp:timeStamp//签名的参数名一定要对
    };
    console.log("第二次签名验证的参数",ret);
    var string = raw(ret);
    var key = "LzJ6598pppdasfasgFAsasfasfsdgdgD";
    var string = string + '&key='+key;
    console.log(string);
    return crypto.createHash('md5').update(string,'utf8').digest('hex').toUpperCase();//签名都需大写
};


//解析xml数据
function getXMLNodeValue(node_name,xml){
    console.log(xml)
    var tmp = xml.split("<"+node_name+">");
    var _tmp = tmp[1].split("</"+node_name+">");
    var tmp1 = _tmp[0].split('[');
    var _tmp1 = tmp1[2].split(']');
    return _tmp1[0];
}


//时间戳
function time () {
    return parseInt(new Date().getTime() / 1000) + '';
}


//查询签名
function querySign(appid,mch_id,nonce_str,out_trade_no){
    var ret = {
        appid: appid,
        mch_id: mch_id,
        nonce_str:nonce_str,
        out_trade_no:out_trade_no//注意左边参数名
    };
    console.log("查询签名验证的参数",ret);
    var string = raw(ret);
    var key = "LzJ6598pppdasfasgFAsasfasfsdgdgD";
    string = string + '&key='+key;
    return crypto.createHash('md5').update(string,'utf8').digest('hex').toUpperCase();
}


//获取ip
function getIp (req) {
    //console.log( req.connection.remoteAddress);
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

