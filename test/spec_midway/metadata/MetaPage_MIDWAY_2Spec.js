'use strict';

describe('MetaPage with Clock', function () {
    var MetaPage = appMeta.MetaPage;
    var localResource = appMeta.localResource;
    var metapage;
    var metapage2, state1, state2, r1,r2, r3, r4, r5, r6;
    var q = window.jsDataQuery;
    var common = appMeta.common;

    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec_midway/fixtures';
        appMeta.basePath = "base/";
        appMeta.dbClickTimeout = 1;
        
        metapage = new MetaPage('table1', 'table1_def.json', false);

        // costrusico oggetto stato e ds per testare i metodi che fanno operazioni con il dataset
        state1 = new appMeta.MetaPageState();
        state2 = new appMeta.MetaPageState();
        var ds1 = new jsDataSet.DataSet("temp1");
        var ds2 = new jsDataSet.DataSet("temp2");
        var t1ds1 = ds1.newTable("table1");

        var t1ds2 = ds2.newTable("table1");
        var t2ds2 = ds2.newTable("table2");

        // setto le prop delle colonne per t1
        t1ds1.setDataColumn("key", "String");
        t1ds1.setDataColumn("field1", "String");

        t1ds2.setDataColumn("key", "String");
        t1ds2.setDataColumn("field1", "String");

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

        r5 = {key: "key3", field1: "f5"};
        // r6 = {key: "key2", field1: "f6"};
        t1ds2.add(r5);
        // t1ds2.add(r6);

        // imposto la chiave
        t1ds1.key("key");
        t2ds2.key("key");
        t1ds2.key("key");
        state1.DS = ds1;
        state1.editedRow = r1.getRow();

        metapage.state = state1;

        state2.DS = ds2;
        state2.callerState = state1;
        state2.setInsertState();
        state2.currentRow = r3;
        state2.meta  = new appMeta.MetaData('table2');

        // inizializzo metapage, usata in AddEvents
        metapage2 = new MetaPage('table2', 'def', true);
        metapage2.state = state2;
        var helpForm2 = new appMeta.HelpForm(state2, "table2", "#rootelement");
        metapage2.helpForm  = helpForm2;
    });
    afterEach(function () {
        appMeta.basePath = "/";
        metapage = null;
    });

    describe("MetaPage class",
        function () {

            describe("IsValid Methods ",
                function () {
                    var mp;
                    var objrow1, objrow2, objrow3, objrow4 ;
                    beforeEach(function () {
                        
                        // svuoto html per sicurezza ad ogni test. Serve per esempio a ripulire le messageBox aperte eventuli
                        $("html").html("");
                        
                        var emptyKeyMsg = localResource.emptyKeyMsg;
                        var emptyFieldMsg = localResource.emptyFieldMsg;

                        var ds = new jsDataSet.DataSet("temp");
                        var t = ds.newTable("t");

                        t.setDataColumn("Code", "Single");
                        t.setDataColumn("Name", "String");
                        t.setDataColumn("City", "String");
                        t.setDataColumn("Born", "DateTime");
                        t.setDataColumn("Age", "Int32");

                        t.columns["Code"].allowDbNull = false;
                        t.columns["Name"].allowDbNull = false;
                        t.columns["City"].allowDbNull = false;
                        t.columns["Born"].allowDbNull = false;
                        t.columns["Age"].allowDbNull = false;

                        t.columns["City"].maxstringlen = 10;
                        t.columns["Code"].allowZero = false;


                        t.key(["Code", "Name"]);

                        objrow1 = { "Code": 1, "Name": "uno", "City":"Roma", "Born":new Date("1980-10-02"), "Age": 30};
                        objrow2 = { "Code": 0, "Name": "due", "City":"Napoli", "Born":new Date("1981-10-02"), "Age": 40};
                        objrow3 = { "Code": 3, "Name": "tre", "City":"Bari", "Born":new Date("1000-01-01"), "Age": 50};
                        objrow4 = { "Code": 4, "Name": "quattro", "City":"Caltanissetta", "Born":new Date("1983-10-02"), "Age": 60}; // nome città lungo
                        t.add(objrow1);
                        t.add(objrow2);
                        t.add(objrow3);
                        t.add(objrow4);

                        var s = new appMeta.MetaPageState();
                        var meta = new appMeta.MetaData();
                        s.meta = meta;
                        s.DS = ds;
                        var helpForm = new appMeta.HelpForm(s, "t", "#rootelement");
                        mp = new MetaPage('t', 'def', true);
                        mp.helpForm  = helpForm;
                        mp.state = s;
                    });

                    it( 'manageValidResults, 1 row ok', function (done) {
                        spyOn(mp, "showMessageOkCancel");
                        spyOn(mp, "showMessageOk");
                        mp.manageValidResults([objrow1.getRow()])
                            .then(function (res) {
                                // ENTRA SOLO in DEBUG
                                expect(res).toBeTruthy();
                              
                            });
                        
                        expect(mp.showMessageOkCancel).not.toHaveBeenCalled();
                        expect(mp.showMessageOk).not.toHaveBeenCalled();

                        done();
                    });

                    it( 'manageValidResults, 1 row nok, shows one MessageBox', function (done) {
                        expect($(".modal").length).toBe(0); // non c'è la messagebox di loading della metapage
                        
                        
                        common.eventWaiter(mp, appMeta.EventEnum.showModalWindow)
                            .then(function () {
                                expect($(".modal").length).toBe(1); // c'è una messagebox
                                $(".modal").find("button")[0].click();
                            });

                        var p = mp.manageValidResults([objrow2.getRow()])
                            .then(function (res) {
                                // ENTRA SOLO in DEBUG se si preme ok sulla message box
                                expect(res).toBeFalsy();
                                done();
                            });
                        expect(p.promise).toBeDefined();
                        //jasmine.clock().tick(1);


                    });
                   
                    it( 'manageValidResults, 3 row: 1 ok  2 nok, shows one MessageBox', function (done) {
                        expect($(".modal").length).toBe(0); // non c'è più msgBox per loading metaPage nel costruttore
                        common.eventWaiter(mp, appMeta.EventEnum.showModalWindow)
                            .then(function () {
                                expect($(".modal").length).toBe(1); // c'è una messagebox
                                $(".modal").find("button")[0].click();
                            });

                        var p = mp.manageValidResults([objrow1.getRow(), objrow2.getRow(), objrow3.getRow()])
                            .then(function (res) {
                                // ENTRA SOLO in DEBUG se si preme ok sulla message box
                                expect(res).toBeFalsy();
                                done();
                            });
                        expect(p.promise).toBeDefined();
                        
                    });

                });

            describe("Auxiliar MainToolBar command methods ",
                function () {
                    
                    it("filterList() with getPrimaryDataTable() mocked is async", function (done) {

                            var mainwin = '<div id="rootelement">' +
                                '<input type="text" id="txtBox1" data-tag="registry.cu" value="assistenza"><br>' +
                                "</div>";
                            $("html").html(mainwin);
                            
                                    // recupero ds vuoto
                                    var ds = appMeta.common.getRegistryAnagraficaMockDataSet();
                                    // inizializzo oggetti necessari
                                    metapage = new MetaPage('registry', 'anagrafica', false);
                                    var s = new appMeta.MetaPageState();
                                    s.DS = ds;
                                    s.meta  = new appMeta.MetaData('registry');

                                    metapage.state = s;
                                    var helpForm = new appMeta.HelpForm(s, "registry", "#rootelement");
                                    helpForm.pagestate = s;
                                    metapage.helpForm = helpForm;
                            
                                   var originalGetPrimaryDataTable  =  metapage.getPrimaryTable;
                                    // mock funz per evitare che sia e2e
                                    metapage.getPrimaryTable = function (filter) {
                                        this.primaryTable.add({f1: "f1"})
                                        return new $.Deferred().resolve(); 
                                    }

                                    var dt =  ds.tables['registry'];
                                    metapage.primaryTable = dt;
                                    var filter = q.eq('gender','F');
                                    //helpForm.lastSelected(t, t.rows[0]);
                                    // Testo il metodo dopo le configurazioni iniziali
                                    metapage.filterList(filter)
                                        .then(function (result) {
                                                metapage.getPrimaryTable =  originalGetPrimaryDataTable ;  
                                                expect($('#txtBox1').val()).toBe(""); // non c'è riga selezionata,  viene fatto il clear del controllo
                                                done();
                                            },
                                            function (error) {
                                                console.log(error);
                                                expect(false).toBe(true);
                                                done();
                                            });

                        });

                    it( 'getFormData() is async, case detailPage=false', function (done) {

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                            '<div id="currRootElement">' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                            '</div>' +
                            '</div>';
                        $("html").html(mainwin);
                        metapage2.getFormData(false).then(
                            function () {
                                done();
                            }
                        )

                    });

                    it( 'getFormData() is async, case detailPage=true', function (done) {

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                            '<div id="currRootElement">' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                            '</div>' +
                            '</div>';
                        $("html").html(mainwin);
                        metapage2.state.detailPage = true;
                        metapage2.getFormData(false).then(
                            function () {
                                // reset del booleano prima di terminare il test.
                                metapage2.state.detailPage = false;
                                done();
                            }
                        )

                    });

                });

            describe("MainToolBar command methods",
                function () {
                    
                    var origDoGet;
                    
                    beforeEach(function () {
                        origDoGet =  appMeta.getData.doGet;
                        appMeta.getData.doGet = function () {
                            return new $.Deferred().resolve().promise();
                        }
                    });

                    afterEach(function () {
                        appMeta.getData.doGet = origDoGet;
                    });

                   it( 'manageSelectedRow', function (done) {

                        metapage = new MetaPage('t1', 'table1_def.json', false);
                        state1 = new appMeta.MetaPageState();
                        var ds1 = new jsDataSet.DataSet("temp1");
                        var t1 = ds1.newTable("t1");

                        t1.setDataColumn("key", "String");
                        t1.setDataColumn("field1", "String");

                        r1 = {key: "key1", field1: "f1"};
                        r2 = {key: "key2", field1: "f2"};
                        t1.add(r1);
                        t1.add(r2);
                        
                        state1.DS = ds1;

                        metapage.state = state1;
                        
                        var helpForm = new appMeta.HelpForm(state1, "t1", "#rootelement");
                        metapage.helpForm  = helpForm;

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                            '<div id="currRootElement">' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                            '</div>' +
                            '</div>';
                        $("html").html(mainwin);
                        
                        metapage.manageSelectedRow(r2.getRow(), t1, false, "#currRootElement").then(
                            function () {
                                expect($("#txtBox2").val()).toBe("k2");
                                done();
                            }
                        )
                        
                    });

                   it( 'choose command, with filter=clear', function (done) {

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                                '<div id="currRootElement">' +
                                '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                                '</div>' +
                            '</div>';
                        $("html").html(mainwin);
                        
                        var filter = q.eq(q.field("key"), "key1");
                        metapage2.choose("choose.table2.unknown.clear", filter, "#currRootElement").then(
                            function () {
                                expect($("#txtBox2").val()).toBe("")
                                done();
                            }
                        )


                    });

                    // TODO. DEPRECATO spostare eventualmente nei e2e. il save va sul backend
                   xit( 'cmdMainSave is async', function (done) {

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                            '<div id="currRootElement">' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                            '</div>' +
                            '</div>';
                        $("html").html(mainwin);
                       
                        metapage2.cmdMainSave().then(
                            function () {
                                done();
                            }
                        )
                       
                    });

                   it( 'propagateChangesToMaster return boolean', function () {

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                            '</div>';
                        $("html").html(mainwin);

                       metapage = new MetaPage('table1', 'table1_def.json', false);


                       // costrusico oggetto stato e ds per testare i metodi che fanno operazioni con il dataset
                       state1 = new appMeta.MetaPageState();
                       state2 = new appMeta.MetaPageState();
                       var ds1 = new jsDataSet.DataSet("temp1");
                       var ds2 = new jsDataSet.DataSet("temp2");
                       var t1ds1 = ds1.newTable("table1");

                       var t1ds2 = ds2.newTable("table1");
                       var t2ds2 = ds2.newTable("table2");

                       // setto le prop delle colonne per t1
                       t1ds1.setDataColumn("key", "String");
                       t1ds1.setDataColumn("field1", "String");

                       t1ds2.setDataColumn("key", "String");
                       t1ds2.setDataColumn("field1", "String");

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
                       t1ds1.acceptChanges();

                       r3 = {key: "key1", field1: "f3"};
                       r4 = {key: "key2", field1: "f2"};
                       t2ds2.add(r3);
                       t2ds2.add(r4);
                       t2ds2.acceptChanges();

                       r5 = {key: "key1", field1: "f5"}; // questa è la riga che sta sul dettagglio, setto 1 riga
                       // r6 = {key: "key2", field1: "f6"};
                       t1ds2.add(r5);
                       t1ds2.acceptChanges();

                       // imposto la chiave
                       t1ds1.key("key");
                       t2ds2.key("key");
                       t1ds2.key("key");
                       state1.DS = ds1;
                       state1.editedRow = r1.getRow();

                       metapage.state = state1;

                       state2.DS = ds2;
                       state2.callerState = state1;
                       state2.currentRow = r3;
                       state2.meta  = new appMeta.MetaData('table2');

                       // inizializzo metapage, usata in AddEvents
                       metapage2 = new MetaPage('table2', 'def', true);
                       metapage2.state = state2;

                       // check prima invocazione emtodo
                       var rows =  ds1.tables.table1.select(q.eq("key", "key1"))
                       expect(rows[0]["field1"]).toBe("f1");

                       // la riga sel è r1, che èanche sul ds deldettaglio, con valore cambiato, quindi mi aspetto che il nuovo valore venga propagato
                       metapage2.propagateChangesToMaster().then(
                            function (res) {
                                expect(t1ds1.rows.length).toBe(2);
                                var rows =  ds1.tables.table1.select(q.eq("key", "key1"))
                                expect(rows[0]["field1"]).toBe("f5");
                                expect(ds2.tables.table1.rows.length).toBe(0); // TODO è giusto che la riga non sia più presente sul ds dettaglio??
                                expect(res).toBe(true);
                            })
                       
                    });
                    
                   xit( 'choose command, with filter=notclear', function (done) {

                        var mainwin = '<div id="rootelement">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table2.key" value="k1"><br>' +
                            '<div id="currRootElement">' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table2.key" value="k2"><br>' +
                            '</div>' +
                            '</div>';
                        $("html").html(mainwin);

                        var filter = q.eq(q.field("key"), "key1");
                        metapage2.choose("choose.table2.unknown.notclear", filter, "#currRootElement").then(
                            function () {
                                expect($("#txtBox2").val()).toBe("")
                                done();
                            }
                        )


                    });

                });
            
        });
});
