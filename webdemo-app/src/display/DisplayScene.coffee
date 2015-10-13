Scene = require "../gfx/Scene.coffee"

gsap = require "gsap"

class DisplayScene extends Scene
	constructor:()->
		super

	init:()=>
		super

		@showingIcons = false

		@cameraMovementIndex = 0

		@camera.position.setZ(600)
		@camera.lookAt(new THREE.Vector3(0,0,0))

		@scene.add new THREE.AmbientLight( 0xffffff )

		@pinkMaterial = new THREE.MeshLambertMaterial({ color: 0xe54ac7 })
		@pinkMaterial.side = THREE.BackSide
		@goldMaterial = new THREE.MeshLambertMaterial({ color: 0xd6af00 })
		# @goldMaterial.side = THREE.BackSide
		@blackMaterial = new THREE.MeshLambertMaterial({ color: 0x464a4f })
		@greenMaterial = new THREE.MeshLambertMaterial({ color: 0x40a63b })
		@blueMaterial = new THREE.MeshLambertMaterial({ color: 0x2aafff })
		@pipeMaterial = new THREE.MeshLambertMaterial({ color: 0xbdb8bb })
		# @greenMaterial.side = THREE.DoubleSide

		@OBJECT_OFFSET = 120
		@OBJECT_SCALE = 0.4
		

		@loader = new THREE.JSONLoader()

		@loader.load(
			'./obj/pink.js'
			(geometry, materials)=>
				@pink = new THREE.Mesh(geometry, @pinkMaterial)
				@scene.add @pink
				@pink.scale.set(@OBJECT_SCALE*1.2,@OBJECT_SCALE*1.2,@OBJECT_SCALE*1.2)
				@pink.position.x = -@OBJECT_OFFSET - 10
				@pink.position.y = @OBJECT_OFFSET*1.2 + 10
			)

		@loader.load(
			'./obj/gold.js'
			(geometry, materials)=>
				@gold = new THREE.Mesh(geometry, @goldMaterial)
				@scene.add @gold
				@gold.scale.set(@OBJECT_SCALE,@OBJECT_SCALE,@OBJECT_SCALE)
				@gold.position.x = @OBJECT_OFFSET
				@gold.position.y = @OBJECT_OFFSET * 1.2
			)

		@loader.load(
			'./obj/green.js'
			(geometry, materials)=>
				@green = new THREE.Mesh(geometry, @greenMaterial)
				@scene.add @green
				@green.scale.set(@OBJECT_SCALE*0.8,@OBJECT_SCALE*0.8,@OBJECT_SCALE*0.8)
				@green.position.x = @OBJECT_OFFSET * -2
				@green.position.y = 15

			)

		@loader.load(
			'./obj/blue.js'
			(geometry, materials)=>
				@blue = new THREE.Mesh(geometry, @blueMaterial)
				@scene.add @blue
				@blue.scale.set(@OBJECT_SCALE,@OBJECT_SCALE,@OBJECT_SCALE)
				@blue.position.x = @OBJECT_OFFSET * 2
				@blue.position.y = 0

			)

		@loader.load(
			'./obj/grey.js'
			(geometry, materials)=>
				@grey = new THREE.Mesh(geometry, @pipeMaterial)
				@scene.add @grey
				@grey.scale.set(@OBJECT_SCALE*1.2,@OBJECT_SCALE*1.2,@OBJECT_SCALE*1.2)
				@grey.position.x = @OBJECT_OFFSET
				@grey.position.y = -@OBJECT_OFFSET * 1.2

				@onLoaded()
			)


		@black = new THREE.Mesh(
			new THREE.SphereGeometry(120 * @OBJECT_SCALE, 16, 16),
			@blackMaterial
			)

		@scene.add @black
		@black.position.x = -@OBJECT_OFFSET
		@black.position.y = -@OBJECT_OFFSET * 1.2


		@pointLight =  new THREE.PointLight(0x785656)
		@pointLight.position.x = 50
		@pointLight.position.y = 0
		@pointLight.position.z = 100

		@scene.add @pointLight

		@hideIcons()

		# @onLoaded()

	showIcons:()=>

		if @showingIcons then return
		@showingIcons = true

		if @cameraTween then @cameraTween.kill()
		@cameraTween = TweenLite.to(@cameraOffset, 1, {
			z : 0
			})


	hideIcons:()=>

		if @cameraTween then @cameraTween.kill()
		@cameraTween = TweenLite.to(@cameraOffset, 1, {
			z : -600
			})

		@showingIcons = false

	buttonPressed:(id)=>

		object = null
		switch id
			when "0" then object = @pink
			when "1" then object = @gold
			when "2" then object = @green
			when "3" then object = @blue
			when "4" then object = @black
			when "5" then object = @grey

		if !object then return


		TweenLite.to(object.position, 0.2, {
			z : 100
			})


	buttonReleased:(id)=>

		object = null
		switch id
			when "0" then object = @pink
			when "1" then object = @gold
			when "2" then object = @green
			when "3" then object = @blue
			when "4" then object = @black
			when "5" then object = @grey

		if !object then return

		TweenLite.to(object.position, 0.2, {
			z : 0
			})

	_flipNormals:(geometry)=>

		for i in [0..geometry.faces.length-1] by 1
				face = geometry.faces[i]
				temp = face.a
				face.a = face.c
				face.c = temp

		geometry.computeFaceNormals()
		geometry.computeVertexNormals()

		faceVertexUvs = geometry.faceVertexUvs[ 0 ]

		for i in [0..faceVertexUvs.length-1] by 1
			temp = faceVertexUvs[i][0]
			faceVertexUvs[i][0] = faceVertexUvs[i][2]
			faceVertexUvs[i][2] = temp

		return geometry

	update:()=>
		super

		if @loaded
			if @pink then @pink.rotation.y += 0.01
			if @gold then @gold.rotation.y -= 0.01
			if @green then @green.rotation.y += 0.01
			if @grey then @grey.rotation.y -= 0.01
			if @blue then @blue.rotation.y += 0.01
			if @black
				blackScale = 1 + 0.1 * Math.sin(@cameraMovementIndex * 10)
				@black.scale.set(blackScale, blackScale, blackScale)
			


			# camera variance
			@cameraMovementIndex += 0.001
			# @camera.position.x += Math.sin(@cameraMovementIndex) * 20
			# @camera.position.z += Math.cos(@cameraMovementIndex) * 20

			@camera.position.x += @cameraOffset.x
			@camera.position.y += @cameraOffset.y
			@camera.position.z += @cameraOffset.z

module.exports = DisplayScene