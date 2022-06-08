/*
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-04 22:28:21
 * @FilePath: /nginx/Users/bear/Desktop/new-project/src/main.js
 * @Description: 
 */
import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import vant from 'vant';
import Axios from './plugins/axios';
import './assets/vant.css';

const app = createApp(App);

window.axios = Axios;
app.config.globalProperties.$http = Axios;

app.use(store).use(vant).mount('#app');

