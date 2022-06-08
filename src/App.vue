<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-05 01:30:32
 * @FilePath: /nginx/Users/bear/Desktop/new-project/src/App.vue
 * @Description: 
-->
<template>
  <div class="share-page">
    <van-nav-bar>
      <template #left v-if="Object.keys($store.state.userInfo).length">
        <van-image
          round
          width=".7rem"
          height=".7rem"
          fit="cover"
          :src="($store.state.userInfo.wechat || {}).head_img_url || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'"
        />
        <span class="user-name">{{ ($store.state.userInfo.wechat || {}).nickname || $store.state.userInfo.nickname || '' }}</span>
      </template>
      <template #right v-if="!Object.keys($store.state.userInfo).length">
        <div class="van-nav-bar__text" @click="visible = true">登录/注册</div>
      </template>
    </van-nav-bar>
    <van-grid v-if="$store.state.images.length" :border="false" :column-num="3">
      <van-grid-item v-for="(image, i) in $store.state.images" :key="image.id">
        <van-image :src="image.url" @click="handlerPreview($store.state.images[i])" fit="cover"/>
      </van-grid-item>
    </van-grid>
    <van-empty v-else description="暂无文件" />
    <div class="button-list">
      <van-button type="primary" @click="handlerOpenApp">转存云存宝</van-button>
      <van-button type="success" @click="handlerOpenApp">更多</van-button>
    </div>
    <van-swipe class="my-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item>广告1</van-swipe-item>
      <van-swipe-item>广告2</van-swipe-item>
      <van-swipe-item>广告3</van-swipe-item>
      <van-swipe-item>广告4</van-swipe-item>
    </van-swipe>
    <van-action-sheet v-model:show="visible" title="登录/注册" class="login-form">
      <van-form @submit="handlerSubmit">
        <van-cell-group inset>
          <van-field
            name="telephone"
            label="手机号码"
            placeholder="请输入手机号码"
            type="digit"
            maxlength="11"
            v-model="telephone"
            :rules="[
              { required: true, message: '请输入手机号码' },
              { validator: (val) => val && val.length === 11, message: '请输入正确的手机号码' },
            ]"
          />
          <van-field
            center
            clearable
            name="auth"
            label="验证码"
            placeholder="请输入验证码"
            type="digit"
            maxlength="6"
            v-model="auth"
            :rules="[{ required: true, message: '请输入验证码' }]">
            <template #button>
              <van-button
                size="small"
                type="primary"
                native-type="button"
                :disabled="timeout"
                @click="sendVerificationCode(telephone)">
                {{ timeout ? `发送验证码 ${timeout} s` : '发送验证码' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
        <div class="submit">
          <van-button block type="primary" native-type="submit">
            登录/注册
          </van-button>
        </div>
      </van-form>
    </van-action-sheet>
    <van-overlay :show="overlayVisible" @click="overlayVisible = false">
      <div>请在手机浏览器打开</div>
    </van-overlay>
    <pre style="font-size: .2rem;">
      <code>
        {{ '\n' + JSON.stringify($store.state, null, 2) }}
      </code>
    </pre>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { Toast, ImagePreview } from 'vant';

let timer;

export default {
    name: 'App',
    setup() {
      const ua = window.navigator.userAgent.toLowerCase();
      return {
          shareName: ref('BearSee'),
          telephone: ref(''),
          auth: ref(''),
          timeout: ref(0),
          visible: ref(false),
          overlayVisible: ref(false),
          images: reactive([]),
          isWeixin: /MicroMessenger/i.test(ua),
          isAndroid: /Android|Adr/i.test(ua),
          isIOS: /iPhone|iPod|iPad/i.test(ua),
      };
  },
  methods: {
      sendVerificationCode(telephone) {
          if (this.timeout) return;
          if (!telephone) {
              Toast('请输入手机号');
              return;
          }
          if (telephone.length !== 11) {
              Toast('请输入正确的手机号');
              return;
          }
          this.$http.get(`/app/auth?phone=${telephone}`).then(() => {
              Toast.success('验证码发送成功');
              this.timeout = 60;
              timer = setInterval(() => {
                  if (!this.timeout) {
                      clearInterval(timer);
                      return;
                  }
                  this.timeout--;
              }, 1000);
          });
      },
      handlerPreview(image) {
          ImagePreview({
              images: [image.originUrl],
              showIndex: false,
          });
      },
      handlerSubmit(values) {
          this.$store.dispatch('accountLogin', values).then(() => {
              this.visible = false;
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
                     openUrl: `myscheme://myhost:1024/main?id=${id}&token=${token}`,
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
  },
  mounted() {
      this.$store.dispatch('getQueryParams');
      const historyInfo = window.localStorage.getItem('userInfo');
      if (historyInfo) {
          try {
              this.$store.dispatch('loginSuccess', JSON.parse(historyInfo));
          } catch (error) {
              this.$store.dispatch('wxAuthorization');
              console.error('error:', error);
          }
          return;
      }
      this.$store.dispatch('wxAuthorization');
  },
}
</script>

<style>
.share-page {
  padding: 0 .1rem;
  background: #fafafa;
  border-top: 1px solid #d6d6d6;
}
.user-name {
  margin: auto .1rem;
  color: #666;
}
.button-list {
  display: flex;
  justify-content: space-between;
  margin: .15rem 0;
}

.button-list .van-button {
    width: calc(50% - .05rem);
}
.my-swipe .van-swipe-item {
  color: #fff;
  font-size: .3rem;
  line-height: 2rem;
  text-align: center;
  background-color: #39a9ed;
}
.login-form .van-action-sheet__content {
  padding-bottom: .8rem;
}
.login-form .van-action-sheet__content .submit {
  width: 2.5rem;
  margin: 0 auto;
  margin-top: .15rem;
  border-radius: .03rem;
}
.van-overlay {
  position: relative;
}
.van-overlay div {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: .4rem;
}
.van-grid .van-grid-item .van-image {
  width: 2rem;
  height: 2rem;
}
</style>
