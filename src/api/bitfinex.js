// v1
// https://api.bitfinex.com/v1/pubticker/symbol
// BTCUSD, ETHUSD...
// 
// 找到
// {
//   "mid":"244.755",
//   "bid":"244.75",
//   "ask":"244.76",
//   "last_price":"244.82",
//   "low":"244.2",
//   "high":"248.19",
//   "volume":"7842.11542563",
//   "timestamp":"1444253422.348340958"
// }
// 
// 找不到
// {
//   "message": "Unknown symbol"
// }

import axios from "axios"

export default function (currency, base) {
  base = base == null ? "USD" : base
  return axios.get(`https://api.bitfinex.com/v2/ticker/t${currency}${base}`)
    .then((res) => {
      const { data } = res

      if (data.message == "Unknown symbol") {
        // 找不到該幣種
        return ""
      }

      return `*Bitfinex* \`${data.last_price}\` ${base}\n`
    })
}
