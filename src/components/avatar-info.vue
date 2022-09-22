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

export default {
    name: 'AvatarInfo',
    setup() {
      const { state } = useStore();
      return {
          isLogined: computed(() => state.isLogined),
          userInfo: computed(() => state.userInfo),
      };
  },
  methods: {
      handlerSkipLogin() {
          if (this.isLogined) return;
          this.$router.push('/login');
      },
  },
}
</script>
