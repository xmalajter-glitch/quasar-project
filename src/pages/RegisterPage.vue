<template>
  <q-page class="flex flex-center">
    <div class="column items-center" style="width: 100%">
      <h1 class="text-h4">{{ t('pages.register.title') }}</h1>

      <RegisterForm />

      <p class="q-mt-sm">
        {{ t('pages.register.hasAccount') }}
        <router-link to="/login">
          {{ t('pages.register.loginLink') }}
        </router-link>
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import RegisterForm from '@/components/RegisterForm.vue'

const { t } = useI18n()
</script>
