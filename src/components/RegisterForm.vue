<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const firstName = ref(null)
const lastName = ref(null)
const email = ref(null)
const nickname = ref(null)
const password = ref(null)
const passwordConfirm = ref(null)

const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const firstNameRules = [ (val) => !!val || "First name is required" ]
const lastNameRules = [ (val) => !!val || "Last name is required" ]
const nicknameRules = [ (val) => !!val || "Nickname is required" ]

const emailRules = [
  (val) => !!val || 'Email is required',

  (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Please enter a valid email address',
]

const passwordRules = [
  (val) => !!val || 'Password is required',

  (val) => !val || val.length >= 8 || 'Password must be at least 8 characters',

  (val) => !val || /\d/.test(val) || 'Password must contain at least one number',

  (val) =>
    !val || /[^a-zA-Z0-9\s]/.test(val) || 'Password must contain at least one special character',
]

const passwordMatch = [(val) => val == password.value || "Passwords don't match"]

const onSubmit = () => {
  document.cookie = 'auth_session=simulated; path=/; max-age=3600; SameSite=Lax'
  router.push({ name: 'home' })
}
</script>

<template>
  <q-form
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    novalidate
    class="q-gutter-y-sm form"
    @submit.prevent="onSubmit"
  >
    <q-input
      outlined
      type="text"
      label="first name*"
      v-model="firstName"
      autocomplete="given-name"
      :rules="firstNameRules"
      lazy-rules
      hide-bottom-space
    ></q-input>
    <q-input
      outlined
      type="text"
      label="last name*"
      v-model="lastName"
      :rules="lastNameRules"
      lazy-rules
      autocomplete="family-name"
      hide-bottom-space
    ></q-input>
    <q-input
      outlined
      type="text"
      label="nickname*"
      v-model="nickname"
      :rules="nicknameRules"
      lazy-rules
      autocomplete="nickname"
      hide-bottom-space
    ></q-input>
    <q-input
      outlined
      type="email"
      label="email*"
      v-model="email"
      :rules="emailRules"
      lazy-rules
      hide-bottom-space
    ></q-input>
    <q-input
      outlined
      v-model="password"
      label="password*"
      :rules="passwordRules"
      lazy-rules
      :type="showPassword ? 'text' : 'password'"
      hide-bottom-space
      autocomplete="new-password"
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
      label="confirm password*"
      :type="showPasswordConfirm ? 'text' : 'password'"
      :rules="passwordMatch"
      lazy-rules
      hide-bottom-space
      autocomplete="new-password"
    >
      <template #append>
        <q-icon
          :name="showPasswordConfirm ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="showPasswordConfirm = !showPasswordConfirm"
        />
      </template>
    </q-input>
    <q-btn color="primary" label="Create account" class="full-width" type="submit"></q-btn>
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>
