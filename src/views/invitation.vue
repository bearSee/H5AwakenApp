<!--
 * @Author: 熊望
 * @Date: 2022-06-02 23:36:44
 * @LastEditors: 熊望
 * @LastEditTime: 2022-09-22 22:49:14
 * @FilePath: /nginx/Users/bear/projects/project-bear/H5AwakenApp/src/views/invitation.vue
 * @Description: 
-->
<template>
  <div class="invitation-page">
    <template v-if="[0, 4].includes(invitationStatus)">
        <div class="invitation-head">
            <!-- <van-image class="avatar" fit="cover" round v-if="(invitationInfo.owner || {}).head_img_url" :src="(invitationInfo.owner || {}).head_img_url" /> -->
            <van-image class="avatar" fit="cover" round :src="(invitationInfo.owner || {}).head_img_url" />
            <div class="name">{{ (invitationInfo.owner || {}).nickname || 'Alex' }}</div>
            <div class="title">邀请您加入云存宝私有网盘，共享设备存储空间</div>
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
            </van-cell-group>
            <div class="submit-box">
                <van-button block native-type="submit">加入设备</van-button>
            </div>
        </van-form>
        <div class="bot-tip" v-if="true">此链接{{ formatTime(invitationInfo.expiration) || '30分钟' }}后失效</div>
    </template>
    <template v-else-if="[1, 2].includes(invitationStatus)">
        <div class="invitation-tips">
            <div :class="invitationStatus === 1 ? 'success' : 'aready-success'">
                <van-icon name="checked" />
            </div>
            <div class="tip-t">{{ invitationStatus === 1 ? '您已成功接受邀请' : '您已是设备成员' }}</div>
            <div class="tip-c">打开APP即可共享私有网盘设备</div>
            <div class="tip-c">为保证正常加入设备，强烈建议使用最新版本</div>
            <open-app class="submit-box" :params="{ openType: 'INVATE', did: this.deviceId }">
                <van-button block >打开APP</van-button>
            </open-app>
        </div>
    </template>
    <template v-else-if="invitationStatus === 3">
        <div class="invitation-tips">
            <div class="invalid">
                <van-icon name="warning" />
            </div>
            <div class="tip-t">链接已失效</div>
            <div class="tip-c">抱歉，分享已失效或者已被人接受邀请</div>
        </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { Toast } from 'vant';
import openApp from '@/components/open-app';

let timer;

export default {
    name: 'InvitationPage',
    components: { openApp },
    setup() {
        const { state, dispatch } = useStore();
        return {
            queryParams: computed(() => state.queryParams),
            // 0：待接受 1: 接受成功 2: 接受重复 3:失效/已被人接受 4: 接受失败
            invitationStatus: ref(-1),
            invitationInfo: reactive({}),
            telephone: ref(''),
            auth: ref(''),
            timeout: ref(0),
            deviceId: ref(''),
            submit: (params) => {
                return dispatch('handlerLogin', params);
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
        handlerSubmit({ auth, telephone }) {
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
            this.submit({ auth, telephone }).then(() => {
                this.handlerReceiveInvitation();
            });
        },
        handlerReceiveInvitation() {
            const { inviteCode, key } = this.queryParams;
            if (!inviteCode) return;
            this.$http.get(`/app/group/join?zid=${inviteCode}&key=${key}`, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                const data = (res.data || {}).data;
                if (!data) {
                    this.invitationStatus = 4;
                    Toast('加入失败，请稍后重试');
                    return;
                }
                this.deviceId = (data.device || {}).id;
                this.invitationStatus = 1;
            }).catch((err = {}) => {
                this.invitationStatus = 4;
                const { message } = err.data || {};
                Toast(message ? message : '服务器异常\n请稍后重试');
            });
        },
        getInvitationInfo() {
            const { inviteCode, key } = this.queryParams;
            if (!inviteCode) {
                this.invitationStatus = 3;
                return;
            }
            this.$http.get(`/app/group/invite?zid=${inviteCode}&key=${key}`, { headers: { 'Api-Version': '1.16' } }).then((res) => {
                const data = (res.data || {}).data;
                if (!data) {
                    this.invitationStatus = 3;
                    return;
                }
                this.invitationStatus = 0;
                this.invitationInfo = data;
            }).catch((err = {}) => {
                this.invitationStatus = 3;
                const { message } = err.data || {};
                Toast(message ? message : '服务器异常\n请稍后重试');
            });
        },
        formatTime(t) {
            const time = t - new Date().getTime();
            const dayT = 1000 * 3600 * 24;
            const hourT = 1000 * 3600;
            const minT = 1000 * 60;
            if (time / dayT > 1) return `${parseInt(time / dayT)}天`;
            if (time / hourT > 1) return `${parseInt(time / hourT)}小时`;
            if (time / minT > 1) return `${parseInt(time / minT)}分钟`;
            return null;
        },
    },
    created() {
        window.sessionStorage.removeItem('shareId');
        this.getInvitationInfo();
        document.title = '好友邀请';
    },
}
</script>

<style>
  @import '@/assets/invitation.css';
</style>
