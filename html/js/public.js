(that => {
  that.ajax = ({ demain = 'mall.xsyxsc.com', url, method = 'GET', data = {}, type = 'json' }) => {
    return new Promise((resolve, reject) => {
      const { userInfo = {} } = window
      const { storeInfo = {} } = userInfo
      method = method.toUpperCase()
      data = {
        areaId: storeInfo.areaId,
        provinceCode: storeInfo.provinceId,
        cityCode: storeInfo.cityId,
        areaCode: storeInfo.countyId,
        storeId: storeInfo.storeId,
        userKey: userInfo.key || '',
        ...data
      }
      $.ajax({
        url: 'https://' + demain + '/' + url,
        type: method,
        data: type === 'json' && method === 'POST' ? JSON.stringify(data) : data,
        dataType: 'json',
        contentType: type === 'json' ? 'application/json' : 'application/x-www-form-urlencoded',
        headers: {
          source: 'applet',
          userKey: userInfo.key || '',
          version: '1.10.18'
        },
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
      })
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
        if (array[i][key] == value) {
          return i
        }
      }
    }
    return -1
  }
  /**
   * 将10位或者13位的时间戳转为时间对象
   * @param {Date|string|number} date Date日期对象或者时间戳或者带毫秒的时间戳, 如果缺省，则为当前时间
   * @return {Date}
   */
  const timeStampToDate = (date = new Date()) => {
    //传入数字自动计算
    if (typeof date !== 'object') {
      date = String(date)
      const len = date.length
      if (len == 10) {
        date += '000'
        date = new Date(date * 1)
      } else if (len == 13) {
        date = new Date(date * 1)
      } else if (len < 10) {
        let num = (Array(10).join(0) + date).slice(-10)
        num += '000'
        date = new Date(num * 1)
      } else {
        date = new Date()
      }
    }
    return date
  }
  /**
  * 日期对象转换为指定格式的字符串
  * @param {string} formatStr 日期格式,格式定义如下 yyyy-MM-dd HH:mm:ss
  * @param {Date|string|number} date Date日期对象或者时间戳或者带毫秒的时间戳, 如果缺省，则为当前时间
  * YYYY/yyyy/YY/yy 表示年份  
  * MM/M 月份  
  * W/w 星期  
  * dd/DD/d/D 日期  
  * hh/HH/h/H 时间  
  * mm/m 分钟  
  * ss/SS/s/S 秒  
  * @return string 指定格式的时间字符串
  */
  that.dateToStr = (formatStr = "yyyy-MM-dd HH:mm:ss", date) => {
    date = timeStampToDate(date)
    let str = formatStr
    let Week = ['日', '一', '二', '三', '四', '五', '六']
    str = str.replace(/yyyy|YYYY/, date.getFullYear())
    str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100))
    str = str.replace(/MM/, date.getMonth() > 8 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1))
    str = str.replace(/M/g, (date.getMonth() + 1))
    str = str.replace(/w|W/g, Week[date.getDay()])

    str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate())
    str = str.replace(/d|D/g, date.getDate())

    str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours())
    str = str.replace(/h|H/g, date.getHours())
    str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes())
    str = str.replace(/m/g, date.getMinutes())

    str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds())
    str = str.replace(/s|S/g, date.getSeconds())

    return str
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

  that.getSetting = () => {
    let setting = localStorage.getItem("setting")
    if (setting !== null) {
      try {
        setting = JSON.parse(setting)
      } catch (error) {
        setting = {}
        // 将用户信息的昵称和姓名更新到设置
        setting.name = window.userInfo.nickName
        setting.tel = window.userInfo.mobileNo
      }
    } else {
      setting = {}
      // 将用户信息的昵称和姓名更新到设置
      setting.name = window.userInfo.nickName
      setting.tel = window.userInfo.mobileNo
    }
    return setting
  }

  /**
   * 倒计时类
   */
  class countDown {
    // 剩余时间
    time = 0
    // 格式化类型
    formatStr
    onFunc = null
    // 监听时间
    onTime(func) {
      this.onFunc = func
    }
    // 监听倒计时结束
    stopFunc = null
    onStop(func) {
      this.stopFunc = func
    }
    // 定时器
    timer = null
    // 开始倒计时
    async start(time, formatStr, isEndTime = false, interval = 1000) {
      const now = (new Date()).getTime()
      if (this.timer) {
        this.stop()
      }
      let oldTime = time
      if (isEndTime) {
        oldTime = time - now
      }
      this.formatStr = formatStr
      // 时间余数 保证在最后一下执行刚好时间结束
      const remainder = oldTime % interval
      this.time = oldTime - remainder
      this.onFunc && this.onFunc(endTime(this.time, this.formatStr))
      await asyncTimeOut(remainder)
      let mark = 0
      this.timer = setInterval(() => {
        this.time -= interval
        if (this.time <= 0) {
          this.stop()
          this.stopFunc && this.stopFunc()
          return
        }
        this.onFunc && this.onFunc(endTime(this.time, this.formatStr))
        // 每执行5次重新执行定时器，防止定时器出现偏差
        if (isEndTime && mark === 5 && this.time > 3000) {
          this.start(time, formatStr, isEndTime, interval)
          return
        }
        mark++
      }, interval)
    }

    // 停止执行
    stop() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  }

  that.countDown = countDown

  that.requestExecs = {
    index: {
      pageSize: 30,
      async cates() {
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
            windowId: 1054,
            windowName: "下午整点"
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
          },
          {
            windowId: 45,
            windowName: "每天一品"
          },
          {
            windowId: 490,
            windowName: "每日精选"
          },
          {
            windowId: 692,
            windowName: "今日新品"
          }
        ]
        for (const key in res) {
          if (res.hasOwnProperty(key) && typeof res[key] === 'object') {
            arr.push(...res[key])
          }
        }
        return arr.map(item => {
          if (item.brandWindowId && !item.windowId) {
            item.windowId = item.brandWindowId
          }
          return item
        }).filter((item, index, array) => getInArrayIndex(array, item.windowId, 'windowId') === index)
      },
      async getQty(list) {
        const funcs = []
        for (let i = 0, l = Math.ceil(list.length / this.pageSize); i < l; i++) {
          funcs.push(ajax({
            url: 'user/product/getProductsMarketingData/v2',
            method: 'POST',
            type: 'form',
            data: {
              marketingDataQueryReq: JSON.stringify({
                spuSns: list.filter((item, index) => index >= i * this.pageSize && index < (i + 1) * this.pageSize).map(item => item.spuSn),
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
      async search(data) {
        const keyWord = data.keyWord
        const getMalls = async (list, page = 1) => {
          const data = await ajax({
            url: 'user/product/searchProduct',
            method: 'POST',
            type: 'form',
            data: {
              keyWord,
              page,
              rows: this.pageSize,
              apiVersion: 'V2',
              openBrandhouse: 'TRUE'
            }
          })
          list.push(...data.records)
          if (data.total > list.length && data.records.length > 0) {
            await getMalls(list, data.current + 1)
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
      async malls(data) {
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
                windowId: 100,
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
      async mallsFromSpusn(data) {
        const list = await ajax({
          url: 'user/window/getProducts/v1',
          method: 'POST',
          data: {
            windowId: 1,
            excludeAct: "N",
            windowType: "BRAND_HOUSE",
            spuSns: data.ids,
            isFirstRefresh: 'FALSE'
          }
        })
        await this.getQty(list.records)
        return list.records
      },
      async mall(data) {
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
      async mallLog(data) {
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
      userAjax(url, data = {}) {
        return new Promise((resolve, reject) => {
          $.ajax({
            url: '/index/' + url,
            data,
            dataType: 'json',
            success: res => {
              resolve(res)
            },
            error: err => {
              reject(err)
            }
          })
        })
      },
      async getUserInfo(data) {
        const userInfo = await ajax({
          demain: 'user.xsyxsc.com',
          url: 'api/member/user/getUserInfo',
          type: 'form',
          data: { userKey: data.key }
        })
        userInfo.storeInfo = await ajax({
          demain: 'mall-store.xsyxsc.com',
          url: 'mall-store/store/getStoreInfo',
          type: 'form',
          data: { userKey: data.key, storeId: userInfo.currentStoreId }
        })
        return userInfo
      },
      async getCode(data) {
        const { phone } = data
        const res = await ajax({
          demain: 'user.xsyxsc.com',
          url: 'api/auth/auth/sendVerificationCode',
          type: 'form',
          method: 'POST',
          data: { mobileNo: phone, scenes: 'LOGIN', item: 'XSYX_APP_MEMBER' }
        })
        return res
      },
      async phoneLogin(data) {
        const { phone, code, msgId } = data
        const res = await ajax({
          demain: 'user.xsyxsc.com',
          url: 'api/auth/auth/manualLogin',
          type: 'form',
          method: 'POST',
          data: {
            loginMode: 'VERIFICATION_CODE',
            item: 'XSYX_APP_MEMBER',
            userName: phone,
            verificationCode: code,
            msgId
          }
        })
        return res
      },
      async submit(data) {
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
              method: 'POST',
              type: 'form',
              data: {
                order: JSON.stringify({
                  ai: data.areaId,
                  ct: 'MINI_PROGRAM',
                  ot: 'CHOICE',
                  p: data.tel,
                  r: data.name,
                  si: data.storeId,
                  ess: data.eskuSn,
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
          const res = await submit(data.itemList)
          res.error = 0
          return res
        } catch (error) {
          error.error = 1
          return error
        }

      },
      async orderList() {
        const types = ['', 'NEED_PAY', 'PAID', 'FINISHED']
        const res = await Promise.all([
          ajax({
            demain: 'trade.xsyxsc.com',
            url: 'tradeorder/order/getOrderUserList',
            type: 'form',
            data: {
              rows: 30,
              page: 1,
              orderStatus: types[1]
            }
          }),
          ajax({
            demain: 'trade.xsyxsc.com',
            url: 'tradeorder/order/getOrderUserList',
            type: 'form',
            data: {
              rows: 30,
              page: 1,
              orderStatus: types[2]
            }
          })
        ])
        return {
          pay: res[0].data,
          paid: res[1].data
        }
      },
      async amapGeo(data) {
        if (!data.keyword) {
          return Promise.resolve([])
        }
        return new Promise((resolve, reject) => {
          $.ajax({
            url: 'https://restapi.amap.com/v3/place/text',
            data: {
              key: 'f95345d044311f2e0c05db35906ffbf1',
              keywords: data.keyword,
              city: data.city
            },
            dataType: 'json',
            success: res => {
              if (res.status === '1') {
                resolve(res.pois)
              } else {
                reject({ message: res.info })
              }
            },
            error: err => {
              reject(err)
            }
          })
        })
      },
      async getStorePos(list, city = '') {
        const geo = address => {
          return new Promise((resolve, reject) => {
            $.ajax({
              url: 'https://restapi.amap.com/v3/geocode/geo',
              data: {
                key: 'f95345d044311f2e0c05db35906ffbf1',
                address,
                city,
                batch: true
              },
              dataType: 'json',
              success: res => {
                if (res.status === '1') {
                  resolve(res.geocodes.map(item => {
                    return (typeof item.location === 'string' ? item.location : '0,0').split(',').map(item => Number(item))
                  }))
                } else {
                  reject({ message: res.info })
                }
              },
              error: err => {
                reject(err)
              }
            })
          })
        }
        const arr = []
        for (let i = 0, l = Math.ceil(list.length / 10); i < l; i++) {
          arr.push(geo(list.slice(i * 10, (i + 1) * 10).map(item => item.mapAddress || item.detailAddress).join('|')))
        }
        const poss = await Promise.all(arr)
        for (let i = 0, l = poss.length; i < l; i++) {
          const element = poss[i]
          for (let j = 0, jl = element.length; j < jl; j++) {
            list[i * 10 + j].mapX = element[j][0]
            list[i * 10 + j].mapY = element[j][1]
          }
        }
        return list
      },
      async getPosStore(data) {
        const list = await ajax({
          url: 'mall-store/store/getNearStoreList',
          demain: 'mall-store.xsyxsc.com',
          type: 'form',
          data: {
            mapX: data.lng,
            mapY: data.lat
          }
        })
        await this.getStorePos(list, data.city)
        return list
      },
      async getKeywordStore(data) {
        const list = await ajax({
          url: 'mall-store/store/queryStoreList',
          demain: 'mall-store.xsyxsc.com',
          data: {
            storeName: data.keyword
          }
        })
        await this.getStorePos(list)
        return list
      },
      async getUserStore() {
        const list = await ajax({
          url: 'api/member/user/getStoreUserPickUpList',
          demain: 'user.xsyxsc.com',
          method: 'POST',
          type: 'form',
          data: {
            pageNum: 1,
            pageSize: 10
          }
        })
        // 过滤不正常店铺
        for (let i = 0; i < list.length; i++) {
          if (list[i].storeStatus !== 'NORMAL') {
            list.splice(i, 1)
            i--
          }
        }
        list.unshift(window.userInfo.storeInfo)
        await this.getStorePos(list)
        return list
      },
      async editStore(data) {
        try {
          await ajax({
            url: 'api/member/user/updateCurrStoreId',
            demain: 'user.xsyxsc.com',
            method: 'POST',
            type: 'form',
            data: {
              newStoreId: data.id
            }
          })
          return true
        } catch (error) {
          toast(error.message)
          throw error
        }
      },
      async getStoreCity() {
        const list = await ajax({
          url: 'mall-store/getOpenStoreCitys',
          demain: 'mall-store.xsyxsc.com'
        })
        const texts = ['省', '壮族自治区', '市']
        const replaceText = text => {
          for (let i = 0; i < texts.length; i++) {
            text = text.replace(texts[i], '')
          }
          return text
        }
        return list.map(item => ({
          name: item.level === 1 ? replaceText(item.orgAreaName) : item.orgAreaName,
          id: item.orgAreaId,
          level: item.level,
          parentId: item.parentId
        }))
      },
      async getCoupon() {
        const coupon = await ajax({
          url: 'ticket/queryTicketProduct',
          demain: 'marketing.xsyxsc.com',
          method: 'POST',
        })
        return coupon.ticketList.map(item => {
          item.product = coupon.productMap[item.skuSn]
          return item
        })
      }
    }
  }
})(window)