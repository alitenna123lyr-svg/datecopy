<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

const store = useSettingsStore()
const now = ref(new Date())
const toastMessage = ref('')
const showToast = ref(false)

let timer: number | null = null
let toastTimer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})

function showToastMessage(message: string) {
  toastMessage.value = message
  showToast.value = true
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = window.setTimeout(() => {
    showToast.value = false
  }, 1500)
}

async function copyDate() {
  try {
    await writeText(store.getFormattedDate())
    showToastMessage('日期已复制')
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

async function copyTime() {
  try {
    await writeText(store.getFormattedTime())
    showToastMessage('时间已复制')
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

async function copyAll() {
  try {
    await writeText(store.getFormattedDateTime())
    showToastMessage('日期时间已复制')
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}
</script>

<template>
  <div class="time-display">
    <div class="display-content">
      <div class="datetime-area">
        <span class="date clickable" @click="copyDate" title="点击复制日期">{{ store.getFormattedDate(now) }}</span>
        <span class="time clickable" @click="copyTime" title="点击复制时间">{{ store.getFormattedTime(now) }}</span>
      </div>
      <button class="copy-all-btn" @click="copyAll" title="复制全部">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>

    <!-- Toast 弹窗 -->
    <Transition name="toast">
      <div v-if="showToast" class="toast">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.time-display {
  position: relative;
  padding: var(--spacing-md) 0;
}

.display-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.datetime-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.date {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.time {
  font-size: 18px;
  font-weight: 400;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.clickable {
  cursor: pointer;
  padding: 2px 6px;
  margin: -2px -6px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.clickable:hover {
  background: var(--bg-secondary);
}

.clickable:active {
  transform: scale(0.98);
  background: var(--bg-tertiary);
}

.copy-all-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.copy-all-btn:hover {
  color: var(--accent);
}

.copy-all-btn:active {
  transform: scale(0.95);
}

/* Toast 弹窗样式 */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  z-index: 1000;
}

.toast svg {
  color: var(--success);
}

/* Toast 动画 */
.toast-enter-active {
  transition: all 0.2s ease-out;
}

.toast-leave-active {
  transition: all 0.15s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}
</style>
