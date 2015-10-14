Scene = require "../gfx/Scene.coffee"
DebugView = require "../debug/DebugView.coffee"
gsap = require "gsap"

UNITSIZE = 250
WALLHEIGHT = UNITSIZE * 2
SPEED_STEP = 2
MAX_VELOCITY = 300
LOOKSPEED = 0.075



class MuseumScene extends Scene
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

		@mapX = 0
		@mapY = 0
		@wallColliding = false

		@reportPositionId = -1

	init:(@mapURL)=>
		super

		# add atmospherics
		@scene.fog = new THREE.Fog(0xffffff, 10, 10000)


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

		DebugView.on("change", @onSettingsUpdated)

	onLoaded:()=>

		mapJson = JSON.parse(@rq.responseText)
		@mapData = mapJson.map
		@createMuseum()

		@controls.enabled = true

		@reportPositionId = setInterval(@reportUserPosition, 100)

		super



	createMuseum:()=>

		@mapWidth = @mapData.length
		@mapHeight = @mapData[0].length

		# create Floor
		@floor = new THREE.Mesh(new THREE.BoxGeometry(@mapHeight * UNITSIZE, 10, @mapWidth * UNITSIZE), new THREE.MeshLambertMaterial({ color : 0xebebeb }))
		@floor.position.y = -5
		# @floor.position.x = mapHeight/-2 * UNITSIZE
		# @floor.position.z = mapWidth/-2 * UNITSIZE

		@scene.add @floor

		# create Walls
		wallCube = new THREE.BoxGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE)
		wallBase = new THREE.BoxGeometry(UNITSIZE * 1.1, WALLHEIGHT/20, UNITSIZE * 1.1)

		wallMaterial = new THREE.MeshLambertMaterial({ color : 0xebebeb })

		materialGround1 = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, ambient: 0xaaaaaa, specular: 0xaaaaaa, perPixel: true, vertexColors: THREE.FaceColors } )
		materialGround1.side = THREE.DoubleSided
		materialGround = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, ambient: 0xaaaaaa, specular: 0xaaaaaa, perPixel: true,  vertexColors: THREE.FaceColors } )

		materialGround.emissive.setHSL( 0, 0, 0.35 )
		materialGround1.emissive.setHSL( 0, 0, 0.55 )


		for y in [0..@mapData.length-1] by 1
			for x in [0..@mapData[y].length-1] by 1
				a = @mapData[y][x]
				if a == "1"
					# create wall here
					wallUnit = new THREE.Object3D()

					newWall = new THREE.Mesh(wallCube, materialGround1)
					wallUnit.add newWall

					newWallBase = new THREE.Mesh(wallBase, materialGround1)
					wallUnit.add newWallBase
					newWallBase.position.y = -WALLHEIGHT/2 + WALLHEIGHT/40

					wallUnit.position.x = (x - @mapWidth/2) * UNITSIZE
					wallUnit.position.y = WALLHEIGHT/2
					wallUnit.position.z = (y - @mapHeight/2) * UNITSIZE


					@scene.add wallUnit
					@walls.push wallUnit
				else if a != "0"
					# create sound source here
					newSource = new THREE.Mesh(new THREE.SphereGeometry(UNITSIZE/4, 5, 5), new THREE.MeshLambertMaterial({ color : 0xff0000 }))
					newSource.position.x = (x - @mapWidth/2) * UNITSIZE
					newSource.position.y = WALLHEIGHT/2
					newSource.position.z = (y - @mapHeight/2) * UNITSIZE
					@scene.add newSource
					@soundSources.push newSource

		# add lighting
		lightHemi = new THREE.HemisphereLight(0xffffff, 0x676767, 0.6)
		# lightHemi.castShadow = true
		@scene.add lightHemi

		light1 = new THREE.DirectionalLight(0x676767, 0.1)
		light1.position.set(@mapWidth/2 * UNITSIZE,0,@mapWidth/2 * UNITSIZE)
		light1.lookAt(new THREE.Vector3(@mapWidth/2 * -UNITSIZE,0,@mapWidth/2 * -UNITSIZE))
		light1.castShadow = true
		# light1.onlyShadow = true
		@scene.add light1

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

		# clearInterval(@reportPositionId)
		

	onKeyUp:(e)=>
		switch(e.keyCode)
			when 38, 87 then @moving.forward = false
			when 37, 65 then @moving.left = false
			when 40, 83 then @moving.backward = false
			when 39, 68 then @moving.right = false

		# clearInterval(@reportPositionId)
		# @reportUserPosition()

	onMouseMove:(e)=>

		@mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1
		@mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


	onMouseDown:(e)=>
		@mouseButton = true


	onMouseUp:(e)=>

		@mouseButton = false

	getRandomColorHex:()=>
		return 0xff0000
		# return '#'+Math.floor(Math.random()*16777215).toString(16)

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

		# find out which square we're in, and bounce off if we're in a wall
		@mapX = Math.floor(@controls.getObject().position.x / (UNITSIZE)) + @mapWidth/2
		@mapZ = Math.floor(@controls.getObject().position.z / (UNITSIZE)) + @mapHeight/2

		@mapX = Math.min(@mapHeight, Math.max(0, @mapX))
		@mapZ = Math.min(@mapWidth, Math.max(0, @mapZ))

		# console.log "current map location = #{@mapX}, #{@mapZ}"

		if @mapData[@mapZ][@mapX] == "1"
			console.warn "WALL"
			if not @wallColliding
				@velocity.multiplyScalar(-1.1)
				@moving.forward = false
				@moving.backward = false
				@moving.left = false
				@moving.right = false
				@wallColliding = true
		else
			@wallColliding = false

		@controls.getObject().translateX(@velocity.x * 0.1)
		@controls.getObject().translateZ(@velocity.z * 0.1)

	reportUserPosition:()=>
		positionX = ((@controls.getObject().position.x / UNITSIZE) + @mapWidth/2) / @mapWidth
		positionZ = ((@controls.getObject().position.z / UNITSIZE) + @mapHeight/2) / @mapHeight


		@emit "userPosition", { x : positionX, y : positionZ }

		# angle
		refVec = new THREE.Vector3(0,0,1)
		refVec.applyEuler(@controls.getObject().rotation)
		
		angle = Math.floor(Math.atan(refVec.z / refVec.x) * (180 / Math.PI))
		if refVec.x > 0 then angle -= 180
		angle += 180
		# console.log angle

		@emit "userAngle", angle



	onSettingsUpdated:(newSettings)=>
		SPEED_STEP = newSettings.speedStep
		MAX_VELOCITY = newSettings.maxVelocity


module.exports = MuseumScene