// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-02-06 using
// generator-karma 0.9.0

module.exports = function(config) {
    'use strict';

    // prod app
    var appEnum = {        
        CredBack: "CredBack",
        Coan_UniCampania: "Coan_UniCampania",          
        SEGRETERIE : "SEGRETERIE",
        VISUALMDLW: "VISUALMDLW",
        EASYWEB: "EASYWEB"      
    };

   // -----> Change here app to test!
    var appToTest = appEnum.SEGRETERIE;

    // common files
    var files =  ['bower_components/es5-shim/es5-shim.js',
        'bower_components/font-awesome/js/all.min.js',
        'bower_components/jquery/dist/jquery.js',
        'bower_components/jquery-ui/jquery-ui.min.js',
        'node_modules/jasmine-collection-matchers/index.js',
        'bower_components/lodash/lodash.js',
        'bower_components/observe-js/src/observe.js',
        'bower_components/jsDataQuery/src/jsDataQuery.js',
        'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
        'bower_components/jsDataSet/src/jsDataSet.js',
        'bower_components/bootstrap4/dist/js/bootstrap.js',
        'bower_components/jstree/dist/jstree.js',
        'bower_components/moment/min/moment.min.js',
        'bower_components/fullcalendar/dist/fullcalendar.min.js',
        'bower_components/fullcalendar/dist/locale-all.js',
        'bower_components/jqueryui-timepicker-addon/dist/jquery-ui-timepicker-addon.min.js',
        'bower_components/jqueryui-timepicker-addon/dist/i18n/jquery-ui-timepicker-addon-i18n.js',
        'components/utility/jquery.toast.js',
        'components/styles/select2.min.css',
        'components/utility/select2.min.js',
        'components/styles/app.css',
        'components/styles/jquery.toast.css',
		'components/metadata/MetaApp.js',
		///--------le app derivate vanno qui--------
		'app_segreterie/metadata/MetaSegreterieApp.js',
		'CredBack/metadata/MetaCredBackApp.js',
		'app_Coan_UniCampania/metadata/MetaCoan_UniCampaniaApp.js',
		'VisualMDLW/metadata/MetaVisualMDLWApp.js',
		///------------------------------------------
        'components/metadata/Config.js',
        'components/metadata/ConfigDev.js',
        'components/metadata/Enum.js',
        'components/metadata/LocalResource.js',
        'components/i18n/*.js',
        'components/metadata/Logger.js',
        'components/metadata/EventManager.js',
        'components/metadata/Routing.js',
        'components/metadata/DbProcedureMessage.js',
        'components/metadata/ConnWebService.js',
        'components/metadata/ConnWebSocket.js',
        'components/metadata/Connection.js',
        'components/metadata/CssDefault.js',
        'components/metadata/Utils.js',
        'components/metadata/Security.js',
        'components/metadata/GetDataUtils.js',
        'components/metadata/GetDataUtilsDotNet.js',
        'components/metadata/AuthManager.js',
        'components/metadata/TypedObject.js',
        'components/metadata/MetaModel.js',
        'components/metadata/GetData.js',
        'components/metadata/PostData.js',
        'components/metadata/LoaderControl.js',
        'components/metadata/ModalLoaderControl.js',
        'components/metadata/BootstrapContainerTab.js',
        'components/metadata/MetaData.js',
        'components/metadata/HelpForm.js',
        'components/metadata/MetaPageState.js',
        'components/metadata/TreeNode.js',
        'components/metadata/TreeNode_Dispatcher.js',
        'components/metadata/TreeViewManager.js',
        'components/metadata/TreeNodeLeveled.js',
        'components/metadata/TreeNodeLeveled_Dispatcher.js',
        'components/metadata/TreeNodeUnLeveled.js',
        'components/metadata/TreeNodeUnLeveled_Dispatcher.js',
        'components/metadata/BootstrapModal.js',
        'components/metadata/ModalForm.js',
		'components/metadata/GridControlX.js',
		'components/metadata/GridControlXChild.js',
		'components/metadata/GridControlXEdit.js',
		'components/metadata/CalendarControl.js',
        'components/metadata/CheckBoxListControl.js',
        'components/metadata/DropDownGridControl.js',
        'components/metadata/ListManager.js',
        'components/metadata/ListManagerCalendar.js',
        'components/metadata/MainToolBarManager.js',
        'components/metadata/MetaPage.js',
        'components/metadata/ComboManager.js',
        'components/metadata/FormProcedureMessages.js',
        'components/metadata/GridMultiSelectControl.js',
        'components/metadata/MultiSelectControl.js',
        'components/metadata/Attachment.js',
        'components/metadata/UploadControl.js',
        'components/metadata/UploadControlWin.js',
        'components/metadata/GridControlXScrollable.js',
        'components/metadata/ListManagerScrollable.js',
        'components/metadata/GridControlXMultiSelect.js',
        'components/metadata/ListManagerMultiSelect.js',
        'components/metadata/tree/SimpleUnLeveled_TreeNode.js',
        'components/metadata/tree/SimpleUnLeveled_TreeNode_Dispatcher.js',
        'components/metadata/tree/SimpleUnLeveled_TreeViewManager.js',
        'components/metadata/tree/TreeControl.js',
        'components/metadata/SliderControl.js',
        'components/metadata/thirdpart/gauge.js',
        'components/metadata/tachimetro/TachimetroControl.js',
        'test/common/common.js',
        'test/common/TestHelper.js',
        'test/common/TestCase.js',
        'test/spec/fixtures/*.html',
        'components/template/*.html',
        'components/userTemplate/mainToolBar_Template.html',
        'componentsEasy/metadata/MetaEasyPage.js',
        'componentsEasy/metadata/MetaEasyData.js',
    ];

    // check the app to test
    var appTestDIR;
    var appDIR;
    switch (appToTest){        
        case appEnum.CredBack:
            appTestDIR = 'CredBack';
            appDIR = 'CredBack';
            // classi derivate dal framework     
            files.push(appDIR + '/metadata/MetaCredBackPage.js');
            files.push(appDIR + '/metadata/MetaCredBackData.js');
            files.push(appDIR + '/metadata/Toast.js');
			files.push(appDIR + '/cambioruolo.js');
            break; 
        case appEnum.Coan_UniCampania:
            appTestDIR = 'app_Coan_UniCampania';
            appDIR = 'app_Coan_UniCampania';
            // classi derivate dal framework     
            files.push(appDIR + '/metadata/MetaCoan_UniCampaniaPage.js');
            files.push(appDIR + '/metadata/MetaCoan_UniCampaniaData.js');
            files.push(appDIR + '/metadata/Toast.js');
            break;            
        case appEnum.SEGRETERIE:
            appTestDIR = 'app_segreterie';
            appDIR = 'app_segreterie';
            // classi derivate dal framework
			files.push(appDIR + '/metadata/MetaSegreteriePage.js');
            files.push(appDIR + '/metadata/MetaSegreterieData.js');
            files.push(appDIR + '/metadata/scheduler/scheduleConfig.js');
            files.push(appDIR + '/metadata/Toast.js');
            files.push(appDIR + '/cambioruolo.js');
            // custom file for debug
            files.push(appDIR + '/metadata/menuweb/menuweb_tree.js');
            files.push(appDIR + '/metadata/attivform/attivform_default.js');
            files.push(appDIR + '/metadata/progetto/progetto_seg.js');
            files.push(appDIR + '/metadata/didprogori/didprogori_default.js');
            break;
		case appEnum.VISUALMDLW:
			appTestDIR = 'VisualMDLW';
			appDIR = 'VisualMDLW';
			// classi derivate dal framework
			files.push(appDIR + '/metadata/MetaVisualMDLWPage.js');
			files.push(appDIR + '/metadata/MetaVisualMDLWData.js');
            files.push(appDIR + '/metadata/Toast.js');
			break;
        case appEnum.EASYWEB:
            appTestDIR = 'app_EasyWeb';
            appDIR = 'app_EasyWeb';
            // classi derivate dal framework
            files.push(appDIR + '/metadata/FunzioniConfigurazione.js');
            files.push(appDIR + '/metadata/MetaEasyWebPage.js');
            files.push(appDIR + '/metadata/MetaEasyWebData.js');
          break;       
    }

    var appFiles = [

        // 'test/spec_e2e_app_produzione/app_segreterie/AAA_loginConfigTest.js',

        // file spec, suddivisi per app specifici per le varie app
        'test/spec_e2e_app_produzione/' + appTestDIR + '/*.js',

        appDIR + '/assets/i18n/*.js',
        appDIR + '/Localization.js',
        appDIR + '/custom.js',
        appDIR + '/metadata/**/*.html', // html of metapage. MetaPage js are loaded at a runtime using juery getScript()
        appDIR + '/metadata/**/meta_*.js', // metadati js
        appDIR + '/styles/custom.css',
        appDIR + '/styles/italia/*.css',
        { pattern: appDIR + '/**/**/*.js', included: false, served: true },
        { pattern: appDIR + '/**/**/*.html', included: false, served: true }
    ];

    // union of generic files with specific for app
    files = files.concat(appFiles);
    // inserisco metadati comuni a tutte le app.
    // va dopo i costruttori base da cui derivano
    //files.push('metadata/meta_*.js');

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
        files: files,

        // list of files / patterns to exclude
        exclude: [
        ],
        proxies: {
            '/auth/': 'http://localhost:54471/auth/',
            '/data/': 'http://localhost:54471/data/',
            '/static/': 'http://localhost:54471/static/',
            '/file/' : 'http://localhost:54471/file/',
            '/performance/' : 'http://localhost:54471/performance/',
            /*'/auth/': 'http://185.56.8.51:8085/auth/',
            '/data/': 'http://185.56.8.51:8085/data/',
            '/static/': 'http://185.56.8.51:8085/static/',
            '/file/': 'http://185.56.8.51:8085/file/',*/
            '/styles/': '/base/test/app/styles/'
        },

        //https://www.npmjs.com/package/karma-jasmine
        client: {
            jasmine: {
                random:false,
                failFast: false,
                timeoutInterval: 300000
            }
        },

        // web server port
        port: 9876,
        browserNoActivityTimeout: 30000000, // timeout se Karma non riceve messaggi dal browser entro un certo tempo. aumentato in test ceh richeidono query pesanti
        browserDisconnectTimeout: 30000000,
        captureTimeout: 30000000,

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
            'karma-firefox-launcher',
            'karma-ie-launcher',
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
