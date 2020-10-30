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
          <div class="close" @click="$emit('close')">关闭</div>
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
  // 门店
  'store': {
    data() {
      return {
        list: [],
        nav: [
          { name: '位置搜索', list: [], key: '' },
          { name: '门店搜索', list: [], key: '' },
          { name: '我的门店', list: [] }
        ],
        navHover: 0,
        addList: [], // 关键词检索的地址列表
      }
    },
    template: `
        <div class="store-root">
          <div class="store">
            <div id="amap"></div>
            <div class="right">
              <div class="nav">
                <div v-for="(item, index) in nav" class="item" :class="{hover: navHover === index}" @click="navHover = index">{{item.name}}</div>
              </div>
              <div class="content pos" v-if="navHover === 0">
                <input placeholder="请输入收货地址" @input="addSearch" />
                <div v-if="addList.length > 0" class="add-list">
                  <div class="item" v-for="item in addList">
                    <div class="name">{{item.name}}</div>
                    <div class="address">{{item.address}}</div>
                  </div>
                </div>
              </div>
              <div class="content name" v-if="navHover === 1">
                <input placeholder="请输入门店名称" />
              </div>
              <div class="content my" v-if="navHover === 2">
              
              </div>
            </div>
          </div>
        </div>
      `,
    mounted() {
      this.init()
    },
    methods: {
      init() {
        this.map = new AMap.Map('amap', {
          zoom: 16,
          mapStyle: 'amap://styles/grey', //设置地图的显示样式
        })
      },
      async addSearch(e) {
        this.addList = await searchQuick({
          url: 'index/amapGeo',
          data: {
            keyword: e.target.value
          }
        })
        console.log(this.addList)
      },
      async getList() {
        this.loading = true
        // this.list = await request({
        //   url: 'index/orderList'
        // })
        // this.loading = false
      }
    }
  },
}