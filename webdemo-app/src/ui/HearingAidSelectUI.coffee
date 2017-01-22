EventEmitter = require("events").EventEmitter


VHA_DESCRIPTION = {
	0 : "No filter"
	1 : "Low-pass filter"
	2 : "High-pass filter"
	3 : "Directionality: Off"
	4 : "Directionality: 1"
	5 : "Directionality: 2"
	6 : "Directionality: 3"
	7 : "Directionality: 4"
	8 : "Directionality: 5"
	9 : "Directionality: 6"
}

class HearingAidSelectUI extends EventEmitter
	constructor:(@container)->

		@message = @container.querySelector "#vhaMessage"

		@hideTimeoutId = -1

	init:()=>

		document.body.addEventListener "keydown", (e)=>

			switch(e.keyCode)
				when 49 then @selectVHA(1)
				when 50 then @selectVHA(2)
				when 51 then @selectVHA(3)
				when 52 then @selectVHA(4)
				when 53 then @selectVHA(5)
				when 54 then @selectVHA(6)
				when 55 then @selectVHA(7)
				when 56 then @selectVHA(8)
				when 57 then @selectVHA(9)
				when 48 then @selectVHA(0)



	selectVHA:(which)=>
		console.log "Selected VHA #{which}"
		@emit "select", which

		description = ""
		if VHA_DESCRIPTION[which]
			description = VHA_DESCRIPTION[which]

			@message.innerHTML = "Virtual Hearing Aid setting: #{description}"

			@message.classList.add "visible"

			clearTimeout @hideTimeoutId
			@hideTimeoutId = setTimeout(()=>
				@message.classList.remove "visible"
			,2000)
		else
			console.warn "Could not find description for VHA no #{which}"








module.exports = HearingAidSelectUI
