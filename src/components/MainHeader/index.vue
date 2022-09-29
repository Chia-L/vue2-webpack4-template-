<template>
  <header class="flex align-items-center">
    <div class="justify-content-start">
      <img :src="imgUrl" alt="" v-if="imgUrl">
      <span v-text="title"></span>
    </div>
    <slot name="right" class="justify-content-end"></slot>
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
  background-color: @MainHeaderColor;
  padding: 0 20px;
}
</style>
