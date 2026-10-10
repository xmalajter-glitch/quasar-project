<script setup lang="ts">
import { ref} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref(null)
const password = ref(null)

const showPassword = ref(false)

const emailRules = [(val) => !!val || 'Email is required']
const passwordRules = [(val) => !!val || 'Password is required']

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
      type="email"
      label="Email *"
      v-model="email"
      :rules="emailRules"
      lazy-rules
      autocomplete="email"
      hide-bottom-space
    />

    <q-input
      outlined
      v-model="password"
      label="Password *"
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

    <q-btn color="primary" label="Log in" type="submit" class="full-width" />
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>
