// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '🇯🇵 Japanese PR Prediction',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android-chrome-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/android-chrome-512x512.png' }
      ],
      meta: [
        { name: 'description', content: 'Predict when you can get Japanese Permanent Residency based on your application date' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { property: 'og:title', content: '🇯🇵 Japanese PR Prediction' },
        { property: 'og:description', content: 'Predict when you can get Japanese Permanent Residency' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://whenwillgetjapanpr.web.app/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '🇯🇵 Japanese PR Prediction' },
        { name: 'twitter:description', content: 'Predict Japanese Permanent Residency' },
        { name: 'twitter:image', content: 'https://whenwillgetjapanpr.web.app/og-image.png' }
      ]
    }
  },
  i18n: {
    locales: [
      {
        code: 'en-US',
        iso: 'en-US',
        name: 'English',
        file: 'en-US.json'
      },
      {
        code: 'zh-TW',
        iso: 'zh-TW',
        name: '繁體中文',
        file: 'zh-TW.json'
      },
      {
        code: 'zh-CN',
        iso: 'zh-CN',
        name: '简体中文',
        file: 'zh-CN.json'
      }
    ],
    defaultLocale: 'en-US',
    strategy: 'no_prefix',
    langDir: 'locales/',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
