import api from "../api"

export default function (ctx) {
	const command = ctx.message.text.split(" ")
	const currency = command[1] ? command[1].toUpperCase() : "BTC"
	const base = command[2] ? command[2].toUpperCase() : "USD"

	console.log(`/price ${currency} ${base}`)

	// 送出 Loading...
	ctx.reply("Loading...", {
		reply_to_message_id: ctx.message.message_id,
	})
		.then((result) => {
			const promises = []
			let twdResultMessages = ""
			let resultMessages = ""

			// 多找 BitoEx
			if (currency === "BTC") {
				const bitoex = api.bitoex()
					.then((message) => {
						if (message !== "") {
							twdResultMessages += message
							return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, twdResultMessages + resultMessages, {
								parse_mode: "Markdown",
							})
						}
					})
				promises.push(bitoex)
			}

			// 多找 MaiCoin
			if (currency === "BTC" || currency === "ETH" || currency === "LTC") {
				const maicoin = api.maicoin(currency)
					.then((message) => {
						if (message !== "") {
							twdResultMessages += message
							return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, twdResultMessages + resultMessages, {
								parse_mode: "Markdown",
							})
						}
					})
				promises.push(maicoin)
			}

			const binance = api.binance(currency, base)
				.then((message) => {
					if (message !== "") {
						resultMessages += message
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, twdResultMessages + resultMessages, {
							parse_mode: "Markdown",
						})
					}
				})
			promises.push(binance)

			const bitfinex = api.bitfinex(currency, base)
				.then((message) => {
					if (message !== "") {
						resultMessages += message
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, twdResultMessages + resultMessages, {
							parse_mode: "Markdown",
						})
					}
				})
			promises.push(bitfinex)

			const bittrex = api.bittrex(currency, base)
				.then((message) => {
					if (message !== "") {
						resultMessages += message
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, twdResultMessages + resultMessages, {
							parse_mode: "Markdown",
						})
					}
				})
			promises.push(bittrex)

			const okex = api.okex(currency, base)
				.then((message) => {
					if (message !== "") {
						resultMessages += message
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, twdResultMessages + resultMessages, {
							parse_mode: "Markdown",
						})
					}
				})
			promises.push(okex)

			Promise.all(promises)
				.then(() => {
					if (twdResultMessages === "" && resultMessages === "") {
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, `${currency}${base ? "-" + base : ""} 查無結果`)
					}
				})
		})
		.catch((error) => {
			console.log("Error in /price", ctx.message.text, error)
		})
}
