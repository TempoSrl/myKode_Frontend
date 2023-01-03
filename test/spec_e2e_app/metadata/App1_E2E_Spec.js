'use strict';

describe('App1_E2E', function() {
    var timeout  = 60000;
    let appMeta = window.appMeta;
    var stabilize = appMeta.stabilize;
    var stabilizeToCurrent = appMeta.stabilizeToCurrent;

    var testHelper = appMeta.testHelper;
    var common = appMeta.common;


    describe("App Form Activation + Search row + Autochoose + ShowLast",
        function() {

            beforeEach(function(done) {
                testHelper.initAppTests('app1');
                appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password, new Date())
                .then(function (res) {
                    expect(res).toBe(true);
                    done();
                }, timeout);
            });

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Press "mainclose" -> page is closed',
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 1;
                    // Evento di attesa pagina caricata
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {

                                // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                                // esempio per verificare presenza di un elemento su html
                                testHelper.htmlNodeByTagExists('registry.idreg');
                                testHelper.htmlNodeByTagNotFilled('registry.idreg');

                                let s = stabilize();
                                // premo bottone di "Chiudi"
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(appMeta.currApp.currentMetaPage).toBeNull();
                                done();
                            });

                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Invoked maindosearch. listManager appears. ' + "\n" +
                '3. Do "dblclick" on a row -> form filled with row data selected.' + "\n" +
                '4. press showlast -> messagebox appears -> then press ok to close it ',
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 1;
                    let allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // TEST CUSTOM PER PAGINA
                            // expect(appMeta.metaPages.length).toBe(1);
                            // expect(appMeta.htmlPages.length).toBe(1);

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            common.pageEventWaiter(metaPage, appMeta.EventEnum.listCreated).then(function () {
                                // appare ListManager
                                testHelper.htmlNodeByClassExists('autoChooseDataTag'); //'ui-dialog'
                                testHelper.htmlNodeByTagNotFilled('registry.idreg');
                                allCheckExecuted++;
                                let s = stabilizeToCurrent();
                                $("table:first").find("tr").eq(2).click(); // doppio click su una riga. dblclick
                                return s;
                            }).then(function() {
                                let s = stabilizeToCurrent();
                                $("div.searchClose").first().click();
                                return s;
                            }).then(function() {
                                testHelper.htmlNodeByClassNotExists('autoChooseDataTag');

                                // viene fatto il fill con la riga selezionata, nel doppio click
                                testHelper.htmlNodeByTagValueFilled('registry.idreg');
                                allCheckExecuted++;
                                let s = stabilizeToCurrent();
                                common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
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
                    appMeta.currApp.callPage("registry", "anagrafica", true);
                    
                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Invokes maindosearch -> form filled' ,
                function(done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 2;
                    var allCheckExecuted = 0;
                    var mp ;
                    // Evento di attesa pagina caricata
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage;
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            // N.B c'è il deferredResult della pagina ancora appeso quindi stabilizeToCurrent()
                            let s = stabilizeToCurrent(1);

                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;
                        }).then(function () {
                            allCheckExecuted++;
                            // dopo la pressione di effettua ricerca il form è popolato
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');
                            // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            var s = stabilize();
                            testHelper.clickButtonByTag('mainclose');
                            return s;
                        }).then(function () {
                            expect(allCheckExecuted).toBe(2);
                            done();
                        });

                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica", true);

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
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage;
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            var s = stabilizeToCurrent(1); // N.B c'è il deferredResult della apgina ancora appeso quindi stabilizeToCurrent()
                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;
                        }).then(function () {
                            allCheckExecuted++;
                            // dopo la pressione di effettua ricerca il form è popolato
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');

                            // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            var s = stabilize();
                            testHelper.insertValueInputByTag('registry.title', "new title");
                            // Dopo il close attendo messaggio di warning. premo ok
                            common.pageEventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
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
                    appMeta.currApp.callPage("registry", "anagrafica", true);

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
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
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
                            var s = stabilizeToCurrent(1);
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
                            common.pageEventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
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
                    appMeta.currApp.callPage("registry", "anagrafica", true);

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
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            mp = metaPage;
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // risolvo deffered della pagina così non rimane appeso
                            // metaPage.deferredResult.resolve();

                            // Dò il focus
                            testHelper.inputGotFocus('registry.p_iva');
                            
                            // inserisco la parte iniziale della partita iva da cercare
                            testHelper.insertValueInputByTag('registry.p_iva', common.pIvatoSearch);
                            pivaLength = testHelper.getLengthValueByTag('registry.p_iva');
                            allCheckExecuted++;

                            // stabilizeToCurrent() poichè ho il deferredResult della pagina che è aperto, e chiudero solo con il close


                            // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                            let s = common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                .then(function(){
                                    //console.log(document.body.innerHTML);
                                    expect($("table:first").find("tr").length).toBeGreaterThan(0); // grid dati 11 righe. 1 header + 10 dati
                                    // griglia dati ospitata sulla modale
                                    expect($("table:first").parent().parent().parent().hasClass("modal-body")).toBe(true);

                                    testHelper.htmlNodeByTagNotFilled("registry.idreg");
                                    testHelper.htmlNodeByTagValueFilled("registry.p_iva");
                                    allCheckExecuted++;
                                    let s = stabilizeToCurrent(4);
                                    // let s = appMeta.Deferred();
                                    // appMeta.globalEventManager.subscribe(appMeta.EventEnum.showPage,
                                    //     ()=>{s.resolve();}
                                    // );
                                    $("table:first").find("tr").eq(2).dblclick();
                                    return s.promise();
                                });
                                // .then(function(){
                                //     console.log(document.body.innerHTML);
                                //     let s = stabilizeToCurrent();
                                //     $("div.searchClose").first().click();
                                //     return s;
                                // });
                            
                            // perdita di focus, deve scattare choose()

                            testHelper.inputLostFocus('registry.p_iva');
                            return s;
                            
                        }).then(function () {
                                allCheckExecuted++;
                                // Nuovo valore scelto dalla lista aperta precedentemente. Campi popolati
                                testHelper.htmlNodeByTagValueFilled("registry.idreg");
                                testHelper.htmlNodeByTagValueFilled("registry.p_iva");
                                let pivaLengthNew = testHelper.getLengthValueByTag('registry.p_iva');
                                // è stata trovata e inserita una p_iva completa
                                expect(pivaLengthNew).toBeGreaterThan(pivaLength);
                                // la piva è quella con il prefisso di partenza
                                expect(testHelper.getValueByTag("registry.p_iva").indexOf(common.pIvatoSearch)).not.toBe("-1");

                               // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                testHelper.insertValueInputByTag('registry.title', "nuovo");

                                var s = stabilizeToCurrent(1); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                testHelper.clickButtonByTag('mainclose');
                                return s;

                            }).then(function () {
                                expect(allCheckExecuted).toBe(3);
                                done();
                            });

                    
                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica", true);

                }, timeout);

        });
});