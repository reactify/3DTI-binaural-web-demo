# Controller main

App = require "./app/app.mobile.coffee"

Main = new ->
	initialized = false
	app = null
	stats = null
	queryParams = null
	audio = null

	init = () ->
		if !initialized
			initialized = true

			queryParams = parseQueryString()

			app = new App()
			app.init()

			window.requestAnimationFrame render

	render = ()->
		window.requestAnimationFrame render
		
		if initialized
			app.render()


	parseQueryString = () ->
		queryString = document.location.href
		queryIndex = queryString.indexOf("?")
		queryStringArray = []

		if queryIndex != -1 && queryIndex+1 != queryString.length
			queryString = queryString.substring(queryIndex+1, queryString.length)
			queryStringArray = queryString.split("&")

		returnObject = {}
		for i in [0..queryStringArray.length-1] by 1
			tempArray = queryStringArray[i].split("=")
			val = true
			if (typeof(tempArray[1]) != "undefined") then val = tempArray[1]
			returnObject[tempArray[0]] = val

		return returnObject

	getQueryParams = () ->
		return queryParams

	setCSSProps = ( e, props ) ->
		for k,v of props
			e.style[k] = v

	return {
		init: init
		getQueryParams : getQueryParams
		audio : audio
	}

# globals
globals =

	$ : ( id ) ->
		return document.getElementById id

	el : ( type, cls ) ->
		e = document.createElement type
		if ( cls ) 
			e.className = cls;
		return e

	Main: Main

for k,v of globals
	window[k] = v


#launch
if window.addEventListener
	window.addEventListener 'load', ( e ) ->
		Main.init()
	, false
else if window.attachEvent
	window.attachEvent 'load', ( e ) ->
		Main.init()
	, false