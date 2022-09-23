import Layout from '@/views/Layout'
import Home from '@/views/Home'
const constantRoutesMap = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        component: Home
      }
    ]
  }
]
const asyncRoutes = []

export {
  constantRoutesMap,
  asyncRoutes
}
