export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const gameName = String(query.gameName || '').trim()
  const tagLine = String(query.tagLine || '').trim()

  if (!gameName || !tagLine) {
    throw createError({
      statusCode: 400,
      statusMessage: 'gameName and tagLine are required',
    })
  }

  const encodedGameName = encodeURIComponent(gameName)
  const encodedTagLine = encodeURIComponent(tagLine)

  const url = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`

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
      statusMessage: error?.response?._data?.status?.message || 'Failed to fetch Riot account',
    })
  }
})