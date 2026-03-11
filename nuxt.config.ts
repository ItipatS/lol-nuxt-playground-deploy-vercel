/// <reference types="node" />
export default defineNuxtConfig({
  devtools: { enabled: true },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  runtimeConfig: {
    riotApiKey: process.env.RIOT_API_KEY,
  },

  css: ['~/assets/css/main.css'],
})