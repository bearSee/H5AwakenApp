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

const routes = [
    {
        path: '/',
        redirect: '/login',
    },
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
    {
        path: '/invitation',
        name: 'invitation',
        component: () => import('@/views/invitation'),
        meta: {
            authority: false,
        },
    },
    {
        path: '/test',
        name: 'test',
        component: () => import('@/views/test'),
        meta: {
            authority: false,
        },
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
});


router.beforeEach(async (to, from, next) => {
    if (!state.queryParams) await dispatch('getQueryParams');
    if (!state.assetConfig) await dispatch('getAssetConfig');
    console.log(to.path, '\nfrom.path', from.path);
    if (to.meta && to.meta.authority === false) {
        next();
        return;
    }
    
    if (!state.isLogined) {
        const historyInfo = window.localStorage.getItem('userInfo');
        // 从url参数判断是否已经登录
        if (state.queryParams.token) {
            await dispatch('checkLoginStatus', state.queryParams);
        } else if (historyInfo) {
            // 从本地存储判断是否已经登录
            try {
                await dispatch('checkLoginStatus', JSON.parse(historyInfo));
            } catch (error) {
                console.error(error);
            }
        }
    }


    if (state.isLogined && to.path === '/login') {
        next('/home');
        setTimeout(() => { commit('setURLStatic', '/home'); }, 500);
        return;
    }
    
    if (!routes.map(({ path }) => path).includes(to.path)) {
        next('/login');
        setTimeout(() => { commit('setURLStatic', '/login'); }, 500);
        return;
    }

    // let redirectPath = (state.queryParams || {}).redirectPath && (state.queryParams || {}).redirectPath;
    // if (redirectPath !== to.name) {
    //     redirectPath = redirectPath ? (redirectPath[0] === '/' ? redirectPath : `/${redirectPath}`) : '';
    //     next(redirectPath);
    //     setTimeout(() => { commit('setURLStatic', redirectPath); }, 500);
    //     return;
    // }

    next();
    setTimeout(() => { commit('setURLStatic', to.path); }, 500);
});

export default router;
