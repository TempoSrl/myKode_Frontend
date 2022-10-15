"use strict";

describe("GridControlX",
    function () {
        var MetaPage = appMeta.MetaPage;
        var HelpForm = appMeta.HelpForm;
        var stabilize = appMeta.stabilize;
        var state;
        var helpForm;
        var ds;
        var t1, t2;
        var objrow1, objrow2, objrow3, objrow4, objrow5, objrow6, objrow7 ;
        var grid,grid2, gridt1;
        var metapage;
        var q = window.jsDataQuery;

        var currencyDecimalSeparator = appMeta.currencyDecimalSeparator;
        var currencySymbol = appMeta.currencySymbol;
        var origDoGet; // mock funz doGet
        beforeEach(function () {
            appMeta.basePath = "base/";
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
            objrow5 = t2.add(objrow5).current;
            objrow4 = t2.add(objrow4).current;

            t2.add(objrow2);
            t2.add(objrow3);
            t2.add(objrow5);
            t2.add(objrow4);
            t2.key(['mycol1']);

            objrow6 = {cName: "name11", cDec: 1, cDouble: 111};
            objrow7 = {cName: "name22", cDec: 2, cDouble: 222};
            objrow6 = t1.add(objrow6).current;
            objrow7 = t1.add(objrow7).current;
            ds.acceptChanges();
            state.DS = ds;

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function() {
                return new $.Deferred().resolve();
            };
            
            state.meta  = new appMeta.MetaData('table1');
            
            // inizializzo metapage, usata in AddEvents
            metapage = new MetaPage('table2', 'def', false);
            metapage.state = state;
            
            // inizializzo la form
            helpForm = new HelpForm(state, "table1", "#rootelement");
            metapage.helpForm  = helpForm;
            var mainwin = '<div id="rootelement">' +
                'grid1:<br><div id="grid1" data-tag="table2.default" data-custom-control="gridx"></div>' +
                'gridt1:<br><div id="gridt1" data-tag="table1.default" data-custom-control="gridx"></div>' +
                'grid2:<br><div id="grid2" data-tag="table2.listtype.edittype" data-custom-control="gridx"></div>' +
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

        describe("methods work",
            function () {
                // *** General test appMeta object ***
                it("exists",function () {
                    expect(grid).toBeDefined();
                });

                it("getOrderedColumns() should return columns array ordered",function () {
                    var cols = grid.getOrderedColumns(t1);
                    
                    expect(cols.length).toBe(0);  // nessuna ha caption

                    cols =  grid.getOrderedColumns(t2);
                    expect(cols.length).toBe(3); // sono 4 ma una inizia con il punto
                    // tornano ordinate, secondo listColPos
                    expect(cols[0].caption).toBe("mycol2");
                    expect(cols[1].caption).toBe("mycol1");
                    expect(cols[2].caption).toBe("mycol3"); // senza listColPos viene messa per ultima
                });

                it("getSortedRows() should return rows array ordered",function () {
                    t2.orderBy("mycol1");
                    expect(t2.rows[0]["mycol1"]).toBe(22);
                    var rows = grid.getSortedRows(t2);
                    expect(rows[0]["mycol1"]).toBe(11); // era "22" ha ordinato asc. quindi riga 0 avrà il valore più basso. cioè "11"
                });

                it("getSortedRows() with filter should return rows array ordered and filtered",function () {
                    t2.orderBy("mycol1");
                    expect(t2.rows[0]["mycol1"]).toBe(22);
                    var filter  = q.eq("mycol4", "vsame");
                    var rows = grid.getSortedRows(t2, filter);
                    expect(rows[0]["mycol1"]).toBe(33); // rtorvo ordinato su "mycol1" e filtrato su "mycol4" per il valore passato
                    expect(rows[1]["mycol1"]).toBe(44);
                    expect(rows[2]["mycol1"]).toBe(55);
                });

                it("getSortedRows() without orderBy, order by key with filter should return rows array filtered",function () {
                    var filter  = q.eq("mycol4", "vsame");
                    var rows = grid.getSortedRows(t2, filter);
                    expect(rows[0]["mycol1"]).toBe(33); // senza orderby torna solo filtrato
                    expect(rows[1]["mycol1"]).toBe(44);
                    expect(rows[2]["mycol1"]).toBe(55);
                });

                it("setRow() propagate=true should return Deferred and call rowSelect",function (done) {
                    grid.addEvents(null, metapage);
                    spyOn(metapage, "freshForm").and.callThrough();
                    grid.setRow(objrow1, true)
                        .then(function (x) {
                            expect(x).toBeDefined();
                            expect(grid.currentRow).toEqual(objrow1);
                            expect(metapage.freshForm).toHaveBeenCalled();
                            done();
                        });
                    
                });

                it("setRow() propagate=true and table different from primaryTable should call fillRelatedToRowControl and return Deferred ",function (done) {
                    // metapage ha primaryTable = table2, mentre il gridt1 ha come grid table1,
                    // quindi la rowselect che chiama non deve fare la freshForm ma la iterateFillRelatedControls che poi a sua volta
                    // chiama la fillRelatedToRowControl
                    gridt1.addEvents(null, metapage);
                    spyOn(helpForm, "fillRelatedToRowControl").and.callThrough();
                    spyOn(metapage, "freshForm").and.callThrough();
                    gridt1.setRow(objrow6, true)
                        .then(function (x) {
                            expect(x).toBeDefined();
                            expect(gridt1.currentRow).toEqual(objrow6);
                            expect(helpForm.fillRelatedToRowControl).toHaveBeenCalled();
                            expect(metapage.freshForm).not.toHaveBeenCalled();
                            done();
                        });

                });

                it("setRow() propagate=false should return Deferred and not call rowSelect",function (done) {
                    grid.addEvents(null, metapage);
                    spyOn(metapage, "freshForm").and.callThrough();
                    grid.setRow(objrow1, false)
                        .then(function (x) {
                            expect(x).toBeDefined();
                            expect(grid.currentRow).toEqual(objrow1);
                            expect(metapage.freshForm).not.toHaveBeenCalled();
                            done();
                        });

                });

                it("selectrow() select the row",function (done) {

                    // inizializzo la grid con gli oggetti necessari
                    grid.addEvents(null, metapage);
                    t2.orderBy("mycol1");
                    var rows = grid.getSortedRows(t2);
                    grid.gridRows = rows;
                    spyOn(metapage, "freshForm");

                    grid.selectRow(grid.gridRows[0])
                        .then(function (x) {
                            expect(x).toBeDefined();
                            expect(grid.currentRow).toEqual(objrow2); // la num 0, è quella ordinata, cioèquella con mycol1 minore, ed è la objrow2
                            expect(metapage.freshForm).toHaveBeenCalled(); // chiama la rowSelct, quindi osservo se chiama a sua volta "freshForm"
                            done();
                        });

                });

                it("changeCssRowSelected() set the active row",function (done) {

                    grid.fillControl($("#grid1"))
                        .then(function() {
                            // la riga di indice 0 (sarebbe il mdlRowIndex impostato) è la prima riga dati, con jquery invece cerco la 1, poichè la 0 è il tr dell'header
                            // attenzione le righe vengono ordinate per chiave quindi viene inserita prima la riga objrow2 poi la objrow1, poichèla chiave è "mycol1" -> 11, 22
                            grid.changeCssRowSelected(objrow1);
                            expect($("#grid1").find("tr").eq(0).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(1).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(2).css("background-color")).toBe(appMeta.config.selectedRowColor);

                            // switch della classe active
                            grid.changeCssRowSelected(objrow2);
                            expect($("#grid1").find("tr").eq(0).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(1).css("background-color")).toBe(appMeta.config.selectedRowColor);
                            expect($("#grid1").find("tr").eq(2).css("background-color")).not.toBe(appMeta.config.selectedRowColor);
                            done();
                        });

                });

                it("fillControl() should fill the cells",function (done) {
                    // aggiungo stili, così a runtime li vedo
                    $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $('body').append(' <link rel="stylesheet" href="/base/test/app/styles/app.css">');
                    grid.addEvents(null, metapage);

                    grid.fillControl($("#grid1"))
                        .then(function () {
                            // Eseguo 2 fill control consecutivi
                            expect($("#grid1").find("tr").length).toBe(6);
                            return grid.fillControl($("#grid1"));                            
                        })
                        .then(function () {
                            // Eseguo 2 fill control consecutivi
                                expect($("#grid1").find("tr").length).toBe(6);
    
                                var s = stabilize();
                                $("#grid1").find("tr").eq(1).click(); // clicco sulla prima riga dei dati
                                return s;
    
                        })
                        .then(function () {
                            expect($("#grid1").find("tr").eq(1).data("mdldatarowlinked")).toBe(objrow2);
                            expect( grid.currentRow).toBe(objrow2);
    
                            var s = stabilize();
                            $("#grid1").find("tr").eq(2).click(); // clicco sulla prima riga dei dati
                            return s;
                        
                        })
                        .then(function () {                            
                            expect($("#grid1").find("tr").eq(2).data("mdldatarowlinked")).toBe(objrow1);
                            expect( grid.currentRow).toBe(objrow1);
                            done();
                        });
                },2000);

                it("getformattedValue() set the correct text in the td",function (done) {

                    grid.fillControl($("#grid1"))
                        .then(function () {
                            var fvalueDec = grid.getFormattedValue(objrow1, t2.columns["mycol1"]);
                            expect(fvalueDec).toBe(currencySymbol + " 22" + currencyDecimalSeparator + "00");

                            var fvalueString = grid.getFormattedValue(objrow1, t2.columns["mycol2"]);
                            expect(fvalueString).toBe('v11');

                            var fvalueData = grid.getFormattedValue(objrow1, t2.columns["mycol3"]);
                            expect(fvalueData).toBe('02/10/1980');
                            done();
                        });
                });
                
                it("clearControl() should remove all row less the header",function (done) {

                    // fill del grid
                    grid.fillControl($("#grid1"))
                        .then(function() {
                            // checks prima di fare il clear
                            expect($("#grid1").find("tr").length).toBe(6);
                            expect(grid.currentRow).toBe(null);

                            // effettuo clear
                            return grid.clearControl();

                        }).then(function() {
                            expect($("#grid1").find("tr").length).toBe(1); // rimane solo l'header
                            expect(grid.currentRow).toBe(null);
                            // ripopolo il grid con forceSelectRow=true

                            return grid.fillControl($("#grid1"));
                        }).then(function() {

                            expect($("#grid1").find("tr").length).toBe(6);
                            expect(grid.currentRow).toBe(null); // stavolta forceSelectRow = true quindi seleziono la prima riga dati
                            // verifico che anche graficamente la 1a riga dati sia selezionata
                            expect($("#grid1").find("tr").eq(1).css("background-color")).toBe('rgba(0, 0, 0, 0)');

                            // ancora clear
                            return grid.clearControl();

                        }).then(function() {
                            expect($("#grid1").find("tr").length).toBe(1); // rimane solo l'header
                            expect(grid.currentRow).toBe(null);
                            done();
                        });
                });
                
            });
    });
