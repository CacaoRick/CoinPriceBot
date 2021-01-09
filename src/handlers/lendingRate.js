import bitfinex from 'apis/bitfinex'
import ftx from 'apis/ftx'
import bot from 'libs/telegram'

export default async function lendingRateHandler (msg) {
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
  promises.push(bitfinex.fundingTicker('fUSD'))
  promises.push(ftx.getLendingRate('USD'))
  promises.push(bitfinex.fundingTicker('fUST'))
  promises.push(ftx.getLendingRate('USDT'))

  const messages = []
  const results = await Promise.all(promises)
  results.forEach((result) => {
    if (!result) return
    messages.push(`${result.title}: \`${result.displayRate}\``)
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
