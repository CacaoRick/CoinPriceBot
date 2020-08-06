import _ from 'lodash'
import axios from 'axios'

export async function getTicker (currency, base) {
  base = base === 'USD' ? 'USDT' : base
  const symbol = `${currency}_${base}`
  try {
    const response = await axios.get(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${symbol}`)
    const price = _.get(response, 'data.result.data.a', false) // last price
    const changePrice = _.get(response, 'data.result.data.c', 0)
    if (!price) throw new Error('trade data empty')

    const dailyChange = (changePrice > 0 ? '+' : '') + (100 * changePrice / (price - changePrice)).toFixed(2) + '%'

    const factoryDigital = 5 - price.toFixed(0).length

    return {
      source: '`Crypto.com`',
      symbol,
      currency,
      base,
      price: price,
      displayPrice: price.toFixed(factoryDigital),
      dailyChange: dailyChange,
    }
  } catch (error) {
    console.log(`[CRYPTO.COM/getTicker/${symbol}] error`, error.message)
  }
}

export default {
  getTicker,
}
