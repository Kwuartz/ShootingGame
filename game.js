module.exports = {
  createGameState,
  createNewPlayer,
  gameLoop,
}

const {
  GRIDSIZE,
  BULLET_SPEED,
  PLAYER_SPEED,
  TICKS_PER_UPDATE,
  UPDATES_PER_SECOND
} = require("./constants")

function createGameState() {
  return {
    players: {},
    bullets: [],
    player_speed: PLAYER_SPEED,
    bullet_speed: BULLET_SPEED,
    tps: TICKS_PER_UPDATE * UPDATES_PER_SECOND,  
    gridSize: GRIDSIZE
  }
}

function createNewPlayer() {
  return {
    pos: {x: 10, y: 10},
    direction: {x: 0, y: 0},
    dead: false
  }
}

function gameLoop(gamestate) {
  let players = gamestate.players
  let bullets = gamestate.bullets
  for (playerName in players) {
    let player = players[playerName]
    let pos = player.pos
    let direction = player.direction
    
    pos.x += direction.x * PLAYER_SPEED
    pos.y += direction.y  * PLAYER_SPEED
  }

  bullets.forEach((bullet) => {
    let pos = bullet.pos
    let direction = bullet.direction

    pos.x += direction.x * BULLET_SPEED
    pos.y += direction.y * BULLET_SPEED
  })

  // Game checks
  for (playerName in players) {
    let player = players[playerName]
    let pos = player.pos

    bullets.forEach((bullet) => {
      let bulletPos = bullet.pos
      if (pos.x == bulletPos.x && pos.y) {
        
      }
    }) 
  }

  return gamestate
}