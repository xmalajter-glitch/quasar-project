import { defineBoot } from '#q-app'
import { createI18n } from 'vue-i18n'
import messages from '@/i18n'

const locale = navigator.language.startsWith('sk') ? 'sk-SK' : 'en-US'

export default defineBoot(({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en-US',
    messages,
    globalInjection: true,
  })

  app.use(i18n)
})
