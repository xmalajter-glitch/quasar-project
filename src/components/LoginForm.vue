<script setup lang="ts">
import { ref } from 'vue';

const email = ref(null);
const password = ref(null);

const showPassword = ref(false);
</script>

<template>
  <q-form
    autocorrect="off"
    autocapitalize="off"
    autocomplete="off"
    spellcheck="false"
    class="q-gutter-y-md form"
  >
    <q-input outlined type="text" label="email*" v-model="email"></q-input>
    <q-input
      outlined
      v-model="password"
      label="password*"
      :type="showPassword ? 'text' : 'password'"
    >
      <template #append>
        <q-icon
          :name="showPassword ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="showPassword = !showPassword"
        />
      </template>
    </q-input>
    <q-btn color="primary" label="Log in" class="full-width"></q-btn>
  </q-form>
</template>

<style scoped>
.form {
  width: min(400px, calc(100% - 32px));
}
</style>
