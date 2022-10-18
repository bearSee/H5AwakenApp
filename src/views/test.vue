<template>
  <div class="share-page-login">
      <span style="font-size: .2rem;margin-bottom:1rem;">{{ wxCode }}</span>
      <div class="wx-login-box">
        <div>微信登录测试</div>
        <img src="@/assets/image/wechat.png" @click="wxAuthorization" alt="" srcset="">
      </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'shareLogin',
    setup() {
      const { state, dispatch } = useStore();
      return {
          wxCode: computed(() => state.queryParams.code),
          wxAuthorization: () => {
              dispatch('wxAuthorization', '/test');
          },
          wxLogin: () => dispatch('wxLogin'),
      };
  },
  methods: {
  },
}
</script>

<style>
  @import '@/assets/login.css';
</style>
