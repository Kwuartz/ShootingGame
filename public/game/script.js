let canvas, context, localGame;

let bgColour = "white";

let bulletColour = "#ffea00"

let healthColor1 = "#29e823"
let healthColor2 = "red"

let playerIdle = new Image()
playerIdle.src = "../assets/sprites/playerIdle.png"

let playerAnims = [new Image(), new Image()]

playerAnims[0].src = "../assets/sprites/playerMove1.png"
playerAnims[1].src = "../assets/sprites/playerMove2.png"

let animStates = {}
let framesPerCycle = 10

let playerHeight, playerWidth

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
      playerHeight = playerIdle.height * (size * 6.5 / playerIdle.width)
      playerWidth = size * 5.5

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
    let player = game.players[playerName];
    let pos = player.pos
    let direction = player.direction;

    pos.x += (direction.x * (game.tps * game.player_speed * timePassed));
    pos.y += (direction.y * (game.tps * game.player_speed * timePassed));

    // Taking away direction so it looks like player is moving to next pos
    drawCharacter(player, animStates[playerName]);
  }

  game.bullets.forEach((bullet) => {
    let pos = bullet.pos;
    let direction = bullet.direction;

    pos.x += direction.x * (game.tps * game.bullet_speed * timePassed);
    pos.y += direction.y * (game.tps * game.bullet_speed * timePassed);

    context.fillStyle = bulletColour;
    context.fillRect(bullet.pos.x * size, bullet.pos.y * size, size * 1.25, size / 2);
  })

  window.requestAnimationFrame(() => {
    drawGame(localGame);
  });
}

function resetBoard() {
  context.fillStyle = bgColour;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCharacter(player, animState) {
  let x = player.pos.x
  let y = player.pos.y
  let health = player.health
  let direction = player.direction

  // Player
  context.save()

  // Flips the player
  if (animState.lastDirection == -1) {
    context.scale(-1, 1);
    x += playerWidth / size
    x *= -0.97
  }

  if (direction.x == 0) {
    context.drawImage(playerIdle, x * size, (y - 6) * size, playerHeight, playerWidth)
    
    // Reset animation
    animState.currentAnimFrame = 0
    animState.currentAnimCycle = 0
  } else {
    animState.lastDirection = direction.x

    // Cycles through animations
    context.drawImage(playerAnims[animState.currentAnimCycle], x * size, (y - 6) * size, playerHeight, playerWidth)
    animState.currentAnimFrame++
    if (animState.currentAnimFrame >= framesPerCycle) {
      if (animState.currentAnimCycle == playerAnims.length - 1) {
        animState.currentAnimCycle = 0
      } else {
        animState.currentAnimCycle++
      }
      animState.currentAnimFrame = 0
    }
  }
  
  // Need to restore canvas state just in case the player was flipped
  x = player.pos.x
  context.restore()

  // Health Bar
  context.fillStyle = healthColor2
  context.fillRect((x + 0.5) * size, (y - 7.5) * size, size * 4, size)

  if (health > 0) {
    context.fillStyle = healthColor1
    context.fillRect((x + 0.5) * size, (y - 7.5) * size, size * 4 * (health / 100), size)
  }

  // Mouse
  context.beginPath();
  context.moveTo((x + 5.5) * size, (y - 4) * size)
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
    socket.emit("change-direction", { x: 0, y: 0 }, "multiplayer");
  }
});



window.addEventListener("mousemove", (event) => {
  mousePosition.x = event.clientX - event.target.getBoundingClientRect().left
  mousePosition.y = event.clientY - event.target.getBoundingClientRect().top
})

window.addEventListener("mousedown", () => {
  socket.emit("new-bullet", { x: mousePosition.x / size, y: (mousePosition.y / size)})
})

socket.on("player-connected", (playerName) => {
  socket.emit("server-message", playerName + " has connected!");
  userName = playerName;
  init();
});

function updateAnimStates(currentState, players) {
  players.forEach(playerName => {
    if (!Object.keys(currentState).includes(playerName)) {
      currentState[playerName] = {
        currentAnimCycle: 0,
        currentAnimFrame: 0,
        lastDirection: 1,
      }
    }
  })
  return currentState
}

socket.on("new-gamestate", (gamestate) => {
  localGame = gamestate;
  animStates = updateAnimStates(animStates, Object.keys(localGame.players));
});

// Daniyal's game is the best and I'm part of it. :) - Walter Wood