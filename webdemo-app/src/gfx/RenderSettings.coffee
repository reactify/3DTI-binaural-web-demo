fk = require 'fieldkit'

class RenderSettings
	constructor: ->
		@aspect =
			width: 16
			height: 9
		@ratio = @aspect.width / @aspect.height

	getRect: ->
		w = window.innerWidth
		h = window.innerHeight

		@ratio = w/h

		rw = w
		rh = w / @ratio

		if rh < h
			rh = h
			rw = h * @ratio

		return new fk.math.Rect -( rw - w )/2, -( rh - h )/2, -( rw - w )/2 + rw, -( rh - h )/2 + rh

module.exports = exports = new RenderSettings()