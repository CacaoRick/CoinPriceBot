import bot from 'libs/telegram'

const helpMessage = [
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
  '/gas',
  '列出 gas fee',
  '',
  '目前支援的 API： `Bitfinex Binance Crypto.com`',
].join('\n')

export default function helpHandler (msg) {
  bot.sendMessage(msg.chat.id, helpMessage, {
    parse_mode: 'Markdown',
    reply_to_message_id: msg.message_id,
  })
}
