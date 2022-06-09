/*
 * @Author: 熊望
 * @Date: 2022-06-02 23:44:20
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-05 01:23:10
 * @FilePath: /nginx/Users/bear/Desktop/new-project/src/store/index.js
 * @Description: 
 */

import { createStore } from 'vuex';
import axios from '@/plugins/axios';
import qs from 'qs';

const fileHost = axios.defaults.baseURL;
// const fileHost = 'http://agent.hificloud.net:8084/v1/';

export default createStore({
    state: {
        queryParams: {},
        userInfo: {},
        images: [],
    },
    getters: {},
    mutations: {
        setQueryParams(state, payload) {
            state.queryParams = payload || {};
        },
        setUserInfo(state, payload) {
            state.userInfo = payload || {};
            window.localStorage.setItem('token', (payload || {}).token || '');
            window.localStorage.setItem('userInfo', JSON.stringify(payload || {}));
        },
        setShareInfo(state, payload) {
            document.title = payload.sharer ? `来自${payload.nickname || 'xxx'}的分享` : '分享内容';
            state.shareInfo = payload || {};
        },
        setImages(state, payload) {
            state.images = payload || [];
        },
        setURLStatic(state, payload = {}) {
            const host = window.location.href.split('?')[0];
            history.replaceState(null, null, `${host}?${qs.stringify(payload)}`);
        },
        clearUserInfo(state) {
            state.queryParams = { id: state.queryParams.id || '' };
            state.userInfo = {};
            window.localStorage.clear();
        },
    },
    actions: {
        // 截取url所带参数
        // http://share.hificloud.net/share?id=629f0ab110043e0797a8a0f2
        getQueryParams({ commit, dispatch }) {
            let [host, paramsString] = window.location.href.split('?');
            if (host && host[host.length - 1] === '/') host = host.slice(0, host.length - 1);
            const params = paramsString && qs.parse(paramsString) || {};
            const queryParams = {
                host,
                ...params,
                id: params.id || params.state || '',
            };
            commit('setQueryParams', queryParams);
            dispatch('getShareInfo');
            dispatch('getImageList');
            // 从url参数判断是否已经登录
            const { token, nickname } = queryParams;
            if (token) {
                dispatch('loginSuccess', { nickname, token });
                return;
            }
            // 从本地存储判断是否已经登录
            const historyInfo = window.localStorage.getItem('userInfo');
            if (historyInfo) {
                try {
                    dispatch('loginSuccess', JSON.parse(historyInfo));
                } catch (error) {
                    dispatch('wxAuthorization');
                    console.error('error:', error);
                }
                return;
            }
            dispatch('wxAuthorization');
        },
        getShareInfo({ state, commit }) {
            const { id } = state.queryParams;
            if (!id) return;
            axios.get(`/share/album/ghost/${id}`).then((res) => {
                const data = (((res && res.data || {}).data || {}).context || {}).owner || {};
                commit('setShareInfo', data);
            });
        },
        getImageList({ state, commit }) {
            const { id } = state.queryParams;
            if (!id) return;
            axios.get(`/share/media/list?id=${id}`).then((res) => {
                const data = (((res && res.data || {}).data || {}).content || []).map(d => ({
                    ...d,
                    url: `${fileHost}file/img?id=${id}&md5=${d.md5}&option=2`,
                    thumbnailUrl: `${fileHost}file/img?id=${id}&md5=${d.md5}&option=1`,
                    originUrl: `${fileHost}file/img?id=${id}&md5=${d.md5}&option=0`,
                }));
                commit('setImages', data);
            });
        },
        /**
         * 调起用户授权界面获取code
         * wx1fcdb848faaefcf9
         * AppSecret：496cf4fdf48ea6b5854f6c1bc13729b6
         */
        wxAuthorization({ state, dispatch }) {
            if (!/MicroMessenger/i.test(window.navigator.userAgent.toLowerCase())) return;
            const { host, code, id } = state.queryParams;
            if (code) {
                dispatch('wxLogin');
                return;
            }
            const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
            const appid = 'wx1fcdb848faaefcf9';
            const redirect_uri = `${host}`;
            const response_type = 'code';
            const scope = 'snsapi_userinfo';
            const newUrl = `${url}?${qs.stringify({
                appid,
                redirect_uri,
                response_type,
                scope,
                state: id,
            })}#wechat_redirect`;
            window.location.href = newUrl;
        },
        wxLogin({ state, dispatch }) {
            const { code } = state.queryParams;
            axios.post('/app/user/social/wechat/login', { code }).then((res) => {
                const data = (res && res.data || {}).data;
                dispatch('loginSuccess', data);
            });
        },
        accountLogin({ state, dispatch }, payload) {
            return new Promise((resolve) => {
                axios.post('/app/user/social/wechat/quick/login', {
                    code: state.queryParams.code || '',
                    ...payload,
                }).then((res) => {
                    const data = (res && res.data || {}).data;
                    dispatch('loginSuccess', data);
                    resolve();
                });
            });
        },
        loginSuccess({ state, commit }, payload) {
            const { id } = state.queryParams;
            const { nickname, token } = payload;
            commit('setURLStatic', { id, nickname, token });
            commit('setUserInfo', payload);
            axios.get('/checklogin');
        },
    },
});
