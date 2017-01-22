Scene = require "../gfx/Scene.coffee"
DebugView = require "../debug/DebugView.coffee"
gsap = require "gsap"

UNITSIZE = 250
WALLHEIGHT = UNITSIZE * 3
SPEED_STEP = 2
MAX_VELOCITY = 70
LOOKSPEED = 0.075

REPORT_INTERVAL = 200

SWAGGER_ENABLED = true


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
		@phoneLookVelocity = new THREE.Vector3()
		@swaggerVelocity = new THREE.Vector3()
		@swaggerCount = 0
		@swaggerAmount = 0
			
		@controls = new THREE.PointerLockControls(@camera)
		@scene.add @controls.getObject()

		@mouseVector = new THREE.Vector2()
		@mouseButton = false

		@mapX = 0
		@mapY = 0
		@wallColliding = false

		@reportPositionId = -1

		@lastReportTime = Date.now()
		@lastPosition = null
		@lastAngle = null

	init:(@mapURL)=>
		super

		# add atmospherics
		@scene.fog = new THREE.Fog(0xc0c0c0, 10, 10000)


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

		@loadTextures(()=>

			@createMuseum(()=>

				super

				)

			)


		
		

	loadTextures:(callback)=>

		@texLoader = new THREE.TextureLoader()

		@texLoader.load(
			"images/metal2_normal.jpg",
			(texture)=>
				texture.repeat.x = 200
				texture.repeat.y = 200
				texture.wrapS = THREE.RepeatWrapping
				texture.wrapT = THREE.RepeatWrapping
				texture.needsUpdate = true
				@floorMaterial = new THREE.MeshPhongMaterial( { color: 0xafafaf, ambient: 0xaaaaaa, specular: 0x8a8a8a, perPixel: true, vertexColors: THREE.FaceColors, bumpMap : texture } )
			)

		@texLoader.load(
			"images/stone_normal.jpg", 
			(texture)=>
				@wallMaterial = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, ambient: 0xdddddd, specular: 0xffffff, perPixel: true, vertexColors: THREE.FaceColors, bumpMap : texture } )
				callback()
			)

	createMuseum:(callback)=>

		@mapWidth = @mapData.length
		@mapHeight = @mapData[0].length

		# create Floor
		@floor = new THREE.Mesh(new THREE.BoxGeometry(@mapHeight * UNITSIZE, 10, @mapWidth * UNITSIZE), @floorMaterial)
		@floor.position.y = -5
		# @floor.position.x = mapHeight/-2 * UNITSIZE
		# @floor.position.z = mapWidth/-2 * UNITSIZE

		@scene.add @floor

		# create Walls
		wallCube = new THREE.BoxGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE)
		wallBase = new THREE.BoxGeometry(UNITSIZE * 1.1, WALLHEIGHT/20, UNITSIZE * 1.1)

		# wallMaterial = new THREE.MeshLambertMaterial({ color : 0xebebeb })

		materialGround1 = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, ambient: 0xaaaaaa, specular: 0xaaaaaa, perPixel: true, vertexColors: THREE.FaceColors } )
		materialGround1.side = THREE.DoubleSided
		materialGround = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, ambient: 0xaaaaaa, specular: 0xaaaaaa, perPixel: true,  vertexColors: THREE.FaceColors } )

		materialGround.emissive.setHSL( 0, 0, 0.35 )
		materialGround1.emissive.setHSL( 0, 0, 0.55 )

		@wallsMerged = new THREE.Geometry()

		for y in [0..@mapData.length-1] by 1
			for x in [0..@mapData[y].length-1] by 1
				a = @mapData[y][x]
				if a == "1"
					# create wall here
					wallUnit = new THREE.Geometry()

					newWall = new THREE.Mesh(wallCube)
					newWall.position.x = (x - @mapWidth/2) * UNITSIZE
					newWall.position.z = (y - @mapHeight/2) * UNITSIZE
					newWall.position.y = WALLHEIGHT/2
					newWall.updateMatrix()
					# wallUnit.add newWall

					newWallBase = new THREE.Mesh(wallBase)
					# wallUnit.add newWallBase
					newWallBase.position.y = WALLHEIGHT/40
					newWallBase.position.x = (x - @mapWidth/2) * UNITSIZE
					newWallBase.position.z = (y - @mapHeight/2) * UNITSIZE
					newWallBase.updateMatrix()

					newWallTop = new THREE.Mesh(wallBase)
					# wallUnit.add newWallTop
					newWallTop.position.y = WALLHEIGHT - WALLHEIGHT/40
					newWallTop.position.x = (x - @mapWidth/2) * UNITSIZE
					newWallTop.position.z = (y - @mapHeight/2) * UNITSIZE
					newWallTop.updateMatrix()

					wallUnit.merge(newWall.geometry, newWall.matrix)
					wallUnit.merge(newWallBase.geometry, newWallBase.matrix)
					wallUnit.merge(newWallTop.geometry, newWallTop.matrix)

					# wallUnit.position.x = (x - @mapWidth/2) * UNITSIZE
					# wallUnit.position.y = WALLHEIGHT/2
					# wallUnit.position.z = (y - @mapHeight/2) * UNITSIZE

					# newWall = new THREE.Mesh(wallUnit, @wallMaterial)
					# newWall.updateMatrix()

					@wallsMerged.merge(wallUnit)

					# @walls.push wallUnit
				else if a != "0"
					# create sound source here
					newSource = new THREE.Mesh(new THREE.SphereGeometry(UNITSIZE/4, 12,12), new THREE.MeshLambertMaterial({ color : 0xffaf4b }))
					newSource.position.x = (x - @mapWidth/2) * UNITSIZE
					newSource.position.y = WALLHEIGHT/2
					newSource.position.z = (y - @mapHeight/2) * UNITSIZE
					@scene.add newSource
					@soundSources.push newSource

		# add walls
		@wallsMesh = new THREE.Mesh(@wallsMerged, @wallMaterial)
		@scene.add @wallsMesh

		# dummy wall at 0,0
		# newWall = new THREE.Mesh(wallCube, materialGround1)
		# newWall.position.x = -@mapWidth/2 * UNITSIZE
		# newWall.position.z = -@mapHeight/2 * UNITSIZE
		# newWall.position.y = WALLHEIGHT/2
		# @scene.add newWall

		# add ceiling tiles
		@loader = new THREE.JSONLoader()


		@loader.load(
			"./obj/ceilingTile.js",
			(geometry, materials)=>

				TILE_SCALE_1 = 2.5
				TILE_SCALE_2 = 2
				TILE_SCALE_3 = TILE_SCALE_1 * TILE_SCALE_2
				NUM_TILES = @mapHeight / TILE_SCALE_2

				@ceilingMerged = new THREE.Geometry()
				
				for x in [0..(NUM_TILES)] by 1
					for y in [0..(NUM_TILES)] by 1
						newCeilingTile = new THREE.Mesh(geometry, materialGround1)
						newCeilingTile.scale.set(TILE_SCALE_3, TILE_SCALE_3, TILE_SCALE_3)
						newCeilingTile.position.y = WALLHEIGHT
						newCeilingTile.position.x = ((x - NUM_TILES/2) * UNITSIZE * TILE_SCALE_2) + (UNITSIZE * TILE_SCALE_3 * 0.25)
						newCeilingTile.position.z = ((y - NUM_TILES/2) * UNITSIZE * TILE_SCALE_2) + (UNITSIZE * TILE_SCALE_3 * 0.25)

						idx = Math.random()
						if idx > 0.3 and idx < 0.7
							newCeilingTile.rotation.y = Math.PI/2
						else if idx > 0.7
							newCeilingTile.rotation.y = Math.PI
						
						newCeilingTile.updateMatrix()
						@ceilingMerged.merge(newCeilingTile.geometry, newCeilingTile.matrix)
						# @scene.add newCeilingTile

				@ceilingMesh = new THREE.Mesh(@ceilingMerged,  @wallMaterial)
				@scene.add @ceilingMesh

				callback()

			)

		# add lighting
		lightHemi = new THREE.HemisphereLight(0xffffff, 0x676767, 0.4)
		# # lightHemi.castShadow = true
		@scene.add lightHemi

		lightAmbient = new THREE.AmbientLight(0x808080)
		@scene.add lightAmbient

		light1 = new THREE.DirectionalLight(0x676767, 0.1)
		light1.position.set(@mapWidth/2 * UNITSIZE,WALLHEIGHT,@mapWidth/2 * UNITSIZE)
		light1.lookAt(new THREE.Vector3(@mapWidth/2 * -UNITSIZE,0,@mapWidth/2 * -UNITSIZE))
		# light1.castShadow = true
		# light1.onlyShadow = true
		@scene.add light1

		# adjust camera
		@controls.getObject().position.y = WALLHEIGHT/2



	enableControls:()=>
		@controls.enabled = true

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


	onPhoneStep:(stepSize)=>
		console.log "step from phone : #{stepSize}"
		@velocity.z += SPEED_STEP * stepSize * 100
		@velocity.z = Math.min @velocity.z, -MAX_VELOCITY
		@swaggerAmount = 1.0

	onPhoneStrafe:(direction)=>
		console.log "strafe from phone : #{direction}"
		if direction
			@velocity.x -= SPEED_STEP * 100
			@velocity.x = Math.max @velocity.x, MAX_VELOCITY
		else
			@velocity.x -= -SPEED_STEP * 100
			@velocity.x = Math.min @velocity.x, -MAX_VELOCITY

		@swaggerAmount = 1.0

	onPhoneLook:(lookData)=>

		@phoneLookVelocity.y = lookData.x * 0.05
		@phoneLookVelocity.x = lookData.y * 0.05


	getRandomColorHex:()=>
		return 0xff0000
		# return '#'+Math.floor(Math.random()*16777215).toString(16)

	update:()=>
		super

		# decelleration
		@velocity.x *= 0.9
		@velocity.z *= 0.9

		@swaggerCount += 0.1
		# @swaggerCount = @swaggerCount % (Math.PI * 2)

		@swaggerAmount *= 0.9
		

		if @moving.forward or @moving.backward or @moving.left or @moving.right
			@swaggerAmount = 1.0

		@swaggerVelocity.x = Math.sin(@swaggerCount)
		@swaggerVelocity.y = Math.cos(@swaggerCount)

		# keyboard control

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

		# phone control

		@controls.getObject().rotation.y -= @phoneLookVelocity.y
		@controls.getPitchObject().rotation.x -= @phoneLookVelocity.x

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
		
		@controls.getObject().translateX(@velocity.x * 0.1)
		
		@controls.getObject().translateZ(@velocity.z * 0.1)

		if SWAGGER_ENABLED
			@controls.getObject().position.y =  WALLHEIGHT/2 - (Math.abs(@swaggerVelocity.y) * 15 * @swaggerAmount)
			@controls.getObject().position.x += (@swaggerVelocity.x * 0.2 * @swaggerAmount)
			@controls.getObject().position.z += (@swaggerVelocity.x * 0.2 * @swaggerAmount)

		# check if we need to report the position
		time = Date.now()
		if ((time - @lastReportTime) > REPORT_INTERVAL)
			@lastReportTime = time
			@reportUserPosition()

	reportUserPosition:()=>
		positionX = ((@controls.getObject().position.x / UNITSIZE) + @mapWidth/2) / @mapWidth
		positionZ = ((@controls.getObject().position.z / UNITSIZE) + @mapHeight/2) / @mapHeight


		if @lastPosition
			# only report position change if delta has changed significantly
			if (Math.abs(@lastPosition.x - positionX) > 0.01) or (Math.abs(@lastPosition.y - positionZ) > 0.01)
				@lastPosition = { x : positionX, y : positionZ }
				@emit "userPosition", @lastPosition
				
		else
			@lastPosition = { x : positionX, y : positionZ }

		# angle
		refVec = new THREE.Vector3(0,0,1)
		refVec.applyEuler(@controls.getObject().rotation)
		
		angle = Math.floor(Math.atan(refVec.z / refVec.x) * (180 / Math.PI))
		if refVec.x > 0 then angle -= 180
		angle += 180
		# console.log angle

		if @lastAngle
			if Math.abs(@lastAngle - angle) > 0.1
				@lastAngle = angle
				@emit "userAngle", angle
		else @lastAngle = angle



	onSettingsUpdated:(newSettings)=>
		SPEED_STEP = newSettings.speedStep
		MAX_VELOCITY = newSettings.maxVelocity


module.exports = MuseumScene