import gas from 'apis/gas'
import help from 'handlers/help'
import bot from 'libs/telegram'

export default async function gasHandler (msg) {
  const params = msg.text.split(' ').filter(p => p)
  if (params.length > 1) {
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
    const formatMessage = (picker, data, denominator) => picker.map(({ title, key }) => `${title}: \`${Number.parseInt(data[key] / denominator)}\``)

    const { gasnowData, ethgasAPIData } = await gas.getGas()

    const messages = [
      '[GAS NOW](https://www.gasnow.org/)',
      ...formatMessage([
        { title: 'Rapid (< 15 Seconds)', key: 'rapid' },
        { title: 'Fast (< 1 Minute)', key: 'fast' },
        { title: 'Standard (< 3 Minute)', key: 'standard' },
        { title: 'Slow (> 10 Minute)', key: 'slow' }]
      , gasnowData, Math.pow(10, 9)),
      '',
      '[ETH GAS STATION](https://ethgasstation.info/)',
      ...formatMessage([
        { title: 'TRADER (< 30 seconds)', key: 'fastest' },
        { title: 'FAST ( < 2 minutes)', key: 'fast' },
        { title: 'STANDARD (< 5 minutes)', key: 'average' },
        { title: 'Slow (< 30 minutes)', key: 'safeLow' }]
      , ethgasAPIData, Math.pow(10, 1)),
    ]

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
