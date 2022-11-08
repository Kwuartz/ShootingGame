module.exports = {
  createGameState,
  createNewPlayer,
  gameLoop,
}

const { GRIDSIZE } = require("./constants")

function createGameState() {
  return {
    players: {},
    bullets: [],
    fps: 11,  
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
    
    pos.x += direction.x
    pos.y += direction.y
  }

  bullets.forEach((bullet) => {
    let pos = bullet.pos
    let direction = bullet.direction

    pos.x += direction.x
    pos.y += direction.y
  })
  return gamestate
}