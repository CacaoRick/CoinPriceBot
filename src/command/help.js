const helpMessage = `/price \`[btc|xmr|eth|...]\`
察看目前的價錢 (BitoEX, Bitfinex, Bittrex)
/exchange \`<0.1>\` \`[btc|xmr|eth|...]\`
計算可以換成多少台幣`

export default function (ctx) {
	if (ctx.chat.type == "group") {
		// 群組
		ctx.replyWithMarkdown(helpMessage, {
			reply_to_message_id: ctx.message.message_id,
		})
	} else {
		// 非群組，提供個人用功能
		ctx.replyWithMarkdown(helpMessage, {
			reply_to_message_id: ctx.message.message_id,
		})
	}
}
