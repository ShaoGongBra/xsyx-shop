const Dexie = require('dexie')
const query = class {
  static db = null
  static init() {
    this.db = new Dexie('xsyx')
    // console.log(this.db)
    this.db.version(0.4).stores({
      mall: '++,prId,&sku,skuSn,windowId,areaId,saleAmt,prName,tmBuyStart,prType,buyDate,wave,minimum,lowPrice,openLowPrice,isLowPrice',
      priceLog: '++,sku,date,saleAmt'
    })
    this.db.open()
  }

  static mall = {
    async get(sku) {
      return query.db.mall.get({ sku })
    },
    dayList: [],
    areaId: null,
    async getDayList() {
      const { areaId } = window.userInfo.storeInfo
      if (this.dayList.length > 0 && this.areaId === areaId) {
        return this.dayList
      }
      await localMall.onLoad()
      const where = {
        areaId: window.userInfo.storeInfo.areaId,
        buyDate: dateToStr('HH') === '23' ? dateToStr('yyyy-MM-dd', dateAdd('d', 1)) : dateToStr('yyyy-MM-dd')
      }
      this.dayList = await query.db.mall.where(where).toArray()
      this.areaId = areaId
      return this.dayList
    },
    // 价格波动商品
    async getPriceList(windowId) {
      const list = await this.getDayList()
      const windowIds = {
        '-1': list => list.filter(item => item.wave < 0),
        '-2': list => list.filter(item => item.wave > 0),
        '-3': list => list.filter(item => item.minimum !== 0)
      }
      return windowIds[windowId](list)
    },
    async getSpuSnMall(spuSns) {
      const list = await this.getDayList()
      return list.filter(item => spuSns.includes(item.spuSn))
    },
    async getKeywordMall(keyword) {
      const list = await this.getDayList()
      return list.filter(item => item.prName.indexOf(keyword) !== -1)
    },
    async getLog(sku) {
      const data = {
        log: await query.db.priceLog.where({ sku }).toArray(),
        max: 0,
        min: 0,
        trend: 'flat', // up 上涨 flat持平 down下降
        minimum: false, // 历史最低价
        highest: false, // 历史最高价
      }
      if (data.log.length > 0) {
        const last = data.log[data.log.length - 1]
        const now = todayText()
        if (last.date !== now) {
          data.log.push({
            date: now,
            saleAmt: last.saleAmt
          })
        }
        const prices = data.log.map(item => item.saleAmt)
        data.min = Math.min(...prices)
        data.max = Math.max(...prices)
        if (prices.length >= 2) {
          if (data.min === prices[prices.length - 1]) {
            data.minimum = true
          }
          if (data.max === prices[prices.length - 1]) {
            data.highest = true
          }
          const lastTwo = prices.slice(prices.length - 2)
          data.trend = lastTwo[0] > lastTwo[1] ? 'down' : lastTwo[0] < lastTwo[1] ? 'up' : 'flat'
        }
      }
      return data
    },

    /**
     * 编辑商品信息
     * @param {*} sku 
     * @param {*} info 商品信息
     */
    async editMall(sku, info = {}) {
      // 更新商品信息
      const keys = await query.db.mall.where({ sku }).primaryKeys()
      if (keys[0]) {
        const item = await this.get(sku)
        query.db.mall.put({ ...item, ...info }, keys[0])
      }
    },
    /**
     * 插入商品列表 如果存在商品则更新商品
     * @param {array} list 商品列表
     */
    async insertList(list) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        item.buyDate = item.tmBuyStart.substr(0, 10)
        item.minimum = 0
        const log = await query.db.priceLog.where({ sku: item.sku }).desc().toArray()
        // 插入日志
        if (!log[0] || item.saleAmt !== log[0].saleAmt) {
          const data = {
            sku: item.sku,
            saleAmt: item.saleAmt,
            date: item.buyDate
          }
          await query.db.priceLog.add(data)
          log.unshift(data)
        }
        // 只记录当天有价格变动的商品
        if (log.length === 1 || log[0].date !== todayText()) {
          item.wave = 0
        } else {
          item.wave = Number((log[0].saleAmt - log[1].saleAmt).toFixed(2))
        }
        const prices = log.map(item => item.saleAmt)
        item.minimum = Math.min(...prices) >= item.saleAmt && item.saleAmt < Math.max(...prices) ? 1 : 0

        // 更新商品信息
        const keys = await query.db.mall.where({ sku: item.sku }).primaryKeys()
        if (!keys[0]) {
          query.db.mall.add(item)
        } else {
          // 低价订阅
          const mall = await this.get(item.sku)
          mall.isLowPrice = mall.openLowPrice && mall.lowPrice >= item.saleAmt ? 1 : 0
          query.db.mall.put({ ...mall, ...item }, keys[0])
        }
      }
    }
  }
}

query.init()

const localMall = {
  status: 0, // 0 未采集 1 采集中
  onLoadCallbacks: [],
  onLoad() {
    if (this.status === 0) {
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      this.onLoadCallbacks.push([resolve, reject])
    })
  },
  execCallBack() {
    for (let i = 0; i < this.onLoadCallbacks.length; i++) {
      this.onLoadCallbacks[i][0]()
    }
    this.onLoadCallbacks = []
  },
  /**
   * 开始本地数据任务
   * @param {array} cates 分类
   */
  async start(cates) {
    this.cates = cates
    if (this.status !== 0) {
      return
    }
    const { areaId } = window.userInfo.storeInfo
    let last = localStorage.getItem('lastLocalMall')
    if (last) {
      // 地区id
      const areaLast = JSON.parse(last)[areaId]
      if (areaLast) {
        // 超过晚上11点就可以重新采集了 或者已经过去12小时再重新采集
        const time = (new Date()).getTime()
        // 今天晚上11点的时间戳
        const date23 = strToDate(dateToStr('yyyy-MM-dd 23:00:00'))
        // 在今天23点以后采集过数据
        if (time > date23 && areaLast.startTime > date23) {
          this.execCallBack()
          console.log('今天23点采集过')
          return
        }
        // 今天采集过数据
        if (time <= date23 && dateToStr('yyyy-MM-dd') === dateToStr('yyyy-MM-dd', areaLast.startTime)) {
          console.log('今天采集过')
          this.execCallBack()
          return
        }
      }
    }
    console.log('开始采集')
    this.status = 1
    const startTime = (new Date()).getTime()
    let count = 0
    for (let i = 0; i < cates.length; i++) {
      if (cates[i].windowId < 0) {
        continue
      }
      const list = await this.getMalls(cates[i].windowId)
      count += list.length
    }
    this.status = 0
    localStorage.setItem('lastLocalMall', JSON.stringify({
      ...(last ? JSON.parse(last) : {}),
      startTime,
      endTime: (new Date()).getTime(),
      count,
      [areaId]: {
        startTime,
        endTime: (new Date()).getTime(),
        count,
      }
    }))
    this.execCallBack()
  },
  async getMalls(windowId) {
    const list = await request({
      url: 'index/malls',
      data: {
        id: windowId,
        disableQty: true
      }
    })
    query.mall.insertList(list)
    return list
  }
}