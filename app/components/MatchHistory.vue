<script setup lang="ts">
const props = defineProps<{
  matches: any[]
  selectedMatchId: string | null
  selectedChampion?: string | null
  playerPuuid: string
  loadingMore?: boolean
  hasMore?: boolean
}>()

const emit = defineEmits<{
  select: [matchId: string]
  loadMore: []
}>()

const sentinel = ref<HTMLElement | null>(null)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) emit('loadMore')
    },
    { threshold: 0.1 },
  )
  if (sentinel.value) observer.observe(sentinel.value)
  onUnmounted(() => observer.disconnect())
})

// Maps summoner spell ID → DDragon key
const SUMMONER_SPELLS: Record<number, string> = {
  1: 'SummonerBoost',
  3: 'SummonerExhaust',
  4: 'SummonerFlash',
  6: 'SummonerHaste',
  7: 'SummonerHeal',
  11: 'SummonerSmite',
  12: 'SummonerTeleport',
  13: 'SummonerMana',
  14: 'SummonerDot',
  21: 'SummonerBarrier',
  32: 'SummonerSnowball',
}

function spellImg(spellId: number) {
  const key = SUMMONER_SPELLS[spellId] ?? 'SummonerFlash'
  return `https://ddragon.leagueoflegends.com/cdn/16.5.1/img/spell/${key}.png`
}

function itemIds(p: any): number[] {
  return [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].filter((id: number) => id > 0)
}

function trinketId(p: any): number {
  return p.item6
}

function getPlayerData(match: any) {
  return match.info.participants.find((p: any) => p.puuid === props.playerPuuid)
}

