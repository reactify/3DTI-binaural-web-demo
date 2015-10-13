EventEmitter = require("events").EventEmitter

Config = require "../config/Config.coffee"

class Button extends EventEmitter
	constructor:(@id)->

		@enabled = false
		@clicked = false
		@element = el "div", "btn"

		@element.setAttribute "id", "btn#{@id}"
		@element.setAttribute "buttonIndex", "#{@id}"

		@anim = document.createElementNS("http://www.w3.org/2000/svg","svg");
		@anim.classList.add "anim"
		@element.appendChild @anim

		# circle FX

		@circleElements = []
		@circleContainer = el "div", "circleContainer"
		for i in [0..5] by 1
			newCircle = el "div", "circle"
			@circleElements.push newCircle
			@circleContainer.appendChild newCircle

		@element.appendChild @circleContainer

		@label = el "div", "label"
		@element.appendChild @label

		@element.addEventListener "taphold", (event)=>
			event.preventDefault()

		@element.addEventListener "touchstart", @onClick
		@element.addEventListener "mousedown", @onClick
		# @element.addEventListener "vmousedown", @onClick

		@element.addEventListener "touchend", @onRelease
		@element.addEventListener "mouseup", @onRelease
		# @element.addEventListener "vmouseup", @onRelease

		
		@autoTimeoutId = -1


	getElement:()=>
		return @element

	setLabel:(labelText)=>
		@label.innerHTML = labelText


	onClick:(event)=>
		
		if event
			event.preventDefault()

		clearTimeout(@autoTimeoutId)
		@autoTimeoutId = setTimeout(@onRelease, Config.BUTTON_TIMEOUT)

		@snap = Snap(@anim)

		if @enabled and not @clicked
			@clicked = true
			@emit("click", { id : @id })
			@element.classList.add "clicked"

			# setTimeout(()=>
			# 	if @enabled
			# 		@emit "release", { id : @id }
			# 		@element.classList.remove "clicked"
			# 		@anim.innerText = ""
			# 		@snap = null
			# ,5000)

	onRelease:(event)=>

		if event
			event.preventDefault()

		clearTimeout(@autoTimeoutId)

		if @enabled and @clicked
			@clicked = false
			@emit "release", { id : @id }
			@element.classList.remove "clicked"
			@anim.innerText = ""
			@snap = null

	enable:()=>
		@enabled = true

		# TODO : css changes for enabled / disabled state
		@element.classList.add "enabled"

	disable:()=>
		@enabled = false

		# TODO : css changes for enabled / disabled state
		@element.classList.remove "enabled"


	peerPressed:()=>

		@element.classList.add "peerPressed"

	peerReleased:()=>

		@element.classList.remove "peerPressed"




module.exports = Button