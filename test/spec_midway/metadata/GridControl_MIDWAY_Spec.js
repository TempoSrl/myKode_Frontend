"use strict";

describe("GridControl",
    function () {
        var MetaPage = appMeta.MetaPage;
        var BootstrapModal = appMeta.BootstrapModal;
        var HelpForm = appMeta.HelpForm;
        var stabilize = appMeta.stabilize;
        var common = appMeta.common;
        var localResource = appMeta.localResource;
        var state;
        var helpForm;
        var ds;
        var t1, t2;
        var objrow1, objrow2, objrow3, objrow4, objrow5, objrow6, objrow7 ;
        var grid,grid2, gridt1;
        var metapage;
        var origDoGet; // mock funz doGet
      
        // invoca la getToolBarManager per instanziare la toolbar, che poi sarà richiamata nei vari freshForm
        beforeAll(function () {
            appMeta.basePath = "base/";
            appMeta.initToolBarManager();
          
        });
        
        beforeEach(function () {
            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";
            // nomi colonne
            var cName = "c_name";
            var cDec = "c_dec";
            var cDouble = "c_double";

            // costrusico ogetto stato e ds
            state = new appMeta.MetaPageState();
            ds = new jsDataSet.DataSet("temp");
            t1 = ds.newTable("table1");
            t2 = ds.newTable("table2");
            // setto le prop delle colonne per t1
            t1.setDataColumn(cName, "String");
            t1.setDataColumn(cDec, "Decimal");
            t1.setDataColumn(cDouble, "Double");

            t2.setDataColumn("notcol", "String");
            t2.setDataColumn("mycol1", "Decimal");
            t2.setDataColumn("mycol2", "String");
            t2.setDataColumn("mycol3", "DateTime");
            t2.setDataColumn("mycol4", "String");
            t2.columns["notcol"].caption = ".notcol";
            t2.columns["mycol1"].caption = "mycol1";
            t2.columns["mycol2"].caption = "mycol2";
            t2.columns["mycol3"].caption = "mycol3";
            t2.columns["mycol4"].caption = "mycol4";
            t2.columns["mycol1"].listColPos = 2;
            t2.columns["mycol2"].listColPos = 1;
            t2.columns["mycol4"].listColPos = -1;

            // aggiungo 2 righe alla t2
            objrow1 = {notcol: "not11", mycol1: 22, mycol2: "v11", mycol3:new Date("1980-10-02"), mycol4:"v14"};
            objrow2 = {notcol: "not22", mycol1: 11, mycol2: "v22", mycol3:new Date("1981-10-02"), mycol4:"v24"};
            objrow3 = {notcol: "not33", mycol1: 33, mycol2: "v33", mycol3:new Date("1982-10-02"), mycol4:"vsame"};
            objrow4 = {notcol: "not44", mycol1: 44, mycol2: "v44", mycol3:new Date("1983-10-02"), mycol4:"vsame"};
            objrow5 = {notcol: "not55", mycol1: 55, mycol2: "v55", mycol3:new Date("1984-10-02"), mycol4:"vsame"};
            objrow1 = t2.add(objrow1).current;
            objrow2 = t2.add(objrow2).current;
            objrow3 = t2.add(objrow3).current;
            objrow5 = t2.add(objrow5).current;
            objrow4 = t2.add(objrow4).current;
            t2.acceptChanges();

            objrow6 = {cName: "name11", cDec: 1, cDouble: 111};
            objrow7 = {cName: "name22", cDec: 2, cDouble: 222};
            objrow6 = t1.add(objrow6).current;
            objrow7 = t1.add(objrow7).current;
            t1.acceptChanges();
            state.DS = ds;
            state.meta  = new appMeta.MetaData('table1');

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function() {
                return new $.Deferred().resolve();
            };
            
            // inizializzo metapage, usata in AddEvents
            metapage = new MetaPage('table2', 'def', true);
            metapage.state = state;
            
            // inizializzo la form
            helpForm = new HelpForm(state, "table1", "#rootelement");
            metapage.helpForm  = helpForm;
            var mainwin = '<div id="rootelement">' +
                '<div id="grid1" data-tag="table2.default" data-custom-control="grid" data-mdlbuttoninsert></div>' +
                '<div id="gridt1" data-tag="table1.default" data-custom-control="grid"></div>' +
                '<div id="grid2" data-tag="table2.listtype.edittype" data-custom-control="grid"></div>' +
                '</div>';
            $("html").html(mainwin);
            helpForm.preScanControls();
            grid = $("#grid1").data("customController");
            grid2 = $("#grid2").data("customController");
            gridt1 = $("#gridt1").data("customController");

            origDoGet =  appMeta.getData.doGet;
            appMeta.getData.doGet = function () {
                return new $.Deferred().resolve().promise();
            }
        });
        
        afterEach(function () {
            appMeta.getData.doGet = origDoGet;
        });
        
        afterAll(function () {
            appMeta.basePath = "/";
        });
        
        describe("methods work",
            function () {
                
                it("shows modal, because on click there are changes", function (done) {
                    // costrusico ogetto stato e ds
                    var state1 = new appMeta.MetaPageState();
                    var state2 = new appMeta.MetaPageState();
                    var ds1 = new jsDataSet.DataSet("temp1");
                    var ds2 = new jsDataSet.DataSet("temp2");
                    var t1Ds1 = ds1.newTable("table1");
                    var t2Ds2 = ds2.newTable("table2");

                    // setto le prop delle colonne per t1
                    t1Ds1.setDataColumn("key", "String");
                    t1Ds1.setDataColumn("field1", "String");

                    t2Ds2.setDataColumn("key", "String");
                    t2Ds2.setDataColumn("field1", "String");

                    t1Ds1.columns["key"].caption = "key_1";
                    t1Ds1.columns["field1"].caption = "field_1";
                    t2Ds2.columns["key"].caption = "key_2";
                    t2Ds2.columns["field1"].caption = "field_2";

                    //
                    var r1 = {key: "key1", field1: "f1"};
                    var r2 = {key: "key2", field1: "f2"};
                    r1 = t1Ds1.add(r1).current;
                    r2 = t1Ds1.add(r2).current;

                    var r3 = {key: "key1", field1: "f3"};
                    var r4 = {key: "key2", field1: "f2"};
                    r3 = t2Ds2.add(r3).current;
                    r4 = t2Ds2.add(r4).current;

                    // imposto la chiave
                    t1Ds1.key("key");
                    t2Ds2.key("key");
                    state1.DS = ds1;
                    state1.editedRow = r1.getRow();

                    state2.DS = ds2;
                    state2.callerState = state1;
                    state2.setInsertState();
                    state2.currentRow = r3;

                    // inizializzo metapage, usata in AddEvents

                    var  metapage2 = new MetaPage('table2', 'def', true);
                    metapage2.state = state2;
                    state2.meta  = new appMeta.MetaData('table2');
                    // inizializzo la form
                    var helpForm2 = new HelpForm(state2, "table2", "#rootelement");
                    metapage2.helpForm  = helpForm2;
                    var mainwin = '<div id="rootelement"><div id="grid1" data-tag="table2.default" data-custom-control="grid"></div></div>';
                    $("html").html(mainwin);
                    // aggiungo stili, così a runtime li vedo
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/app.css">');

                    helpForm2.preScanControls();
                    //lo spyOn va fatto prima del setup del listener, quindi prima dell'addEvents. se metti dopo va in errore
                    // spyOn(grid, "roclick"); // non faccio lo spy del rowClick altrimenti non esegue le funz e non posso testare se chiama la showMessageOkCancel
                    spyOn(metapage2, "showMessageOkCancel");

                    grid = $("#grid1").data("customController");
                    grid.addEvents(null, metapage2);
                    grid.fillControl($("#grid1"))
                        .then(function() {
                            expect($("#grid1").find("tr").length).toBe(3);

                            var s = stabilize();
                            $("#grid1").find("tr").eq(1).click(); // clicco sulla prima riga dei dati
                            return s;
                        }).then(function() {
                            expect(metapage2.showMessageOkCancel).not.toHaveBeenCalled();
                            state2.currentRow = null; // ci sono cambiamenti, mi aspetto venga chiamata la messageBox
                            //t2Ds2.rows[0].getRow().state = jsDataSet.dataRowState.added; // simulo una riga aggiunta
                            var s = stabilize();
                            $("#grid1").find("tr").eq(2).click(); // riclicco
                            return s;

                        }).then(function() {
                            expect(metapage2.showMessageOkCancel).toHaveBeenCalled();
                            done();
                        });
                    
                }, 5000);

                it("Test doubleClick, have to call editGridRow method",function (done) {
                    $("body").append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/app/styles/app.css" />');
                   // appMeta.basePath = 'base/test/spec_midway/';
                    grid2.addEvents(null, metapage);
                    grid2.isEditBtnVisible = true;
                    var originEditGridRow = metapage.editGridRow;
                    metapage.editGridRow  = function (){
                        return appMeta.Deferred('editGridRow').resolve().promise();
                    }
                    spyOn(metapage, "editGridRow").and.callThrough();

                    grid2.fillControl($("#grid2"))
                        .then(function() {
                            expect($("#grid2").find("tr").length).toBe(6);

                            var s = stabilize();
                            // Eseguo un doppio click, scatena anche il click quindi cambia il currentRow
                            $("#grid2").find("tr").eq(2).dblclick(); 
                            return s;

                        }).then(function() {
                             // ho selezionato la 2a riga
                            expect(grid2.currentRow).toBe(objrow2);
                            expect(metapage.editGridRow).toHaveBeenCalled();
                            metapage.editGridRow =  originEditGridRow;
                            done();
                        });
                });

                it("Test multiple click on rows",function (done) {
                    spyOn(metapage, "editGridRow").and.callThrough();
                    grid.addEvents(null, metapage);
                    grid.fillControl($("#grid1"))
                        .then(function() {
                            expect($("#grid1").find("tr").length).toBe(6);
                            var s = stabilize();
                            $("#grid1").find("tr").eq(1).click();
                            return s;
                        }).then(function() {
                            expect(grid.currentRow).toBe(objrow1);
                            expect($("#grid1").find("tr").eq(1).css("background-color")).toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(2).css("background-color")).not.toBe(appMeta.config.selectedRowColor);

                            var s = stabilize();
                            $("#grid1").find("tr").eq(2).click();
                            return s;

                        }).then(function() {
                            expect(grid.currentRow).toBe(objrow2); // aspetto il tempo encessatio il currentRow è cambiato
                            expect($("#grid1").find("tr").eq(1).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(2).css("background-color")).toBe(appMeta.config.selectedRowColor);

                            var s = stabilize();
                            $("#grid1").find("tr").eq(1).click(); // riclicco prima riga
                            return s;
                        }).then(function() {
                            expect(grid.currentRow).toBe(objrow1);
                            expect($("#grid1").find("tr").eq(1).css("background-color")).toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(2).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            var s = stabilize();
                            $("#grid1").find("tr").eq(2).dblclick(); // Eseguo un doppio click, scatena anche il click quindi cambia il currentRow
                            return s;
                        }).then(function() {
                        expect(grid.currentRow).toBe(objrow2);
                            expect(metapage.editGridRow).not.toHaveBeenCalled(); // non c'è editType quindi non va in edit
                        expect($("#grid1").find("tr").eq(1).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                        expect($("#grid1").find("tr").eq(2).css("background-color")).toBe(appMeta.config.selectedRowColor);
                            var s = stabilize();
                            $("#grid1").find("tr").eq(1).dblclick(); // due doppi click ravvicinati nel tempo possono avvenire
                            return s;
                        }).then(function() {
                        expect(grid.currentRow).toBe(objrow1);
                            expect(metapage.editGridRow).not.toHaveBeenCalled(); // non c'è editType quindi non va in edit
                            expect($("#grid1").find("tr").eq(1).css("background-color")).toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(2).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            done();
                        });
                });

                it("table2 linked to grid clearDataTableAndGridRowIndex(table2) clears table and grid linked variables", function (done) {
                    // costrusico ogetto stato e ds
                    var state1 = new appMeta.MetaPageState();
                    var state2 = new appMeta.MetaPageState();
                    var ds1 = new jsDataSet.DataSet("temp1");
                    var ds2 = new jsDataSet.DataSet("temp2");
                    var t1Ds1 = ds1.newTable("table1");
                    var t2Ds2 = ds2.newTable("table2");

                    // setto le prop delle colonne per t1
                    t1Ds1.setDataColumn("key", "String");
                    t1Ds1.setDataColumn("field1", "String");

                    t2Ds2.setDataColumn("key", "String");
                    t2Ds2.setDataColumn("field1", "String");

                    t1Ds1.columns["key"].caption = "key_1";
                    t1Ds1.columns["field1"].caption = "field_1";
                    t2Ds2.columns["key"].caption = "key_2";
                    t2Ds2.columns["field1"].caption = "field_2";

                    //
                    var r1 = {key: "key1", field1: "f1"};
                    var r2 = {key: "key2", field1: "f2"};
                    r1 = t1Ds1.add(r1).current;
                    r2 = t1Ds1.add(r2).current;

                    var r3 = {key: "key1", field1: "f3"};
                    var r4 = {key: "key2", field1: "f2"};
                    r3 = t2Ds2.add(r3).current;
                    r4 = t2Ds2.add(r4).current;

                    // imposto la chiave
                    t1Ds1.key("key");
                    t2Ds2.key("key");
                    state1.DS = ds1;
                    state1.editedRow = r1.getRow();

                    state2.DS = ds2;
                    state2.callerState = state1;
                    state2.setInsertState();
                    state2.currentRow = r3;

                    // inizializzo metapage, usata in AddEvents

                    var  metapage2 = new MetaPage('table2', 'def', true);
                    metapage2.state = state2;
                    state2.meta  = new appMeta.MetaData('table2');
                    // inizializzo la form
                    var helpForm2 = new HelpForm(state2, "table2", "#rootelement");
                    metapage2.helpForm  = helpForm2;
                    var mainwin = '<div id="rootelement"><div id="grid1" data-tag="table2.default" data-custom-control="grid"></div></div>';
                    $("html").html(mainwin);
                    // aggiungo stili, così a runtime li vedo
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    $('body').append(' <link rel="stylesheet" href="/base/app/styles/app.css">');

                    helpForm2.preScanControls();
                    //lo spyOn va fatto prima del setup del listener, quindi prima dell'addEvents. se metti dopo va in errore
                    // spyOn(grid, "roclick"); // non faccio lo spy del rowClick altrimenti non esegue le funz e non posso testare se chiama la showMessageOkCancel
                    spyOn(metapage2, "showMessageOkCancel");

                    grid = $("#grid1").data("customController");
                    grid.addEvents(null, metapage2);
                    grid.fillControl($("#grid1"))
                        .then(function() {
                                expect($("#grid1").find("tr").length).toBe(3);
                                var s = stabilize();
                                $("#grid1").find("tr").eq(1).click(); // clicco sulla prima riga dei dati
                                return s;
                            }).then(function() {
                                expect(metapage2.showMessageOkCancel).not.toHaveBeenCalled();
                                expect(grid.currentRow.getRow()).toBeDefined();
                                expect(grid.currentRow.field1).toBe("f3");
                                metapage2.clearDataTableAndGridRowIndex(t2Ds2);
                                expect(t2Ds2.rows.length).toBe(0);
                                expect(grid.currentRow).toBeNull();
                                done()
                        })

                }, 5000);

                it("table1 linked to grid clearDataTableAndGridRowIndex(table2) clears table but no grid linked variables", function (done) {
                    // costrusico ogetto stato e ds
                    var state1 = new appMeta.MetaPageState();
                    var state2 = new appMeta.MetaPageState();
                    var ds1 = new jsDataSet.DataSet("temp1");
                    var ds2 = new jsDataSet.DataSet("temp2");
                    var t1Ds1 = ds1.newTable("table1");
                    var t2Ds2 = ds2.newTable("table2");

                    // setto le prop delle colonne per t1
                    t1Ds1.setDataColumn("key", "String");
                    t1Ds1.setDataColumn("field1", "String");

                    t2Ds2.setDataColumn("key", "String");
                    t2Ds2.setDataColumn("field1", "String");

                    t1Ds1.columns["key"].caption = "key_1";
                    t1Ds1.columns["field1"].caption = "field_1";
                    t2Ds2.columns["key"].caption = "key_2";
                    t2Ds2.columns["field1"].caption = "field_2";

                    //
                    var r1 = {key: "key1", field1: "f1"};
                    var r2 = {key: "key2", field1: "f2"};
                    r1 = t1Ds1.add(r1).current;
                    r2 = t1Ds1.add(r2).current;

                    var r3 = {key: "key1", field1: "f3"};
                    var r4 = {key: "key2", field1: "f2"};
                    r3 = t2Ds2.add(r3).current;
                    r4 = t2Ds2.add(r4).current;

                    // imposto la chiave
                    t1Ds1.key("key");
                    t2Ds2.key("key");
                    state1.DS = ds1;
                    state1.editedRow = r1.getRow();

                    state2.DS = ds2;
                    state2.callerState = state1;
                    state2.setInsertState();
                    state2.currentRow = r3;

                    // inizializzo metapage, usata in AddEvents

                    var  metapage2 = new MetaPage('table2', 'def', true);
                    metapage2.state = state2;
                    state2.meta  = new appMeta.MetaData('table2');
                    // inizializzo la form
                    var helpForm2 = new HelpForm(state2, "table2", "#rootelement");
                    metapage2.helpForm  = helpForm2;
                    var mainwin = '<div id="rootelement"><div id="grid1" data-tag="table2.default" data-custom-control="grid"></div></div>';
                    $("html").html(mainwin);
                    // aggiungo stili, così a runtime li vedo
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    $('body').append(' <link rel="stylesheet" href="/base/app/styles/app.css">');

                    helpForm2.preScanControls();
                    //lo spyOn va fatto prima del setup del listener, quindi prima dell'addEvents. se metti dopo va in errore
                    // spyOn(grid, "roclick"); // non faccio lo spy del rowClick altrimenti non esegue le funz e non posso testare se chiama la showMessageOkCancel
                    spyOn(metapage2, "showMessageOkCancel");

                    grid = $("#grid1").data("customController");
                    grid.addEvents(null, metapage2);
                    grid.fillControl($("#grid1"))
                        .then(function() {
                            expect($("#grid1").find("tr").length).toBe(3);
                            var s = stabilize();
                            $("#grid1").find("tr").eq(1).click(); // clicco sulla prima riga dei dati
                            return s;
                        }).then(function() {
                        expect(metapage2.showMessageOkCancel).not.toHaveBeenCalled();
                        expect(grid.currentRow.getRow()).toBeDefined();
                        expect(grid.currentRow.field1).toBe("f3");
                        metapage2.clearDataTableAndGridRowIndex(t1Ds1);
                        expect(t2Ds2.rows.length).toBe(2);
                        expect(grid.currentRow.getRow()).toBeDefined();
                       
                        done()
                    })

                }, 5000);
                
            });

        describe('BootstrapModal class',

            function(){
                
                it( 'shows modal', function (done) {
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    var bmodal = new BootstrapModal(localResource.alert, localResource.changesUnsaved, [localResource.ok, localResource.cancel],localResource.cancel);

                   var s = stabilize();
                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                        .then(function () {
                            expect($(".modal").length).toBe(1);
                            $(bmodal.currModal).find("button")[1].click(); // click sul bottone ok, 2 è annulla, 0 closeCommand
                            
                        });

                   bmodal.show(metapage);
                    s.then(function() {
                        expect($(".modal").length).toBe(0); // chiudo , non esiste più
                        done();
                    });
                });
                
                it('shows modal and click closeCommand',
                    function(done) {
                        $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                        var bmodal = new BootstrapModal(localResource.alert,
                            localResource.changesUnsaved,
                            [localResource.ok, localResource.cancel],
                            localResource.cancel);
                        
                        var s = stabilize();
                        common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                            .then(function () {
                                expect($(".modal").length).toBe(1);
                                $(bmodal.currModal).find("button")[0].click();
                            });

                        bmodal.show(metapage);

                        s.then(function() {
                            expect($(".modal").length).toBe(0);
                            done();
                        });
                    });

                it( 'shows modal, with details, press ok button, close the modal', function (done) {
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    var detailsString = 'string of detail';
                    var bmodal = new BootstrapModal(localResource.alert, localResource.changesUnsaved, [localResource.ok, localResource.cancel],localResource.cancel,detailsString);

                    var s = stabilize();
                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                        .then(function () {
                            expect($(".modal").length).toBe(1);
                            expect($($(bmodal.currModal).find("button")[0]).text()).toBe("×");
                            expect($($(bmodal.currModal).find("button")[1]).text()).toBe(localResource.ok);
                            expect($($(bmodal.currModal).find("button")[2]).text()).toBe(localResource.cancel);
                            expect($($(bmodal.currModal).find("button")[3]).text()).toBe(localResource.details);
                            $(bmodal.currModal).find("button")[1].click(); // click sul bottone ok, 2 è annulla, 0 closeCommand

                        });

                    bmodal.show(metapage);
                    s.then(function() {
                        expect($(".modal").length).toBe(0); // chiudo , non esiste più
                        done();
                    });
                });

                it( 'shows modal, with details, press details button, show string of the details', function (done) {
                    $('body').append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    var detailsString = 'string of detail';
                    var bmodal = new BootstrapModal(localResource.alert, localResource.changesUnsaved, [localResource.ok, localResource.cancel],localResource.cancel,detailsString);
                    var s = stabilize();
                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                        .then(function () {
                            expect($(".modal").length).toBe(1);
                            expect($($(bmodal.currModal).find("button")[0]).text()).toBe("×");
                            expect($($(bmodal.currModal).find("button")[1]).text()).toBe(localResource.ok);
                            expect($($(bmodal.currModal).find("button")[2]).text()).toBe(localResource.cancel);
                            expect($($(bmodal.currModal).find("button")[3]).text()).toBe(localResource.details);
                            $(bmodal.currModal).find("button")[3].click(); // click sul bottone dettagli. mette un paragrafo con la stringa dei dettagli
                            expect($("p").text()).toBe(detailsString);
                            $(bmodal.currModal).find("button")[3].click(); // click sul bottone dettagli. scompare p dei dettagli
                            expect($("p").is(":visible")).toBe(false);
                            
                            $(bmodal.currModal).find("button")[1].click(); // click sul bottone ok

                        });
                    bmodal.show(metapage);
                    s.then(function() {
                        expect($(".modal").length).toBe(0); // chiudo , non esiste più
                        done();
                    });
                });
            });
        
    });
