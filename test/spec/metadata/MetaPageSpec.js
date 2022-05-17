'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */

describe('MetaPage', function () {
    var MetaPage = appMeta.MetaPage;
    var HelpForm = appMeta.HelpForm;
    var localResource = appMeta.localResource;
    var metapage;
    var metapage2, state1, state2, r1,r2, r3, r4 ;
    var Deferred = appMeta.Deferred;

    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';

        metapage = new MetaPage('table1', 'table1_def.json', false);
        //loadFixtures('HtmlPageTest.html');

        // costrusico oggetto stato e ds per testare i metodi che fanno operazioni con il dataset
        state1 = new appMeta.MetaPageState();
        state2 = new appMeta.MetaPageState();
        var ds1 = new jsDataSet.DataSet("temp1");
        var ds2 = new jsDataSet.DataSet("temp2");
        var t1ds1 = ds1.newTable("table1");
        var t2ds2 = ds2.newTable("table2");

        // setto le prop delle colonne per t1
        t1ds1.setDataColumn("key", "String");
        t1ds1.setDataColumn("field1", "String");

        t2ds2.setDataColumn("key", "String");
        t2ds2.setDataColumn("field1", "String");

        t1ds1.columns["key"].caption = "key_1";
        t1ds1.columns["field1"].caption = "field_1";
        t2ds2.columns["key"].caption = "key_2";
        t2ds2.columns["field1"].caption = "field_2";

        r1 = {key: "key1", field1: "f1"};
        r2 = {key: "key2", field1: "f2"};
        t1ds1.add(r1);
        t1ds1.add(r2);

        r3 = {key: "key1", field1: "f3"};
        r4 = {key: "key2", field1: "f2"};
        t2ds2.add(r3);
        t2ds2.add(r4);

        // imposto la chiave
        t1ds1.key("key");
        t2ds2.key("key");
        state1.DS = ds1;
        state1.editedRow = r1.getRow();

        state2.DS = ds2;
        state2.callerState = state1;
        state2.setInsertState();
        state2.currentRow = r3;

        // inizializzo metapage, usata in AddEvents
        metapage2 = new MetaPage('table2', 'def', true);
        metapage2.state = state2;
        var helpForm2 = new appMeta.HelpForm(state2, "table2", "#rootelement");
        metapage2.helpForm  = helpForm2;
    });
    afterEach(function () {
        metapage = null;
    });

    describe("MetaPage class",
        function () {

            it('exists',
                function () {
                    expect(MetaPage).toBeDefined();
                });

            it('MetaPage constructor is MetaPage ',
                function () {
                    expect(MetaPage.prototype.constructor.name).toBe("MetaPage");
                });

            it('metapage should be defined',
                function () {
                    expect(metapage).toBeDefined();
                });

            it('metapage should have a init() function',
                function () {
                    expect(metapage.init).toEqual(jasmine.any(Function));
                });

            it('setPageTitle() sets the title, depending on state',
                function () {
                    metapage.state = state1;

                    // override fun getName()
                    var title = "MyTitle";
                    MetaPage.prototype.getName = function () {
                        return title;
                    };

                    metapage.setPageTitle();
                    expect(metapage.title).toBe(title + " (" + appMeta.localResource.searchTitle + ")");

                    state1.setEditState();
                    metapage.setPageTitle();
                    expect(metapage.title).toBe(title + " (" + appMeta.localResource.changeTitle + ")");

                    state1.setInsertState();
                    metapage.setPageTitle();
                    expect(metapage.title).toBe(title + " (" + appMeta.localResource.insertTitle + ")");
                });

            it('metapage should have a assurePageState() function',
                function () {
                    expect(metapage.assurePageState).toEqual(jasmine.any(Function));
                });

            it('assurePageState() should be async',
                function (done) {
                    metapage.assurePageState().then(function (result) {
                        // Deve essere definito, cioè la promise mi deve tornare qualcosa
                        expect(result).toBeDefined();
                        done();
                    });

                });

            it('assurePageState() should be async and return MetaPageState instance',
                function (done) {
                    metapage.assurePageState().then(function (result) {
                        expect(result.constructor.name).toBe("MetaPageState");
                        done();
                    });

                });

            it('hasUnsavedChanges, method works fine',
                function (done) {
                    // Deve essere definito, cioè la promise mi deve tornare qualcosa

                    // Inoltre r3 è la primary[0] , e su "key1" matcha con il ds1 su r1 che ha field1 diverso, quindi ha changes
                    metapage2.hasUnsavedChanges().then(function (result) {
                        expect(result).toBe(true);
                        done();
                    });
                });

            it('hasUnsavedChanges, hasn\'t changes return false',
                function (done) {
                    // ridichiqro tutto il ds, pichè devo cambiare vsalori alle righe e mon esiste modo se non ridichiarle a aggiungerle ad oggetti nuovi
                    state1 = new appMeta.MetaPageState();
                    state2 = new appMeta.MetaPageState();
                    var ds1 = new jsDataSet.DataSet("temp1");
                    var ds2 = new jsDataSet.DataSet("temp2");
                    var t1ds1 = ds1.newTable("table1");
                    var t2ds2 = ds2.newTable("table2");

                    // setto le prop delle colonne per t1
                    t1ds1.setDataColumn("key", "String");
                    t1ds1.setDataColumn("field1", "String");

                    t2ds2.setDataColumn("key", "String");
                    t2ds2.setDataColumn("field1", "String");

                    t1ds1.columns["key"].caption = "key_1";
                    t1ds1.columns["field1"].caption = "field_1";
                    t2ds2.columns["key"].caption = "key_2";
                    t2ds2.columns["field1"].caption = "field_2";

                    r1 = {key: "key1", field1: "f1"};
                    r2 = {key: "key2", field1: "f2"};
                    t1ds1.add(r1);
                    t1ds1.add(r2);

                    r3 = {key: "key1", field1: "f1"};
                    r4 = {key: "key2", field1: "f2"};
                    t2ds2.add(r3);
                    t2ds2.add(r4);

                    // imposto la chiave
                    t1ds1.key("key");
                    t2ds2.key("key");
                    state1.DS = ds1;
                    state1.editedRow = r1.getRow();

                    state2.DS = ds2;
                    state2.callerState = state1;
                    state2.setInsertState();
                    state2.currentRow = r3;

                    // inizializzo metapage, usata in AddEvents
                    metapage2 = new MetaPage('table2', 'def', true);
                    metapage2.state = state2;
                    var helpForm2 = new appMeta.HelpForm(state2, "table2", "#rootelement");
                    metapage2.helpForm  = helpForm2;
                    //  r3 è la primary[0] , e su "key1" matcha con il ds1 su r1 che ha stesso field1, quindi deve tornare false
                    metapage2.hasUnsavedChanges().then(function (result) {
                        expect(result).toBe(false);
                        done();
                    });
                });

            it('reFillControls() case lastSelectedRow = undefined',
                function (done) {

                    appMeta.common.buildDs1();
                    var ds = appMeta.common.ds1;
                    var state = new appMeta.MetaPageState();
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    metapage.helpForm  = helpForm;
                    state.meta  = new appMeta.MetaData('table1');
                    metapage.state = state;
                    var mainwin = '<div id="rootelement">' +
                        'Nome: <input type="text" id="txtBox1"  data-tag="table1.c_name" value="ric"><br>' +
                        "</div>";
                    $("html").html(mainwin);
                    spyOn(metapage, "freshToolBar").and.callThrough();

                    metapage.reFillControls().then(function (result) {
                            expect(metapage.freshToolBar).toHaveBeenCalled();
                            expect($("#txtBox1").val()).toBe(""); // il valore rimane quello che era, non c'è selezionata nessuna row
                            done();
                        },
                        function (error) {
                            expect(error).toBeDefined();
                            done();
                        });
                });

            it('reFillControls() case lastSelectedRow defined',
                function (done) {

                    appMeta.common.buildDs1();
                    var ds = appMeta.common.ds1;
                    var t1 = appMeta.common.t1;
                    var objrow1 = appMeta.common.objrow1;
                    var objrow2 = appMeta.common.objrow2;

                    var state = new appMeta.MetaPageState();
                    state.meta  = new appMeta.MetaData('table1');
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    helpForm.lastSelected(t1, objrow2);
                    metapage.helpForm  = helpForm;
                    metapage.state = state;

                    var mainwin = '<div id="rootelement">' +
                        'Nome: <input type="text" id="txtBox1"  data-tag="table1.c_name" value="ric"><br>' +
                        "</div>";
                    $("html").html(mainwin);
                    spyOn(metapage, "freshToolBar").and.callThrough();

                    metapage.reFillControls().then(function (result) {
                            expect(metapage.freshToolBar).toHaveBeenCalled();
                            expect($("#txtBox1").val()).toBe("nome2"); // il valore viene fillato con quello del dataTable, è sstata effettuata la lastSelected
                            done();
                        },
                        function (error) {
                            expect(error).toBeDefined();
                            done();
                        });
                });

            it('reFillControls() case lastSelectedRow defined, and mock of function BeforeFill()',
                function (done) {

                    appMeta.common.buildDs1();
                    var ds = appMeta.common.ds1;
                    var t1 = appMeta.common.t1;
                    var objrow1 = appMeta.common.objrow1;
                    var objrow2 = appMeta.common.objrow2;

                    var state = new appMeta.MetaPageState();
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    helpForm.lastSelected(t1, objrow2);
                    metapage.helpForm  = helpForm;
                    state.meta  = new appMeta.MetaData('table1');
                    metapage.state = state;
                    var myStringResult = "result function";
                    // mock funz BeforeFill, cambio valore della riga selzionataad esempio
                    metapage.beforeFill = function () {
                        t1.rows[1].c_name = myStringResult;
                        return Deferred("BeforeFill").resolve();
                    }

                    var mainwin = '<div id="rootelement">' +
                        'Nome: <input type="text" id="txtBox1"  data-tag="table1.c_name" value="ric"><br>' +
                        "</div>";
                    $("html").html(mainwin);
                    spyOn(metapage, "freshToolBar").and.callThrough();

                    metapage.reFillControls().then(function (result) {
                            expect(metapage.freshToolBar).toHaveBeenCalled();
                            expect($("#txtBox1").val()).toBe(myStringResult); // viene fatto il fill con il valore lavorato nella BeforeFill, poichè modifica proprio ildt sorgente
                            done();
                        },
                        function (error) {
                            expect(error).toBeDefined();
                            done();
                        });
                });

            it('reFillControls() case lastSelectedRow defined, and mock of function BeforeFill() and AfterFill()',
                function (done) {

                    appMeta.common.buildDs1();
                    var ds = appMeta.common.ds1;
                    var t1 = appMeta.common.t1;
                    var objrow1 = appMeta.common.objrow1;
                    var objrow2 = appMeta.common.objrow2;

                    var state = new appMeta.MetaPageState();
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    helpForm.lastSelected(t1, objrow2);
                    metapage.helpForm  = helpForm;
                    state.meta  = new appMeta.MetaData('table1');
                    metapage.state = state;
                    var myStringResult = "result function";
                    // mock funz BeforeFill, cambio valore della riga selzionataad esempio
                    metapage.beforeFill = function () {
                        t1.rows[1].c_name = myStringResult;
                        return Deferred("BeforeFill").resolve();
                    }

                    metapage.afterFill = function () {
                        t1.rows[1].c_name = "AfterFillValue";
                        return Deferred("AfterFill").resolve();
                    }

                    var mainwin = '<div id="rootelement">' +
                        'Nome: <input type="text" id="txtBox1"  data-tag="table1.c_name" value="ric"><br>' +
                        "</div>";
                    $("html").html(mainwin);
                    spyOn(metapage, "freshToolBar").and.callThrough();

                    metapage.reFillControls().then(function (result) {
                            expect(metapage.freshToolBar).toHaveBeenCalled();
                            expect($("#txtBox1").val()).toBe(myStringResult);// il valore viene fillato con quello del dataTable,modificato sulla BeforeFill()
                            expect(t1.rows[1].c_name).toBe("AfterFillValue"); // osservo se viene fatta la AfterFill()
                            done();
                        },
                        function (error) {
                            expect(true).toBe(false);
                            done();
                        });
                });

            it('callMethod() called with function object',
                function (done) {
                    var myStringResult = "result function";

                    var f  = function () {
                        return Deferred("f").resolve(myStringResult);
                    }
                    metapage.callMethod(f).then(function (result) {
                            expect(result).toBe(myStringResult);
                            done();
                        },
                        function (error) {
                            expect(true).toBe("false");
                            done();
                        });
                });

            it('callMethod() called with string name of function',
                function (done) {
                    var myStringResult = "result function";

                    metapage.f  = function () {
                        return Deferred("f").resolve(myStringResult);
                    }
                    metapage.callMethod("f").then(function (result) {
                            expect(result).toBe(myStringResult);
                            done();
                        },
                        function () {
                            expect(true).toBe("false");
                            done();
                        });
                });

            it('getRowFromList() modifies newRow as expected',
                function () {

                    var c_name = "c_name";
                    var c_dec = "c_dec";
                    var c_age = "c_age";
                    var c_double = "c_double";
                    var ds = new jsDataSet.DataSet("temp");
                    var t1 = ds.newTable("table1");
                    t1.setDataColumn(c_name, "String");
                    t1.setDataColumn(c_dec, "Decimal");
                    t1.setDataColumn(c_double, "Double");
                    t1.setDataColumn(c_age, "Single");

                    var objrow1 = { c_name: "nome1", c_dec: 11, c_double: 2001 , c_age :1};
                    var objrow2 = { c_name: "nome2", c_dec: 22, c_double: 2002 , c_age :2};
                    var objrow3 = { c_name: "nome3", c_dec: null, c_double: 2003, c_age :3 };
                    var objrow4 = { c_name: "nome4", c_dec: null, c_double: 2004, c_age :4 };
                    var objrow5 = { c_name: "nome5", c_dec: 55, c_double: 2003, c_age :5 };
                    var objrow6 = { c_name: "nome3", c_dec: null, c_double: 2003, c_age :6 };

                    // aggiungo righe tab 1
                    t1.add(objrow1);
                    t1.add(objrow2);
                    t1.add(objrow3);
                    t1.add(objrow4);
                    t1.add(objrow5);
                    t1.add(objrow6);
                    t1.key(["c_name", "c_double"]);

                    var  newRow = t1.newRow();

                    var res = metapage.getRowFromList(objrow1.getRow(), newRow.getRow());
                    expect(res).toBe(true);
                    expect(newRow[c_name]).toBe("nome1");
                    expect(newRow[c_dec]).toBe(11);
                    expect(newRow[c_double]).toBe(2001);
                });
            

            it('checkEntityChildRowAdditions(row, undefined) makes childrow as parent and set notEntityChild undefined (primary key === cols of relation)',
                function () {
                    var ds = new jsDataSet.DataSet("temp2");
                    var table1 = ds.newTable("table1");
                    var table2 = ds.newTable("table2");

                    table1.setDataColumn("key", "String");
                    table1.setDataColumn("field1", "String");
                    table1.setDataColumn("age", "Int32");
                    table1.setDataColumn("lookupValue", "String");

                    table2.setDataColumn("key", "String");
                    table2.setDataColumn("other_field", "String");
                    table2.setDataColumn("lookupValueString", "String");

                    var r1 = {key: "key1", field1: "f1", age : 1, lookupValue : ""};
                    var r2 = {key: "key2", field1: "f2", age : 2, lookupValue : ""};
                    var r3 = {key: "key3", field1: "f3", age : 3, lookupValue : ""};
                    table1.add(r1);
                    table1.add(r2);
                    table1.add(r3);

                    var r4 = {key: "key0", other_field: "o1", lookupValueString: "quattro"};
                    var r5 = {key: "key2", other_field: "o2", lookupValueString: "cinque"};
                    var r6 = {key: "key4", other_field: "v1", lookupValueString: "sei"};
                    var r7 = {key: "key5", other_field: "v2", lookupValueString: "sette"};
                    table2.add(r4);
                    table2.add(r5);
                    table2.add(r6);
                    table2.add(r7);

                    // imposto la chiave
                    table1.key("key");
                    table2.key("key");

                    ds.newRelation("rel1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key

                    var state = new appMeta.MetaPageState();
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    helpForm.lastSelected(table1, r1);
                    metapage.helpForm  = helpForm;
                    metapage.primaryTable = table1;
                    metapage.state = state;

                    expect(r4["key"]).not.toBe(r1["key"]);
                    metapage.checkEntityChildRowAdditions(r4.getRow());
                    expect(r4["key"]).toBe(r1["key"]); // make child as parent
                    expect(table2.notEntityChild.myName).toBe("constant"); // poichè le colonne della rel sono tutte primaryKey

                });

            it('checkEntityChildRowAdditions(row, rel) makes childrow as parent and set notEntityChild undefined (primary key === cols of relation)',
                function () {
                    var ds = new jsDataSet.DataSet("temp2");
                    var table1 = ds.newTable("table1");
                    var table2 = ds.newTable("table2");

                    table1.setDataColumn("key", "String");
                    table1.setDataColumn("field1", "String");
                    table1.setDataColumn("age", "Int32");
                    table1.setDataColumn("lookupValue", "String");

                    table2.setDataColumn("key", "String");
                    table2.setDataColumn("other_field", "String");
                    table2.setDataColumn("lookupValueString", "String");

                    var r1 = {key: "key1", field1: "f1", age : 1, lookupValue : ""};
                    var r2 = {key: "key2", field1: "f2", age : 2, lookupValue : ""};
                    var r3 = {key: "key3", field1: "f3", age : 3, lookupValue : ""};
                    table1.add(r1);
                    table1.add(r2);
                    table1.add(r3);

                    var r4 = {key: "key0", other_field: "o1", lookupValueString: "quattro"};
                    var r5 = {key: "key2", other_field: "o2", lookupValueString: "cinque"};
                    var r6 = {key: "key4", other_field: "v1", lookupValueString: "sei"};
                    var r7 = {key: "key5", other_field: "v2", lookupValueString: "sette"};
                    table2.add(r4);
                    table2.add(r5);
                    table2.add(r6);
                    table2.add(r7);

                    // imposto la chiave
                    table1.key("key");
                    table2.key("key");

                    ds.newRelation("rel1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key

                    var state = new appMeta.MetaPageState();
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    helpForm.lastSelected(table1, r1);
                    metapage.helpForm  = helpForm;
                    metapage.primaryTable = table1;
                    metapage.state = state;

                    expect(r4["key"]).not.toBe(r1["key"]);
                    metapage.checkEntityChildRowAdditions(r4.getRow(), "rel1");
                    expect(r4["key"]).toBe(r1["key"]); // make child as parent
                    expect(table2.notEntityChild).toBeUndefined(); // poichè le colonne della rel sono tutte primaryKey

                });

            it('checkEntityChildRowAdditions(row, rel) makes childrow as parent and set notEntityChild to a jsDataQuery (primary key !== cols of relation)',
                function () {
                    var ds = new jsDataSet.DataSet("temp2");
                    var table1 = ds.newTable("table1");
                    var table2 = ds.newTable("table2");

                    table1.setDataColumn("key", "String");
                    table1.setDataColumn("field1", "String");
                    table1.setDataColumn("age", "Int32");
                    table1.setDataColumn("lookupValue", "String");

                    table2.setDataColumn("key", "String");
                    table2.setDataColumn("other_field", "String");
                    table2.setDataColumn("lookupValueString", "String");
                    table2.setDataColumn("field1", "String");

                    var r1 = {key: "key1", field1: "f1", age : 1, lookupValue : ""};
                    var r2 = {key: "key2", field1: "f2", age : 2, lookupValue : ""};
                    var r3 = {key: "key3", field1: "f3", age : 3, lookupValue : ""};
                    table1.add(r1);
                    table1.add(r2);
                    table1.add(r3);

                    var r4 = {key: "key0", other_field: "o1", lookupValueString: "quattro", field1: "f4"};
                    var r5 = {key: "key5", other_field: "o2", lookupValueString: "cinque", field1: "f5"};
                    var r6 = {key: "key6", other_field: "v1", lookupValueString: "sei", field1: "f6"};
                    var r7 = {key: "key7", other_field: "v2", lookupValueString: "sette", field1: "f7"};
                    table2.add(r4);
                    table2.add(r5);
                    table2.add(r6);
                    table2.add(r7);

                    // imposto la chiave
                    table1.key("key");
                    table2.key("key");

                    ds.newRelation("rel1", "table1", ["key","field1"], "table2", ["key","field1"]); // relazione tra table 1 e 2 su key

                    var state = new appMeta.MetaPageState();
                    state.DS  = ds;
                    var helpForm = new HelpForm(state, "table1", "#rootelement");
                    helpForm.lastSelected(table1, r1);
                    metapage.helpForm  = helpForm;
                    metapage.primaryTable = table1;
                    metapage.state = state;

                    expect(r4["key"]).not.toBe(r1["key"]);
                    metapage.checkEntityChildRowAdditions(r4.getRow(), "rel1");
                    expect(r4["key"]).toBe(r1["key"]); // make child as parent
                    expect(table2.notEntityChild).toBeDefined(); // poichè la colonna field1 non è primaryKey

                });

            it('fnMethod() passed in then() simulate function(){}',
                function () {

                    var res = "";
                    var mymethodA = function () {
                        res = "a";
                        return Deferred().resolve(res).promise();
                    }
                    var mymethodB = function () {
                        res = "b";
                        return Deferred().resolve(res).promise();
                    }

                    mymethodA().then(metapage.fnMethod(mymethodB))
                        .then(function () {
                            expect(res).toBe("b");
                        });
                });

            it('fnMethod() passed in then() simulate function(){} with more complex function',
                function () {

                    var res = "";
                    var mymethodA = function () {
                        res = "a";
                        return Deferred().resolve(res).promise();
                    }
                    var mymethodB = function () {
                        res = "b";
                        var def = $.Deferred();
                        appMeta.utils._if(false)
                            ._then(function () {
                                return Deferred().resolve(res);
                            })
                            .then(function () {
                                res = "e";
                                return def.resolve(res);
                            })

                        return def.promise();
                    }

                    var mymethodC = function () {
                        res = "c";
                        return Deferred().resolve(res).promise();
                    }

                    mymethodA()
                        .then(metapage.fnMethod(mymethodB))
                        .then(metapage.fnMethod(mymethodC))
                        .then(function (data) {
                            expect(data).toBe("c");
                        });
                });

            it('MetaPage settingCallingPage() copy parent state to calledPage state + copy callingParameters',
                function () {
                    metapage.state  = state1;
                    metapage.state.toInherit.mainSelectionEnabled  = true;
                    metapage.state.toInherit.searchEnabled  = false;
                    metapage.state.toInherit.startFilter  = {filter:"aaa"};

                    // check preliminari
                    expect(metapage2.mainSelectionEnabled).toBe(false);
                    expect(metapage2.searchEnabled).toBe(true);
                    expect(metapage2.startFilter).toBe(null);

                    // invoco il metodo
                    metapage.setCallingPage(metapage2, false);

                    expect(metapage.state.callerState).toBeNull();
                    expect(metapage2.state.callerState).toEqual(metapage.state);

                    // verifico che i callingParameters vengano copiati
                    expect(metapage2.mainSelectionEnabled).toBe(true);
                    expect(metapage2.searchEnabled).toBe(false);
                    expect(metapage2.startFilter).toEqual({filter:"aaa"});
                });

            it('unlinkDataRow() unlinks dataRow, Unlinks R from parent-child relation with primary table',
                function () {
                    var ds = new jsDataSet.DataSet("temp1");
                    var t1 = ds.newTable("table1");
                    var t2 = ds.newTable("table2");
                    ds.newRelation("r1", "table1", ["key", "field1"], "table2", ["key", "field1"]);

                    // setto le prop delle colonne per t1
                    t1.setDataColumn("key", "String");
                    t1.setDataColumn("field1", "String");

                    t2.setDataColumn("key", "String");
                    t2.setDataColumn("otherkey", "String");
                    t2.setDataColumn("field1", "String");

                    var r1 = { key: "key1", field1: "f1" };
                    var r2 = { key: "key2", field1: "f2" };
                    t1.add(r1);
                    t1.add(r2);
                    t1.acceptChanges();

                    var r3 = { key: "key1", otherkey: "otherkey1", field1: "f3" };
                    var r4 = { key: "key2", otherkey: "otherkey2", field1: "f4" };
                    var r5 = { key: "key2", otherkey: "otherkey3", field1: "f5" };
                    t2.add(r3);
                    t2.add(r4);
                    t2.add(r5);

                    // imposto la chiave
                    t1.key("key");
                    t2.key(["key","otherkey"]);
                    t2.acceptChanges();

                    metapage.unlinkDataRow(t1, r3.getRow());
                    expect(r3.getRow()).toBeDefined();
                });

            it('canRecache() returns false case 1: It doesn\'t allow Clear' ,
                function () {
                    var t = state1.DS.tables.table1;
                    appMeta.metaModel.allowClear(t, false);
                    var canrecache =  metapage.canRecache(t);
                    expect(canrecache).toBeFalsy();
                });

            it('canRecache() returns false case 2: It is primaryTable ' ,
                function () {
                    var t = state1.DS.tables.table1;
                    appMeta.metaModel.allowClear(t, true);
                    var canrecache =  metapage.canRecache(t);
                    expect(canrecache).toBeFalsy();
                });
            
            it('canRecache() returns false case 3: t2 is subentity of primary table' ,
                function () {
                    metapage.state = state1;
                    var t2 = state1.DS.newTable("table2");
                    var t1 = state1.DS.tables.table1;

                    // setto le prop delle colonne per t1
                    t2.setDataColumn("key", "String");
                    t2.setDataColumn("field1", "String");

                    // t2 subentity tutte le colonne relazioni sotto comprese nella chiave di t1 e sono chaivi esse stesse
                    t1.key(["key", "field1"]);
                    t2.key(["key", "field1"]);

                    state1.DS.newRelation("r1", "table1", ["key", "field1"], "table2", ["key", "field1"]);

                    appMeta.metaModel.allowClear(t2, true);
                    var canrecache =  metapage.canRecache(t2);
                    expect(canrecache).toBeFalsy();
                });

            it('canRecache() returns true case 4: t2 is not subentity of primary table and allows Clear' ,
                function () {
                    metapage.state = state1;
                    var t2 = state1.DS.newTable("table2");
                    var t1 = state1.DS.tables.table1;

                    // setto le prop delle colonne per t1
                    t2.setDataColumn("key", "String");
                    t2.setDataColumn("field2", "String");

                    // t2 non subentity perch+ non tutte le colonne relazioni sotto comprese nella chiave di t1 e sono chaivi esse stesse
                    t1.key(["key", "field1"]);
                    t2.key(["key", "field2"]);

                    state1.DS.newRelation("r1", "table1", ["key"], "table2", ["key"]);

                    appMeta.metaModel.allowClear(t2, true);
                    var canrecache =  metapage.canRecache(t2);
                    expect(canrecache).toBeTruthy();
                });

            it('isEmpty() returns true or false depending on rows on primary table' ,
                function () {
                    metapage.state = state1;
                    var isEmpty =  metapage.isEmpty();
                    var t1 = state1.DS.tables.table1;
                    expect(t1.rows.length).toBeGreaterThan(0);
                    expect(isEmpty).toBeFalsy();
                    
                    // svuoto le righe
                    t1.clear();
                    isEmpty =  metapage.isEmpty();
                    expect(t1.rows.length).toBe(0);
                    expect(isEmpty).toBeTruthy();

                });

            it('show() returns a deferred',
                function (done) {
                    metapage.show().then(function () {
                        done();
                    });

                });
        })
});
