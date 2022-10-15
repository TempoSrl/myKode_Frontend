"use strict";

describe("GridMultiSelectControl",
    function () {
        var HelpForm = appMeta.HelpForm;
        var stabilize = appMeta.stabilize;
        var state;
        var helpForm;
        var ds;
        var t1;
        var objrow1, objrow2, objrow3, objrow4, objrow5, objrow6 ;

        beforeEach(function () {
            
            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";
            // nomi colonne
            var c_name = "c_name";
            var c_dec = "c_dec";
            var c_double = "c_double";

            // costrusico ogetto stato e ds
            state = new appMeta.MetaPageState();
            ds = new jsDataSet.DataSet("temp");
            t1 = ds.newTable("table1");
            // setto le prop delle colonne per t1
            t1.setDataColumn(c_name, "String");
            t1.setDataColumn(c_dec, "Decimal");
            t1.setDataColumn(c_double, "Double");

            t1.columns[c_name].caption = "Nome";
            t1.columns[c_dec].caption = "NumeroDec";
            t1.columns[c_double].caption = "NumeroDouble";

            objrow1 = {c_name: "name11", c_dec: 1, c_double: 111};
            objrow2 = {c_name: "name22", c_dec: 2, c_double: 222};
            objrow3 = {c_name: "name33", c_dec: 3, c_double: 333};
            objrow4 = {c_name: "name44", c_dec: 4, c_double: 444};
            objrow5 = {c_name: "name55", c_dec: 5, c_double: 555};
            objrow6 = {c_name: "name66", c_dec: 6, c_double: 666};
            
            t1.add(objrow1);
            t1.add(objrow2);
            t1.add(objrow3);
            t1.add(objrow4);
            t1.add(objrow5);
            t1.add(objrow6);
            t1.acceptChanges();
            state.DS = ds;
            // inizializzo la form
            helpForm = new HelpForm(state, "table1", "#rootelement");
         
            var mainwin = '<div id="rootelement">Grid multiselct</div>';
            $("html").html(mainwin);
        });

        afterEach(function () {
        });



                it("GridMultiSelectControl builds a grid and selects rows with ctrl", function (done) {
                  
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                    
                    var gridMultiSelectControl = new appMeta.GridMultiSelectControl("#rootelement", t1, helpForm);
                    gridMultiSelectControl.fillControl(null)
                        .then(function () {
                         
                            expect($("#rootelement").find("table > tr").length).toBe(7);// 6 + header
                            
                            // costruisco jquery event per simulare il mouseDown con ctrl
                            var e = $.Event( "mousedown",  { keyCode: 91, ctrlKey: true });
                            var s = stabilize();
                            // eseguo mousedown sulla prima riga
                            $("#rootelement").find("table > tr").eq(1).trigger(e);

                            return s.then(function () {
                                // mi aspetto che la riga abbia il css selzionato
                                expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                expect( gridMultiSelectControl.selectedRows.length).toBe(1);
                                
                                // eseguo un nuovo mouseDown con ctrl
                                s = stabilize();
                                $("#rootelement").find("table > tr").eq(2).trigger(e);
                                
                                return s.then(function () {
                                    expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(2).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( gridMultiSelectControl.selectedRows.length).toBe(2);
                                    done();
                                })

                            })
                    })

                });

                it("GridMultiSelectControl builds a grid and selects row in mousedown", function (done) {
                 
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');

                    var gridMultiSelectControl = new appMeta.GridMultiSelectControl("#rootelement", t1, helpForm);
                    gridMultiSelectControl.fillControl(null)
                        .then(function () {

                            expect($("#rootelement").find("table > tr").length).toBe(7);// 6 + header

                            // costruisco jquery event per simulare il mouseDown con ctrl
                            var e = $.Event( "mousedown");
                            var s = stabilize();
                            // eseguo mousedown sulla prima riga
                            $("#rootelement").find("table > tr").eq(1).trigger(e);

                            return s.then(function () {
                                // mi aspetto che la riga abbia il css selzionato
                                expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                expect( gridMultiSelectControl.selectedRows.length).toBe(1);

                                // eseguo un nuovo mouseDown singolo, quindi, mi devo ritrovare una sola selezionata
                                s = stabilize();
                                $("#rootelement").find("table > tr").eq(2).trigger(e);

                                return s.then(function () {
                                    expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(false);
                                    expect( $("#rootelement").find("table > tr").eq(2).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( gridMultiSelectControl.selectedRows.length).toBe(1);
                                    done();
                                })

                            })
                        })

                });

                it("GridMultiSelectControl builds a grid and multiselects rows with shift, from index < to index >", function (done) {
                
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');

                    var gridMultiSelectControl = new appMeta.GridMultiSelectControl("#rootelement", t1, helpForm);
                    gridMultiSelectControl.fillControl(null)
                        .then(function () {

                            expect($("#rootelement").find("table > tr").length).toBe(7);// 6 + header

                            // costruisco jquery event per simulare il mouseDown con ctrl
                            var e = $.Event( "mousedown");
                            var s = stabilize();
                            
                            // eseguo mousedown sulla prima riga
                            $("#rootelement").find("table > tr").eq(1).trigger(e);

                            return s.then(function () {
                                // mi aspetto che la riga abbia il css selzionato
                                expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                expect( gridMultiSelectControl.selectedRows.length).toBe(1);

                                // esguo un nuovo mouseDown con ctrl
                                s = stabilize();
                                // costruisco jquery event per simulare il mouseDown con ctrl
                                var e = $.Event( "mousedown",  { shiftKey: true });
                                $("#rootelement").find("table > tr").eq(4).trigger(e);

                                return s.then(function () {
                                    // con lo shift selziona le prime 4
                                    expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(2).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(3).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(4).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(5).hasClass(appMeta.cssDefault.selectedRow)).toBe(false);
                                    expect( $("#rootelement").find("table > tr").eq(6).hasClass(appMeta.cssDefault.selectedRow)).toBe(false);
                                    expect( gridMultiSelectControl.selectedRows.length).toBe(4);
                                    done();
                                })

                            })
                        })

                });

                it("GridMultiSelectControl builds a grid and multiselects rows with shift, from index > to index <", function (done) {
                   
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');

                    var gridMultiSelectControl = new appMeta.GridMultiSelectControl("#rootelement", t1, helpForm);
                    gridMultiSelectControl.fillControl(null)
                        .then(function () {

                            expect($("#rootelement").find("table > tr").length).toBe(7);// 6 + header

                            // costruisco jquery event per simulare il mouseDown con ctrl
                            var e = $.Event( "mousedown");
                            var s = stabilize();
                            // eseguo mousedown sulla prima riga
                            $("#rootelement").find("table > tr").eq(5).trigger(e);

                            return s.then(function () {
                                // mi aspetto che la riga abbia il css selzionato
                                expect( $("#rootelement").find("table > tr").eq(5).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                expect( gridMultiSelectControl.selectedRows.length).toBe(1);

                                // esguo un nuovo mouseDown con ctrl
                                s = stabilize();
                                // costruisco jquery event per simulare il mouseDown con ctrl
                                var e = $.Event( "mousedown",  { shiftKey: true });
                                $("#rootelement").find("table > tr").eq(1).trigger(e);

                                return s.then(function () {
                                    // con lo shift selziona le prime 4
                                    expect( $("#rootelement").find("table > tr").eq(1).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(2).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(3).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(4).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(5).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                    expect( $("#rootelement").find("table > tr").eq(6).hasClass(appMeta.cssDefault.selectedRow)).toBe(false);
                                    expect( gridMultiSelectControl.selectedRows.length).toBe(5);
                                    done();
                                })

                            })
                        })

                });

                it("GridMultiSelectControl builds a grid and multiselects all rows with right mouse click", function (done) {

                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');

                    var gridMultiSelectControl = new appMeta.GridMultiSelectControl("#rootelement", t1, helpForm);
                    gridMultiSelectControl.fillControl(null)
                        .then(function () {

                            expect($("#rootelement").find("table > tr").length).toBe(7);// 6 + header

                            // costruisco jquery event per simulare il mouseDown + tasto destro
                            var e = $.Event( "mousedown", {which:3});
                            var s = stabilize();
                            // eseguo mousedown sulla prima riga
                            $("#rootelement").find("table > tr").eq(1).trigger(e);

                            return s.then(function () {
                                var allRows =  $("#rootelement").find("table > tr:not(:has(>th))");
                                // devono  tutte selezionate
                                _.forEach(allRows, function (r) {
                                    expect($(r).hasClass(appMeta.cssDefault.selectedRow)).toBe(true);
                                })
                                
                                expect( gridMultiSelectControl.selectedRows.length).toBe(6);
                                done();

                            })
                        })
                });

    });
