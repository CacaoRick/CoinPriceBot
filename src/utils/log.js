import db from "../db"

export default function log(ctx) {
	const target = ctx.chat.type === "private" ? "users" : "groups"
	const count = db.get([target, ctx.chat.id]).value() || 0
	db.set([target, ctx.chat.id], count + 1)
		.write()
}
