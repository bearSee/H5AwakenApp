<template>
  <div class="file-content">
      <div class="user-info">
        <avatar-info />
        <div class="operate-box">
          <van-popover class="filter-popover" v-model:show="showPopover" :actions="filters" @select="handlerFilter">
            <template #reference>
              <div class="operate" @click.stop="showPopover = !showPopover">
                <img class="oper-icon" :src="require(`@/assets/image/menu_sort.png`)" alt="" srcset="">
                <span>排序</span>
              </div>
            </template>
            <template #action="{ action }">
                <van-icon v-if="action.code === filterCode" name="success" />
                <span v-else class="ac-empty"></span>
                <span class="ac-name">{{ action.text }}</span>
            </template>
          </van-popover>
          <div class="operate" @click="handlerChangeGrid">
            <img class="oper-icon" :src="require(`@/assets/image/${isGird ? 'menu_view_list' : 'menu_view_grid'}.png`)" alt="" srcset="">
            <span>{{ isGird ? '列表' : '宫格' }}</span>
          </div>
        </div>
      </div>
      <div class="photo-box">
        <div class="photo-operate">
            <span class="last-name" :class="!currentPathName && 'is_main'" @click="handlerBack">{{ lastPathName }}</span>
            <van-icon v-if="currentPathName" name="arrow" />
            <span class="current-name">{{ currentPathName }}</span>
        </div>
        <div class="photo-c">
          <span>共 {{ classifyCount['fileType_2'] || 0 }} 个文件夹，{{ classifyCount['fileType_1'] || 0 }} 个文件</span>
        </div>
        <!-- <span class="back" v-if="pathHistory.length > 1" @click="handlerBack"><van-icon name="arrow-left" /> 返回上一级</span> -->
      </div>
      <template v-if="(files.content || []).length">
        <van-grid v-if="isCreated" :class="isGird ? 'is-gird' : 'is-list'" :border="false" :column-num="isGird ? 3 : 1">
          <van-grid-item v-for="file in files.content || []" :key="file.id" @click="handlerViewDetail(file)">
            <open-app :params="{ openType: componentTag, item: file.path }" v-if="file.fileType !== 2">
              <div
                v-if="file.thumbnailUrl"
                class="image-container"
                :style="`background-image: url(${require(`@/assets/image/no_pic.png`)})`">
                <div class="image-div" :style="`background-image: url(${file.thumbnailUrl});`"></div>
              </div>
              <van-image
                v-else
                fit="contain"
                :src="require(`@/assets/image/gird_file.png`)" />
              <div class="describe-box">
                <div class="file-name">
                  <span class="filename cut_font">{{ file.filename }}<span v-if="file.fileType !== 2">.</span></span><span v-if="file.formatname" class="formatname">{{ file.formatname }}</span>
                </div>
                <div class="update-time">{{ formatDate(new Date(file.modifyTime), 'YYYY-MM-DD hh:mm') }} <span v-if="!isGird">{{ resetSize(file.size) }}</span></div>
                <div class="file-size" v-if="isGird">{{ resetSize(file.size) }}</div>
              </div>
            </open-app>
            <template v-else>
              <div
                v-if="file.thumbnailUrl"
                class="image-container"
                :style="`background-image: url(${require(`@/assets/image/no_pic.png`)})`">
                <div class="image-div" :style="`background-image: url(${file.thumbnailUrl});`"></div>
              </div>
              <van-image
                v-else
                fit="contain"
                :src="require(`@/assets/image/${file.fileType === 2 ? 'gird_folder' : 'gird_file'}.png`)" />
              <div class="describe-box">
                <div class="file-name">
                  <span class="filename cut_font">{{ file.filename }}<span v-if="file.fileType !== 2">.</span></span><span v-if="file.formatname" class="formatname">{{ file.formatname }}</span>
                </div>
                <div class="update-time">{{ formatDate(new Date(file.modifyTime), 'YYYY-MM-DD hh:mm') }}</div>
                <van-icon v-if="!isGird && file.fileType === 2" name="arrow" />
              </div>
            </template>
          </van-grid-item>
        </van-grid>
        <div class="tip-box van-list__finished-text" v-show="!(isFinished && total <= originPageSize)">{{ isFinished ? '没有更多了' : (isLoading ? '正在加载...' : '上拉加载更多') }}</div>
      </template>
      <van-empty v-else class="empty" :class="isLoading && 'transparent_empty'" :image="require(`@/assets/image/empty.png`)" description="暂无内容" />
      <!-- <van-dialog class="preview-dialog-tip" title="提示" v-model:show="visible" :show-confirm-button="false">
        <div class="van-dialog__message van-dialog__message--has-title">分享文件不支持在线预览方式，请打开APP浏览</div>
        <open-app class="van-hairline--top van-dialog__footer" :params="{ openType: componentTag }" @handler-comfirm="visible = false">
          <van-button style="width: 100%;color:#007AFF;font-size:.16rem;">确 定</van-button>
        </open-app>
      </van-dialog> -->
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import avatarInfo from './avatar-info';
import formatDate from '@/utils/formatDate';
import openApp from '@/components/open-app';

