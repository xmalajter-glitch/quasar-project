<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const nickname = ref('')
const password = ref('')
const passwordConfirm = ref('')

const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const isLoading = ref(false)

const firstNameRules = [
  (val) => !!val || t('validation.firstNameRequired'),
]
const lastNameRules = [
  (val) => !!val || t('validation.lastNameRequired'),
]
// Rovnake pravidla ako na backende (backend/app/validators/user.ts)
const nicknameRules = [
  (val) => !!val || t('validation.nicknameRequired'),
  (val) => !val || (val.length >= 2 && val.length <= 32) || t('validation.nicknameLength'),
  (val) => !val || /^[a-zA-Z0-9_]+$/.test(val) || t('validation.nicknameFormat'),
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

// Chyby z backendu (422) pre jednotlive polia, napr. obsadeny nickname alebo email
const serverErrors = ref({})
const serverFieldMap = {
  name: 'firstName',
  surname: 'lastName',
  nickname: 'nickname',
  email: 'email',
  password: 'password',
  passwordConfirmation: 'passwordConfirm',
}

// Po uprave pola jeho chybu zo servera zmazeme
const fields = { firstName, lastName, nickname, email, password, passwordConfirm }
Object.entries(fields).forEach(([key, field]) => {
  watch(field, () => {
    if (serverErrors.value[key]) delete serverErrors.value[key]
  })
})

// undefined = pouziju sa lokalne :rules, inak sa zobrazi chyba zo servera
const fieldError = (key) => (serverErrors.value[key] ? true : undefined)

const onSubmit = async () => {
  if (isLoading.value) return
  isLoading.value = true
  serverErrors.value = {}

  try {
    await authStore.register({
      name: firstName.value,
      surname: lastName.value,
      nickname: nickname.value,
      email: email.value,
      password: password.value,
      passwordConfirmation: passwordConfirm.value,
    })
    
    $q.notify({ type: 'positive', message: t('register.success') })
    router.push({ name: 'home' })
  } catch (error) {
    const fieldErrors = error.response?.data?.errors
    if (error.response?.status === 422 && Array.isArray(fieldErrors)) {
      const mapped = {}
      for (const e of fieldErrors) {
        const key = serverFieldMap[e.field]
        if (key && !mapped[key]) mapped[key] = e.message
      }
      serverErrors.value = mapped
    } else {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || t('register.failed'),
      })
    }
  } finally {
    isLoading.value = false
  }
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
      :error="fieldError('firstName')"
      :error-message="serverErrors.firstName"
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
      :error="fieldError('lastName')"
      :error-message="serverErrors.lastName"
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
      :error="fieldError('nickname')"
      :error-message="serverErrors.nickname"
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
      :error="fieldError('email')"
      :error-message="serverErrors.email"
      lazy-rules
      autocomplete="email"
      hide-bottom-space
    />

    <q-input
      v-model="password"
      outlined
      :label="t('register.password')"
      :rules="passwordRules"
      :error="fieldError('password')"
      :error-message="serverErrors.password"
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
      :error="fieldError('passwordConfirm')"
      :error-message="serverErrors.passwordConfirm"
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
      :loading="isLoading"
    />
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>