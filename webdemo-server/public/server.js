(function() {
  var addPhoneToGame, games, io, winston;

  io = require('socket.io').listen(8080);

  winston = require('winston');

  winston.add(winston.transports.File, {
    filename: 'display-server.log',
    handleExceptions: false
  });

  winston.info("Started Phone Socket Server");

  games = {};

  io.sockets.on('connection', (function(_this) {
    return function(socket) {
      socket.emit("connection", null);
      winston.info("Socket connected..");
      return (function(socket) {
        socket.on("identifyPhone", function(gameId) {
          winston.info("Phone connected with code " + gameId);
          if (games.hasOwnProperty(gameId)) {
            winston.info("Game has already started with this code, adding phone");
            return addPhoneToGame(gameId, socket);
          } else {
            winston.warn("Unknown game " + gameId + " accessed by phone");
            return socket.emit("errorMessage", "Unknown Game");
          }
        });
        socket.on("identifyBrowser", function(gameId) {
          if (gameId === "TEST") {
            delete games[gameId];
          }
          winston.info("Browser connected with code " + gameId);
          if (games.hasOwnProperty(gameId)) {
            winston.warn("Browser trying to connect to game that already exists");
            return socket.emit("errorMessage", {
              message: "Game already exists",
              code: "exists"
            });
          } else {
            games[gameId] = {
              id: gameId,
              browserSocket: socket,
              phoneSocket: null
            };
            return (function(gameId) {
              return games[gameId].browserSocket.on("disconnect", function() {
                winston.info("game " + gameId + " terminated by browser");
                games[gameId] = null;
                return delete games[gameId];
              });
            })(gameId);
          }
        });
        return socket.on("error", function(data) {
          return winston.error(data);
        });
      })(socket);
    };
  })(this), addPhoneToGame = (function(_this) {
    return function(gameId, socket) {
      var gameData;
      gameData = games[gameId];
      gameData.phoneSocket = socket;
      if (gameData.browserSocket) {
        gameData.phoneSocket.on("motion", function(motionData) {
          return gameData.browserSocket.emit("motion", motionData);
        });
        gameData.phoneSocket.on("click", function(clickData) {
          console.log("click from phone");
          return gameData.browserSocket.emit("click", clickData);
        });
        gameData.phoneSocket.on("signal", function(signalData) {
          console.log("signal from phone : " + signalData);
          return gameData.browserSocket.emit("signal", signalData);
        });
        gameData.phoneSocket.emit("start", null);
        gameData.browserSocket.emit("start", null);
        return winston.info("Game " + gameId + " connected successfully");
      } else {
        winston.warn("Game has no browser socket attached");
        return gameData.phoneSocket.emit("errorMessage", "No Browser attached");
      }
    };
  })(this));

}).call(this);
