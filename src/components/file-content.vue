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
                <van-icon v-if="action.code === currentFilter.code" name="success" />
                <span v-else class="ac-empty"></span>
                <span class="ac-name">{{ action.text }}</span>
            </template>
          </van-popover>
          <div class="operate" @click="isGird = !isGird">
            <img class="oper-icon" :src="require(`@/assets/image/${isGird ? 'menu_view_grid' : 'menu_view_list'}.png`)" alt="" srcset="">
            <span>{{ isGird ? '宫格' : '列表' }}</span>
          </div>
        </div>
      </div>
      <div class="photo-box">
        <div class="photo-t">文件分享</div>
        <div class="photo-c">
          <span>共 {{ classifyCount[2] || 0 }} 个文件夹，{{ classifyCount[1] || 0 }} 个文件</span>
        </div>
        <span class="back" v-if="pathHistory.length > 1" @click="handlerBack"><van-icon name="arrow-left" /> 返回上一级</span>
      </div>
      <van-grid :border="false" :column-num="isGird ? 3 : 1">
        <van-grid-item v-for="file in files.content || []" :key="file.id" :class="isGird ? 'is-gird' : 'is-list'" @click="handlerViewDetail(file)">
          <van-image
            fit="cover"
            :class="{ 'is-image': !!file.thumbnailUrl }"
            :src="file.thumbnailUrl || require(`@/assets/image/${file.fileType === 2 ? 'file_folder' : 'file_default'}.png`)" />
          <div class="describe-box">
            <div class="file-name">{{ isGird ? file.girdShootName : file.shootName }}</div>
            <div class="update-time"><span class="time">{{ formatDate(new Date(file.modifyTime), 'YYYY-MM-DD hh:mm') }}</span> <span class="size">{{ file.size ? `${(file.size / 1024 / 1024).toFixed(2)}M` : '' }}</span></div>
            <van-icon v-if="!isGird && file.fileType === 2" name="arrow" />
          </div>
        </van-grid-item>
      </van-grid>
      <div class="tip-box van-list__finished-text">{{ isFinished ? '没有更多了' : (isLoading ? '正在加载...' : '上拉加载更多') }}</div>
      <van-dialog class="preview-dialog-tip" title="提示" v-model:show="visible" :show-confirm-button="false">
        <div class="van-dialog__message van-dialog__message--has-title">分享文件不支持在线预览方式，请打开APP浏览</div>
        <open-app class="van-hairline--top van-dialog__footer" :params="{ openType: componentTag }" @handler-comfirm="visible = false">
          <van-button style="width: 100%;color:#007AFF;font-size:.16rem;">确 定</van-button>
        </open-app>
      </van-dialog>
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
    components: { avatarInfo, openApp },
    setup() {
      const { state, dispatch } = useStore();
      return {
          files: computed(() => state.files || {}),
          pathHistory: reactive([((state.shareInfo.content || [])[0] || {}).path]),
          page: ref(0),
          pageSize: ref(originPageSize),
          classifyCount: computed(() => (state.files || {}).classifyCount || {}),
          isLoading: ref(false),
          visible: ref(false),
          isFinished: computed(() => (state.files.content || []).length >= state.files.totalItem),
          // 是否为宫格展示
          isGird: ref(true),
          showPopover: ref(false),
          filters: [
            { text: '名称', code: 'zd' },
            { text: '时间', code: 'md' },
            { text: '大小', code: 'sd' },
          ],
          currentFilter: { text: '名称', code: 'zd' },
          getFiles: params => dispatch('getFiles', params),
          formatDate,
      };
    },
    computed: {
        params() {
            return {
                path: this.pathHistory[this.pathHistory.length - 1],
                sort: this.currentFilter.code,
                range: `${this.page},${this.pageSize}`,
            };
        },
    },
    methods: {
        handlerFilter(filter) {
            this.currentFilter = filter;
            this.handlerLoadFiles();
        },
        handlerViewDetail({ fileType, path }) {
            if (fileType === 2) {
                this.pathHistory.push(path);
                this.pageSize = originPageSize;
                this.handlerLoadFiles();
                return;
            }
            this.visible = true;
        },
        handlerBack() {
            if (this.pathHistory.length < 2) return;
            this.pathHistory.pop();
            this.pageSize = originPageSize;
            this.handlerLoadFiles();
        },
        async handlerLoadFiles() {
            this.isLoading = true;
            await this.getFiles(this.params);
            this.isLoading = false;
        },
        onscroll({ target }) {
            const parentHeight = +window.getComputedStyle(target).height.replace(/px/ig, '');
            const tipDom = this.$el.querySelector('.tip-box');
            const withinLimit = target.scrollTop + parentHeight > tipDom.offsetTop + 50;
            if (!this.isFinished && !this.isLoading && withinLimit) {
                this.pageSize += originPageSize;
                this.handlerLoadFiles();
            }
        },
    },
    mounted () {
        document.getElementById('home-body').addEventListener('scroll', this.onscroll);
    },
}
</script>
