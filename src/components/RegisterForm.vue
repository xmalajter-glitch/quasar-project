<script setup lang="ts">
import { ref } from 'vue'

const firstName = ref(null)
const lastName = ref(null)
const email = ref(null)
const username = ref(null)
const password = ref(null)
const passwordConfirm = ref(null)

const showPassword = ref(false)
const showPasswordConfirm = ref(false)

</script>

<template>
  <q-form
    autocorrect="off"
    autocapitalize="off"
    autocomplete="off"
    spellcheck="false"
    class="q-gutter-y-md form"
  >
    <q-input outlined type="text" label="first name*" v-model="firstName"></q-input>
    <q-input outlined type="text" label="last name*" v-model="lastName"></q-input>
    <q-input outlined type="email" label="email*" v-model="email"></q-input>
    <q-input outlined type="text" label="username*" v-model="username"></q-input>
    <q-input
      outlined
      v-model="password"
      label="password*"
      :type="showPassword ? 'text' : 'password'"
    >
      <template #append>
        <q-icon
          :name="showPassword ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="showPassword = !showPassword"
        />
      </template>
    </q-input>

    <q-input
      outlined
      v-model="passwordConfirm"
      label="password confirm*"
      :type="showPasswordConfirm ? 'text' : 'password'"
    >
      <template #append>
        <q-icon
          :name="showPasswordConfirm ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="showPasswordConfirm = !showPasswordConfirm"
        />
      </template>
    </q-input>
    <q-btn color="primary" label="Create account" class="full-width"></q-btn>
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>
