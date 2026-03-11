export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const matchId = getRouterParam(event, 'matchId')

  if (!matchId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'matchId is required',
    })
  }

  const url = `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`

  try {
    const data = await $fetch(url, {
      headers: {
        'X-Riot-Token': config.riotApiKey,
      },
    })

    return data
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.response?._data?.status?.message || 'Failed to fetch match details',
    })
  }
})
