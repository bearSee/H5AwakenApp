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

const { state, dispatch } = store;

const routes = [
    {
        path: '/',
        redirect: '/home',
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
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
})

router.beforeEach(async (to, from, next) => {
    if (!state.queryParams) await dispatch('getQueryParams');

    // if (to.path !== '/login' && !state.isLogined && state.queryParams.code) {
    //     next('/login');
    //     return;
    // }

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

    next();
});

export default router;
