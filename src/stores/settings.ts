import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { load } from '@tauri-apps/plugin-store'
import { defaultFormats, formatDate, timezones, type FormatOption } from '../utils/dateFormat'

// 创建持久化存储
let store: Awaited<ReturnType<typeof load>> | null = null

async function getStore() {
  if (!store) {
    store = await load('settings.json')
  }
  return store
}

export const useSettingsStore = defineStore('settings', () => {
  // 格式设置
  const dateFormatId = ref('date-1')
  const timeFormatId = ref('time-2')
  const datetimeFormatId = ref('datetime-2')

  // 时区设置
  const timezoneId = ref('local')

  // 自定义格式
  const customFormats = ref<FormatOption[]>([])

  // 快捷键设置
  const shortcuts = ref({
    copyDate: 'Ctrl+Shift+D',
    copyTime: 'Ctrl+Shift+T',
    copyDateTime: 'Ctrl+Shift+C',
  })

  // 其他设置
  const autoStart = ref(false)

  // 是否已加载
  const isLoaded = ref(false)

  // 加载设置
  async function loadSettings() {
    try {
      const s = await getStore()

      const savedDateFormat = await s.get<string>('dateFormatId')
      if (savedDateFormat) dateFormatId.value = savedDateFormat

      const savedTimeFormat = await s.get<string>('timeFormatId')
      if (savedTimeFormat) timeFormatId.value = savedTimeFormat

      const savedDatetimeFormat = await s.get<string>('datetimeFormatId')
      if (savedDatetimeFormat) datetimeFormatId.value = savedDatetimeFormat

      const savedTimezone = await s.get<string>('timezoneId')
      if (savedTimezone) timezoneId.value = savedTimezone

      const savedShortcuts = await s.get<typeof shortcuts.value>('shortcuts')
      if (savedShortcuts) shortcuts.value = savedShortcuts

      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load settings:', e)
      isLoaded.value = true
    }
  }

  // 保存设置
  async function saveSettings() {
    if (!isLoaded.value) return
    try {
      const s = await getStore()
      await s.set('dateFormatId', dateFormatId.value)
      await s.set('timeFormatId', timeFormatId.value)
      await s.set('datetimeFormatId', datetimeFormatId.value)
      await s.set('timezoneId', timezoneId.value)
      await s.set('shortcuts', shortcuts.value)
      await s.save()
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  // 设置快捷键
  function setShortcut(key: 'copyDate' | 'copyTime' | 'copyDateTime', value: string) {
    shortcuts.value[key] = value
    saveSettings()
  }

  // 监听变化并保存
  watch([dateFormatId, timeFormatId, datetimeFormatId, timezoneId], () => {
    saveSettings()
  })

  // 所有可用格式
  const allFormats = computed(() => [...defaultFormats, ...customFormats.value])

  // 当前时区
  const currentTimezone = computed(() =>
    timezones.find(t => t.id === timezoneId.value) || timezones[0]
  )

  // 当前选中的格式
  const currentDateFormat = computed(() =>
    allFormats.value.find(f => f.id === dateFormatId.value) || defaultFormats[0]
  )

  const currentTimeFormat = computed(() =>
    allFormats.value.find(f => f.id === timeFormatId.value) || defaultFormats[6]
  )

  const currentDateTimeFormat = computed(() =>
    allFormats.value.find(f => f.id === datetimeFormatId.value) || defaultFormats[11]
  )

  // 获取格式化后的当前时间
  function getFormattedDate(date: Date = new Date()): string {
    return formatDate(date, currentDateFormat.value.format, currentTimezone.value.offset)
  }

  function getFormattedTime(date: Date = new Date()): string {
    return formatDate(date, currentTimeFormat.value.format, currentTimezone.value.offset)
  }

  function getFormattedDateTime(date: Date = new Date()): string {
    return formatDate(date, currentDateTimeFormat.value.format, currentTimezone.value.offset)
  }

  // 设置格式
  function setDateFormat(id: string) {
    dateFormatId.value = id
  }

  function setTimeFormat(id: string) {
    timeFormatId.value = id
  }

  function setDateTimeFormat(id: string) {
    datetimeFormatId.value = id
  }

  // 设置时区
  function setTimezone(id: string) {
    timezoneId.value = id
  }

  // 添加自定义格式
  function addCustomFormat(format: Omit<FormatOption, 'id'>) {
    const id = `custom-${Date.now()}`
    customFormats.value.push({ ...format, id })
    return id
  }

  // 删除自定义格式
  function removeCustomFormat(id: string) {
    const index = customFormats.value.findIndex(f => f.id === id)
    if (index !== -1) {
      customFormats.value.splice(index, 1)
    }
  }

  // 初始化时加载设置
  loadSettings()

  return {
    dateFormatId,
    timeFormatId,
    datetimeFormatId,
    timezoneId,
    customFormats,
    shortcuts,
    autoStart,
    allFormats,
    currentTimezone,
    currentDateFormat,
    currentTimeFormat,
    currentDateTimeFormat,
    getFormattedDate,
    getFormattedTime,
    getFormattedDateTime,
    setDateFormat,
    setTimeFormat,
    setDateTimeFormat,
    setTimezone,
    addCustomFormat,
    removeCustomFormat,
    loadSettings,
    setShortcut,
  }
})
