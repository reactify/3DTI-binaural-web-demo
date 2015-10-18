EventEmitter = require("events").EventEmitter

class Page extends EventEmitter
	constructor:()->

	init:(@id, aSourceURL, @container)->

		@element = document.createElement("div")
		@element.classList.add "page"
		@element.setAttribute("id", @id)

		@rq = new XMLHttpRequest()
		@rq.open "GET", "#{aSourceURL}", true
		@rq.onreadystatechange = () =>
			if @rq.readyState != 4
				return
			if @rq.status != 200 and @rq.status != 304 #if the resource has failed to load
				@emit "loadError", "Could not load template HTML"
			@onLoaded(@rq)
		@rq.send()

	onLoaded:(rq)=>
		result = rq.responseText
		@element.innerHTML = result

		@emit "loaded", null


	show:()=>

		console.log "Showing page #{@id}"

		document.body.classList.add(@id)
		@visible = true
		@container.appendChild(@element)


	hide:()=>

		console.log "Hiding page #{@id}"

		@visible = false

		document.body.classList.remove(@id)

		@container.removeChild(@element)




module.exports = Page