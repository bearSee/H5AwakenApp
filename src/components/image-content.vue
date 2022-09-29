<template>
  <div class="image-content">
      <div class="user-info">
        <avatar-info />
        <div class="operate-box">
          <div class="operate" @click="isGird = !isGird">
            <img class="oper-icon" :src="require(`@/assets/image/${isGird ? 'menu_view_grid' : 'menu_view_pic'}.png`)" alt="" srcset="">
            <span>{{ isGird ? '宫格' : '大图' }}</span>
          </div>
        </div>
      </div>
      <div class="photo-box">
        <div class="photo-t">照片合集</div>
        <div class="photo-c">
          <span>共 {{ classifyCount.image }} 张照片，{{ classifyCount.video }} 个视频</span>
        </div>
      </div>
      <van-grid v-if="images.length" :square="isGird" :gutter="1" :border="false" :column-num="isGird ? 3 : 1">
        <van-grid-item v-for="(image, i) in (homeConfig.maxFileLength > 0 ? images.slice(0, homeConfig.maxFileLength) : images)" :key="image.id">
          <!-- <video class="video" v-if="image.type === 1" controls :poster="image.thumbnailUrl">
            <source :src="image.originUrl" type="video/mp4">
          </video>
          <van-image v-else :src="image.thumbnailUrl" @click="handlerPreview(i)" fit="cover" /> -->
          <div
            class="image-container"
            @click="handlerPreview(i)"
            :style="`background-image: url(${image.thumbnailUrl})`">
            <van-image v-if="!isGird" :src="image.thumbnailUrl" fit="cover" />
            <div v-if="image.type === 1">
              <span v-if="isGird" class="duration">{{ formatDuration(image.videoDuration) }}</span>
              <img v-else class="play-btn" src="@/assets/image/play_btn.png" alt="" srcset="">
            </div>
            <open-app
              class="image-mask"
              :class="isGird && 'is-gird'"
              :params="{ openType: componentTag }"
              v-if="homeConfig.maxFileLength > 0 && images.length > homeConfig.maxFileLength && i >= (homeConfig.maxFileLength - 1)">
              <span>+ {{ images.length - homeConfig.maxFileLength + 1 }}</span>
            </open-app>
          </div>
        </van-grid-item>
      </van-grid>
      <van-image-preview
        class-name="image-preview-dialog"
        overlay-class="image-preview-mask"
        closeable
        v-model:show="previewVisible"
        :images="homeConfig.maxFileLength > 0 ? previewImages.slice(0, homeConfig.maxFileLength - 1) : previewImages"
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
            <open-app class="save-btn" :params="{ openType: componentTag }">
              <img src="@/assets/image/btn_save_large.png" alt="" srcset="">
              <div>转存</div>
            </open-app>
            <open-app class="open-btn" :params="{ openType: componentTag }">
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
          homeConfig: computed(() => (state.assetConfig || {}).home || {}),
          images: computed(() => state.images),
          // 是否为宫格展示
          isGird: ref(true),
          previewVisible: ref(false),
          previewStartPosition: ref(0),
          previewImages: computed(() => state.images.map(({ url, originUrl, isOrigin }) => isOrigin ? originUrl : url)),
          currentImage: reactive({}),
          classifyCount: computed(() => {
            const videoCount = state.images.filter(({ type }) => type === 1).length;
              return {
                  video: videoCount,
                  image: state.images.length - videoCount,
              }
          }),
      };
  },
  methods: {
      handlerPreview(index) {
          if (index + 1 >= this.homeConfig.maxFileLength) return;
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
  },
}
</script>
