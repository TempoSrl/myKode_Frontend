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
            'bower_components/font-awesome/js/all.min.js',
            //'bower_components/font-awesome/svg-with-js/js/fontawesome-all.min.js',
            'bower_components/jquery/dist/jquery.js',
            'bower_components/jquery-ui/jquery-ui.min.js',
            'node_modules/jasmine-collection-matchers/index.js',
            'bower_components/lodash/lodash.js',
            'bower_components/observe-js/src/observe.js',
            'bower_components/jsDataQuery/src/jsDataQuery.js',
            'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
            'bower_components/jsDataSet/src/jsDataSet.js',
            'bower_components/jstree/dist/jstree.js',
            'components/metadata/MetaApp.js',
            'app_segreterie/metadata/MetaSegreterieApp.js',
            'components/metadata/Enum.js',
            'components/metadata/Config.js',
            'components/metadata/ConfigDev.js',
            'components/metadata/Logger.js',
            'components/metadata/EventManager.js',
            'components/metadata/Routing.js',
            'components/metadata/DbProcedureMessage.js',
            'components/metadata/ConnWebService.js',
            'components/metadata/ConnWebSocket.js',
            'components/metadata/Connection.js',
            'components/metadata/Utils.js',
            'components/metadata/Security.js',
            'components/metadata/AuthManager.js',
            'components/metadata/TypedObject.js',
            'components/metadata/GetDataUtils.js',
            'components/metadata/GetDataUtilsDotNet.js',
            'components/metadata/MetaModel.js',
            'components/metadata/GetData.js',
            'components/metadata/MetaData.js',
            'components/metadata/PostData.js',
            'components/i18n/*.js',
            'components/metadata/LocalResource.js',
            'components/metadata/LoaderControl.js',
            'components/metadata/ModalLoaderControl.js',
            'components/metadata/HelpForm.js',
            'components/metadata/MetaPageState.js',
            'components/metadata/BootstrapModal.js',
            'components/metadata/TreeNode.js',
            'components/metadata/TreeNode_Dispatcher.js',
            'components/metadata/TreeViewManager.js',
            'components/metadata/ModalForm.js',
            'components/metadata/CssDefault.js',
            'components/metadata/GridControl.js',
            'components/metadata/GridControlX.js',
            'components/metadata/ListManager.js',
            'components/metadata/MainToolBarManager.js',
            'components/metadata/MetaPage.js',
            'components/metadata/ComboManager.js',
            'components/metadata/GridMultiSelectControl.js',
            'components/metadata/MultiSelectControl.js',
            'test/common/common.js',
            'test/spec/fixtures/*.html',    
            'components/template/*.html',
            'test/app/styles/app.css',
            'test/app/styles/bootstrap/css/bootstrap.css',
            'test/app/styles/bootstrap/js/bootstrap.js',
            'test/spec_e2e/metadata/*.js',
            { pattern: 'test/spec_midway/**/*.html', included: false, served: true },
            { pattern: 'test/spec_midway/**/*.js', included: false, served: true },
            { pattern: 'test/spec_midway/**/*.json', included: false, served: true },
            { pattern: 'test/spec_e2e/**/*.js', included: false, served: true },
            { pattern: 'test/spec_e2e/**/*.html', included: false, served: true },
            { pattern: 'test/spec_e2e/**/*.json', included: false, served: true },
        ],

        // list of files / patterns to exclude
        exclude: [
        ],
        proxies: {
            '/auth/': 'http://localhost:54471/auth/',
            '/data/': 'http://localhost:54471/data/',
            '/static/': 'http://localhost:54471/static/',
            'test//styles/bootstrap/css/': '/base/test/app/styles/bootstrap/css',
            '/styles/': '/base/test/app/styles',
            '/jstest/': '/base/test/spec_midway/jstest/'
        },

        // web server port
        port: 9876,
        browserNoActivityTimeout: 300000, // timeout se Karma non riceve messaggi dal browser entro un certo tempo. aumentato in test ceh richeidono query pesanti
        browserDisconnectTimeout: 300000,
        captureTimeout: 300000,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
            'Chrome'
        ],

        // Which plugins to enable
        plugins: [
            'karma-jasmine', 'karma-jasmine-html-reporter', 'karma-chrome-launcher',
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

        // Uncomment the following lines if you are using grunt's server to run the tests
        // proxies: {
        //   '/': 'http://localhost:9000/'
        // },
        // URL root prevent conflicts with the site root
        // urlRoot: '_karma_'

        // Allow remote debugging when using PhantomJS
        // uncomment to karma debug on:
        // http://localhost:9876/debug.html
        // , customLaunchers: {
        //     'PhantomJS_custom': {
        //         base: 'PhantomJS',
        //         debug: true,
        //     }
        // }

    });
};
