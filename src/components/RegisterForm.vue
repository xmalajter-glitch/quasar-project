<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const nickname = ref('')
const password = ref('')
const passwordConfirm = ref('')

const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const firstNameRules = [
  (val) => !!val || t('validation.firstNameRequired'),
]
const lastNameRules = [
  (val) => !!val || t('validation.lastNameRequired'),
]
const nicknameRules = [
  (val) => !!val || t('validation.nicknameRequired'),
]

const emailRules = [
  (val) => !!val || t('validation.emailRequired'),
  (val) =>
    !val ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
    t('validation.emailInvalid'),
]

const passwordRules = [
  (val) => !!val || t('validation.passwordRequired'),
  (val) =>
    !val || val.length >= 8 || t('validation.passwordMin'),
  (val) =>
    !val || /\d/.test(val) || t('validation.passwordNumber'),
  (val) =>
    !val ||
    /[^a-zA-Z0-9\s]/.test(val) ||
    t('validation.passwordSpecial'),
]

const passwordMatch = [
  (val) =>
    val === password.value || t('validation.passwordMatch'),
]

const onSubmit = () => {
  document.cookie =
    'auth_session=simulated; path=/; max-age=3600; SameSite=Lax'
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
      v-model="firstName"
      outlined
      type="text"
      :label="t('register.firstName')"
      :rules="firstNameRules"
      lazy-rules
      autocomplete="given-name"
      hide-bottom-space
    />

    <q-input
      v-model="lastName"
      outlined
      type="text"
      :label="t('register.lastName')"
      :rules="lastNameRules"
      lazy-rules
      autocomplete="family-name"
      hide-bottom-space
    />

    <q-input
      v-model="nickname"
      outlined
      type="text"
      :label="t('register.nickname')"
      :rules="nicknameRules"
      lazy-rules
      autocomplete="nickname"
      hide-bottom-space
    />

    <q-input
      v-model="email"
      outlined
      type="email"
      :label="t('register.email')"
      :rules="emailRules"
      lazy-rules
      autocomplete="email"
      hide-bottom-space
    />

    <q-input
      v-model="password"
      outlined
      :label="t('register.password')"
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
      v-model="passwordConfirm"
      outlined
      :label="t('register.confirmPassword')"
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

    <q-btn
      color="primary"
      :label="t('register.submit')"
      class="full-width"
      type="submit"
    />
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>
