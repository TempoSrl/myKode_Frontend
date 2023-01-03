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

        //https://www.npmjs.com/package/karma-jasmine
        client: {
            jasmine: {
                random:false,
                failFast: false,
                timeoutInterval: 5000
            }
        },

        // list of files / patterns to load in the browser
        files: [
            'bower_components/es6-shim/es6-shim.js',
            'bower_components/jquery/dist/jquery.js',
            'bower_components/jquery-ui/jquery-ui.min.js',
            'node_modules/jasmine-collection-matchers/index.js',
            'bower_components/lodash/lodash.js',
            'bower_components/observe-js/src/observe.js',
            'components/metadata/jsDataQuery.js',
            'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
            'components/metadata/jsDataSet.js',
            'bower_components/jstree/dist/jstree.js',
            'components/styles/select2.min.css',
            'components/utility/select2.min.js',
            'components/styles/dragdrop/jquery.dragtable.js',
            'components/metadata/MetaApp.js',
            'test/common/metadata/TestApp.js',
            'components/metadata/LocalResource.js',
            'components/i18n/LocalResourceIt.js',
            'components/metadata/Enum.js',
            'components/metadata/Config.js',
            'components/metadata/Logger.js',
            'components/metadata/EventManager.js',
            'components/metadata/Routing.js',
            'components/metadata/CssDefault.js',
            'components/metadata/Utils.js',
            'components/metadata/ConnWebService.js',
            'components/metadata/ConnWebSocket.js',
            'components/metadata/Connection.js',
            'components/metadata/MetaModel.js',
            'components/metadata/GetDataUtils.js',
            'components/metadata/GetDataUtilsDotNet.js',
            'components/metadata/Security.js',
            'components/metadata/GetData.js',
            'components/metadata/PostData.js',
            'components/metadata/BootstrapModal.js',
            'components/metadata/ModalLoaderControl.js',
            'components/metadata/DbProcedureMessage.js',
            'components/metadata/TreeNode.js',
            'components/metadata/TreeNode_Dispatcher.js',
            'components/metadata/TreeViewManager.js',
            'components/metadata/TypedObject.js',
            'components/metadata/BootstrapContainerTab.js',
            'components/metadata/HelpForm.js',
            'components/metadata/MetaData.js',
            'components/metadata/MetaPage.js',
            'components/metadata/ModalForm.js',
            'components/metadata/FormProcedureMessages.js',
            'components/metadata/GridControl.js',
            'components/metadata/GridControlX.js',
            'components/metadata/CheckBoxListControl.js',
            'components/metadata/ComboManager.js',
            'components/metadata/MetaPageState.js',
            'components/metadata/LoaderControl.js',
            'components/metadata/ListManager.js',
            'components/metadata/MainToolBarManager.js',
            'components/metadata/GridMultiSelectControl.js',
            'components/metadata/MultiSelectControl.js',
            'components/metadata/SliderControl.js',
            'components/metadata/thirdpart/gauge.js',
            'components/metadata/tachimetro/TachimetroControl.js',
            'components/metadata/thirdpart/chart.min.js',
            'components/metadata/graph/GraphControl.js',
            'test/common/common.js',
            'test/spec_midway/metadata/*.js',
            'test/app/styles/fontawesome/fontawesome-all.js',
            'test/app/styles/app.css',
            'components/template/*.html',
            //'components/styles/bootstrap/css/bootstrap.css'  needed for components/template/*.html
            //'components/styles/app.css',    // needed for components/template/*.html
            'test/app/styles/bootstrap/css/bootstrap.css',
            'test/app/styles/bootstrap/js/bootstrap.js',
            //'test/app/styles/bootstrap/js/jquery-ui.min.js',
            'bower_components/jstree/dist/themes/default/style.css',
            'test/spec_midway/fixtures/*.html',
            { pattern: 'components/styles/bootstrap/css/*.css', included: false, served: true },
            { pattern:'components/styles/*.css', included: false, served: true },
            { pattern: 'test/spec_midway/**/*.js', included: false, served: true },
            { pattern: 'test/spec_midway/**/*.html', included: false, served: true },
            { pattern: 'test/spec_midway/**/*.json', included: false, served: true },
        ],

        // list of files / patterns to exclude
        exclude: [
        ],
        proxies: {
            '/components/': '/base/components/',
            '/styles/bootstrap/css/': '/base/components/styles/bootstrap/css/',
            '/styles/': '/base/components/styles/',
            '/jstest/': '/base/test/spec_midway/jstest/',
            '/test/styles/bootstrap/css/': '/base/test/app/styles/bootstrap/css/',
            '/test/styles/bootstrap/js/': '/base/test/app/styles/bootstrap/js/',
            '/test/styles/': '/base/test/app/styles/'
        },

        // web server port
        port: 9876,

        // Start these browsers, currently available:
        // - Chrome ChromeHeadless
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
        logLevel: config.LOG_WARN

        // Uncomment the following lines if you are using grunt's server to run the tests
        // proxies: {
        //   '/': 'http://localhost:9000/'
        // },
        // URL root prevent conflicts with the site root
        // urlRoot: '_karma_'
    });
};
