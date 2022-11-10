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
  TICKS_PER_UPDATE,
  UPDATES_PER_SECOND
} = require('./constants')

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

  socket.on("new-bullet", (target) => {
    if (multiplayerPlayers[socket.id]) {
      const userName = multiplayerPlayers[socket.id].userName;
      const room = multiplayerPlayers[socket.id].room;
      
      
      const game = multiplayerGames[room];
      const player = game.players[userName]

      const offset = {x: target.x - player.pos.x, y: target.y - player.pos.y}
      
      // Finds larger offset value and uses that to calculate direction of bullet
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (offset.x < 0) {
          offset.y /= Math.abs(offset.x)
        } else {
          offset.y /= offset.x
        }
        offset.x = (offset.x > 0) ? 1 : -1
      } else {
        // Weird things happen when youu divided two negative numbers
        if (offset.y < 0) {
          offset.x /= Math.abs(offset.y)
        } else {
          offset.x /= offset.y
        }
        offset.y = (offset.y > 0) ? 1 : -1
      }
      
      game.bullets.push({player: userName, pos: {x: player.pos.x, y: player.pos.y - 2}, direction: offset})
    }
  })
})

function gameInterval(room, gamestate) {
  // Game interval
  gamestate.interval = setInterval(() => {
    gamestate = gameLoop(gamestate);
    io.to(room).emit("new-gamestate", gamestate);
  }, 1000 / UPDATES_PER_SECOND);
}

httpServer.listen(port, () => {
  console.log(`Listenting on port ${port}`)
})