import { reactive } from 'vue'

// Funkcia pre generovanie sprav na infinity scrollovanie
function generateDummyMessages(count) {
  const msgs = []
  for (let i = 1; i <= count; i++) {
    msgs.push({
      id: i,
      sender: i % 2 === 0 ? 'ZuzkaDND' : 'JanoAdmin',
      text: `Toto je testovacia správa číslo ${i} pre testovanie scrollovania chatu.`,
      time: `10:${i < 10 ? '0' + i : (i % 60 < 10 ? '0' + (i % 60) : i % 60)}`,
      isMention: false 
    })
  }
  
  // Pridanie oznacenej spravy na koniec zoznamu
  msgs.push({
    id: count + 1,
    sender: 'ZuzkaDND',
    text: '@FeroMaster pomôžeš mi s týmto nekonečným scrollovaním?',
    time: '11:00',
    isMention: true
  })
  
  return msgs
}

export const store = reactive({
  // Aktualny prihlaseny pouzivatel
  currentUser: { nick: 'FeroMaster', status: 'online' },

  // Nastavenia pouzivatelov
  settings: {
    notifyOnlyMentions: false
  },

  // Zoznam kanalov
  channels: [
    { name: 'general', type: 'public', isInvited: false },
    { name: 'oznamy', type: 'public', isInvited: false },
    { name: 'tajny-projekt', type: 'private', isInvited: true }, // Pozvánka
    { name: 'dev-team', type: 'private', isInvited: false }
  ],
  
  currentChannel: { name: 'general', type: 'public', isInvited: false },

  // Spravy kanalov
  messages: {
    'general': generateDummyMessages(50) // Tu vygenerujeme 50 správ do general kanála
  }
})
