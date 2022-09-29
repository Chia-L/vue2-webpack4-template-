<template>
  <svg class="svg-temps" aria-hidden="true">
    <use :xlink:href="xLink ? '#' + xLink : '' "></use>
  </svg>
</template>

<script>
export default {
  name: 'index',
  props: {
    xLink: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.svg-temps {
  width: 20px;
  height: 20px;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
