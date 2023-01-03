'use strict';

describe('App2_E2E', function() {
    var timeout  = 60000;
    let appMeta = window.appMeta;
    var stabilize = appMeta.stabilize;
    var testHelper = appMeta.testHelper;

    // effettuo login

    
    describe("App Form Activation + Combo",
        function() {


            beforeEach(function(done) {
                testHelper.initAppTests('app2');
                appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password, new Date())
                .then(function (res) {
                    expect(res).toBe(true);
                    done();
                }, timeout);
            });


            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> combo filled' ,
                function(done) {
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricataf
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            allCheckExecuted++;
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // risolvo deferred della pagina così non rimane appeso
                            // metaPage.deferredResult.resolve();
                            expect($("#combomaster")[0].options.length).toBe(5); // 4 del filtro + blank


                            var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            testHelper.clickButtonByTag('mainclose');
                            return s;
                        }).then(function () {
                            allCheckExecuted++;
                            expect(allCheckExecuted).toBe(2);
                            done();
                        });

                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica", true);

                }, timeout);

        });
});