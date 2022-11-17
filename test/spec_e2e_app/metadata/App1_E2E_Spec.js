'use strict';

fdescribe('App1_E2E', function() {
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

    describe("App Form Activation + Search row + Autochoose + ShowLast",
        function() {

            beforeEach(function() {
                testHelper.initAppTests('app1');
            });

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Press "mainclose" -> page is closed',
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 1;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {

                                // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                                testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                                // esempio per verificare presenza di un elemento su html
                                testHelper.htmlNodeByTagExists('registry.idreg');
                                testHelper.htmlNodeByTagNotFilled('registry.idreg');

                                var s = stabilize();
                                // premo bottone di "Chiudi"
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(appMeta.currentMetaPage).toBeNull();
                                done();
                            });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Invoked maindosearch. listManager appears. ' + "\n" +
                '3. Do "dblclick" on a row -> form filled with row data selected.' + "\n" +
                '4. press showlast -> messagebox appears -> then press ok to close it ',
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 1;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {

                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // TEST CUSTOM PER PAGINA
                            // expect(appMeta.metaPages.length).toBe(1);
                            // expect(appMeta.htmlPages.length).toBe(1);

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            common.eventWaiter(metaPage, appMeta.EventEnum.listCreated).then(function () {
                                // appare ListManager
                                testHelper.htmlNodeByClassExists('ui-dialog');
                                testHelper.htmlNodeByTagNotFilled('registry.idreg');
                                allCheckExecuted++;
                                var s = stabilizeToCurrent();
                                $("table:first").find("tr").eq(2).dblclick(); // doppio click su una riga.
                                return s;
                                
                            }).then(function() {
                                testHelper.htmlNodeByClassNotExists('ui-dialog');
                                testHelper.htmlNodeByTagValueFilled('registry.idreg'); // viene fatto il fill con la riga selezionata, nel doppio click
                                allCheckExecuted++;
                                var s = stabilizeToCurrent();
                                common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                    .then(function() { //sezione (1)
                                       // verifico che ci sia il messaggio. quindi ci siano più di 10 caratteri
                                       expect($(".modal-body").text().length).toBeGreaterThan(10);
                                       $(".modal").find("button")[0].click();
                                        allCheckExecuted++;
                                    });

                                // premo bottone di "Info riga"
                                testHelper.clickButtonByTag('showlast');
                                return s;
                            }).then(function () {
                                allCheckExecuted++;
                                var s = stabilize();
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(allCheckExecuted).toBe(5);
                                done();
                            });

                            // premo bottone di "Effettua ricerca"                            
                            testHelper.clickButtonByTag('maindosearch');

                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);
                    
                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Invokes maindosearch -> form filled' ,
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 2;
                    var allCheckExecuted = 0;
                    var mp ;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            var s = stabilizeToCurrent(); // N.B c'è il deferredResult della apgina ancora appeso quindi stabilizeToCurrent()
                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;

                        }).then(function () {
                            allCheckExecuted++;
                            // dopo la pressione di effettia ricerca il form è popolato
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');
                            var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            testHelper.clickButtonByTag('mainclose');
                            return s;
                        }).then(function () {
                            expect(allCheckExecuted).toBe(2);
                            done();
                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);


            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Invokes maindosearch -> form filled'  + "\n" +
                '3. Modify a value - > close -> a messageBox with warning is shown' ,
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 2;
                    var allCheckExecuted = 0;
                    var mp ;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            var s = stabilizeToCurrent(); // N.B c'è il deferredResult della apgina ancora appeso quindi stabilizeToCurrent()
                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;

                        }).then(function () {
                        allCheckExecuted++;
                        // dopo la pressione di effettia ricerca il form è popolato
                        testHelper.htmlNodeByTagValueFilled('registry.idreg');
                        var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                        testHelper.insertValueInputByTag('registry.title', "new title");
                        // dopo il close attendo messaggio di warning . premo ok
                        common.eventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
                            allCheckExecuted++;
                            $(".modal").find("button")[1].click();
                        });

                        testHelper.clickButtonByTag('mainclose');
                        return s;
                    }).then(function () {
                        expect(allCheckExecuted).toBe(3);
                        done();
                    });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);



            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Insert some value text into input text idreg. ' + "\n" +
                '3. Press "mainsetsearch" button -> input text idreg is empty.' + "\n" +
                '4. Insert in idreg input a value to search -> form is filled with the expected value.',
                function(done) {

                    // Tst imposta ricerca: dopo activate, metto testo nelle text, premo imposta ricerca-> deve sbianchettare tutto. Poi digito id 1040471
                    // premo "search" -> la forma deve popolarsi con i dati della riga
                    
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 3;
                    var allCheckExecuted = 0;
                    var mp ;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage;
                            // TEST GENERICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // risolvo deffered della pagina così non rimane appeso
                            // metaPage.deferredResult.resolve();

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            
                            // inserisco testo su id reg. Voglio ricercare idreg=1
                            testHelper.insertValueInputByTag('registry.idreg', "1");
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');
                            allCheckExecuted++;
                            var s = stabilizeToCurrent();
                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('mainsetsearch');
                            return s;

                        }).then(function () {
                            // dopo la pressione di "effettia ricerca" il form è popolato
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.lu');
                            // inserisco nuovamente testo su id reg. Voglio ricercare idreg=1
                            testHelper.insertValueInputByTag('registry.idreg', "1");
                            allCheckExecuted++;
                            var s = stabilizeToCurrent();
                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;
                        }).then(function () {
                            allCheckExecuted++;
                            // dopo la pressione di effettia ricerca il form è popolato. su idreg c'è ancora  il valore 1
                            testHelper.htmlNodeByTagValue('registry.idreg', "1");
                            testHelper.htmlNodeByTagValueFilled('registry.lu');

                            // modifico, valore, deve comaprire msg box informativa dopo prssione del close
                            testHelper.insertValueInputByTag('registry.title', "nuovo");
                            var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            // dopo il close attendo messaggio di warning . premo ok
                            common.eventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
                                allCheckExecuted++;
                                $(".modal").find("button")[1].click();
                            });
                            testHelper.clickButtonByTag('mainclose');
                            return s;
                        
                        }).then(function () {
                            expect(allCheckExecuted).toBe(4);
                            done();
                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Insert p_iva  in the textbox.' + "\n" +
                '3. Lost focus on text input -> modal list appears. ' + "\n" +
                '4. Do "dbclick" on a row -> list disappears and form controls filled.',
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 6;
                    var allCheckExecuted = 0;
                    var pivaLength, mp;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage;
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // risolvo deffered della pagina così non rimane appeso
                            // metaPage.deferredResult.resolve();

                            // Dò il focus
                            testHelper.inputGotFocus('registry.p_iva');
                            
                            // inseriscola parte iniziale della partita iva da cercare
                            testHelper.insertValueInputByTag('registry.p_iva', common.pIvatoSearch);
                            pivaLength = testHelper.getLengthValueByTag('registry.p_iva');
                            allCheckExecuted++;

                            // stabilizeToCurrent() poichè ho il deferredResult della pagina che è aperto, e chiudero solo con il close
                            var s = stabilizeToCurrent();
                            
                            // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                            common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                .then(function() {
                                    
                                    expect($("table:first").find("tr").length).toBeGreaterThan(0); // grid dati 11 righe. 1 header + 10 dati
                                    expect($("table:first").parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale

                                    testHelper.htmlNodeByTagNotFilled("registry.idreg");
                                    testHelper.htmlNodeByTagValueFilled("registry.p_iva");
                                    allCheckExecuted++;
                                    $("table:first").find("tr").eq(2).dblclick(); // scelgo la 2a riga, al termine avrò la then della stabilizeToCurrent()
                                })
                            
                            // perdita di focus, deve scattare choose()
                            testHelper.inputLostFocus('registry.p_iva');
                            return s;
                            
                        }).then(function () {
                                allCheckExecuted++;
                                // nuovo valore scelto dalla lista aperta precedentemente. campi popolati
                                testHelper.htmlNodeByTagValueFilled("registry.idreg");
                                testHelper.htmlNodeByTagValueFilled("registry.p_iva");
                                var pivaLengthNew = testHelper.getLengthValueByTag('registry.p_iva');
                                expect(pivaLengthNew).toBeGreaterThan(pivaLength); // è stata trovata e inserita una p_iva completa
                                // la piva è quella con il prefisso di partenza
                                expect(testHelper.getValueByTag("registry.p_iva").indexOf(common.pIvatoSearch)).not.toBe("-1");


                               // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto


                                testHelper.insertValueInputByTag('registry.title', "nuovo");

                                var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                testHelper.clickButtonByTag('mainclose');
                                return s;

                            }).then(function () {
                                expect(allCheckExecuted).toBe(3);
                                done();
                            });

                    
                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

        });
});