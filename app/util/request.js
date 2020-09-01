const request = require('request-promise')
const qs = require('querystring')

const ajax = async ({ demain = 'mall.xsyxsc.com', url, method = 'GET', data = {}, type = 'json' }) => {
  const { header = {} } = global
  method = method.toUpperCase()
  data = {
    areaId: header.areaid,
    storeId: header.storeid,
    userKey: header.userkey || '',
    ...data
  }
  const option = {
    uri: 'https://' + demain + '/' + url,
    method,
    json: true,
    headers: {
      Referer: 'https://servicewechat.com/wx6025c5470c3cb50c/175/page-frame.html',
      Host: demain,
      Connection: 'keep-alive',
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat',
      // 'content-type': 'application/x-www-form-urlencoded',
      // 'Accept-Encoding': 'gzip, deflate, br',
      userkey: header.userkey || ''
    },
    // proxy: 'http://127.0.0.1:8888'
  }
  if (method === 'GET') {
    option.uri += '?' + qs.stringify(data)
  } else {
    if (type === 'json') {
      option.body = data
    } else {
      option.form = data
    }
  }
  const res = await request(option)
  if (res.rspCode === 'success') {
    return res.data
  } else {
    throw { message: res.rspDesc }
  }
}

module.exports = ajax