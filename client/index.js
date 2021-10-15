const LAG = 250;

const playerSize = 20;
const playerSpeed = 10;
const bulletSize = 5;

const width = Math.floor(window.innerWidth);
const height = Math.floor(window.innerHeight);
const centerHorizontal = Math.floor(width / 2);
const centerVertical = Math.floor(height / 2);

const canvas = document.getElementById("canvas");
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d");

const drawPlayer = () => {
  ctx.fillStyle = "blue";
  ctx.fillRect(
    centerHorizontal - playerSize / 2,
    centerVertical - playerSize / 2,
    playerSize,
    playerSize
  );
};

const drawOtherPlayer = (dx, dy) => {
  ctx.fillStyle = "red";
  ctx.fillRect(
    centerHorizontal + dx - playerSize / 2,
    centerVertical - dy - playerSize / 2,
    playerSize,
    playerSize
  );
};

const drawBullet = (dx, dy) => {
  ctx.fillStyle = "black";
  ctx.fillRect(
    centerHorizontal + dx - bulletSize / 2,
    centerVertical - dy - bulletSize / 2,
    bulletSize,
    bulletSize
  );
};

let localPlayerId = undefined;
let state = {};

const keys = {};
const mouse = {
  buttons: {},
  location: { x: 0, y: 0 },
};

document.addEventListener(
  "keydown",
  ({ key }) => {
    keys[key] = true;
  },
  false
);

document.addEventListener(
  "keyup",
  ({ key }) => {
    keys[key] = false;
  },
  false
);

canvas.addEventListener(
  "mousedown",
  ({ button, offsetX, offsetY }) => {
    mouse.buttons[button] = true;
    mouse.location = { x: offsetX, y: offsetY };
  },
  false
);

canvas.addEventListener(
  "mousemove",
  ({ offsetX, offsetY }) => {
    mouse.location = { x: offsetX, y: offsetY };
  },
  false
);

canvas.addEventListener(
  "mouseup",
  ({ button }) => {
    mouse.buttons[button] = false;
  },
  false
);

const ws = new WebSocket("ws://127.0.0.1:8080");

const send = (action) => {
  ws.send(JSON.stringify(action));
};

ws.onmessage = ({ data }) => {
  setTimeout(() => {
    const event = JSON.parse(data);
    console.log(event);
    switch (event.kind) {
      case "SET_STATE":
        localPlayerId = event.playerId;
        state = event.state;
        run();
        break;
      case "PLAYER_JOINED":
        state.players[event.playerId] = event.player;
        break;
      case "PLAYER_LEFT":
        delete state.players[event.playerId];
        break;
      case "PLAYER_MOVED":
        state.players[event.playerId].location = event.location;
        break;
    }
    console.log(state);
  }, LAG);
};

const render = () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  const { x: playerX, y: playerY } = state.players[localPlayerId].location;
  Object.entries(state.players).forEach(
    ([
      playerId,
      {
        location: { x, y },
      },
    ]) => {
      if (playerId === localPlayerId) {
        return;
      }
      const dx = x - playerX;
      const dy = y - playerY;
      drawOtherPlayer(dx, dy);
    }
  );
  drawPlayer();
};

const update = () => {
  const velocity = { x: 0, y: 0 };
  if (keys["w"]) {
    velocity.y = playerSpeed;
  }
  if (keys["s"]) {
    velocity.y = -playerSpeed;
  }
  if (keys["a"]) {
    velocity.x = -playerSpeed;
  }
  if (keys["d"]) {
    velocity.x = playerSpeed;
  }
  if (velocity.x !== 0 || velocity.y !== 0) {
    const { x: playerX, y: playerY } = state.players[localPlayerId].location;
    const newLocation = {
      x: playerX + velocity.x,
      y: playerY + velocity.y,
    };
    state.players[localPlayerId].location = newLocation;
    send({
      kind: "MOVE_PLAYER",
      velocity,
    });
  }
};

const run = () => {
  update();
  render();
  requestAnimationFrame(run);
};