function getTeams(match: any) {
  const blueTeam = match.info.participants.filter((p: any) => p.teamId === 100)
  const redTeam = match.info.participants.filter((p: any) => p.teamId === 200)
  return { blueTeam, redTeam }
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function isPlayerRow(participant: any) {
  return participant.puuid === props.playerPuuid
}
</script>

<template>
  <div class="flex h-full flex-col">
    <h2 class="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-zinc-400">
      Match History
    </h2>

    <div class="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
      <div
        v-for="match in matches"
        :key="match.metadata.matchId"
        class="rounded-xl border transition-all duration-200"
        :class="[
          selectedMatchId === match.metadata.matchId
            ? 'border-indigo-500/50 bg-indigo-500/10'
            : selectedChampion && getPlayerData(match)?.championName === selectedChampion
              ? 'border-violet-500/40 bg-violet-500/10'
              : 'border-zinc-800 bg-zinc-900/40',
        ]"
      >
        <!-- Match summary row (clickable) -->
        <button
          class="w-full p-3 text-left"
          @click="emit('select', match.metadata.matchId)"
        >
          <template v-if="getPlayerData(match)">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <img
                  :src="`https://ddragon.leagueoflegends.com/cdn/16.5.1/img/champion/${getPlayerData(match).championName}.png`"
                  :alt="getPlayerData(match).championName"
                  class="h-8 w-8 rounded-lg"
                />
                <div>
                  <p class="text-sm font-medium text-zinc-100">
                    {{ getPlayerData(match).championName }}
                  </p>
                  <p class="text-xs text-zinc-500">
                    {{ getPlayerData(match).kills }}/{{ getPlayerData(match).deaths }}/{{ getPlayerData(match).assists }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 text-right">
                <div>
                  <span
                    class="inline-block rounded-md px-2 py-0.5 text-xs font-semibold"
                    :class="getPlayerData(match).win ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'"
                  >
                    {{ getPlayerData(match).win ? 'WIN' : 'LOSS' }}
                  </span>
                  <p class="mt-1 text-xs text-zinc-600">
                    {{ formatDuration(match.info.gameDuration) }}
                  </p>
                </div>
                <svg
                  class="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200"
                  :class="selectedMatchId === match.metadata.matchId ? 'rotate-180' : ''"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            <div class="mt-2 flex items-center gap-3 text-xs text-zinc-500">
              <span>{{ getPlayerData(match).totalMinionsKilled + getPlayerData(match).neutralMinionsKilled }} CS</span>
              <span>{{ getPlayerData(match).visionScore }} Vision</span>
              <span class="ml-auto">{{ timeAgo(match.info.gameCreation) }}</span>
            </div>
          </template>
        </button>

        <!-- Expanded scoreboard -->
        <div
          v-if="selectedMatchId === match.metadata.matchId"
          class="border-t border-zinc-800/60 px-3 pb-3 pt-2"
        >
          <div class="space-y-4">
            <div v-for="(team, teamKey) in { blue: getTeams(match).blueTeam, red: getTeams(match).redTeam }" :key="teamKey">
              <p class="mb-2 text-xs font-semibold" :class="teamKey === 'blue' ? 'text-blue-400' : 'text-red-400'">
                {{ teamKey === 'blue' ? 'Blue Team' : 'Red Team' }}
              </p>

              <div class="space-y-2">
                <div
                  v-for="p in team"
                  :key="p.puuid"
                  class="rounded-lg p-2"
                  :class="isPlayerRow(p) ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'bg-zinc-900/40'"
                >
                  <!-- Top row: champ + spells + name + kda + cs -->
                  <div class="flex items-center gap-1.5">
                    <img
                      :src="`https://ddragon.leagueoflegends.com/cdn/16.5.1/img/champion/${p.championName}.png`"
                      :alt="p.championName"
                      class="h-6 w-6 shrink-0 rounded"
                    />
                    <!-- Summoner spells -->
                    <div class="flex shrink-0 flex-col gap-0.5">
                      <img :src="spellImg(p.summoner1Id)" class="h-3 w-3 rounded-sm" :alt="`spell${p.summoner1Id}`" />
                      <img :src="spellImg(p.summoner2Id)" class="h-3 w-3 rounded-sm" :alt="`spell${p.summoner2Id}`" />
                    </div>
                    <span
                      class="min-w-0 flex-1 truncate text-xs"
                      :class="isPlayerRow(p) ? 'font-medium text-zinc-100' : 'text-zinc-400'"
                    >
                      {{ p.riotIdGameName }} {{ p.riotIdTagline ? `#${p.riotIdTagline}` : '' }}
                    </span>
                    <span class="shrink-0 text-xs text-zinc-500">{{ p.kills }}/{{ p.deaths }}/{{ p.assists }}</span>
                    <span class="shrink-0 text-xs text-zinc-600">{{ p.totalMinionsKilled + p.neutralMinionsKilled }}cs</span>
                  </div>

                  <!-- Items row -->
                  <div class="mt-1.5 flex items-center gap-1">
                    <img
                      v-for="itemId in itemIds(p)"
                      :key="itemId"
                      :src="`https://ddragon.leagueoflegends.com/cdn/16.5.1/img/item/${itemId}.png`"
                      class="h-5 w-5 rounded"
                      :alt="`item${itemId}`"
                    />
                    <!-- Empty item slots -->
                    <div
                      v-for="i in (6 - itemIds(p).length)"
                      :key="`empty-${i}`"
                      class="h-5 w-5 rounded bg-zinc-800/60"
                    />
                    <!-- Separator + trinket -->
                    <div class="mx-0.5 h-4 w-px bg-zinc-700" />
                    <img
                      v-if="trinketId(p) > 0"
                      :src="`https://ddragon.leagueoflegends.com/cdn/16.5.1/img/item/${trinketId(p)}.png`"
                      class="h-5 w-5 rounded"
                      alt="trinket"
                    />
                    <div v-else class="h-5 w-5 rounded bg-zinc-800/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="matches.length === 0" class="py-8 text-center text-sm text-zinc-600">
        No matches found
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="py-2 text-center">
        <div v-if="loadingMore" class="flex items-center justify-center gap-2 text-xs text-zinc-600">
          <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading more...
        </div>
        <p v-else-if="!hasMore && matches.length > 0" class="text-xs text-zinc-700">
          All matches loaded
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(63 63 70);
  border-radius: 999px;
}
</style>
