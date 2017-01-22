Utils = require "../utils/Utils.coffee"
AudioInterface = require "./AudioInterface.coffee"

# should be of the form { id : [some id], url : [complete URL]}
SAMPLE_LIST = [
	{ id:"3DTI-intro-pt1", url:"audio/3DTI-intro-pt1-mono.mp3" },
	{ id:"3DTI-intro-pt2", url:"audio/3DTI-intro-pt2-mono.mp3" },
	{ id:"cafe-chat", url:"audio/cafe-chat.mp3" }
]



NUM_SAMPLES = SAMPLE_LIST.length


class HeavyAudioInterface extends AudioInterface
	constructor:(heavyLibObject)->

		@context = new (window.AudioContext || window.webkitAudioContext)
		@blockSize = 2048

		@loaded = false

		@gainNode = @context.createGain()
		@gainNode.connect @context.destination
		@gainNode.gain.value = 0
		
		@patch = new heavyLibObject({
			sampleRate : @context.sampleRate,
			blockSize : @blockSize
			printHook : @_printHook
			sendHook : @_sendHook
			})

		# for debugging
		window._heavyPatch = @patch

		@processor = @context.createScriptProcessor(
			@blockSize,
			@patch.getNumInputChannels(),
			Math.max(@patch.getNumOutputChannels(), 1)
			)

		@processor.onaudioprocess = (e)=>
			@patch.process(e)
	
	init:()->
		for i in [0...24]
			for j in [0...7]
				if j > 3
					j = j+17
				irName = "T"+Utils.padZeros3(i*15)+"_P"+Utils.padZeros3(j*15)
				irURL = "./audio/IRC_1018_C/IRC_1018_C_R0195_"+irName+".wav"
				console.log "pushing sample #{irName} from url #{irURL} to queue"
				SAMPLE_LIST.push({
					id : irName
					url : irURL
				})

		@rq = new XMLHttpRequest()
		@rq.onload = @_rqOnLoad
		@loadNextAudio()

		# @ioSocket.on("message", (oscMessage)=>
		# 	console.log(oscMessage)
		# 	@emit "message", { address : oscMessage[0].replace(/\//g, ""), value : oscMessage[1] }
		# 	)

	addSampleToQueue:(sampleId, sampleUrl)=>
		console.log "pushing sample #{sampleId} from url #{sampleUrl} to queue"
		SAMPLE_LIST.push({
			id : sampleId
			url : sampleUrl
			})
	
	loadNextAudio:()=>
		if SAMPLE_LIST.length
			@currentSample = SAMPLE_LIST.pop()

			# url = "./assets/audio/" + @currentSample.id + @fileExtension + "?rnd=" + Math.floor(Math.random() * 10000)
			
			@rq.open("GET", @currentSample.url, true)
			@rq.responseType = "arraybuffer"
			@rq.send()

		else if not @loaded
			@loaded = true
			@processor.connect @gainNode
			@patch.sendFloatToReceiver("tick-on", 1.0);
			@emit "loaded", null
		else
			@emit "allAudioLoaded", null

	_rqOnLoad:()=>
		audioData = @rq.response
		@context.decodeAudioData(audioData, (buffer)=>
			console.log "Finished loading #{@currentSample.id}"
			console.log "normal length "
			if buffer.sampleRate != @context.sampleRate
				@_convertSample(buffer, (resampledBuffer)=>
					@_sendCurrentToHeavy(resampledBuffer)
					@loadNextAudio()
					)
			else
				# Send to Heavy
				@_sendCurrentToHeavy(buffer)
				@loadNextAudio()
			)

		sampleLoadProgress = 1.0 - (SAMPLE_LIST.length / NUM_SAMPLES)
		@emit "loadProgress", sampleLoadProgress

	_sendCurrentToHeavy:(buffer)=>
		if buffer.numberOfChannels == 2
			table = @patch.getTableForName(@currentSample.id + "-1")
			table.setBufferWithData(buffer.getChannelData(0))
			table = @patch.getTableForName(@currentSample.id + "-2")
			table.setBufferWithData(buffer.getChannelData(1))
		else
			table = @patch.getTableForName(@currentSample.id)
			table.setBufferWithData(buffer.getChannelData(0))

	_convertSample:(buffer, callback)=>
		console.log "Resampling #{@currentSample.id} from #{buffer.sampleRate} to #{@context.sampleRate}"
		resamplingRate = @context.sampleRate / buffer.sampleRate
		outputLength = buffer.length * resamplingRate
		
		oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, Math.floor(outputLength), @context.sampleRate)
		source = oc.createBufferSource()
		source.buffer = buffer
		source.connect(oc.destination)
		source.start()
		oc.startRendering().then((newBuffer)=>


			callback(newBuffer)
			)


	reset:()->

		if not Main.getQueryParams()["mute"]
			@gainNode.gain.value = 1.0


	_printHook:(message)=>
		console.log message

		parts = message.split(" ")
		address = parts[1].replace(/\:/g, "")
		value = parseFloat(parts[2])

		console.log "message from heavy; address : #{address}, value : #{value}"
		
		@emit "message", { address : address, value : value, parts : parts }

	_sendHook:(message)=>
		console.log message
		parts = message.split(" ")
		address = parts[1].replace(/\:/g, "")
		value = parseFloat(parts[2])

		console.log "message from heavy; address : #{address}, value : #{value}"
		
		@emit "message", { address : address, value : value, parts : parts }
		
	end:()->

		# play ending
		@sendFloat("to-end", 1)

	sendBang:(inlet)->

		if not @loaded 
			console.error "tried to send bang to inlet #{inlet} before patch was loaded"
			return

		console.log "sending bang to #{inlet}"
		@patch.sendBangToReceiver inlet

	sendFloat:(inlet, value)->

		if not @loaded 
			console.error "tried to send float to inlet #{inlet} before patch was loaded"
			return

		console.log "sending float #{value} to #{inlet}"
		@patch.sendFloatToReceiver inlet, value

	sendString:(inlet, value)->

		if not @loaded 
			console.error "tried to send string to inlet #{inlet} before patch was loaded"
			return

		console.log "sending string #{value} to #{inlet}"
		@patch.sendStringToReceiver inlet, value



module.exports = HeavyAudioInterface