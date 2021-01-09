
import db from 'libs/db'
import bot from 'libs/telegram'

async function pinHandler (msg) {
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    await bot.sendMessage(
      msg.chat.id,
      '群組才能用',
      {
        reply_to_message_id: msg.message_id,
        disable_notification: true,
      },
    )
    return
  }

  const memberInfo = await bot.getChatMember(msg.chat.id, msg.from.id)
  if (memberInfo.status !== 'creator' && memberInfo.status !== 'administrator') {
    await bot.sendMessage(
      msg.chat.id,
      '群組管理員才能用',
      {
        reply_to_message_id: msg.message_id,
        disable_notification: true,
      },
    )
    return
  }

  const priceMessageResponse = await bot.sendMessage(msg.chat.id, 'Loading...', { disable_notification: true })
  const statusMessageResponse = await bot.sendMessage(msg.chat.id, 'Loading...', { disable_notification: true })

  const chatInfo = await bot.getChat(msg.chat.id)
  console.log('chatInfo', chatInfo)
  if (chatInfo.permissions.can_pin_messages) {
    try {
      await bot.pinChatMessage(msg.chat.id, priceMessageResponse.message_id, { disable_notification: true })
    } catch (error) {
      console.log('pinChatMessage error', error.message)
    }
  }

  db.main.set(msg.chat.id, {
    title: chatInfo.title,
    priceMessage: {
      chat_id: msg.chat.id,
      message_id: priceMessageResponse.message_id,
    },
    statusMessage: {
      chat_id: msg.chat.id,
      message_id: statusMessageResponse.message_id,
    },
  }).write()
}

async function stopPinHandler (msg) {
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    await bot.sendMessage(
      msg.chat.id,
      '群組才能用',
      {
        reply_to_message_id: msg.message_id,
        disable_notification: true,
      },
    )
    return
  }

  const memberInfo = await bot.getChatMember(msg.chat.id, msg.from.id)
  if (memberInfo.status !== 'creator' && memberInfo.status !== 'administrator') {
    await bot.sendMessage(
      msg.chat.id,
      '群組管理員才能用',
      {
        reply_to_message_id: msg.message_id,
        disable_notification: true,
      },
    )
    return
  }

  const priceMessage = db.main.get(msg.chat.id).get('priceMessage').value()

  try {
    await bot.editMessageText('已停止更新', priceMessage)
    await bot.unpinChatMessage(priceMessage.chat_id)
  } catch (error) {
    console.log('unpinChatMessage error', error.message)
  }

  db.main.unset(msg.chat.id).write()
}

export default {
  pinHandler,
  stopPinHandler,
}
