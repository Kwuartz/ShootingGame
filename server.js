express = require('express')
app = express()
httpServer = require('http').Server(app)
port = 3000
io = require('socket.io')(httpServer, {
  cors: {
    origin: [`localhost:${port}`]
  }
})

app.use(express.static(__dirname + '/public/'))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/main/index.html")
})

app.get("/game", (req, res) => {
  res.sendFile(__dirname + "/public/game/index.html")
})

const {
  createGameState,
  createNewPlayer,
  gameLoop,
} = require("./game");

const multiplayerPlayers = {};
let multiplayerGames = {}

io.on("connection", (socket) => {
  console.log(`User has connected with id: ${socket.id}`)

  socket.on("new-multiplayer", (userName) => {
    if (Object.values(multiplayerPlayers).includes(userName)) {
      socket.emit("username-taken");
    } else {
      let room
      for (gameRoom in multiplayerGames) {
        if (Object.keys(multiplayerGames[gameRoom].players).length < 10) {
          room = gameRoom
          console.log(`${userName} has joined room ${room}!`)
        }
      }
      if (!room) {
        room = `multi${Object.keys(multiplayerGames).length}`
        multiplayerGames[room] = createGameState();
        gameInterval(room, multiplayerGames[room]);
        console.log(`New multiplayer game instance created: ${room}!`);
      }

      socket.join(room);
      multiplayerPlayers[socket.id] = {}
      multiplayerPlayers[socket.id].userName = userName;
      multiplayerPlayers[socket.id].room = room
      console.log(userName + " has connected!");
      socket.emit("player-connected", userName);
      multiplayerGames[room].players[userName] = createNewPlayer(multiplayerGames[room]);

      // Sending the room the gamestate again each time a new player joins
      let initialGamestate = { ...multiplayerGames[room] };
      delete initialGamestate.interval;
      delete initialGamestate.colours;
      io.to(room).emit("new-gamestate", initialGamestate);
    }
  });

  socket.on("disconnect", () => {
    console.log("Player " + socket.id + " disconnected");
    if (multiplayerPlayers[socket.id]) {
      const room = multiplayerPlayers[socket.id].room
      const userName = multiplayerPlayers[socket.id].userName;
      if (userName) {
        if (multiplayerGames[room].players[userName]) {
          delete multiplayerGames[room].players[userName];
        }
        delete multiplayerPlayers[socket.id];
        if (Object.keys(multiplayerGames[room].players).length <= 0) {
          clearInterval(multiplayerGames[room].interval);
          delete multiplayerGames[room];
          console.log("Multiplayer game and interval instance terminated!");
        }
      }
    }
  });


  socket.on("change-direction", (direction) => {
    const userName = multiplayerPlayers[socket.id].userName;
    const room = multiplayerPlayers[socket.id].room
    if (multiplayerGames[room].players) {
      let player = multiplayerGames[room].players[userName];
      player.direction = {...player.direction, ...direction};
    }
  })

  socket.on("shoot", (target) => {
    const userName = multiplayerPlayers[socket.id].userName;
    const room = multiplayerPlayers[socket.id].room;
    
    const game = multiplayerGames[room];
    const player = game.players[userName]

    const offset = {x: target.x - player.pos.x, y: target.y - player.pos.y}

    const isPositive = Math.max(offset.x, offset.y) >= 0

    if (offset.x == 0) {offset.x = 0.001}
    if (offset.y == 0) {offset.y = 0.001}
    
    if (offset.x > offset.y) {
      offset.y /= offset.x
      if (isPositive) {offset.x = 1} else {offset.x = -1}
    } else {
      offset.x /= offset.y
      if (isPositive) {offset.y = 1} else {offset.y = -1}
    }

    game.bullets.push({player: userName, pos: {x: player.pos.x, y: player.pos.y}, direction: offset})
  })
})

function gameInterval(room, gamestate) {
  // Game interval
  gamestate.interval = setInterval(() => {
    gamestate = gameLoop(gamestate);
    io.to(room).emit("new-gamestate", gamestate);
  }, 1000 / gamestate.fps);
}

httpServer.listen(port, () => {
  console.log(`Listenting on port ${port}`)
})