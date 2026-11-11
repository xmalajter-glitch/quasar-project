import { reactive } from 'vue'
import { socket } from './socket.js'
import { api } from './boot/axios'

const emptyChannel = () => ({ name: '', type: 'public', isInvited: false })

export const store = reactive({
  // Stav prihlaseneho pouzivatela
  currentUser: {
    status: localStorage.getItem('user_status') || 'online',
  },

  // Nastavenia pouzivatela
  settings: {
    notifyOnlyMentions: localStorage.getItem('notify_only_mentions') === 'true',
  },

  // Nacitavanie kanalov z MainLayout
  channels: [],
  currentChannel: emptyChannel(),

  // Správy jednotlivych kanalov
  messages: {},

  presence: {},

  // Stav UI zdielany medzi layoutom a prikazovym riadkom
  ui: {
    rightDrawerOpen: false,
    membersRefresh: 0, // zvysenie vynuti znovunacitanie zoznamu clenov
  },
})

// Pripojenie do kanala alebo jeho vytvorenie (prikaz /join aj dialog "Novy kanal")
export async function joinChannel(name, isPrivate = false) {
  const response = await api.post('/channels/join', { channelName: name, isPrivate })
  const ch = response.data.channel

  let channel = store.channels.find((c) => c.name === ch.channelName)
  if (!channel) {
    store.channels.push({
      id: ch.id,
      name: ch.channelName,
      type: ch.isPrivate ? 'private' : 'public',
      adminId: ch.adminId,
      isInvited: false,
    })
    channel = store.channels[store.channels.length - 1]
  }
  store.currentChannel = channel

  return response.data.message
}

// Odstranenie kanala zo zoznamu (opustenie, zrusenie); vrati true, ak v zozname bol
export function removeChannel(match) {
  const index = store.channels.findIndex(match)
  if (index === -1) return false

  const [removed] = store.channels.splice(index, 1)
  if (removed.id) socket.emit('leaveChannel', removed.id)

  if (store.currentChannel?.name === removed.name) {
    store.currentChannel = store.channels[0] ?? emptyChannel()
  }
  return true
}
