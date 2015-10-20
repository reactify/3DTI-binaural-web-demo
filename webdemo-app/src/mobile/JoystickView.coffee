EventEmitter = require("events").EventEmitter


class JoystickView extends EventEmitter
	constructor:(@container)->

		@originCanvas = @container.querySelector("#origin")
		@touchCanvas = @container.querySelector("#touch")
		@bgCanvas = @container.querySelector("#uiBackground")




	init:()=>

		# draw origin
		@originCtx = @originCanvas.getContext("2d")


	onMove:(data)=>



	onStop:()=>
		@touchCanvas.removeClass "visible"



module.exports = JoystickView