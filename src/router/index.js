/*
 * @Author: 熊望
 * @Date: 2022-06-10 23:43:18
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-11 14:34:02
 * @FilePath: /nginx/Users/bear/Desktop/H5AwakenApp/src/router/index.js
 * @Description: 
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import store from '@/store';

const { state, commit, dispatch } = store;
const setURLStatic = (path) => {
    setTimeout(() => {
        commit('setURLStatic', path === '/login');
    }, 500);
};

const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/login'),
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('@/views/home'),
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
});


router.beforeEach(async (to, from, next) => {
    if (!state.queryParams) await dispatch('getQueryParams');
    if (!state.assetConfig) await dispatch('getAssetConfig');

    const wxCode = state.queryParams.code;
    
    if (!state.isLogined) {
        const historyInfo = window.localStorage.getItem('userInfo');
        let isLogined = false;
        // 从url参数判断是否已经登录
        if (state.queryParams.token) {
            isLogined = await dispatch('checkLoginStatus', state.queryParams);
        } else if (historyInfo) {
            // 从本地存储判断是否已经登录
            try {
                isLogined = await dispatch('checkLoginStatus', JSON.parse(historyInfo));
            } catch (error) {
                console.error(error);
            }
        }

        const hastrywxlogin = window.sessionStorage.getItem('hastrywxlogin') === 'Y';
        const iswxEnv = /MicroMessenger/i.test(window.navigator.userAgent.toLowerCase());
        if (!isLogined && !hastrywxlogin && iswxEnv) {
            await dispatch(wxCode ? 'wxLogin' : 'wxAuthorization', to.name);
            await new Promise((r) => {
                setTimeout(() => { r(); }, 2000);
            });
            window.sessionStorage.setItem('hastrywxlogin', 'Y');
            next('/home');
            return;
        }
    }

    setURLStatic(to.path);

    if (state.isLogined && to.path === '/login') {
        return;
    }
    
    if (!['/home', '/login'].includes(to.path)) {
        next('/home');
        return;
    }

    if ((state.queryParams || {}).redirectPath && (state.queryParams || {}).redirectPath !== to.name) {
        next(`/${state.queryParams.redirectPath}`);
        return;
    }

    next();
});

export default router;
