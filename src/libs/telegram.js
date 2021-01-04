import TelegramBot from 'node-telegram-bot-api'

const botToken = process.env.BOT_TOKEN

export default new TelegramBot(botToken, { polling: true })
