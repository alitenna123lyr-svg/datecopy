import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/global.css'

// Click outside directive
const clickOutside = {
  mounted(el: HTMLElement & { _clickOutside: (e: Event) => void }, binding: { value: () => void }) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement & { _clickOutside: (e: Event) => void }) {
    document.removeEventListener('click', el._clickOutside)
  }
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.directive('click-outside', clickOutside)
app.mount('#app')
