((that) => {
  that.asyncTimeOut = time => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), time)
    })
  }
  that.ajax = ({ demain = 'mall.xsyxsc.com', url, method = 'GET', data = {}, type = 'json' }) => {
    return new Promise((resolve, reject) => {
      const { userInfo = {} } = window
      const { storeInfo = {} } = userInfo
      method = method.toUpperCase()
      data = {
        areaId: storeInfo.areaId || 0,
        storeId: storeInfo.storeId || 0,
        userKey: userInfo.userKey || '',
        ...data
      }
      const option = {
        uri: 'https://' + demain + '/' + url,
        type: method,
        data,
        contentType: 'json',
        success: res => {
          if (res.rspCode === 'success') {
            resolve(res.data)
          } else {
            reject({ message: res.rspDesc })
          }
        },
        error: err => {
          reject(err)
        }
      }
      $.ajax(option)
    })
  }

  that.request = ({ url, data = {}, type = 'GET' }) => {
    const [mode = 'index', func = 'index'] = url.split('/')
    return that.requestExecs[mode][func].call(that.requestExecs[mode], data)
  }
  that.getInArrayIndex = (array, value, key) => {
    if (key === undefined) {
      return array.indexOf(value)
    } else {
      for (let i = 0, l = array.length; i < l; i++) {
        const element = array[i]
        if (element[key] == value) {
          return i
        }
      }
    }
    return -1
  }
  that.strToDate = dateStr => {
    const reCat = /(\d{1,4})/gm
    return new Date(...dateStr.match(reCat).map((item, index) => index === 1 ? --item : item))
  }
  let toastTimer = null
  that.toast = str => {
    const toastEle = $('.toast')
    toastEle.text(str)
    toastEle.show()
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
    toastTimer = setTimeout(() => {
      toastTimer = null
      toastEle.hide()
    }, 2000)
  }
  that.endTime = (time, formatStr = 'd天H时M分S秒', isEndTime = false, getAll = false) => {
    if (isEndTime) {
      time = (time - (new Date()).getTime())
    }
    time = Math.max(0, time)
    // 补全
    const completion = (number, length = 2) => {
      if (length === 2) {
        return `${number > 9 ? number : '0' + number}`
      } else {
        return `${number > 99 ? number : number > 9 ? '0' + number : '00' + number}`
      }
    }

    const data = {
      d: Math.floor(time / 1000 / 86400),
      h: Math.floor(time / 1000 / 3600 % 24),
      m: Math.floor(time / 1000 / 60 % 60),
      s: Math.floor(time / 1000 % 60),
      ms: Math.floor(time % 1000)
    }
    if (getAll) {
      return data
    }
    return formatStr
      .replace('d', data.d)
      .replace('D', completion(data.d))

      .replace('h', data.h)
      .replace('H', completion(data.h))

      .replace('ms', data.ms)
      .replace(/Ms|mS|MS/, completion(data.ms, 3))

      .replace('m', data.m)
      .replace('M', completion(data.m))

      .replace('s', data.s)
      .replace('S', completion(data.s))
  }
  that.asyncTimeOut = time => {
    return new Promise(resolve => {
      setTimeout(() => resolve(), time)
    })
  }

  const searchQuickMarks = {}
  /**
   * 即时输入搜索功能优化 当用户输入过快时 不会执行请求会返回Promise.reject
   * @param {object} params request请求参数
   * @param {string} mark 用来做请求标记 一般不需要传此字段 默认使用url作为唯一标识
   * @return {promise} 
   */
  that.searchQuick = (option, mark = '') => {
    const key = option.url + mark
    if (searchQuickMarks[key] === undefined) {
      searchQuickMarks[key] = {
        timer: null,
        prevReject: null,
        requestTask: null,
      }
    }
    const item = searchQuickMarks[key]
    return new Promise((resolve, reject) => {
      if (item.timer) {
        clearTimeout(item.timer)
        item.prevReject({ message: '过快请求', code: 1 })
      }
      if (item.requestTask) {
        item.requestTask = null
        item.prevReject({ message: '请求被覆盖', code: 2 })
      }
      item.prevReject = reject
      item.timer = setTimeout(() => {
        item.timer = null
        item.requestTask = request(option).then(res => {
          item.requestTask = null
          resolve(res)
        }).catch(err => {
          item.requestTask = null
          reject(err)
        })
      }, 600)
    })
  }

  that.requestExecs = {
    index: {
      pageSize: 30,
      cates: async () => {
        const res = await ajax({
          url: 'user/product/indexWindows',
          data: {
            openBrandHouse: 'OPEN'
          }
        })
        const arr = [
          {
            windowId: 3,
            windowName: "10点秒杀"
          },
          {
            windowId: 60,
            windowName: "0点秒杀"
          },
          {
            windowId: 4,
            windowName: "10点爆款"
          },
          {
            windowId: 488,
            windowName: "精选0点"
          },
          {
            windowId: 489,
            windowName: "精选10点"
          }
        ]
        for (const key in res) {
          if (res.hasOwnProperty(key) && typeof res[key] === 'object') {
            arr.push(...res[key])
          }
        }
        return arr
      },
      getQty = async list => {
        const funcs = []
        for (let i = 0, l = Math.ceil(list.length / pageSize); i < l; i++) {
          funcs.push(ajax({
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
      },
      search: async (data) => {
        const keyWord = data.keyWord
        const getMalls = async list => {
          const data = await ajax({
            url: 'user/product/searchProduct',
            method: 'POST',
            type: 'form',
            data: {
              keyWord,
              page: (list.length / this.pageSize | 0) + 1,
              rows: this.pageSize,
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
          return malls
        }
        await getMalls(malls)
        await this.getQty(malls)
        return malls
      },
      malls: async (data) => {
        const windowId = data.id
        // 获取商品列表
        const getMalls = async (malls, ids = []) => {
          if (malls.length === 0) {
            const res = await ajax({
              url: 'user/window/getProducts/v1',
              method: 'POST',
              data: {
                windowId,
                excludeAct: "N",
                windowType: "BRAND_HOUSE",
                pageSize: this.pageSize,
                spuSns: [],
                isFirstRefresh: 'TRUE'
              }
            })
            malls.push(...res.records)
            if (res.records.length < this.pageSize || res.spuSns.length === this.pageSize) {
              return true
            } else {
              await getMalls(malls, res.spuSns.splice(malls.length))
            }
          } else {
            const res = await ajax({
              url: 'user/window/getProducts/v1',
              method: 'POST',
              data: {
                windowId,
                excludeAct: "N",
                windowType: "BRAND_HOUSE",
                spuSns: ids.splice(0, this.pageSize),
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
        await this.getQty(malls)
        return malls
      },
      mall: async (data) => {
        const { spuSn, skuSn, productId, activityId } = data
        const mall = await ajax({
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
        return mall
      },
      mallLog: async (data) => {
        const { productType, productId, activityId } = data
        const log = await ajax({
          url: 'user/product/getUserPurchaseRecord',
          type: 'form',
          data: {
            productType,
            productId,
            activityId
          }
        })
        return log
      },
      getUserInfo: async (data) => {
        const userKey = data.key
        const userInfo = await ajax({
          demain: 'user.xsyxsc.com',
          url: 'api/member/user/getUserInfo',
          type: 'form',
          data: { userKey }
        })
        userInfo.storeInfo = await ajax({
          demain: 'mall-store.xsyxsc.com',
          url: 'mall-store/store/getStoreInfo',
          type: 'form',
          data: { userKey, storeId: userInfo.currentStoreId }
        })
        return userInfo
      },
      getCode: async (data) => {
        const { phone } = data
        const res = await ajax({
          demain: 'user.xsyxsc.com',
          url: 'api/auth/auth/sendVerificationCode',
          type: 'form',
          method: 'POST',
          data: { mobileNo: phone, scenes: 'LOGIN' }
        })
        return res
      },
      phoneLogin: async (data) => {
        const { phone, code, msgId } = data
        const res = await ajax({
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
        return res
      },
      submit: async () => {
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
            return await ajax({
              demain: 'trade.xsyxsc.com',
              url: 'tradeorder/order/create',
              type: 'form',
              data: {
                userKey: body.key,
                order: {
                  ai: body.areaId,
                  ct: 'MINI_PROGRAM',
                  ot: 'CHOICE',
                  p: body.tel,
                  r: body.name,
                  si: body.storeId,
                  ess: body.eskuSn,
                  itemList: items
                }
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
          return res
        } catch (error) {
          error.error = 1
          return error
        }

      },
      orderList: async () => {
        const { type, page, userKey } = ctx.query
        const types = ['', 'NEED_PAY', 'PAID', 'FINISHED']
        const list = await ajax({
          demain: 'trade.xsyxsc.com',
          url: 'tradeorder/order/getOrderUserList',
          type: 'form',
          data: {
            userKey,
            rows: 30,
            page,
            orderStatus: types[type | 0]
          }
        })
        return list.data || []
      }
    }
  }
})(window)