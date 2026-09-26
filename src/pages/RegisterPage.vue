<template>
  <q-page class="flex flex-center">
    <div class="column items-center" style="width: 100%">
      <h1 class="text-h4">Create an account</h1>
      <RegisterForm></RegisterForm>
      <p class="q-mt-sm">
        Already have an account?
        <router-link to="/login">Log in</router-link>
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
//
import RegisterForm from '@/components/RegisterForm.vue';
</script>
