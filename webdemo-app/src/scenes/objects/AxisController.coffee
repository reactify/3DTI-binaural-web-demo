EventEmitter = require("events").EventEmitter


AXIS_SCALE = 0.2

class AxisController extends EventEmitter
	constructor:()->

		@container = new THREE.Object3D()

		@loader = new THREE.JSONLoader()

		# create mouse hit area

		hitAreaDimension = 500
		boxGeometry = new THREE.BoxGeometry(hitAreaDimension, hitAreaDimension, hitAreaDimension)
		material = new THREE.MeshBasicMaterial({ color : 0xff4500 })
		@hitArea = new THREE.Mesh(boxGeometry, material)
		@container.add @hitArea

	init:(@id, @material, objpath, @scene)=>

		@container.scale.x = AXIS_SCALE
		@container.scale.y = AXIS_SCALE
		@container.scale.z = AXIS_SCALE

		@loader.load(
			objpath
			(geometry, materials)=>
				@topCap = new THREE.Mesh(geometry, @material)
				@bottomCap = new THREE.Mesh(geometry, @material)
				@bottomCap.rotation.z = Math.PI

				@container.add @topCap
				@container.add @bottomCap

				@scene.add @container

				@onLoaded()

				# @setValue 1
			)

	setHover:(hover=false)=>
		mult = 1.0
		if hover then mult = 1.1

		@container.scale.x = AXIS_SCALE * mult
		@container.scale.y = AXIS_SCALE * mult
		@container.scale.z = AXIS_SCALE * mult

	setValue:(value)=>
		value = Math.max 0, value
		value = Math.min 1, value

		@topCap.position.y = 100 * value
		@bottomCap.position.y = -100 * value



	onLoaded:()=>
		console.log "Axis controller #{@id} loaded"
		@emit "loaded", null






module.exports = AxisController