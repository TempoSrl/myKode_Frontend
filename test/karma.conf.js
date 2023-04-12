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
        reporters: ['spec'],


        // base path, that will be used to resolve files and exclude
        basePath: '../',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/jquery-ui/jquery-ui.min.js',
            'node_modules/jasmine-collection-matchers/index.js',
            'bower_components/lodash/lodash.js',
            'bower_components/observe-js/src/observe.js',
            'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
            'components/styles/select2.min.css',
            'components/utility/select2.min.js',
            'components/styles/dragdrop/jquery.dragtable.js',
            'components/metadata/MetaApp.js',
            'test/common/metadata/TestApp.js',
            'components/metadata/jsDataQuery.js',
            'components/metadata/Enum.js',
            'components/metadata/Config.js',
            'components/metadata/Logger.js',
            'components/metadata/EventManager.js',
            'components/metadata/Routing.js',
            'components/metadata/ConnWebService.js',
            'components/metadata/ConnWebSocket.js',
            'components/metadata/Connection.js',
            'components/metadata/jsDataSet.js',
            'components/metadata/GetDataUtils.js',
            'components/metadata/GetDataUtilsDotNet.js',
            'components/metadata/MetaModel.js',
            'components/metadata/GetData.js',
            'components/metadata/Security.js',
            'components/metadata/LocalResource.js',
            'components/i18n/LocalResourceIt.js',
            'components/metadata/BootstrapModal.js',
            'components/metadata/ModalLoaderControl.js',
            'components/metadata/ListManager.js',
            'components/metadata/TypedObject.js',
            'components/metadata/CssDefault.js',
            'components/metadata/Utils.js',
            'components/metadata/BootstrapContainerTab.js',
            'components/metadata/HelpForm.js',
            'components/metadata/MetaData.js',
            'components/metadata/MetaPage.js',
            'components/metadata/GridControlX.js',
            'components/metadata/ComboManager.js',
            'components/metadata/MetaPageState.js',
            'components/metadata/LoaderControl.js',
            'components/metadata/MainToolBarManager.js',
            'components/utility/CodiceFiscale.js',
            'test/common/common.js',
            'test/spec/*.js',
            'test/spec/metadata/CodiceFiscaleSpec.js',
            'test/spec/metadata/ComboManagerSpec.js',
            'test/spec/metadata/EventManagerSpec.js',
            'test/spec/metadata/GetDataSpec.js',
            'test/spec/metadata/GetDataUtilsSpec.js',
            'test/spec/metadata/GridControlSpec.js',
            'test/spec/metadata/HelpFormSpec.js',
            'test/spec/metadata/MetaAppSpec.js',
            'test/spec/metadata/MetaDataSpec.js',
            'test/spec/metadata/MetaModelSpec.js',
            'test/spec/metadata/MetaPageSpec.js',
            'test/spec/metadata/utilsNoClock_Spec.js',
            'test/spec/metadata/utilsSpec.js',
            'test/spec/fixtures/*.html',
            'test/app/styles/fontawesome/fontawesome-all.js',
            'test/app/styles/app.css',
            'components/template/*.html',
            'test/app/styles/bootstrap/css/bootstrap.css',
            'test/app/styles/bootstrap/js/bootstrap.js',
            { pattern: 'test/spec_midway/**/*.json', included: false, served: true },
        ],

        //https://www.npmjs.com/package/karma-jasmine
        client: {
            jasmine: {
                random:false,
                failFast: false,
                timeoutInterval: 5000
            }
        },
        // list of files / patterns to exclude
        exclude: [
        ],
        proxies: {
            '/test/styles/bootstrap/css/': '/base/test/app/styles/bootstrap/css/',
            '/test/styles/': '/base/test/app/styles/'
        },

        // web server port
        port: 9876,

        // Start these browsers, currently available:
        // - ChromeHeadless
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
            'ChromeHeadless'
        ],

        // Which plugins to enable
        plugins: [
            'karma-jasmine',
             'karma-chrome-launcher',
             'karma-jasmine-html-reporter',
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
    });
};
