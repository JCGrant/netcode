import WebSocket, { WebSocketServer } from "ws";

const idGenerator =
  (id = 1) =>
  () =>
    `${id++}`;
const newPlayerId = idGenerator();

const wss = new WebSocketServer({ port: 8080 });

const state = {
  players: {},
};

wss.on("connection", (ws) => {
  const playerId = newPlayerId();

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
        const oldLocation = state.players[playerId].location;
        const newLocation = {
          x: oldLocation.x + action.velocity.x,
          y: oldLocation.y + action.velocity.y,
        };
        state.players[playerId].location = newLocation;
        broadcastAll({
          kind: "PLAYER_MOVED",
          playerId,
          location: newLocation,
        });
        break;
    }
  });

  ws.on("close", () => {
    delete state.players[playerId];
    broadcastOthers({ kind: "PLAYER_LEFT", playerId });
    console.log(`${playerId} has disconnected`);
  });

  state.players[playerId] = { location: { x: 0, y: 0 } };
  send({ kind: "SET_STATE", playerId, state });
  broadcastOthers({
    kind: "PLAYER_JOINED",
    playerId,
    player: state.players[playerId],
  });
  console.log(`${playerId} has connected`);
});
