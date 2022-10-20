<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-10-19 22:41:39
 * @FilePath: /nginx/Users/bear/projects/project-bear/H5AwakenApp/src/views/home.vue
 * @Description: 
-->
<template>
  <div class="share-page-home">
    <div class="home-head">
      <div class="app-box">
        <img src="@/assets/image/applogo.png" alt="" srcset="">
        <div class="des">
          <div class="des-t">云存宝</div>
          <div class="des-c">安全守护您的数据</div>
        </div>
      </div>
      <open-app :params="{ openType: shareTag }">
          <van-button round  type="primary" size="mini">打开APP</van-button>
      </open-app>
    </div>
    <div class="home-body" id="home-body">
      <component
        :component-tag="shareTag"
        :is="({ ONLY_READ_DIR: 'fileContent', ONLY_READ_ALBUM: 'imageContent', EMPTY: 'emptyContent' })[componentTag]">
      </component>
      <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="banner in (homeConfig.bannerList || [])" :key="banner">
          <img class="banner-image" :src="banner" alt="" srcset="">
        </van-swipe-item>
      </van-swipe>
      <!-- <open-app class="save-app-box" :params="{ openType: 'SAVE_TO' }">
        <van-button
          class="save-app-btn"
          :icon="require('@/assets/image/btn_save.png')">
          一键转存云存宝
        </van-button>
      </open-app> -->
      
      <!-- <pre style="font-size: .1rem;">
        <code>
          {{ '\n' + JSON.stringify($store.state, null, 2) }}
        </code>
      </pre> -->

    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import fileContent from '@/components/file-content';
import imageContent from '@/components/image-content';
import emptyContent from '@/components/empty-content';
import openApp from '@/components/open-app';

export default {
    name: 'shareHome',
    components: { fileContent, imageContent, emptyContent, openApp },
    setup() {
      const { state, dispatch } = useStore();
      return {
          shareStatus: computed(() => state.shareStatus),
          homeConfig: computed(() => (state.assetConfig || {}).home || {}),
          shareTag: computed(() => state.shareInfo.tag),
          componentTag: computed(() => !state.shareInfo.tag || (state.shareInfo.tag === 'ONLY_READ_ALBUM' && !state.images.length) || (state.shareInfo.tag === 'ONLY_READ_DIR' && state.shareStatus !== 'empty') ? 'EMPTY' : state.shareInfo.tag),
          getShareInfo: () => {
              return dispatch('getShareInfo');
          },
      };
  },
  mounted() {
      this.getShareInfo();
  },
}
</script>

<style>
  @import '@/assets/home.css';
</style>
