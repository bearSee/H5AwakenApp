<template>
  <div class="image-content">
      <div class="user-info">
        <avatar-info />
        <div class="operate-box">
          <div class="operate" @click="handlerChangeGrid">
            <img class="oper-icon" :src="require(`@/assets/image/${isGird ? 'menu_view_pic' : 'menu_view_grid'}.png`)" alt="" srcset="">
            <span>{{ isGird ? '大图' : '宫格' }}</span>
          </div>
        </div>
      </div>
      <div class="photo-box">
        <div class="photo-t">照片合集</div>
        <div class="photo-c">
          <span>共 {{ classifyCount.mediaType_2 }} 张照片，{{ classifyCount.mediaType_1 }} 个视频</span>
        </div>
      </div>
      <van-grid v-if="images.length" v-show="isCreated" :square="isGird" :gutter="1" :border="false" :column-num="isGird ? 3 : 1">
        <van-grid-item v-for="(image, i) in (homeConfig.maxFileLength > 0 ? images.slice(0, homeConfig.maxFileLength) : images)" :key="image.id">
          <!-- <video class="video" v-if="image.type === 1" controls :poster="image.thumbnailUrl">
            <source :src="image.originUrl" type="video/mp4">
          </video>
          <van-image v-else :src="image.thumbnailUrl" @click="handlerPreview(i)" fit="cover" /> -->
          <div
            class="image-container"
            @click="handlerPreview(i)"
            :style="`background-image: url(${isGird ? image.thumbnailUrl : image.url})`">
            <van-image v-if="!isGird" :src="isGird ? image.thumbnailUrl : image.url" fit="cover" alt="1" @load="loadFinished" @error="loadFinished"/>
            <div v-if="image.type === 1">
              <span v-if="isGird" class="duration">{{ formatDuration(image.videoDuration) }}</span>
              <img v-else class="play-btn" src="@/assets/image/play_btn.png" alt="" srcset="">
            </div>
            <open-app
              class="image-mask"
              :class="isGird && 'is-gird'"
              :params="{ openType: componentTag, item: image.md5 }"
              v-if="homeConfig.maxFileLength > 0 && images.length > homeConfig.maxFileLength && i >= (homeConfig.maxFileLength - 1)">
              <span>+ {{ ((Number(classifyCount.mediaType_2) + Number(classifyCount.mediaType_1)) || images.length) - homeConfig.maxFileLength + 1 }}</span>
            </open-app>
          </div>
        </van-grid-item>
      </van-grid>
      <van-image-preview
        class-name="image-preview-dialog"
        overlay-class="image-preview-mask"
        teleport="body"
        closeable
        v-model:show="previewVisible"
        :images="homeConfig.maxFileLength > 0 && images.length > homeConfig.maxFileLength ? previewImages.slice(0, homeConfig.maxFileLength - 1) : previewImages"
        :start-position="previewStartPosition"
        :close-icon="require(`@/assets/image/close.png`)"
        @change="previewChange"
        @close="currentImage = {}">
        <template v-slot:cover>
          <!-- <van-button
            v-if="!currentImage.isOrigin && currentImage.type !== 1"
            class="origin-btn"
            round
            @click="handlerViewOrigin">
            查看原图（{{ ((currentImage.size || 0) / 1024 / 1024).toFixed(2) }}M）
          </van-button> -->
          <div class="operate-box">
            <open-app class="save-btn" :params="{ openType: 'SAVE_TO', item: currentImage.md5 }">
              <img src="@/assets/image/btn_save_large.png" alt="" srcset="">
              <div>转存</div>
            </open-app>
            <open-app class="open-btn" :params="{ openType: componentTag, item: currentImage.md5 }">
              <img src="@/assets/image/applogo.png" alt="" srcset="">
              <div>用APP查看</div>
            </open-app>
          </div>
          <img v-if="currentImage.type === 1" class="play-btn" src="@/assets/image/play_btn.png" alt="" srcset="">
        </template>
      </van-image-preview>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import avatarInfo from './avatar-info';
import openApp from '@/components/open-app';

const formatStr = s => `0${s || 0}`.slice(-2);
let timer;

export default {
    name: 'ImageContent',
    props: {
        componentTag: {
            type: String,
            default: '',
        },
    },
    components: { avatarInfo, openApp },
    setup() {
      const { state } = useStore();
      return {
          isCreated: ref(true),
          homeConfig: computed(() => (state.assetConfig || {}).home || {}),
          images: computed(() => (state.images || {}).content || []),
          // 是否为宫格展示
          isGird: ref(true),
          previewVisible: ref(false),
          previewStartPosition: ref(0),
          previewImages: computed(() => ((state.images || {}).content || []).map(({ url, originUrl, isOrigin }) => isOrigin ? originUrl : url)),
          currentImage: reactive({}),
          classifyCount: computed(() => (state.images || {}).classifyCount || {}),
      };
  },
  methods: {
      handlerPreview(index) {
          const maxFileLength = this.homeConfig.maxFileLength;
          if (index + 1 >= maxFileLength && (maxFileLength > 0 && this.images.length > maxFileLength)) return;
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
      formatDuration(duration) {
          duration = (Number(duration) || 0) / 1000;
          const h = parseInt(duration / 3600);
          const m = parseInt(duration % 3600 / 60);
          const s = duration % 60;
          return `${h && formatStr(h) || ''}${h && ':' || ''}${formatStr(m)}:${formatStr(s)}`;
      },
      handlerChangeGrid() {
          this.isGird = !this.isGird;
          if (!this.images.length) return;
          this.isCreated = false;
          this.$emit('hide-swipe')
          this.$nextTick(() => {
              // 图片未加载完成，会导致高度计算错误，样式有问题
              setTimeout(() => {
                  this.isCreated = true;
                  this.$emit('show-swipe')
              }, 450);
          });
      },
      loadFinished() {
          clearTimeout(timer);
          timer = setTimeout(() => {
              this.$emit('show-swipe')
          }, 500);
      },
  },
}
</script>

<style>
  @import '@/assets/image-content.css';
</style>
