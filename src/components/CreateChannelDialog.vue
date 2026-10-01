<template>
  <q-dialog v-model="open" @hide="reset">
    <q-card class="create-dialog">
      <q-card-section class="text-h6">New channel</q-card-section>
      <q-card-section class="q-pt-none">
        <q-input outlined v-model="name" label="Name" autofocus />
        <q-toggle v-model="isPrivate" label="Private?" class="q-mt-sm" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Cancel" v-close-popup />
        <q-btn label="Create" color="primary" :disable="!canCreate" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const open = defineModel({ type: Boolean, default: false })

const name = ref('')
const isPrivate = ref(false)

const canCreate = computed(() => {
  const trimmed = name.value.trim()
  return trimmed !== ''
})

function reset() {
  name.value = ''
  isPrivate.value = false
}
</script>

<style scoped>
.create-dialog {
  width: min(90vw, 400px);
  max-height: 90dvh;
}
</style>
