'use strict';

describe('App4_E2E', function() {
    var timeout  = 60000;
    var stabilize = appMeta.stabilize;
    var stabilizeToCurrent = appMeta.stabilizeToCurrent;

    var testHelper = appMeta.testHelper;
    var common = appMeta.common;

    // effettuo login
    beforeAll(function (done) {
        appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password).then(function (res) {
            expect(res).toBe(true);
            done();
        }, timeout)
    });

    describe("App form with a tree ",
        function() {

            beforeEach(function() {
                testHelper.initAppTests('app4');
            });

            it('1. callPage() table:upb, editType:tree" should be async , tree upb loaded. ',
                function(done) {
                    var tableName = "upb";
                    var editType = "tree";
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {

                                // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                                testHelper.testMetaPageInitialization(metaPage, tableName, editType);

                                // esempio per verificare presenza di un elemento su html
                                testHelper.htmlNodeByTagExists('upb.tree','div');

                                var s = stabilize();
                                // premo bottone di "Chiudi"
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(appMeta.currentMetaPage).toBeNull();
                                done();
                            });

                    // Apro la pagina
                    appMeta.callPage(tableName, editType, true);

                }, timeout);

        });
});