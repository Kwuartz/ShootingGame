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
  GRAVITY
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
    gravity: GRAVITY,
    gridSize: GRIDSIZE,
  };
}

function createNewPlayer() {
  return {
    pos: { x: 10, y: 60 },
    direction: { x: 0, y: 0 },
    health: 100,
    falling: true,
    jump_power: 0,
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

  // Game checks
  for (playerName in players) {
    let player = players[playerName];
    let pos = player.pos;
    let direction = player.direction;

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
    player.falling = true;

    if (player.jump_power) {
      player.falling = false
    }

    platforms.forEach((platform) => {
      if (
        player.falling &&
        pos.x + PLAYER_SIZE.x / 2 > platform.startX &&
        pos.x + PLAYER_SIZE.x / 2 < platform.endX &&
        pos.y > platform.startY &&
        pos.y < platform.startY + PLAYER_SPEED * GRAVITY * 7
      ) {
        player.falling = false;
        player.direction.y = 0
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

    if (player.jump_power > 0) {
      direction.y = -player.jump_power
      player.jump_power -= (GRAVITY / player.jump_power)
      if (player.jump_power < 0) {
        player.jump_power = 0
      }
    } else if (player.falling) {
      if (player.direction.y < GRAVITY) {
        player.direction.y = GRAVITY
      } else {
        player.direction.y += (GRAVITY / player.direction.y)
        if (player.direction.y > GRAVITY * 7) {
          player.direction.y = GRAVITY * 7
        }
      }
    } else {
      direction.y = 0
    }
  }

  return gamestate;
}
