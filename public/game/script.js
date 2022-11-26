let canvas, context, localGame;

let bgColour = "white";

let bulletColour = "#ffea00";

let healthColor1 = "#29e823";
let healthColor2 = "red";

let playerIdle = new Image();
playerIdle.src = "../assets/sprites/playerIdle.png";

let playerAnims = [new Image(), new Image()];

playerAnims[0].src = "../assets/sprites/playerMove1.png";
playerAnims[1].src = "../assets/sprites/playerMove2.png";

let animStates = {};
let framesPerCycle = 10;

let player_size;

let mousePosition = { x: 0, y: 0 };

let time;

function init() {
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  canvas.width = canvas.height = 900;
  context.font = "1.2rem Monospace";

  waitingForGame = setInterval(function () {
    if (localGame) {
      // Setting Variables
      size = canvas.height / localGame.gridSize;
      player_size = localGame.player_size;

      window.requestAnimationFrame(() => {
        drawGame(localGame);
      });
      clearInterval(waitingForGame);
    }
  }, 10);
}

function drawGame(game) {
  resetBoard(game.platforms);

  let timePassed = (Date.now() - time) / 1000;
  time = Date.now();
  let fps = Math.round(1 / timePassed);

  context.fillStyle = "black";
  context.fillText("FPS " + fps, size * 2, size * 3);

  for (playerName in game.players) {
    let player = game.players[playerName];
    let pos = player.pos;
    let direction = player.direction;

    pos.x += direction.x * (game.tps * game.player_speed * timePassed);
    pos.y += direction.y * (game.tps * game.player_speed * timePassed);

    drawCharacter(player, animStates[playerName]);
  }

  game.bullets.forEach((bullet) => {
    let pos = bullet.pos;
    let direction = bullet.direction;

    pos.x += direction.x * (game.tps * game.bullet_speed * timePassed);
    pos.y += direction.y * (game.tps * game.bullet_speed * timePassed);

    context.fillStyle = bulletColour;
    context.fillRect(
      bullet.pos.x * size,
      bullet.pos.y * size,
      size / 1.25,
      size / 1.25
    );
  });

  window.requestAnimationFrame(() => {
    drawGame(localGame);
  });
}

function resetBoard(platforms) {
  context.fillStyle = bgColour;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "grey";
  platforms.forEach((platform) => {
    context.fillRect(
      platform.startX * size,
      platform.startY * size,
      (platform.endX - platform.startX) * size,
      (platform.endY - platform.startY) * size
    );
  });
}

function drawCharacter(player, animState) {
  let direction = player.direction;
  let x = player.pos.x;
  let y = player.pos.y;
  let health = player.health;

  // Player
  context.save();

  // Flips the player
  if (animState.lastDirection == -1) {
    context.scale(-1, 1);
    x += player_size.x;
    x *= -1;
  }

  if (direction.x == 0) {
    context.drawImage(
      playerIdle,
      x * size,
      (y - player_size.y) * size,
      player_size.x * size,
      player_size.y * size
    );

    // Reset animation
    animState.currentAnimFrame = 0;
    animState.currentAnimCycle = 0;
  } else {
    animState.lastDirection = direction.x;

    // Cycles through animations
    context.drawImage(
      playerAnims[animState.currentAnimCycle],
      x * size,
      (y - player_size.y) * size,
      player_size.x * size,
      player_size.y * size
    );
    
    animState.currentAnimFrame++;
    if (animState.currentAnimFrame >= framesPerCycle) {
      if (animState.currentAnimCycle == playerAnims.length - 1) {
        animState.currentAnimCycle = 0;
      } else {
        animState.currentAnimCycle++;
      }
      animState.currentAnimFrame = 0;
    }
  }

  // Need to restore canvas state just in case the player was flipped
  x = player.pos.x;
  context.restore();

  // Health Bar
  context.fillStyle = healthColor2;
  context.fillRect(
    x * size,
    (y - player_size.y - 1.25) * size,
    size * player_size.x,
    size
  );

  if (health > 0) {
    context.fillStyle = healthColor1;
    context.fillRect(
      x * size,
      (y - player_size.y - 1.25) * size,
      size * player_size.x * (health / 100),
      size
    );
  }
}

function getDirection(key) {
  switch (key.toLowerCase()) {
    case "arrowright":
      return (direction = { x: 1 });
    case "d":
      return (direction = { x: 1 });
    case "arrowleft":
      return (direction = { x: -1 });
    case "a":
      return (direction = { x: -1 });
    case " ":
      return (direction = { y: 1 })
    default:
      return false;
  }
}

window.addEventListener("keydown", (event) => {
  if (localGame && localGame.players[userName].health > 0) {
    let direction = getDirection(event.key);
    if (direction.x) {
      socket.emit("change-direction", direction);
    } else if (direction.y) {
      socket.emit("jump")
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
    socket.emit("change-direction", { x: 0, y: 0 }, "multiplayer");
  }
});

window.addEventListener("mousemove", (event) => {
  mousePosition.x = event.clientX - event.target.getBoundingClientRect().left;
  mousePosition.y = event.clientY - event.target.getBoundingClientRect().top;
});

window.addEventListener("mousedown", () => {
  if (localGame && localGame.players[userName].health > 0) {
    socket.emit("new-bullet", {
      x: mousePosition.x / size,
      y: mousePosition.y / size,
    });
  }
});

socket.on("player-connected", (playerName) => {
  socket.emit("server-message", playerName + " has connected!");
  userName = playerName;
  init();
});

function updateAnimStates(currentState, players) {
  players.forEach((playerName) => {
    if (!Object.keys(currentState).includes(playerName)) {
      currentState[playerName] = {
        currentAnimCycle: 0,
        currentAnimFrame: 0,
        lastDirection: 1,
      };
    }
  });
  return currentState;
}

socket.on("new-gamestate", (gamestate) => {
  console.log(1)
  localGame = gamestate;
  animStates = updateAnimStates(animStates, Object.keys(localGame.players));
});

// Daniyal's game is the best and I'm part of it. :) - Walter Wood
