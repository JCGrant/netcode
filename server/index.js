import WebSocket, { WebSocketServer } from "ws";

const idGenerator =
  (id = 1) =>
  () =>
    `${id++}`;
const newId = idGenerator();

const wss = new WebSocketServer({ port: 8080 });

const state = {
  players: {},
};

wss.on("connection", (ws) => {
  const id = newId();

  const send = (event, client = ws) => {
    client.send(JSON.stringify(event));
  };

  const broadcast = (event) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        send(event, client);
      }
    });
  };

  ws.on("message", (data) => {
    const action = JSON.parse(data);
    console.log(action);
    switch (action.kind) {
      case "MOVE_PLAYER":
        state.players[id] = action.location;
        send({ kind: "PLAYER_MOVED", id, location: action.location });
        broadcast({
          kind: "PLAYER_MOVED",
          id,
          location: action.location,
        });
        break;
    }
  });

  ws.on("close", () => {
    delete state.players[id];
    broadcast({ kind: "PLAYER_LEFT", id });
    console.log(`${id} has disconnected`);
  });

  const location = { x: 0, y: 0 };
  state.players[id] = location;
  send({ kind: "SET_STATE", id, state });
  broadcast({ kind: "PLAYER_JOINED", id, location });
  console.log(`${id} has connected`);
});
