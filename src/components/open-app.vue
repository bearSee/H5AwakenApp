<template>
    <div class="open-app">
        <div class="camouflage-btn" @click="handlerOpenIosApp">
            <slot />
        </div>
        <wx-open-launch-app
            class="wx-open-btn"
            v-if="isWeixin && isSignatured && isAndroid"
            :appid="appId"
            :extinfo="JSON.stringify(extinfo)">
            <component :is="'script'" type="text/wxtag-template">
                <component :is="'style'">
                    .wx-btn-content {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                    }
                </component>
                <div class="wx-btn-content">打开APP</div>
            </component>
        </wx-open-launch-app>
    </div>
</template>

<script>
import qs from 'qs';
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'OpenApp',
    props: {
        params: {
            type: Object,
            default: () => ({}),
        },
    },
    setup() {
        const { state, commit } = useStore();
        return {
            isWeixin: computed(() => state.isWeixin),
            isAndroid: computed(() => state.isAndroid),
            isIOS: computed(() => state.isIOS),
            isSignatured: computed(() => state.isSignatured),
            componentTag: computed(() => state.shareInfo.tag),
            appId: computed(() => state.applicationId),
            showOverlay: () => {
                commit('setOverlayVisible', true);
            },
        };
    },
    computed: {
        /**
         * 对于extinfo属性，用于携带额外信息，格式自定义，由跳转的 App 自⾏解析处理。
         * 对应 iOS 微信 OpenSDK 中的 messageExt 字段（LaunchFromWXReq.message.messageExt），
         * 或对应 Android 微信 OpenSDK 中的 messageExt 字段（ShowMessageFromWX.Req.message.messageExt），
         * 详细参见文档《App获取开放标签<wx-open-launch-app>中的 extinfo 数据》
         * https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/APP_GET_EXTINF.html
         */
        extinfo() {
            const token = window.localStorage.getItem('token') || '';
            const sid = window.sessionStorage.getItem('shareId') || '';
            const extinfo = {
                token,
                openType: this.params.openType,
                ...(this.params.did ? { did: this.params.did } : {}),
                ...(sid ? { sid } : {}),
            };
            return extinfo; 
        }
    },
    methods: {
        // event: { appId: string, extInfo: string }
        handlerSuccess(event) {
            console.log('success', event);
            this.$emit('handlerComfirm');
        },
        // event: { errMsg: string, appId: string, extInfo: string }
        // event.errMsg: "launch:fail"
        // 当前场景不支持跳转，或 Android 上该应用未安装，或 iOS 上用户在弹窗上点击确认但该应⽤未安装
        // event.errMsg: "launch:fail_check fail"
        // 校验 App 跳转权限失败，请确认是否正确绑定AppID
        handlerError(event) {
            console.log('fail', event);
            this.$emit('handlerComfirm');
            if (event.detail.errMsg === 'launch:fail') {
                this.showOverlay();
                // window.location.href = 'https://hmd-down.oss-cn-hangzhou.aliyuncs.com/hificloud/android/release.apk';
                return;
            }
            this.handlerOpenAPP();
        },
        handlerOpenIosApp() {
            if ((this.isAndroid && this.isWeixin && this.isSignatured)) return;
            this.handlerOpenAPP();
            this.$emit('handlerComfirm');
        },
        handlerOpenAPP() {
            const params = qs.stringify(this.extinfo);
            const type = this.isAndroid ? 'android' : 'ios';
            const urlConfig = {
                android: {
                    openUrl: `hfc://com.hificloud:1024/HiSchemeActivity?${params}`,
                    downloadUrl: 'https://hmd-down.oss-cn-hangzhou.aliyuncs.com/hificloud/android/release.apk',
                },
                ios: {
                    openUrl: `https://wx.hificloud.net/open?${params}.dde.1wx`,
                    downloadUrl: 'https://apps.apple.com/cn/app/hificloud/id1543197598',
                },
            };
            const { openUrl, downloadUrl } = urlConfig[type];
            window.location.href = openUrl;
            setTimeout(() => {
                const hidden = window.document.hidden || window.document.mozHidden || window.document.msHidden || window.document.webkitHidden;
                if (type === 'ios' && !hidden) this.showOverlay();
                if (type === 'android' && !hidden && this.isWeixin) this.showOverlay();
                if (type === 'android' && !hidden && !this.isWeixin) window.location.href = downloadUrl;
            }, 1500);
        },
    },
    mounted() {
        const btn = this.$el.querySelector('.wx-open-btn');
        if (!btn) return;
        btn.addEventListener('launch', this.handlerSuccess);
        btn.addEventListener('error', this.handlerError);
        // 无法使用开放标签的错误回调
        document.addEventListener('WeixinOpenTagsError', function (e) {
            console.log('WeixinOpenTagsError: 无法使用开放标签的错误回调', e);
            this.$el.onclick = function() {
                this.handlerOpenAPP();
            };
        });
    },
}
</script>

<style>
.open-app {
    position: relative;
    display: flex;
}
.open-app .camouflage-btn {
    display: flex;
    width: 100%;
    height: 100%;
}
.open-app .wx-open-btn {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 1;
    opacity: 0;
    width: 100%;
    height: 100%;
}
</style>