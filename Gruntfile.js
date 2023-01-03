/// <binding AfterBuild='test' />

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'
/*globals initConfig, appPath */
/*jshint camelcase: false */

module.exports = function(grunt) {
  // Load grunt tasks automatically
  require("load-grunt-tasks")(grunt);

  var asyncCmd = require("async-exec-cmd");

  // Time how long tasks take. Can help when optimizing build times
  require("time-grunt")(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({
    startIIS: {},

    pkg: grunt.file.readJSON("package.json"),

    yuidoc: {
      compile: {
        linkNatives: "true",
        name: "<%= pkg.name %>",
        description: "<%= pkg.description %>",
        version: "<%= pkg.version %>",
        url: "<%= pkg.homepage %>",
        options: {
          paths: ["./app/main", "./components/metadata"],
          outdir: "doc"
        }
      }
    },

    watch: {
      files: ["./app/main/*.js", "./components/metadata/*.js"],
      tasks: ["karma:unit"],
      options: {
        livereload: true
      }
    },

    // Test settings
    karma: {
      spec: {
        configFile: "test/karma.conf.js",
        autoWatch: true,
        singleRun: true,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: true, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: false // test would finish with error when a first fail occurs.
        }
      },

      unit_auto: {
        configFile: "test/karma.conf.js",
        autoWatch: true,
        singleRun: false
      },

      e2e: {
        configFile: "test/karma_e2e.conf.js",
        autoWatch: true,
        singleRun: true,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: false, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: true // test would finish with error when a first fail occurs.
        }
      },
      e2e_auto: {
        configFile: "test/karma_e2e.conf.js",
        autoWatch: true,
        singleRun: false,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: false, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: false // test would finish with error when a first fail occurs.
        }
      },

      e2e_app: {
        configFile: "test/karma_e2e_app.conf.js",
        autoWatch: true,
        singleRun: true,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: false, // do not print information about passed tests
          suppressSkipped: false, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: true // test would finish with error when a first fail occurs.
        }
      },

      e2e_app_produzione: {
        configFile: "test/karma_e2e_App_produzione.conf.js",
        autoWatch: true,
        singleRun: true,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: false, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: true // test would finish with error when a first fail occurs.
        }
      },
      
      e2ews: {
        configFile: "test/karma_e2eWebsocket.conf.js",
        autoWatch: true,
        singleRun: true,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: false, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: true // test would finish with error when a first fail occurs.
        }
      },

      midway: {
        configFile: "test/karma_midway.conf.js",
        autoWatch: true,
        singleRun: true,
        //reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: true, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: false // test would finish with error when a first fail occurs.
        }
      },
      midway_auto: {
        configFile: "test/karma_midway.conf.js",
        autoWatch: true,
        singleRun: false,
        reporters: ["spec"],
        specReporter: {
          maxLogLines: 5, // limit number of lines logged per test
          suppressErrorSummary: false, // do not print error summary
          suppressFailed: false, // do not print information about failed tests
          suppressPassed: false, // do not print information about passed tests
          suppressSkipped: true, // do not print information about skipped tests
          showSpecTiming: true, // print the time elapsed for each spec
          failFast: false // test would finish with error when a first fail occurs.
        }
      }
    },

    copy: {
      segreterie: {
        files: [{
          expand: true,
          cwd: 'app_segreterie/metadata/',
          src: '**/*.*',
          dest: 'apppages/',
          flatten: true,                // copia i file in dest senza rifare l'alberatura di src.
          filter: function (dest) {
            var cwd = this.cwd,
                src = dest.replace(new RegExp('^' + cwd), '');
            dest = grunt.task.current.data.files[0].dest;
            return (!grunt.file.exists(dest + src));    // Copies `src` files ONLY if their destinations are unoccupied
          }
        }]
      },
      credback_apppages: {
        files: [{
          expand: true,
          cwd: 'CredBack/metadata/',
          src: '**/*.*',
          dest: 'apppagesCredBack/',
          flatten: true,                // copia i file in dest senza rifare l'alberatura di src.
          filter: function (dest) {
            var cwd = this.cwd,
                src = dest.replace(new RegExp('^' + cwd), '');
            dest = grunt.task.current.data.files[0].dest;
            return (!grunt.file.exists(dest + src));    // Copies `src` files ONLY if their destinations are unoccupied
          }
        }]
      }
    },

  });

    let iis = false;

    function killIIS() {
        var done = this.async();
        asyncCmd(
            "taskkill /IM iisexpress.exe",
            [],
            function (err, res, code, buffer) {
                if (err) {
                    // console.error(err, code);
                    done();
                    return;
                }
                grunt.log.writeln("Kill_IIS done");
                console.log(res, code, buffer);                            
            }
        );
        setTimeout(function () {
            grunt.log.writeln("IIS stopped");
            iis = false;
            done();
        }, 3000);
    }
    grunt.registerTask("Kill_IIS", "kill all iis process", killIIS);

    function startIIS() {
        var done = this.async();
        asyncCmd(
            "c:\\PROGRA~1\\IISEXP~1\\iisexpress.exe /trace:error",
            ["/config:..\\.vs\\config\\applicationhost.config", "/site:Backend"],
            function (err, res, code, buffer) {
                if (err) {
                    console.error(err, code);
                    return;
                }
                console.log(res, code, buffer);
            }
        );
        setTimeout(function () {
            grunt.log.writeln("IIS running");
            iis = true;
            done();
        }, 5000);
    }
    grunt.registerTask("startIIS", "start Asp.Net WebSite", startIIS);

  grunt.registerTask("spec", ["karma:spec"]);

  grunt.registerTask("midway", ["karma:midway"]);

  grunt.registerTask("e2e", ["Kill_IIS", "startIIS", "karma:e2e"]);

    grunt.registerTask("e2e_app", ["Kill_IIS", "startIIS", "karma:e2e_app"]);

    grunt.registerTask("e2e_app_produzione", ["Kill_IIS", "startIIS", "karma:e2e_app_produzione"]);

    grunt.registerTask("e2e_auto", ["Kill_IIS", "startIIS", "karma:e2e_auto"]);

    grunt.registerTask("e2ews", ["Kill_IIS", "startIIS", "karma:e2ews"]);

  // Deprecated. not used. Use e2e for interaction test with the server
  grunt.registerTask("all", [
		"startIIS",
		"karma:spec",
		"karma:midway",
		"karma:e2e",
		"karma:e2e_app"
  ]);
  

    grunt.registerTask("IIS_ON_OFF", function() {
        if (iis) {
            killIIS.call(this);
        }
        else {            
            startIIS.call(this);
        }
    });
  grunt.registerTask("unit", ["karma:unit"]);

  grunt.registerTask("node", ["jasmine_nodejs:base"]);

  grunt.registerTask("copy_metadata", ["copy:segreterie"]);

  grunt.registerTask("copy_app_pages_credBack", ["copy:credback_apppages"]);
};
