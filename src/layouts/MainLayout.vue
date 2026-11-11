<template>
  <CreateChannelDialog v-model="createDialog" @create="handleAddChannel" />
  
  <q-layout view="hHh LpR fFf">
    
    <!-- Hlavicka -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-icon name="tag" v-if="store.currentChannel.type === 'public'" />
          <q-icon name="lock" v-else />
          {{ store.currentChannel.name }}
        </q-toolbar-title>

        <!-- Prepinanie stavu pouzivatela a notifikacii -->
        <q-btn
          flat
          no-caps
          icon="account_circle"
          :label="authStore.user?.nickname || authStore.user?.name || 'Neznámy'"
          style="margin-right: 4px"
        >
          <q-badge floating :color="statusColor" rounded />
          <q-menu>
            <q-list style="min-width: 210px">
              <q-item clickable v-close-popup @click="setStatus('online')">
                <q-item-section avatar>
                  <q-icon color="positive" name="fiber_manual_record" />
                </q-item-section>
                <q-item-section>Online</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setStatus('dnd')">
                <q-item-section avatar>
                  <q-icon color="negative" name="remove_circle" />
                </q-item-section>
                <q-item-section>Nerušiť</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setStatus('offline')">
                <q-item-section avatar>
                  <q-icon color="grey" name="radio_button_unchecked" />
                </q-item-section>
                <q-item-section>Offline</q-item-section>
              </q-item>
              
              <q-separator />
              
              <!-- Prepinac notifikacii -->
              <q-item tag="label" v-ripple>
                <q-item-section>
                  <q-item-label caption>Notifikácie v ktorých som spomenutý</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle color="primary" v-model="store.settings.notifyOnlyMentions" />
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="enableNotifications">
                <q-item-section avatar><q-icon name="notifications" /></q-item-section>
                <q-item-section>Povoliť notifikácie</q-item-section>
              </q-item>
              
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Odhlásiť sa</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- Zobrazenie jednotlivych clenov kanala -->
        <q-btn dense flat round icon="people" @click="toggleRightDrawer">
          <q-tooltip>Členovia kanála (/list)</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Zoznam kanalov -->
    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered :width="250">
      <q-list>
        <q-item>
          <q-item-section>
            <q-item-label header class="q-pa-none">Kanály</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="add" @click="createDialog = !createDialog">
              <q-tooltip>Nový kanál</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
        
        <!-- Vykreslenie kanalov -->
        <q-item
          v-for="channel in sortedChannels"
          :key="channel.name"
          clickable
          v-ripple
          :active="store.currentChannel.name === channel.name"
          active-class="bg-blue-1 text-primary text-bold"
          @click="selectChannel(channel)"
        >
          <!-- Opustenie kanala pomocou stlacenia mysi-->
          <q-menu context-menu>
            <q-list dense style="min-width: 120px">
              <q-item clickable v-close-popup @click="leaveChannel(channel)">
                <q-item-section class="text-negative">Opustiť kanál</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-item-section avatar style="min-width: 30px">
            <q-icon :name="channel.type === 'public' ? 'tag' : 'lock'" size="sm" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>

          <!-- Pozvanka -->
          <q-item-section side v-if="channel.isInvited">
            <q-badge color="orange" label="Pozvánka" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Zoznam pouzivatelov v danom kanali -->
    <q-drawer v-model="store.ui.rightDrawerOpen" side="right" bordered :width="250">
      <q-list>
        <q-item-label header>Členovia (#{{ store.currentChannel.name }})</q-item-label>
        <q-item v-for="user in channelUsers" :key="user.nick" clickable v-ripple>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="md">
              {{ user.nick.charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ user.nick }}</q-item-label>
            <q-item-label caption v-if="user.isAdmin">Správca</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon
              :name="(store.presence[user.id] ?? 'offline') === 'offline' ? 'radio_button_unchecked' : 'fiber_manual_record'"
              :color="{ online: 'positive', dnd: 'negative' }[store.presence[user.id]] ?? 'grey'"
              size="xs"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Hlavny obsah -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../boot/axios'
import { store, removeChannel, joinChannel } from '../store.js'
import { useAuthStore } from '../stores/auth'
import { socket } from '../socket.js'
import CreateChannelDialog from '@/components/CreateChannelDialog.vue'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)
const createDialog = ref(false)
const channelUsers = ref([])

