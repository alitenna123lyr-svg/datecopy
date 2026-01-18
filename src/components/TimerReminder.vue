<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'

const minutes = ref(45) // 工作时间
const breakMinutes = ref(10) // 休息时间
const isRunning = ref(false)
const remainingSeconds = ref(0)
const customMessage = ref('时间到了!')
const showAlert = ref(false)
const isIntervalMode = ref(false) // 间隔重复模式
const isWorkPhase = ref(true) // true=工作阶段, false=休息阶段
const completedCount = ref(0) // 已完成循环次数
let timerId: number | null = null
let audioContext: AudioContext | null = null

const displayTime = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60)
  const secs = remainingSeconds.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const phaseLabel = computed(() => {
  if (!isIntervalMode.value) return ''
  return isWorkPhase.value ? '工作中' : '休息中'
})

const presets = [5, 10, 15, 30, 45, 60]

function setPreset(mins: number) {
  if (!isRunning.value) {
    minutes.value = mins
  }
}

function increaseMinutes() {
  if (!isRunning.value && minutes.value < 999) {
    minutes.value++
  }
}

function decreaseMinutes() {
  if (!isRunning.value && minutes.value > 1) {
    minutes.value--
  }
}

function validateMinutes() {
  if (minutes.value < 1) {
    minutes.value = 1
  } else if (minutes.value > 999) {
    minutes.value = 999
  }
}

function startTimer() {
  if (isRunning.value) return
  isWorkPhase.value = true
  remainingSeconds.value = minutes.value * 60
  isRunning.value = true
  if (!isIntervalMode.value) {
    completedCount.value = 0
  }

  timerId = window.setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      showNotification()

      if (isIntervalMode.value) {
        // 间隔模式：工作和休息交替
        if (isWorkPhase.value) {
          // 工作结束，开始休息
          isWorkPhase.value = false
          remainingSeconds.value = breakMinutes.value * 60
        } else {
          // 休息结束，开始工作，计数+1
          completedCount.value++
          isWorkPhase.value = true
          remainingSeconds.value = minutes.value * 60
        }
      } else {
        stopTimer()
      }
    }
  }, 1000)
}

function stopTimer() {
  isRunning.value = false
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function resetTimer() {
  stopTimer()
  remainingSeconds.value = 0
  completedCount.value = 0
  isWorkPhase.value = true
}

// 获取当前阶段的提示消息
function getPhaseMessage() {
  if (!isIntervalMode.value) {
    return customMessage.value
  }
  // 注意：此时 isWorkPhase 已经切换到下一阶段了
  // 所以如果现在是休息阶段，说明刚结束工作
  return isWorkPhase.value ? '休息结束，开始工作！' : '工作结束，休息一下！'
}

// 播放悦耳的提示音
function playNotificationSound() {
  try {
    audioContext = new AudioContext()
    const now = audioContext.currentTime

    const playChord = (startTime: number) => {
      const frequencies = [523.25, 659.25, 783.99]
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext!.createOscillator()
        const gainNode = audioContext!.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext!.destination)

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(freq, startTime)

        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2)

        oscillator.start(startTime + index * 0.08)
        oscillator.stop(startTime + 1.5)
      })
    }

    playChord(now)
    playChord(now + 0.6)
    playChord(now + 1.2)
  } catch (e) {
    console.error('Failed to play sound:', e)
  }
}

async function showNotification() {
  playNotificationSound()
  showAlert.value = true

  // 弹出窗口并置顶
  try {
    const appWindow = getCurrentWindow()
    await appWindow.show()
    await appWindow.unminimize()
    await appWindow.setFocus()
    await appWindow.setAlwaysOnTop(true)
    // 3秒后取消置顶
    setTimeout(async () => {
      await appWindow.setAlwaysOnTop(false)
    }, 3000)
  } catch (e) {
    console.error('Failed to show window:', e)
  }

  if ('Notification' in window) {
    const notifyMessage = getPhaseMessage()
    if (Notification.permission === 'granted') {
      new Notification('定时提醒', {
        body: notifyMessage + (isIntervalMode.value && !isWorkPhase.value ? ` (已完成${completedCount.value}轮)` : ''),
        requireInteraction: true
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('定时提醒', {
            body: notifyMessage,
            requireInteraction: true
          })
        }
      })
    }
  }

  let count = 0
  const originalTitle = document.title
  const flashInterval = setInterval(() => {
    document.title = count % 2 === 0 ? '⏰ ' + customMessage.value : originalTitle
    count++
    if (count > 20) {
      clearInterval(flashInterval)
      document.title = originalTitle
    }
  }, 500)
}

