import help from 'handlers/help'
import db from 'libs/db'
import bot from 'libs/telegram'
import moment from 'moment'

export default async function fundingFeeHandler (msg) {
  const params = msg.text.split(' ')
  if (params.length !== 1 && params.length !== 2) {
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

  let messages = []

  if (params.length === 1) {
    let time = null
    const fundingFeeMessages = db.fundingFee
      .get('fundingFees')
      .orderBy(['fundingFeeRate'], ['desc'])
      .take(10)
      .map(fundingFee => {
        time = fundingFee.updateAt
        return `${fundingFee.symbol} ${fundingFee.fundingFeeRate.toFixed(4)}%`
      })
      .value()

    messages = [
      '資金費率 Top 10',
      '```',
      ...fundingFeeMessages,
      '```',
      '更新時間: ' + moment(time).tz('Asia/Taipei').format('HH:mm:ss'),
    ]
  }

  if (params.length === 2) {
    const currency = params[1].toUpperCase()
    const currencies = currency.split(',').map(c => c.trim())
    const fundingFeeMessages = db.fundingFee
      .get('fundingFees')
      .filter(fundingFee => fundingFee.symbol.startsWith(currency))
      .map(fundingFee => {
        time = fundingFee.updateAt
        return `${fundingFee.symbol} ${fundingFee.fundingFeeRate.toFixed(4)}%`
      })
      .value()

    const { symbol, fundingFeeRate } = fundingFee

    messages = [
      '```',
      ...fundingFeeMessages,
      '```',
      '更新時間: ' + moment(time).tz('Asia/Taipei').format('HH:mm:ss'),
    ]
  }

  try {
    bot.editMessageText(
      messages.join('\n'),
      {
        ...messageToEdit,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
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