const originPageSize = 15;

export default {
    name: 'FileContent',
    props: {
        componentTag: {
            type: String,
            default: '',
        },
    },
    components: {
        avatarInfo,
        openApp,
    },
    setup() {
      const { state, dispatch } = useStore();
      return {
          isAndroid: computed(() => state.isAndroid || {}),
          isWeixin: computed(() => state.isWeixin),
          isCreated: ref(true),
          files: computed(() => state.files || {}),
          total: computed(() => (state.files || {}).totalItem || 0),
          pathHistory: reactive([(state.shareInfo.content || [])[0] || {}]),
          page: ref(0),
          pageSize: ref(originPageSize),
          classifyCount: computed(() => (state.files || {}).classifyCount || {}),
          isLoading: computed(() => state.isLoading),
          // visible: ref(false),
          isFinished: computed(() => ((state.files || {}).content || []).length >= (state.files || {}).totalItem),
          // 是否为宫格展示
          isGird: ref(false),
          showPopover: ref(false),
          filters: [
            { text: '名称', code: 'zu' },
            { text: '时间', code: 'mu' },
            { text: '大小', code: 'su' },
          ],
          filterCode: ref('zd'),
          getFiles: params => dispatch('getFiles', params),
          formatDate,
      };
    },
    data() {
        return {
            originPageSize,
        }
    },
    computed: {
        params() {
            return {
                path: (this.pathHistory[this.pathHistory.length - 1] || {}).path,
                sort: this.filterCode,
                range: `${this.page},${this.pageSize}`,
            };
        },
        lastPathName() {
            const { shootName } = this.pathHistory[this.pathHistory.length - 2] || {};
            return shootName || '文件分享';
        },
        currentPathName() {
            const { shootName } = this.pathHistory[this.pathHistory.length - 1] || {};
            return shootName;
        },
    },
    methods: {
        handlerFilter({ code }) {
            this.filterCode = code;
            this.handlerLoadFiles();
        },
        handlerViewDetail(file) {
          const { fileType } = file;
            if (fileType === 2) {
                this.pathHistory.push(file);
                this.pageSize = originPageSize;
                this.handlerLoadFiles();
                return;
            }
            // this.visible = true;
        },
        handlerChangeGrid() {
            this.isGird = !this.isGird;
            if (!(this.files.content || []).length) return;
            this.isCreated = false;
            this.$emit('hide-swipe')
            this.$nextTick(() => {
                setTimeout(() => {
                    this.isCreated = true;
                    this.$emit('show-swipe')
                }, 150);
            });

            // this.isGird = !this.isGird;
            // if (this.isAndroid && this.isWeixin) {
            //     this.isCreated = false;
            //     this.$emit('hide-swipe')
            //     this.$nextTick(() => {
            //         this.isCreated = true;
            //         this.$emit('show-swipe')
            //     });
            // }
        },
        handlerBack() {
            if (this.pathHistory.length < 2) return;
            this.pathHistory.pop();
            this.pageSize = originPageSize;
            this.handlerLoadFiles();
        },
        async handlerLoadFiles() {
            await this.getFiles(this.params);
        },
        async onscroll({ target }) {
            const parentHeight = +window.getComputedStyle(target).height.replace(/px/ig, '');
            const tipDom = this.$el.querySelector('.tip-box');
            const currentTop = target.scrollTop;
            const withinLimit = target.scrollTop + parentHeight > tipDom.offsetTop + 50;
            if (!this.isFinished && !this.isLoading && withinLimit) {
                this.pageSize += originPageSize;
                await this.handlerLoadFiles();
                if (!this.isAndroid) return;
                this.$nextTick(() => {
                    target.scrollTop = currentTop;
                });
            }
        },
        resetSize(size) {
            if (size > (1024 * 1024 * 1024)) return `${(size / 1024 / 1024 / 1024).toFixed(2)}G`;
            if (size > (1024 * 1024)) return `${(size / 1024 / 1024).toFixed(2)}M`;
            if (size > 1024) return `${(size / 1024).toFixed(1)}K`;
            return `${size}B`;
        },
    },
    mounted () {
        document.getElementById('home-body').addEventListener('scroll', this.onscroll);
    },
}
</script>

<style>
  @import '@/assets/file-content.css';
</style>