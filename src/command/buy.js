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

	let messageResult = `\`${amount}\` ${currency}\n`

	// 送出 Loading...
	ctx.reply(messageResult, {
		reply_to_message_id: ctx.message.message_id,
		parse_mode: "Markdown",
	})
		.then((result) => {
			const promises = []
			promises.push(api.bitoex(true))
			promises.push(api.maicoin("BTC", true))
			if (currency != "BTC") {
				promises.push(api.binance(currency, "BTC", true))
				promises.push(api.bitfinex(currency, "BTC", true))
			}
			Promise.all(promises)
				.then((results) => {

					return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, `好像錯誤了`)
				})
				.catch((error) => {
					console.log("Error in /buy", ctx.message.text, error)
					return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, `好像錯誤了`)
				})
		})
		.catch((error) => {
			console.log("Error in /buy", ctx.message.text, error)
		})
}
