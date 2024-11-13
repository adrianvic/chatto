const config = require('./config.json')
import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: config.port });

type Client = {
  ws: WebSocket;
  nick: string;
}

const clients: Client[] = [];

wss.on('connection', (ws) => {
  const client: Client = { ws, nick: config.defaultUsername };
  clients.push(client);
  
  function sendMessage(timestamp: string, message: string, nickname: string, isPublic: boolean = true) {
    if (!isPublic) {
      ws.send (JSON.stringify({
        timestamp,
        nick: nickname,
        message: message
      }))
    } else {
    // message: msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') // uncomment this and change the argument passed to sendMessage() to disable HTML injection
    clients.forEach((c) => {
      if (c.ws.readyState === WebSocket.OPEN)
        c.ws.send (JSON.stringify({
          timestamp,
          nick: nickname,
          message: message
        }))
    });
    }
  }

  const loginTimestamp = new Date().toLocaleTimeString()
  sendMessage(loginTimestamp, config.loginMessage, config.serverNickname, false)

  ws.on('message', (message) => {
    const msg = message.toString();
    const timestamp = new Date().toLocaleTimeString();

    if (msg.startsWith('/nick ')) {
      const newNick = msg.split(' ')[1];
      if (newNick) {
        client.nick = newNick;
        sendMessage(timestamp, `Nick set to ${newNick}`, config.serverNickname, false)
      }
      return
    }

    if (!client.nick) {
      sendMessage(timestamp, `You must set a nick first`, config.serverNickname, false)
      return;
    }

    sendMessage(timestamp, msg, client.nick)
  });

  // Removes client when connection is closed
  ws.on('close', () => {
    const index = clients.indexOf(client);
    if (index !== -1)
      clients.splice(index, 1);
  });
});

console.log(`Chatto WebSocket server is running on ws://localhost:${config.port}`);