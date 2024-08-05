const fs = require('fs');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mcs = require('node-mcstatus');
const bot = new TelegramBot(process.env.BOT_TOKEN, {
	polling: true
});
const chatServersFile = 'chat_servers.json';

function loadChatServers() {
	try {
		const data = fs.readFileSync(chatServersFile);
		return JSON.parse(data);
	} catch (err) {
		console.error('Ошибка загрузки данных серверов чатов:', err);
		return {};
	}
}

function saveChatServers(data) {
	fs.writeFileSync(chatServersFile, JSON.stringify(data, null, 2));
}
bot.on('polling_error', (error) => {
	console.error('Ошибка при работе с пуллингом:', error);
});
bot.on('message', (msg) => {
	if (msg.chat.type == 'private') {
		if (msg.text == '/start') {
			bot.sendMessage(msg.chat.id, '👋 <b>Привет! Это открытый бета-тест официального бота от Айскуба!\nЭтот бот работает только в группах.\n📋 Доступные команды:</b>\n"<code>Добавить хост (айпи) (порт)</code>" - добавляет сервер в список(только для администратора).\nПример использования - "<code>Добавить хост example.com 19132</code>".\n"<code>Статус</code>" - проверяет статус сервера.\n"<code>Удалить хост</code>" - удаляет хост\(только для администратора\)', {
			parse_mode: "HTML"
			});
		} else {
		bot.sendMessage(msg.chat.id, '🔐 <b>Этот бот работает только в чатах/группах!\n📋 Доступные команды:</b>\n"<code>Добавить хост (айпи) (порт)</code>" - добавляет сервер в список(только для администратора).\nПример использования - "<code>Добавить хост example.com 19132</code>".\n"<code>Статус</code>" - проверяет статус сервера.\n"<code>Удалить хост</code>" - удаляет хост\(только для администратора\)', {
			parse_mode: "HTML"
		});
		}
	}
})
bot.onText(/Добавить хост (.+) (\d+)/i, async (msg, match) => {
	bot.getChatMember(msg.chat.id, msg.from.id).then(function(data) {
		if ((data.status == "creator") || (data.status == "administrator")) {
			const chatServers = loadChatServers();
			const chatId = msg.chat.id;
			const host = match[1];
			const port = parseInt(match[2]);
			try {
				mcs.statusBedrock(host, port).then((result) => {
					if (result.online == true || result.online == false) {
						if (!chatServers[chatId]) {
							chatServers[chatId] = [];
							chatServers[chatId] = {
								host,
								port
							};
							saveChatServers(chatServers);
							bot.sendMessage(chatId, `✅ Сервер с айпи-адресом: <code>${host}</code>, и портом: <code>${port}</code> успешно добавлен!`, {
								parse_mode: "HTML"
							});
							return
						} else {
							bot.sendMessage(chatId, '❌ Этот чат уже имеет добавленный сервер!');
							return;
						}
					}
				});
			} catch (error) {
				console.error('Ошибка при проверке статуса сервера:', error);
				bot.sendMessage(chatId, '❌ Произошла ошибка при проверке сервера.');
			}
		} else {
			bot.sendMessage(msg.chat.id, '🔐 Вам отказано в доступе')
		}
	});
});
bot.onText(/Статус/i, async (msg) => {
const chatServers = loadChatServers();
const chatId = msg.chat.id.toString();
const {
	host,
	port
} = chatServers[chatId];
try {
	mcs.statusBedrock(host, port).then((res) => {
		if (!chatServers[chatId]) {
	bot.sendMessage(chatId, '❌ Вы забыли добавить IP-адрес и порт сервера!');
	return;
		} else if (res.online == true) {
			bot.sendMessage(chatId, `✅ Статус сервера - включен!\n📡 Айпи-адрес: <code>${host}</code>, порт: <code>${port}</code>\n👥 Игроки в сети: ${res.players.online}/${res.players.max}.`, {
				parse_mode: "HTML"
			});
		} else if (res.online == false) {
			bot.sendMessage(chatId, '❌ Сервер отключён!');
		}
	});
} catch (error) {
	console.error('Ошибка при проверке статуса сервера:', error);
	bot.sendMessage(chatId, '❌ Произошла ошибка при проверке статуса сервера.');
}
});
bot.onText(/Удалить хост/i, async (msg) => {
	bot.getChatMember(msg.chat.id, msg.from.id).then(function(data) {
		if ((data.status == "creator") || (data.status == "administrator")) {
			const chatId = msg.chat.id.toString();
			const chatServers = loadChatServers();
			if (!chatServers[chatId]) {
				bot.sendMessage(chatId, '❌ В этом чате нет добавленного сервера.');
				return;
			}
			delete chatServers[chatId];
			saveChatServers(chatServers);
			bot.sendMessage(chatId, '✅ Сервер успешно удалён из списка.');
		} else {
			bot.sendMessage(msg.chat.id, '🔐 Вам отказано в доступе')
		}
	});
});
bot.onText(/Помощь/i, async (msg) => {
	bot.sendMessage(msg.chat.id, '📋 <b>Доступные команды:</b>\n"<code>Добавить хост (айпи) (порт)</code>" - добавляет сервер в список(только для администратора).\nПример использования - "<code>Добавить хост example.com 19132</code>".\n"<code>Статус</code>" - проверяет статус сервера.\n"<code>Удалить хост</code>" - удаляет хост(только для администратора)', {
		parse_mode: "HTML"
	});
});
console.log('Бот заработал, ебать.')
