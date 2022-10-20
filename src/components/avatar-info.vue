<!--
 * @Author: 熊望
 * @Date: 2022-10-19 18:50:06
 * @LastEditors: 熊望
 * @LastEditTime: 2022-10-19 22:52:41
 * @FilePath: /nginx/Users/bear/projects/project-bear/H5AwakenApp/src/components/avatar-info.vue
 * @Description: 
-->
<template>
  <div class="avatar-info" @click="handlerSkipLogin">
    <van-image
      round
      width=".33rem"
      height=".33rem"
      fit="cover"
      v-if="isLogined"
      :src="(userInfo.wechat || {}).head_img_url || userInfo.head_img_url || require('@/assets/image/profile_avatar.png')"/>
    <span class="nickname cut_font">{{ isLogined ? (userInfo.wechat || {}).nickname || userInfo.nickname || '' : '登录/注册' }}</span>
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

<style>
.avatar-info {
  color: #007AFF;
  display: flex;
  font-size: .15rem;
}
.avatar-info .van-image {
  margin: auto 0;
  margin-right: .12rem;
}
.avatar-info .nickname {
  margin: auto 0;
  margin-right: .12rem;
  min-width: 0.9rem;
  max-width: calc(100vw - .36rem - 1.44rem - .57rem);
}
</style>