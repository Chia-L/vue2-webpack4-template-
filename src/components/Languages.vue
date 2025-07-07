<template>
  <div class="language-view">
    <span>语言：</span>
    <el-dropdown @command="transText">
            <span class="el-dropdown-link">
              <span v-text="langOptions[curLang]"></span>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item v-for="key in Object.keys(langOptions)"
                          :key="key" :command="key" v-text="langOptions[key]"></el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { langs, locale } from '@/i18n'

export default {
  name: 'Language',
  data () {
    return {
      langOptions: langs,
      curLang: locale
    }
  },
  methods: {
    transText(lan) {
      this.curLang = lan
      // this.$i18n.locale = lan
      localStorage.setItem('lang', lan)
      location.reload()
    }
  }
}
</script>

<style scoped lang="less">
.language-view {
  color: #FFFFFF;
  /deep/ .el-dropdown {
    color: #FFFFFF;
  }
}
</style>
