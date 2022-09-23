<template>
  <header>
    <div>
      <img src="" alt="" v-if="imgUrl">
      <span v-text="title"></span>
    </div>
    <slot name="right"></slot>
  </header>
</template>

<script>
export default {
  name: 'index',
  props: {
    title: {
      type: String,
      default: ''
    },
    imgUrl: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped lang="less">
@import "../../assets/less/global";
header {
  height: @MainHeaderHeight;
  background-color: @MainBkColor;
}
</style>
