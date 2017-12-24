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

export default function (currency, base, plain) {
	return new Promise((resolve, reject) => {
		base = base == "USDT" ? "USD" : base
		return axios.get(`https://api.bitfinex.com/v1/pubticker/${currency}${base}`)
			.then((res) => {
				const { data } = res
				let price = base == "USD" ? Number(data.last_price).toFixed(2) : data.last_price
				if (plain) {
					resolve(price)
				} else {
					resolve(`*Bitfinex* \`${price}\` ${base}\n`)
				}
			})
			.catch((error) => {
				if (error.response && error.response.data && error.response.data.message == "Unknown symbol") {
					// 找不到該幣種
					if (plain) {
						resolve(null)
					} else {
						resolve("")
					}
				} else {
					console.log("Error in Bitfinex", error)
					if (plain) {
						resolve(null)
					} else {
						resolve(`*Bitfinex* ❌\n`)
					}
				}
			})
	})
}
