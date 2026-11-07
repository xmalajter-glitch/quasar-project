<template>
  <q-page class="flex column" style="height: calc(100vh - 50px);">
    <div class="q-pa-md col overflow-auto" id="chat-area">
      <q-chat-message
        v-for="msg in messages"
        :key="msg.id"
        :name="msg.sender"
        :text="[msg.text]"
        :sent="msg.sender === authStore.user?.nickname"
        :bg-color="msg.isMention ? 'amber-3' : (msg.sender === authStore.user?.nickname ? 'blue-2' : 'grey-2')"
        :stamp="msg.time"
      />
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
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { store } from '../store.js'
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
const fetchMessages = async () => {
  if (!store.currentChannel?.id) return
  try {
    const response = await api.get(`/channels/${store.currentChannel.id}/messages`)
    messages.value = response.data.map(mapMessage)
    scrollToBottom()
  } catch (error) {
    console.error('Failed to fetch messages:', error)
  }
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
  const args = cmdText.split(' ')
  const command = args[0]
  const targetName = args[1]

  try {
    switch (command) {
      case '/join':
        if (!targetName) throw new Error('Chýba názov kanála')
        $q.notify({ type: 'info', message: `Prebieha pripájanie k ${targetName}...` })
        break
      case '/cancel':
      case '/quit':
        if (!store.currentChannel?.name) return
        await api.post(`/channels/${command === '/quit' ? 'quit' : 'cancel'}`, {
          channelName: store.currentChannel.name,
        })
        $q.notify({ type: 'warning', message: 'Opustili ste kanál.' })
        break
      case '/list':
        $q.notify({ type: 'info', message: 'Otvorí sa panel používateľov.' })
        break
      case '/kick':
        if (!targetName) throw new Error('Chýba nick používateľa')
        await api.post('/channels/kick', {
          channelName: store.currentChannel.name,
          nickname: targetName,
        })
        $q.notify({ type: 'positive', message: `Hlasovali ste za vyhodenie ${targetName}.` })
        break
      case '/invite':
        if (!targetName) throw new Error('Chýba nick používateľa')
        await api.post('/channels/invite', {
          channelName: store.currentChannel.name,
          nickname: targetName,
        })
        $q.notify({ type: 'positive', message: `Pozvánka pre ${targetName} odoslaná.` })
        break
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