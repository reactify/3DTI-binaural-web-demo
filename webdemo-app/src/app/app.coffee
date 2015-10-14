
Config = require "../config/Config.coffee"
Renderer = require "../gfx/Renderer.coffee"

MuseumScene = require "../scenes/MuseumScene.coffee"
# DisplaySocketHandler = require "../display/DisplaySocketHandler.coffee"

DebugView = require "../debug/DebugView.coffee"
MapView = require "../mapView/MapView.coffee"

class TuneInApp
	constructor:()->

		@debugView = DebugView
		@debugView.init()

		@userCountElement = $ "userCount"

		@renderer = new Renderer $ "renderer"
		@scene = new MuseumScene()

		@map = new MapView($("map"))

		@loaded = false


	init:()=>

		window.addEventListener "resize", @resize
		window.addEventListener "orientationchange", @resize

		@resize()

		@scene.on "loaded", @onSceneLoaded
		@scene.init("./json/Map01.json")


	onSceneLoaded:()=>

		@map.init(@scene.mapData)
		@scene.on "userPosition", (data)=>
			@map.setUserPosition(data.x, data.y)
		@scene.on "userAngle", (angle)=>
			@map.setUserAngle(angle)

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