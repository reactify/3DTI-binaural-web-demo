EventEmitter = require("events").EventEmitter


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



	selectVHA:(which)=>
		console.log "Selected VHA #{which}"
		@emit "select", which

		@message.innerHTML = "Virtual Hearing Aid setting: #{which}"

		@message.classList.add "visible"

		clearTimeout @hideTimeoutId
		@hideTimeoutId = setTimeout(()=>
			@message.classList.remove "visible"
		,2000)





module.exports = HearingAidSelectUI
