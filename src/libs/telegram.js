import db from 'libs/db'
import TelegramBot from 'node-telegram-bot-api'

const botToken = db.config.get('botToken').value()

export default new TelegramBot(botToken, { polling: true })
