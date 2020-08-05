import _ from 'lodash'
import axios from 'axios'
import binance from 'binance'
import bitfinex from 'bitfinex'
import db from 'db'
import bot from 'telegram'
import updater from 'updater'

updater.start()

export const helpMessage = [
  '/price `<幣種1> [幣種2]`',
  '查詢 `幣種1` - `幣種2` 交易對，`幣種2` 預設為 USD/USDT',
  '例如查詢 ETH-USD：',
  '`/price eth`',
  '查詢 ETH-BTC：',
  '`/price eth btc`',
  '',
  '/price `<幣種> <購入價格>`',
  '計算現在價格對購入價格漲跌幾％，價格單位為 USD/USDT',
  '例如查詢 1000 USD 購入的 ETH 目前漲跌幾％：',
  '`/price ETH 1000`',
  '目前支援的 API： `Bitfinex Binance Crypto.com`',
].join('\n')

bot.onText(/^\/help$/, (msg) => {
  bot.sendMessage(msg.chat.id, helpMessage, {
    parse_mode: 'Markdown',
    reply_to_message_id: msg.message_id,
  })
})

bot.on('error', (error) => {
  console.log(error)
})

bot.onText(/^\/price/, async (msg) => {
  const params = msg.text.split(' ')
  if (params.length === 1) {
    bot.sendMessage(msg.chat.id, helpMessage, {
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id,
    })
    return
  }

  const currency = params[1] ? params[1].toUpperCase() : 'BTC'
  let base = 'USD'
  let basePrice = 0
  if (params[2]) {
    if (isNaN(params[2])) {
      // 正常換算
      base = params[2].toUpperCase()
    } else {
      basePrice = Number(params[2])
    }
  } 

  // 送出 Loading...
  const messageResponse = await bot.sendMessage(
    msg.chat.id,
    'Loading...',
    {
      reply_to_message_id: msg.message_id,
    }
  )
  const messageToEdit = {
    chat_id: messageResponse.chat.id,
    message_id: messageResponse.message_id,
  }

  const messages = []

  // Bitfinex
  try {
    const apiResponse = await bitfinex.lastPrice(`t${currency}${base}`)
    if (apiResponse[0] === 'error') {
      bot.editMessageText(
        apiResponse[2],
        messageToEdit
      )
      throw new Error('bitfinex response error', apiResponse[2])
    }
    
    const price = apiResponse[6]
    const factoryDigital = 5 - price.toFixed(0).length
    if (basePrice !== 0) {
      const diffPercent = (price - basePrice > 0 ? '+' : '') + (100 * (price - basePrice) / basePrice ).toFixed(2)+ '%'
      messages.push('`Bitfinex`')
      messages.push(`${price.toFixed(factoryDigital)} USD (${diffPercent})`)
    } else {
      const dailyChange = (apiResponse[5] > 0 ? '+' : '') + (apiResponse[5] * 100).toFixed(2) + '%'
      messages.push('`Bitfinex`')
      messages.push(`${price.toFixed(factoryDigital)} ${base} (${dailyChange})`)
    }
  } catch (error) {
    console.log('bitfinex error', error.message)
  }

  // Binance
  try {
    const binanceResponse = await binance.dailyStats({ symbol: `${currency}${base === 'USD' ? 'USDT' : base}` })
    const price = Number(binanceResponse.lastPrice)
    const factoryDigital = 5 - price.toFixed(0).length

    if (basePrice !== 0) {
      const diffPercent = (price - basePrice > 0 ? '+' : '') + (100 * (price - basePrice) / basePrice ).toFixed(2)+ '%'
      messages.push('`Binance`')
      messages.push(`${price.toFixed(factoryDigital)} USDT (${diffPercent})`)
    } else {
      const dailyChange = (Number(binanceResponse.priceChangePercent) > 0 ? '+' : '') + binanceResponse.priceChangePercent + '%'
      messages.push('`Binance`')
      messages.push(`${price.toFixed(factoryDigital)} ${base === 'USD' ? 'USDT' : base} (${dailyChange})`)
    }
  } catch (error) {
    console.log('binance error', error.message)
  }

  // Crypto.com
  try {
    // https://exchange-docs.crypto.com/#public-get-ticker
    const response = await axios.get(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${currency}_${base === 'USD' ? 'USDT' : base}`)
    const price = _.get(response, 'data.result.data.a', false) // last price

    if (price) {
      const factoryDigital = 5 - price.toFixed(0).length
      if (basePrice !== 0) {
        const diffPercent = (price - basePrice > 0 ? '+' : '') + (100 * (price - basePrice) / basePrice ).toFixed(2)+ '%'
        messages.push('`crypto.com`')
        messages.push(`${price.toFixed(factoryDigital)} USDT (${diffPercent})`)
      } else {
        const changePrice = _.get(response, 'data.result.data.c', 0)
        const dailyChange = (changePrice > 0 ? '+' : '') + (100 * changePrice / (price - changePrice)).toFixed(2) + '%'
        messages.push('`crypto.com`')
        messages.push(`${price.toFixed(factoryDigital)} ${base === 'USD' ? 'USDT' : base} (${dailyChange})`)
      }
    }
  } catch (error) {
    console.log('crypto.com error', error.message)
  }

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
    return
  }

  const memberInfo = await bot.getChatMember(msg.chat.id, msg.from.id)
  if (memberInfo.status !== 'creator' && memberInfo.status !== 'administrator') {
    return
  }

  const priceMessageResponse = await bot.sendMessage(msg.chat.id, 'Loading...')
  const statusMessageResponse = await bot.sendMessage(msg.chat.id, 'Loading...')

  try {
    await bot.pinChatMessage(msg.chat.id, priceMessageResponse.message_id, { disable_notification: true })
  } catch (error) {
    console.log('pinChatMessage error', error.message)
  }

  db.main.set(msg.chat.id, {
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
    return
  }

  const memberInfo = await bot.getChatMember(msg.chat.id, msg.from.id)
  if (memberInfo.status !== 'creator' && memberInfo.status !== 'administrator') {
    return
  }

  const priceMessage = db.main.get(msg.chat.id).get('priceMessage').value()

  try {
    await bot.editMessageText('已停止更新', priceMessage)
    await bot.unpinChatMessage(priceMessage.chat_id)
  } catch (error) {
    console.log('pinChatMessage error', error.message)
  }

  db.main.unset(msg.chat.id).write()
})
