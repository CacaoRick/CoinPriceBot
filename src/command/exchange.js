import api from "../api"
import log from "../utils/log"

export default function (ctx) {
	log(ctx)

	const command = ctx.message.text.split(" ")
	if (command.length !== 3) {
		ctx.replyWithMarkdown(`參數怪怪der，範例：\n\`${command[0]} 50.3 mco\``)
		return
	}
	let action = command[0].replace("/", "")
	if (action.startsWith("sell")) {
		action = "sell"
	}
	if (action.startsWith("buy")) {
		action = "buy"
	}
	if (action.startsWith("exchange") || action.startsWith("avg")) {
		action = "avg"
	}
	const amount = Number(command[1])
	const currency = command[2].toUpperCase()

	if (isNaN(amount) || amount <= 0 || !isNaN(currency)) {
		ctx.replyWithMarkdown(`參數怪怪der，範例：\n\`${command[0]} 50.3 mco\``)
		return
	}

	if (!isFinite(amount)) {
		ctx.replyWithSticker("CAADBQADKwMAAonzDAUWfMQlaopeRwI")
		return
	}

	console.log(`/${action} ${amount} ${currency}`)

	let messageResult = ""
	if (currency !== "BTC") {
		// 先換成 BTC
		const promises = []
		promises.push(api.binance(currency, "BTC", true))
		promises.push(api.bitfinex(currency, "BTC", true))
		Promise.all(promises)
			.then((results) => {
				let btcPrice = null
				let platform = null
				if (Number(results[0]) > 0) {
					btcPrice = (amount * Number(results[0])).toFixed(8)
					platform = "Binance"
				} else if (Number(results[1]) > 0) {
					btcPrice = (amount * Number(results[1])).toFixed(8)
					platform = "Bitfinex"
				}

				if (btcPrice == null) {
					return ctx.reply("交易所API異常或不支援該幣種", {
						reply_to_message_id: ctx.message.message_id,
						parse_mode: "Markdown",
					})
				} else {
					messageResult += `\`${btcPrice}\` BTC (${platform})\n`
					return ctx.reply(messageResult, {
						reply_to_message_id: ctx.message.message_id,
						parse_mode: "Markdown",
					})
						.then((result) => {
							return getTwdPrice(action, btcPrice)
								.then((message) => {
									messageResult += message
									return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, messageResult, {
										parse_mode: "Markdown",
									})
								})
						})
				}
			})
			.catch((error) => {
				console.log(`Error in /${action}`, ctx.message.text, error)
				return ctx.reply(`好像錯誤了`, {
					reply_to_message_id: ctx.message.message_id,
					parse_mode: "Markdown",
				})
			})
	} else {
		return ctx.reply("loading...", {
			reply_to_message_id: ctx.message.message_id,
			parse_mode: "Markdown",
		})
			.then((result) => {
				return getTwdPrice(action, amount)
					.then((message) => {
						messageResult += message
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, messageResult, {
							parse_mode: "Markdown",
						})
					})
			})
	}
}

function getTwdPrice(action, btcPrice) {
	return new Promise((resolve) => {
		const promises = []
		promises.push(api.bitoex(true))
		promises.push(api.maicoin("BTC", true))
		Promise.all(promises)
			.then((results) => {
				let bitoexPrice = Number(results[0][action]) > 0 ? Number(results[0][action]) : null
				let maicoinPrice = Number(results[1][action]) > 0 ? Number(results[1][action]) : null
				let twdPrice = null
				let platform = null
				if (action === "avg") {
					let result = ""
					if (bitoexPrice) {
						result = result + `\`${bitoexPrice.toFixed(0)}\` TWD (BitoEx)\n`
					}
					if (maicoinPrice) {
						result = result + `\`${maicoinPrice.toFixed(0)}\` TWD (MaiCoin)\n`
					}

					if (result !== "") {
						resolve(result)
					} else {
						// 沒有結果
						resolve("API 異常，無法換算 TWD")
					}
				} else {
					if (action === "buy" && bitoexPrice && maicoinPrice) {
						twdPrice = bitoexPrice <= maicoinPrice ? btcPrice * bitoexPrice : btcPrice * maicoinPrice
						platform = bitoexPrice <= maicoinPrice ? "BitoEx" : "MaiCoin"
					} else if (action === "sell" && bitoexPrice && maicoinPrice) {
						twdPrice = bitoexPrice >= maicoinPrice ? btcPrice * bitoexPrice : btcPrice * maicoinPrice
						platform = bitoexPrice >= maicoinPrice ? "BitoEx" : "MaiCoin"
					} else if (bitoexPrice) {
						twdPrice = btcPrice * bitoexPrice
						platform = "BitoEx"
					} else if (maicoinPrice) {
						twdPrice = btcPrice * maicoinPrice
						platform = "MaiCoin"
					}

					if (twdPrice && platform) {
						resolve(`\`${twdPrice.toFixed(0)}\` TWD (${platform})`)
					} else {
						// 沒有結果
						resolve("API 異常，無法換算 TWD")
					}
				}
			})
			.catch((error) => {
				console.error(`Error in /${action} getTwdPrice`, error)
				resolve("API 異常，無法換算 TWD")
			})
	})
}
