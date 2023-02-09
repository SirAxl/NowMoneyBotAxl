const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

const token = '6097208831:AAGjBaHe5j48JNn6edOmih11H2i5bbVu554';
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  console.log(error); 
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Bienvenido al bot cotizador de criptomonedas.');
  bot.sendMessage(msg.chat.id, 'Consulta los comandos disponibles en /comandos');
});
bot.onText(/\/price (.+)/, (msg, match) => {
  const symbol = match[1] + "USDT";

  axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
    .then(res => {
      const price = res.data.price;
      bot.sendMessage(msg.chat.id, `El precio actual de ${symbol} en Binance es de ${price}`);

      fs.appendFile('log.txt', `${msg.from.username}: ${symbol}: ${price}\n`, (error) => {
        if (error) {
          console.error(error);
        }
      });
    })
    .catch(error => {
      console.error(error);
      bot.sendMessage(msg.chat.id, 'Lo siento, no pude obtener el precio de la moneda.');
    })
});

bot.onText(/\/comandos/, (msg) => {
  bot.sendMessage(msg.chat.id, '/price <criptomoneda>: consulta el precio de la criptomoneda\n\n/monedas: consulta todas las criptomonedas disponibles\n\n/help: información de contacto\n\nPróximamente: conversor de moneda 💰', {parse_mode: "Markdown"});

});

bot.onText(/\/monedas/, (msg) => {
  axios.get(`https://api.binance.com/api/v3/ticker/price`)
    .then(res => {
      let symbols = res.data.map(d => d.symbol); 
      symbols = [...new Set(symbols)]; // Eliminar duplicados
      let chunkSize = 150;
      let chunks = [];
      while (symbols.length > 0) {
        chunks.push(symbols.splice(0, chunkSize));
      }
      bot.sendMessage(msg.chat.id, `Esta consulta puede enviar ${chunks.length} mensajes con 150 monedas c/u. ¿Está seguro de querer continuar? Escriba /si para confirmar o /no para cancelar.`);
      bot.onText(/\/si/, (confirm) => {
        if (confirm.chat.id === msg.chat.id) {
          chunks.forEach((chunk, i) => {
            setTimeout(() => {
              bot.sendMessage(msg.chat.id, `Las opciones de monedas disponibles son (parte ${i + 1} de ${chunks.length}): \n\n${chunk.join("\n")}`);
            }, i * 1000);
          });
        }
      });
      bot.onText(/\/no/, (cancel) => {
        if (cancel.chat.id === msg.chat.id) {
          bot.sendMessage(msg.chat.id, 'Consulta de monedas cancelada.');
        }
      });
    })
    .catch(error => {
      console.error(error);
      bot.sendMessage(msg.chat.id, 'Lo siento, no pude obtener las opciones de monedas.');
    });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Puedes enviarme cualquier tipo de consulta a: viglioneaxl@gmail.com\n\nCon el comando /start me reinicias');
});