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
    },

    aws: grunt.file.readJSON('aws-keys.json'),
    aws_s3: {
      options: {
        accessKeyId: '<%= aws.AWSAccessKeyId %>',
        secretAccessKey: '<%= aws.AWSSecretKey %>',
        bucket: 'www.2factor4.me'
      },
      production: {
        files: [
          {action: 'upload', expand: true, cwd: 'bower_components', src: '**', dest: 'bower_components/'},
          {action: 'upload', expand: true, cwd: 'build', src: '**/*.js', dest: 'build/'},
          {action: 'upload', expand: true, cwd: 'css', src: '**/*.css', dest: 'css/'},
          {action: 'upload', expand: true, cwd: '.', src: ['index.html', 'store-anon-config.js'], dest: '/'}
        ]
      },
      clean_production: {
        files: [{action: 'delete', dest: '/'}]
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-react');
  grunt.loadNpmTasks('grunt-aws-s3');

  // Default task(s)
  grunt.registerTask('clean_production', ['aws_s3:clean_production']);
  grunt.registerTask('build', ['bower', 'react']);
  grunt.registerTask('deploy', ['build', 'aws_s3:production']);a

};