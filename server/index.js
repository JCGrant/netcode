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

  const broadcastOthers = (event) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        send(event, client);
      }
    });
  };

  const broadcastAll = (event) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        send(event, client);
      }
    });
  };

  ws.on("message", (data) => {
    const action = JSON.parse(data);
    console.log(action);
    switch (action.kind) {
      case "MOVE_PLAYER":
        const oldLocation = state.players[id].location;
        const newLocation = {
          x: oldLocation.x + action.velocity.x,
          y: oldLocation.y + action.velocity.y,
        };
        state.players[id].location = newLocation;
        broadcastAll({
          kind: "PLAYER_MOVED",
          id,
          location: newLocation,
        });
        break;
    }
  });

  ws.on("close", () => {
    delete state.players[id];
    broadcastOthers({ kind: "PLAYER_LEFT", id });
    console.log(`${id} has disconnected`);
  });

  state.players[id] = { location: { x: 0, y: 0 } };
  send({ kind: "SET_STATE", id, state });
  broadcastOthers({ kind: "PLAYER_JOINED", id, player: state.players[id] });
  console.log(`${id} has connected`);
});
