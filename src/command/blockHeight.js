import { blockexplorer } from "blockchain.info"
import log from "../utils/log"

export default function (ctx) {
	log(ctx)

	ctx.reply("Loading...", {
		reply_to_message_id: ctx.message.message_id,
	})
		.then((result) => {
			blockexplorer.getLatestBlock()
				.then((block) => {
					if (block) {
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, block.height, {
							parse_mode: "Markdown",
						})
					} else {
						return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, "Error", {
							parse_mode: "Markdown",
						})
					}
				})
				.catch(() => {
					return ctx.telegram.editMessageText(ctx.chat.id, result.message_id, null, "Error", {
						parse_mode: "Markdown",
					})
				})
		})
}
