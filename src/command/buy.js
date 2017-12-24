import api from "../api"

export default function (ctx) {
	const command = ctx.message.text.split(" ")
	if (command.length != 3) {
		ctx.replyWithMarkdown("參數怪怪der，範例：\n`/buy 50.3 mco`")
		return
	}
	const amount = Number(command[1])
	const currency = command[2].toUpperCase()

	if (!isFinite(amount) || amount <= 0) {
		ctx.replyWithSticker("CAADBQADKwMAAonzDAUWfMQlaopeRwI")
		return
	}

	console.log(`/buy ${amount} ${currency}`)

	let messageResult = ""
	if (currency != "BTC") {
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
				messageResult += `\`${btcPrice}\` BTC (by ${platform})\n`
				return ctx.reply(messageResult, {
					reply_to_message_id: ctx.message.message_id,
					parse_mode: "Markdown",
				})
					.then((result) => {
						return getTwdPrice(btcPrice)
							.then((message) => {
								messageResult += message
								return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, messageResult, {
									parse_mode: "Markdown",
								})
							})
					})
			})
			.catch((error) => {
				console.log("Error in /buy", ctx.message.text, error)
				return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, `好像錯誤了`)
			})
	} else {
		return ctx.reply("loading...", {
			reply_to_message_id: ctx.message.message_id,
			parse_mode: "Markdown",
		})
			.then((result) => {
				return getTwdPrice(amount)
					.then((message) => {
						messageResult += message
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, messageResult, {
							parse_mode: "Markdown",
						})
					})
			})
	}
}

function getTwdPrice(btcPrice) {
	return new Promise((resolve, reject) => {
		const promises = []
		promises.push(api.bitoex(true))
		promises.push(api.maicoin("BTC", true))
		Promise.all(promises)
			.then((results) => {
				let bitoexPrice = Number(results[0].buy) > 0 ? Number(results[0].buy) : null
				let maicoinPrice = Number(results[1].buy) > 0 ? Number(results[1].buy) : null
				console.log(btcPrice, bitoexPrice, maicoinPrice)
				let twdPrice = null
				let platform = null
				if (bitoexPrice && maicoinPrice) {
					twdPrice = bitoexPrice <= maicoinPrice ? btcPrice * bitoexPrice : btcPrice * maicoinPrice
					platform = bitoexPrice <= maicoinPrice ? "BitoEx" : "MaiCoin"
				} else if (bitoexPrice) {
					twdPrice = btcPrice * bitoexPrice
					platform = "BitoEx"
				} else if (maicoinPrice) {
					twdPrice = btcPrice * maicoinPrice
					platform = "MaiCoin"
				}

				if (twdPrice && platform) {
					resolve(`\`${twdPrice.toFixed(0)}\` TWD (by ${platform})`)
				} else {
					// 沒有結果
					resolve("API 異常，無法換算 TWD")
				}
			})
			.catch((error) => {
				console.log("Error in /buy getTwdPrice")
				resolve("API 異常，無法換算 TWD")
			})
	})
}
