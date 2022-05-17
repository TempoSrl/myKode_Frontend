'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */

describe('MetaPage', function () {
    var MetaPage = appMeta.MetaPage;
    var HelpForm = appMeta.HelpForm;
    var metapage;
    var metapage2, state1, state2, r1,r2, r3, r4 ;
    var stabilizeToCurrent = appMeta.stabilizeToCurrent;
    var Deferred = appMeta.Deferred;
   
    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
        appMeta.basePath = "base/";
      
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
        var helpForm2 = new HelpForm(state2, "table2", "#rootelement");
        metapage2.helpForm  = helpForm2;

        metapage.state = state1;

        // eseguo mock della funzione assureDataSet. andrebbe su db. fare nei test su e2e senza mock
        metapage.assureDataSet = function () {
            var res = Deferred("assureDataSetOverwritten");
            var d = new jsDataSet.DataSet("temp");
            this.setDataSet(d);
            res.resolve(d);
            return res.resolve(d).promise();
        };
    });
    
    afterEach(function () {
        metapage = null;
    });

    describe("MetaPage class",
        function () {
            
            describe("Init Methods ",
                function () {
                    
                    it('assureDataSet() should be async',
                        function (done) {
                            // state è vuoto quindi entra nel ramo rejected
                            metapage.assureDataSet().then(function (result) {
                                expect(result).toBeDefined();
                                done();
                            },
                            function (error) {
                                expect(error).toBeDefined();
                                done();
                            });
                        });

                    it('assureDataSet() should be async and returns a DataSet',
                        function (done) {
                            // costruisco uno stato
                            var s = new appMeta.MetaPageState();
                            metapage.state = s;

                            metapage.assureDataSet().then(function (result) {
                                expect(result.constructor.name).toBe("DataSet");
                                done();
                            },
                                function (error) {
                                    console.log(error);
                                    expect(error).toBeDefined();
                                    done();
                                });
                        });
                 
                    it('init should be async',
                        function (done) {
                            metapage.init().then(function (result) {
                                // Deve essere definito, cioè la promise mi deve tornare qualcosa
                                expect(result).toBeDefined();
                                done();
                            });

                        });

                    it('init should be async and returns MetaPage',
                        function (done) {
                            metapage.init().then(function (result) {
                                expect(result.constructor.name).toBe("MetaPage");
                                done();
                            });

                        });

                    it('after init() and assurePageState(), state should be compliant with the changes ',
                        function (done) {
                            metapage.init().then(function (result) {
                                // N.B result è un istanza di MetaPage
                                // eseguo un cambio di un prm dello state
                                metapage.state.DS.name = "myds";
                                metapage.state.wantsRow = true;
                                
                                metapage.assurePageState().then(function (result) {
                                    expect(result.DS.name).toBe("myds");
                                    expect(result.wantsRow).toBe(true);
                                    done();
                                });

                            });

                        });
                    
                    it('add dependencies and formula cascade',
                        function (done) {

                            var metapageDip = new MetaPage('t1', 'table1_def.json', false);

                            // costrusico ogetto stato e ds
                            var ds = new jsDataSet.DataSet("temp");
                            var t1 = ds.newTable("t1");
                            t1.setDataColumn("int1", "Int32");
                            t1.setDataColumn("int2", "Int32");
                            t1.setDataColumn("string1", "String");
                            t1.setDataColumn("int4", "Int32");

                            // aggiungo 1 riga alla t1
                            var objrow1 = { "int1": 1980, "int2": 1981, "string1" : "1891", "int4": 1982 };
                            t1.add(objrow1);
                            // costrusico ogetto stato e ds
                            var state = new appMeta.MetaPageState();
                            state.DS = ds;
                            var  helpForm2 = new HelpForm(state, "t1", "#rootelement");
                            // seleziono anche la lastSelected.
                            helpForm2.lastSelected(t1, objrow1);
                            metapageDip.helpForm = helpForm2;
                            metapageDip.state = state;


                            var mainwin = '<div id="rootelement">' +
                                'Anno: <input type="text" id="txtBox1" data-tag="t1.int1" value="1980"><br>' +
                                'Anno + 1: <input type="text" id="txtBox2" data-tag="t1.int2"><br>' +
                                'Anno inverso: <input type="text" id="txtBox3"  data-tag="t1.string1"><br>' +
                                'Anno + 1,2 cifre: <input type="text" id="txtBox4" data-tag="t1.int4" ><br>' +
                                "</div>";
                            $("html").html(mainwin);

                            metapageDip.addDependencies($("#txtBox1"), $("#txtBox2"));
                            metapageDip.addDependencies($("#txtBox1"), $("#txtBox3"));
                            metapageDip.addDependencies($("#txtBox2"), $("#txtBox4"));

                            // dichiaro funzioni formula
                            var fntxt2 = function(row){
                                var val = row["int1"];
                                return parseInt(val) + 1;
                            }
                            var fntxt3 = function(row){
                                var val = row["int1"];
                                return val.toString().split("").reverse().join("");
                            }
                            var fntxt4 = function(row){
                                var val = row["int2"];
                                return parseInt(val) + 1;
                            }

                            // registro le funzioni formula
                            metapageDip.registerFormula($("#txtBox2"), fntxt2);
                            metapageDip.registerFormula($("#txtBox3"), fntxt3);
                            metapageDip.registerFormula($("#txtBox4"), fntxt4);
                            
                            var s = stabilizeToCurrent();
                            // eseguo perdita di focus
                            $("#txtBox1").blur();
                            s.then(function () {
                                expect($("#txtBox1").val()).toBe("1980");
                                expect($("#txtBox2").val()).toBe("1981"); // fntxt2 somma 1
                                expect($("#txtBox3").val()).toBe("0891"); // fntxt3 effettua la reverse 
                                expect($("#txtBox4").val()).toBe("1982"); // fntxt4, somma 1 a 1981 del txt2
                                done();
                             });
                            
                        });
                    
                    it('activate() is Async, doActivation_EmptyMain is mocked',
                        function(done) {
                            // costruisco uno stato
                            var s = new appMeta.MetaPageState();
                            s.meta = new appMeta.MetaData('table1')
                            metapage.state = s;
                            
                            // ultimo metodo chiamato, nella catena di then()
                            spyOn(metapage, "doOptionalMainDoSearch").and.callThrough();

                            var origindoActivation_EmptyMain = metapage.doActivation_EmptyMain;
                            metapage.doActivation_EmptyMain = function () {
                                return Deferred('doActivation_EmptyMain').resolve().promise();
                            };

                            var originDoPrefill = metapage.doPreFill;
                            metapage.doPreFill = function () {
                                return Deferred('doPreFill').resolve().promise();
                            }
                            
                            metapage.init().then(function (result) {
                                metapage.activate().then(function () {
                                        expect(metapage.doOptionalMainDoSearch).toHaveBeenCalled();
                                        metapage.doActivation_EmptyMain  =origindoActivation_EmptyMain;
                                        metapage.doPreFill = originDoPrefill;
                                        done();
                                    },
                                    function (error) {
                                        expect(true).toBe(false);
                                        metapage.doActivation_EmptyMain  =origindoActivation_EmptyMain;
                                        metapage.doPreFill = originDoPrefill;
                                        done();
                                    });
                            });



                        }, 2000);

                    it('editNewCopy() is Async and copy row selected and children (Deep-copy),',
                        function(done) {
                            var mainDiv = '<div id="rootelement">' +
                                't1-key: <label id="l1"  data-tag="table1.key"></label><br>' +
                                't1-field1:<label id="l2" data-tag="table1.field1"></label><br>' +
                                't2-key: <label id="l3" data-tag="table2.key"></label><br>' +
                                't2-other_field: <label id="l4" data-tag="table2.other_field"></label><br>' +
                                "</div>";
                            $("html").html(mainDiv);

                            var ds1 = new jsDataSet.DataSet("temp1");
                            var t1 = ds1.newTable("table1");
                            var t2 = ds1.newTable("table2");
                            
                            // setto le prop delle colonne per t1
                            t1.setDataColumn("key", "String");
                            t1.setDataColumn("field1", "String");
                            t2.setDataColumn("key", "String");
                            t2.setDataColumn("other_field", "String");
                            
                            ds1.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key

                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"}; // riga selezionata. ha 2 child su t2
                            var r3 = {key: "key3", field1: "f3"};
                            var r9 = {key: "key4", field1: "v1"};
                            var r12 = {key: "key5", field1: "v2"};

                            t1.add(r1);
                            t1.add(r2);
                            t1.add(r3);
                            t1.add(r9);
                            t1.add(r12);
                            t1.acceptChanges();
                            var r5 = {key: "key1", other_field: "o1"};
                            var r6 = {key: "key2", other_field: "o2"}; // child 1 di r2
                            var r6bis = {key: "key2", other_field: "o2bis"}; // child 2 di r2
                            var r11 = {key: "key4", other_field: "v1"};
                            var r14 = {key: "key5", other_field: "v2"};
                            t2.add(r5);
                            t2.add(r6);
                            t2.add(r6bis);
                            t2.add(r11);
                            t2.add(r14);
                            t2.acceptChanges();
                            // imposto la chiave
                            t1.key("key");
                            t2.key("key","other_field");
                            var meta = new appMeta.MetaData("table1");
                            state1.DS = ds1;
                            state1.meta = meta;

                            var meta2 = new appMeta.MetaData("table2");
                            appMeta.addMeta("table2", meta2);

                            var keyNewRow = 'key10';

                            // ************ INIZIO mock funz e2e *********************
                            // mock funz getNewRow
                            meta.getNewRow = function() {
                                var res = Deferred("getNewRowMocked");
                                var rnew = {key: keyNewRow, field1: "fnew"};
                                t1.add(rnew);
                                return res.resolve(rnew.getRow());
                            };

                            meta.getNewRowCopyChilds = function() {
                                var res = Deferred("getNewRowCopyChilds");
                                return res.resolve();
                            };

                            // mock funz getNewRow
                            meta2.getNewRow = function() {
                                var res = Deferred("getNewRowMocked");
                                var rnd = Math.floor(Math.random() * 101); // metto un random altrimenti la chiave non mi fa inserire 2 righe e il test fallisce
                                var rnew = {key: keyNewRow, other_field: "valuenew"+rnd.toString()};
                                t2.add(rnew);
                                return res.resolve(rnew.getRow())
                            };

                            appMeta.getData.doGet = function () {
                                var res = Deferred("doGetMocked");
                                return res.resolve(ds1)
                            };
                            // **************** FINE mock funzioni e2e*********************
                            
                            var helpForm = new HelpForm(state1, "table1", "#rootelement");
                            metapage.helpForm  = helpForm;
                            metapage.state = state1;
                            helpForm.lastSelected(t1, r2); // r2 ha figlio r6 su t2, cioè valore other_field: "o2"
                            expect(t1.rows.length).toBe(5);
                            expect(t2.rows.length).toBe(5);
                            metapage.editNewCopyJsSide().then(function (result) {
                                // viene fatta la clear del ds
                                expect(t1.rows.length).toBe(1); // 1 riga aggiunta copiata para para
                                expect(t2.rows.length).toBe(2); // 2 righe aggiunte
                                
                                expect($("#l1").text()).toBe(keyNewRow); // chiave nuova riga
                                expect($("#l2").text()).toBe("f2"); // f2 è il valore della colonna copiata, che era quella selezionata cioè r2

                                // sono le 2 righe child su "key10" aggiunte e il cui valore è copiato dalle righe t2 iniziale
                                expect(t2.rows[0].key).toBe(keyNewRow);
                                expect(t2.rows[1].key).toBe(keyNewRow);
                                expect(t2.rows[0].other_field).toBe("o2");
                                expect(t2.rows[1].other_field).toBe("o2bis");
                                // expect($("#l3").text()).toBe("key10"); // chiave riga figlia
                                // expect($("#l4").text()).toBe("o2"); // valore della child di partenza della riga primaria selzionata.
                                done();
                            });
                            
                        }, 2000);

                    it('editNewCopy() isList=true is Async, not perform deep-copy',
                        function(done) {
                            var mainDiv = '<div id="rootelement">' +
                                't1-key: <label id="l1"  data-tag="table1.key"></label><br>' +
                                't1-field1:<label id="l2" data-tag="table1.field1"></label><br>' +
                                't2-key: <label id="l3" data-tag="table2.key"></label><br>' +
                                't2-other_field: <label id="l4" data-tag="table2.other_field"></label><br>' +
                                "</div>";
                            $("html").html(mainDiv);

                            var ds1 = new jsDataSet.DataSet("temp1");
                            var t1 = ds1.newTable("table1");
                            var t2 = ds1.newTable("table2");

                            // setto le prop delle colonne per t1
                            t1.setDataColumn("key", "String");
                            t1.setDataColumn("field1", "String");
                            t2.setDataColumn("key", "String");
                            t2.setDataColumn("other_field", "String");

                            ds1.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 3 su key

                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"}; // riga selezionata. ha 2 child su t2
                            var r3 = {key: "key3", field1: "f3"};
                            var r9 = {key: "key4", field1: "v1"};
                            var r12 = {key: "key5", field1: "v2"};

                            t1.add(r1);
                            t1.add(r2);
                            t1.add(r3);
                            t1.add(r9);
                            t1.add(r12);
                            t1.acceptChanges();
                            var r5 = {key: "key1", other_field: "o1"};
                            var r6 = {key: "key2", other_field: "o2"}; // child 1 di r2
                            var r6bis = {key: "key2", other_field: "o2bis"}; // child 2 di r2
                            var r11 = {key: "key4", other_field: "v1"};
                            var r14 = {key: "key5", other_field: "v2"};
                            t2.add(r5);
                            t2.add(r6);
                            t2.add(r6bis);
                            t2.add(r11);
                            t2.add(r14);
                            t2.acceptChanges();
                            // imposto la chiave
                            t1.key("key");
                            t2.key("key","other_field");
                            var meta = new appMeta.MetaData("table1");
                            state1.DS = ds1;
                            state1.meta = meta;

                            var meta2 = new appMeta.MetaData("table2");
                            appMeta.addMeta("table2", meta2);

                            // ************ INIZIO mock funz e2e *********************
                            // mock funz getNewRow
                            meta.getNewRow = function() {
                                var res = Deferred("getNewRowMocked");
                                var rnew = {key: "key10", field1: "fnew"};
                                t1.add(rnew);
                                return res.resolve(rnew.getRow()).promise();
                            };

                            // mock funz getNewRow
                            meta2.getNewRow = function() {
                                var res = Deferred("getNewRowMocked");
                                var rnd = Math.floor(Math.random() * 101); // metto un random altrimenti la chiave non mi fa inserire 2 righe e il test fallisce
                                var rnew = {key: "key10", other_field: "valuenew"+rnd.toString()};
                                t2.add(rnew);
                                return res.resolve(rnew.getRow())
                            };

                            appMeta.getData.doGet = function () {
                                var res = Deferred("doGetMocked");
                                return res.resolve(ds1)
                            };
                            // **************** FINE mock funzioni e2e*********************

                            var helpForm = new HelpForm(state1, "table1", "#rootelement");
                            metapage.helpForm  = helpForm;
                            metapage.state = state1;
                            metapage.isList  = true;;
                            helpForm.lastSelected(t1, r2); // r2 ha figlio r6 su t2, cioè valore other_field: "o2"
                            expect(t1.rows.length).toBe(5);
                            expect(t2.rows.length).toBe(5);
                            metapage.editNewCopy().then(function (result) {
                                // viene fatta la clear del ds
                                expect(t1.rows.length).toBe(6); // 1 riga aggiunta copiata para para
                                expect(t2.rows.length).toBe(5); // 2 righe aggiunte

                                expect($("#l1").text()).toBe("key10"); // chiave nuova riga rimane quela nuova.
                                expect($("#l2").text()).toBe("f2"); // f2 è il valore della colonna copiata, che ra quella selzionata cioè r2
                                
                                // expect($("#l3").text()).toBe("key10"); // chiave riga figlia
                                // expect($("#l4").text()).toBe("o2"); // valore della child di partenza della riga primaria selzionata.
                                done();
                            });

                        }, 2000);
                    
                    
                });
        });
});
