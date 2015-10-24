EventEmitter = require("events").EventEmitter


class PhoneControllerClient extends EventEmitter
	constructor:()->

		@origin = null

	init:(@gameId)->

		@socket = io.connect((location.host || 'localhost').split(':')[0] + ":8080")
		@socket.on("connection", ()=>
			@connectToGame(@gameId)
			)

		@socket.on("errorMessage", (data)=>
			@emit("error", data)
		)
		@socket.on("start", @onSocketStart)

	connectToGame:(gameId)=>
		if @socket
			@socket.emit("identifyPhone", gameId)

	onSocketStart:(data)=>
		
		@emit("start", data)

	step:(stepSize)=>
		if @socket
			@socket.emit "step", stepSize

	strafe:(direction)=>
		if @socket
			@socket.emit "strafe", direction

	look:(lookData)=>
		if @socket
			@socket.emit "look", lookData


module.exports = PhoneControllerClient