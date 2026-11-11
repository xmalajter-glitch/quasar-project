<template>
  <q-page class="flex column" style="height: calc(100vh - 50px);">
    <div class="q-pa-md col overflow-auto" id="chat-area">
      <!-- Starsie spravy sa docitavaju po strankach pri scrollovani nahor -->
      <q-infinite-scroll
        reverse
        :offset="200"
        :disable="!hasMore || loadingInitial"
        @load="loadOlder"
      >
        <template #loading>
          <div class="row justify-center q-my-sm">
            <q-spinner-dots color="primary" size="30px" />
          </div>
        </template>

        <div
          v-if="!hasMore && !loadingInitial && messages.length > 0"
          class="text-center text-caption text-grey q-mb-sm"
        >
          Začiatok histórie kanála
        </div>

        <q-chat-message
          v-for="msg in messages"
          :key="msg.id"
          :name="msg.sender"
          :text="[msg.text]"
          :sent="msg.sender === authStore.user?.nickname"
          :bg-color="msg.isMention ? 'amber-3' : (msg.sender === authStore.user?.nickname ? 'blue-2' : 'grey-2')"
          :stamp="msg.time"
        />
      </q-infinite-scroll>
    </div>

    <!-- Fixny riadok na pisanie -->
    <div class="q-pa-sm border-top">
      
      <!-- Informacie o tom kto prave pise do daneho chatu -->
      <div v-if="typingUser" class="text-caption q-mb-xs q-px-sm">
        <q-icon name="edit" /> <em>{{ typingUser }} is typing...</em>
        <span class="text-primary cursor-pointer q-ml-sm" @click="showLiveText = true">(Zobraziť live text)</span>
      </div>

      <q-input
        v-model="newMessage"
        outlined
        dense
        placeholder="Napíšte správu alebo použite príkaz (napr. /join, /kick, /quit, @nickname)..."
        @keyup.enter="sendMessage"
        @update:model-value="simulateTyping"
      >
        <template #append>
          <q-btn round dense flat icon="send" color="primary" @click="sendMessage" />
        </template>
      </q-input>
    </div>

    <!-- Dialog pre zive sledovanie rozpisaneho textu -->
    <q-dialog v-model="showLiveText">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ typingUser }} práve píše:</div>
        </q-card-section>
        <q-card-section class="q-pt-none text-italic text-grey-8">
          "Ahojte, neviete kedy je dnes..."
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Zavrieť" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { store, removeChannel, joinChannel } from '../store.js'
import { api } from '../boot/axios'
import { useAuthStore } from '../stores/auth'
import { socket } from '../socket.js'

const authStore = useAuthStore()
const $q = useQuasar()

const newMessage = ref('')
const typingUser = ref('')
const showLiveText = ref(false)
const messages = ref([])

// Pomocne funkcie pre nickname
function isMentionOfMe(content) {
  const nick = authStore.user?.nickname
  if (!nick || !content) return false
  return new RegExp(`@${nick}\\b`, 'i').test(content)
}

function mapMessage(msg) {
  const content = msg.content || msg.text || ''
  const created = msg.createdAt || msg.created_at
  return {
    id: msg.id,
    userId: msg.userId ?? msg.user_id,
    channelId: msg.channelId ?? msg.channel_id,
    sender: msg.user?.nickname || 'Unknown',
    text: content,
    time: created
      ? new Date(created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    isMention: isMentionOfMe(content),
  }
}

function addMessage(msg) {
  if (messages.value.some((m) => m.id === msg.id)) return // deduplikácia
  messages.value.push(msg)
  scrollToBottom()
}

// Systemove notifikacie
function maybeNotify(msg) {
  if (msg.userId === authStore.user?.id) return       
  if (store.currentUser.status !== 'online') return   
  if (store.settings.notifyOnlyMentions && !msg.isMention) return

  const preview = msg.text.length > 60 ? msg.text.slice(0, 60) + '…' : msg.text

  if ($q.appVisible) {
    // notifikacie v apke pre kanal, iny nez otovreny
    if (Number(msg.channelId) !== Number(store.currentChannel?.id)) {
      $q.notify({
        message: msg.sender,
        caption: preview,
        color: msg.isMention ? 'orange' : 'primary',
        icon: msg.isMention ? 'alternate_email' : 'message',
        position: 'bottom-right',
        timeout: 4000,
      })
    }
    return
  }

  // Ak app nieje visible, posle sa systemova notifikacia
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(msg.sender, { body: preview })
    n.onclick = () => window.focus()
  }
}

// Historia sprav
const PAGE_SIZE = 30
const hasMore = ref(false) // existuju este starsie spravy?
const loadingInitial = ref(false)

// Prva stranka (najnovsie spravy) pri otvoreni kanala
const fetchMessages = async () => {
  const channelId = store.currentChannel?.id
  messages.value = []
  hasMore.value = false
  if (!channelId) return

  loadingInitial.value = true
  try {
    const response = await api.get(`/channels/${channelId}/messages`, {
      params: { limit: PAGE_SIZE },
    })
    if (channelId !== store.currentChannel?.id) return // medzitym sa zmenil kanal

    messages.value = response.data.map(mapMessage)
    hasMore.value = response.data.length === PAGE_SIZE

    await nextTick()
    const chatArea = document.getElementById('chat-area')
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  } finally {
    if (channelId === store.currentChannel?.id) loadingInitial.value = false
  }
}

