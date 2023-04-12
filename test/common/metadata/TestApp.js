(function () {

    // Deriva da MetaApp
    let MetaApp = appMeta.MetaApp;

    function TestApp() {
        MetaApp.apply(this, arguments);
    }

    TestApp.prototype = _.extend(
        new MetaApp(),
        {
            constructor: TestApp,
            superClass: MetaApp.prototype,
        });

    appMeta.currApp = new TestApp();

    appMeta.callWebService = function (method, prms) {
        return appMeta.currApp.callWebService(method, prms);
    };

}());
