const { ipcRenderer } = require('electron');
(that => {
  that.ajaxCallBackList = []
  that.ajaxCallBack = (event, res) => {
    const index = that.ajaxCallBackList.findIndex(item => item[0] === res.key)
    if (index !== -1) {
      const item = that.ajaxCallBackList.splice(index, 1)[0]
      if (res.success) {
        item[1](res.data)
      } else {
        item[2](res)
      }
    }
  }
  ipcRenderer.on('request-callback', that.ajaxCallBack)
  that.ajax = ({ demain = 'mall.xsyxsc.com', url, protocol = 'https', method = 'GET', data = {}, type = 'json' }) => {
    return new Promise((resolve, reject) => {
      const { userInfo = {} } = window
      const { storeInfo = {} } = userInfo
      method = method.toUpperCase()
      data = {
        areaId: storeInfo.areaId || '',
        provinceCode: storeInfo.provinceId || '',
        cityCode: storeInfo.cityId || '',
        areaCode: storeInfo.countyId || '',
        storeId: storeInfo.storeId || '',
        userKey: userInfo.key || '',

        saleRegionCode: storeInfo.areaId || '',
        ...data
      }
      const requestKey = `${(new Date()).getTime()}${Math.random() * 10000 | 0}`
      that.ajaxCallBackList.push([requestKey, resolve, reject])
      ipcRenderer.send('request', {
        url: `${protocol}://${demain}/${url}`,
        method,
        data,
        type,
        headers: {
          source: 'applet',
          userKey: userInfo.key || '',
          version: '1.10.34',
          Referer: 'https://servicewechat.com/wx6025c5470c3cb50c/223/page-frame.html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat'
        },
        key: requestKey
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
  /**
   * 日期计算  
   * @param {string} strInterval 可选值 y 年 m月 d日 w星期 ww周 h时 n分 s秒  
   * @param {int} num 对应数值
   * @param {Date} date  日期对象
   * @return {Date} 返回计算后的日期对象
   */
  that.dateAdd = (strInterval, num, date = new Date()) => {
    switch (strInterval) {
      case 's': return new Date(date.getTime() + (1000 * num))
      case 'n': return new Date(date.getTime() + (60000 * num))
      case 'h': return new Date(date.getTime() + (3600000 * num))
      case 'd': return new Date(date.getTime() + (86400000 * num))
      case 'w': return new Date(date.getTime() + ((86400000 * 7) * num))
      case 'm': return new Date(date.getFullYear(), (date.getMonth()) + num, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
      case 'y': return new Date((date.getFullYear() + num), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
    }
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
  that.countDown = class {
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

})(window)