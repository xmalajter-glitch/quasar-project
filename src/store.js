import { reactive } from 'vue'

// Toto je náš centrálny stav aplikácie
export const store = reactive({
  currentChannel: { name: 'general', type: 'public' }, // Predvolený kanál
  
  // Zoznam správ pre jednotlivé kanály
  messages: {
    'general': [
      { id: 1, sender: 'JanoAdmin', text: 'Vitajte v kanáli general!', time: '10:00' },
      { id: 2, sender: 'ZuzkaDND', text: 'Ahoj, potrebujem pomôcť s tým zadaním.', time: '10:02' }
    ],
    'oznamy': [
      { id: 1, sender: 'JanoAdmin', text: 'Dnes o 15:00 bude údržba servera.', time: '08:00' }
    ],
    'tajny-projekt': [
      { id: 1, sender: 'FeroMaster', text: 'Tajný projekt, nikomu o tomto nehovorte.', time: '11:00' }
    ]
  }
})
