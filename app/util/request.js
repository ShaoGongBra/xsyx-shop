const request = require('request-promise')
const qs = require('querystring')

const ajax = async ({ demain = 'mall.xsyxsc.com', url, method = 'GET', data = {}, type = 'json' }) => {
  const { header = {} } = global
  method = method.toUpperCase()
  data = {
    areaId: header.areaid,
    storeId: header.storeid,
    ...data
  }
  const option = {
    uri: 'https://' + demain + '/' + url,
    method,
    json: true
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