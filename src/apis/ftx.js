import axios from 'axios'
import crypto from 'crypto'

const endpoint = 'https://ftx.com/api'
const ftxKey = process.env.FTX_KEY
const ftxSecret = process.env.FTX_SECRET

function getSignature (props) {
  const { time, method, path, body, ftxSecret } = props

  return crypto
    .createHmac('SHA256', ftxSecret)
    .update(`${time}${method}/api${path}${method === 'POST' ? JSON.stringify(body) : ''}`)
    .digest('hex')
};

export async function getLendingRate (coin) {
  const time = Date.now()
  const path = '/spot_margin/lending_rates'
  try {
    const response = await axios.get(`${endpoint}${path}`, {
      headers: {
        'content-type': 'application/json',
        'FTX-KEY': ftxKey,
        'FTX-SIGN': getSignature({ ftxSecret, time, method: 'GET', path }),
        'FTX-TS': time,
      },
    })
    const { success, error, result } = response.data
    if (!success || !result) {
      console.log(`[FTX${path}] error`, error)
      return
    }

    const { previous: rate } = result.find(r => r.coin === coin)

    return {
      title: 'FTX ' + coin,
      symbol: coin,
      rate: rate,
      displayRate: (100 * rate).toFixed(4) + '%',
      dailyChange: null,
    }
  } catch (error) {
    console.log(`[FTX${path}] error`, error.message)
  }
}

export async function getMarkets (currency, base = 'USD') {
  let symbol = currency
  if (!currency.includes('/') || !currency.includes('-')) {
    symbol = `${currency}/${base}`
  }

  try {
    const response = await axios.get(`https://ftx.com/api/markets/${symbol}`)
    const { success, error, result } = response.data
    if (!success || !result) {
      console.log(`[FTX/markets/${symbol}] error`, error)
      return
    }

    const price = result.last
    const change = result.change24h

    const factoryDigital = 5 - price.toFixed(0).length
    return {
      source: '`FTX`',
      symbol,
      currency,
      base,
      price: price,
      displayPrice: price.toFixed(factoryDigital),
      dailyChange: (change > 0 ? '+' : '') + (100 * change).toFixed(2) + '%',
    }
  } catch (error) {
    console.log(`[FTX/markets/${symbol}] error`, error.message)
  }
}

export default {
  getLendingRate,
  getMarkets,
}
