EventEmitter = require("events").EventEmitter

CircleFx = require "./CircleFx.coffee"

class ControllerFx extends EventEmitter
	constructor:()->

		@overlay = $ "buttonOverlay"
		@lastButtonId = ""

		@circleFx = new CircleFx()

	buttonPressed:(@lastButtonId, buttonObj)=>
		@overlay.classList.add "visible"
		@overlay.classList.add @lastButtonId

		# # TODO - add more FX
		# @circleFx.show buttonObj.snap

	buttonReleased:()=>
		@overlay.classList.remove "visible"
		@overlay.classList.remove @lastButtonId

		# @circleFx.hide()

module.exports = ControllerFx