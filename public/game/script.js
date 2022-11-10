let canvas, context, localGame;

let bgColour = "#dbd7d7";
let playerColour = "grey";
let bulletColour = "yellow"
let healthColor1 = "#29e823"
let healthColor2 = "red"

let mousePosition = { x: 0, y: 0 };

let shootInterval
let fireRate = 6

let time, size;

function init() {
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  canvas.width = canvas.height = 900;
  context.font = "1.2rem Monospace";

  waitingForGame = setInterval(function() {
    if (localGame) {
      // Setting Variables
      size = canvas.height / localGame.gridSize
      window.requestAnimationFrame(() => {
        drawGame(localGame);
      });
      clearInterval(waitingForGame);
    }
  }, 10);
}

function drawGame(game) {
  resetBoard();

  let timePassed = (Date.now() - time) / 1000;
  time = Date.now();
  let fps = Math.round(1 / timePassed);

  context.fillStyle = "black";
  context.fillText("FPS " + fps, size * 2, size * 3);

  for (playerName in game.players) {
    player = game.players[playerName];
    let pos = player.pos;
    let direction = player.direction;

    pos.x += direction.x * (game.tps * game.player_speed * timePassed);
    pos.y += direction.y * (game.tps * game.player_speed * timePassed);

    drawCharacter(pos.x, pos.y, player.health);
  }

  game.bullets.forEach((bullet) => {
    let pos = bullet.pos;
    let direction = bullet.direction;

    pos.x += direction.x * (game.tps * game.bullet_speed * timePassed);
    pos.y += direction.y * (game.tps * game.bullet_speed * timePassed);

    context.fillStyle = bulletColour;
    context.fillRect(bullet.pos.x * size, bullet.pos.y * size, size, size);
  })

  window.requestAnimationFrame(() => {
    drawGame(localGame);
  });
}

function resetBoard() {
  context.fillStyle = bgColour;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCharacter(x, y, health) {
  context.fillStyle = playerColour;

  // Main Body
  context.beginPath();
  context.rect((x) * size, (y - 3) * size, size * 1.25, size * 3)
  context.fill();
  context.stroke()

  // Gun

  // Translating to make it easier to angle the gun
  //context.translate((x + 1) * size, (y - 2) * size)
  //context.rotate(Math.atan2(y - mousePosition.y * size, x - mousePosition.x * size) * 180 / Math.PI);

  context.fillRect((x + 1) * size, (y - 2) * size, size * 2, size)

  // Resetting orgin
  //context.rotate(-Math.atan2(y - mousePosition.y * size, x - mousePosition.x * size) * 180 / Math.PI);
  //context.translate(-(x + 1) * size, -(y - 2) * size)

  // Health Bar
  context.fillStyle = healthColor2
  context.fillRect((x - 1.25) * size, (y + 0.75) * size, size * 3.75, size * 0.75)

  if (health > 0) {
    context.fillStyle = healthColor1
    context.fillRect((x - 1.25) * size, (y + 0.75) * size, size * 3.75 * (health / 100), size * 0.75)
  }

  // Mouse
  context.beginPath();
  context.moveTo((x + 3) * size, (y - 1.5) * size)
  context.lineTo(mousePosition.x, mousePosition.y)
  context.stroke()
}

function getDirection(key) {
  switch (key.toLowerCase()) {
    case "arrowup":
      return (direction = { y: -1 });
    case "w":
      return (direction = { y: -1 });
    case "arrowdown":
      return (direction = { y: 1 });
    case "s":
      return (direction = { y: 1 });
    case "arrowright":
      return (direction = { x: 1 });
    case "d":
      return (direction = { x: 1 });
    case "arrowleft":
      return (direction = { x: -1 });
    case "a":
      return (direction = { x: -1 });
    default:
      return false;
  }
}

window.addEventListener("keydown", (event) => {
  if (localGame && localGame.players[userName].health > 0) {
    let direction = getDirection(event.key);
    if (direction) {
      localGame.players[userName].direction = {...localGame.players[userName].direction, ...direction}
      socket.emit("change-direction", direction, "multiplayer");
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (localGame && localGame.players[userName]) {
    let direction = getDirection(event.key);
    if (direction.x && direction.x == localGame.players[userName].direction.x) {
      socket.emit("change-direction", { x: 0 }, "multiplayer");
    } else if (
      direction.y &&
      direction.y == localGame.players[userName].direction.y
    ) {
      socket.emit("change-direction", { y: 0 }, "multiplayer");
    }
  }
});

window.addEventListener("blur", () => {
  if (localGame && localGame.players[userName].health > 0) {
    localGame.players[userName].direction = {...localGame.players[userName].direction, ...direction}
    socket.emit("change-direction", { x: 0, y: 0 }, "multiplayer");
  }
});



window.addEventListener("mousemove", (event) => {
  mousePosition.x = event.clientX - event.target.getBoundingClientRect().left
  mousePosition.y = event.clientY - event.target.getBoundingClientRect().top
})

window.addEventListener("mousedown", () => {
  socket.emit("new-bullet", { x: mousePosition.x / size, y: (mousePosition.y / size) + 1.5 })
  shootInterval = setInterval(() => {
    if (localGame && !localGame.players[userName].health > 0) {
      socket.emit("new-bullet", { x: mousePosition.x / size, y: (mousePosition.y / size) + 1.5 })
    }
  }, 1000 / fireRate)
})

window.addEventListener("mouseup", () => {
  clearInterval(shootInterval)
})

socket.on("player-connected", (playerName) => {
  socket.emit("server-message", playerName + " has connected!");
  userName = playerName;
  init();
});

socket.on("new-gamestate", (gamestate) => {
  localGame = gamestate;
});

// Daniyal's game is the best and I'm part of it. :) - Walter Wood