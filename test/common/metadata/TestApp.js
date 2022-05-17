(function () {

    // Deriva da MetaApp
    var MetaApp = BaseMetaApp;

    function TestApp() {
        MetaApp.apply(this, arguments);
    }

    TestApp.prototype = _.extend(
        new MetaApp(),
        {
            constructor: TestApp,
            superClass: MetaApp.prototype,

            getMetaDataPath: function (tableName) {
                return this.superClass.getMetaDataPath.call(this, tableName);
            }

        });
    window.appMeta = new TestApp();
}());
