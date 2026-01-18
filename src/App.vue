<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from './stores/settings'
import TitleBar from './components/TitleBar.vue'
import TimeDisplay from './components/TimeDisplay.vue'
import TimerReminder from './components/TimerReminder.vue'
import Settings from './components/Settings.vue'

const store = useSettingsStore()
const showSettings = ref(false)

// 当前注册的快捷键
const registeredShortcuts = ref<string[]>([])

async function registerShortcuts() {
  // 先注销所有已注册的快捷键
  for (const shortcut of registeredShortcuts.value) {
    try {
      await unregister(shortcut)
    } catch (e) {
      // 忽略注销错误
    }
  }
  registeredShortcuts.value = []

  // 注册新快捷键
  try {
    const { copyDate, copyTime, copyDateTime } = store.shortcuts

    await register(copyDate, async () => {
      await invoke('copy_and_paste', { text: store.getFormattedDate() })
    })
    registeredShortcuts.value.push(copyDate)

    await register(copyTime, async () => {
      await invoke('copy_and_paste', { text: store.getFormattedTime() })
    })
    registeredShortcuts.value.push(copyTime)

    await register(copyDateTime, async () => {
      await invoke('copy_and_paste', { text: store.getFormattedDateTime() })
    })
    registeredShortcuts.value.push(copyDateTime)
  } catch (e) {
    console.error('Failed to register shortcuts:', e)
  }
}

async function unregisterShortcuts() {
  for (const shortcut of registeredShortcuts.value) {
    try {
      await unregister(shortcut)
    } catch (e) {
      console.error('Failed to unregister shortcut:', shortcut, e)
    }
  }
  registeredShortcuts.value = []
}

// 监听快捷键变化，重新注册
watch(() => store.shortcuts, () => {
  registerShortcuts()
}, { deep: true })

onMounted(() => {
  registerShortcuts()
})

onUnmounted(() => {
  unregisterShortcuts()
})
</script>

<template>
  <TitleBar @open-settings="showSettings = true" />

  <main class="main-content">
    <TimeDisplay />
    <TimerReminder />
  </main>

  <Transition name="slide-right">
    <Settings v-if="showSettings" @close="showSettings = false" />
  </Transition>
</template>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  padding-top: 0;
  overflow-y: auto;
}
</style>