// Stav uzivatela (online / dnd / offline)
function identify() {
  if (!authStore.user?.id) return
  socket.emit('identify', {
    userId: authStore.user.id,
    status: store.currentUser.status,
  })
}

function onPresenceAll(all) {
  Object.entries(all).forEach(([id, st]) => {
    store.presence[id] = st
  })
}

function onPresenceUpdate({ userId, status }) {
  store.presence[userId] = status
}

// Kanal zrusil spravca -> odstranime ho zo zoznamu
function onChannelDeleted({ channelId, channelName, deletedBy }) {
  const removed = removeChannel(c => Number(c.id) === Number(channelId))
  if (removed && deletedBy !== authStore.user?.id) {
    $q.notify({ type: 'warning', message: `Kanál ${channelName} bol zrušený správcom.` })
  }
}

// Zmena clenov otvoreneho kanala (join, invite, kick, cancel) -> obnovime zoznam clenov
function onMembersChanged({ channelId }) {
  if (Number(channelId) === Number(store.currentChannel?.id)) store.ui.membersRefresh++
}

// Trvale vyhodenie z kanala -> kanal hned zmizne zo zoznamu
function onChannelBanned({ channelId, channelName, bannedBy }) {
  removeChannel(c => Number(c.id) === Number(channelId))
  $q.notify({
    type: 'negative',
    icon: 'block',
    message: bannedBy
      ? `Správca ${bannedBy} vás natrvalo vyhodil z kanála ${channelName}.`
      : `Členovia vás vyhodili z kanála ${channelName}. Máte trvalý ban.`
  })
}

// Spravca odobral pouzivatela zo sukromneho kanala (/revoke) -> kanal zmizne zo zoznamu
function onChannelRevoked({ channelId, channelName, revokedBy }) {
  removeChannel(c => Number(c.id) === Number(channelId))
  $q.notify({
    type: 'warning',
    icon: 'person_remove',
    message: `Správca ${revokedBy} vás odobral z kanála ${channelName}.`
  })
}

// Pozvanka do kanala -> kanal sa hned zobrazi zvyrazneny na vrchu zoznamu
function onChannelInvited({ channel, invitedBy }) {
  const existing = store.channels.find(c => Number(c.id) === Number(channel.id))
  if (existing) {
    existing.isInvited = true
  } else {
    store.channels.push({
      id: channel.id,
      name: channel.channelName,
      type: channel.isPrivate ? 'private' : 'public',
      adminId: channel.adminId,
      isInvited: true
    })
  }
  $q.notify({
    type: 'info',
    icon: 'mail',
    message: `${invitedBy} vás pozval do kanála ${channel.channelName}.`
  })
}

// Nacitanie kanalov pri spusteni
onMounted(async () => {
  socket.on('channel:invited', onChannelInvited)
  socket.on('channel:banned', onChannelBanned)
  socket.on('channel:revoked', onChannelRevoked)
  socket.on('channel:membersChanged', onMembersChanged)
  socket.on('connect', identify)
  socket.on('presence:all', onPresenceAll)
  socket.on('presence:update', onPresenceUpdate)
  socket.on('channel:deleted', onChannelDeleted)
  if (socket.connected) identify()

  try {
    const response = await api.get('/channels')
    store.channels = response.data.map(ch => ({
      id: ch.id,
      name: ch.channelName,
      type: ch.isPrivate ? 'private' : 'public',
      adminId: ch.adminId,
      isInvited: false
    }))

    if (store.channels.length > 0 && !store.currentChannel?.name) {
      store.currentChannel = store.channels[0]
    }
  } catch (error) {
    console.error('Chyba pri načítaní kanálov:', error)
  }
})

