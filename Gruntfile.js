// borrowed heavily from https://github.com/biosoup/screeps-v2/blob/master/gruntfile.js

module.exports = function(grunt) {
  //     require('time-grunt')(grunt);

  // Pull defaults (including username and password) from .screeps.json
  const config = require('./.screeps.json');

  // Allow grunt options to override default configuration
  const branch = grunt.option('branch') || config.branch;
  const email = grunt.option('email') || config.email;
  // const username = grunt.option('username') || config.username;
  const password = grunt.option('password') || config.password;
  const ptr = grunt.option('ptr') ? true : config.ptr;
  // const private_directory = grunt.option('private_directory') || config.private_directory;

  // const currentdate = new Date();
  // grunt.log.subhead(`Task Start: ${currentdate.toLocaleString()}`);
  // grunt.log.writeln(`Branch: ${branch}`);

  // Load needed tasks
  grunt.loadNpmTasks('grunt-screeps');
  //     grunt.loadNpmTasks('grunt-contrib-clean');
  //     grunt.loadNpmTasks('grunt-contrib-copy');
  //     grunt.loadNpmTasks('grunt-contrib-watch');
  //     grunt.loadNpmTasks('grunt-file-append');
  //     grunt.loadNpmTasks("grunt-sync");

  grunt.initConfig({
    /**
     * Watch src for changes and update
     */
    // watch: {
    //     scripts: {
    //         files: ['code/**/*.js'],
    //         //  tasks: ['jsbeautifier:verify', 'private'],
    //         tasks: ['private'],
    //         options: {
    //             interrupt: true,
    //             debounceDelay: 250
    //         }
    //     }
    // },

    /**
     * Push all files in the dist folder to screeps.
     * What is in the code folder and gets sent will depend on the tasks used.
     */
    screeps: {
      options: {
        email: email,       // 'craig@cottingham.net',
        password: password, // 'Yw8CDiRg2BmMCRUeuQucdTbAJrCghpTg8DYCBgaTFxCQxZ4REULig3RBZ49NbH9c',
        branch: branch,     // 'grunt',
        ptr: ptr            //false
      },
      // mmo: {
      //     src: ['dist/*.js'],
      // },
      // s2: {
      //     options: {
      //         server: {
      //             host: 'server2.screepspl.us',
      //             http: false
      //         },
      //         email: username,
      //         password: password,
      //         branch: branch,
      //         ptr: ptr
      //     },
      //     src: ['dist/*.js']
      // },
      // s1: {
      //     options: {
      //         server: {
      //             host: 'server1.screepspl.us',
      //             http: false
      //         },
      //         email: username,
      //         password: password,
      //         branch: branch,
      //         ptr: ptr
      //     },
      //     src: ['dist/*.js']
      // },
      // prtest: {
      //     options: {
      //         server: {
      //             host: 'prtest.screepspl.us',
      //             http: false
      //         },
      //         email: username,
      //         password: password,
      //         branch: branch,
      //         ptr: ptr
      //     },
      //     src: ['dist/*.js']
      // },
      // test: {
      //     options: {
      //         server: {
      //             host: '192.168.0.106',
      //             http: false
      //         },
      //         email: username,
      //         password: password,
      //         branch: branch,
      //         ptr: ptr
      //     },
      //     src: ['dist/*.js']
      // }
      dist: {
        src: ['dist/*.js']
      }
    },

    /**
     * Copy all files
     */
    // copy: {
    //     // Pushes the game code to the dist folder so it can be modified before
    //     // being send to the screeps server.
    //     screeps: {
    //         files: [{
    //             expand: true,
    //             cwd: 'code/',
    //             src: '**/*.js',
    //             dest: 'dist/',
    //             filter: 'isFile',
    //             rename: function(dest, src) {
    //                 return dest + src.replace(/\//g, '.');
    //             }
    //         }],
    //     }
    // },

    /**
     * Push only the relevant file changes
     */
    // sync: {
    //     private: {
    //         files: [{
    //             expand: true,
    //             cwd: 'dist/',
    //             src: '**/*.js',
    //             dest: private_directory,
    //
    //         }],
    //         verbose: true,
    //         updateAndDelete: true,
    //         compareUsing: "md5"
    //     }
    // },

    /**
     * Add version constiable using current timestamp.
     */
    // file_append: {
    //     versioning: {
    //         files: [{
    //             append: `\nglobal.SCRIPT_VERSION = ${currentdate.getTime()}\n`,
    //             input: 'dist/version.js',
    //         }]
    //     }
    // },

    /**
     * Remove all files from the dist folder.
     */
    // clean: {
    //     'dist': ['dist']
    // }
  });

  /**
   * Build tasks out of the above.
   */
  // grunt.registerTask('default', ['private']);
  // grunt.registerTask('private', ['clean', 'copy:screeps', 'file_append:versioning', 'sync:private']);
  // grunt.registerTask('mmo', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps:mmo']);
  // grunt.registerTask('s2', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps:s2']);
  // grunt.registerTask('s1', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps:s1']);
  // grunt.registerTask('prtest', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps:prtest']);
  // grunt.registerTask('test', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps:test']);
  // grunt.registerTask('all', ['clean', 'copy:screeps', 'file_append:versioning', 'screeps:mmo', 'screeps:s2', 'screeps:s1', 'sync:private']);
  //
  // grunt.registerTask('default', ['screeps:mmo', 'screeps:s2']);
  // grunt.registerTask('mmo', ['screeps:mmo']);
  // grunt.registerTask('s2', ['screeps:s2']);
}
