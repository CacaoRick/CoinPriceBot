import binance from 'apis/binance'
import bitfinex from 'apis/bitfinex'
import cryptoCom from 'apis/crypto.com'
import ftx from 'apis/ftx'
import help from 'handlers/help'
import bot from 'libs/telegram'

export default async function priceHandler (msg) {
  const params = msg.text.split(' ').filter(p => p)
  if (params.length === 1 || params.length > 3) {
    help(msg)
    return
  }

  let action = null
  let currency = null
  let base = null
  let targetAmount = null
  let basePrice = null

  if (params.length === 2) {
    // 計算價格，base 使用預設值 USD
    action = 'PRICE'
    currency = params[1].toUpperCase()
    base = 'USD'
    console.log(`[${action}] ${currency}-${base}`)
  }
  if (params.length === 3) {
    if (isNaN(params[1]) && isNaN(params[2])) {
      // 計算價格，有給 currency 和 base
      action = 'PRICE'
      currency = params[1].toUpperCase()
      base = params[2].toUpperCase()
      console.log(`[${action}] ${currency}-${base}`)
    }
    if (!isNaN(params[1]) && isNaN(params[2])) {
      // 計算購買 targetAmount x currency 的成本
      action = 'COST'
      targetAmount = Math.abs(Number(params[1]))
      currency = params[2].toUpperCase()
      base = 'USD'
      console.log(`[${action}] ${targetAmount} × ${currency}`)
    }
    if (isNaN(params[1]) && !isNaN(params[2])) {
      // 計算用 basePrice 售出 currency 的獲利％
      action = 'PROFIT'
      basePrice = Math.abs(Number(params[2]))
      currency = params[1].toUpperCase()
      base = 'USD'
      console.log(`[${action}] ${currency} base: ${basePrice}`)
    }
  }

  if (action === null) {
    help(msg)
    return
  }

  // 送出 Loading...
  const messageResponse = await bot.sendMessage(
    msg.chat.id,
    'Loading...',
    {
      reply_to_message_id: msg.message_id,
      disable_notification: true,
    },
  )
  const messageToEdit = {
    chat_id: messageResponse.chat.id,
    message_id: messageResponse.message_id,
  }

  const promises = []
  promises.push(bitfinex.ticker(currency, base))
  promises.push(binance.dailyStats(currency, base))
  promises.push(cryptoCom.getTicker(currency, base))
  promises.push(ftx.getMarkets(currency, base))

  const messages = []
  const results = await Promise.all(promises)
  results.forEach((result) => {
    if (!result) return
    messages.push(result.source)
    switch (action) {
      case 'PRICE':
        messages.push(`${result.displayPrice} ${result.base} (${result.dailyChange})`)
        break
      case 'COST':
        // eslint-disable-next-line no-case-declarations
        const cost = (targetAmount * result.price).toFixed(2)
        messages.push(`${cost} ${result.base}`)
        break
      case 'PROFIT':
        // eslint-disable-next-line no-case-declarations
        const profit = (result.price - basePrice > 0 ? '+' : '') + (100 * (result.price - basePrice) / basePrice).toFixed(2) + '%'
        messages.push(`${result.displayPrice} ${result.base} (${profit})`)
        break
      default:
        break
    }
  })

  if (messages.length > 0) {
    bot.editMessageText(
      messages.join('\n'),
      {
        ...messageToEdit,
        parse_mode: 'Markdown',
      },
    )
  } else {
    bot.editMessageText(
      '找不到QQ',
      messageToEdit,
    )
  }
}
