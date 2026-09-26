<template>
  <q-page class="flex flex-center">
    <div class="column items-center" style="width: 100%">
      <h1 class="text-h4">Welcome back!</h1>
      <LoginForm></LoginForm>
      <p class="q-mt-sm">
        Need an account?
        <router-link to="/register">Register</router-link>
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue';
</script>
