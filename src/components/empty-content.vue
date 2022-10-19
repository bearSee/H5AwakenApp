<template>
  <div class="empty-content">
      <div class="user-info">
        <avatar-info />
      </div>
      <van-empty
        :class="[shareStatus, isLoading && 'transparent_empty']"
        :image="require(`@/assets/image/${shareStatus === 'empty' ? 'empty' : '404'}.png`)"
        :description="tips" ></van-empty>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import avatarInfo from './avatar-info';

export default {
    name: 'EmptyContent',
    components: { avatarInfo },
    setup() {
      const { state } = useStore();
      return {
          isLoading: computed(() => state.isLoading),
          shareStatus: computed(() => state.shareStatus),
          tips: computed(() => ({
          offline: '抱歉，设备不在线',
          invalid: '网络异常，请稍后再试',
          cancel: '抱歉，分享已取消',
          empty: '相簿内无图片和视频',
        })[state.shareStatus]),
      };
  },
}
</script>

<style>
  @import '@/assets/empty-content.css';
</style>