function dismissAlert() {
  showAlert.value = false
}

onMounted(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId)
  }
  if (audioContext) {
    audioContext.close()
  }
})
</script>

<template>
  <div class="timer-reminder">
    <div class="timer-header">
      <span class="timer-title">定时提醒</span>
      <span v-if="isRunning && isIntervalMode" class="phase-badge" :class="{ work: isWorkPhase, break: !isWorkPhase }">
        {{ phaseLabel }}
      </span>
      <span v-if="isRunning && isIntervalMode" class="repeat-count">
        第 {{ completedCount + 1 }} 轮
      </span>
    </div>

    <div class="timer-display" :class="{ running: isRunning, 'break-phase': isRunning && isIntervalMode && !isWorkPhase }">
      {{ isRunning ? displayTime : `${minutes} 分钟` }}
    </div>

    <div class="presets" v-if="!isRunning">
      <button
        v-for="preset in presets"
        :key="preset"
        class="preset-btn"
        :class="{ active: minutes === preset }"
        @click="setPreset(preset)"
      >
        {{ preset }}
      </button>
    </div>

    <div class="interval-toggle" v-if="!isRunning" @click="isIntervalMode = !isIntervalMode">
      <span class="toggle-label">间隔循环</span>
      <div class="toggle" :class="{ active: isIntervalMode }">
        <div class="toggle-thumb"></div>
      </div>
    </div>

    <!-- 间隔模式：工作时间 + 休息时间 -->
    <div class="interval-settings" v-if="!isRunning && isIntervalMode">
      <div class="interval-row">
        <span class="interval-label">工作</span>
        <div class="interval-input-group">
          <button class="time-adjust-btn small" @click="minutes > 1 && minutes--">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <input type="number" v-model.number="minutes" min="1" max="999" class="minutes-input small" />
          <span class="minutes-unit">分钟</span>
          <button class="time-adjust-btn small" @click="minutes < 999 && minutes++">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="interval-row">
        <span class="interval-label">休息</span>
        <div class="interval-input-group">
          <button class="time-adjust-btn small" @click="breakMinutes > 1 && breakMinutes--">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <input type="number" v-model.number="breakMinutes" min="1" max="999" class="minutes-input small" />
          <span class="minutes-unit">分钟</span>
          <button class="time-adjust-btn small" @click="breakMinutes < 999 && breakMinutes++">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="interval-summary">
        每轮 {{ minutes + breakMinutes }} 分钟
      </div>
    </div>

    <!-- 非间隔模式：简单时间设置 -->
    <div class="custom-time" v-if="!isRunning && !isIntervalMode">
      <label class="custom-time-label">自定义时间</label>
      <div class="custom-time-input">
        <button class="time-adjust-btn" @click="decreaseMinutes" :disabled="minutes <= 1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <input
          type="number"
          v-model.number="minutes"
          min="1"
          max="999"
          class="minutes-input"
          @input="validateMinutes"
        />
        <span class="minutes-unit">分钟</span>
        <button class="time-adjust-btn" @click="increaseMinutes" :disabled="minutes >= 999">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>

    <input
      v-if="!isRunning && !isIntervalMode"
      v-model="customMessage"
      class="message-input"
      placeholder="自定义提醒内容..."
    />

    <div class="timer-actions">
      <button v-if="!isRunning" class="action-btn start" @click="startTimer">
        开始
      </button>
      <template v-else>
        <button class="action-btn stop" @click="stopTimer">
          暂停
        </button>
        <button class="action-btn reset" @click="resetTimer">
          重置
        </button>
      </template>
    </div>
  </div>

  <!-- 提醒弹窗 -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAlert" class="alert-overlay" @click="dismissAlert">
        <div class="alert-dialog" @click.stop>
          <div class="alert-icon">{{ isIntervalMode ? (isWorkPhase ? '💪' : '☕') : '⏰' }}</div>
          <h3 class="alert-title">{{ isIntervalMode ? (isWorkPhase ? '开始工作' : '休息一下') : '定时提醒' }}</h3>
          <p class="alert-message">{{ isIntervalMode ? (isWorkPhase ? '休息结束，继续加油！' : '工作结束，放松一下~') : customMessage }}</p>
          <p v-if="isIntervalMode" class="alert-count">已完成 {{ completedCount }} 轮</p>
          <button class="alert-btn" @click="dismissAlert">{{ isIntervalMode ? (isWorkPhase ? '开始工作' : '开始休息') : '知道了' }}</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.timer-reminder {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.timer-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.timer-title {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.repeat-count {
  font-size: 12px;
  color: var(--accent);
  background: rgba(0, 122, 255, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.timer-display {
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  padding: var(--spacing-xs) 0;
}

.timer-display.running {
  color: var(--accent);
}

.timer-display.break-phase {
  color: var(--success);
}

.phase-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.phase-badge.work {
  background: rgba(0, 122, 255, 0.15);
  color: var(--accent);
}

.phase-badge.break {
  background: rgba(52, 199, 89, 0.15);
  color: var(--success);
}

.presets {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.preset-btn {
  width: 40px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.preset-btn:hover {
  background: var(--bg-primary);
}

.preset-btn.active {
  background: var(--accent);
  color: white;
}

.custom-time {
  margin-bottom: var(--spacing-sm);
}

.custom-time-label {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-xs);
  text-align: center;
}

.custom-time-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.time-adjust-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.time-adjust-btn:hover:not(:disabled) {
  background: var(--bg-primary);
  color: var(--accent);
}

.time-adjust-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.time-adjust-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.minutes-input {
  width: 60px;
  height: 32px;
  text-align: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.minutes-input::-webkit-inner-spin-button,
.minutes-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.minutes-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent);
}

.minutes-unit {
  font-size: 13px;
  color: var(--text-secondary);
}

.message-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  margin-bottom: var(--spacing-sm);
}

.message-input::placeholder {
  color: var(--text-tertiary);
}

.interval-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
}

.toggle-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.toggle {
  width: 40px;
  height: 24px;
  background: var(--text-tertiary);
  border-radius: var(--radius-full);
  position: relative;
  transition: background var(--transition-fast);
}

.toggle.active {
  background: var(--success);
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.toggle.active .toggle-thumb {
  transform: translateX(16px);
}

/* 间隔设置样式 */
.interval-settings {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.interval-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
}

.interval-row + .interval-row {
  border-top: 1px solid var(--divider);
}

.interval-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.interval-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-adjust-btn.small {
  width: 24px;
  height: 24px;
}

.minutes-input.small {
  width: 48px;
  height: 24px;
  font-size: 13px;
}

.interval-summary {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--divider);
}

.timer-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.action-btn.start {
  background: var(--accent);
  color: white;
}

.action-btn.start:hover {
  background: var(--accent-hover);
}

.action-btn.stop {
  background: var(--warning);
  color: white;
}

.action-btn.reset {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.action-btn.reset:hover {
  background: var(--bg-primary);
}
</style>

<style>
/* 提醒弹窗全局样式 */
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.alert-dialog {
  background: var(--bg-solid);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  width: 260px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: alertBounce 0.4s ease;
}

@keyframes alertBounce {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.alert-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  animation: alertShake 0.5s ease infinite;
}

@keyframes alertShake {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.alert-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.alert-message {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.alert-count {
  font-size: 13px;
  color: var(--accent);
  margin-bottom: var(--spacing-lg);
}

.alert-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--accent);
  color: white;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  transition: background var(--transition-fast);
}

.alert-btn:hover {
  background: var(--accent-hover);
}
</style>
