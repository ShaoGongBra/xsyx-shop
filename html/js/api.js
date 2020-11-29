(that => {
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
        const buyDate = dateToStr('HH') === '23' ? dateToStr('yyyy-MM-dd', dateAdd('d', 1)) : dateToStr('yyyy-MM-dd')
        const arr = [
          {
            windowId: -1,
            list: [],
            errInfo: '数据加载中',
            where: {
              buyDate,
              wave: ['<', 0]
            },
            windowName: "今日降价"
          },
          {
            windowId: -2,
            windowName: "今日涨价",
            list: [],
            errInfo: '数据加载中',
            where: {
              buyDate,
              wave: ['>', 0]
            },
          },
          {
            windowId: -3,
            windowName: "历史底价",
            list: [],
            errInfo: '数据加载中',
            where: {
              buyDate,
              minimum: true
            },
          },
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
          // {
          //   windowId: 490,
          //   windowName: "每日精选"
          // },
          // {
          //   windowId: 692,
          //   windowName: "今日新品"
          // }
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
        // console.log(JSON.parse(JSON.stringify(malls)))
        if (!data.disableQty) {
          await this.getQty(malls)
        }
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
        mall.priceLog = await query.mall.getLog(mall.sku)
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
      async mallLicense(data) {
        return await ajax({
          url: 'user/product/productInfo/license',
          data,
          method: 'POST'
        })
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
            const { userInfo = {} } = window
            // const { storeInfo = {} } = userInfo
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
                  iv: 0,
                  // 下面三个是用户信息
                  un: userInfo.userName,
                  wn: userInfo.nickName,
                  wi: userInfo.headImgUrl,
                  // 下面是收货人
                  p: data.tel,
                  r: data.name,
                  si: data.storeId,
                  ess: data.eskuSn,
                  itemList: items,
                  tk: data.token
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
          url: 'ticket/v2/queryAvailableTicketProduct',
          demain: 'marketing.xsyxsc.com',
          method: 'POST',
          data: {
            channelUse: 'WXAPP'
          }
        })
        return coupon
          ? coupon.ticketList.map(item => {
            item.product = coupon.productMap[item.skuSn]
            return item
          })
          : []
      },
      async getVerifyCodeImage() {
        return await ajax({
          url: 'turingtest/turingTestData/getPuzzleDataByUserKey',
          demain: 'user.xsyxsc.com',
          method: 'POST',
          type: 'form'
        })
      },
      async verifyCodeImage(data) {
        return await ajax({
          url: 'turingtest/turingTestData/verifyPuzzle',
          demain: 'user.xsyxsc.com',
          method: 'POST',
          type: 'form',
          data
        })
      }
    },
    test: {

    }
  }
})(window)