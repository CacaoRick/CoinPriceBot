// https://www.bitoex.com/api/v1/get_rate
// 需用 cloudscraper
// {"buy":493180,"sell":418248,"timestamp":1514106458}

import axios from "axios"

export default function (plain) {
	return new Promise((resolve, reject) => {
		return axios.get(`https://www.bitoex.com/api/v1/get_rate`)
			.then((res) => {
				const { data } = res
				if (plain) {
					resolve({
						buy: data.buy.toFixed(0),
						sell: data.sell.toFixed(0),
					})
				} else {
					resolve(`*BitoEx* TWD\n買: \`${data.buy.toFixed(0)}\`\n賣: \`${data.sell.toFixed(0)}\`\n`)
				}
			})
			.catch((error) => {
				console.log("Error in BitoEx", error)
				if (plain) {
					resolve(null)
				} else {
					resolve(`*BitoEx* ❌\n`)
				}
			})
	})
}
