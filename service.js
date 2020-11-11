//引入http模块
var http = require("http");
//设置主机名
var hostName = '127.0.0.1';
//设置端口
var port = 3000;
//创建服务
var server = http.createServer(function (request, res) {
    res.setHeader('Content-Type', 'application/json')
    const resData = {
        rspCode: 'success',
        rspDesc: '请求成功',
        data: {
            headers: request.headers
        }
    }
    res.end(JSON.stringify(resData));
});
server.listen(port, hostName, function () {
    console.log(`服务器运行在http://${hostName}:${port}`);
});