class GLSettings
	constructor: ( gl ) ->
		@capabilities =
			maxTexSize: gl.getParameter( gl.MAX_TEXTURE_SIZE )
			maxCubemapSize: gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE )
			maxTexUnits: gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS )
			samples: gl.getParameter( gl.SAMPLES )
			sampleBuffers: gl.getParameter( gl.SAMPLE_BUFFERS )
			msaa: gl.getParameter( gl.SAMPLES ) > 0 and gl.getParameter( gl.SAMPLE_BUFFERS ) > 0
			extensions: gl.getSupportedExtensions()
			dds: gl.getSupportedExtensions().indexOf( "WEBGL_compressed_texture_s3tc" ) > -1 or gl.getSupportedExtensions().indexOf( "WEBKIT_WEBGL_compressed_texture_s3tc" ) > -1


module.exports = GLSettings