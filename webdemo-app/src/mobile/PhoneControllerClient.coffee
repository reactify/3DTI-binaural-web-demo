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
		document.body.removeEventListener("mousemove", @onInput)
		document.body.addEventListener("mousemove", @onInput)

		document.body.removeEventListener("mousedown", @onInput)
		document.body.addEventListener("mousedown", @onInput)

		@emit("start", data)


	onInput:(e)=>

		# console.log e

		dX = ((e.x / document.body.clientWidth) - 0.5) * 2
		dY = ((e.y / document.body.clientHeight) - 0.5) * 2

		if @socket
			@socket.emit "moved", { x : dX, y : dY }

		@emit "moved", { x : dX, y : dY }

	onInputStop:()=>
		if @socket
			@socket.emit "stop", null
		@emit "stop", null


	# onClickButton:()=>
	# 	if @socket
	# 		@socket.emit "click", null

	# onSignal:(message)=>
	# 	if @socket
	# 		@socket.emit "signal", message

	# onDeviceOrientation:(e)=>

	# 	if @origin == null
	# 		@origin = {
	# 			alpha : e.alpha
	# 			beta : e.beta
	# 			gamma : e.gamma
	# 		}
	# 		return
	# 	else
	# 		@motionData.alpha = Utils.rd Utils.trigAngleDiff( e.alpha, @origin.alpha )
	# 		@motionData.beta = Utils.rd Utils.trigAngleDiff( e.beta, @origin.beta )
	# 		@motionData.gamma = Utils.rd Utils.trigAngleDiff( e.gamma, @origin.gamma )

	# 		if @socket
	# 			@socket.emit("motion", @motionData)

	reset:()=>
		@origin = null



module.exports = PhoneControllerClient