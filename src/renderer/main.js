import Vue from 'vue'

import App from './App'

import iView from 'iview'
import 'iview/dist/styles/iview.css'

import VCharts from 'v-charts'

Vue.use(iView)
Vue.use(VCharts)
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')
