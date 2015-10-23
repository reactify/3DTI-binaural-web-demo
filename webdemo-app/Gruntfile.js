'use strict()';


module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	grunt.loadNpmTasks('grunt-contrib-coffee');

	// Time how long tasks take. Can help when optimizing build times
	// require('time-grunt')(grunt);
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),		
		// // coffee: {
		// // 	compile: {
		// // 		files: {
		// // 			'web/public/js/controller.js': 'web/src/controller.coffee', // 1:1 compile
		// // 			'web/public/js/index.js': 'web/src/display.coffee', // 1:1 compile
		// // 		}
		// // 	}
		// // },
		// coffeeify : {
		// 	basic : {
		// 		options : {
		// 			debug: true

		// 		},
		// 		files : [
		// 			{
		// 				src : ['web/public/src/controller.coffee'],
		// 				dest : 'web/public/js/controller.js'
		// 			},
		// 			{
		// 				src : ['web/public/src/display.coffee'],
		// 				dest : 'web/public/js/index.js'
		// 			}
		// 		]
		// 	}
			
		// },
		exec : {
			compile : {
				cmd : "node_modules/.bin/browserify -t coffeeify src/main.coffee --debug > public/js/main.js"
			},
			compileMobile : {
				cmd : "node_modules/.bin/browserify -t coffeeify src/main.mobile.coffee --debug > public/js/main.mobile.js"
			}
		},
		nodemon: {

			server : {
				script : "app.js"
			},
		},
		
		compass : {
			dist : {
				options : {
					sassDir: 'src/scss',
					cssDir: 'public/assets/css',
					config: 'src/scss/config.rb'
				}
			}
		},

		concurrent: {
			dev: {
				tasks: ['watch', 'http-server:dev'],
				// tasks: ['watch'],
				options: {
					logConcurrentOutput: true,
					limit: 5
				}
			}
		},

		'http-server': {
 
			'dev': {
	 
				// the server root directory 
				root: 'public',
	 
				// the server port 
				// can also be written as a function, e.g. 
				// port: function() { return 8282; } 
				port: 8081,
				
	 
				// the host ip address 
				// If specified to, for example, "127.0.0.1" the server will  
				// only be available on that ip. 
				// Specify "0.0.0.0" to be available everywhere 
				host: "0.0.0.0",
	 
				cache: 1,
				showDir : true,
				autoIndex: true,
	 
				// server default file extension 
				ext: "html",
	 
				// run in parallel with other tasks 
				runInBackground: false
	 
			}
		},

		watch: {
			coffee : {
				files : [
					"src/**/*.coffee"
				],
				tasks : ['exec:compile', 'exec:compileMobile']
			},
			livereload: {
				files: [
					'public/css/*.css',
					'public/js/**/*.js',
					'public/*.html',
					'public/tests/**/*.html',
				],
				options: {
					livereload: true
				}
			}
		}
	});

	grunt.registerTask('default', function(target){
		grunt.task.run(['exec:compile', 'exec:compileMobile', 'concurrent:dev'])
	});

};
