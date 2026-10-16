<template>
  <q-form @submit="onSubmit" class="q-mt-md" style="width: 300px; max-width: 90vw;">
    <q-input 
      v-model="meno" 
      label="Meno a Priezvisko" 
      outlined 
      dense 
      lazy-rules
      :rules="[val => !!val || 'Meno je povinné']" 
      class="q-mb-md" 
    />
    <q-input 
      v-model="nick" 
      label="Prezývka" 
      outlined 
      dense 
      lazy-rules
      :rules="[val => !!val || 'NickName je povinný']" 
      class="q-mb-md" 
    />
    <q-input 
      v-model="email" 
      label="Email" 
      type="email" 
      outlined 
      dense 
      lazy-rules
      :rules="[
        val => !!val || 'Email je povinný', 
        val => /.+@.+\..+/.test(val) || 'Neplatný formát emailu'
      ]" 
      class="q-mb-md" 
    />
    <q-input 
      v-model="password" 
      type="password" 
      label="Heslo" 
      outlined 
      dense 
      lazy-rules
      :rules="[
        val => val && val.length >= 6 || 'Heslo musí mať aspoň 6 znakov'
      ]" 
      class="q-mb-md" 
    />
    <q-btn type="submit" color="secondary" label="Vytvoriť účet" class="full-width" />
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const meno = ref('')
const nick = ref('')
const email = ref('')
const password = ref('')

function onSubmit() {
  document.cookie = 'auth_session=true; path=/; SameSite=Lax';
  router.push({ name: 'home' })
}
</script>
