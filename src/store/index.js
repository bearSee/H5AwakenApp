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

// const fileHost = axios.defaults.baseURL;
const fileHost = 'http://agent.hificloud.net:8084/v1/';

export default createStore({
    state: {
        queryParams: {},
        // userInfo: JSON.parse(window.localStorage.getItem('userInfo') || '{}'),
        userInfo: {},
        images: [],
    },
    getters: {},
    mutations: {
        setQueryParams(state, payload) {
            document.title = payload.sharer ? `来自${payload.sharer || 'xxx'}的分享` : '分享内容';
            state.queryParams = payload || {};
        },
        setUserInfo(state, payload) {
            state.userInfo = payload || {};
            window.localStorage.setItem('token', (payload || {}).token || '');
            window.localStorage.setItem('userInfo', JSON.stringify(payload || {}));
        },
        setImages(state, payload) {
            state.images = payload || [];
        },
        clearUserInfo(state) {
            state.queryParams = {};
            state.userInfo = {};
            state.images = [];
            window.localStorage.clear();
        },
    },
    actions: {
        // 截取url所带参数
        // http://share.hificloud.net/share?id=6295d4fe978a0c6fd07dba06
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
            dispatch('getImageList');
        },
        /**
         * 调起用户授权界面获取code
         * wx1fcdb848faaefcf9
         * AppSecret：496cf4fdf48ea6b5854f6c1bc13729b6
         * https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1fcdb848faaefcf9&redirect_uri=http%3A%2F%2Ftest.wechat.hificloud.net%2Fv1%2Fwxinfo&response_type=code&scope=snsapi_userinfo&state=STATE
         */
        wxAuthorization({ state, dispatch }) {
            const isWeixin = /MicroMessenger/i.test(window.navigator.userAgent.toLowerCase());
            if (!isWeixin) return;
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
                    code: state.queryParams.code,
                    ...payload,
                }).then((res) => {
                    const data = (res && res.data || {}).data;
                    dispatch('loginSuccess', data);
                    resolve();
                });
            });
        },
        loginSuccess({ commit }, payload) {
            commit('setUserInfo', payload);
        },
        getImageList({ state, commit }) {
            const { id } = state.queryParams;
            if (!id) return;
            axios.get(`http://agent.hificloud.net:8084/v1/share/media/list?id=${id}`).then((res) => {
            // axios.get(`http://localhost:8088/v1/share/media/list?id=${id}`).then((res) => {
                const data = (((res && res.data || {}).data || {}).content || []).map(d => ({
                    ...d,
                    url: `${fileHost}file/img?id=${id}&md5=${d.md5}&option=2`,
                    thumbnailUrl: `${fileHost}file/img?id=${id}&md5=${d.md5}&option=1`,
                    originUrl: `${fileHost}file/img?id=${id}&md5=${d.md5}&option=0`,
                }));
                commit('setImages', data);
            });
        },
    },
});
