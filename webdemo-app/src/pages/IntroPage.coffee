Page = require "./Page.coffee"

class IntroPage extends Page
	constructor:()->
		super


	onLoaded:(rq)=>
		super

		@mouseButton = @element.querySelector("#mouse")
		@phoneButton = @element.querySelector("#phone")

		@codeDialog = @element.querySelector(".codeDialog")

		@mouseButton.addEventListener("click", @onMouseSelected)

		@titleElement = @element.querySelector(".title")
		@inputMethod = @element.querySelector(".pageInner")


		if (typeof(io) == "undefined")
			console.log "Socket.io not loaded, disabling phone mode"
			@phoneButton.classList.add "disable"
		else
			@phoneButton.addEventListener("click", @onPhoneSelected)


	onMouseSelected:(event)=>

		Main.useMouse = true

		document.body.style.cursor = "none"

		@hide()

	onPhoneSelected:(event)=>

		Main.useMouse = false
		@emit("phoneMode", null)

	showGameId:(code)=>
		@codeDialog.querySelector("input").value = code
		@codeDialog.style.display = "block"

	show:(@video)=>
		super

		setTimeout(()=>
			@element.classList.add("visible")
		,500)

	hide:()=>
		
		@inputMethod.classList.remove "visible"

		@element.classList.remove("visible")

		setTimeout(()=>
			super
			@emit("hide", null)	
		,1000)
		



module.exports = IntroPage