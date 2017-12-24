import _ from "lodash"
import axios from "axios"

// https://api.binance.com/api/v1/ticker/allPrices
// result array of {symbol: "ETHBTC", price: "0.04811600"}, {symbol: "LTCBTC", price: "0.01920700"} ...

export default function (currency, base) {
	return new Promise((resolve, reject) => {
		base = base == "USD" ? "USDT" : base
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
					resolve("")
				}

				// 根據 base 幣種整理 message
				let message = ""

				_.each(currencyPrices, (data) => {
					if (data.symbol.endsWith(base)) {
						let price = data.price
						if (base == "USDT") {
							price = Number(price).toFixed(2)
						}
						message = `*Binance* \`${data.price}\` ${base}\n`
					}
				})
				resolve(message)
			})
			.catch((error) => {
				console.log("Error in Binance", error)
				resolve(`*Binance* ❌`)
			})
	})
}
