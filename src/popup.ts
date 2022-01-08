import Vue from 'vue'
import Popup from './popup.vue'

Vue.config.productionTip = false;

new Vue({
    render: h => h(Popup),
}).$mount('#app');
