/*
 * @Author: 熊望
 * @Date: 2022-06-02 23:44:20
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-14 01:15:39
 * @FilePath: /nginx/Users/bear/Desktop/H5AwakenApp/src/store/index.js
 * @Description: 
 */

import { createStore } from 'vuex';
import axios from '@/plugins/axios';
import qs from 'qs';


export default createStore({
    state: {
        queryParams: null,
        isLogined: false,
        userInfo: {},
        userHeadImg: '',
        // empty/invalid/offline
        imageStatus: 'empty',
        images: [],
    },
    getters: {},
    mutations: {
        setQueryParams(state, payload) {
            state.queryParams = payload || {};
        },
        setLogined(state, payload) {
            state.isLogined = payload;
        },
        setUserInfo(state, payload) {
            state.userInfo = payload || {};
            window.localStorage.setItem('token', (payload || {}).token || '');
            window.localStorage.setItem('userInfo', JSON.stringify(payload || {}));
        },
        setUserHeadImg(state, payload) {
            state.userHeadImg = payload || '';
        },
        setImageStatus(state, payload) {
            state.imageStatus = payload || 'empty';
        },
        setImages(state, payload) {
            state.images = payload || [];
        },
        setURLStatic(state, payload = {}) {
            const host = window.location.href.split('?')[0];
            history.replaceState(null, null, `${host}?${qs.stringify(payload)}`);
        },
        clearAuthorization(state) {
            const queryParams = { id: state.queryParams.id || '' };
            state.queryParams = queryParams;
            state.userInfo = {};
            state.userHeadImg = '';
            state.isLogined = false;
            window.localStorage.clear();
            const host = window.location.href.split('?')[0];
            history.replaceState(null, null, `${host}?${qs.stringify(queryParams)}`);
        },
    },
    actions: {
        // 截取url所带参数
        // http://share.hificloud.net/share?id=629f0ab110043e0797a8a0f2
        getQueryParams({ commit }) {
            let [, paramsString = ''] = window.location.href.split('?');
            paramsString = paramsString.split('#/')[0];
            const queryParams = paramsString && qs.parse(paramsString) || {};
            window.sessionStorage.setItem('shareId', queryParams.id || '');
            commit('setQueryParams', queryParams);
        },
        getImageList({ commit }) {
            const shareId = window.sessionStorage.getItem('shareId');
            if (!shareId) return;
            axios.get(`${window._businessRoot}v1/share/media/list?id=${shareId}`).then((res) => {
                const data = (((res && res.data || {}).data || {}).content || []).map(d => ({
                    ...d,
                    url: `${window._businessRoot}v1/file/img?id=${shareId}&md5=${d.md5}&option=2`,
                    thumbnailUrl: `${window._businessRoot}v1/file/img?id=${shareId}&md5=${d.md5}&option=1`,
                    originUrl: `${window._businessRoot}v1/file/img?id=${shareId}&md5=${d.md5}&option=0`,
                }));
                commit('setImages', data);
            }).catch((err) => {
                const imageStatus = ({
                    1000001: 'offline',
                    1000002: 'invalid',
                })[(err && err.data || {}).status];
                commit('setImageStatus', imageStatus);
            });
        },
        /**
         * 调起用户授权界面获取code
         * wx1fcdb848faaefcf9
         * AppSecret: 496cf4fdf48ea6b5854f6c1bc13729b6
         */
        wxAuthorization({ state, dispatch }) {
            if (!/MicroMessenger/i.test(window.navigator.userAgent.toLowerCase())) return;
            const { code } = state.queryParams;
            if (code) {
                if (window.sessionStorage.getItem('tryWxLogin') !== '1') dispatch('wxLogin');
                return;
            }
            const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
            const appid = 'wx1fcdb848faaefcf9';
            const redirect_uri = (window.location.href.split('?')[0] || '').split('#/')[0];
            const response_type = 'code';
            const scope = 'snsapi_userinfo';
            const newUrl = `${url}?${qs.stringify({
                appid,
                redirect_uri,
                response_type,
                scope,
                state: '',
            })}#wechat_redirect`;
            window.location.href = newUrl;
        },
        wxLogin({ state, commit, dispatch }) {
            const { code } = state.queryParams;
            window.sessionStorage.setItem('tryWxLogin', '1');
            axios.post('/app/user/social/wechat/login', { code }).then((res) => {
                const data = (res && res.data || {}).data;
                dispatch('loginSuccess', data);
            }).catch(async (err) => {
                if (String((err && err.data || {}).status) === '1805') {
                    await commit('clearAuthorization');
                    dispatch('wxAuthorization');
                }
            });
        },
        handlerLogin({ state, dispatch }, payload) {
            return new Promise((resolve) => {
                axios.post('/app/user/social/wechat/quick/login', {
                    code: state.queryParams.code || '',
                    ...payload,
                }).then((res) => {
                    dispatch('loginSuccess', (res && res.data || {}).data);
                    resolve();
                });
            });
        },
        loginSuccess({ commit }, payload) {
            const queryParams = {
                id: window.sessionStorage.getItem('shareId'),
                nickname: payload.nickname || '',
                token: payload.token || '',
            };
            commit('setURLStatic', queryParams);
            commit('setQueryParams', queryParams);
            commit('setUserInfo', payload);
            axios.get('/head/img').then((r) => {
                commit('setUserHeadImg', ((r && r.data && r.data || {}).data || {}).url);
            });
        },
        checkLoginStatus({ state, commit, dispatch }, payload) {
            const { token, nickname } = payload || {};
            return new Promise((resolve) => {
                window.localStorage.setItem('token', token);
                if (!token) {
                    resolve(false);
                    commit('clearAuthorization');
                    return;
                }
                axios.get('/token/verify').then((res) => {
                    const isLogined = !!(res && res.data && res.data || {}).data;
                    if (isLogined) {
                        dispatch('loginSuccess', {
                            nickname: (state.queryParams || '').nickname || nickname || '',
                            token,
                        });
                        commit('setLogined', true);
                    } else {
                        commit('clearAuthorization');
                    }
                    resolve(isLogined);
                }).catch(() => {
                    resolve(false);
                    commit('clearAuthorization');
                });
            });
        },
    },
});
