export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const puuid = String(query.puuid || '').trim()
  const count = Math.min(Number(query.count) || 10, 20)
  const start = Math.max(Number(query.start) || 0, 0)

  if (!puuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'puuid is required',
    })
  }

  const url = `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`

  try {
    const data = await $fetch<string[]>(url, {
      headers: {
        'X-Riot-Token': config.riotApiKey,
      },
    })

    return data
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.response?._data?.status?.message || 'Failed to fetch match IDs',
    })
  }
})
