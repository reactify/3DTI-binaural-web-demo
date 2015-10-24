EventEmitter = require("events").EventEmitter
Utils = require "../utils/Utils.coffee"

CODE_LENGTH = 4

class PhoneController extends EventEmitter
	constructor:()->


		@enabled = false
		@started = false

		@vScale = 50.0
		@hScale = 25.0

		@screenX = 0
		@screenY = 0

		@lastMotionData = null
		@lastRelX = 0

		@displaySize = { w : window.innerWidth, h : window.innerHeight }

		@clickTimeoutId = -1

	init:()->

		# @gameId = @createGameId()
		@gameId = "DEMO"

		if (typeof(io) == "undefined")
			console.error "Socket.IO not loaded"
			return

		@socket = io.connect((document.location.hostname).split(':')[0] + ":8080")
		# @socket = io.connect((location.host || 'localhost').split(':')[0] + ":8080")
		@socket.on("connection", ()=>
			@socket.emit("identifyBrowser", @gameId)
			)
		
		@socket.on("start", ()=>
			if @started then return
			else 
				@started = true
				console.log "Phone Controller started"
				@emit("start", null)
			)

		@socket.on("step", @onStepEvent.bind(this))
		@socket.on("look", @onLookEvent.bind(this))
		@socket.on("strafe", @onStrafeEvent.bind(this))
		
		@socket.on("errorMessage", (data)=>
			@emit("error", data)

			if (data.code == "exists")
				@gameId = @createGameId()
				@emit "codeChange", @gameId
				@socket.emit "identifyBrowser", @gameId
			)

	onStepEvent:(stepSize)=>
		@emit "step", stepSize

	onStrafeEvent:(direction)=>
		@emit "strafe", direction

	onLookEvent:(lookData)=>
		@emit "look", lookData

	createGameId:()=>

		text = ""
		possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

		for i in [0..CODE_LENGTH-1] by 1
			text += possible.charAt(Math.floor(Math.random() * possible.length))

		return text



	start:()->
		@enabled = true

	stop:()->
		@enabled = false


	resize:()->
		@displaySize = { w : window.innerWidth, h : window.innerHeight }







module.exports = PhoneController