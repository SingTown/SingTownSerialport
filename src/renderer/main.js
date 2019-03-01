import Vue from 'vue'

import App from './App'
import iView from 'iview'
import 'iview/dist/styles/iview.css'

import VCharts from 'v-charts'

import VueI18n from 'vue-i18n'
import zhLocale from 'iview/src/locale/lang/zh-CN'
import enLocale from 'iview/src/locale/lang/en-US'
import cn from './language/zh-CN'
import us from './language/en-US'

Vue.use(iView)
Vue.use(VCharts)

Vue.use(VueI18n)
Vue.locale = () => {}

const messages = {
  zh: Object.assign(cn, zhLocale),
  en: Object.assign(us, enLocale)
}

const i18n = new VueI18n({
  locale: localStorage.getItem('language') || 'zh',
  messages // set locale messages
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  i18n,
  template: '<App/>'
}).$mount('#app')
