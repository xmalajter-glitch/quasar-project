import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

// Nastavenie zakladnej URL adresy nasho backendu
const api = axios.create({ baseURL: 'http://localhost:3333/api/v1' })

export default boot(({ app }: any) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }