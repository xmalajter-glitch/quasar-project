<template>
  <q-page class="flex flex-center">
    <div class="column items-center" style="width: 100%">
      <h1 class="text-h4">Vitajte späť!</h1>
      <LoginForm></LoginForm>
      <p class="q-mt-sm">
        Nemáte ešte účet?
        <router-link to="/register">Registrovať sa</router-link>
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue';
</script>
