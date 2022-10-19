<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-05 01:30:32
 * @FilePath: /nginx/Users/bear/Desktop/new-project/src/App.vue
 * @Description: 
-->
<template>
  <router-view></router-view>
  <app-guide-mask />
</template>

<script>
import { useStore } from 'vuex';
import appGuideMask from '@/components/app-guide-mask';

export default {
    name: 'App',
    components: { appGuideMask },
    setup() {
        const { dispatch } = useStore();
        return {
            getSignature: () => dispatch('getSignature'),
        };
    },
    created() {
        this.getSignature();
    },
}
</script>

<style>
  @import '@/assets/vant.css';
  @import '@/assets/common.css';
</style>
