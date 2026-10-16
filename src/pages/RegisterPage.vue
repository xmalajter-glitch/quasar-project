<template>
  <q-page class="flex flex-center">
    <div class="column items-center" style="width: 100%">
      <h1 class="text-h4">Registrácia</h1>
      <RegisterForm></RegisterForm>
      <p class="q-mt-sm">
        Máte už účet?
        <router-link to="/login">Prihlásiť sa</router-link>
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RegisterForm from '@/components/RegisterForm.vue';
</script>
