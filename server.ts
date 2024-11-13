import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 4000 });

type Client = {
  ws: WebSocket;
  nick: string;
}

const clients: Client[] = [];

wss.on('connection', (ws) => {
  const client: Client = { ws, nick: '' };
  clients.push(client);
  const loginTimestamp = new Date().toLocaleTimeString();
  ws.send (JSON.stringify({
    loginTimestamp,
    nick: "Server",
    message: `Conectado ao servidor do Adrian.`
  }))

  ws.on('message', (message) => {
    const msg = message.toString();
    const timestamp = new Date().toLocaleTimeString();

    if (msg.startsWith('/nick ')) {
      const newNick = msg.split(' ')[1];
      if (newNick) {
        client.nick = newNick;
        ws.send(JSON.stringify({
          timestamp,
          nick: 'Server',
          message: `Nick set to ${newNick}`
        }));
      }
      return
    }

    if (!client.nick) {
      ws.send(JSON.stringify({
        timestamp,
        nick: 'Server',
        message: 'You must set a nick first'
      }));
      return;
    }

    const broadcastMessage = JSON.stringify({
      timestamp,
      nick: client.nick,
      message: msg
      // message: msg.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    })
    
    clients.forEach((c) => {
      if (c.ws.readyState === WebSocket.OPEN)
        c.ws.send(broadcastMessage);
    });
  });

  // Remove client when connection is closed
  ws.on('close', () => {
    const index = clients.indexOf(client);

    if (index !== -1)
      clients.splice(index, 1);
  });
});

console.log('Chatto WebSocket server is running on ws://localhost:4000');