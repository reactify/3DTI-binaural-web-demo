EventEmitter = require("events").EventEmitter


VHA_DESCRIPTION = {
	0 : "VHA type 0"
	1 : "VHA type 1"
	2 : "VHA type 2"
	3 : "VHA type 3"
	4 : "VHA type 4"
	5 : "VHA type 5"
	6 : "VHA type 6"
	7 : "VHA type 7"
	8 : "VHA type 8"
	9 : "VHA type 9"
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
