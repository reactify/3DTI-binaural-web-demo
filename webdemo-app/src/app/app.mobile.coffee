PhoneControllerClient = require "../mobile/PhoneControllerClient.coffee"
StepView = require "../mobile/StepView.coffee"
LookView = require "../mobile/LookView.coffee"

class TuneInAppMobile
	constructor:()->

		@loaded = false
		@started = false

		@codeDialog = $('mobileDialog')

		@codeInput = @codeDialog.querySelector("input")
		@codeInput.addEventListener("change", @onCodeValueChange)

		@stepView = new StepView($('controls'))
		@lookView = new LookView($('lookControl'))

		@controller = new PhoneControllerClient()
		
		# @controller.on "move", @joystick.onMove
		# @controller.on "stop", @joystick.onStop

		# DEBUG
		@controller.onSocketStart("2")

		# prevent scroll
		preventDefaultHandler = (e)=>
			e.preventDefault()
			return false

		window.addEventListener "touchmove", preventDefaultHandler
		window.addEventListener "mousemove", preventDefaultHandler
		window.addEventListener "mousedown", preventDefaultHandler
		window.addEventListener "touchdown", preventDefaultHandler

	init:()=>

		window.addEventListener "resize", @resize
		window.addEventListener "orientationchange", @resize

		@resize()

		@controller.init("DEMO")
		@controller.on "start", @onControllerStart
		@controller.on "error", (error)=>
			console.log "error from socket interface : ", error

			if error == "Unknown Game"
				setTimeout(()=>
					@controller.connectToGame("DEMO")
				,2000)

		@loaded = true
		
	onControllerStart:()=>

		if @started then return
		@started = true

		@stepView.on "step", (stepSize)=>
			@controller.step(stepSize)
		@stepView.on "strafe", (direction)=>
			@controller.strafe(direction)
		@lookView.on "look", (lookData)=>
			@controller.look(lookData)

	render:()=>

		# if @loaded

	resize:()=>


module.exports = TuneInAppMobile