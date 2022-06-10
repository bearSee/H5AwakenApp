/*
 * @Author: 熊望
 * @Date: 2022-06-04 10:12:29
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-05 00:28:31
 * @FilePath: /nginx/Users/bear/Desktop/new-project/src/plugins/axios.js
 * @Description: 
 */
import axios from 'axios';
import store from '../store';
import { Toast } from 'vant';

// const root = `${window.location.protocol}//${window.location.host}`;
const baseRoot = 'https://api.hificloud.net/';
const businessRoot = 'http://agent.hificloud.net:8084/';

const axiosConfig = {
    baseURL: `${baseRoot}v1/`,
    timeout: 30 * 1000, // Timeout
    // withCredentials: true, // Check cross-site Access-Control
};
const Axios = axios.create(axiosConfig);
// 请求拦截
Axios.interceptors.request.use(
    (config) => {
        const token = window.localStorage.getItem('token') || '';
        config.headers = {
            ...config.headers,
            Authorization:`Bearer ${token}`,
        };
        if (config.loading) {
            Toast.clear();
            Toast.loading({
                duration: 0,
                message: config.loadingText || '页面加载中...',
                forbidClick: true,
            });
        }

        return config;
    },
    (error) => {
        Toast.clear();
        Promise.reject(error);
    },
);

// 响应拦截
Axios.interceptors.response.use(
    (res) => {
        Toast.clear();
        if (String((res.data || {}).status) === '200') return res;
        if (String((res.data || {}).status) === '401') {
            store.commit('clearAuthorization');
            return res;
        }
        Toast({
            message: (res.data || {}).message,
            forbidClick: true,
        });

        return Promise.reject(res);
    },
    (error) => {
        Toast.clear();
        Toast('服务器异常\n请稍后重试');
        return Promise.reject(error);
    },
);

window._baseRoot = baseRoot;
window._businessRoot = businessRoot;

export default Axios

