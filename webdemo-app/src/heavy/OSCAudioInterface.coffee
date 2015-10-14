AudioInterface = require "./AudioInterface.coffee"


class OSCAudioInterface extends AudioInterface
	constructor:()->

	
	init:()->

		@ioSocket = io.connect("http://localhost:8088/");
		@ioSocket.emit("config", { 
			"server" : {
				"port" : 8888
				"host" : "localhost"
			}
			"client" : {
				"port" : 9000
				"host" : "localhost"
			}

			})

		@ioSocket.on("message", (oscMessage)=>
			console.log(oscMessage)
			@emit "message", { address : oscMessage[0].replace(/\//g, ""), value : oscMessage[1] }
			)


	reset:()->

		# go back to kick drum
		# @sendFloat("A-reset", 1)
		@sendFloat("reset-all", 1)
		# @sendFloat("to-section-A", 1)
		# @sendFloat("A-kick-on", 1)

		@sendFloat("fx-delay-on", 0)
		@sendFloat("fx-reverse-on", 0)
		@sendFloat("fx-filter-on", 0)


	backToStart:()=>
		@sendFloat("to-section-A", 1)

	end:()->

		# play ending
		@sendFloat("to-end", 1)

	sendBang:(inlet)->

		inlet = "/" + inlet

		# console.log "sending osc bang to #{inlet}" 

		# send bang to pd to given inlet
		@ioSocket.emit("message", { address : inlet, value : "bang"} )
			

	sendFloat:(inlet, value)->

		if value == null then return

		inlet = "/" + inlet

		# console.log "sending osc float to #{inlet}, value #{value}" 

		# send float to given inlet
		@ioSocket.emit("message", { address : inlet, value : value } )



module.exports = OSCAudioInterface