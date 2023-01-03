'use strict';

describe('App3_E2E', function() {
    var timeout  = 90000;
    let appMeta = window.appMeta;
    var testHelper = appMeta.testHelper;
    var common = appMeta.common;
    var stabilize = appMeta.stabilize;
    let Deferred = appMeta.Deferred;
    let q = window.jsDataQuery;
    // effettuo login


    describe("App Form Activation + Grid + Detail Page",
        function() {
            beforeEach(function(done) {
                testHelper.initAppTests('app3');
                appMeta.authManager.login(appMeta.configDev.userName, appMeta.configDev.password, new Date())
                .then(function (res) {
                    expect(res).toBe(true);
                    done();
                }, timeout);
            });

            function loadRegistry(idreg){
                //q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6),
                //                     q.eq('idreg',1040471))
                let def = Deferred();
                appMeta.testStartFilter = q.eq('idreg',idreg);
                testHelper.waitEvent(appMeta.EventEnum.showPage)
                    .then( (metaPage)=>{
                        testHelper.testMetaPageInitialization(metaPage, "registry", "anagrafica");
                        def.resolve(metaPage);
                    });
                appMeta.currApp.callPage("registry", "anagrafica", true);
                return def.promise();
            }

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. 2. Grid is filled' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var columExpectedLength = 9; // 6 + 3 per i bottoni ( 1.add+edit + 2.delete + 3.unlink)
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    loadRegistry(1)
                        .then(function(metaPage) {
                                allCheckExecuted++;

                                // Verifico la griglia abbia 2 righe. 1 + 1 header
                                expect($("#grid1").find("tr").length).toBe(2);
                                
                                // mi aspetto le 9 colonne che nella describeColumns del metaDato derivato sono le uniche rese visibili
                                // "cf", "ct", "cu" vengono le caption messe a stringa vuota nel metaDato server, quindi non visibili

                                expect($("#grid1").find("tr:first > th").length).toBe(columExpectedLength);
                                // Verifico che i nomi colonna siano quelli aspettati nel metaDato.
                                // Costruisco array di nomi, prendendo le text() dei tag th
                                var names = _.map($("#grid1").find("tr:first > th"), function (el) {
                                    return $(el).text();
                                });
                                // confronto con array visibleColumns del metaDato
                                //expect(_.difference(names,visibleColumns).length === 0).toBeTruthy();
                                expect(names.length).toBe(columExpectedLength);

                               // osservo se griglia è costruita bene. Con i bottoni dove me li aspetto

                               // expect($("#grid1").find("tr").eq(0).find("th > div > i").eq(0).hasClass( "fa-plus" )).toBeTruthy();
                                expect($("#grid1").find("tr").eq(1).find("td > div > i").eq(0).hasClass( "fa-edit" )).toBeTruthy();
                                expect($("#grid1").find("tr").eq(1).find("td > div > i").eq(1).hasClass( "fa-trash" )).toBeTruthy();
                                expect($("#grid1").find("tr").eq(1).find("td > div > i").eq(2).hasClass( "fa-unlink" )).toBeTruthy();


                                var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                testHelper.clickButtonByTag('mainclose');
                                return s;
                            }).then(function () {
                                allCheckExecuted++;
                                expect(allCheckExecuted).toBe(2);
                                done();
                             });

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected.' + "\n" +
                '4. Press Edit button -> Detail page is opened.' + "\n" +
                '5. Change one value, and press "mainsave" on bottom -> Returns to main page and the row has the new value edited' ,
                function(done) {
                    
                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 1;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    loadRegistry(1)
                        .then(function(metaPage) {
                            allCheckExecuted++;
                            // N.B NON risolvo deferred della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            expect($("#grid1").find("tr").length).toBe(2);

                            common.pageEventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                allCheckExecuted++;
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente

                                let idreg = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("input[data-tag='registry.idreg']").val()).toBe(idreg);

                                common.pageEventWaiter(metaPage, appMeta.EventEnum.editClick)
                                    .then(function () {
                                        allCheckExecuted++;
                                        expect($("#grid1").find("tr").eq(1).find("td").eq(gridColumnTested).text()).toBe(valueEdit);

                                        // la close mi risolve anche il deferredResult della pagina
                                        // quindi tutti i def risolti mi aspetto
                                        var s = stabilize();

                                        // Dopo il close attendo messaggio di warning. Premo ok
                                        common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
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

                                testHelper.waitEvent(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {
                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registryreference", "persone");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registryreference.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registryreference.idreg');
                                        expect($( "input[data-tag='registryreference.idreg']").val()).toBe("1");

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        valInit = $("input[data-tag='registryreference.referencename']").val();
                                        if (valInit.slice(-1) === "-") {
                                            valueEdit = valInit.substring(0, valInit.length - 1);
                                        }
                                        else{
                                            valueEdit = valInit + "-";
                                        }
                                        testHelper.insertValueInputByTag('registryreference.referencename', valueEdit);
                                        testHelper.insertValueInputByTag('registryreference.email', "aaa");
                                        
                                        allCheckExecuted++;
                                        // premo bottone di "MainSave" che effettua la propagate e torna al chiamante
                                        testHelper.clickButtonByTag('mainsave');
                                    });

                                // premo bottone di edit sulla cella. ricorda il bottone è dentro un div nel td. prendo il zero position perchè poi alla 2a c'è delete e terza unlink

                                $("#grid1").find("tr").eq(1).find("td > div").eq(0).click();
                                //testHelper.clickButtonByTag('edit.reference');
                            });

                            // premo su riga griglia
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

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
                    var gridRowTested  = 1;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;

                    // Evento di attesa pagina caricata
                    loadRegistry(1)
                        .then(function(metaPage) {
                            // N.B NON risolvo deferred della pagina così non rimane appeso, ma in questo test
                            //    verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 2 righe. 1 + 1 header
                            expect($("#grid1").find("tr").length).toBe(2);
                            allCheckExecuted++;
                            // attendo selezione riga
                            common.pageEventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                allCheckExecuted++;
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                let gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("input[data-tag='registry.idreg']").val()).toBe(gridCellValue);

                                common.pageEventWaiter(metaPage, appMeta.EventEnum.editClick)
                                    .then(function () {
                                        allCheckExecuted++;
                                        // cella del titolo
                                        expect($("#grid1").find("tr").eq(gridRowTested).find("td")
                                                .eq(gridColumnTested).text()).toBe(valueEdit);

                                        // la close mi risolve anche il deferredResult della pagina
                                        // quindi tutti i def risolti mi aspetto
                                        let s = stabilize();

                                        // serve per recuperare il template del form dei messaggi, altrimenti andrebbe in errore
                                        appMeta.basePath = 'base/';

                                        // prima del "commandEnd" attendo il form intermedio e successiva
                                        //    pressione del tasto "ignora e salva"
                                        common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                            .then(function () {
                                                //console.log(document.body.innerHTML)
                                                allCheckExecuted++;
                                                // attendo termine del comando "mainsave"
                                                common.pageEventWaiter(metaPage, appMeta.EventEnum.saveDataStop)
                                                    .then(function () {
                                                        allCheckExecuted++;
                                                        expect($("#grid1").find("tr").eq(gridRowTested).find("td")
                                                            .eq(gridColumnTested).text()).toBe(valueEdit);
                                                        //var s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                                        testHelper.clickButtonByTag('mainclose');
                                                        return s;
                                                    })
                                                    .then(function (){
                                                        allCheckExecuted++;
                                                        expect(allCheckExecuted).toBe(7);
                                                        done();
                                                    });

                                                // clicco su ignora e salva
                                                testHelper.clickButtonByCssClass('procedureMessage_btn_ignoreandsave');

                                            });
                                        // sto su main salvo mod a db
                                        testHelper.clickButtonByTag('mainsave');
                                    });

                                testHelper.waitEvent(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {
                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registryreference", "persone");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registryreference.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registryreference.idreg');

                                        // Cambio valore di un campo, cioè effettuo l'edit. N.B il title è colonna 8 sulla main grid
                                        valInit = $("input[data-tag='registryreference.referencename']").val();
                                        if (valInit.slice(-1) === "-"){
                                            valueEdit = valInit.substring(0, valInit.length - 1);
                                        }
                                        else{
                                            valueEdit = valInit + "-";
                                        }
                                        testHelper.insertValueInputByTag('registryreference.referencename', valueEdit);
                                        testHelper.insertValueInputByTag('registryreference.email', "aaa@gmail.com");

                                        allCheckExecuted++;
                                        // premo bottone di "MainSave" che effettua la propagate e torna al chiamante
                                        testHelper.clickButtonByTag('mainsave');
                                    });


                                // premo bottone di "Correggi" per andare in edit
                                $("#grid1").find("tr").eq(gridRowTested).find("td > div").eq(0).click();
                                //testHelper.clickButtonByTag('edit.reference');
                            });

                            // premo su riga griglia
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });

                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected.' + "\n" +
                '4. Press Edit button -> Detail page is opened. Changes a value' + "\n" +
                '5. Press "maindelete" -> Returns to main page and the row has the old value' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 1;
                    var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    loadRegistry(1)
                        .then(function(metaPage) {
                            allCheckExecuted++;
                            let s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto

                            // N.B NON risolvo deferred della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 2 righe. 1 + 1 header
                            expect($("#grid1").find("tr").length).toBe(2);

                            common.pageEventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                allCheckExecuted++;
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("input[data-tag='registry.idreg']").val()).toBe(gridCellValue);

                                common.pageEventWaiter(metaPage, appMeta.EventEnum.editClick)
                                    .then(function () {
                                        allCheckExecuted++;
                                        expect($("#grid1").find("tr").eq(gridRowTested).find("td").eq(gridColumnTested).text()).toBe(valInit);
                                        testHelper.clickButtonByTag('mainclose');
                                        return s;
                                    })
                                .then(function () {
                                    allCheckExecuted++;
                                    expect(allCheckExecuted).toBe(5);
                                    done();
                                });

                                testHelper.waitEvent(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {

                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail, "registryreference", "persone");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registryreference.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registryreference.idreg');
                                        expect($( "input[data-tag='registryreference.idreg']").val()).toBe("1");

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        valInit = $("input[data-tag='registryreference.referencename']").val();
                                        // ogni volta che lancio il test concateno "-" oppure lo tolgo, per evitare che la stringa ogni volta si ingrandisca, fino a provocare err di size del campo
                                        if (valInit.slice(-1) === "-"){
                                            valueEdit = valInit.substring(0, valInit.length - 1);
                                        }
                                        else{
                                            valueEdit = valInit + "-";
                                        }
                                        testHelper.insertValueInputByTag('registryreference.referencename', valueEdit);
                                        testHelper.insertValueInputByTag('registryreference.email', "aaa");

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



                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row.' + "\n" +
                '3. Form control are filled with the row selected.' + "\n" +
                '4. Press "Insert" button -> Detail page is opened.' + "\n" +
                '5. Edit value of title, and press "mainsave" on bottom -> Returns to main page and the grid has the new row with the new value edited' + "\n" +
                '6. Press "Mainsave" on main toolbar -> post is done.' + "\n" +
                '7. Business error form server are shown' + "\n" +
                '8. Press No_save modal error window closed',
                //'7. Select row just inserted on the grid' + "\n" +
                //'8. Press "Delete" button on grid -> MsgBox appears. Press ok to confirm -> row disappears on grid' + "\n" +
                //'9. Press "Mainsave" -> Row is deleted from db' ,
                function(done) {

                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 1;
                    var gridColumnTested  = 4;
                    var valueEdit,initGridLength;
                    var allCheckExecuted = 0;
                    // Evento di attesa pagina caricata
                    loadRegistry(1)
                        .then(function(metaPage) {
                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            // N.B NON risolvo deferred della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 5 righe. 4 + 1 header
                            initGridLength = $("#grid1").find("tr").length;
                            expect(initGridLength).toBe(2);

                            // se fossi in una situazione reale verrei da una ricerca, e poi modifica, qui invece sarei in cerca
                            //metaPage.state.setEditState();

                            allCheckExecuted++;
                            common.pageEventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("input[data-tag='registry.idreg']").val()).toBe(gridCellValue);
                                allCheckExecuted++;
                                let s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto


                                expect($( "input[data-tag='registry.idreg']").val()).toBe("1");

                                // Verifica che il grid abbia una riga in più e che abbia il valore nuovo
                                // L'insertClick scatta solo dopo il mainsave sul dettaglio
                                common.pageEventWaiter(metaPage, appMeta.EventEnum.insertClick)
                                    .then(function () {
                                        // sulla nuova riga, sarebbe l'ultima
                                        expect($("#grid1").find("tr:last").find("td").eq(gridColumnTested).text()).toBe(valueEdit);
                                        expect($("#grid1").find("tr").length).toBe(initGridLength + 1);

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registry.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registry.idreg');
                                        expect($( "input[data-tag='registry.idreg']").val()).toBe("1");
                                        // serve per recuperare il template del form dei messaggi, altrimenti andrebbe in errore
                                        appMeta.basePath = 'base/';

                                        allCheckExecuted++;
                                        // prima del "commandEnd" attendo il form intermedio successivo pressione
                                        //  del tasto "ignora e salva"
                                        common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                            .then(function () {
                                                expect($( "input[data-tag='registry.idreg']").val()).toBe("1");
                                                // verifico esattamente messaggio di warning
                                                expect($(".procedureMessage_grid")
                                                .find("tr:last > td:eq(2)").text())
                                                .toBe('controllo dummy');
                                                allCheckExecuted++;
                                                // attendo termine del comando "mainsave"
                                                common.pageEventWaiter(metaPage, appMeta.EventEnum.saveDataStop)
                                                    .then(function () {
                                                        expect($("#grid1").find("tr:last > td:eq("+gridColumnTested+")").text()).toBe(valueEdit);
                                                        allCheckExecuted++;
                                                        expect(allCheckExecuted).toBe(6);
                                                        //done();

                                                        // TODO ABILITARE quando  trovi un esempio di record che viene salvato, e quindi poi posso farne la delete
                                                        // attendo che venga selezionata
                                                        common.pageEventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                                            // verifico che la riga selezionata che andrò a cancellare sia effettivamente quella giusta
                                                            expect($("#grid1").find("tr:last").css('background-color')).toBe(appMeta.config.selectedRowColor);

                                                            expect($("#grid1").find("tr:last > td:eq("+gridColumnTested+")").text()).toBe(valueEdit);
                                                            allCheckExecuted++;
                                                            // message box di conferma
                                                            common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                                                .then(function () {
                                                                    // appare msgbox di conferma delete
                                                                    expect($(".modal").length).toBe(2);

                                                                    allCheckExecuted++;
                                                                    // mi metto in attesa delete lato client terminata
                                                                    common.pageEventWaiter(metaPage, appMeta.EventEnum.deleteClick).then(function () {
                                                                        // tornano le righe iniziali sulla griglia
                                                                        expect($("#grid1").find("tr").length).toBe(initGridLength);
                                                                        // sparisce msgbox conferma delete
                                                                        expect($(".modal").length).toBe(1);
                                                                        expect($(".modal")[0].id).toBe('modalLoader_control_id');
                                                                        allCheckExecuted++;
                                                                        // attendo termine del comando "mainsave"
                                                                        common.pageEventWaiter(metaPage, appMeta.EventEnum.saveDataStop).then(function () {
                                                                            // anche dopo il ritorno numero totale di righe è quello di partenza
                                                                            expect($("#grid1").find("tr").length).toBe(initGridLength);
                                                                            allCheckExecuted++;
                                                                            testHelper.clickButtonByTag('mainclose');
                                                                            return s;
                                                                        }).then(function () {
                                                                            allCheckExecuted++;
                                                                            expect(allCheckExecuted).toBe(11);
                                                                            done();
                                                                        });

                                                                        // sto su main salvo mod a db, ovvero cancello la riga appena inserita
                                                                        testHelper.clickButtonByTag('mainsave');
                                                                    });

                                                                    //premo tasto "ok" sulla messagebox per confermare la delete lato client
                                                                    $(".modal").find("button")[1].click();

                                                                });
                                                            // premo tasto delete sulla griglia
                                                            // for (let ii=0;ii<10;ii++){
                                                            //     console.log(ii, $("#grid1").find("tr").eq(2).find("td > div").eq(ii).html());
                                                            // }


                                                            expect($("#grid1").find("tr").eq(2).find("td > div").eq(1).html()).toContain("fa-trash");
                                                            $("#grid1").find("tr").eq(2).find("td > div").eq(1).click();

                                                        });
                                                        // premo su riga griglia appena inserita per selezionarla e successivamente farne la delete

                                                        $("#grid1").find("tr:last").click();

                                                    });

                                                // clicco su ignora e salva
                                                testHelper.clickButtonByCssClass('procedureMessage_btn_ignoreandsave');

                                            });

                                        // sto su main salvo mod a db, cioè inserisco nuova riga
                                        testHelper.clickButtonByTag('mainsave');

                                    });

                                testHelper.waitEvent(appMeta.EventEnum.showPage)
                                    .then(function (metaPageDetail) {
                                        // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                        testHelper.testMetaPageInitialization(metaPageDetail,
                                                "registryreference", "persone");

                                        // Verifico presenza di un elemento su html
                                        testHelper.htmlNodeByTagExists('registryreference.idreg');
                                        testHelper.htmlNodeByTagValueFilled('registryreference.idreg');
                                        expect($( "input[data-tag='registryreference.idreg']").val()).toBe("1");

                                        testHelper.htmlNodeByTagExists('registryreference.idregistryreference');
                                        testHelper.htmlNodeByTagValueFilled('registryreference.idregistryreference');
                                        expect($( "input[data-tag='registryreference.idregistryreference']").val()).toBe("2");

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        valueEdit = "Title TestAppe2e";
                                        testHelper.insertValueInputByTag('registryreference.referencename', valueEdit);

                                        // cambio valore di un campo, cioè effettuo l'edit
                                        testHelper.insertValueInputByTag('registryreference.email', "nuovamail@gmail.com");
                                        expect($( "input[data-tag='registryreference.email']").val()).toBe("nuovamail@gmail.com");

                                        allCheckExecuted++;
                                        // premo bottone di "MainSave" che effettua la propagate e torna al chiamante
                                        testHelper.clickButtonByTag('mainsave');
                                    });


                                // premo bottone di "Inserisci" per aggiungere la riga
                                //bottone di insert, prima vengono i sort di idreg annotation forename lu p_iva title
                                // for (let ii=0;ii<10;ii++){
                                //     console.log(ii+":"+ $("#grid1").find("tr").eq(0).find("th > div").eq(ii).html());
                                // }
                                //
                                expect($("#grid1").find("tr").eq(0).find("th > div").eq(6).html()).toContain("fa-plus-square");
                                $("#grid1").find("tr").eq(0).find("th > div").eq(6).click();
                                //testHelper.clickButtonByTag('insert.reference');
                            });

                            // premo su riga griglia per selezionarne una
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });



                }, timeout);

            it('1. callPage() table:registry, editType:anagrafica" should be async and return data. -> Grid is filled' + "\n" +
                '2. Click on a row. ' + "\n" +
                '3. Form control are filled with the row selected' + "\n" +
                '4. Press "Insert and copy" button -> press ok in msgbox confirm -> Detail page is opened.' + "\n" +
                '5. Press mainsave on detail -> it returns to the caller and does the insert to the db -> messageError is shown' ,
                function(done) {
                    appMeta.testCaseNumber  = 1;
                    var gridRowTested  = 1;
                    //var gridColumnTested  = 4;
                    var valInit,valueEdit;
                    var allCheckExecuted = 0;
                    //let s = stabilize();

                    // Evento di attesa pagina caricata
                    loadRegistry(1)
                        .then(function(metaPage) {

                            // N.B NON risolvo deferred della pagina così non rimane appeso, ma in questo test verrà risolto dal mainsave sul dettaglio
                            // metaPage.deferredResult.resolve();
                            // verifico la griglia abbia 2 righe. 1 + 1 header
                            expect($("#grid1").find("tr").length).toBe(2);
                            allCheckExecuted++;

                            // se fossi in una situazione relae verrei da una ricerca, e poi modifica, qui invece sarei in cerca
                            //metaPage.state.setEditState();
                            
                            // attendo selezione riga
                            common.pageEventWaiter(metaPage, appMeta.EventEnum.ROW_SELECT).then(function () {
                                // il valore della prima cella, cioè idreg, viene messo sulla label corrispondente
                                var gridCellValue = $("#grid1").find("tr").eq(gridRowTested).find("td").eq(0).text();
                                expect($("input[data-tag='registry.idreg']").val()).toBe(gridCellValue);
                                allCheckExecuted++;
                                // attendo messagebox di conferma
                                common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                    .then(function () {
                                        console.log("appare msgbox di conferma insertcopy");
                                        // appare msgbox di conferma insertcopy
                                        //E' stato premuto il tasto inserisci copia.
                                        //  Si desidera davvero creare una copia dei dati già salvati?
                                        expect($(".modal").length).toBe(2);
                                        allCheckExecuted++;

                                       // tenta di fare la insert a db ma prende errore, rimango in attesa del form degli errori
                                        common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                            .then(function () {
                                                console.log("tenta di fare la insert a db ma prende errore, rimango in attesa del form degli errori");
                                                allCheckExecuted++;
                                                // verifico esattamente messaggio di errore
                                                expect($(".procedureMessage_grid").length).toBe(1);
                                                let def = Deferred();

                                                //let s = stabilize(); // la close mi risolve anche il deferredResult della pagina quindi tutti i def risolti mi aspetto
                                                //appMeta.logger.setLogLevel(appMeta.logTypeEnum.INFO);
                                                //console.log(document.body)

                                                //Dopo aver premuto "non salvare" sulle regole facciamo maindelete
                                                common.pageEventWaiter(metaPage, appMeta.EventEnum.saveDataStop)
                                                .then(function () {
                                                    console.log("saveDataStop");
                                                    expect(metaPage.state.DS.tables.registry.rows[0].idreg).toBe(
                                                        metaPage.state.DS.tables.registryaddress.rows[0].idreg
                                                    );

                                                    common.pageEventWaiter(metaPage, appMeta.EventEnum.showModalWindow)
                                                    .then(function () {
                                                        console.log("showModalWindow 634");
                                                        expect(metaPage.state.DS.tables.registry.rows[0].idreg).toBe(
                                                            metaPage.state.DS.tables.registryaddress.rows[0].idreg
                                                        );


                                                        testHelper.waitEvent(appMeta.EventEnum.commandEnd).
                                                         then(()=>{
                                                            def.resolve(metaPage);
                                                        });
                                                        // for(let ii=0;ii<10;ii++){
                                                        //     console.log(ii,$(".modal").find("button").eq(ii).html());
                                                        // }
                                                        expect($(".modal").find("button").eq(1).html()).toBe("Ok")
                                                        expect($(".modal").find("button").eq(2).html()).toBe("Annulla")
                                                        appMeta.logger.setLogLevel(appMeta.logTypeEnum.INFO);
                                                        $(".modal").find("button").eq(1).click();
                                                    });
                                                    testHelper.clickButtonByTag('maindelete');
                                                })
                                                testHelper.clickButtonByCssClass('procedureMessage_btn_nosave');
                                                return def.promise();
                                            })
                                            .then(function (metaPage) {
                                                expect(metaPage.state.DS.tables.registry.rows.length).toBe(0);

                                                allCheckExecuted++;
                                                expect(allCheckExecuted).toBe(6);
                                                let s = testHelper.waitEvent(appMeta.EventEnum.commandEnd);
                                                //testHelper.clickButtonByCssClass('procedureMessage_btn_nosave');
                                                testHelper.clickButtonByTag('mainclose');
                                                return s;
                                            })
                                            .then(function (){
                                                allCheckExecuted++;
                                                expect(allCheckExecuted).toBe(7);
                                                done();
                                        });


                                        //dopo la conferma del maininsertcopy premi "mainsave"
                                        testHelper.waitEvent(appMeta.EventEnum.commandEnd).
                                            then(function (metaPageDetail) {
                                                console.log("commandEnd 676");
                                                // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                                                testHelper.testMetaPageInitialization(metaPageDetail,
                                                        "registry", "anagrafica");

                                                // Verifico presenza di un elemento su html
                                                testHelper.htmlNodeByTagExists('registry.idreg');
                                                testHelper.htmlNodeByTagValueFilled('registry.idreg');
                                                expect($( "input[data-tag='registry.idreg']").val()).toBe("990001");

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
                                                // premo bottone di "MainSave"
                                                testHelper.clickButtonByTag('mainsave');
                                            });


                                        //premo tasto "ok" sulla messagebox per confermare l'operazione di insertcopy
                                        expect($(".modal").find("button").eq(1).html()).toBe("Conferma");
                                        $(".modal").find("button").eq(1).click();

                                    });

                                // premo bottone inserisci copia >>OK
                                testHelper.clickButtonByTag('maininsertcopy');
                            });

                            // premo su riga griglia  >>OK
                            $("#grid1").find("tr").eq(gridRowTested).click();

                        });


                }, timeout);

        });
});