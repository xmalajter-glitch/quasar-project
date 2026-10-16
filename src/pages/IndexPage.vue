<template>
  <q-page class="flex column" style="height: calc(100vh - 50px);">
    <div class="q-pa-md col overflow-auto" id="chat-area">

      <q-chat-message
        v-for="msg in messages"
        :key="msg.id"
        :name="msg.sender"
        :text="[msg.text]"
        :sent="msg.sender === store.currentUser.nick"
        :bg-color="msg.isMention ? 'amber-3' : (msg.sender === store.currentUser.nick ? 'blue-2' : 'grey-2')"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { store } from '../store.js'

const $q = useQuasar()

const newMessage = ref('')
const typingUser = ref('')
const showLiveText = ref(false)

// Vybratie sprav podla daneho kanalu
const messages = computed(() => {
  const channelName = store.currentChannel.name
  if (!store.messages[channelName]) {
    store.messages[channelName] = []
  }
  return store.messages[channelName]
})

// Scrollovanie najnovsich sprav
onMounted(() => {
  scrollToBottom()
})

watch(() => store.currentChannel.name, () => {
  scrollToBottom()
})
// ------------------------------------------------

function sendMessage() {
  const text = newMessage.value.trim()
  if (!text) return

  // Detekcia príkazov z "príkazového riadku"
  if (text.startsWith('/')) {
    handleCommand(text)
    newMessage.value = ''
    return
  }

  // Odoslanie beznej spravy
  const isMention = text.includes('@')
  const currentChannelName = store.currentChannel.name
  
  // Pridanie spravy do aktualneho kanalu
  store.messages[currentChannelName].push({
    id: Date.now(),
    sender: store.currentUser.nick,
    text: text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMention: isMention
  })

  newMessage.value = ''
  scrollToBottom()
}

function handleCommand(cmdText) {
  const args = cmdText.split(' ')
  const command = args[0]

  switch(command) {
    case '/join':
      store.channels.push({ name: args[1] || 'novy-kanal', type: 'public', isInvited: false })
      $q.notify({ type: 'positive', message: `Pripojili ste sa do kanála: ${args[1] || 'neznámy'}` })
      break;
    case '/cancel':
    case '/quit': {// Opustenie kanala cez prikazovy riadok
      const idx = store.channels.findIndex(c => c.name === store.currentChannel.name)
      if (idx !== -1) store.channels.splice(idx, 1)
      if (store.channels.length > 0) store.currentChannel = store.channels[0]
      $q.notify({ type: 'warning', message: 'Opustili ste kanál.' })
      break;
    }
    case '/list':
      $q.notify({ type: 'info', message: 'Otvorí sa panel používateľov (pozri vpravo hore ikonu).' })
      break;
    case '/kick':
      $q.notify({ type: 'warning', message: `Hlasovali ste za vyhodenie používateľa ${args[1]}.` })
      break;
    case '/invite':
      $q.notify({ type: 'positive', message: `Pozvánka pre ${args[1]} bola odoslaná.` })
      break;
    default:
      $q.notify({ type: 'negative', message: `Neznámy príkaz: ${command}` })
  }
}

// Simulacia notifikacie s podmienkou app visibility a statusu
setInterval(() => {
  // Rezim nerusit
  if ($q.appVisible || store.currentUser.status === 'dnd') return;
  
  const isPingedMessage = Math.random() > 0.5 
  
  // Notifikacia urcena len pre uzivtela
  if (store.settings.notifyOnlyMentions && !isPingedMessage) return;

  $q.notify({
    message: 'JanoAdmin',
    caption: isPingedMessage ? `@${store.currentUser.nick} Máš to hotové?` : 'Ahojte, pridal som novú funkciu.',
    color: isPingedMessage ? 'orange' : 'primary',
    icon: 'message',
    position: 'bottom-right'
  })
}, 15000)

// Simulacia pisania ineho uzivatela
setInterval(() => {
  if (Math.random() > 0.2) {
    typingUser.value = 'ZuzkaDND'
    setTimeout(() => { typingUser.value = '' }, 4000)
  }
}, 6000)

function simulateTyping() {
  // Tu by sa odosielala info cez websocket na server
}

function scrollToBottom() {
  setTimeout(() => {
    const chatArea = document.getElementById('chat-area')
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight
  }, 50)
}
</script>

<style scoped>
.border-top {
  border-top: 1px solid #e0e0e0;
}
</style>
