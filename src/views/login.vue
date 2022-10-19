<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-06-11 22:27:24
 * @FilePath: /nginx/Users/bear/Desktop/H5AwakenApp/src/views/login.vue
 * @Description: 
-->
<template>
  <div class="share-page-login">
    <div class="login-head">
      <div v-if="wxCode" class="wechat-box">
        <img src="@/assets/image/applogo.png" alt="" srcset="">
        <div class="dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <img src="@/assets/image/wechat.png" alt="" srcset="">
      </div>
      <div class="title">{{ wxCode ? '请登录云存宝账号，绑定微信' : '欢迎登录' }}</div>
      <div class="des">新用户登录后将自动创建帐号</div>
    </div>
      <van-form @submit="handlerSubmit">
        <van-cell-group inset>
          <van-field
            class="is-border"
            name="telephone"
            placeholder="请输入手机号码"
            type="digit"
            maxlength="11"
            v-model="telephone"
          />
          <van-field
            class="is-border"
            center
            clearable
            name="auth"
            placeholder="请输入验证码"
            type="digit"
            maxlength="6"
            v-model="auth">
            <template #button>
              <van-button
                class="verification-code-btn"
                size="small"
                type="primary"
                native-type="button"
                :disabled="timeout"
                @click="sendVerificationCode(telephone)">
                {{ timeout ? `发送验证码 ${timeout} s` : '发送验证码' }}
              </van-button>
            </template>
          </van-field>
          <van-field name="agreed" class="agreed-checkbox">
            <template #input>
              <van-checkbox v-model="agreed">
                <template #icon="{ checked }">
                  <img class="img-icon" :src="require(`@/assets/image/${checked ? 'checked' : 'unchecked'}.png`)" />
                </template>
                注册/登录即代表同意<span class="txt" @click.stop="handlerSkip('user')">《用户协议》</span>和<span class="txt" @click.stop="handlerSkip('privacy')">《隐私协议》</span>
              </van-checkbox>
            </template>
          </van-field>
        </van-cell-group>
        <div class="submit-box">
          <van-button block native-type="submit">
            登录/注册
          </van-button>
        </div>
      </van-form>
      <div class="wx-login-box" v-if="isWeixinEnv && !wxCode">
        <div>微信登录</div>
        <img src="@/assets/image/wechat.png" @click="wxAuthorization" alt="" srcset="">
      </div>
      <!-- <pre style="font-size: .1rem;">
        <code>
          {{ '\n' + JSON.stringify($store.state, null, 2) }}
        </code>
      </pre> -->
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Toast } from 'vant';

let timer;

export default {
    name: 'shareLogin',
    setup() {
      const { state, dispatch } = useStore();
      const router = useRouter();
      const ua = window.navigator.userAgent.toLowerCase();
      return {
          isWeixinEnv: /MicroMessenger/i.test(ua),
          wxCode: computed(() => state.queryParams.code),
          agreed: ref(false),
          telephone: ref(''),
          auth: ref(''),
          timeout: ref(0),
          handlerLogin: (values) => {
              dispatch('handlerLogin', values).then(() => {
                  Toast('登录成功');
                  router.replace('/home');
                  if (state.queryParams.code) window.location.reload();
                  // const { origin, pathname } = window.location;
                  // window.location.replace(`${origin}${pathname}?id=${window.sessionStorage.getItem('shareId')}`)
              });
          },
          wxAuthorization: () => {
              dispatch('wxAuthorization', 'login');
          },
          wxLogin: () => dispatch('wxLogin'),
          loginIn: () => {
              router.replace('/home');
              if (state.queryParams.code) window.location.reload();
          },
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
          Toast.loading({
              duration: 0,
              message: '正在发送...',
              forbidClick: true,
          });
          this.$http.get(`/app/auth?phone=${telephone}`).then(() => {
              Toast.clear();
              Toast.success('验证码发送成功');
              this.timeout = 60;
              timer = setInterval(() => {
                  if (!this.timeout) {
                      clearInterval(timer);
                      return;
                  }
                  this.timeout--;
              }, 1000);
          }).catch((err) => {
              setTimeout(Toast.clear, 1000);
              Toast((err && err.data).message || '验证码发送失败');
          });
      },
      handlerSubmit({ auth, agreed, telephone }) {
          if (!agreed) {
              Toast('请勾选同意');
              return;
          }
          if (!telephone) {
              Toast('请输入手机号码');
              return;
          }
          if (telephone.length !== 11) {
              Toast('请输入正确的手机号码');
              return;
          }
          if (!auth) {
              Toast('请输入验证码');
              return;
          }
          this.handlerLogin({ auth, telephone });
      },
      handlerSkip(type) {
          const address = ({
              user: 'https://doc.hificloud.net/doc/hificloudagreement.html',
              privacy: 'https://doc.hificloud.net/doc/hificloudprivate.html',
          })[type];
          window.open(address);
      },
  },
  created() {
      if (this.isWeixinEnv && this.wxCode) {
          this.wxLogin().then(this.loginIn).catch(() => {
              // Toast((err && err.data).message || '快捷登录失败');
          });
      }
  },
}
</script>

<style>
  @import '@/assets/login.css';
</style>
