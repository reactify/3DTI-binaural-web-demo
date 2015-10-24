io = require('socket.io').listen(8080)
winston = require('winston')

winston.add winston.transports.File, { filename: 'display-server.log', handleExceptions : false }
winston.info "Started Phone Socket Server"

games = {}

io.sockets.on('connection', (socket)=>

	socket.emit "connection", null

	winston.info "Socket connected.."

	do(socket)=>
		socket.on "identifyPhone", (gameId)=>

			winston.info "Phone connected with code #{gameId}"

			if games.hasOwnProperty(gameId)
				winston.info "Game has already started with this code, adding phone"
				addPhoneToGame(gameId, socket)

			else
				# if the game doesn't exist yet, there's a problem
				winston.warn "Unknown game #{gameId} accessed by phone"
				socket.emit("errorMessage", "Unknown Game")

		socket.on "identifyBrowser", (gameId)=>

			if gameId == "TEST"
				delete games[gameId]

			winston.info "Browser connected with code #{gameId}"

			if games.hasOwnProperty(gameId)
				winston.warn "Browser trying to connect to game that already exists"
				socket.emit "errorMessage", { message : "Game already exists", code : "exists" }
			else
				# New game, let's create one
				games[gameId] = {
					id : gameId
					browserSocket : socket
					phoneSocket : null
				}

				do(gameId)=>
					games[gameId].browserSocket.on("disconnect", ()=>
						winston.info "game #{gameId} terminated by browser"
						games[gameId] = null
						delete games[gameId]
					)

		socket.on("error", (data)=>
			winston.error data
			)




addPhoneToGame = (gameId, socket)=>

	gameData = games[gameId]
	gameData.phoneSocket = socket

	if gameData.browserSocket
		gameData.phoneSocket.on("look", (motionData)=>
			gameData.browserSocket.emit("look", motionData)
			)
		gameData.phoneSocket.on("step", (stepData)=>
			console.log "step from phone"
			gameData.browserSocket.emit("step", stepData)
			)
		gameData.phoneSocket.on("strafe", (direction)=>
			console.log "strafe from phone"
			gameData.browserSocket.emit("strafe", direction)
			)
		gameData.phoneSocket.on("signal", (signalData)=>
			console.log "signal from phone : #{signalData}"
			gameData.browserSocket.emit("signal", signalData)
			)
		gameData.phoneSocket.emit("start", null)
		gameData.browserSocket.emit("start", null)
		winston.info "Game #{gameId} connected successfully"

	else
		winston.warn "Game has no browser socket attached"
		gameData.phoneSocket.emit("errorMessage", "No Browser attached")







)
