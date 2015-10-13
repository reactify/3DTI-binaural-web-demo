EventEmitter = require("events").EventEmitter
Config = require "../config/Config.coffee"

class DisplaySocketHandler extends EventEmitter
	constructor:()->

		@socketConnected = false

		if (typeof(io) != "undefined")
			@socket = io.connect("http://" + Config.SERVER_IP + ":" + Config.SERVER_PORT)

			@socket.on "news", (data)=>
				console.log data
				@socket.emit 'my other event', { my : 'data' }

			@socket.on "connect", @_onSocketConnect
			@socket.on "disconnect", @_onSocketDisconnect

			@socket.on "userCountUpdated", (count)=>
				console.log "user count : #{count}"
				@emit "userCount", count

			@socket.on "buttonPressed", (buttonId)=>
				@emit "buttonPressed", buttonId

			@socket.on "buttonReleased", (buttonId)=>
				@emit "buttonReleased", buttonId

	_onSocketConnect:(data)=>
		@socketConnected = true
		@emit "connect", null

		@socket.emit "registerAsDisplay", "theDisplay"


	_onSocketDisconnect:(data)=>
		@socketConnected = false
		@emit "disconnect", null



module.exports = DisplaySocketHandler