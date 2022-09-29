import Layout from '@/views/Layout'

// 概览
const Overview = () => import('@/views/Overview')
// 迁移管理
const MigrationMgr = () => import('@/views/MigrationMgr')
// 迁移任务
const MigrationTask = () => import('@/views/MigrationTask')
// 标签管理
const LabelMgr = () => import('@/views/LabelMgr')
// 迁移报表
const MigrationReport = () => import('@/views/MigrationReport')
const Summary = () => import('@/views/MigrationReport/summary')
const Schedules = () => import('@/views/MigrationReport/schedules')
// 迁移日志
const MigrationLog = () => import('@/views/MigrationLog')
// 任务日志
const TaskLog = () => import('@/views/MigrationLog/TaskLog')
// 客户端日志
const ClientLog = () => import('@/views/MigrationLog/ClientLog')
// 操作日志
const OprtLog = () => import('@/views/MigrationLog/OprtLog')
// 安全日志
const SecurityLog = () => import('@/views/MigrationLog/SecurityLog')
// 客户端下载
const ClientDownload = () => import('@/views/ClientDownload')

const constantRoutesMap = [
  {
    path: '/',
    name: '/',
    component: Layout,
    redirect: '/overview',
    children: [
      {
        path: '/overview',
        name: '概览',
        component: Overview,
        meta: {
          icon: 'i-gailan'
        }
      },
      {
        path: '/migrationmgr',
        name: '迁移管理',
        component: MigrationMgr,
        meta: {
          icon: 'i-qianyiguanli'
        }
      },
      {
        path: '/migrationtask',
        name: '迁移任务',
        component: MigrationTask,
        meta: {
          icon: 'i-qianyirenwu'
        }
      },
      {
        path: '/labelmgr',
        name: '标签管理',
        component: LabelMgr,
        meta: {
          icon: 'i-biaoqian'
        }
      },
      {
        path: '/migrationreport',
        name: '迁移报表',
        component: MigrationReport,
        meta: {
          icon: 'i-fuwurizhi'
        },
        children: [
          {
            path: '/migrationreport/summary',
            name: '迁移汇总表',
            component: Summary
          },
          {
            path: '/migrationreport/schedules',
            name: '迁移详细表',
            component: Schedules
          }
        ]
      },
      {
        path: '/migrationlog',
        name: '迁移日志',
        component: MigrationLog,
        redirect: '/migrationlog/tasklog',
        meta: {
          icon: 'i-ziyuan160'
        },
        children: [
          {
            path: '/migrationlog/tasklog',
            name: '任务日志',
            component: TaskLog
          },
          {
            path: '/migrationlog/clientlog',
            name: '客户端日志',
            component: ClientLog
          },
          {
            path: '/migrationlog/oprtlog',
            name: '操作日志',
            component: OprtLog
          },
          {
            path: '/migrationlog/securitylog',
            name: '安全日志',
            component: SecurityLog
          }
        ]
      },
      {
        path: '/clientdownload',
        name: '客户端下载',
        component: ClientDownload,
        meta: {
          icon: 'i-xiazai'
        }
      }
    ]
  }
]
const asyncRoutes = []

export {
  constantRoutesMap,
  asyncRoutes
}
