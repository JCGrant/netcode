import WebSocket, { WebSocketServer } from "ws";
import { idGenerator, LAG } from "../common/index.js";

const UPDATE_RATE = 10;

const newPlayerId = idGenerator();

const wss = new WebSocketServer({ port: 8080 });

const state = {
  players: {},
};

wss.on("connection", (ws) => {
  const playerId = newPlayerId();
  let queuedSendEvents = [];
  let queuedBroadcastOthersEvents = [];
  let queuedBroadcastAllEvents = [];

  setInterval(() => {
    if (queuedSendEvents.length > 0) {
      ws.send(JSON.stringify(queuedSendEvents));
      queuedSendEvents = [];
    }
    if (queuedBroadcastOthersEvents.length > 0) {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(queuedBroadcastOthersEvents));
        }
      });
      queuedBroadcastOthersEvents = [];
    }
    if (queuedBroadcastAllEvents.length > 0) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(queuedBroadcastAllEvents));
        }
      });
      queuedBroadcastAllEvents = [];
    }
  }, 1000 / UPDATE_RATE);

  const send = (event) => {
    queuedSendEvents.push(event);
  };

  const broadcastOthers = (event) => {
    queuedBroadcastOthersEvents.push(event);
  };

  const broadcastAll = (event) => {
    queuedBroadcastAllEvents.push(event);
  };

  ws.on("message", (data) => {
    setTimeout(() => {
      const action = JSON.parse(data);
      const actionId = action.id;
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
            actionId,
            playerId,
            location: newLocation,
          });
          break;
      }
    }, LAG / 2);
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
