<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-09-22 22:45:48
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
      <open-app :params="{ openType: componentTag }">
          <van-button round  type="primary" size="mini">打开APP</van-button>
      </open-app>
    </div>
    <div class="home-body" id="home-body">
      <van-empty v-if="isEmpty" :class="shareStatus" :image="require(`@/assets/image/${shareStatus === 'offline' ? '404' : 'empty'}.png`)" >
        <div class="tip-t">{{ ({
          offline: '设备离线',
          invalid: '该分享已失效',
          empty: '相簿内无图片和视频',
          loading: '正在获取分享内容...',
        })[shareStatus] }}</div>
        <div class="tip-c">{{ ({
          offline: '抱歉，此设备网络或状态异常，无法访问！',
          invalid: '抱歉，该分享已经失效！',
          empty: '',
          loading: '请稍后',
        })[shareStatus] }}</div>
      </van-empty>
      <component
        v-else
        :component-tag="componentTag"
        :is="({ ONLY_READ_DIR: 'fileContent', ONLY_READ_ALBUM: 'imageContent' })[componentTag]">
      </component>
      <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="banner in (homeConfig.bannerList || [])" :key="banner">
          <img class="banner-image" :src="banner" alt="" srcset="">
        </van-swipe-item>
      </van-swipe>
      <open-app class="save-app-box" :params="{ openType: componentTag }">
        <van-button
          class="save-app-btn"
          :icon="require('@/assets/image/btn_save.png')">
          一键转存云存宝
        </van-button>
      </open-app>
      
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
import openApp from '@/components/open-app';

export default {
    name: 'shareHome',
    components: { fileContent, imageContent, openApp },
    setup() {
      const { state, dispatch } = useStore();
      return {
          homeConfig: computed(() => (state.assetConfig || {}).home || {}),
          isEmpty: computed(() => !state.shareInfo.tag || (!state.images.length && state.shareInfo.tag === 'ONLY_READ_ALBUM')),
          componentTag: computed(() => state.shareInfo.tag),
          shareStatus: computed(() => state.shareStatus),
          getShareInfo: () => {
              return dispatch('getShareInfo');
          },
      };
  },
  methods: {
  },
  mounted() {
      this.getShareInfo();
  },
}
</script>

<style>
  @import '@/assets/home.css';
</style>
