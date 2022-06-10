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


export default createStore({
    state: {
        queryParams: null,
        isLogined: false,
        userInfo: {},
        userHeadImg: '',
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
            let [, paramsString] = window.location.href.split('?');
            const params = paramsString && qs.parse(paramsString) || {};
            const queryParams = {
                ...params,
                id: params.id || params.state || '',
            };
            commit('setQueryParams', queryParams);
        },
        getImageList({ state, commit }) {
            const { id } = state.queryParams;
            if (!id) return;
            axios.get(`${window._businessRoot}v1/share/media/list?id=${id}`).then((res) => {
                const data = (((res && res.data || {}).data || {}).content || []).map(d => ({
                    ...d,
                    url: `${window._businessRoot}v1/file/img?id=${id}&md5=${d.md5}&option=2`,
                    thumbnailUrl: `${window._businessRoot}v1/file/img?id=${id}&md5=${d.md5}&option=1`,
                    originUrl: `${window._businessRoot}v1/file/img?id=${id}&md5=${d.md5}&option=0`,
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
            const { code, id } = state.queryParams;
            if (code) {
                dispatch('wxLogin');
                return;
            }
            const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
            const appid = 'wx1fcdb848faaefcf9';
            const redirect_uri = window.location.href.split('?')[0];
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
        handlerLogin({ state, dispatch }, payload) {
            const code = state.queryParams.code || '';
            const url = code ? '/app/user/social/wechat/login' : '/app/user/social/wechat/quick/login';
            return new Promise((resolve) => {
                axios.post(url, {
                    code,
                    ...payload,
                }).then((res) => {
                    dispatch('loginSuccess', (res && res.data || {}).data);
                    resolve();
                });
            });
        },
        loginSuccess({ state, commit }, payload) {
            commit('setURLStatic', {
                id: (state.queryParams || '').id || '',
                nickname: payload.nickname || '',
                token: payload.token || '',
            });
            commit('setUserInfo', payload);
            axios.get('/head/img').then((r) => {
                commit('setUserHeadImg', (r && r.data && r.data || {}).data);
            });
        },
        checkLoginStatus({ state, commit, dispatch }, payload) {
            const { token, nickname } = payload || {};
            return new Promise((resolve) => {
                window.localStorage.setItem('token', token);
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
