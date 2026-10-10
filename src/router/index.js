import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import routes from './routes.js'

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  Router.beforeEach((to) => {
    const isAuthenticated =
      typeof document !== 'undefined' &&
      document.cookie.split(';').some((cookie) => cookie.trim().startsWith('auth_session='))

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !isAuthenticated) {
      return { name: 'login' }
    }

    if (guestOnly && isAuthenticated) {
      return { name: 'home' }
    }

    return true
  })

  return Router
})
