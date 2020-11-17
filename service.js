//引入http模块
var http = require("http");
//设置主机名
var hostName = '127.0.0.1';
//设置端口
var port = 3002;
//创建服务
var server = http.createServer(function (request, res) {
    let postData = ''
    const resData = {
        rspCode: 'success',
        rspDesc: '请求成功',
        data: {
            method: request.method,
            url: request.url,
            httpVersion: request.httpVersion,
            headers: request.headers,
            body: ''
        }
    }
    request.on('data', function (chunk) {
        // chunk 默认是一个二进制数据，和 data 拼接会自动 toString
        postData += chunk
        resData.data.body += chunk
    })
    request.on('end', () => {
        res.end(JSON.stringify(resData));
    })

    res.setHeader('Content-Type', 'application/json')
});
server.listen(port, hostName, function () {
    console.log(`服务器运行在http://${hostName}:${port}`);
});