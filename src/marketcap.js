import axios from 'axios'
import db from 'db'

export default async function getTop (top = 3) {
  const response = await axios.get(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest`,
    {
      params: {
        start: '1',
        limit: String(top),
        convert: 'USD',
      },
      headers: {
        'X-CMC_PRO_API_KEY': db.config.get('coinmarketcapApiKey').value(),
      },
    }
  )

  return response.data.data
}
