

NUM_CIRCLES = 10

class CircleFx
	constructor:()->


	show:(@snap)=>

		@s = @snap.svg(0,0,"100%", "100%", 0,0,1000,1000).attr({ class : 'circles' })
		@g = @s.g()

		@circles = []

		for i in [0..NUM_CIRCLES] by 1
			newCircle = @s.circle(500,500,400).attr( { class : "circle" })
			@circles.push newCircle
			@g.add newCircle


	hide:()=>
		for circle in @circles
			circle.remove()

		@s.remove()


module.exports = CircleFx