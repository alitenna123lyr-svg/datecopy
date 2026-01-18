<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'
import { timezones } from '../utils/dateFormat'
import FormatSelect from './FormatSelect.vue'

const emit = defineEmits<{
  close: []
}>()

const store = useSettingsStore()
const autoStartEnabled = ref(false)
const showTimezoneDropdown = ref(false)

// 快捷键编辑
type ShortcutKey = 'copyDate' | 'copyTime' | 'copyDateTime'
const editingShortcut = ref<ShortcutKey | null>(null)
const tempShortcut = ref('')
const pressedKeys = ref<Set<string>>(new Set())

const shortcutLabels: Record<ShortcutKey, string> = {
  copyDate: '复制日期',
  copyTime: '复制时间',
  copyDateTime: '复制全部'
}

function startEditShortcut(key: ShortcutKey) {
  editingShortcut.value = key
  tempShortcut.value = ''
  pressedKeys.value.clear()
}

function handleKeyDown(e: KeyboardEvent) {
  if (!editingShortcut.value) return
  e.preventDefault()

  const key = e.key
  const modifiers: string[] = []

  if (e.ctrlKey) modifiers.push('Ctrl')
  if (e.shiftKey) modifiers.push('Shift')
  if (e.altKey) modifiers.push('Alt')

  // 获取实际按键（排除修饰键本身）
  let mainKey = ''
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    mainKey = key.length === 1 ? key.toUpperCase() : key
  }

  if (modifiers.length > 0 && mainKey) {
    tempShortcut.value = [...modifiers, mainKey].join('+')
  }
}

function handleKeyUp() {
  if (!editingShortcut.value) return

  // 如果有有效的快捷键组合，保存它
  if (tempShortcut.value && editingShortcut.value) {
    store.setShortcut(editingShortcut.value, tempShortcut.value)
    editingShortcut.value = null
    tempShortcut.value = ''
  }
}

function cancelEdit() {
  editingShortcut.value = null
  tempShortcut.value = ''
}

onMounted(async () => {
  try {
    autoStartEnabled.value = await isEnabled()
  } catch (e) {
    console.error('Failed to check autostart status:', e)
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

async function toggleAutoStart() {
  try {
    if (autoStartEnabled.value) {
      await disable()
      autoStartEnabled.value = false
    } else {
      await enable()
      autoStartEnabled.value = true
    }
  } catch (e) {
    console.error('Failed to toggle autostart:', e)
  }
}

function selectTimezone(id: string) {
  store.setTimezone(id)
  showTimezoneDropdown.value = false
}
</script>

<template>
  <div class="settings">
    <div class="settings-header">
      <button class="back-btn" @click="emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h2 class="settings-title">设置</h2>
      <div class="spacer"></div>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h3 class="section-title">时区</h3>
        <div class="timezone-wrapper">
          <div class="timezone-select" @click="showTimezoneDropdown = !showTimezoneDropdown">
            <span class="item-label">当前时区</span>
            <div class="timezone-value">
              <span>{{ store.currentTimezone.label }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rotated: showTimezoneDropdown }">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          <div v-if="showTimezoneDropdown" class="timezone-dropdown">
            <div
              v-for="tz in timezones"
              :key="tz.id"
              class="dropdown-item"
              :class="{ active: tz.id === store.timezoneId }"
              @click.stop="selectTimezone(tz.id)"
            >
              <span>{{ tz.label }}</span>
              <svg v-if="tz.id === store.timezoneId" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">日期时间格式</h3>
        <div class="section-items">
          <FormatSelect type="date" label="日期格式" />
          <FormatSelect type="time" label="时间格式" />
          <FormatSelect type="datetime" label="完整格式" />
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">快捷键</h3>
        <div class="section-items">
          <div class="setting-item" @click="startEditShortcut('copyDate')">
            <span class="item-label">复制日期</span>
            <span class="item-value shortcut">{{ store.shortcuts.copyDate }}</span>
          </div>
          <div class="setting-item" @click="startEditShortcut('copyTime')">
            <span class="item-label">复制时间</span>
            <span class="item-value shortcut">{{ store.shortcuts.copyTime }}</span>
          </div>
          <div class="setting-item" @click="startEditShortcut('copyDateTime')">
            <span class="item-label">复制全部</span>
            <span class="item-value shortcut">{{ store.shortcuts.copyDateTime }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷键编辑弹窗 -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="editingShortcut" class="shortcut-modal" @click="cancelEdit">
            <div class="shortcut-dialog" @click.stop>
              <h3>设置快捷键</h3>
              <p class="shortcut-hint">{{ shortcutLabels[editingShortcut] }}</p>
              <div class="shortcut-input">
                {{ tempShortcut || '请按下快捷键组合...' }}
              </div>
              <p class="shortcut-tip">按下组合键后自动保存，点击外部取消</p>
            </div>
          </div>
        </Transition>
      </Teleport>

      <div class="settings-section">
        <h3 class="section-title">通用</h3>
        <div class="section-items">
          <div class="setting-item" @click="toggleAutoStart">
            <span class="item-label">开机自启动</span>
            <div class="toggle" :class="{ active: autoStartEnabled }">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <p class="version">DateCopy v1.0.0</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
  position: absolute;
  inset: 0;
  background: var(--bg-solid);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.settings-header {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--divider);
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.back-btn:hover {
  background: var(--bg-secondary);
}

.settings-title {
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.spacer {
  width: 32px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.settings-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-sm);
  padding-left: var(--spacing-xs);
}

.section-items {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

.section-items > :deep(*) {
  border-bottom: 1px solid var(--divider);
}

.section-items > :deep(*:last-child) {
  border-bottom: none;
}

.timezone-wrapper {
  position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.setting-item, .timezone-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.timezone-select {
  border-radius: var(--radius-md);
}

.setting-item:hover, .timezone-select:hover {
  background: var(--bg-tertiary);
}

.item-label {
  font-size: 14px;
  color: var(--text-primary);
}

.item-value {
  font-size: 14px;
  color: var(--text-secondary);
}

.item-value.shortcut {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
}

.timezone-value {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 14px;
}

.timezone-value svg {
  transition: transform var(--transition-fast);
}

.timezone-value svg.rotated {
  transform: rotate(180deg);
}

.timezone-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-solid);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--divider);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item.active {
  background: var(--bg-tertiary);
}

.dropdown-item svg {
  color: var(--accent);
}

.toggle {
  width: 44px;
  height: 26px;
  background: var(--text-tertiary);
  border-radius: var(--radius-full);
  position: relative;
  transition: background var(--transition-fast);
}

.toggle.active {
  background: var(--success);
}

.toggle-thumb {
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.toggle.active .toggle-thumb {
  transform: translateX(18px);
}

.settings-footer {
  text-align: center;
  padding-top: var(--spacing-lg);
}

.version {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
</style>

<style>
/* 快捷键弹窗 - 全局样式 */
.shortcut-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.shortcut-dialog {
  background: var(--bg-solid);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  width: 280px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.shortcut-dialog h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.shortcut-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.shortcut-input {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
  min-height: 24px;
}

.shortcut-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: var(--spacing-md);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
