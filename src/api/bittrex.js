// https://bittrex.com/api/v1.1/public/getticker?market=${market}
// base 要在前面 例如 BTC-LTC, USDT-BTC 不分大小寫
// 成功
// {"success":true,"message":"","result":{"Bid":0.01924700,"Ask":0.01924704,"Last":0.01924704}}
// 失敗
// {"success":false,"message":"INVALID_MARKET","result":null}

import axios from "axios"

export default function (currency, base) {
	return new Promise((resolve, reject) => {
		base = base == "USD" ? "USDT" : base
		return axios.get(`https://bittrex.com/api/v1.1/public/getticker?market=${base}-${currency}`)
			.then((res) => {
				const { result } = res.data
				if (result) {
					let price = base == "USDT" ? Number(result.Last).toFixed(2) : result.Last
					resolve(`*Bittrex* \`${price}\` ${base}\n`)
				} else {
					// 無結果
					resolve("")
				}
			})
			.catch((error) => {
				console.log("Error in Bittrex", error)
				resolve(`*Bittrex* ❌\n`)
			})
	})
}
