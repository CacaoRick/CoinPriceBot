import _ from "lodash"
import axios from "axios"

// https://api.binance.com/api/v1/ticker/allPrices
// result array of {symbol: "ETHBTC", price: "0.04811600"}, {symbol: "LTCBTC", price: "0.01920700"} ...

export default function (currency, base) {
  return axios.get("https://api.binance.com/api/v1/ticker/allPrices")
    .then((res) => {
      const allPrices = res.data

      // 先找出目標幣種的所有價錢
      const currencyPrices = []
      _.each(allPrices, (data) => {
        if (data.symbol.startsWith(currency)) {
          currencyPrices.push(data)
        }
      })

      if (currencyPrices.length == 0) {
        // 找不到目標幣種
        return ""
      }

      // 根據 base 幣種整理 message
      let message = ""
      if (base) {
        _.each(currencyPrices, (data) => {
          if (data.symbol.endsWith(base)) {
            let price = data.price
            if (base == "USDT") {
              price = Number(price).toFixed(2)
            }
            message = `*Binance* \`${data.price}\` ${base}\n`
          }
        })
      } else {
        // 沒設定 base，找 BTC 和 USDT
        _.each(currencyPrices, (data) => {
          if (data.symbol.endsWith("USDT")) {
            message = `Binance ${Number(data.price).toFixed(2)} USDT\n`
          }
          if (data.symbol.endsWith("BTC")) {
            message = `Binance ${data.price} BTC\n`
          }
        })
      }
      return message
    })
}
