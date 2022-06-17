<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-15 22:25:01
 * @FilePath: /nginx/Users/bear/Desktop/H5AwakenApp/src/views/home.vue
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
      <van-button round  type="primary" size="mini" @click="handlerOpenApp(2)">打开APP</van-button>
    </div>
    <div class="home-body">
      <div class="user-info">
        <div class="info" @click="handlerSkipLogin">
          <van-image
            round
            width=".33rem"
            height=".33rem"
            fit="cover"
            :src="(userInfo.wechat || {}).head_img_url || userHeadImg || require('@/assets/image/profile_avatar.png')"/>
          <span class="nickname">{{ (userInfo.wechat || {}).nickname || userInfo.nickname || '登录' }}</span>
        </div>
        <div class="operate" @click="isGird = !isGird">
          <img class="gird" :src="require(`@/assets/image/${isGird ? 'menu_view_grid' : 'menu_view_pic'}.png`)" alt="" srcset="">
          <span>{{ isGird ? '宫格' : '大图' }}</span>
        </div>
      </div>
      <div class="photo-box" v-show="images.length">
        <div class="photo-t">照片合集</div>
        <div class="photo-c">
          <span>共 {{ images.length || 0 }} 张照片</span><span class="tip">此链接将在24小时候后失效</span>
        </div>
      </div>
      <van-grid v-if="images.length" square :gutter="1" :border="false" :column-num="isGird ? 3 : 1">
        <van-grid-item v-for="(image, i) in (homeConfig.maxFileLength > 0 ? images.slice(0, homeConfig.maxFileLength) : images)" :key="image.id">
          <!-- <video class="video" v-if="image.type === 1" controls :poster="image.thumbnailUrl">
            <source :src="image.originUrl" type="video/mp4">
          </video>
          <van-image v-else :src="image.thumbnailUrl" @click="handlerPreview(i)" fit="cover" /> -->
          <van-image :src="image.thumbnailUrl" @click="handlerPreview(i)" fit="cover">
            <div v-if="image.type === 1">
              <span v-if="isGird" class="duration">{{ formatDuration(image.videoDuration) }}</span>
              <img v-else class="play-btn" src="@/assets/image/play_btn.png" alt="" srcset="">
            </div>
            <div
              class="image-mask"
              :class="isGird && 'is-gird'"
              v-if="homeConfig.maxFileLength > 0 && i >= (homeConfig.maxFileLength - 1)"
              @click.stop="handlerOpenApp(2)">
              <span>+ {{ images.length - homeConfig.maxFileLength }}</span>
            </div>
          </van-image>
        </van-grid-item>
      </van-grid>
      <van-empty v-else :class="imageStatus" :image="require(`@/assets/image/${imageStatus === 'offline' ? '404' : 'empty'}.png`)" >
        <div class="tip-t">{{ ({
          offline: '设备离线',
          invalid: '该分享已失效',
          empty: '正在获取分享内容...',
        })[imageStatus] }}</div>
        <div class="tip-c">{{ ({
          offline: '抱歉，此设备网络或状态异常，无法访问',
          invalid: '为保护用户信息安全，分享超过24小时候自动失效',
          empty: '请稍后',
        })[imageStatus] }}</div>
      </van-empty>
      <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="banner in (homeConfig.bannerList || [])" :key="banner">
          <img class="banner-image" :src="banner" alt="" srcset="">
        </van-swipe-item>
      </van-swipe>
      <van-button
        class="save-app-btn"
        :icon="require('@/assets/image/btn_save.png')"
        @click="handlerOpenApp(1)">
        一键转存云存宝
      </van-button>
      
      <!-- <pre style="font-size: .1rem;">
        <code>
          {{ '\n' + JSON.stringify($store.state, null, 2) }}
        </code>
      </pre> -->

    </div>
    <div class="mask-box" v-show="overlayVisible">
      <img :src="homeConfig.open_app_mask || ''" alt="" srcset="">
    </div>
    <van-overlay class="overlay-dialog" :show="overlayVisible">
      <img src="@/assets/image/guide_content.png" alt="" srcset="">
      <img class="guide-btn" src="@/assets/image/guide_btn.png" alt="" srcset=""  @click="overlayVisible = false">
    </van-overlay>
    <van-image-preview
      class-name="image-preview-dialog"
      overlay-class="image-preview-mask"
      closeable
      v-model:show="previewVisible"
      :images="homeConfig.maxFileLength > 0 ? previewImages.slice(0, homeConfig.maxFileLength) : previewImages"
      :start-position="previewStartPosition"
      :close-icon="require(`@/assets/image/close.png`)"
      @change="previewChange"
      @close="currentImage = {}">
      <template v-slot:cover>
        <van-button
          v-if="!currentImage.isOrigin && currentImage.type !== 1"
          class="origin-btn"
          round
          @click="handlerViewOrigin">
          查看原图（{{ ((currentImage.size || 0) / 1024 / 1024).toFixed(2) }}M）
        </van-button>
        <div class="operate-box">
          <div class="save-btn" @click="handlerOpenApp(1)">
            <img src="@/assets/image/btn_save_large.png" alt="" srcset="">
            <div>转存</div>
          </div>
          <div class="open-btn" @click="handlerOpenApp(2)">
            <img src="@/assets/image/applogo.png" alt="" srcset="">
            <div>用APP查看</div>
          </div>
        </div>
        <img v-if="currentImage.type === 1" class="play-btn" src="@/assets/image/play_btn.png" alt="" srcset="">
      </template>
    </van-image-preview>
    
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';

