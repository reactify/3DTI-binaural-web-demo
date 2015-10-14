EventEmitter 	= require('events').EventEmitter

class DebugView extends EventEmitter

	constructor:()->

	init:()->

		console.warn "called init"

		@gui = new dat.GUI { width : 300 }


		queryParams = Main.getQueryParams()
		@settings = {
			'cameraX': 			70
			'cameraY': 			0
			'cameraZ': 			600
			'cameraLookAtX':	0
			'cameraLookAtY':	0
			'cameraLookAtZ':	0
			'maxVelocity':		300
			'speedStep':		2
		}

		@movementFolder = @gui.addFolder "Movement"
		@movementFolder.add(@settings, 'maxVelocity', 50, 500).name("Max. Velocity").onChange(@_notifyChange)
		@movementFolder.add(@settings, 'speedStep', 0.5, 5).name("Acceleration").onChange(@_notifyChange)
		@movementFolder.open()

		# @cameraFolder = @gui.addFolder "Camera"
		# @cameraFolder.add @settings, 'cameraX', -500,800
		# @cameraFolder.add @settings, 'cameraY', -500,800
		# @cameraFolder.add @settings, 'cameraZ', -500,800

		# @cameraFolder.open()

		# #scenes
		# Scenes = Config.Scenes
		# @sceneFolder = @gui.addFolder "Scenes"
		# @scenesList = []
		# for sceneName of Scenes
		# 	@scenesList.push(sceneName)

		# sceneChoice = @sceneFolder.add(@settings, 'sceneJump', @scenesList).name("Change Scene")
		# @sceneFolder.add(@settings, 'nextCamera').name("Next Camera")
		# @sceneFolder.add(@settings, 'currentCamera').listen()
		# sceneChoice.onChange((value)=>
		# 	@emit('sceneChange', value)
		# )
		# @sceneFolder.add(@settings, 'cameraFOV', 20, 110)
		# @sceneFolder.add(@settings, 'avatarX', -200, 200)
		# @sceneFolder.add(@settings, 'avatarY', -500, 200)
		# @sceneFolder.add(@settings, 'avatarZ', -200, 200)
		# @sceneFolder.add(@settings, 'manualAvatar')
		

		# @sceneFolder.add(@settings, 'currentScene').listen()

		# #bots
		# @botsFolder = @gui.addFolder "Bots"
		# @botsFolder.add(@settings, 'resetUsername')
		# @botsFolder.add(@settings, 'clearAllThreads')
		# @botsFolder.add(@settings, 'currentJeff').listen()
		# @botsFolder.add(@settings, 'showJeff')
		# @botsFolder.add(@settings, 'attachKeyboard')
		# @botsFolder.add(@settings, 'detachKeyboard')
		# @botsFolder.add(@settings, 'changeAutobot').name("Toggle Autobot mode")
		# @botsFolder.add(@settings, 'growlMode').name("Toggle Growl mode").onChange((value)=> 
		# 	@emit("growlMode", null))
		# @botsFolder.add(@settings, 'cssRenderEnabled').name("Enabled CSS render")
		# @botsFolder.add(@settings, 'cssScaleConstant', 0.001, 0.003).name("CSS distance scale constant")
		# @botsFolder.add(@settings, 'cssFovScaleConstant', 0.005, 0.02).name("CSS FOV scale constant")
		# @botsFolder.add(@settings, 'cssUserScaleConstant', 0.001, 0.01).name("CSS user scale constant")
		

		# #fx
		# @domFx = new DomFX()
		# @fxFolder = @gui.addFolder "Fx"

		# @textIntonations = ["default","small-1","small-2","small-3","large-1","large-2","large-3"]
		# textIntonations = @fxFolder.add(@settings, "textIntonations", @textIntonations).name("Text Intonations")
		# textIntonations.onChange((value)=>
		# 	message = document.body.querySelector(".bot_history")
		# 	message.className = "bot_history waiting"
		# 	message.className += " " + value
		# )

	_notifyChange:()=>
		@emit("change", @settings)


module.exports = new DebugView()