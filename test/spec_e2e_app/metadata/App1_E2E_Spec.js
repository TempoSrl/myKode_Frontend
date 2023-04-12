'use strict';

describe('App1_E2E', function() {
    var timeout  = 60000;
    let appMeta = window.appMeta;
    var stabilize = appMeta.stabilize;
    var stabilizeToCurrent = appMeta.stabilizeToCurrent;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var testHelper = appMeta.testHelper;
    var common = appMeta.common;

    describe("App Form Activation + Search row + Autochoose + ShowLast",
        function() {
            beforeEach(function (done) {
                logger.setLogLevel(logType.INFO);
                testHelper.initAppTests('app1');

                appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password, new Date())
                    .then(function (res) {                    
                        expect(res).toBe(true);
                        done();
                });
            });

            afterEach(function () {
                expect(appMeta.Stabilizer.nesting).toBe(0);
                if (appMeta.Stabilizer.nesting > 0) appMeta.Stabilizer.showDeferred();
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
                                testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica1");

                                // esempio per verificare presenza di un elemento su html
                                testHelper.htmlNodeByTagExists('registry.idreg');
                                testHelper.htmlNodeByTagNotFilled('registry.idreg');

                                let s = stabilize(true);
                                // premo bottone di "Chiudi"
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(appMeta.currApp.currentMetaPage).toBeNull();
                                done();
                            })
                    .fail(err=>{
                        expect(err).toBeUndefined()
                    });

                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica1", true);

                });

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Invoked maindosearch. listManager appears. ' + "\n" +
                '3. Do "dblclick" on a row -> form filled with row data selected.' + "\n" +
                '4. press showlast -> messagebox appears -> then press ok to close it ',
                function (done) {                    
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 1;
                    let allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function (metaPage) {
                            //console.log("showPage received");//unico deferred aperto è "DialogResult"

                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica1");
                            // TEST CUSTOM PER PAGINA
                            // expect(appMeta.metaPages.length).toBe(1);
                            // expect(appMeta.htmlPages.length).toBe(1);

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;

                            let ss = stabilizeToCurrent(); //stabilizeToCurrent();
                            // premo bottone di "Effettua ricerca"     
                            //console.log("clicking maindosearch");
                            testHelper.clickButtonByTag('maindosearch');

                            //common.pageEventWaiter(metaPage, appMeta.EventEnum.listCreated)
                            ss.then(function () {
                                //console.log("listCreated received");

                                // apparso ListManager
                                testHelper.htmlNodeByClassExists('autoChooseDataTag'); //'ui-dialog'
                                testHelper.htmlNodeByTagNotFilled('registry.idreg');
                                allCheckExecuted++;
                                //console.log("start stabilizing");
                                let s = stabilizeToCurrent(); //stabilizeToCurrent();
                                //console.log("cliking a row");
                                expect($("table").find("tr").length).toBeGreaterThan(2);
                                $("table:first").find("tr").eq(2).trigger("click");
                                //setTimeout(() => {
                                //    console.log("clicking on grid");
                                //    $("table:first").find("tr").eq(2).trigger("click");
                                //    },2000);

                                 // doppio click su una riga. dblclick
                                return s;
                            }).then(function () {
                                //console.log("stabilize done after click ");
                                let s = common.pageEventWaiter(metaPage, appMeta.EventEnum.listManagerHideControl);  
                                $("div.searchClose").first().click();                               
                                return s;
                            }).then(function () {
                                //console.log("close received");
                                testHelper.htmlNodeByClassNotExists('autoChooseDataTag');

                                //console.log($("#metaRoot").html())
                                // viene fatto il fill con la riga selezionata, nel doppio click
                                testHelper.htmlNodeByTagValueFilled('registry.idreg');
                                allCheckExecuted++;
                               
                                let s = stabilizeToCurrent();
                                common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                    .then(function () { //sezione (1)
                                        //console.log("showModalWindow received");
                                        // verifico che ci sia il messaggio. quindi ci siano più di 10 caratteri
                                        expect($(".modal-body").text().length).toBeGreaterThan(10);
                                        //console.log("modal button to click");
                                        expect($(".modal:visible").length).toBe(1);
                                        expect($(".modal:visible").find("button").length).toBe(1);
                                        //setTimeout(() => {
                                        //    console.log("clicking modal button ");
                                        //    $(".modal:visible").find("button")[0].click();
                                           
                                        //}, 2000);
                                        $(".modal:visible").find("button")[0].click();
                                        
                                        allCheckExecuted++;
                                    });

                                // premo bottone di "Info riga"
                                //console.log("Clicking showlast");
                                expect($("button[data-tag='showlast']").length).toBe(1);
                                testHelper.clickButtonByTag('showlast');
                                return s;
                            }).then(function () {
                                //console.log("stabilization DONE");
                                allCheckExecuted++;
                                var s = stabilize(true);
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                expect(allCheckExecuted).toBe(5);
                                done();
                            });

                         

                        });

                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica1", true);
                    
                });

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
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica1");

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            // N.B c'è il deferredResult della pagina ancora appeso quindi stabilizeToCurrent()
                            //let s = stabilizeToCurrent(1);

                            let s = testHelper.waitEvent(appMeta.EventEnum.commandEnd)


                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;
                        }).then(function () {
                            allCheckExecuted++;
                            // dopo la pressione di effettua ricerca il form è popolato
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');
                            // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            var s = stabilize(true);
                            testHelper.clickButtonByTag('mainclose');
                            return s;
                        }).then(function () {
                            expect(allCheckExecuted).toBe(2);
                            done();
                        });

                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica1", true);

                });

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
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica1");

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            allCheckExecuted++;
                            // N.B c'è il deferredResult della pagina ancora appeso quindi stabilizeToCurrent()
                            //var s = stabilizeToCurrent(1);
                            let s = testHelper.waitEvent(appMeta.EventEnum.commandEnd);
                            // premo bottone di "Effettua ricerca"
                            testHelper.clickButtonByTag('maindosearch');
                            return s;
                        }).then(function () {
                            allCheckExecuted++;
                            // dopo la pressione di effettua ricerca il form è popolato
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');

                            // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            var s = stabilize(true);
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
                    appMeta.currApp.callPage("registry", "anagrafica1", true);

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
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica1");

                            // risolvo deffered della pagina così non rimane appeso
                            // metaPage.deferredResult.resolve();

                            // esempio per verificare presenza di un elemento su html
                            testHelper.htmlNodeByTagExists('registry.idreg');
                            testHelper.htmlNodeByTagNotFilled('registry.idreg');
                            
                            // inserisco testo su id reg. Voglio ricercare idreg=1
                            testHelper.insertValueInputByTag('registry.idreg', "1");
                            testHelper.htmlNodeByTagValueFilled('registry.idreg');
                            allCheckExecuted++;
                            let s = testHelper.waitEvent(appMeta.EventEnum.commandEnd);
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
                            let s = testHelper.waitEvent(appMeta.EventEnum.commandEnd);
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
                            var s = stabilize(true); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
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
                    appMeta.currApp.callPage("registry", "anagrafica1", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. ' + "\n" +
                '2. Insert p_iva  in the textbox.' + "\n" +
                '3. Lost focus on text input -> modal list appears. ' + "\n" +
                '4. Do "dbclick" on a row -> list disappears and form controls filled.',
                function (done) {
                    // var ausiliaria per distinguere le varie configurazione sul file registry.anagrafica
                    appMeta.testCaseNumber = 6;
                    var allCheckExecuted = 0;
                    var pivaLength, mp;
                    // Evento di attesa pagina caricata
                    testHelper.waitEvent(appMeta.EventEnum.showPage)
                        .then(function (metaPage) {
                            //console.log("step 00");
                            mp = metaPage;
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica1");
                            // risolvo deffered della pagina così non rimane appeso
                            // metaPage.deferredResult.resolve();

                            // Dò il focus
                            testHelper.inputGotFocus('registry.p_iva');

                            // inserisco la parte iniziale della partita iva da cercare
                            testHelper.insertValueInputByTag('registry.p_iva', common.pIvatoSearch);
                            pivaLength = testHelper.getLengthValueByTag('registry.p_iva');
                            allCheckExecuted++;

                            // stabilizeToCurrent() poiché ho il deferredResult della pagina che è aperto, e chiuderò solo con il close


                            // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                            let s = common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                .then(function () {
                                    //console.log("choose appeared");
                                    //console.log(document.body.innerHTML);
                                    let nRows = $("table:first").find("tr").length;
                                    expect(nRows).toBeGreaterThan(0); // grid dati 11 righe. 1 header + 10 dati
                                    // griglia dati ospitata sulla modale
                                    expect($("table:first").parent().parent().parent().hasClass("modal-body")).toBe(true);

                                    testHelper.htmlNodeByTagNotFilled("registry.idreg");
                                    testHelper.htmlNodeByTagValueFilled("registry.p_iva");
                                    allCheckExecuted++;
                                    //let s = stabilizeToCurrent(4);
                                    let ss = appMeta.Deferred();

                                    appMeta.globalEventManager.subscribe(appMeta.EventEnum.ROW_SELECT,
                                        () => {
                                            //console.log("got ROW SELECT");
                                            //testHelper.log(" appMeta.EventEnum.ROW_SELECT")
                                            ss.resolve();
                                        }
                                    );
                                    appMeta.logger.setLogLevel(appMeta.logTypeEnum.INFO)
                                    $("table:first").find("tr").eq(2).dblclick();
                                    return ss.promise();
                                });
                            //.then(function(){
                            //     console.log(document.body.innerHTML);
                            //     let s = stabilizeToCurrent();
                            //     $("div.searchClose").first().click();
                            //     return s;
                            // });

                            // perdita di focus, deve scattare choose()

                            testHelper.inputLostFocus('registry.p_iva');
                            return s;

                        })
                        .then(function () {
                            //console.log("step2");
                            allCheckExecuted++;
                            // Nuovo valore scelto dalla lista aperta precedentemente. Campi popolati
                            testHelper.htmlNodeByTagValueFilled("registry.p_iva");
                            let pivaLengthNew = testHelper.getLengthValueByTag('registry.p_iva');
                            // è stata trovata e inserita una p_iva completa
                            expect(pivaLengthNew).toBeGreaterThan(pivaLength);
                            // la piva è quella con il prefisso di partenza
                            expect(testHelper.getValueByTag("registry.p_iva").indexOf(common.pIvatoSearch)).not.toBe("-1");

                            testHelper.htmlNodeByTagValueFilled("registry.idreg");

                            // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                            testHelper.insertValueInputByTag('registry.title', "nuovo");
                            //console.log("closing 2");
                            testHelper.clickButtonByTag('mainclose');
                            return stabilize();

                        }).then(function () {
                            //testHelper.log(" mainclose")
                            expect(allCheckExecuted).toBe(3);
                            done();
                        });


                    // Apro la pagina
                    appMeta.currApp.callPage("registry", "anagrafica1", true);

                },timeout);

        });
});