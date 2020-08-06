import Binance from 'binance-api-node'

export const client = Binance()

export async function dailyStats (currency, base) {
  base = base === 'USD' ? 'USDT' : base
  const symbol = `${currency}${base}`
  try {
    const response = await client.dailyStats({ symbol })
    const price = Number(response.lastPrice)
    const factoryDigital = 5 - price.toFixed(0).length

    return {
      source: '`Binance`',
      symbol,
      currency,
      base,
      price: price,
      displayPrice: price.toFixed(factoryDigital),
      dailyChange: (Number(response.priceChangePercent) > 0 ? '+' : '') + response.priceChangePercent + '%',
    }
  } catch (error) {
    console.log(`[BINANCE/dailyStats/${symbol}] error`, error.message)
  }
}

export default {
  client,
  dailyStats,
}
