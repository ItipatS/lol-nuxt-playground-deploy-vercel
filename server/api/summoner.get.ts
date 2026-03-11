export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const puuid = String(query.puuid || '').trim()

  if (!puuid) {
    throw createError({ statusCode: 400, statusMessage: 'puuid is required' })
  }

  const url = `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`

  try {
    const data = await $fetch(url, {
      headers: { 'X-Riot-Token': config.riotApiKey },
    })
    return data
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.response?._data?.status?.message || 'Failed to fetch summoner',
    })
  }
})
