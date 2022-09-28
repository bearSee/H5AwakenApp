<template>
  <div class="avatar-info" @click="handlerSkipLogin">
    <van-image
      round
      width=".33rem"
      height=".33rem"
      fit="cover"
      :src="(userInfo.wechat || {}).head_img_url || userInfo.head_img_url || require('@/assets/image/profile_avatar.png')"/>
    <span class="nickname">{{ (userInfo.wechat || {}).nickname || userInfo.nickname || '登录' }}</span>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
    name: 'AvatarInfo',
    setup() {
      const { state, commit } = useStore();
      const router = useRouter();
      return {
          isLogined: computed(() => state.isLogined),
          userInfo: computed(() => state.userInfo),
          loginout: () => {
              commit('clearAuthorization');
              router.replace('/login');
          },
      };
  },
  methods: {
      handlerSkipLogin() {
          if (this.isLogined) {
              this.$dialog.confirm({ title: '提示', message: '是否退出登录？' }).then(this.loginout);
              return;
          }
          this.loginout();
      },
  },
}
</script>
