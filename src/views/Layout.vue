<template>
  <div id="page-main">
    <main-header img-url="/public/images/logo.png"></main-header>
    <main class="flex">
      <Menu theme="dark"
            :active-name="curMenu"
            :open-names="expandMenu">
        <template v-for="menu in menus">
          <Submenu v-if="menu.children && menu.children.length"
                   :name="menu.path"
                   :key="menu.path">
            <template #title>
              <use-svg :x-link="menu.meta ? menu.meta.icon : '' "></use-svg>
              <span v-text="menu.name"></span>
            </template>
            <MenuItem v-for="item in menu.children"
                      :name="item.path"
                      :to="item.path"
                      :key="item.path">
              <span v-text="item.name"></span>
            </MenuItem>
          </Submenu>
          <MenuItem v-else
                    :name="menu.path"
                    :to="menu.path"
                    :key="menu.path">
            <use-svg :x-link="menu.meta ? menu.meta.icon : '' "
                     :key="menu.path+'icon'"></use-svg>
            <span v-text="menu.name" :key="menu.path+'text'"></span>
          </MenuItem>
        </template>
      </Menu>
      <div class="flex-1">
        <Breadcrumb class="page-header">
          <template v-for="(breadcrumb, idx) in breadcrumbs">
            <BreadcrumbItem v-if="idx < breadcrumbs.length-1"
                            :to="breadcrumb.path"
                            :key="breadcrumb.path">
              <span v-text="breadcrumb.name"></span>
            </BreadcrumbItem>
            <BreadcrumbItem v-else
                            :key="breadcrumb.path">
              <span v-text="breadcrumb.name"></span>
            </BreadcrumbItem>
          </template>
        </Breadcrumb>
        <router-view class="page-main" />
      </div>
    </main>
  </div>
</template>

<script>
import MainHeader from '@/components/MainHeader'
import UseSvg from '@/components/UseSvg'
import utils from '@/utils/utils'
import { httpHelper } from '@/utils/httpHelper'
export default {
  name: 'Layout',
  components: {
    MainHeader,
    UseSvg
  },
  data() {
    return {
      title: '科力锐迁移云',
      menus: [],
      curMenu: '',
      expandMenu: [],
      breadcrumbs: []
    }
  },
  mounted() {
    this.menus = this.$router.options.routes[0].children
    this.curMenu = this.menus[0].path
    this.expandMenu = [this.menus[0].path]
    httpHelper('/api/report/get_migration_report', 'POST', {}, function (res) {
      console.log(res)
    })
  },
  watch: {
    '$route': {
      handler(v) {
        utils.findPathsByKey(this.$router.options.routes[0].children, 'path', v.fullPath, paths => {
          paths.unshift({name: '整机迁移', path: '/'})
          this.breadcrumbs = paths
        })
      },
      immediate: true
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
    /deep/.ivu-menu-dark {
      width: @MainMenuWidth!important;
      height: 100%;
      &, &.ivu-menu-vertical .ivu-menu-opened {
        background-color: @MainMenuColor;
      }
      &.ivu-menu-vertical .ivu-menu-submenu-title {
        font-weight: 600!important;
      }
      &.ivu-menu-vertical .ivu-menu-submenu-title,
      &.ivu-menu-vertical .ivu-menu-item {
        display: flex;
        align-items: center;
        & > .svg-temps {
          margin-right: 5px;
        }
      }
      &.ivu-menu-vertical .ivu-menu-submenu .ivu-menu-item-active,
      &.ivu-menu-vertical .ivu-menu-submenu .ivu-menu-item-active:hover,
      &.ivu-menu-vertical .ivu-menu-submenu .ivu-menu-item:hover,
      &.ivu-menu-vertical .ivu-menu-opened .ivu-menu-submenu-title,
      &.ivu-menu-vertical .ivu-menu-item:hover,
      &.ivu-menu-vertical .ivu-menu-submenu-title:hover{
        background: @MainMenuHoverColor!important;
      }
      &.ivu-menu-vertical .ivu-menu-submenu .ivu-menu-item-active {
        color: #2D8CF0;
      }
    };
    .page-header {
      height: @MainHeaderHeight;
      line-height: @MainHeaderHeight;
      padding: 0 20px;
      font-weight: bold;
      color: #606266;
      box-shadow: 0 2px 6px 3px rgba(0, 0, 0, .1);
      &.ivu-breadcrumb>span:last-child{
        color: #909399!important;
      }
    }
    .page-main {
      padding: 20px 20px 0;
    }
  }
}
</style>
