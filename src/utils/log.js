import db from "../db"

export default function log(ctx) {
	if (ctx.chat.type === "private") {
		const users = db.get("users")
		users[ctx.chat.id] = users[ctx.chat.id] + 1
	} else {
		const groups = db.get("groups")
		groups[ctx.chat.id] = groups[ctx.chat.id] + 1
	}
	db.write()
}
