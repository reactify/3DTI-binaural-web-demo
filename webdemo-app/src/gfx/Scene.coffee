EventEmitter = require("events").EventEmitter


RenderSettings = require './RenderSettings.coffee'

class Scene extends EventEmitter
	constructor:()->
		@scene = new THREE.Scene()

		@cameraAnchor = new THREE.Vector3(0,0,0)
		@cameraOffset = new THREE.Vector3(0,0,0)

		@camera = new THREE.PerspectiveCamera 60, 1, 1, 10000
		@scene.add @camera

		@resize()

		if window.addEventListener
			window.addEventListener 'resize', ( e ) =>
				@resize()
			, false
			

		else if window.attachEvent
			window.attachEvent 'resize', ( e ) =>
				@resize()
			, false

	init:()=>


	update:()=>

		# @camera.position.set(@cameraAnchor.x, @cameraAnchor.y, @cameraAnchor.z)



	onLoaded:()=>
		@emit "loaded", null
		@loaded = true

	resize: () ->
		@r = RenderSettings.getRect()
		w = @r.width()
		h = @r.height()
		@camera.aspect = w/h
		@camera.updateProjectionMatrix()

module.exports = Scene