(that => {
  that.ajax = ({ demain = 'mall.xsyxsc.com', url, method = 'GET', data = {}, type = 'json' }) => {
    return new Promise((resolve, reject) => {
      const { userInfo = {} } = window
      const { storeInfo = {} } = userInfo
      method = method.toUpperCase()
      data = {
        areaId: storeInfo.areaId || 101,
        storeId: storeInfo.storeId || 66880000022074,
        userKey: userInfo.userKey || '',
        ...data
      }
      $.ajax({
        url: 'https://' + demain + '/' + url,
        type: method,
        data: type === 'json' && method === 'POST' ? JSON.stringify(data) : data,
        dataType: 'json',
        contentType: type === 'json' ? 'application/json' : 'application/x-www-form-urlencoded',
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
                userKey: data.key,
                order: JSON.stringify({
                  ai: data.areaId || 101,
                  ct: 'MINI_PROGRAM',
                  ot: 'CHOICE',
                  p: data.tel,
                  r: data.name,
                  si: data.storeId || 66880000022074,
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
        const { type, page, userKey } = ctx.query
        const types = ['', 'NEED_PAY', 'PAID', 'FINISHED']
        const list = await that.ajax({
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

// vue swiper组件
Vue.use(VueAwesomeSwiper)
var app = new Vue({
  el: '#app',
  components: {
    'goods-detail': {
      data() {
        return {
          info: {},
          log: [],
          nav: ['商品详情', '购买记录'],
          navIndex: 0,
          swiperOption: {
            loop: true,
            pagination: {
              el: '.swiper-pagination'
            }
          },
        }
      },
      props: {
        mall: {
          type: [Object],
          default: {}
        }
      },
      template: `
        <div v-if="info.prId" class="mall-detail">
          <div class="close" @click="$emit('close')">关闭</div>
          <div class="scroll">
            <swiper :options="swiperOption">
              <swiper-slide v-for="item in info.primaryUrls" :key="item">
                <img :src="item" alt="">
              </swiper-slide>
              <div class="swiper-pagination" slot="pagination"></div>
            </swiper>
            <div class="title">{{info.prName}}</div>
            <div class="price">
              <span>￥{{info.saleAmt}}</span>
              <span class="old">￥{{info.marketAmt}}</span>
            </div>
            <div class="line"></div>
            <div class="option">购买数量：{{info.daySaleQty}}/{{info.limitQty === 0?'不限购':info.limitQty}}</div>
            <div class="option">限购数量：{{info.ulimitQty>0?info.ulimitQty:'不限购'}}</div>
            <div class="option">购买时间：{{info.tmBuyStart.substr(5, 11)}} - {{info.tmBuyEnd.substr(5, 11)}}</div>
            <div class="line"></div>
            <div class="nav">
             <span class="item" v-for="(item, index) in nav" :key="item" :class="{hover: navIndex === index}" @click="switchNav(index)">{{item}}</span> 
            </div>
            <div class="detail" v-if="navIndex === 0">
              <img v-for="item in info.detailUrls" :src="item" :key="item" alt="">
            </div>
            <div class="log" v-if="navIndex === 1">
              <div class="item" v-for="item in log" :key="item.avatar">
                <img :src="item.avatar" /> 
                <div class="info">
                  <span class="name">{{item.wxName}}</span>
                  <span class="time">{{item.tmTrade}}</span>
                </div>
                <span class="num">{{item.buyQty}}件</span>
              </div>
            </div>
          </div>
        </div>
      `,
      mounted() {
        this.getInfo()
      },
      watch: {
        'mall.prId'() {
          this.getInfo()
        }
      },
      methods: {
        async getInfo() {
          this.switchNav(0)
          this.log = []
          this.info = {}
          this.info = await request({
            url: 'index/mall',
            data: {
              spuSn: this.mall.spuSn,
              skuSn: this.mall.skuSn,
              productId: this.mall.prId,
              activityId: this.mall.acId
            }
          })
          this.info.daySaleQty = this.mall.number.daySaleQty
        },
        async switchNav(index) {
          this.navIndex = index
          if (index === 1 && this.log.length === 0) {
            this.log = await request({
              url: 'index/mallLog',
              data: {
                productId: this.mall.prId,
                activityId: this.mall.acId,
                productType: this.mall.prType
              }
            })
          }
        }
      }
    },
    login: {
      data() {
        return {
          select: 0,
          post: {
            phone: '',
            code: '',
            msgId: ''
          },
          codeStaus: 0, // 0 未获取 1已获取 2获取中
        }
      },
      props: {
        mall: {
          type: [Object],
          default: {}
        }
      },
      template: `
      <div class="login">
        <div class="nav">
          <span :class="{hover: select === 0}" @click="select = 0">手机号登陆</span>
          <span :class="{hover: select === 1}" @click="select = 1">秘钥登陆</span>
        </div>
        <div v-if="select === 0" class="tab">
          <div class="code">
            <input type="text" placeholder="手机号" maxLength="11" @input="input('phone', $event.target.value)">
          </div>
          
          <div v-if="post.phone.length === 11 && codeStaus === 1" class="code">
            <input type="text" placeholder="验证码" maxLength="4" @input="input('code', $event.target.value)">
          </div>
        </div>
        <div v-if="select === 1" class="tab">
          <input type="text" placeholder="请输入key" @input="input('key', $event.target.value)">
        </div>
      </div>
      `,
      methods: {
        input(key, value) {
          this.post[key] = value
          if (key === 'key') {
            this.$emit('input', value)
          } else if (key === 'phone' && value.length === 11) {
            this.post.phone = value
            this.getCode()
          } else if (key === 'code' && value.length === 4) {
            this.post.code = value
            this.login()
          } else if (key === 'phone') {
            this.codeStaus = 0
          }
        },
        async getCode() {
          this.codeStaus = 2
          const res = await request({
            url: 'index/getCode',
            data: this.post
          })
          this.codeStaus = 1
          this.post.msgId = res.msgId
        },
        async login() {
          const res = await request({
            url: 'index/phoneLogin',
            data: this.post
          })
          this.$emit('input', res.userKey)
        }
      }
    }
  },
  data: {
    showLogin: false,
    cates: [],
    selectCate: 0,
    malls: [],
    selectMall: {},
    cart: [],
    showUserInfo: false,
    userInfo: {},
    storeInfo: {},
    totalPrice: 0
  },
  mounted() {
    this.init()
  },
  methods: {
    async init() {
      await this.login()
      this.cates = await request({
        url: 'index/cates'
      })
      this.selectCate = 0
      this.getMalls()
    },
    async login() {
      // 获取本地用户信息
      let userInfo = localStorage.getItem("userInfo")
      try {
        if (userInfo !== null) {
          userInfo = JSON.parse(userInfo)
          await this.getUserInfo(userInfo.key)
          return true
        } else {
          throw { message: '用户信息失效' }
        }
      } catch (error) {
        this.showLogin = true
        return new Promise((resolve, reject) => {
          this.loginOnFunc = [resolve, reject]
        })
      }
    },
    loginOut() {
      this.userInfo = {}
      this.showUserInfo = false
      localStorage.removeItem("userInfo")
      this.init()
    },
    async loginInput(value) {
      if (value.length === 36) {
        const userInfo = await this.getUserInfo(value)
        this.loginOnFunc[0] && this.loginOnFunc[0](userInfo)
        this.showLogin = false
      }
    },
    async search(e) {
      const keyWord = e.target.value
      this.malls = await searchQuick({
        url: 'index/search',
        data: {
          keyWord
        }
      })
      this.selectCate = -1
    },
    userShow(type, status, e) {
      if (status) {
        this.showUserInfo = true
        if (this.userShowCloseTimer) {
          clearTimeout(this.userShowCloseTimer)
          this.userShowCloseTimer = null
        }
      } else {
        if (type === 'head') {
          this.userShowCloseTimer = setTimeout(() => { this.showUserInfo = false }, 300)
        } else {
          if (this.userShowCloseTimer) {
            clearTimeout(this.userShowCloseTimer)
            this.userShowCloseTimer = null
          }
          this.userShowCloseTimer = setTimeout(() => { this.showUserInfo = false }, 300)
        }
      }

    },
    switch(index) {
      this.selectCate = index
    },
    async getMalls() {
      this.malls.splice(0, this.malls.length)
      const cate = this.cates[this.selectCate]
      this.malls = await request({
        url: 'index/malls',
        data: {
          id: cate.brandWindowId || cate.windowId
        }
      })
    },
    async showMallDetail(mall) {
      this.selectMall = mall
    },
    addCart(mall, type = 'add', e) {
      e && (e.stopPropagation(), this.selectMall = {})
      if (mall.limitQty === mall.number.daySaleQty && mall.limitQty !== 0) {
        toast('已售完')
        return
      }
      let cartIndex = getInArrayIndex(this.cart, mall.tmBuyStart, 'time')
      if (cartIndex === -1) {
        const time = strToDate(mall.tmBuyStart).getTime()
        const item = {
          time: mall.tmBuyStart,
          timeStamp: time,
          list: [],
          timer: null,
          timeText: ''
        }
        if (time > (new Date()).getTime()) {
          item.timer = new countDown()
          item.timer.onTime(text => item.timeText = text)
          item.timer.onStop(() => {
            item.timer = null
            this.submit()
          })
          item.timer.start(time - 10, 'H时M分S秒', true)
        }
        this.cart.push(item)
        this.cart.sort((a, b) => a.timeStamp - b.timeStamp)
        cartIndex = getInArrayIndex(this.cart, mall.tmBuyStart, 'time')
      }
      const cartItem = this.cart[cartIndex]
      let mallIndex = getInArrayIndex(cartItem.list, mall.skuSn, 'skuSn')
      if (mallIndex === -1) {
        mallIndex = cartItem.list.length
        cartItem.list.push({ ...mall, qty: 0 })
      }
      const mallItem = cartItem.list[mallIndex]
      if (type === 'add') {
        if (mallItem.ulimitQty !== 0 && mallItem.ulimitQty === mallItem.qty) {
          toast('商品限购：' + mallItem.ulimitQty)
          return
        }
        mallItem.qty++
      } else {
        if (mallItem.qty === 1) {
          // 删除商品
          cartItem.list.splice(mallIndex, 1)
          if (cartItem.list.length === 0) {
            const [item] = this.cart.splice(cartIndex, 1)
            item.timer && item.timer.stop()
          }
          this.cartTotal()
          return
        }
        mallItem.qty--
      }
      this.cartTotal()
    },
    cartTotal() {
      let num = 0
      for (let i = 0; i < this.cart.length; i++) {
        for (let j = 0; j < this.cart[i].list.length; j++) {
          const element = this.cart[i].list[j]
          num += element.qty * element.saleAmt
        }
      }
      this.totalPrice = num
    },
    async getUserInfo(key) {
      if (!key) {
        toast('请输入key')
        throw { message: '请输入key' }
      }
      if (key.length !== 36) {
        toast('无效的key')
        throw { message: '无效的key' }
      }
      try {
        this.userInfo = await request({
          url: 'index/getUserInfo',
          data: {
            key
          }
        })
        this.userInfo.key = key
        this.storeInfo = this.userInfo.storeInfo
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        window.userInfo = this.userInfo
        return this.userInfo
      } catch (error) {
        this.userInfo = {}
        localStorage.removeItem("userInfo")
        toast('用户信息失效')
        throw { message: '用户信息失效' }
      }
    },
    // 创建订单
    submit() {
      if (this.submitStatus) {
        toast('正在提交中')
        return
      }
      if (!this.userInfo.key) {
        toast('请先获取用户信息')
        return
      }
      if (this.cart.length === 0) {
        toast('没有要提交的商品')
        return
      }
      const itemList = []
      for (let i = 0, il = this.cart.length; i < il; i++) {
        const list = this.cart[i].list
        // 跳过未开始的商品
        if (this.cart[i].timeStamp > (new Date()).getTime()) {
          break
        }
        for (let j = 0; j < list.length; j++) {
          const item = list[j]
          itemList.push({
            pai: item.acId,
            q: item.qty,
            sku: item.sku,
            pi: item.prId,
            eskuSn: item.eskuSn,
            pt: 'BRAND_HOUSE',
            title: item.prName
          })
        }
      }
      if (itemList.length === 0) {
        toast('没有要提交的商品')
        return
      }
      this.submitStatus = true
      request({
        url: 'index/submit',
        type: 'POST',
        data: {
          key: this.userInfo.key,
          tel: this.userInfo.mobileNo,
          name: this.userInfo.nickName,
          areaId: this.storeInfo.areaId,
          storeId: this.storeInfo.storeId,
          itemList
        }
      }).then(res => {
        this.submitStatus = false
        if (res.error === 0) {
          for (let i = 0; i < this.cart.length; i++) {
            const list = this.cart[i].list
            // 删除已经提交的商品
            if (this.cart[i].timeStamp < (new Date()).getTime()) {
              const item = this.cart.splice(i, 1)
              item.timer && item.timer.stop()
              i--
            }
          }
          this.cartTotal()
          toast('购买成功')
        } else {
          toast(res.message)
        }
      }).catch(err => {
        this.submitStatus = false
      })
    }
  }
});
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
    if (isEndTime) {
      time = time - now
    }
    this.formatStr = formatStr
    // 时间余数 保证在最后一下执行刚好时间结束
    const remainder = time % interval
    this.time = time - remainder
    this.onFunc && this.onFunc(endTime(this.time, this.formatStr))
    await asyncTimeOut(remainder)
    this.timer = setInterval(() => {
      this.time -= interval
      if (this.time <= 0) {
        this.stop()
        this.stopFunc && this.stopFunc()
        return
      }
      this.onFunc && this.onFunc(endTime(this.time, this.formatStr))
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