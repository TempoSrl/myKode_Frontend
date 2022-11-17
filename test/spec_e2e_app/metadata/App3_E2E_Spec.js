'use strict';

describe('App3_E2E', function() {
    var timeout  = 90000;
    var testHelper = appMeta.testHelper;
    var common = appMeta.common;
    var stabilize = appMeta.stabilize;
    var stabilizeToCurrent = appMeta.stabilizeToCurrent;
    // effettuo login
    beforeAll(function (done) {
        appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password).then(function (res) {
            expect(res).toBe(true);
            done();
        }, timeout)
    });

    describe("App Form Activation + Grid + Detail Page",
        function() {

            beforeEach(function() {
                testHelper.initAppTests('app3');
           
            });

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. 2. Grid is filled' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var columExpectedLength = 8; // 5 + 3 per i bottoni ( 1.add+edit + 2.delete + 3.unlink)
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                                allCheckExecuted++;
                                // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                                testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                                // risolvo deffered della pagina così non rimane appeso
                                //metaPage.deferredResult.resolve();
                                // verifico la griglia abbia 5 righe. 4 + 1 header
                                expect($("#grid1").find("tr").length).toBe(5);
                                
                                // mi aspetto le 9 colonne che nella describecolumsn del metaDato derivato sono le uniche rese visibili
                                expect($("#grid1").find("tr:first > th").length).toBe(columExpectedLength); // "cf", "ct", "cu" vengono le caption messe a stringa vuota nel metaDato server, quindi non visibili
                                // verifico che i nomi colonan siano quelli aspettati nel metaDato.
                                // costrusci array di nomi, prendendo le text() dei tag th
                                var names = _.map($("#grid1").find("tr:first > th"), function (el) {
                                    return $(el).text();
                                });
                                // confronto con array visibleColumns del metaDato
                                //expect(_.difference(names,visibleColumns).length === 0).toBeTruthy();
                                expect(names.length).toBe(columExpectedLength);

                               // osservo se griglia è costruita bene. co i bottoni dove me li sapetto

                               // expect($("#grid1").find("tr").eq(0).find("th > div > i").eq(0).hasClass( "fa-plus" )).toBeTruthy();
                                expect($("#grid1").find("tr").eq(2).find("td > div > i").eq(0).hasClass( "fa-edit" )).toBeTruthy();
                                expect($("#grid1").find("tr").eq(2).find("td > div > i").eq(1).hasClass( "fa-trash" )).toBeTruthy();
                                expect($("#grid1").find("tr").eq(2).find("td > div > i").eq(2).hasClass( "fa-unlink" )).toBeTruthy();
                               
                                var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                allCheckExecuted++;
                                expect(allCheckExecuted).toBe(2);
                                done();
                             });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected.' + "\n" +
                '4. Press Edit button -> Detail page is opened.' + "\n" +
                '5. Change one value, and press "mainsave" on bottom -> Returns to main page and the row has the new value edited' ,
                function(done) {
                    
                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 4;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            allCheckExecuted++;
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // N.B NON risolvo deffered della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            expect($("#grid1").find("tr").length).toBe(5);

                            common.eventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                allCheckExecuted++;
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("label[data-tag='registry.idreg']").text()).toBe(gridCellValue);

                                common.eventWaiter(metaPage, appMeta.EventEnum.editClick)
                                    .then(function () {
                                        allCheckExecuted++;
                                        expect($("#grid1").find("tr").eq(4).find("td").eq(gridColumnTested).text()).toBe(valueEdit); 
                                       
                                        var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto

                                        // dopo il close attendo messaggio di warning . premo ok
                                        common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                                            allCheckExecuted++;
                                            $(".modal").find("button")[1].click();
                                        });
                                        testHelper.clickButtonByTag('mainclose');
                                        return s;
                                    }).then(function () {
                                        allCheckExecuted++;
                                        expect(allCheckExecuted).toBe(6);
                                        done();
                                    });

                                testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {
                                       
                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registry", "reference");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registry.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registry.idreg');

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        valInit = $("input[data-tag='registry.title']").val();
                                        if (valInit.slice(-1) === "-"){
                                            valueEdit = valInit.substring(0, valInit.length - 1);
                                        }else{
                                            valueEdit = valInit + "-";
                                        }
                                        testHelper.insertValueInputByTag('registry.title', valueEdit);
                                        
                                        allCheckExecuted++;
                                        // premo bottone di "MainSave" che effettua la propaagte e torna al chiamante
                                        testHelper.clickButtonByTag('mainsave');

                                    });


                                // premo bottone di edit sulla cella. ricroda il bottone è dentro un div nel td. prendo il zero position perchè poi alla 2a c'è delete e terza unlink
                                $("#grid1").find("tr").eq(4).find("td > div").eq(0).click();
                                //testHelper.clickButtonByTag('edit.reference');
                            });

                            // premo su riga griglia
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected' + "\n" +
                '4. Press "Edit" button -> Detail page is opened.' + "\n" +
                '5. Change one value, and press "mainsave" -> Returns to main page and the row has new value edited' + "\n" +
                '6. Press "Mainsave" on main toolbar -> "Error list" with an ignorable message is shown' + "\n" +
                '7. Press "Save and ignore" -> post is done.' ,    
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 4;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // N.B NON risolvo deffered della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            expect($("#grid1").find("tr").length).toBe(5);
                            allCheckExecuted++;
                            // attendo selezione riga
                            common.eventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                allCheckExecuted++;
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("label[data-tag='registry.idreg']").text()).toBe(gridCellValue);

                                common.eventWaiter(metaPage, appMeta.EventEnum.editClick)
                                    .then(function () {
                                        allCheckExecuted++;
                                        // cella del titolo
                                        expect($("#grid1").find("tr").eq(gridRowTested).find("td").eq(gridColumnTested).text()).toBe(valueEdit);

                                        // serve per recuperare il template del form dei messaggi, altrimenti andrebbe in errore
                                        appMeta.basePath = 'base/';
                                        // prima del "buttonClickEnd" attendo il form intemredioe  successiva pressione del tasto "ignora e salva"
                                        common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                            .then(function () {
                                                allCheckExecuted++
                                                // attendo termine del comando "mainsave"
                                                common.eventWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                    .then(function () {
                                                        allCheckExecuted++;
                                                        expect($("#grid1").find("tr").eq(gridRowTested).find("td").eq(gridColumnTested).text()).toBe(valueEdit);
                                                        expect(allCheckExecuted).toBe(6);
                                                        done();
                                                    });
                                                // clicco su ignora  esalva
                                                testHelper.clickButtonByCssClass('procedureMessage_btn_nosave');

                                            });
                                        // sto su main salvo mod a db
                                        testHelper.clickButtonByTag('mainsave');
                                    });

                                testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {
                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registry", "reference");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registry.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registry.idreg');

                                        // cambio valore di un campo, cioè effettuo l'edit. N.B il title è colonna 8 sulla main grid
                                        valInit = $("input[data-tag='registry.title']").val();
                                        if (valInit.slice(-1) === "-"){
                                            valueEdit = valInit.substring(0, valInit.length - 1);
                                        }else{
                                            valueEdit = valInit + "-";
                                        }
                                        testHelper.insertValueInputByTag('registry.title', valueEdit);

                                        allCheckExecuted++;
                                        // premo bottone di "MainSave" che effettua la propaagte e torna al chiamante
                                        testHelper.clickButtonByTag('mainsave');

                                    });


                                // premo bottone di "Correggi" per andare in edit
                                $("#grid1").find("tr").eq(gridRowTested).find("td > div").eq(0).click();
                                //testHelper.clickButtonByTag('edit.reference');
                            });

                            // premo su riga griglia
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected.' + "\n" +
                '4. Press Edit button -> Detail page is opened. Changes a value' + "\n" +
                '5. Press "maindelete" -> Returns to main page and the row has the old value' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 4;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            allCheckExecuted++;
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // N.B NON risolvo deffered della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            expect($("#grid1").find("tr").length).toBe(5);

                            common.eventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                allCheckExecuted++;
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("label[data-tag='registry.idreg']").text()).toBe(gridCellValue);

                                common.eventWaiter(metaPage, appMeta.EventEnum.editClick)
                                    .then(function () {
                                        allCheckExecuted++;
                                        expect($("#grid1").find("tr").eq(4).find("td").eq(gridColumnTested).text()).toBe(valInit);
                                        expect(allCheckExecuted).toBe(4);
                                        done();
                                    });

                                testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {

                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registry", "reference");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registry.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registry.idreg');

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        valInit = $("input[data-tag='registry.title']").val();
                                        // ogni volta che lancio il test concateno "-" oppure lo tolgo, per evitare che la stringa ogni volta si ingrandisca, fino a provocare err di size del campo
                                        if (valInit.slice(-1) === "-"){
                                            valueEdit = valInit.substring(0, valInit.length - 1);
                                        }else{
                                            valueEdit = valInit + "-";
                                        }

                                        testHelper.insertValueInputByTag('registry.title', valueEdit);

                                        allCheckExecuted++;
                                        // sul dettaglio il "chiudi è disabilitato"
                                        expect($("button[data-tag='mainclose']").is(":visible")).toBeFalsy();
                                        // premo bottone di "maindelete" ovvero annullo l'operazione
                                        testHelper.clickButtonByTag('maindelete');

                                    });


                                // premo bottone di "Correggi" per andare in edit
                                $("#grid1").find("tr").eq(gridRowTested).find("td > div").eq(0).click();
                                //testHelper.clickButtonByTag('edit.reference');
                            });

                            // premo su riga griglia
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row.' + "\n" +
                '3. Form control are filled with the row selected.' + "\n" +
                '4. Press "Insert" button -> Detail page is opened.' + "\n" +
                '5. Edit value of title, and press "mainsave" on bottom -> Returns to main page and the grid has the new row with the new value edited' + "\n" +
                '6. Press "Mainsave" on main toolbar -> post is done.' + "\n" +
                '7. Business error form server are shown' + "\n" +
                '7. Press No_save modal error window closed',
                // TODO prox punti trovare un caso per cui funzioni la insert senza messaggi bloccanti, così poi posso farne la delete   
                //'7. Select row just inserted on the grid' + "\n" +
                //'8. Press "Delete" button on grid -> MsgBox appears. Press ok to confirm -> row disappears on grid' + "\n" +
                //'9. Press "Mainsave" -> Row is deleted from db' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 4;
                    var gridColumnTested  = 26;
                    var valueEdit,initGridLength;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            // TEST GENRICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // N.B NON risolvo deffered della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            initGridLength = $("#grid1").find("tr").length;
                            expect(initGridLength).toBe(5);

                            // se fossi in una situazione relae verrei da una ricerca, e poi modifica, qui invece sarei in cerca
                            metaPage.state.setEditState();

                            allCheckExecuted++;
                            common.eventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {

                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("label[data-tag='registry.idreg']").text()).toBe(gridCellValue);
                                allCheckExecuted++;
                                // in attesa evento inserimento
                                common.eventWaiter(metaPage, appMeta.EventEnum.insertClick)
                                    .then(function () {
                                        // sulla nuova riga, sarebbe l'ultima
                                        expect($("#grid1").find("tr:last").find("td").eq(gridColumnTested).text()).toBe(valueEdit);
                                        expect($("#grid1").find("tr").length).toBe(initGridLength + 1);
                                        // serve per recuperare il template del form dei messaggi, altrimenti andrebbe in errore
                                        appMeta.basePath = 'base/';


                                        allCheckExecuted++;
                                        // prima del "buttonClickEnd" attendo il form intemredioe  successiva pressione del tasto "ignora e salva"
                                        common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                            .then(function () {
                                                // verifico esattamente messaggio di warning
                                                expect($(".procedureMessage_grid").find("tr:last > td:eq(2)").text()).toBe('field: idregistryclass  err: Attenzione! Selezionare la Tipologia.');
                                                allCheckExecuted++;
                                                // attendo termine del comando "mainsave"
                                                common.eventWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                    .then(function () {

                                                        expect($("#grid1").find("tr:last > td:eq("+gridColumnTested+")").text()).toBe(valueEdit);
                                                        allCheckExecuted++;
                                                        expect(allCheckExecuted).toBe(6);
                                                        done();

                                                        // TODO ABILITARE quando  trovi un esempio di record che viene salvato, e quindi poi posso farne la delete
                                                        // attendo che venga selezionata
                                                        /* common.eventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                                            // verifico che la riga selezionata che andrò a cancellar esia effettivamente quella giusta
                                                            expect($("#grid1").find("tr:last").hasClass("active")).toBe(true);
                                                            expect($("#grid1").find("tr:last > td:eq("+gridColumnTested+")").text()).toBe(valueEdit);
                                                            allCheckExecuted++;
                                                            // meassage box di conferma
                                                            common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                                                .then(function () {
                                                                    // appare msgbox di conferma delete
                                                                    expect($(".modal").length).toBe(1);
                                                                    allCheckExecuted++;
                                                                    // mi metto in attesa delete lato client terminata
                                                                    common.eventWaiter(metaPage, appMeta.EventEnum.deleteClick).then(function () {
                                                                        // tornano le righe iniziali sulla griglia
                                                                        expect($("#grid1").find("tr").length).toBe(initGridLength);
                                                                        // sparisce msgbox conferma delete
                                                                        expect($(".modal").length).toBe(0);
                                                                        allCheckExecuted++;
                                                                        // attendo termine del comando "mainsave"
                                                                        common.eventWaiter(metaPage, appMeta.EventEnum.buttonClickEnd).then(function () {
                                                                            // anche dopo il ritorno numero totale di righe è quello di partenza
                                                                            expect($("#grid1").find("tr").length).toBe(initGridLength);
                                                                            allCheckExecuted++;
                                                                            expect(allCheckExecuted).toBe(10);
                                                                            done();
                                                                        });

                                                                        // sto su main salvo mod a db, ovvero cancello la riga appena inserita
                                                                        testHelper.clickButtonByTag('mainsave');
                                                                    });

                                                                    //premo tasto "ok" sulla mesagebox per confemrare la delete lato client
                                                                    $(".modal").find("button")[1].click();

                                                                });
                                                            // premo tast delete sulla griglia
                                                            testHelper.clickButtonByTag('delete');
                                                        });

                                                        // premo su riga griglia appena inserita per selzionarla e successivamente farne la delete
                                                        $("#grid1").find("tr:last").click();*/

                                                    });

                                                // clicco su ignora  esalva
                                                testHelper.clickButtonByCssClass('procedureMessage_btn_nosave');

                                            });

                                        // sto su main salvo mod a db, cioè inserisco nuova riga
                                        testHelper.clickButtonByTag('mainsave');

                                    });

                                testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {
                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registry", "reference");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registry.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registry.idreg');

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        valueEdit = "Title TestAppe2e";
                                        testHelper.insertValueInputByTag('registry.title', valueEdit);

                                        allCheckExecuted++;
                                        // premo bottone di "MainSave" che effettua la propaagte e torna al chiamante
                                        testHelper.clickButtonByTag('mainsave');

                                    });


                                // premo bottone di "Inserisci" per aggiungere la riga
                                $("#grid1").find("tr").eq(0).find("th > div").eq(0).click();
                                //testHelper.clickButtonByTag('insert.reference');
                            });

                            // premo su riga griglia per selezionarne una
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected' + "\n" +
                '4. Press "Insert and copy" button -> press ok in msgbox confirm -> Detail page is opened.' + "\n" +
                '5. Press mainsave on detail -> it returns to the caller and does the insert to the db -> messageError is shown' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 4;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function(metaPage) {
                            // TEST GENERICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                            testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                            // N.B NON risolvo deffered della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            expect($("#grid1").find("tr").length).toBe(5);
                            allCheckExecuted++;

                            // se fossi in una situazione relae verrei da una ricerca, e poi modifica, qui invece sarei in cerca
                            metaPage.state.setEditState();
                            
                            // attendo selezione riga
                            common.eventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {

                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("label[data-tag='registry.idreg']").text()).toBe(gridCellValue);
                                allCheckExecuted++;
                                // attendo messagebox di conferma
                                common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                    .then(function () {

                                        // appare msgbox di conferma insertcopy
                                        expect($(".modal").length).toBe(1);
                                        allCheckExecuted++;

                                        // tenta di fare la insert a db ma prende errore, rimanfgo in attesa della form degli errori
                                        common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                            .then(function () {
                                                allCheckExecuted++;
                                                // verifico esattamente messaggio di errore
                                                expect($(".procedureMessage_grid").length).toBe(1);
                                                expect(allCheckExecuted).toBe(5);
                                                done();
                                            });

                                        testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                            .then(function (metaPageDetail) {
                                                // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                                testHelper.testMetaPageInitialization(metaPageDetail, "registry", "reference");

                                                // Verifico presenza di un elemento su html
                                                testHelper.htmlNodeByTagExists('registry.idreg');
                                                testHelper.htmlNodeByTagValueFilled('registry.idreg');

                                                // cambio valore di un campo, cioè effettuo l'edit. N.B il title è colonna 8 sulla main grid
                                                valInit = $("input[data-tag='registry.title']").val();
                                                if (valInit.slice(-1) === "-"){
                                                    valueEdit = valInit.substring(0, valInit.length - 1);
                                                }else{
                                                    valueEdit = valInit + "-";
                                                }
                                                testHelper.insertValueInputByTag('registry.title', valueEdit);

                                                // serve per recuperare il template del form dei messaggi, altrimenti andrebbe in errore
                                                appMeta.basePath = 'base/';
                                                allCheckExecuted++;
                                                // premo bottone di "MainSave" che effettua la propagate e torna al chiamante
                                                testHelper.clickButtonByTag('mainsave');

                                            });


                                        //premo tasto "ok" sulla mesagebox per confemrare la delete lato client
                                        $(".modal").find("button")[1].click();

                                    });

                                // premo bottone di "Correggi" per andare in edit
                                testHelper.clickButtonByTag('maininsertcopy');
                            });

                            // premo su riga griglia
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

                    // Apro la pagina
                    appMeta.callPage("registry", "anagrafica", true);

                }, timeout);

        });
});