// Dalsia stranka starsich sprav - vola q-infinite-scroll pri doscrollovani nahor
async function loadOlder(_index, done) {
  const channelId = store.currentChannel?.id
  const oldest = messages.value[0]
  if (!channelId || !oldest) {
    done()
    return
  }

  try {
    const response = await api.get(`/channels/${channelId}/messages`, {
      params: { limit: PAGE_SIZE, before: oldest.id },
    })
    if (channelId === store.currentChannel?.id) {
      messages.value.unshift(...response.data.map(mapMessage))
      hasMore.value = response.data.length === PAGE_SIZE
    }
  } catch (error) {
    console.error('Failed to fetch older messages:', error)
    hasMore.value = false // pri chybe neopakujeme poziadavku donekonecna
  }
  done()
}

// Socket
function joinAllChannels() {
  store.channels.forEach((ch) => {
    if (ch.id) socket.emit('joinChannel', ch.id)
  })
}

function onNewMessage(raw) {
  console.log('new:message prišlo', raw, 'aktuálny kanál:', store.currentChannel?.id)

  const msg = mapMessage(raw)

  // Zobrazovanie iba aktualnych kanalov
  if (Number(msg.channelId) === Number(store.currentChannel?.id)) addMessage(msg)

  maybeNotify(msg)
}

onMounted(() => {
  fetchMessages()
  socket.on('new:message', onNewMessage)
  socket.on('connect', joinAllChannels)
  if (socket.connected) joinAllChannels()
})

onUnmounted(() => {
  socket.off('new:message', onNewMessage)
  socket.off('connect', joinAllChannels)
})

// Menenie kanalov po pridani
watch(() => store.channels.map((c) => c.id), joinAllChannels, { immediate: true })

// Zmena kanala
watch(() => store.currentChannel?.id, fetchMessages)

// Odosielanie
async function sendMessage() {
  const text = newMessage.value.trim()
  if (!text) return

  if (text.startsWith('/')) {
    await handleCommand(text)
    newMessage.value = ''
    return
  }

  if (!store.currentChannel?.id) {
    $q.notify({ type: 'negative', message: 'Vyberte si kanál na posielanie správ.' })
    return
  }

  try {
    const response = await api.post(`/channels/${store.currentChannel.id}/messages`, {
      content: text,
    })
    newMessage.value = ''
    // správa príde aj cez socket, addMessage deduplikuje podľa id
    addMessage(mapMessage(response.data))
  } catch (error) {
    console.error('Failed to send message:', error)
    $q.notify({ type: 'negative', message: 'Správu sa nepodarilo odoslať.' })
  }
}

async function handleCommand(cmdText) {
  const args = cmdText.split(/\s+/)
  const command = args[0]
  const targetName = args[1]

  try {
    switch (command) {
      case '/join': {
        if (!targetName) throw new Error('Chýba názov kanála')
        if (args[2] && args[2] !== 'private') {
          throw new Error('Použitie: /join channelName [private]')
        }
        const message = await joinChannel(targetName, args[2] === 'private')
        $q.notify({ type: 'positive', message })
        break
      }
      case '/cancel':
      case '/quit': {
        const channelName = store.currentChannel?.name
        if (!channelName) throw new Error('Nie je vybraný žiadny kanál')
        const response = await api.post(`/channels/${command === '/quit' ? 'quit' : 'cancel'}`, {
          channelName,
        })
        removeChannel((c) => c.name === channelName)
        $q.notify({ type: 'warning', message: response.data?.message || 'Opustili ste kanál.' })
        break
      }
      case '/list':
        if (!store.currentChannel?.name) throw new Error('Nie je vybraný žiadny kanál')
        store.ui.rightDrawerOpen = true
        store.ui.membersRefresh++
        break
      case '/kick':
      case '/revoke':
      case '/invite': {
        if (!targetName) throw new Error('Chýba nick používateľa')
        const response = await api.post(`/channels/${command.slice(1)}`, {
          channelName: store.currentChannel.name,
          nickname: targetName,
        })
        store.ui.membersRefresh++ // zoznam clenov sa zmenil
        $q.notify({ type: 'positive', message: response.data?.message || 'Príkaz vykonaný.' })
        break
      }
      default:
        $q.notify({ type: 'negative', message: `Neznámy príkaz: ${command}` })
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || err.message || 'Chyba pri vykonávaní príkazu',
    })
  }
}

function simulateTyping() {
  // neskôr WebSocket eventy
}

function scrollToBottom() {
  setTimeout(() => {
    const chatArea = document.getElementById('chat-area')
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight
  }, 100)
}
</script>

<style scoped>
.border-top {
  border-top: 1px solid #e0e0e0;
}
</style>