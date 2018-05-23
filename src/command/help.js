import log from "../utils/log"

const helpMessage = `/price \`[幣種] [幣種]\`
察看目前的價格，預設以 USD 查詢，例如：
\`/price eth\`
後方可加上第二種貨幣，例如要查 ETH-BTC 價格：
\`/price eth btc\`

/sell \`<數量> <幣種>\`
計算可以換成多少台幣，例如：
\`/sell 0.3 xmr\`

/buy \`<數量> <幣種>\`
計算要多少台幣可以買到，例如：
\`/buy 50.3 mco\`

/avg \`<數量> <幣種>\`
換算為台幣均價，例如：
\`/avg 1.2 eth\``

export default function (ctx) {
	log(ctx)

	if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
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
