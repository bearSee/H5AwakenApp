/*
 * @Author: 熊望
 * @Date: 2022-06-02 23:44:20
 * @LastEditors: 熊望
 * @LastEditTime: 2022-09-22 22:43:42
 * @FilePath: /nginx/Users/bear/projects/project-bear/H5AwakenApp/src/store/index.js
 * @Description: 
 */

import { createStore } from 'vuex';
import { Toast } from 'vant';
import wx from 'weixin-js-sdk';
import axios from '@/plugins/axios';
import qs from 'qs';

const ua = window.navigator.userAgent.toLowerCase();
const listener = () => {
    history.pushState(null, null, document.URL);
};

export default createStore({
    state: {
        appId: 'wx1fcdb848faaefcf9',
        applicationId: 'wx5c2b5476a236a98e',
        // 是否完成签名配置
        isSignatured: true,
        queryParams: null,
        isLogined: false,
        isLoading: false,
        userInfo: {},
        // 分享概要信息
        shareInfo: {},
        // empty/invalid/offline/cancel
        shareStatus: 'invalid',
        files: {},
        albums: {},
        images: [],
        assetConfig: null,
        isWeixin: /MicroMessenger/i.test(ua),
        isAndroid: /Android|Adr/i.test(ua),
        isIOS: /iPhone|iPod|iPad/i.test(ua),
        // 全屏弹窗提示用户下载app
        overlayVisible: false,
    },
    getters: {},
    mutations: {
        setQueryParams(state, payload) {
            state.queryParams = payload || {};
        },
        setAssetConfig(state, payload) {
            state.assetConfig = payload || {};
        },
        setLogined(state, payload) {
            state.isLogined = payload;
        },
        setLoading(state, payload) {
            state.isLoading = payload;
        },
        setShareStatus(state, payload) {
            state.shareStatus = payload || 'invalid';
        },
        setUserInfo(state, payload) {
            state.userInfo = payload || {};
            window.localStorage.setItem('token', (payload || {}).token || '');
            window.localStorage.setItem('userInfo', JSON.stringify(payload || {}));
        },
        setSignatured(state, payload) {
            state.isSignatured = payload || false;
        },
        setShareInfo(state, payload) {
            state.shareInfo = payload || {};
        },
        setFiles(state, payload) {
            state.files = payload || [];
        },
        setAlbums(state, payload) {
            state.albums = payload || [];
        },
        setImages(state, payload) {
            state.images = payload || [];
        },
        setOverlayVisible(state, payload) {
            state.overlayVisible = payload || false;
        },
        setURLStatic(state, path) {
            path = Object.prototype.toString.call(path) === '[object String]' && path && path !== '/' ? (path[0] === '/' ? path : `/${path}`) : '/login';
            const host = `${(window.location.href.split('?')[0] || '').split('#')[0]}#${path}`;
            const newUrl = `${host}?${qs.stringify({
                id: window.sessionStorage.getItem('shareId'),
                token: window.localStorage.getItem('token'),
                inviteCode: state.queryParams.inviteCode || '',
                key: state.queryParams.key || '',
            })}`;
            history.replaceState(null, null, newUrl);
            window.removeEventListener('popstate', listener);
            window.addEventListener('popstate', listener);
        },
        clearAuthorization(state) {
            state.queryParams = {
                id: window.sessionStorage.getItem('shareId'),
                inviteCode: state.queryParams.inviteCode || '',
                key: state.queryParams.key || '',
            };
            state.userInfo = {};
            state.isLogined = false;
            window.localStorage.removeItem('userInfo');
            window.localStorage.removeItem('token');
        },
    },
    actions: {
        // 截取url所带参数
        // http://share.hificloud.net/share?id=629f0ab110043e0797a8a0f2
        getQueryParams({ commit }) {
            let [, paramsString = ''] = window.location.href.split('?');
            paramsString = paramsString.split('#/')[0];
            const queryParams = paramsString && qs.parse(paramsString) || {};
            if (queryParams.id) window.sessionStorage.setItem('shareId', queryParams.id);
            commit('setQueryParams', { ...queryParams, redirectPath: queryParams.state || '' });
        },
        getAssetConfig({ commit }) {
            let { origin, pathname = '' } = window.location;
            if (pathname[pathname.length - 1] !== '/') pathname = pathname.concat('/')
            axios.get(`${origin}${pathname}assets/config.json`).then((res) => {
                commit('setAssetConfig', (res && res.data || {}).data || {});
            }).catch(() => {
                commit('setAssetConfig', {});
            });
        },
        getShareInfo({ dispatch, commit }) {
            const shareId = window.sessionStorage.getItem('shareId');
            if (!shareId) {
                commit('setShareStatus', 'invalid');
                return;
            }
            commit('setLoading', true);
            axios.get(`share/ghost/info?sid=${shareId}`, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                const shareData = (res && res.data || {}).data || {};
                commit('setShareInfo', shareData);
                //  device的hostname节点不存在，即设备离线
                const isOffline = !(shareData.device || {}).hostname;
                if (isOffline) {
                    commit('setShareStatus', 'offline');
                    commit('setLoading', false);
                    return;
                }
                // const actionTypes = { ONLY_READ_DIR: 'getFiles', ONLY_READ_ALBUM: 'getAlbums' };
                const actionTypes = { ONLY_READ_DIR: 'getFiles', ONLY_READ_ALBUM: 'getImages' };
                dispatch(actionTypes[shareData.tag]);
            }).catch((err) => {
                const shareStatus = ({
                    1401: 'cancel',
                    2001: 'cancel',
                })[(err && err.data || {}).status] || 'invalid';
                commit('setShareStatus', shareStatus);
                commit('setLoading', false);
            });
        },
        // 获取文件
        getFiles({ state, commit }, payload = {}) {
            // 目录路径
            const path = payload.path || ((state.shareInfo.content || [])[0] || {}).path;
            const {
                // 分页参数(pageNo, pageSize) 格式: 12,15
                range = '0,15',
                // 排序方式,顺序 排序方式: z:name, s:size, m:modifyTime; 顺序: u:正序, d:倒序
                sort = 'zd',
                // 1:视频, 2:图片, 3:音频, 4:文档, 5:其他
                mediaType = '',
            } = payload;
            const deviceId = (state.shareInfo.device || {}).id;
            Toast.loading({
                duration: 0,
                className: 'toast-loading',
                message: '加载中',
                forbidClick: true,
            });
            commit('setLoading', true);
            return new Promise((resolve) => {
                axios.get(`${window._businessRoot}${deviceId}/anonymous/v3/file/list?${qs.stringify({
                    path,
                    range,
                    sort,
                    mediaType,
                })}`, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                    const files = (res && res.data || {}).data || {};
                    files.content = files.content.map(file => {
                        const filenameList = file.name.split('.');
                        let filename = file.name;
                        let formatname = '';
                        if (filenameList.length > 1) {
                            filename = filenameList.slice(0, filenameList.length - 1).join('.');
                            formatname = filenameList[filenameList.length - 1];
                        }
                        let fileShootName = file.name;
                        let folderShootName = filename;
                        if (filename.length > 6) {
                            fileShootName =  `${filename.slice(0, 6)}...${formatname}`;
                            folderShootName = `${filename.slice(0, 3)}...${filename.slice(filename.length - 3, filename.length)}`;
                            // 文件夹的名称长度>6 将名称后三位截取下来，当做后缀
                            if (file.fileType === 2) {
                                filename = filename.slice(0, filename.length - 3);
                                formatname = filename.slice(filename.length - 3, filename.length);
                            }
                        }
                        return {
                            ...file,
                            filename,
                            formatname,
                            shootName: file.fileType === 2 ? folderShootName : fileShootName,
                            // 缩略图
                            thumbnailUrl: file.mediaType === 2 ? `${window._businessRoot}${deviceId}/anonymous/v3/file/img?${qs.stringify({ path: file.path })}` : '',
                        };
                    });
                    commit('setShareStatus', 'empty');
                    commit('setFiles', files);
                    /**
                        "content": [
                            {
                                "owner": "611ca1080388ab3f221cf2e0",
                                "path": "/mnt/data/611ca1080388ab3f221cf2e0/root/测试匿名用户/Screenshot_2022-09-02-16-07-49-152_com.autonavi.minimap.jpg",
                                "size": 832194,
                                "name": "Screenshot_2022-09-02-16-07-49-152_com.autonavi.minimap.jpg",
                                "fileType": 1,
                                "mediaType": 2,
                                "modifyTime": 1662106069000,
                                "mode": 271
                            }
                        ],
                        "classifyCount": {
                            "1": 1
                        },
                        "pageIndex": 0,
                        "pageSize": 15,
                        "totalItem": 1
                     */
                }).catch((err) => {
                    const shareStatus = ({
                        1401: 'cancel',
                        2001: 'cancel',
                        470: 'offline',
                    })[(err && err.data || {}).status] || 'invalid';
                    commit('setShareStatus', shareStatus);
                }).finally(() => {
                    commit('setLoading', false);
                    Toast.clear();
                    resolve();
                });
            });
        },
        // 获取相册
        getAlbums({ state, commit }, payload) {
            const {
                id = (state.shareInfo.content || {}).id,
            } = payload || {};
            const deviceId = (state.shareInfo.device || {}).id;
            axios.get(`${window._businessRoot}${deviceId}/anonymous/v3/album/info?id=${id}`, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                const files = (res && res.data || {}).data || {};
                commit('setAlbums', files);
            });
        },
        // 获取相片
        getImages({ state, commit }, payload = {}) {
            // 设备id
            const deviceId = (state.shareInfo.device || {}).id;
            // 相簿id
            const id = payload.albumId || ((state.shareInfo.content || [])[0] || {}).albumId;
            // 相片所有者(相簿owner)id
            const uid = payload.uid || (state.shareInfo.owner || {}).id;
            Toast.loading({
                duration: 0,
                className: 'toast-loading',
                message: '加载中',
                forbidClick: true,
            });
            commit('setLoading', true);
            axios.get(`${window._businessRoot}${deviceId}/anonymous/v3/album/media/list?id=${id}`, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                const data = (((res && res.data || {}).data || {}).content || []).map(d => ({
                    ...d,
                    // imgType 1：小图，2：大图，0：原图
                    url: `${window._businessRoot}${deviceId}/anonymous/image?${qs.stringify({ uid, md5: d.md5, imgType: 2 })}`,
                    // 缩略图
                    thumbnailUrl: `${window._businessRoot}${deviceId}/anonymous/image?${qs.stringify({ uid, md5: d.md5, imgType: 1 })}`,
                    // 原图
                    originUrl: `${window._businessRoot}${deviceId}/anonymous/image?${qs.stringify({ uid, md5: d.md5, imgType: 0 })}`,
                }));
                commit('setImages', data);
                if (!data.length) commit('setShareStatus', 'empty');
            }).catch((err) => {
                const shareStatus = ({
                    1401: 'cancel',
                    2001: 'cancel',
                    470: 'offline',
                })[(err && err.data || {}).status] || 'invalid';
                commit('setShareStatus', shareStatus);
            }).finally(() => {
                commit('setLoading', false);
                Toast.clear();
            });
        },
        getSignature({ dispatch }) {
            const url = window.location.href.split('#')[0];
            axios.post('/web/wechat/signature', { url }, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                const data = (res && res.data || {}).data;
                dispatch('wxConfig', data);
            }).catch((err) => {
                Toast(err.message || '获取签名配置失败');
            });
        },
        wxConfig({ state, commit }, payload = {}) {
            const { timestamp, nonce: nonceStr, sign: signature } = payload;
            wx.config({
                debug: false, // 开启调试模式,调用的所有 api 的返回值会在客户端 alert 出来，若要查看传入的参数，可以在 pc 端打开，参数信息会通过 log 打出，仅在 pc 端时才会打印
                appId: state.appId, // 必填，公众号的唯一标识
                timestamp, // 必填，生成签名的时间戳
                nonceStr, // 必填，生成签名的随机串
                signature,// 必填，签名
                jsApiList: [], // 必填，需要使用的 JS 接口列表
                openTagList: ['wx-open-launch-app'], // 可选，需要使用的开放标签列表，例如['wx-open-launch-app']
            });
            // config信息验证后会执行 ready 方法,所有接口调用都必须在 config 接口获得结果之后
            // config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在 ready 函数中调用来确保正确执行。
            // 对于用户触发时才调用的接口，则可以直接调用，不需要放在 ready 函数中
            // wx.ready(function () {
            // });
            // config信息验证失败会执行 error 函数.
            // 如签名过期导致验证失败，具体错误信息可以打开 config 的debug模式查看
            // 也可以在返回的 res 参数中查看，对于 SPA 可以在这里更新签名
            wx.error(function (err) {
                // Toast(err.message || 'wx.config注入配置失败');
                console.log(err.message || 'wx.config注入配置失败');
                commit('setSignatured', false);
            });
        },
        /**
         * 调起用户授权界面获取code
         * wx1fcdb848faaefcf9
         * AppSecret: 496cf4fdf48ea6b5854f6c1bc13729b6
         */
        wxAuthorization({ state }, payload) {
            if (!/MicroMessenger/i.test(window.navigator.userAgent.toLowerCase())) return;
            const path = payload && Object.prototype.toString.call(payload) === '[object String]' ? (payload[0] === '/' ? payload : `/${payload}`) : '';
            const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
            const redirect_uri = `${(window.location.href.split('?')[0] || '').split('#')[0]}#${path || '/login'}`;
            const response_type = 'code';
            const scope = 'snsapi_userinfo';
            const newUrl = `${url}?${qs.stringify({
                appId: state.appId,
                redirect_uri,
                response_type,
                scope,
                state: payload || '',
            })}#wechat_redirect`;
            window.location.replace(newUrl);
        },
        wxLogin({ state, dispatch }) {
            const { code } = state.queryParams || {};
            return new Promise((resolve, reject) => {
                axios.post('/web/wechat/login', { code }).then((res) => {
                    const data = (res && res.data || {}).data;
                    dispatch('loginSuccess', data);
                    console.log('wxLogin', data);
                    Toast('微信快捷登录成功');
                    resolve(res);
                }).catch(reject);
            });
        },
        handlerLogin({ state, dispatch }, payload) {
            return new Promise((resolve) => {
                axios.post('/app/user/social/wechat/quick/login', {
                    code: (state.queryParams || {}).code || '',
                    ...payload,
                }, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                    dispatch('loginSuccess', (res && res.data || {}).data);
                    resolve();
                }).catch((err) => {
                    Toast((err && err.data).message || '登录失败');
                });
            });
        },
        loginSuccess({ commit }, payload) {
            commit('setLogined', true);
            commit('setUserInfo', payload);
            commit('setURLStatic');
        },
        checkLoginStatus({ commit, dispatch }, payload) {
            const { token } = payload || {};
            return new Promise((resolve) => {
                if (!token) {
                    resolve(false);
                    commit('clearAuthorization');
                    return;
                }
                axios.get('/refresh', { headers: { 'Api-Version': '1.16' } }).then(async (res) => {
                    const data = (res && res.data && res.data || {}).data || {};
                    window.localStorage.setItem('token', data.token || token);
                    await dispatch('loginSuccess', { ...payload, ...data });
                    resolve(true);
                }).catch(() => {
                    resolve(false);
                    commit('clearAuthorization');
                });
            });
        },
    },
});
