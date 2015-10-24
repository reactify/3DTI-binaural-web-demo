EventEmitter = require("events").EventEmitter


MIN_TIME = 100
MAX_TIME = 800

class StepView extends EventEmitter
	constructor:(@container)->

		@feet = []
		@left = @container.querySelector "#leftFoot"
		@right = @container.querySelector "#rightFoot"

		@left.addEventListener "touchstart", @onLeft
		@right.addEventListener "touchstart", @onRight

		@feet.push @left
		@feet.push @right

		@lastStep = null
		@lastStepTime = Date.now()

	init:()=>


	onLeft:()=>
		if @lastStep != "left"
			@lastStep = "left"
			@onStep()
		else if @lastStep == "left"
			@onStrafe(false)

	onRight:()=>
		if @lastStep != "right"
			@lastStep = "right"
			@onStep()
		else if @lastStep == "right"
			@onStrafe(true)

	onStep:()=>
		time = Date.now()
		diff = time - @lastStepTime
		@lastStepTime = time

		stepSize = (diff - MIN_TIME) / MAX_TIME
		stepSize = Math.min(0.95, stepSize)
		stepSize = Math.max(0, stepSize)

		stepSize = 1.0 - stepSize

		console.log "stepSize = #{stepSize}"

		@emit "step", stepSize

	onStrafe:(direction)=>
		@emit "strafe", direction

module.exports = StepView