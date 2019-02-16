import Vue from 'vue'
import Options from './option_main.vue'

Vue.config.productionTip = false;

new Vue({
    render: h => h(Options),
}).$mount('#app');