const formatStr = s => `0${s || 0}`.slice(-2);

export default {
    name: 'shareHome',
    setup() {
      const { state, dispatch } = useStore();
      const ua = window.navigator.userAgent.toLowerCase();
      return {
          homeConfig: computed(() => (state.assetConfig || {}).home),
          isLogined: computed(() => state.isLogined),
          userInfo: computed(() => state.userInfo),
          userHeadImg: computed(() => state.userHeadImg),
          imageStatus: computed(() => state.imageStatus),
          images: computed(() => state.images),
          // 是否为宫格展示
          isGird: ref(true),
          overlayVisible: ref(false),
          previewVisible: ref(false),
          previewStartPosition: ref(0),
          previewImages: computed(() => state.images.map(({ url, originUrl, isOrigin }) => isOrigin ? originUrl : url)),
          currentImage: reactive({}),
          isWeixin: /MicroMessenger/i.test(ua),
          isAndroid: /Android|Adr/i.test(ua),
          isIOS: /iPhone|iPod|iPad/i.test(ua),
          wxAuthorization: () => {
              dispatch('wxAuthorization');
          },
          getImages: () => {
              dispatch('getImageList');
          },
      };
  },
  methods: {
      handlerSkipLogin() {
          if (this.isLogined) return;
          this.$router.push('/login');
      },
      handlerPreview(index) {
          this.previewStartPosition = index;
          this.previewVisible = true;
          this.currentImage = this.images[index] || {};
      },
      previewChange(index) {
          this.currentImage = this.images[index] || {};
      },
      handlerViewOrigin() {
          if (this.currentImage.type !== 1) this.currentImage.isOrigin = true;
      },
      handlerOpenApp(openType) {
          if (!this.isWeixin && (this.isAndroid || this.isIOS)) {
              const token = window.localStorage.getItem('token');
              const shareId = window.sessionStorage.getItem('shareId');
              const { md5 = '' } = this.currentImage;
              const type = this.isAndroid ? 'android' : 'ios';
              const urlConfig = {
                  android: {
                      openUrl: `myscheme://myhost:1024/main?key1=${shareId}&key2=${token}&key3=${md5}&key4=${openType}`,
                      downloadUrl: 'https://hmd-down.oss-cn-hangzhou.aliyuncs.com/hificloud/android/release.apk',
                  },
                  ios: {
                      openUrl: `https://share.hificloud.net/open?id=${shareId}&token=${token}&key3=${md5}&key4=${openType}.dde.1wx`,
                      downloadUrl: 'https://apps.apple.com/cn/app/hificloud/id1543197598',
                  },
              };
              const { openUrl, downloadUrl } = urlConfig[type];
              window.location.href = openUrl;
              setTimeout(() => {
                  const hidden = window.document.hidden || window.document.mozHidden || window.document.msHidden || window.document.webkitHidden;
                  if (type === 'android' && !hidden) window.location.href = downloadUrl;
              }, 2000);
              return;
          }
          this.overlayVisible = true;
      },
      formatDuration(duration) {
          duration = (Number(duration) || 0) / 1000;
          const h = parseInt(duration / 3600);
          const m = parseInt(duration % 3600 / 60);
          const s = duration % 60;
          return `${h && formatStr(h) || ''}${h && ':' || ''}${formatStr(m)}:${formatStr(s)}`;
      },
  },
  mounted() {
      this.getImages();
  },
}
</script>

<style>
  @import '@/assets/home.css';
</style>
