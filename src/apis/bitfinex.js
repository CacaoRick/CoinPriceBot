import axios from 'axios'

// funding pair
export async function fundingTicker (symbol) {
  try {
    const response = await axios.get(`https://api-pub.bitfinex.com/v2/ticker/${symbol}`)
    const change = response.data[8]
    const rate = response.data[9]

    return {
      symbol: symbol,
      rate: rate,
      displayRate: (100 * rate).toFixed(4) + '%',
      dailyChange: (change > 0 ? '+' : '') + (100 * change).toFixed(2) + '%',
    }
  } catch (error) {
    console.log(`[BITFINEX/fundingTicker/${symbol}] error`, error.message)
  }
}

// trading pair
export async function ticker (currency, base) {
  const symbol = `t${currency}${base}`
  try {
    const response = await axios.get(`https://api-pub.bitfinex.com/v2/ticker/${symbol}`)
    const change = response.data[5]
    const price = response.data[6]

    const factoryDigital = 5 - price.toFixed(0).length
    return {
      source: '`Bitfinex`',
      symbol,
      currency,
      base,
      price: price,
      displayPrice: price.toFixed(factoryDigital),
      dailyChange: (change > 0 ? '+' : '') + (100 * change).toFixed(2) + '%',
    }
  } catch (error) {
    console.log(`[BITFINEX/ticker/${symbol}] error`, error.message)
  }
}

export async function tickers (currencies) {
  const symbols = currencies.map(currency => 't' + currency + 'USD').join(',')
  const response = await axios.get(`https://api-pub.bitfinex.com/v2/tickers?symbols=${symbols}`)
  return response.data.map((data, index) => {
    // trading pair
    const symbol = data[0]
    const change = data[6]
    const price = data[7]

    const factoryDigital = 5 - price.toFixed(0).length
    return {
      source: '`Bitfinex`',
      symbol: symbol,
      currency: currencies[index],
      base: 'USD',
      price: price,
      displayPrice: price.toFixed(factoryDigital),
      dailyChange: (change > 0 ? '+' : '') + (100 * change).toFixed(2) + '%',
    }
  })
}

export default {
  fundingTicker,
  ticker,
  tickers,
}
