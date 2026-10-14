<template>
  <CreateChannelDialog v-model="createDialog" @create="handleAddChannel" />
  
  <q-layout view="hHh LpR fFf">
    
    //Hlavicka
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-icon name="tag" v-if="store.currentChannel.type === 'public'" />
          <q-icon name="lock" v-else />
          {{ store.currentChannel.name }}
        </q-toolbar-title>

        //Prepinanie stavu pouzivatela
        <q-btn
          flat
          no-caps
          icon="account_circle"
          :label="currentUser.nick"
          style="margin-right: 4px"
        >
          <q-badge floating :color="statusColor" rounded />
          <q-menu>
            <q-list style="min-width: 150px">
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
                <q-item-section>Do Not Disturb</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setStatus('offline')">
                <q-item-section avatar>
                  <q-icon color="grey" name="radio_button_unchecked" />
                </q-item-section>
                <q-item-section>Offline</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Odhlásiť sa</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        // Zobrazenie jednotlivych clenov kanala
        <q-btn dense flat round icon="people" @click="toggleRightDrawer">
          <q-tooltip>Členovia kanála (/list)</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    // Zoznam kanalov
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
        
        // Vykreslenie kanalov
        <q-item
          v-for="channel in channels"
          :key="channel.name"
          clickable
          v-ripple
          :active="store.currentChannel.name === channel.name"
          active-class="bg-blue-1 text-primary text-bold"
          @click="selectChannel(channel)"
        >
          <q-item-section avatar style="min-width: 30px">
            <q-icon :name="channel.type === 'public' ? 'tag' : 'lock'" size="sm" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>

          // Pozvanka
          <q-item-section side v-if="channel.isInvited">
            <q-badge color="orange" label="Pozvánka" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    // Zoznam pouzivatelov v danom kanali
    <q-drawer v-model="rightDrawerOpen" side="right" bordered :width="250">
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
              :name="user.status === 'online' ? 'fiber_manual_record' : 'radio_button_unchecked'"
              :color="user.status === 'online' ? 'positive' : 'grey'"
              size="xs"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    // Hlavny obsah, prichadza zo store.js
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store.js'
import CreateChannelDialog from '@/components/CreateChannelDialog.vue'

const router = useRouter()

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

// Dummy dáta pre prototyp
const currentUser = ref({ nick: 'FeroMaster', status: 'online' })

const statusColor = computed(() => {
  if (currentUser.value.status === 'online') return 'positive'
  if (currentUser.value.status === 'dnd') return 'negative'
  return 'grey'
})

function setStatus(status) {
  currentUser.value.status = status
}

// Zoznam kanálov (simulácia toho, čo používateľ vidí)
const channels = ref([
  { name: 'general', type: 'public', isInvited: false },
  { name: 'oznamy', type: 'public', isInvited: false },
  { name: 'tajny-projekt', type: 'private', isInvited: true }, // Topovaný/zvýraznený kanál
  { name: 'dev-team', type: 'private', isInvited: false },
])

// Vyber kanala
function selectChannel(channel) {
  store.currentChannel = channel
}

const channelUsers = ref([
  { nick: 'FeroMaster', status: 'online', isAdmin: false },
  { nick: 'JanoAdmin', status: 'online', isAdmin: true },
  { nick: 'ZuzkaDND', status: 'dnd', isAdmin: false },
  { nick: 'MisoOffline', status: 'offline', isAdmin: false },
])

const createDialog = ref(false)

function logout() {
  document.cookie = 'auth_session=; path=/; max-age=0; SameSite=Lax'
  router.push({ name: 'login' })
}

function handleAddChannel(channel) {
  channels.value.push(
    { name: channel.name, type: channel.isPrivate ? 'private' : 'public', isInvited: false }
  )
}
</script>
