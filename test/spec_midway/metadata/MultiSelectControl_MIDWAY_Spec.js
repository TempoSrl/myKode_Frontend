"use strict";

describe("MultiSelectControl",
    function () {
        var stabilize = appMeta.stabilize;
        var stabilizeToCurrent = appMeta.stabilizeToCurrent;
        var Deferred = appMeta.Deferred;

        var multiSelectControl, originalCreateTableByName, originalRunSelectIntoTable;

        beforeEach(function () {
            
            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";
            appMeta.basePath = "base/";

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function() {
                return new $.Deferred().resolve();
            };

            // costrusico ogetto stato e ds
            var state = new appMeta.MetaPageState();
            var ds = new jsDataSet.DataSet("temp");
            var tableName = "registry";
            var t1 = ds.newTable(tableName);
            // setto le prop delle colonne per t1
            t1.setDataColumn("idreg", "Int32");
            t1.setDataColumn("cu", "String");
            t1.setDataColumn("gender", "String");

            t1.columns["idreg"].caption = "IdReg";
            t1.columns["cu"].caption = "Cu";
            t1.columns["gender"].caption = "Gender";

            t1.key("idreg");

            state.DS = ds;

            var meta = new appMeta.MetaData();
            state.meta = meta;

            var metapage = new appMeta.MetaPage(tableName, 'def', false);
            metapage.state = state;

            var helpForm = new  window.appMeta.HelpForm(state, tableName, "#rootelement");
            metapage.helpForm  = helpForm;

            var q = window.jsDataQuery;
            var filter = q.and(q.eq(q.field("gender"),"F"), q.eq(q.field("cu"),"sa"));

            originalCreateTableByName  = appMeta.getData.createTableByName;
            originalRunSelectIntoTable  = appMeta.getData.runSelectIntoTable;

            // mock delle funzioni che vanno a db
            appMeta.getData.createTableByName = function (tableName, columnList) {
                var dt = new jsDataSet.DataTable(tableName);
                dt.setDataColumn("idreg", "Int32");
                dt.setDataColumn("cu", "String");
                dt.setDataColumn("gender", "String");
                dt.columns["idreg"].caption = "IdReg";
                dt.columns["cu"].caption = "Cu";
                dt.columns["gender"].caption = "Gender";

                return new Deferred().resolve(dt).promise();
            }

            appMeta.getData.runSelectIntoTable  = function (t,  filter, top) {
                var objrow1 = {idreg: 1, cu: "uno", gender: "F"};
                var objrow2 = {idreg: 2, cu: "due", gender: "M"};
                var objrow3 = {idreg: 3, cu: "tre", gender: "F"};
                var objrow4 = {idreg: 4, cu: "quattro", gender: "M"};
                var objrow5 = {idreg: 5, cu: "cinque", gender: "F"};
                var objrow6 = {idreg: 6, cu: "sei", gender: "M"};
                var objrow7 = {idreg: 7, cu: "sette", gender: "M"};

                t.add(objrow1);
                t.add(objrow2);
                t.add(objrow3);
                t.add(objrow4);
                t.add(objrow5);
                t.add(objrow6);
                t.add(objrow7);

                t.select(filter);

                return new Deferred().resolve().promise();
            }


            // sovrascrivo html di prova
            var mainwin = '<div id="rootelement">' +
                "</div>";
            $("html").html(mainwin);
            $("body").append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
            $("body").append('<link rel="stylesheet" href="/base/app/styles/app.css" />');
            var el = $("#rootelement");

            multiSelectControl = new appMeta.MultiSelectControl(el, metapage, t1, filter, "listingType");


        });

        afterEach(function () {
            appMeta.basePath = "/";

            appMeta.getData.createTableByName = originalCreateTableByName;
            appMeta.getData.runSelectIntoTable = originalRunSelectIntoTable;
        });

        describe("methods work. Server methods mocked",
            function () {
             
                it("fillControl() is ASYNC and grids are populated",function (done) {

                    multiSelectControl.fillControl()
                        .then(function () {
                            // test var interna al grid control
                            expect(multiSelectControl.gridToAdd.gridRows.length).toBe(7);
                            expect(multiSelectControl.gridAdded.gridRows.length).toBe(0);

                            // test sull' html
                            expect( $(".gridToAdd").find("table > tr").length).toBe(8); // header + 1 row
                            expect( $(".gridAdded").find("table > tr").length).toBe(1); // header
                            done();
                    })
                });

                it("1. fillControl(), 2. row selected on upper grid, 3. Add_button pressed, -> moves the row from toAddTable to addedTable",function (done) {
                    $("body").append('<link rel="stylesheet" href="/base/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/app/styles/app.css" />');
                    
                    multiSelectControl.fillControl()
                        .then(function () {

                            // test var interna al grid control
                            expect(multiSelectControl.gridToAdd.gridRows.length).toBe(7);
                            expect(multiSelectControl.gridAdded.gridRows.length).toBe(0);
                            // test sull' html
                            expect( $(".gridToAdd").find("table > tr").length).toBe(8); // header + 1 row
                            expect( $(".gridAdded").find("table > tr").length).toBe(1); // header

                            // costruisco jquery event per simulare il mouseDown con ctrl
                            var e = $.Event( "mousedown",  { keyCode: 91, ctrlKey: true });
                            var s = stabilizeToCurrent();
                            // eseguo mousedown sulla prima riga, cioè seleziono
                            $(".gridToAdd").find("table > tr").eq(1).trigger(e);

                            return s.then(function () {

                                // mi aspetto che la riga abbia il css selezionato
                                expect( $(".gridToAdd").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);

                                // eseguo il click del bottone Aggiungi
                                s = stabilizeToCurrent();
                                $(".multiSelect_btn_add").click();

                                return s.then(function () {
                                    // mi aspetto lo swap della riga
                                    expect(multiSelectControl.gridToAdd.gridRows.length).toBe(6);
                                    expect(multiSelectControl.gridAdded.gridRows.length).toBe(1);

                                    // test sull' html
                                    expect( $(".gridToAdd").find("table > tr").length).toBe(7); // header - una riga
                                    expect( $(".gridAdded").find("table > tr").length).toBe(2); // header + 1 row spostata
                                    done();
                                });
                            })
                        })
                }, 5000);

                it("1. fillControl(), 2. row with ctrl, 3. row with shift, 4. Add_button pressed, -> moves the rows from toAddTable to addedTable",function (done) {

                    multiSelectControl.fillControl()
                        .then(function () {

                            // test var interna al grid control
                            expect(multiSelectControl.gridToAdd.gridRows.length).toBe(7);
                            expect(multiSelectControl.gridAdded.gridRows.length).toBe(0);
                            // test sull' html
                            expect( $(".gridToAdd").find("table > tr").length).toBe(8); // header + 1 row
                            expect( $(".gridAdded").find("table > tr").length).toBe(1); // header

                            // costruisco jquery event per simulare il mouseDown con ctrl
                            var e = $.Event( "mousedown",  { keyCode: 91, ctrlKey: true });
                            var s = stabilizeToCurrent();
                            // eseguo mousedown sulla prima riga, cioè seleziono
                            $(".gridToAdd").find("table > tr").eq(1).trigger(e);

                            return s.then(function () {

                                // mi aspetto che la riga abbia il css selezionato
                                expect( $(".gridToAdd").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);

                                // costruisco jquery event per simulare il mouseDown con shift
                                var eShift = $.Event( "mousedown",  { shiftKey: true });
                                s = stabilizeToCurrent();
                                // eseguo mousedown sulla 5a riga
                                $(".gridToAdd").find("table > tr").eq(5).trigger(eShift);

                                return s.then(function () {

                                    // eseguo il click del bottone Aggiungi
                                    s = stabilizeToCurrent();
                                    $(".multiSelect_btn_add").click();

                                    return s.then(function () {
                                        // mi aspetto lo swap della riga
                                        expect(multiSelectControl.gridToAdd.gridRows.length).toBe(2);
                                        expect(multiSelectControl.gridAdded.gridRows.length).toBe(5); // 5 righe selezionate con lo shift

                                        // test sull' html
                                        expect( $(".gridToAdd").find("table > tr").length).toBe(3); // header - 5 rows
                                        expect( $(".gridAdded").find("table > tr").length).toBe(6); // header + 5 rows spostata
                                        done();
                                    });
                                });


                            })
                        })
                }, 20000);

            });
    });
