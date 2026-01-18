<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { getDateFormats, getTimeFormats, getDateTimeFormats, formatDate } from '../utils/dateFormat'

type FormatType = 'date' | 'time' | 'datetime'

const props = defineProps<{
  type: FormatType
  label: string
}>()

const store = useSettingsStore()
const isOpen = ref(false)
const now = new Date()
const headerRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<{ top: string; left: string; width: string }>({ top: '0', left: '0', width: '0' })

// 滚动时更新下拉菜单位置
function updateDropdownPosition() {
  if (isOpen.value && headerRef.value) {
    const rect = headerRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    }
  }
}

function handleScroll() {
  updateDropdownPosition()
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll, true)
})

const formats = computed(() => {
  switch (props.type) {
    case 'date': return getDateFormats()
    case 'time': return getTimeFormats()
    case 'datetime': return getDateTimeFormats()
  }
})

const currentFormatId = computed(() => {
  switch (props.type) {
    case 'date': return store.dateFormatId
    case 'time': return store.timeFormatId
    case 'datetime': return store.datetimeFormatId
  }
})

const currentFormat = computed(() => {
  return formats.value.find(f => f.id === currentFormatId.value) || formats.value[0]
})

function selectFormat(id: string) {
  switch (props.type) {
    case 'date':
      store.setDateFormat(id)
      break
    case 'time':
      store.setTimeFormat(id)
      break
    case 'datetime':
      store.setDateTimeFormat(id)
      break
  }
  isOpen.value = false
}

async function toggleDropdown() {
  if (!isOpen.value && headerRef.value) {
    const rect = headerRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    }
  }
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}
</script>

<template>
  <div class="format-select" v-click-outside="closeDropdown">
    <div ref="headerRef" class="select-header" @click="toggleDropdown">
      <span class="label">{{ label }}</span>
      <span class="value">{{ currentFormat.label }}</span>
      <span class="arrow" :class="{ open: isOpen }">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="isOpen" class="dropdown" :style="dropdownStyle" @click.stop>
          <div
            v-for="format in formats"
            :key="format.id"
            class="dropdown-item"
            :class="{ active: format.id === currentFormatId }"
            @click="selectFormat(format.id)"
          >
            <span class="format-label">{{ format.label }}</span>
            <span class="format-preview">{{ formatDate(now, format.format) }}</span>
            <span v-if="format.id === currentFormatId" class="check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.format-select {
  position: relative;
}

.select-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: transparent;
  border-radius: 0;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.select-header:hover {
  background: rgba(0, 0, 0, 0.05);
}

.label {
  color: var(--text-secondary);
  font-size: 13px;
}

.value {
  flex: 1;
  text-align: right;
  color: var(--text-primary);
  font-size: 14px;
  margin-right: var(--spacing-sm);
}

.arrow {
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
  display: flex;
  align-items: center;
}

.arrow.open {
  transform: rotate(180deg);
}
</style>

<style>
/* Global styles for teleported dropdown */
.dropdown {
  position: fixed;
  background: var(--bg-solid);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
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

.format-label {
  font-size: 14px;
  color: var(--text-primary);
}

.format-preview {
  flex: 1;
  text-align: right;
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: var(--spacing-sm);
}

.check {
  color: var(--accent);
  display: flex;
  align-items: center;
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
