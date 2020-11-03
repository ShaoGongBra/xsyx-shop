const vueComponents = {
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
  },
  'order': {
    data() {
      return {
        list: {
          pay: [],
          paid: []
        },
        loading: true
      }
    },
    template: `
        <div class="order">
          <div class="scroll">
            <div class="group">
              <div class="tip">待支付</div>
              <div class="empty" v-if="list.pay.length === 0 && !loading">没有订单</div>
              <div class="item" v-for="item in list.pay" :key="item.orderId">
                <div class="head">
                  <div class="date">{{dateToStr('yyyy-MM-dd HH:mm:ss', item.orderDate)}}</div>
                </div>
                <div class="goods" v-for="goods in item.itemList" :key="goods.productId">
                  <img :src="goods.thumbnailsUrl" />
                  <div class="info">
                    <div class="name">{{goods.productName}}</div>
                    <div class="bottom">
                      <div class="price">{{goods.itemAdjustedPrice}}<span>{{goods.itemListPrice}}</span></div>
                      <div class="num">x{{goods.qty}}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="group">
              <div class="tip">待提货</div>
              <div class="empty" v-if="list.paid.length === 0 && !loading">没有订单</div>
              <div class="item" v-for="item in list.paid" :key="item.orderId">
                <div class="head">
                <div class="date">{{dateToStr('yyyy-MM-dd HH:mm:ss', item.orderDate)}}</div>
                  <div class="code">提货码：{{item.billOfLading}}</div>
                </div>
                <div class="goods" v-for="goods in item.itemList" :key="goods.productId">
                  <img :src="goods.thumbnailsUrl" />
                  <div class="info">
                    <div class="name">{{goods.productName}}</div>
                    <div class="bottom">
                      <div class="price">￥{{goods.itemAdjustedPrice}}<span>￥{{goods.itemListPrice}}</span></div>
                      <div class="num">x{{goods.qty}}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    mounted() {
      this.getList()
    },
    watch: {
      'mall.prId'() {
        this.getInfo()
      }
    },
    methods: {
      async getList() {
        this.loading = true
        this.list = await request({
          url: 'index/orderList'
        })
        this.loading = false
      }
    }
  },
  // 设置
  setting: {
    data() {
      return {
        setting: window.getSetting()
      }
    },
    template: `
      <div class="setting">
        <div class="scroll">
          <div class="group">
            <div class="title">提货人信息</div>
            <div class="item">
              <div class="name">姓名</div>
              <input class="value" :value="setting.name" @change="input('name', $event)" placeholder="提货人姓名" />
            </div>
            <div class="item">
              <div class="name">电话</div>
              <input class="value" :value="setting.tel" maxlength="11" @change="input('tel', $event)" placeholder="提货人电话" />
            </div>
          </div>
        </div>
      </div>
    `,
    methods: {
      input(key, e) {
        this.setting[key] = e.target.value
        if (key === 'name' && e.target.value !== '') {
          this.save()
        }
        if (key === 'tel' && e.target.value.length === 11) {
          this.save()
        }
      },
      save() {
        localStorage.setItem('setting', JSON.stringify(this.setting))
      }
    }
  },
  // 关于
  about: {
    data() {
      return {
        version: require("../package.json").version
      }
    },
    template: `
      <div class="about">
        <div class="name">兴盛优选PC端购物</div>
        <p class="version">v{{version}}  <span class="link" @click="open">GitHub</span></p>
        <p class="part">&nbsp;&nbsp;&nbsp;&nbsp;为了方便使用特地开发了一个用electron开发的兴盛优选的PC端，编译后可运行在Windows和MacOS以及Linux系统上。本软件完全免费开源，请前往<span class="link" @click="open">GitHub</span>获取相关代码和发布版本。</p>
      </div>
    `,
    methods: {
      nav(url) {
        const { shell } = require('electron')
        shell.openExternal(url)
      },
      open() {
        this.nav('https://github.com/ShaoGongBra/xsyx-shop')
      }
    }
  },
  // 门店
  store: {
    components: {
      'store-list': {
        props: ['data'],
        template: `
          <div class="store-list">
            <div class="item" v-for="(item, index) in data.list" :class="{hover: data.listSelect === index}" @click="data.onSelect(index)">
              <div v-if="item.storeId === userInfo.storeInfo.storeId" class="tip">当前门店</div>
              <img :src="item.storePhoto" />
              <div class="right">
                <div class="name number-of-lines">{{item.storeName}}</div>
                <div class="address number-of-lines--2">{{item.detailAddress}}</div>
              </div>
            </div>
          </div>
        `
      }
    },
    data() {
      return {
        show: false,
        cssShow: false,
        nav: [
          {
            name: '位置搜索', list: [], key: '', listSelect: 0, onSelect: (index) => {
              this.nav[0].listSelect = index
              this.moveType = 'not-get'
              this.moveMapToStore(this.nav[0].list[index])
            }
          },
          {
            name: '门店搜索', list: [], key: '', listSelect: 0, onSelect: (index) => {
              this.nav[1].listSelect = index
              this.moveMapToStore(this.nav[1].list[index])
            }
          },
          {
            name: '我的门店', list: [], listSelect: 0, onSelect: (index) => {
              this.nav[2].listSelect = index
              this.moveMapToStore(this.nav[2].list[index])
            }
          }
        ],
        navHover: 0,
        addList: [], // 关键词检索的地址列表
        city: '', // 当前城市
        locationCity: '', // 自动定位获取的城市
        cityList: [], // 系统系统的城市列表
        cityShow: false,
        cityKeyword: '', //搜索关键词
        cityPid: 0, // 筛选省份
      }
    },
    template: `
      <div v-if="show" class="store-root">
        <div class="store" :class="{show: cssShow}" @click="closePop">
          <div id="amap"></div>
          <div v-if="navHover === 0" class="city" @click="stopPropagation">
            <div class="name">{{city}} <span @click="getCity">[切换]</span></div>
            <div v-if="cityShow" class="select">
              <input placeholder="请输入城市" @input="citySearch" />
              <div class="level-1">
                <div class="item" :class="{hover: cityPid === 0}" @click="cityPid = 0">全部</div>
                <div class="item" v-for="item in filterCity(1)" :class="{hover: cityPid === item.id}" @click="cityPid = item.id">{{item.name}}</div>
              </div>
              <div class="level-2">
                <div class="item" v-for="item in filterCity(2)" @click="switchCity(item.name)">{{item.name}}</div>
              </div>
            </div>
          </div>
          <div class="tips">提示：门店地图位置信息由地图自动识别生成，仅提供参考，请以实际位置为准！</div>
          <svg v-if="navHover === 0" t="1604147570004" class="position" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10416" width="64" height="64"><path d="M496 336h32v688h-32z" fill="#999" p-id="10417"></path><path d="M512 312m-312 0a312 312 0 1 0 624 0 312 312 0 1 0-624 0Z" fill="#999" p-id="10418"></path><path d="M512 320m-120 0a120 120 0 1 0 240 0 120 120 0 1 0-240 0Z" fill="#2e2e2e" p-id="10419"></path></svg>
          <div class="right" @click="closeAddList">
            <div class="nav">
              <div v-for="(item, index) in nav" class="item" :class="{hover: navHover === index}" @click="switchNav(index)">{{item.name}}</div>
            </div>
            <div class="content pos" v-if="navHover === 0">
              <input placeholder="请输入收货地址" @input="addSearch" :value="nav[0].key" />
              <div v-if="addList.length > 0" class="add-list">
                <div class="item" v-for="item in addList" @click="moveMap(item.location)">
                  <div class="name">{{item.name}}</div>
                  <div class="address">{{item.address}}</div>
                </div>
              </div>
              <store-list :data="nav[0]"></store-list>
            </div>
            <div class="content name" v-if="navHover === 1">
              <input placeholder="请输入门店名称" @input="storeSearch" :value="nav[1].key" />
              <store-list :data="nav[1]"></store-list>
            </div>
            <div class="content my" v-if="navHover === 2">
              <store-list :data="nav[2]"></store-list>
            </div>
            <div class="btns">
              <div class="btn cancel" @click="cancel">取消</div>
              <div class="btn" @click="submit" :class="{hover: nav[navHover].list[nav[navHover].listSelect]}">确定选择</div>
            </div>
          </div>
        </div>
      </div>
    `,
    mounted() {
      // this.init()
    },
    methods: {
      select() {
        this.show = true
        this.$nextTick(() => {
          this.init()
        })
        return new Promise((resolve, reject) => {
          this.returnFunc = [resolve, reject]
        })
      },
      init() {
        this.cssShow = true
        this.map = new AMap.Map('amap', {
          zoom: 17,
          mapStyle: 'amap://styles/grey', //设置地图的显示样式
        })
        this.map.on('moveend', e => {
          this.getPosStore()
        })
        AMap.plugin('AMap.CitySearch', () => {
          const citySearch = new AMap.CitySearch()
          citySearch.getLocalCity((status, result) => {
            if (status === 'complete' && result.info === 'OK') {
              // 查询成功，result即为当前所在城市信息
              this.city = result.city
              this.locationCity = result.city
            }
          })
        })
      },
      // 点击底层官博弹出框
      closePop() {
        this.cityShow = false
      },
      stopPropagation(e) {
        e.stopPropagation()
      },
      // 取消选择
      cancel() {
        this.map.destroy()
        this.cssShow = false
        setTimeout(() => this.show = false, 300)
        this.navHover = 0
        this.returnFunc[1] && this.returnFunc[1]()
      },
      // 确定选择
      async submit() {
        const store = this.nav[this.navHover].list[this.nav[this.navHover].listSelect]
        if (!store) {
          return
        }
        if (store.storeId === userInfo.storeInfo.storeId) {
          this.returnFunc[0] && this.returnFunc[0](store)
        }
        await request({
          url: 'index/editStore',
          data: {
            id: store.storeId
          }
        })
        this.map.destroy()
        this.cssShow = false
        setTimeout(() => this.show = false, 300)
        this.navHover = 0
        this.returnFunc[0] && this.returnFunc[0](store)
      },
      // 获取城市
      async getCity() {
        if (this.cityList.length === 0) {
          this.cityList = await request({
            url: 'index/getStoreCity'
          })
        }
        this.cityShow = true
      },
      citySearch(e) {
        this.cityKeyword = e.target.value
      },
      filterCity(level = 1) {
        return this.cityList.filter(item => {
          if (level === 1) {
            return item.level === 1
          } else {
            return item.level === 2
              && (!this.cityKeyword || item.name.indexOf(this.cityKeyword) !== -1)
              && (!this.cityPid || item.parentId === this.cityPid)
          }
        })
      },
      switchCity(name) {
        this.city = name
        this.cityShow = false
      },
      // 导航切换
      switchNav(index) {
        this.navHover = index
        if (index === 2) {
          this.myStore()
        } else {
          this.markStoreMap()
          this.moveMapToStore(this.nav[index].list[this.nav[index].listSelect])
        }
      },
      // 地址搜索
      async addSearch(e) {
        this.nav[0].key = e.target.value
        this.addList = await searchQuick({
          url: 'index/amapGeo',
          data: {
            keyword: e.target.value,
            city: this.city
          }
        })
      },
      // 关闭地址列表
      closeAddList() {
        this.addList = []
      },
      // 移动地图到指定位置
      moveMap(position) {
        this.map.setCenter(position.split(',').map(item => Number(item)))
      },
      // 根据地图中心点获取门店列表
      async getPosStore() {
        if (this.navHover !== 0) {
          return
        }
        if (this.moveType === 'not-get') {
          this.moveType = ''
          return
        }
        this.nav[0].list = await request({
          url: 'index/getPosStore',
          data: {
            ...this.map.getCenter(),
            city: this.city
          }
        })
        this.nav[0].listSelect = this.nav[0].list.length > 0 ? 0 : -1
        this.markStoreMap()
      },
      // 关键词搜索门店
      async storeSearch(e) {
        this.nav[1].key = e.target.value
        this.nav[1].list = await searchQuick({
          url: 'index/getKeywordStore',
          data: {
            keyword: e.target.value
          }
        })
        this.nav[1].listSelect = this.nav[1].list.length > 0 ? 0 : -1
        this.markStoreMap()
        this.moveMapToStore(this.nav[1].list[0])
      },
      // 我的门店
      async myStore() {
        if (this.nav[2].list.length === 0) {
          this.nav[2].list = await request({
            url: 'index/getUserStore'
          })
          this.nav[2].listSelect = this.nav[2].list.length > 0 ? 0 : -1
        }
        this.markStoreMap()
        this.moveMapToStore(this.nav[2].list[this.nav[2].listSelect])
      },
      moveMapToStore(store) {
        if (!store) {
          return
        }
        this.map.setCenter([store.mapX, store.mapY])
      },
      // 将点标记在地图上
      markStoreMap() {
        if (this.markers) {
          this.map.remove(this.markers)
        }
        const list = this.nav[this.navHover].list
        const icon = new AMap.Icon({
          size: new AMap.Size(36, 36),    // 图标尺寸
          image: './image/store.png',  // Icon的图像
          imageOffset: new AMap.Pixel(0, 0),  // 图像相对展示区域的偏移量，适于雪碧图等
          imageSize: new AMap.Size(36, 36)   // 根据所设置的大小拉伸或压缩图片
        })
        this.markers = list.map(item => new AMap.Marker({
          position: [item.mapX, item.mapY],
          title: item.storeName,
          offset: new AMap.Pixel(-18, -36),
          icon,
        }))
        this.map.add(this.markers)
      }
    }
  },
}