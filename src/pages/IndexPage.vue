<template>
  <q-page class="flex column" style="height: calc(100vh - 50px);">
    <!-- Olasť pre správy s fixnou výškou a scrollovaním -->
    <div class="q-pa-md col overflow-auto" id="chat-area">
      <!-- Simulácia histórie -->
      <div class="text-center q-mb-md">
        <q-btn outline color="primary" label="Načítať históriu (Infinite Scroll)" size="sm" />
      </div>

      <q-chat-message
        v-for="msg in messages"
        :key="msg.id"
        :name="msg.sender"
        :text="[msg.text]"
        :sent="msg.sender === 'FeroMaster'"
        :bg-color="msg.isMention ? 'amber-3' : (msg.sender === 'FeroMaster' ? 'blue-2' : 'grey-2')"
        :stamp="msg.time"
      />
    </div>

    <!-- Fixný príkazový riadok na spodku -->
    <div class="q-pa-sm border-top">
      <!-- Informácia o tom, kto práve píše (Live preview) -->
      <div v-if="typingUser" class="text-caption q-mb-xs q-px-sm">
        <q-icon name="edit" /> <em>{{ typingUser }} is typing...</em>
        <span class="text-primary cursor-pointer q-ml-sm" @click="showLiveText = true">(Zobraziť live text)</span>
      </div>

      <q-input
        v-model="newMessage"
        outlined
        dense
        placeholder="Napíšte správu alebo použite príkaz (napr. /join, /kick, /list, @nickname)..."
        @keyup.enter="sendMessage"
        @update:model-value="simulateTyping"
      >
        <template #append>
          <q-btn round dense flat icon="send" color="primary" @click="sendMessage" />
        </template>
      </q-input>
    </div>

    <!-- Dialog pre "Live" sledovanie rozpísaného textu (špecialitka zo zadania) -->
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
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const newMessage = ref('')
const typingUser = ref('')
const showLiveText = ref(false)

// Spravy v chate
const messages = ref([
  { id: 1, sender: 'JanoAdmin', text: 'Vitajte v kanáli general!', time: '10:00' },
  { id: 2, sender: 'ZuzkaDND', text: 'Ahoj, potrebujem pomôcť s tým zadaním.', time: '10:02' },
  { id: 3, sender: 'JanoAdmin', text: '@FeroMaster Pozri sa na to prosím ťa.', time: '10:05', isMention: true },
  { id: 4, sender: 'FeroMaster', text: 'Jasné, už na tom robím.', time: '10:06' }
])

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
  messages.value.push({
    id: Date.now(),
    sender: 'FeroMaster',
    text: text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMention: isMention // Tu priradíme vypočítanú premennú
  })

  newMessage.value = ''
  scrollToBottom()
}

function handleCommand(cmdText) {
  // Rozdelenie na príkaz a argumenty (napr. z "/join tajny" vznikne ['/join', 'tajny'])
  const args = cmdText.split(' ')
  const command = args[0]

  // Simulacia roznych prikazov cez Quasar oznamy
  switch(command) {
    case '/join':
      $q.notify({ type: 'positive', message: `Pripojili ste sa do kanála: ${args[1] || 'neznámy'}` })
      break;
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

// Simulacia notifikacie s podmienkou app visiblity
setInterval(() => {
  if (!$q.appVisible) {
    $q.notify({
      message: 'JanoAdmin: "@FeroMaster Máš to hotové?"',
      color: 'primary',
      icon: 'message',
      position: 'bottom-right',
      actions: [{ label: 'Odpovedať', color: 'white' }]
    })
  }
}, 15000)

// Simulacia pisania ineho uzivatela
setInterval(() => {
  if (Math.random() > 0.7) {
    typingUser.value = 'ZuzkaDND'
    setTimeout(() => { typingUser.value = '' }, 4000)
  }
}, 15000)

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
