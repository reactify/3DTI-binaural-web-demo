EventEmitter = require("events").EventEmitter



class LookView extends EventEmitter
	constructor:(@container)->

		@container.addEventListener "touchmove", @touchMove

		@indicator = @container.querySelector "#lookIndicator"
		@container.addEventListener "touchstart", @touchStart
		@container.addEventListener "touchend", @touchEnd

	touchStart:(e)=>
		@indicator.style.display = "block"

		@touchMove(e)

	touchEnd:()=>
		@indicator.style.display = "none"

		@emit "end", null
		@emit "look", { x : 0, y : 0 }

	touchMove:(e)=>

		if e.touches.length > 0
			relX = (e.touches[0].clientX - @container.offsetLeft) / @container.clientWidth
			relY = (e.touches[0].clientY - @container.offsetTop) / @container.clientHeight

			relX = Math.min(1, Math.max(0, relX))
			relY = Math.min(1, Math.max(0, relY))

			@indicator.style.left = "#{relX * 100}%"
			@indicator.style.top = "#{relY * 100}%"

			relX = (relX - 0.5) * 2
			relY = (relY - 0.5) * 2

			@emit "look", { x : relX, y : relY }

			console.log "x : #{relX}, y : #{relY}"

			

	init:()=>



module.exports = LookView