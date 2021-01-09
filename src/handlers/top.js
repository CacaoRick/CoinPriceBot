import marketcap from 'apis/marketcap'
import help from 'handlers/help'
import bot from 'libs/telegram'

export default async function topHandler (msg) {
  const params = msg.text.split(' ')
  const top = params[1] && !isNaN(params[1]) ? Number(params[1]) : 10
  if (params.length > 2) {
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

  try {
    const results = await marketcap.getTop(top)
    const list = results.map((result) => {
      const { cmc_rank: rank, symbol } = result
      const { price, percent_change_24h: change24h } = result.quote.USD
      const factoryDigital = 5 - price.toFixed(0).length

      const displayRank = String(rank).padEnd(2, ' ')
      const displaySymbol = symbol.padEnd(5, ' ')
      const displayPrice = price.toFixed(factoryDigital).padEnd(6, ' ')
      const displayChange = (change24h > 0 ? '+' : '') + change24h.toFixed(2) + '%'
      return `#${displayRank}\t${displaySymbol}\t$${displayPrice}\t(${displayChange})`
    })

    const messages = [
      `CoinMarketCap Top ${top}`,
      '```',
      ...list,
      '```',
    ]

    bot.editMessageText(
      messages.join('\n'),
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
}
