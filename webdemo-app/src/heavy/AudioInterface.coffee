EventEmitter = require("events").EventEmitter

class AudioInterface extends EventEmitter
	constructor:()->

		# extend this class for OSC / heavy versions
	
	init:()->

		# load heavy patch, create OSC sockets etc

	
	backToStart:()=>

	reset:()->

		# go back to kick drum

	end:()->

		# play ending

	sendBang:(inlet)->

		# send bang to pd to given inlet

	sendFloat:(inlet, value)->

		# send float to given inlet



module.exports = AudioInterface