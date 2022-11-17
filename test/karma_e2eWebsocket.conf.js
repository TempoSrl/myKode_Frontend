// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-02-06 using
// generator-karma 0.9.0

module.exports = function(config) {
    'use strict';

    config.set({
        // enable / disable watching file and executing tests whenever any file changes
        //autoWatch: true,
        usePolling: true,

        //dots  progress  junit  growl  coverage kjhtml spec
        reporters: ['dots'],


        // base path, that will be used to resolve files and exclude
        basePath: '../',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'bower_components/es6-shim/es6-shim.js',
            'bower_components/jquery/dist/jquery.js',
            'node_modules/jasmine-collection-matchers/index.js',
            'bower_components/lodash/lodash.js',
            'bower_components/observe-js/src/observe.js',
            'bower_components/jsDataQuery/src/jsDataQuery.js',
            'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
            'bower_components/jsDataSet/src/jsDataSet.js',
            'components/metadata/MetaApp.js',
            'components/metadata/Enum.js',
            'components/metadata/Config.js',
            'components/metadata/Logger.js',
            'components/metadata/GetDataUtils.js',
            'components/metadata/EventManager.js',
            'components/metadata/Routing.js',
            'components/metadata/ConnWebSocket.js',
            'components/metadata/ConnWebService.js',
            'components/metadata/Connection.js',
            'components/metadata/GetData.js',
            'test/spec_e2e_web_socket/metadata/*.js'
        ],

        // list of files / patterns to exclude
        exclude: [
        ],
        proxies: {
            '/data/': 'http://localhost:54471/data/'
        },

        // web server port
        port: 9876,
        browserNoActivityTimeout: 60000, // timeout se Karma non riceve messaggi dal browser entro un certo tempo. aumentato in test ceh richeidono query pesanti
        browserDisconnectTimeout: 30000,
        captureTimeout: 60000,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
             'PhantomJS'
        ],

        // Which plugins to enable
        plugins: [
            'karma-phantomjs-launcher', 'karma-jasmine', 'karma-jasmine-html-reporter', 'karma-chrome-launcher',
            'karma-junit-reporter',
            'karma-spec-reporter'
        ],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        //singleRun: false,

        colors: true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO



    });
};
