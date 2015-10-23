
Config = require "../config/Config.coffee"
Utils = require "../utils/Utils.coffee"
Renderer = require "../gfx/Renderer.coffee"

HeavyAudioInterface = require "../heavy/HeavyAudioInterface.coffee"

MuseumScene = require "../scenes/MuseumScene.coffee"
# DisplaySocketHandler = require "../display/DisplaySocketHandler.coffee"

DebugView = require "../debug/DebugView.coffee"
MapView = require "../mapView/MapView.coffee"

IntroPage = require "../pages/IntroPage.coffee"

class TuneInApp
	constructor:()->

		@debugView = DebugView
		@debugView.init()

		@userCountElement = $ "userCount"

		@renderer = new Renderer $ "renderer"
		@scene = new MuseumScene()

		@map = new MapView($("map"))
		@audio = new HeavyAudioInterface(testLib)
		Main.audio = @audio

		@introPage = new IntroPage()

		@loaded = false


	init:()=>

		window.addEventListener "resize", @resize
		window.addEventListener "orientationchange", @resize

		@resize()

		@scene.on "loaded", @onSceneLoaded
		@scene.init("./json/Map01.json")


	onSceneLoaded:()=>

		@map.init(@scene.mapData)
		@scene.on "userPosition", @onUserPositionChange
		@scene.on "userAngle", @onUserAngleChange

		@audio.on "loaded", @onAudioLoaded
		@audio.on "message", @onAudioMessage
		@audio.init()
		

	onAudioLoaded:()=>

		# setup params for testLib
		@audio.sendFloat "pwm-freq", 0.5
		@audio.sendFloat "note-1", 0.5
		@audio.sendFloat "ba", 0.5
		@audio.sendFloat "pwm-amt", 0.5
		@audio.sendFloat "note-2", 0.5
		@audio.sendFloat "positions", 0.5
		@audio.sendFloat "transpose", 0.5
		@audio.sendFloat "note-3", 0.5
		@audio.sendFloat "hh", 0.5
		@audio.sendFloat "listener-direction", 0.5
		@audio.sendFloat "listener-y", 0.5
		@audio.sendFloat "listener-x", 0.5
		@audio.sendFloat "kick", 0.5
		@audio.sendFloat "note-0", 0.5


		@audio.sendString "test", "test"

		@audio.reset()
		@renderer.init(@scene.scene, @scene.camera)
		
		@introPage.init("intro", "./html/intro.html", document.body.querySelector("#container"))
		@introPage.on("loaded", @onIntroLoaded)

	onIntroLoaded:()=>
		# @introPage.show()
		@scene.enableControls()
		@loaded = true
		# @introPage.on("hide", ()=>
			
		# 	@scene.enableControls()
		# 	)


	onAudioMessage:(data)=>
		if data.address == "js-soundfiler"
			# received instruction from PD to load a new IR
			tableId = data.parts[4]
			azimuth = data.parts[2]
			elevation = data.parts[3]

			tableId = tableId
			azimuth = Utils.padZeros3(azimuth)
			elevation = Utils.padZeros3(elevation)

			url = "./audio/IRC_1018_C/IRC_1018_C_R0195_T#{azimuth}_P#{elevation}.wav"

			concatString1 = "T#{azimuth}_P#{elevation}-1"
			concatString2 = "T#{azimuth}_P#{elevation}-2"
			receiver1 = "#{tableId}-conv-1"
			receiver2 = "#{tableId}-conv-2"
			@audio.sendString receiver1, concatString1
			@audio.sendString receiver2, concatString2

			# @audio.addSampleToQueue(tableId, url)
			# @audio.loadNextAudio()

	onUserPositionChange:(data)=>
		# @map.setUserPosition(data.x, data.y)
		@audio.sendFloat "listener-x", data.x * 32
		@audio.sendFloat "listener-y", data.y * 32

	onUserAngleChange:(angle)=>
		# @map.setUserAngle(angle)
		
		# angle conversion for pd
		angle-=90
		angle = angle % 360
		if angle < 0 then angle += 360
		@audio.sendFloat "listener-direction", angle

	render:()=>

		if @loaded

			@scene.cameraAnchor.set(
				0,
				0,
				@debugView.settings.cameraZ
				)

			@scene.update()

			@renderer.render @scene

	resize:()=>
		if @loaded
			@renderer.resize()


module.exports = TuneInApp