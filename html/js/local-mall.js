const query = class {

  // 请求对象
  static request = null

  // 数据库对象
  static db = null

  static init(datebase = 'xsyx') {
    this.request = window.indexedDB.open(datebase)
    this.request.onerror = event => {
      console.log('加载失败', event)
    }
    this.request.onsuccess = event => {
      this.db = event.target.result
      this.dbLoad()
    }
    this.request.onupgradeneeded = event => {
      // 保存 IDBDataBase 接口
      this.db = event.target.result

      // 为该数据库创建一个对象仓库
      let objectStore = this.db.createObjectStore('mall', { autoIncrement: true })
      objectStore.createIndex('sku', 'sku', { unique: true })
      objectStore.createIndex('prId', 'prId', { unique: false })
      objectStore.createIndex('windowId', 'windowId', { unique: false })
      objectStore.createIndex('verificationCode', 'verificationCode', { unique: false })

      objectStore = this.db.createObjectStore('priceLog', { autoIncrement: true })
      objectStore.createIndex('sku', 'sku', { unique: false })
    }
  }

  // 数据库加载成功
  static dbLoad() {
    // this.db.onerror = event => {
    //   console.log("数据库错误: ", event.target.error)
    // }
    for (const key in this.api) {
      if (this.api.hasOwnProperty(key)) {
        this.api[key].init(this.db)
      }
    }
  }

  static api = {
    mall: {
      db: null,
      mallStore: null,
      priceLogStore: null,
      init(db) {
        this.db = db
      },
      get(sku) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['mall'])
          transaction.onerror = event => {
            reject(event)
          }
          const mallStore = transaction.objectStore('mall')
          mallStore.index('sku').get(sku).onsuccess = e => {
            const { result } = e.target
            resolve(result)
          }
        })
      },
      /**
       * 插入商品 如果存在商品则更新商品
       * @param {onject} list 商品列表
       */
      async insert(mall) {
        const data = await this.get(mall.sku)
        return new Promise((resolve, reject) => {
          const objectStore = this.db.transaction(['mall'], 'readwrite').objectStore('mall')
          if (data) {
            objectStore.index('sku').openCursor(IDBKeyRange.only(mall.sku)).onsuccess = event => {
              const cursor = event.target.result
              if (cursor) {
                if (cursor.value.sku === mall.sku) {
                  const request = cursor.update(mall)
                  request.onsuccess = function () {
                    resolve()
                  }
                } else {
                  cursor.continue()
                }
              } else {
                reject('没有要更新的项目')
              }
            }


          } else {
            const request = objectStore.add(mall)
            request.onsuccess = event => {
              resolve(event.target.result)
            }
            request.onerror = event => {
              reject(event.target.error)
            }
          }
        })
      },
      async insertLog(mall) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['priceLog'], 'readwrite')
          transaction.onerror = event => {
            reject(event)
          }
          const priceLogStore = transaction.objectStore('priceLog')
          priceLogStore.index('sku').openCursor(IDBKeyRange.only(mall.sku), 'prev').onsuccess = event => {
            const cursor = event.target.result
            const data = {
              sku: mall.sku,
              saleAmt: mall.saleAmt,
              date: mall.tmBuyStart.substr(0, 10)
            }
            // 插入商品记录
            if (!cursor || (cursor.value.saleAmt !== data.saleAmt && cursor.value.date != data.tmBuyStart)) {
              priceLogStore.add(data).onsuccess = () => resolve()
            } else {
              resolve()
            }
          }
        })
      },
      async getLog(sku) {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['mall', 'priceLog'])
          transaction.onerror = event => {
            reject(event)
          }
          const data = {
            log: [],
            max: 0,
            min: 0,
            trend: 'flat', // up 上涨 flat持平 down下降
          }
          const priceLogStore = transaction.objectStore('priceLog')
          priceLogStore.index('sku').openCursor(IDBKeyRange.only(sku)).onsuccess = e => {
            const cursor = e.target.result
            if (cursor) {
              data.log.push(cursor.value)
              cursor.continue()
            } else {
              if (data.log.length > 0) {
                const prices = data.log.map(item => item.saleAmt)
                data.min = Math.min(...prices)
                data.max = Math.max(...prices)
                if (prices.length >= 2) {
                  const lastTwo = prices.slice(prices.length - 2)
                  data.trend = lastTwo[0] > lastTwo[1] ? 'down' : lastTwo[0] < lastTwo[1] ? 'up' : 'flat'
                }
              }
              resolve(data)
            }
          }
        })
      },
      /**
       * 插入商品列表 如果存在商品则更新商品
       * @param {array} list 商品列表
       */
      async insertList(list) {
        for (let i = 0, l = list.length; i < l; i++) {
          try {
            await this.insert(list[i])
            await this.insertLog(list[i])
          } catch (error) {
            console.log('插入失败', error)
          }
        }
      }
    }
  }
}
// 初始化数据库
query.init()

const localMall = {
  status: 0, // 0 未采集 1 采集中 2已完成 3失败
  /**
   * 开始本地数据任务
   * @param {array} cates 分类
   */
  async start(cates) {
    if (this.status !== 0) {
      return
    }
    let last = localStorage.getItem('lastLocalMall')
    if (last) {
      last = JSON.parse(last)
      // 超过晚上11点就可以重新采集了 或者已经过去12小时再重新采集
      const time = (new Date()).getTime()
      // 今天晚上11点的时间戳
      const date23 = strToDate(dateToStr('yyyy-MM-dd 23:00:00'))
      // 在今天23点以后采集过数据
      if (time > date23 && last.startTime > date23) {
        this.status = 2
        console.log('今天23点采集过')
        return
      }
      // 今天采集过数据
      if (time <= date23 && dateToStr('yyyy-MM-dd') === dateToStr('yyyy-MM-dd', last.startTime)) {
        this.status = 2
        console.log('今天采集过')
        return
      }
    }
    console.log('开始采集')
    this.status = 1
    const startTime = (new Date()).getTime()
    let count = 0
    for (let i = 0; i < cates.length; i++) {
      const list = await this.getMalls(cates[i].windowId)
      count += list.length
    }
    this.status = 2
    localStorage.setItem('lastLocalMall', JSON.stringify({
      startTime,
      endTime: (new Date()).getTime(),
      count
    }))
  },
  async getMalls(windowId) {
    const list = await request({
      url: 'index/malls',
      data: {
        id: windowId,
        disableQty: true
      }
    })
    query.api.mall.insertList(list)
    await asyncTimeOut(96)
    return list
  }
}