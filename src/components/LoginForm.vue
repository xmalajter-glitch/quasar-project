<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

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
      v-model="email"
      outlined
      type="email"
      :label="t('login.email')"
      :rules="emailRules"
      lazy-rules
      autocomplete="email"
      hide-bottom-space
    />

    <q-input
      v-model="password"
      outlined
      :label="t('login.password')"
      :type="showPassword ? 'text' : 'password'"
      :rules="passwordRules"
      lazy-rules
      autocomplete="current-password"
      hide-bottom-space
    >
      <template #append>
        <q-icon
          :name="showPassword ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="showPassword = !showPassword"
        />
      </template>
    </q-input>

    <q-btn
      color="primary"
      :label="t('login.submit')"
      type="submit"
      class="full-width"
    />
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>
