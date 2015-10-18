'use strict()';


module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	grunt.loadNpmTasks('grunt-contrib-coffee');

	// Time how long tasks take. Can help when optimizing build times
	// require('time-grunt')(grunt);

	buildType = grunt.option("chat-test") ? "build-chattest" : "build"

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),		
		coffee: {
			compile: {
				files: {
					'public/server.js': 'src/main.coffee', // 1:1 compile
				}
			}
		},
		nodemon: {

			server : {
				script : "public/server.js",
				watch: ['public'],
			},
		},
		

		concurrent: {
			dev: {
				tasks: ['watch','nodemon:server'],
				options: {
					logConcurrentOutput: true,
					limit: 5
				}
			}
		},

		watch: {
			coffee : {
				files : [
					"src/**/*.coffee"
				],
				tasks : ['coffee']
			}
		}
	});

	grunt.registerTask('default', function(target){
		grunt.task.run(['coffee:compile', 'concurrent:dev'])
	});

};
