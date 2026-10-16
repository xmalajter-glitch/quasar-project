<template>
  <q-dialog v-model="open" @hide="reset">
    <q-card class="create-dialog">
      <q-card-section class="text-h6">
        {{ $t('channel.new') }}
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="name" outlined :label="$t('channel.name')" autofocus />

        <q-toggle v-model="isPrivate" :label="$t('channel.private')" class="q-mt-sm" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn :label="$t('channel.cancel')" v-close-popup />
        <q-btn
          :label="$t('channel.create')"
          color="primary"
          :disable="!canCreate"
          @click="createChannel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['create'])

const name = ref('')
const isPrivate = ref(false)

function createChannel() {
  if (!canCreate.value) return

  const channel = {
    name: name.value.trim(),
    isPrivate: isPrivate.value,
  }

  emit('create', channel)
  open.value = false
}

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
