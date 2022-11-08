let canvas, context, localGame;

let bgColor = "white";
let mousePosition = { x: 0, y: 0 };

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
      console.log(size)
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

    drawCharacter(pos.x, pos.y);
  }

  game.bullets.forEach((bullet) => {
    context.fillStyle = "blue";
    context.fillRect(bullet.pos.x * size, bullet.pos.y * size, size, size);
  })

  window.requestAnimationFrame(() => {
    drawGame(localGame);
  });
}

function resetBoard() {
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCharacter(x, y) {
  context.fillStyle = "grey";

  // Main Body
  context.beginPath();
  context.rect(x * size, y * size, size, size * 2.5)
  context.fill();
  context.stroke()

  // Gun
  context.beginPath();
  context.moveTo(x * size, y * size)
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
  if (localGame) {
    direction = getDirection(event.key);
    if (direction) {
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

window.addEventListener("mousemove", (event) => {
  mousePosition.x = event.clientX - event.target.getBoundingClientRect().left
  mousePosition.y = event.clientY - event.target.getBoundingClientRect().top
})

window.addEventListener("mousedown", () => {
  if (localGame && !localGame.players[userName].dead) {
    socket.emit("new-bullet", {x: mousePosition.x / size, y: mousePosition.y / size})
  }
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