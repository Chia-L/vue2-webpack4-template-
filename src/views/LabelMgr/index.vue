<template>
  <div>
    <div v-text="标签管理todo"></div>
    <el-date-picker
      v-model="time"
      type="datetime"
      size="small"
      placeholder="element选择日期时间">
    </el-date-picker>
    <el-button type="primary" size="small" @click="showPopup = true">vxe 弹窗</el-button>
    <el-button type="primary" size="small" @click="showViewDialog = true">view 弹窗</el-button>
    <vxe-modal
      resize
      show-footer
      show-confirm-button
      show-cancel-button
      show-maximize
      v-model="showPopup"
      title="vxe 弹窗"
      height="400"
      width="800"
      @show="showSubEvent"
      @confirm="confirmSubEvent">
      测试
    </vxe-modal>
    <Modal
      v-model="showViewDialog"
      title="view 弹窗"
      @on-ok="confirmSubEvent"
      @on-cancel="showSubEvent">
      测试
    </Modal>
  </div>
</template>

<script>
export default {
  name: 'index',
  data() {
    return {
      time: '',
      showPopup: false,
      showViewDialog: false
    }
  },
  methods: {
    showSubEvent() {},
    confirmSubEvent() {}
  }
}
</script>

<style scoped>

</style>
