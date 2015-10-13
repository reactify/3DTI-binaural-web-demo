Scene = require "../gfx/Scene.coffee"

AxisController = require "./objects/AxisController.coffee"

gsap = require "gsap"

UNITSIZE = 250
WALLHEIGHT = UNITSIZE * 5
MOVESPEED = 100
SPEED_STEP = 2
MAX_VELOCITY = 300
LOOKSPEED = 0.075



class DisplayScene extends Scene
	constructor:()->
		super

		@walls = []
		@soundSources = []
		@lights = []

		@moving = {
			forward : false
			left : false
			right : false
			backward : false
		}

		@velocity = new THREE.Vector3()
			
		@controls = new THREE.PointerLockControls(@camera)
		@scene.add @controls.getObject()

		@mouseVector = new THREE.Vector2()
		@mouseButton = false

	init:(@mapURL)=>
		super


		# load map from JSON file
		@rq = new XMLHttpRequest()
		@rq.open("GET", @mapURL, true)
		@rq.onload = @onLoaded
		@rq.send()



		document.body.addEventListener("mousemove", @onMouseMove)
		document.body.addEventListener("mousedown", @onMouseDown)
		document.body.addEventListener("mouseup", @onMouseUp)

		document.addEventListener("keydown", @onKeyDown)
		document.addEventListener("keyup", @onKeyUp)


	onLoaded:()=>

		mapJson = JSON.parse(@rq.responseText)
		@mapData = mapJson.map
		@createMuseum()

		@controls.enabled = true



		super



	createMuseum:()=>

		# create Floor
		@floor = new THREE.Mesh(new THREE.BoxGeometry(mapHeight * UNITSIZE, 10, mapWidth * UNITSIZE), new THREE.MeshLambertMaterial({ color : 0xebebeb }))
		# @floor.position.x = mapHeight/-2 * UNITSIZE
		# @floor.position.z = mapWidth/-2 * UNITSIZE
		@scene.add @floor

		# create Walls
		cube = new THREE.BoxGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE)

		wallMaterial = new THREE.MeshLambertMaterial({ color : 0xebebeb })

		mapWidth = @mapData.length
		mapHeight = @mapData[0].length

		for x in [0..@mapData.length-1] by 1
			for y in [0..@mapData[x].length-1] by 1
				a = @mapData[x][y]
				if a == "1"
					# create wall here
					newWall = new THREE.Mesh(cube, wallMaterial)
					newWall.position.x = (x - mapWidth/2) * UNITSIZE
					newWall.position.y = WALLHEIGHT/2
					newWall.position.z = (y - mapHeight/2) * UNITSIZE

					@scene.add newWall
					@walls.push newWall

		# add lighting
		light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
		@scene.add light

		# adjust camera
		@controls.getObject().position.y = WALLHEIGHT/2
		

	onKeyDown:(e)=>
		switch(e.keyCode)
			when 38, 87 then @moving.forward = true
			when 37, 65 then @moving.left = true
			when 40, 83 then @moving.backward = true
			when 39, 68 then @moving.right = true
			when 32
				document.body.requestPointerLock()

	onKeyUp:(e)=>
		switch(e.keyCode)
			when 38, 87 then @moving.forward = false
			when 37, 65 then @moving.left = false
			when 40, 83 then @moving.backward = false
			when 39, 68 then @moving.right = false

	onMouseMove:(e)=>

		@mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1
		@mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;



	onMouseDown:(e)=>
		@mouseButton = true


	onMouseUp:(e)=>

		@mouseButton = false

	update:()=>
		super

		# decelleration
		@velocity.x *= 0.9
		@velocity.z *= 0.9

		if @moving.backward
			@velocity.z -= SPEED_STEP
			@velocity.z = Math.max @velocity.z, MAX_VELOCITY
		if @moving.forward
			@velocity.z -= -SPEED_STEP
			@velocity.z = Math.min @velocity.z, -MAX_VELOCITY
		if @moving.right
			@velocity.x -= SPEED_STEP
			@velocity.x = Math.max @velocity.x, MAX_VELOCITY
		if @moving.left
			@velocity.x -= -SPEED_STEP
			@velocity.x = Math.min @velocity.x, -MAX_VELOCITY

		@controls.getObject().translateX(@velocity.x * 0.1)
		@controls.getObject().translateZ(@velocity.z * 0.1)
		

		# if @loaded


module.exports = DisplayScene