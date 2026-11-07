import { boot } from 'quasar/wrappers'
import { io, Socket } from 'socket.io-client'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $socket: Socket
  }
}

// Inicializacia pripojenia na nas AdonisJS server
const socket = io('http://localhost:3333', {
  autoConnect: true, // Automaticky sa pripojí pri načítaní aplikácie
})

export default boot(({ app }: any) => {
  // Spristupnenie socketu globalne
  app.config.globalProperties.$socket = socket
})

// Exportovanie pre pouzitie mimo Vue komponentov
export { socket }