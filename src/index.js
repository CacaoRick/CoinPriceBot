import db from 'libs/db'
import bot from 'libs/telegram'
import marketcap from 'libs/marketcap'
import bitfinex from 'libs/bitfinex'
import binance from 'libs/binance'
import cryptoCom from 'libs/crypto.com'
import updater from 'updater'

updater.start()

export const helpMessage = [
  '/price `<幣種1> [幣種2]`',
  '查詢 `幣種1` - `幣種2` 交易對，`幣種2` 預設為 USD/USDT',
  '例如查詢 ETH-USD：',
  '`/price ETH`',
  '查詢 ETH-BTC：',
  '`/price ETH BTC`',
  '',
  '/price `<幣種> <購入價格>`',
  '計算現在價格對購入價格漲跌幾％，價格單位為 USD/USDT',
  '例如查詢 1000 USD 購入的 ETH 目前漲跌幾％：',
  '`/price ETH 1000`',
  '',
  '/price `<數量> <幣種>`',
  '計算購入成本',
  '例如查詢 10000 CRO 購入成本：',
  '`/price 10000 CRO`',
  '',
  '/top',
  '列出 CoinMarketCap top 10',
  '',
  '目前支援的 API： `Bitfinex Binance Crypto.com`',
].join('\n')

function sendHelp (msg) {
  bot.sendMessage(msg.chat.id, helpMessage, {
    parse_mode: 'Markdown',
    reply_to_message_id: msg.message_id,
  })
}

bot.onText(/^\/help$/, (msg) => {
  sendHelp(msg)
})

bot.on('error', (error) => {
  console.log(error.message)
})

bot.onText(/^\/top/, async (msg) => {
  const params = msg.text.split(' ')
  const top = params[1] && !isNaN(params[1]) ? Number(params[1]) : 10
  if (params.length > 2) {
    sendHelp(msg)
    return
  }

  // 送出 Loading...
  const messageResponse = await bot.sendMessage(
    msg.chat.id,
    'Loading...',
    { reply_to_message_id: msg.message_id }
  )
  const messageToEdit = {
    chat_id: messageResponse.chat.id,
    message_id: messageResponse.message_id,
  }

  try {
    const results = await marketcap.getTop(top)
    const messages = results.map((result) => {
      const { cmc_rank: rank, symbol } = result
      const { price, percent_change_24h: change24h } = result.quote.USD

      const displayRank = String(rank).padEnd(2, ' ')
      const displaySymbol = symbol.padEnd(5, ' ')
      const factoryDigital = 5 - price.toFixed(0).length
      const displayPrice = price.toFixed(factoryDigital).padEnd(6, ' ')
      const dailyChange = (change24h > 0 ? '+' : '') + change24h.toFixed(2) + '%'
      return `#${displayRank}\t${displaySymbol}\t$${displayPrice}\t(${dailyChange})`
    })

    bot.editMessageText(
      `CoinMarketCap Top ${top}\n` + '```\n' + messages.join('\n') + '\n```',
      {
        ...messageToEdit,
        parse_mode: 'Markdown',
      },
    )
  } catch (error) {
    bot.editMessageText(
      '錯誤了QQ\n`' + error.message + '`',
      {
        ...messageToEdit,
        parse_mode: 'Markdown',
      },
    )
  }
})

bot.onText(/^\/price/, async (msg) => {
  const params = msg.text.split(' ')
  if (params.length === 1 || params.length > 3) {
    sendHelp(msg)
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
    sendHelp(msg)
    return
  }

  // 送出 Loading...
  const messageResponse = await bot.sendMessage(
    msg.chat.id,
    'Loading...',
    { reply_to_message_id: msg.message_id }
  )
  const messageToEdit = {
    chat_id: messageResponse.chat.id,
    message_id: messageResponse.message_id,
  }

  const promises = []
  promises.push(bitfinex.ticker(currency, base))
  promises.push(binance.dailyStats(currency, base))
  promises.push(cryptoCom.getTicker(currency, base))

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
        const cost = (targetAmount * result.price).toFixed(2)
        messages.push(`${cost} ${result.base}`)
        break
      case 'PROFIT':
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
      messageToEdit
    )
  }
})

bot.onText(/^\/pin$/, async (msg) => {
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    await bot.sendMessage(
      msg.chat.id,
      '群組才能用',
      { reply_to_message_id: msg.message_id }
    )
    return
  }

  const memberInfo = await bot.getChatMember(msg.chat.id, msg.from.id)
  if (memberInfo.status !== 'creator' && memberInfo.status !== 'administrator') {
    await bot.sendMessage(
      msg.chat.id,
      '群組管理員才能用',
      { reply_to_message_id: msg.message_id }
    )
    return
  }

  const priceMessageResponse = await bot.sendMessage(msg.chat.id, 'Loading...')
  const statusMessageResponse = await bot.sendMessage(msg.chat.id, 'Loading...')

  const chatInfo = await bot.getChat(msg.chat.id)
  console.log('chatInfo', chatInfo)
  if (chatInfo.permissions.can_pin_messages) {
    try {
      await bot.pinChatMessage(msg.chat.id, priceMessageResponse.message_id, { disable_notification: true })
    } catch (error) {
      console.log('pinChatMessage error', error.message)
    }
  }

  db.main.set(msg.chat.id, {
    title: chatInfo.title,
    priceMessage: {
      chat_id: msg.chat.id,
      message_id: priceMessageResponse.message_id,
    },
    statusMessage: {
      chat_id: msg.chat.id,
      message_id: statusMessageResponse.message_id,
    },
  }).write()
})

bot.onText(/^\/stop$/, async (msg) => {
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    await bot.sendMessage(
      msg.chat.id,
      '群組才能用',
      { reply_to_message_id: msg.message_id }
    )
    return
  }

  const memberInfo = await bot.getChatMember(msg.chat.id, msg.from.id)
  if (memberInfo.status !== 'creator' && memberInfo.status !== 'administrator') {
    await bot.sendMessage(
      msg.chat.id,
      '群組管理員才能用',
      { reply_to_message_id: msg.message_id }
    )
    return
  }

  const priceMessage = db.main.get(msg.chat.id).get('priceMessage').value()

  try {
    await bot.editMessageText('已停止更新', priceMessage)
    await bot.unpinChatMessage(priceMessage.chat_id)
  } catch (error) {
    console.log('unpinChatMessage error', error.message)
  }

  db.main.unset(msg.chat.id).write()
})
