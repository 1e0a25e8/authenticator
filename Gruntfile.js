module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
//    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          copy: false
        }
      }
    },

    react: {
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: 'jsx',
            src: ['**/*.js'],
            dest: 'build',
            ext: '.js'
          }
        ]
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-react');

  // Default task(s).
  grunt.registerTask('build', ['bower', 'react']);

};