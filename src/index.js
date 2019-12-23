import bitfinex from 'bitfinex'
import binance from 'binance'
import db from 'db'
import bot from 'telegram'
import updater from 'updater'

updater.start()

async function retryWithBinance (currency, base, messageToEdit) {
  try {
    const binanceResponse = await binance.dailyStats({ symbol: `${currency}${base}` })
    bot.editMessageText(
      `${binanceResponse.lastPrice} ${base}`,
      messageToEdit
    )
  } catch (error) {
    bot.editMessageText(
      '錯誤了',
      messageToEdit
    )
  }
}

export const helpMessage = [
  `/price \`[幣種] [幣種]\``,
  `察看目前的價格，預設以 USD 查詢，例如：`,
  `\`/price eth\``,
  `後方可加上第二種貨幣，例如要查 ETH-BTC 價格：`,
  `\`/price eth btc\``,
].join('\n')

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, helpMessage, {
    parse_mode: 'Markdown',
    reply_to_message_id: msg.message_id,
  })
})

bot.on('error', (error) => {
  console.log(error)
})

bot.onText(/\/price/, async (msg) => {
  const params = msg.text.split(' ')
  if (params.length === 1) {
    bot.sendMessage(msg.chat.id, helpMessage, {
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id,
    })
    return
  }

  const currency = params[1] ? params[1].toUpperCase() : 'BTC'
  const base = params[2] ? params[2].toUpperCase() : 'USD'

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

  try {
    const apiResponse = await bitfinex.lastPrice(`t${currency}${base}`)
    if (apiResponse[0] === 'error') {
      bot.editMessageText(
        apiResponse[2],
        messageToEdit
      )
      throw new Error('bitfinex response error', apiResponse[2])
    }

    bot.editMessageText(
      `${apiResponse[6]} ${base}`,
      messageToEdit
    )
  } catch (error) {
    console.log('error', error.message)
    retryWithBinance(currency, base, messageToEdit)
  }
})

bot.onText(/\/pin/, async (msg) => {
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

bot.onText(/\/stop/, async (msg) => {
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
