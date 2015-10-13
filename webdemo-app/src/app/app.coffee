
Config = require "../config/Config.coffee"
Renderer = require "../gfx/Renderer.coffee"

MuseumScene = require "../scenes/MuseumScene.coffee"
# DisplaySocketHandler = require "../display/DisplaySocketHandler.coffee"

DebugView = require "../debug/DebugView.coffee"


class TuneInApp
	constructor:()->

		@debugView = DebugView
		@debugView.init()

		@userCountElement = $ "userCount"

		@renderer = new Renderer $ "renderer"
		@scene = new MuseumScene()

		@loaded = false


	init:()=>

		window.addEventListener "resize", @resize
		window.addEventListener "orientationchange", @resize

		@resize()

		@scene.on "loaded", @onSceneLoaded
		@scene.init("./json/Map01.json")


	onSceneLoaded:()=>
		@renderer.init(@scene.scene, @scene.camera)
		@loaded = true


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