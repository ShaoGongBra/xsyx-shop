const fs = require('fs')
const qs = require('querystring')
const request = require('../util/request')
const { asyncTimeOut } = require('../util/util')

// 商品分页数量
const pageSize = 30
// 获取商品购买数量
const getQty = async (list) => {
  const funcs = []
  for (let i = 0, l = Math.ceil(list.length / pageSize); i < l; i++) {
    funcs.push(request({
      url: 'user/product/getProductsMarketingData/v2',
      method: 'POST',
      type: 'form',
      data: {
        marketingDataQueryReq: JSON.stringify({
          spuSns: list.filter((item, index) => index >= i * pageSize && index < (i + 1) * pageSize).map(item => item.spuSn),
          areaId: 101
        })
      },
      json: false
    }))
  }
  const numbers = []
  const res = await Promise.all(funcs)
  res.map(item => numbers.push(...item))
  for (let i = 0, l = list.length; i < l; i++) {
    const spuSn = list[i].spuSn
    if (list[i].primaryUrls && list[i].primaryUrls.length > 0) {
      list[i].imgUrl = list[i].primaryUrls[0]
    }
    for (let j = 0, jl = numbers.length; j < jl; j++) {
      if (numbers[j].spuSn === spuSn) {
        list[i].number = numbers[j]
        break
      }
    }
  }
}

module.exports = {
  index: async (ctx, next) => {
    const template = fs.readFileSync(__dirname + '/../view/index/index.html', { encoding: 'utf8' })
    ctx.response.body = template;
  },
  cates: async (ctx, next) => {
    const res = await request({
      url: 'user/product/indexWindows',
      data: {
        openBrandHouse: 'OPEN'
      }
    })
    const arr = []
    for (const key in res) {
      if (res.hasOwnProperty(key) && typeof res[key] === 'object') {
        arr.push(...res[key])
      }
    }
    ctx.response.body = JSON.stringify(arr)
  },
  search: async (ctx, next) => {
    const keyWord = ctx.query.keyWord
    const getMalls = async list => {
      const data = await request({
        url: 'user/product/searchProduct',
        method: 'POST',
        type: 'form',
        data: {
          keyWord,
          page: (list.length / pageSize | 0) + 1,
          rows: pageSize,
          apiVersion: 'V2',
          openBrandhouse: 'TRUE'
        }
      })
      list.push(...data.records)
      if (data.total > list.length) {
        await getMalls(list)
      }
    }
    const malls = []
    if (keyWord === '') {
      ctx.response.body = JSON.stringify(malls)
      return
    }
    await getMalls(malls)
    await getQty(malls)
    ctx.response.body = JSON.stringify(malls)
  },
  malls: async (ctx, next) => {
    const windowId = ctx.query.id
    // 获取商品列表
    const getMalls = async (malls, ids = []) => {
      if (malls.length === 0) {
        const res = await request({
          url: 'user/window/getProducts/v1',
          method: 'POST',
          data: {
            windowId,
            excludeAct: "N",
            windowType: "BRAND_HOUSE",
            pageSize,
            spuSns: [],
            isFirstRefresh: 'TRUE'
          }
        })
        malls.push(...res.records)
        if (res.records.length < pageSize || res.spuSns.length === pageSize) {
          return true
        } else {
          await getMalls(malls, res.spuSns.splice(malls.length))
        }
      } else {
        const res = await request({
          url: 'user/window/getProducts/v1',
          method: 'POST',
          data: {
            windowId,
            excludeAct: "N",
            windowType: "BRAND_HOUSE",
            spuSns: ids.splice(0, pageSize),
            isFirstRefresh: 'FALSE'
          }
        })
        malls.push(...res.records)
        if (ids.length > 0) {
          await getMalls(malls, ids)
        } else {
          return true
        }

      }
    }

    const malls = []
    await getMalls(malls)
    await getQty(malls)
    ctx.response.body = JSON.stringify(malls)
  },
  mall: async (ctx, next) => {
    const { spuSn, skuSn, productId, activityId } = ctx.query
    const mall = await request({
      url: 'user/product/productInfo',
      type: 'form',
      data: {
        productType: 'BRAND_HOUSE',
        spuSn,
        skuSn,
        productId,
        activityId
      }
    })
    ctx.response.body = JSON.stringify(mall)
  },
  mallLog: async (ctx, next) => {
    const { productType, productId, activityId } = ctx.query
    const log = await request({
      url: 'user/product/getUserPurchaseRecord',
      type: 'form',
      data: {
        productType,
        productId,
        activityId
      }
    })
    ctx.response.body = JSON.stringify(log)
  },
  getUserInfo: async (ctx, next) => {
    const userKey = ctx.query.key
    const userInfo = await request({
      demain: 'user.xsyxsc.com',
      url: 'api/member/user/getUserInfo',
      type: 'form',
      data: { userKey }
    })
    userInfo.storeInfo = await request({
      demain: 'mall-store.xsyxsc.com',
      url: 'mall-store/store/getStoreInfo',
      type: 'form',
      data: { userKey, storeId: userInfo.currentStoreId }
    })
    ctx.response.body = JSON.stringify(userInfo)
  },
  getCode: async (ctx, next) => {
    const { phone } = ctx.query
    const res = await request({
      demain: 'user.xsyxsc.com',
      url: 'api/auth/auth/sendVerificationCode',
      type: 'form',
      method: 'POST',
      data: { mobileNo: phone, scenes: 'LOGIN' }
    })
    ctx.response.body = JSON.stringify(res)
  },
  phoneLogin: async (ctx, next) => {
    const { phone, code, msgId } = ctx.query
    const res = await request({
      demain: 'user.xsyxsc.com',
      url: 'api/auth/auth/manualLogin',
      type: 'form',
      method: 'POST',
      data: {
        loginMode: 'VERIFICATION_CODE',
        userName: phone,
        verificationCode: code,
        msgId,
        userKey: '4f1650f8-d0d1-4153-ae59-ee1fba961ad0'
      }
    })
    ctx.response.body = JSON.stringify(res)
  },
  submit: async (ctx, next) => {
    const { body } = ctx.request
    // 延迟请求 会提示太快开始
    // await asyncTimeOut(50)
    // 递归次数
    let requestNum = 0
    const submit = async items => {
      try {
        if (requestNum !== 0) {
          await asyncTimeOut(2000)
        }
        requestNum++
        return await request({
          demain: 'trade.xsyxsc.com',
          url: 'tradeorder/order/create',
          type: 'form',
          data: {
            userKey: body.key,
            order: JSON.stringify({
              ai: body.areaId,
              ct: 'MINI_PROGRAM',
              ot: 'CHOICE',
              p: body.tel,
              r: body.name,
              si: body.storeId,
              ess: body.eskuSn,
              itemList: items
            })
          }
        })
      } catch (error) {
        const len = [error.message.indexOf('商品【'), error.message.indexOf('】库存不足')]
        if (len[0] !== -1 && len[1] !== -1) {
          const name = error.message.substr(len[0] + 3, len[1] - (len[0] + 3))
          let mark = false
          for (let i = 0; i < items.length; i++) {
            if (items[i].title === name) {
              items.splice(i, 1)
              mark = true
              break
            }
          }
          if (!mark) {
            throw { message: '无法过滤无库存商品' }
          }
          if (items.length === 0) {
            throw { message: '被抢光了' }
          }
          return submit(items)
        }
        throw error
      }
    }
    try {
      const res = await submit(body.itemList)
      res.error = 0
      ctx.response.body = JSON.stringify(res)
    } catch (error) {
      error.error = 1
      ctx.response.body = JSON.stringify(error)
    }

  }
};