<template>
  <q-layout view="hHh LpR fFf">
    <!-- HLAVIČKA -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        
        <q-toolbar-title>
          <q-icon name="tag" v-if="currentChannel.type === 'public'" />
          <q-icon name="lock" v-else />
          {{ currentChannel.name }}
        </q-toolbar-title>

        <!-- Prepínač stavu používateľa -->
        <q-btn flat no-caps icon="account_circle" :label="currentUser.nick">
          <q-badge floating :color="statusColor" rounded />
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="setStatus('online')">
                <q-item-section avatar><q-icon color="positive" name="fiber_manual_record" /></q-item-section>
                <q-item-section>Online</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setStatus('dnd')">
                <q-item-section avatar><q-icon color="negative" name="remove_circle" /></q-item-section>
                <q-item-section>Do Not Disturb</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="setStatus('offline')">
                <q-item-section avatar><q-icon color="grey" name="radio_button_unchecked" /></q-item-section>
                <q-item-section>Offline</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup>
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>Odhlásiť sa</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- Tlačidlo pre zobrazenie členov kanála (simulácia /list) -->
        <q-btn dense flat round icon="people" @click="toggleRightDrawer">
          <q-tooltip>Členovia kanála (/list)</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- ĽAVÝ PANEL: Zoznam kanálov -->
    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered :width="250">
      <q-list>
        <q-item-label header>Kanály</q-item-label>
        
        <!-- Vykreslenie kanálov -->
        <q-item 
          v-for="channel in channels" 
          :key="channel.name"
          clickable 
          v-ripple
          :active="currentChannel.name === channel.name"
          active-class="bg-blue-1 text-primary text-bold"
          @click="currentChannel = channel"
        >
          <q-item-section avatar style="min-width: 30px;">
            <q-icon :name="channel.type === 'public' ? 'tag' : 'lock'" size="sm" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ channel.name }}</q-item-label>
          </q-item-section>
          
          <!-- Zvýraznenie pozvánky -->
          <q-item-section side v-if="channel.isInvite">
            <q-badge color="orange" label="Pozvánka" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- PRAVÝ PANEL: Zoznam používateľov v kanáli -->
    <q-drawer v-model="rightDrawerOpen" side="right" bordered :width="250">
      <q-list>
        <q-item-label header>Členovia (#{{ currentChannel.name }})</q-item-label>
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
            <q-icon :name="user.status === 'online' ? 'fiber_manual_record' : 'radio_button_unchecked'" 
                    :color="user.status === 'online' ? 'positive' : 'grey'" size="xs" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- HLAVNÝ OBSAH (Samotný čet prichádza z IndexPage.vue) -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function toggleRightDrawer () {
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
  { name: 'general', type: 'public', isInvite: false },
  { name: 'oznamy', type: 'public', isInvite: false },
  { name: 'tajny-projekt', type: 'private', isInvite: true }, // Topovaný/zvýraznený kanál
  { name: 'dev-team', type: 'private', isInvite: false }
])

const currentChannel = ref(channels.value[0])

const channelUsers = ref([
  { nick: 'FeroMaster', status: 'online', isAdmin: false },
  { nick: 'JanoAdmin', status: 'online', isAdmin: true },
  { nick: 'ZuzkaDND', status: 'dnd', isAdmin: false },
  { nick: 'MisoOffline', status: 'offline', isAdmin: false }
])
</script>
