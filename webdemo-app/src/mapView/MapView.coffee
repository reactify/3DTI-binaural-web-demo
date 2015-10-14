
SIZE = 512


class MapView
	constructor:(@container)->

		@element = el "div", "mapContainer"

		@canvas = el "canvas", "mapCanvas"
		@canvas.width = SIZE
		@canvas.height = SIZE

		@element.appendChild @canvas

		@ctx = @canvas.getContext("2d")


	init:(mapData)->

		cellSize = SIZE / mapData.length

		@ctx.fillStyle = "none"
		@ctx.lineWidth = 2
		@ctx.strokeStyle = "rgba(255,255,255,0.2)"
		@ctx.strokeRect(1,1,SIZE-1,SIZE-1)

		for x in [0..mapData.length-1] by 1
			for y in [0..mapData[0].length-1] by 1
				if mapData[x][y] == "1"
					# draw a wall
					@ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
					@ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)



		@userMarker = el "div", "userMarker"
		userMarkerInner = el "div", "userMarkerInner"
		@userMarker.appendChild userMarkerInner
		@element.appendChild @userMarker

		@setUserPosition(0.5,0.5)

		@container.appendChild @element

		window.addEventListener("resize", @resize)
		@resize()


	setUserPosition:(x,y)=>
		@userMarker.style.left = "#{parseInt(x * 100)}%"
		@userMarker.style.top = "#{parseInt(y * 100)}%"

	setUserAngle:(angle)=>
		@userMarker.style.transform = "rotate(#{angle}deg)"

	resize:()=>
		@element.style.height = @element.clientWidth + "px"




module.exports = MapView