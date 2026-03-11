<script setup lang="ts">
import * as d3 from 'd3'

interface ChampionNode extends d3.SimulationNodeDatum {
  id: string
  championName: string
  games: number
  wins: number
  kills: number
  deaths: number
  assists: number
  cs: number
  isPlayer?: boolean
  highlighted?: boolean
}

interface ChampionLink extends d3.SimulationLinkDatum<ChampionNode> {
  value: number
}

const props = defineProps<{
  matches: any[]
  playerPuuid: string
  playerName: string
  playerTag: string
  playerIconId: number
  selectedMatchId: string | null
  selectedChampion: string | null
}>()

const emit = defineEmits<{
  selectChampion: [name: string]
}>()

const graphContainer = ref<HTMLElement | null>(null)
let simulation: d3.Simulation<ChampionNode, ChampionLink> | null = null

const championStats = computed(() => {
  const stats = new Map<string, { games: number; wins: number; kills: number; deaths: number; assists: number; cs: number }>()

  for (const match of props.matches) {
    const player = match.info.participants.find((p: any) => p.puuid === props.playerPuuid)
    if (!player) continue

    const name = player.championName
    const existing = stats.get(name) || { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0 }

    existing.games++
    if (player.win) existing.wins++
    existing.kills += player.kills
    existing.deaths += player.deaths
    existing.assists += player.assists
    existing.cs += player.totalMinionsKilled + player.neutralMinionsKilled

    stats.set(name, existing)
  }

  return stats
})

const graphData = computed(() => {
  const nodes: ChampionNode[] = []
  const links: ChampionLink[] = []

  // Player center node
  nodes.push({
    id: 'player',
    championName: props.playerName,
    games: props.matches.length,
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    isPlayer: true,
  })

  // Champion nodes
  for (const [name, stats] of championStats.value) {
    nodes.push({
      id: name,
      championName: name,
      games: stats.games,
      wins: stats.wins,
      kills: stats.kills,
      deaths: stats.deaths,
      assists: stats.assists,
      cs: stats.cs,
    })

    links.push({
      source: 'player',
      target: name,
      value: stats.games,
    })
  }

  // Highlight champion from selected match
  if (props.selectedMatchId) {
    const match = props.matches.find((m: any) => m.metadata.matchId === props.selectedMatchId)
    if (match) {
      const player = match.info.participants.find((p: any) => p.puuid === props.playerPuuid)
      if (player) {
        const node = nodes.find(n => n.id === player.championName)
        if (node) node.highlighted = true
      }
    }
  }

  // Highlight directly selected champion
  if (props.selectedChampion) {
    const node = nodes.find(n => n.id === props.selectedChampion)
    if (node) node.highlighted = true
  }

  return { nodes, links }
})

function winrateColor(wins: number, games: number) {
  if (games === 0) return '#a1a1aa'
  const wr = wins / games
  if (wr >= 0.6) return '#34d399'
  if (wr >= 0.5) return '#a3e635'
  if (wr >= 0.4) return '#fbbf24'
  return '#f87171'
}

