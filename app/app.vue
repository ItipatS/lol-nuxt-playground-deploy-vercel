<script setup lang="ts">
const gameName = ref('')
const tagLine = ref('')
const account = ref<any | null>(null)
const matches = ref<any[]>([])
const matchDetails = ref<any[]>([])
const selectedMatchId = ref<string | null>(null)
const selectedChampion = ref<string | null>(null)
const profileIconId = ref<number>(0)
const errorMessage = ref('')
const loading = ref(false)
const loadingMatches = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const matchOffset = ref(0)
const BATCH = 10
const sidebarOpen = ref(true)

const DEFAULT_GAMENAME = 'Hide on bush'
const DEFAULT_TAGLINE = 'KR1'

gameName.value = DEFAULT_GAMENAME
tagLine.value = DEFAULT_TAGLINE
onMounted(searchPlayer)

async function searchPlayer() {
  errorMessage.value = ''
  account.value = null
  matches.value = []
  matchDetails.value = []
  selectedMatchId.value = null
  selectedChampion.value = null
  profileIconId.value = 0
  loading.value = true

  try {
    // 1. Get account
    const accountData = await $fetch<any>('/api/account', {
      query: {
        gameName: gameName.value,
        tagLine: tagLine.value,
      },
    })
    account.value = accountData

    // 2. Get profile icon
    const summonerData = await $fetch<any>('/api/summoner', { query: { puuid: accountData.puuid } })
    profileIconId.value = summonerData.profileIconId

    // 3. Get first batch of match IDs
    loadingMatches.value = true
    matchOffset.value = 0
    hasMore.value = true
    await fetchMatchBatch(accountData.puuid)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || 'Search failed'
  } finally {
    loading.value = false
    loadingMatches.value = false

    useHead({
      title: `${gameName.value}`
    })
  }
}

async function fetchMatchBatch(puuid: string) {
  const matchIds = await $fetch<string[]>('/api/matches', {
    query: { puuid, start: matchOffset.value, count: BATCH },
  })

  if (matchIds.length < BATCH) hasMore.value = false
  matchOffset.value += matchIds.length
  matches.value.push(...matchIds)

  const results = await Promise.all(
    matchIds.map(id => $fetch<any>(`/api/match/${id}`).catch(() => null)),
  )
  matchDetails.value.push(...results.filter(Boolean))
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value || !account.value) return
  loadingMore.value = true
  try {
    await fetchMatchBatch(account.value.puuid)
  } finally {
    loadingMore.value = false
  }
}

function selectMatch(matchId: string) {
  selectedMatchId.value = selectedMatchId.value === matchId ? null : matchId
  selectedChampion.value = null
}

function selectChampion(name: string) {
  selectedChampion.value = selectedChampion.value === name ? null : name
  selectedMatchId.value = null
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
    <!-- Top Bar -->
    <header class="flex shrink-0 items-center gap-4 border-b border-zinc-800/60 px-6 py-4">
      <div>
        <h1 class="text-lg font-bold tracking-tight">LoL Profile Graph</h1>
        <p class="text-xs text-zinc-500">Obsidian-style champion visualization</p>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <input
          v-model="gameName"
          type="text"
          placeholder="Game Name"
          class="w-40 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          @keydown.enter="searchPlayer"
        />
        <input
          v-model="tagLine"
          type="text"
          placeholder="Tag"
          class="w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          @keydown.enter="searchPlayer"
        />
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium transition hover:bg-indigo-500 disabled:opacity-50"
          :disabled="loading || !gameName || !tagLine"
          @click="searchPlayer"
        >
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
      </div>
    </header>

    <p v-if="errorMessage" class="shrink-0 bg-red-500/10 px-6 py-2 text-sm text-red-400">
      {{ errorMessage }}
    </p>

    <!-- Loading indicator for matches -->
    <div v-if="loadingMatches" class="shrink-0 border-b border-zinc-800/60 px-6 py-2">
      <div class="flex items-center gap-2 text-sm text-zinc-400">
        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading matches... ({{ matchDetails.length }}/{{ matches.length }})
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex min-h-0 flex-1">
      <!-- Left: Match History -->
      <aside
        v-if="account"
        class="relative shrink-0 border-r border-zinc-800/60 transition-all duration-300"
        :class="sidebarOpen ? 'w-96' : 'w-0'"
      >
        <div
          class="flex h-full flex-col"
          :class="sidebarOpen ? 'p-4 opacity-100' : 'p-0 opacity-0'"
          style="transition: opacity 0.2s, padding 0.3s"
        >
          <div class="mb-4 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <p class="text-sm font-semibold text-zinc-100">
              {{ account.gameName }}<span class="text-zinc-500"> #{{ account.tagLine }}</span>
            </p>
          </div>

          <MatchHistory
            class="min-h-0 flex-1"
            :matches="matchDetails"
            :selected-match-id="selectedMatchId"
            :selected-champion="selectedChampion"
            :player-puuid="account.puuid"
            :loading-more="loadingMore"
            :has-more="hasMore"
            @select="selectMatch"
            @load-more="loadMore"
          />
        </div>
      </aside>

      <!-- Sidebar toggle button -->
      <div
        v-if="account"
        class="relative z-10 flex shrink-0 items-center"
      >
        <button
          class="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow transition hover:border-zinc-500 hover:text-zinc-200"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg
            class="h-3 w-3 transition-transform duration-300"
            :class="sidebarOpen ? '' : 'rotate-180'"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      <!-- Right: Champion Graph -->
      <main class="relative min-h-0 flex-1">
        <ChampionGraph
          v-if="account"
          :matches="matchDetails"
          :player-puuid="account.puuid"
          :player-name="account.gameName"
          :selected-match-id="selectedMatchId"
          :selected-champion="selectedChampion"
          :player-icon-id="profileIconId"
          :player-tag="account.tagLine"
          @select-champion="selectChampion"
        />

        <!-- Empty state -->
        <div v-else class="flex h-full items-center justify-center">
          <div class="text-center">
            <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-zinc-900 p-4 text-zinc-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p class="text-sm text-zinc-500">Search a player to explore their champion graph</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
