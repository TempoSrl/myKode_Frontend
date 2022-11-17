(function () {

    // Deriva da MetaApp
    let MetaApp = window.appMeta.MetaApp;

    function TestApp() {
        MetaApp.apply(this, arguments);
    }

    TestApp.prototype = _.extend(
        new MetaApp(),
        {
            constructor: TestApp,
            superClass: MetaApp.prototype,
        });

    window.appMeta.callWebService = function (method, prms) {
        return appMeta.currApp.callWebService(method,prms);
    };

    window.appMeta.currApp = new TestApp();
}());
