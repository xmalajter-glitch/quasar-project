<template>
  <q-page class="flex flex-center">
    <div class="column items-center" style="width: 100%">
      <h1 class="text-h4">{{ t('pages.login.title') }}</h1>

      <LoginForm />

      <p class="q-mt-sm">
        {{ t('pages.login.noAccount') }}
        <router-link to="/register">
          {{ t('pages.login.registerLink') }}
        </router-link>
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LoginForm from '@/components/LoginForm.vue'

const { t } = useI18n()
</script>
