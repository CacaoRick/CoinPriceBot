import axios from 'axios'

export async function lastPrice (symbol) {
  const response = await axios.get(`https://api-pub.bitfinex.com/v2/ticker/${symbol}`)
  return response.data
}

export async function lastPrices (symbols) {
  const response = await axios.get(`https://api-pub.bitfinex.com/v2/tickers?symbols=${symbols}`)
  return response.data
}

export default {
  lastPrice,
  lastPrices,
}
