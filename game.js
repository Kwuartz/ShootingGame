module.exports = {
  createGameState,
  createNewPlayer,
  gameLoop,
};

const {
  GRIDSIZE,
  BULLET_SPEED,
  PLAYER_SPEED,
  TICKS_PER_UPDATE,
  UPDATES_PER_SECOND,
  PLAYER_SIZE,
  FALL_SPEED,
} = require("./constants");

function createGameState() {
  return {
    players: {},
    bullets: [],
    platforms: [
      { startX: 10, startY: GRIDSIZE - 10, endX: GRIDSIZE - 10, endY: GRIDSIZE },
    ],
    player_speed: PLAYER_SPEED,
    bullet_speed: BULLET_SPEED,
    player_size: PLAYER_SIZE,
    tps: TICKS_PER_UPDATE * UPDATES_PER_SECOND,
    gridSize: GRIDSIZE,
  };
}

function createNewPlayer() {
  return {
    pos: { x: 10, y: 80 },
    direction: { x: 0, y: 0 },
    health: 100,
    falling: true,
    jumping: false,
  };
}

function gameLoop(gamestate) {
  let players = gamestate.players;
  let bullets = gamestate.bullets;
  let platforms = gamestate.platforms;

  // Moving
  for (playerName in players) {
    let player = players[playerName];
    let pos = player.pos;
    let direction = player.direction;

    pos.x += direction.x * PLAYER_SPEED;
    pos.y += direction.y * PLAYER_SPEED;
  }

  bullets.forEach((bullet) => {
    let pos = bullet.pos;
    let direction = bullet.direction;

    pos.x += direction.x * BULLET_SPEED;
    pos.y += direction.y * BULLET_SPEED;
  });

  platforms.forEach((platform) => {
    let startX = platform.startX;
    let endX = platform.endX;
    let startY = platform.startY;
  });

  // Game checks
  for (playerName in players) {
    let player = players[playerName];
    let pos = player.pos;
    let direction = player.direction;
    let falling = player.falling;

    // Bullet hit checks
    bullets.forEach((bullet) => {
      let bulletPos = bullet.pos;
      if (
        bulletPos.x > pos.x &&
        bulletPos.x < pos.x + PLAYER_SIZE.x &&
        bulletPos.y < pos.y &&
        bulletPos.y > pos.y - PLAYER_SIZE.y &&
        playerName != bullet.player
      ) {
        // Headshot check
        if (
          bulletPos.y < pos.y - PLAYER_SIZE.y + 1 &&
          bulletPos.y > pos.y - PLAYER_SIZE.y
        ) {
          player.health -= 15;
        }

        player.health -= 15;
        bullets.splice(bullets.indexOf(bullet), 1);
      }

      if (
        bullet.pos.x > GRIDSIZE ||
        bullet.pos.x < 0 ||
        bullet.pos.y > GRIDSIZE ||
        bullet.pos.y < 0
      ) {
        bullets.splice(bullets.indexOf(bullet), 1);
      }
    });

    // Platform checks
    falling = true;

    platforms.forEach((platform) => {
      if (
        falling &&
        pos.x + PLAYER_SIZE.x / 2 > platform.startX &&
        pos.x + PLAYER_SIZE.x / 2 < platform.endX &&
        pos.y > platform.startY &&
        pos.y < platform.startY + (platform.endY - platform.startY)
      ) {
        falling = false;
      }
    });

    // Out of bounds checks
    if (pos.x < 0 + PLAYER_SPEED) {
      pos.x = 0;
      direction.x = 0;
    } else if (pos.x > GRIDSIZE - PLAYER_SPEED - PLAYER_SIZE.x) {
      pos.x = GRIDSIZE - PLAYER_SIZE.x;
      direction.x = 0;
    }

    if (falling) {
      direction.y = FALL_SPEED;
    } else {
      direction.y = 0;
    }
  }

  return gamestate;
}
