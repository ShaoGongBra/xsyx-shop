const request = require('request-promise')
const qs = require('querystring')

const ajax = async ({ demain = 'mall.xsyxsc.com', url, method = 'GET', data = {}, type = 'json' }) => {
  const { header = {} } = global
  method = method.toUpperCase()
  data = {
    areaId: header.areaid,
    storeId: header.storeid,
    // userKey: header.userkey || '',
    ...data
  }
  const option = {
    // uri: 'https://' + demain + '/' + url,
    uri: 'https://auth.platelet.xyz/auth/Api/nodeTest',
    method,
    json: true,
    headers: {
      // Referer: 'https://servicewechat.com/wx6025c5470c3cb50c/175/page-frame.html',
      // userkey: header.userkey || '',
      // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36 Edg/85.0.564.41',
      Connection: 'keep-alive'
    }
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
  let res = await request(option)
  console.log(res)
  res = JSON.parse(res)
  if (res.rspCode === 'success') {
    return res.data
  } else {
    throw { message: res.rspDesc }
  }
}

module.exports = ajax