onUnmounted(() => {
  socket.off('connect', identify)
  socket.off('presence:all', onPresenceAll)
  socket.off('presence:update', onPresenceUpdate)
  socket.off('channel:deleted', onChannelDeleted)
  socket.off('channel:invited', onChannelInvited)
  socket.off('channel:banned', onChannelBanned)
  socket.off('channel:revoked', onChannelRevoked)
  socket.off('channel:membersChanged', onMembersChanged)
})

// Zoznam clenov sa nacita pri zmene kanala, otvoreni panela a prikaze /list
watch(
  () => [store.currentChannel?.name, store.ui.rightDrawerOpen, store.ui.membersRefresh],
  () => loadChannelUsers(store.currentChannel?.name),
  { immediate: true }
)

// Ulozenie stavu pre notifikacie
watch(
  () => store.settings.notifyOnlyMentions,
  (v) => localStorage.setItem('notify_only_mentions', String(v))
)

// Pripojenie do kanala cez API
async function handleAddChannel(channel) {
  try {
    const message = await joinChannel(channel.name, channel.isPrivate)
    $q.notify({ type: 'positive', message })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Chyba pri vytváraní kanála' })
  }
}

// Nacitanie pouzivatelov pre aktualny kanal
async function loadChannelUsers(channelName) {
  if (!channelName) {
    channelUsers.value = []
    return
  }
  try {
    const response = await api.get(`/channels/${channelName}/users`)
    channelUsers.value = response.data.map(user => ({
      id: user.id,
      nick: user.nickname,
      isAdmin: user.id === store.currentChannel.adminId
    }))
  } catch (error) {
    console.error('Nepodarilo sa načítať používateľov:', error)
    channelUsers.value = []
  }
}

function selectChannel(channel) {
  channel.isInvited = false // otvorenim kanala sa zvyraznenie pozvanky zrusi
  store.currentChannel = channel
}

// Opustenie kanala
async function leaveChannel(channel) {
  try {
    const response = await api.post('/channels/cancel', { channelName: channel.name })
    removeChannel(c => c.name === channel.name)
    $q.notify({ type: 'positive', message: response.data?.message || `Opustili ste kanál ${channel.name}` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Chyba pri opúšťaní kanála' })
  }
}

// Zobrazovanie stavov pre UI
function toggleLeftDrawer() { leftDrawerOpen.value = !leftDrawerOpen.value }
function toggleRightDrawer() { store.ui.rightDrawerOpen = !store.ui.rightDrawerOpen }

const statusColor = computed(() => {
  if (store.currentUser.status === 'online') return 'positive'
  if (store.currentUser.status === 'dnd') return 'negative'
  return 'grey'
})

function setStatus(status) {
  store.currentUser.status = status
  localStorage.setItem('user_status', status)
  socket.emit('setStatus', status)
}

const sortedChannels = computed(() => {
  return [...store.channels].sort((a, b) => {
    if (a.isInvited === b.isInvited) return 0
    return a.isInvited ? -1 : 1
  })
})

async function logout() {
  try {
    await authStore.logout()
  } catch (error) {
    console.error('Chyba pri odhlasovaní:', error)
  } finally {
    router.push({ name: 'login' })
  }
}

async function enableNotifications() {
  if (!('Notification' in window)) {
    $q.notify({ type: 'negative', message: 'Prehliadač nepodporuje notifikácie.' })
    return
  }
  const result = await Notification.requestPermission()
  $q.notify({
    type: result === 'granted' ? 'positive' : 'warning',
    message: result === 'granted' ? 'Notifikácie sú zapnuté.' : 'Notifikácie nie sú povolené.',
  })
}
</script>