function drawGraph() {
  if (!graphContainer.value) return

  const container = graphContainer.value
  const rect = container.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  // Clear previous
  d3.select(container).selectAll('*').remove()

  const { nodes, links } = graphData.value
  if (nodes.length <= 1) return

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])

  // Glow filter
  const defs = svg.append('defs')
  const filter = defs.append('filter').attr('id', 'glow')
  filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
  const feMerge = filter.append('feMerge')
  feMerge.append('feMergeNode').attr('in', 'coloredBlur')
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

  // Size scale
  const maxGames = Math.max(...nodes.filter(n => !n.isPlayer).map(n => n.games), 1)
  const sizeScale = d3.scaleLinear().domain([1, maxGames]).range([18, 45])

  simulation = d3.forceSimulation<ChampionNode>(nodes)
    .force('link', d3.forceLink<ChampionNode, ChampionLink>(links).id(d => d.id).distance(120).strength(0.4))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide<ChampionNode>().radius(d => (d.isPlayer ? 35 : sizeScale(d.games)) + 10))

  // Links
  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', '#3f3f46')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', d => Math.max(1, d.value * 0.8))

  // Node groups
  const node = svg.append('g')
    .selectAll<SVGGElement, ChampionNode>('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .call(
      d3.drag<SVGGElement, ChampionNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0)
          d.fx = null
          d.fy = null
        }),
    )

  // Champion images (circle clip)
  node.each(function (d) {
    const g = d3.select(this)
    const r = d.isPlayer ? 30 : sizeScale(d.games)
    const clipId = `clip-${d.id.replace(/[^a-zA-Z0-9]/g, '_')}`

    // Clip path
    g.append('clipPath')
      .attr('id', clipId)
      .append('circle')
      .attr('r', r)

    // Outer ring (winrate color or highlight)
    g.append('circle')
      .attr('r', r + 3)
      .attr('fill', 'none')
      .attr('stroke', d.isPlayer ? '#818cf8' : (d.highlighted ? '#c084fc' : winrateColor(d.wins, d.games)))
      .attr('stroke-width', d.highlighted ? 3 : 2)
      .attr('filter', d.highlighted ? 'url(#glow)' : null)

    if (d.isPlayer) {
      // Player node: profile icon image or fallback circle
      if (props.playerIconId) {
        g.append('image')
          .attr('href', `https://ddragon.leagueoflegends.com/cdn/16.5.1/img/profileicon/${props.playerIconId}.png`)
          .attr('x', -r)
          .attr('y', -r)
          .attr('width', r * 2)
          .attr('height', r * 2)
          .attr('clip-path', `url(#${clipId})`)
          .attr('preserveAspectRatio', 'xMidYMid slice')
      }
      else {
        g.append('circle').attr('r', r).attr('fill', '#312e81')
      }

      // Name label below node
      const label = d.championName.length > 14 ? d.championName.slice(0, 13) + '…' : d.championName
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', r + 14)
        .attr('fill', '#e4e4e7')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .style('pointer-events', 'none')
        .text(label)

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', r + 26)
        .attr('fill', '#71717a')
        .attr('font-size', '10px')
        .style('pointer-events', 'none')
        .text(`#${props.playerTag}`)
    } else {
      // Champion image
      g.append('image')
        .attr('href', `https://ddragon.leagueoflegends.com/cdn/16.5.1/img/champion/${d.championName}.png`)
        .attr('x', -r)
        .attr('y', -r)
        .attr('width', r * 2)
        .attr('height', r * 2)
        .attr('clip-path', `url(#${clipId})`)
        .attr('preserveAspectRatio', 'xMidYMid slice')
    }
  })

  // Tooltip
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'graph-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('background', 'rgba(9,9,11,0.95)')
    .style('border', '1px solid #3f3f46')
    .style('border-radius', '12px')
    .style('padding', '10px 14px')
    .style('font-size', '12px')
    .style('color', '#e4e4e7')
    .style('backdrop-filter', 'blur(8px)')
    .style('z-index', '50')

  node.on('click', (event, d) => {
    if (!d.isPlayer) emit('selectChampion', d.championName)
  })

  node.on('mouseenter', (event, d) => {
    if (d.isPlayer) return
    const wr = d.games > 0 ? Math.round((d.wins / d.games) * 100) : 0
    const avgKda = d.games > 0
      ? `${(d.kills / d.games).toFixed(1)}/${(d.deaths / d.games).toFixed(1)}/${(d.assists / d.games).toFixed(1)}`
      : '0/0/0'

    tooltip
      .html(`
        <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${d.championName}</div>
        <div style="color:#a1a1aa">${d.games} game${d.games > 1 ? 's' : ''} · <span style="color:${winrateColor(d.wins, d.games)}">${wr}% WR</span></div>
        <div style="color:#a1a1aa;margin-top:2px;">Avg KDA: ${avgKda}</div>
        <div style="color:#a1a1aa;">Avg CS: ${Math.round(d.cs / d.games)}</div>
      `)
      .style('opacity', 1)
  })
    .on('mousemove', (event) => {
      const containerRect = container.getBoundingClientRect()
      tooltip
        .style('left', (event.clientX - containerRect.left + 12) + 'px')
        .style('top', (event.clientY - containerRect.top - 10) + 'px')
    })
    .on('mouseleave', () => {
      tooltip.style('opacity', 0)
    })

  // Tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as ChampionNode).x!)
      .attr('y1', d => (d.source as ChampionNode).y!)
      .attr('x2', d => (d.target as ChampionNode).x!)
      .attr('y2', d => (d.target as ChampionNode).y!)

    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })
}

watch(graphData, () => {
  nextTick(drawGraph)
}, { deep: true })

onMounted(() => {
  nextTick(drawGraph)

  const observer = new ResizeObserver(() => drawGraph())
  if (graphContainer.value) observer.observe(graphContainer.value)

  onUnmounted(() => {
    observer.disconnect()
    simulation?.stop()
  })
})
</script>

<template>
  <div class="relative h-full w-full">
    <h2 class="absolute left-4 top-3 z-10 text-sm font-semibold uppercase tracking-wider text-zinc-400">
      Champion Graph
    </h2>

    <div
      ref="graphContainer"
      class="h-full w-full"
    />

    <div v-if="matches.length === 0" class="absolute inset-0 flex items-center justify-center">
      <p class="text-sm text-zinc-600">Search a player to see their champion graph</p>
    </div>
  </div>
</template>
