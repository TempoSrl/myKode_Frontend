
describe('App4_E2E', function() {
    let appMeta = window.appMeta;
    var timeout  = 60000;
    var testHelper = appMeta.testHelper;



    describe("App form with a tree ",
        function() {

            beforeEach(function(done) {
                testHelper.initAppTests('app4');
                appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password, new Date())
                .then(function (res) {
                    expect(res).toBe(true);
                    done();
                }, timeout);
            });

            afterEach(function () {
                expect(appMeta.Stabilizer.nesting).toBe(0);
                if (appMeta.Stabilizer.nesting > 0) appMeta.Stabilizer.showDeferred();
            });

            it('1. callPage() table:upb, editType:tree" should be async , tree upb loaded. ',
                function(done) {
                    var tableName = "upb";
                    var editType = "tree";
                    appMeta.testCaseNumber  = 4;
                    // Evento di attesa pagina caricata
                    testHelper.waitEvent(window.appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                                // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                testHelper.testMetaPageInitialization(metaPage, tableName, editType);

                                // esempio per verificare presenza di un elemento su html
                                testHelper.htmlNodeByTagExists('upb.tree','div');

                                var s = window.appMeta.stabilize();
                                // premo bottone di "Chiudi"
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(window.appMeta.currApp.currentMetaPage).toBeNull();
                                done();
                            });

                    // Apro la pagina
                    window.appMeta.currApp.callPage(tableName, editType, true);

                }, timeout);

        });
});