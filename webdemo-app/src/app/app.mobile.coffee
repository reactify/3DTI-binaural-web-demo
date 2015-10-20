PhoneControllerClient = require "../mobile/PhoneControllerClient.coffee"
JoystickView = require "../mobile/JoystickView.coffee"

class TuneInAppMobile
	constructor:()->

		@loaded = false

		@codeDialog = $('mobileDialog')

		@codeInput = @codeDialog.querySelector("input")
		@codeInput.addEventListener("change", @onCodeValueChange)
	
		@joystick = new JoystickView()
		@joystick.init()


		@controller = new PhoneControllerClient()
		@controller.on "move", @joystick.onMove
		@controller.on "stop", @joystick.onStop

		# DEBUG
		@controller.onSocketStart("2")


	init:()=>

		window.addEventListener "resize", @resize
		window.addEventListener "orientationchange", @resize

		@resize()

		@loaded = true

	onJoinButtonPress:()=>

		if !@gameId
			@joinButton.classList.remove("enabled")

			@gameId = @codeInput.value.toUpperCase()

			#DEBUG
			# @gameId = "TEST"

			console.log "trying to connect with game id : #{@gameId}"

			@controlClient.on("start", @onGameStart)
			@controlClient.on("error", @onConnectError)

			@controlClient.init(@gameId)
		else
			@controlClient.connectToGame(@gameId)
		

	render:()=>

		# if @loaded

	resize:()=>


module.exports = TuneInAppMobile