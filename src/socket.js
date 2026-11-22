import { io } from 'socket.io-client'

// Jedine WebSocket spojenie aplikacie. Pripaja sa az po prihlaseni (MainLayout),
// token sa cita pri kazdom (znovu)pripojeni, takze po zmene pouzivatela sa pouzije novy.
export const socket = io('http://localhost:3333', {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem('auth_token') }),
})
