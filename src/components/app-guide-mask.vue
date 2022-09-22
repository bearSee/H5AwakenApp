<template>
  <div class="app-guide-mask">
    <div class="mask-box" v-show="visible">
      <img :src="homeConfig.open_app_mask || ''" alt="" srcset="">
    </div>
    <van-overlay class="overlay-dialog" :show="visible">
      <img src="@/assets/image/guide_content.png" alt="" srcset="">
      <img class="guide-btn" src="@/assets/image/guide_btn.png" alt="" srcset=""  @click="closeOverlay">
    </van-overlay>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
    name: 'appGuideMask',
    setup() {
        const { state, commit } = useStore();
        return {
            visible: computed(() => state.overlayVisible),
            closeOverlay: () => commit('setOverlayVisible', false),
            homeConfig: computed(() => (state.assetConfig || {}).home || {}),
        };
    },
}
</script>

<style>
  @import '@/assets/app-guide-mask.css';
</style>
