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
    uri: 'https://' + demain + '/' + url,
    // uri: 'https://auth.platelet.xyz/auth/Api/nodeTest',
    method,
    json: true,
    headers: {
      // Referer: 'https://servicewechat.com/wx6025c5470c3cb50c/175/page-frame.html',
      // userkey: header.userkey || '',
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
  if (res.rspCode === 'success') {
    // console.log('返回值:' + url, res.data, '結束')
    return res.data
  } else {
    throw { message: res.rspDesc }
  }
}

module.exports = ajax