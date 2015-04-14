module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
//    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          copy: false
//          cleanBowerDir: true
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-bower-task');

  // Default task(s).
  grunt.registerTask('build', ['bower']);

};