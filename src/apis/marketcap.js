import axios from 'axios'

export async function getTop (top = 3) {
  const response = await axios.get(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
    {
      params: {
        start: '1',
        limit: String(top),
        convert: 'USD',
      },
      headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
      },
    },
  )

  return response.data.data
}

export default {
  getTop,
}
