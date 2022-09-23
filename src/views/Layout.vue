<template>
  <div id="page-main">
    <main-header :title="title"></main-header>
    <main class="flex">
      <div>左侧</div>
      <router-view/>
    </main>
  </div>
</template>

<script>
import MainHeader from '@/components/MainHeader'
export default {
  name: 'Layout',
  components: {
    MainHeader
  },
  data() {
    return {
      title: 'test'
    }
  }
}
</script>

<style scoped lang="less">
@import "../assets/less/global";
#page-main {
  min-width: 1366px;
  height: 100%;
  overflow: auto;
  main {
    height: calc(100% - @MainHeaderHeight);
    div:first-child {
      width: @MainMenuWidth;
      height: 100%;
      background-color: @MainBkColor;
    }
  }
}
</style>
