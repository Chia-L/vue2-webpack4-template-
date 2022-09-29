import 'babel-polyfill'
// 核心库
import Vue from 'vue'
import VueCookies from 'vue-cookies'
import router from './router'
import store from './store'
import App from './App'
// 第三方UI库
import 'view-design/dist/styles/iview.css'
import 'element-ui/lib/theme-chalk/index.css'
import 'vxe-table/lib/style.css'
import '@/assets/iconfont/iconfont.woff'
import '@/assets/iconfont/iconfont.ttf'
import '@/assets/iconfont/iconfont.css'
import '@/assets/less/comm.less'
import '@/assets/less/global.less'
import 'amfe-flexible'
import ViewUI from 'view-design'
import Element from 'element-ui'
import 'xe-utils'
import VXETable from 'vxe-table'
import '@/assets/iconfont/iconfont.js'

// 自己的库

Vue.use(ViewUI)
Vue.use(Element)
Vue.use(VXETable)
Vue.use(VueCookies)

Vue.config.productionTip = false

// 全局路由守卫
/* router.beforeEach((to, form, next) => {

}) */

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
  components: { App },
  template: '<App/>'
})
