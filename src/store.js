import { reactive } from 'vue'

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
  currentChannel: { name: '', type: 'public', isInvited: false },

  // Správy jednotlivych kanalov
  messages: {},

  presence: {},
})