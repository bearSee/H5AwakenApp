<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-11 22:27:34
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
      <van-button round  type="primary" size="mini" @click="handlerOpenApp">打开APP</van-button>
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
        <van-grid-item v-for="(image, i) in images" :key="image.id">
          <van-image :src="image.thumbnailUrl" @click="handlerPreview(i)" fit="cover"/>
        </van-grid-item>
      </van-grid>
      <van-empty v-else :image="require(`@/assets/image/404.png`)" >
        <div class="tip-t">{{ ({ offline: '设备离线', invalid: '该分享已失效' })[imageStatus] }}</div>
        <div class="tip-c">{{ ({ offline: '抱歉，此设备网络或状态异常，无法访问', invalid: '为保护用户信息安全，分享超过24小时候自动失效' })[imageStatus] }}</div>
      </van-empty>
      <van-swipe class="my-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="d in 2" :key="d">
          <div class="banner-box">
            <div class="box-title">使用云存宝分享</div>
            <div class="box-content">
              <span>速度\安全\快捷</span>
              <span class="box-btn">享特惠</span>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
      <van-button
        class="save-app-btn"
        :icon="require('@/assets/image/btn_save.png')"
        @click="handlerOpenApp">
        一键转存云存宝
      </van-button>
      
      <!-- <van-button block @click="getAddress">
        获取地址
      </van-button>
      <van-button block @click="clearStorage">
        清除缓存，退出登录(测试)
      </van-button>

      <pre style="font-size: .1rem;">
        <code>
          {{ '\n' + JSON.stringify($store.state, null, 2) }}
        </code>
      </pre> -->

    </div>
    <div class="mask-box" v-show="overlayVisible" />
    <van-overlay class="overlay-dialog" :show="overlayVisible" @click="overlayVisible = false">
      <img src="@/assets/image/guide_content.png" alt="" srcset="">
      <img class="guide-btn" src="@/assets/image/guide_btn.png" alt="" srcset="">
    </van-overlay>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { Toast, ImagePreview } from 'vant';

export default {
    name: 'shareHome',
    setup() {
      const { state, dispatch } = useStore();
      const ua = window.navigator.userAgent.toLowerCase();
      return {
          isLogined: computed(() => state.isLogined),
          userInfo: computed(() => state.userInfo),
          userHeadImg: computed(() => state.userHeadImg),
          imageStatus: computed(() => state.imageStatus),
          images: computed(() => state.images),
          // 是否为宫格展示
          isGird: ref(true),
          overlayVisible: ref(false),
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
      handlerPreview(startPosition) {
        const images = JSON.parse(JSON.stringify(this.images)).map(({ url }) => url);
          ImagePreview({
              images,
              startPosition,
              closeable: true,
          });
      },
      handlerOpenApp() {
          if (!this.isWeixin && (this.isAndroid || this.isIOS)) {
              Toast.loading({
                  duration: 2000,
                  message: '加载中...',
                  forbidClick: true,
              });
              const { token } = this.$store.state.userInfo;
              const { id } = this.$store.state.queryParams;
              const type = this.isAndroid ? 'android' : 'ios';
              const urlConfig = {
                  android: {
                      openUrl: `myscheme://myhost:1024/main?key1=${id}&key2=${token}`,
                      downloadUrl: 'https://hmd-down.oss-cn-hangzhou.aliyuncs.com/hificloud/android/release.apk',
                  },
                  ios: {
                      openUrl: `https://share.hificloud.net/share?id=${id}&token=${token}.dde.1wx`,
                      downloadUrl: 'https://apps.apple.com/cn/app/hificloud/id1543197598',
                  },
              };
              const { openUrl, downloadUrl } = urlConfig[type];
              window.location.href = openUrl;
              setTimeout(() => {
                  const hidden = window.document.hidden || window.document.mozHidden || window.document.msHidden || window.document.webkitHidden;
                  if (!hidden) window.location.href = downloadUrl;
              }, 2000);
              return;
          }
          this.overlayVisible = true;
      },
      getAddress() {
        const msg = window.location.href;
        alert(msg);
      },
      clearStorage() {
        this.$store.commit('clearAuthorization');
      },
  },
  mounted() {
      if (!this.isLogined) this.wxAuthorization();
      this.getImages();
  },
}
</script>

<style>
  @import '@/assets/home.css';
</style>
