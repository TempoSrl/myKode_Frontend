"use strict";

describe("MetaModel", function () {

        var metaModel;

        let CType = jsDataSet.CType;
        beforeEach(function () {
                jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
                metaModel = appMeta.metaModel;
        });

        describe("MetaData class",
            function () {
                    it('exists',
                        function () {
                                expect(metaModel).toBeDefined();
                        });

                    it('checkForFalseUpdates() and removeFalseUpdates() methods work fine',
                        function () {
                                var ds1 = new jsDataSet.DataSet("temp1");
                                var t1ds1 = ds1.newTable("table1");
                                // setto le prop delle colonne per t1
                                t1ds1.setDataColumn("key", CType.string);
                                t1ds1.setDataColumn("field1", CType.string);
                                var r0 = {key: "key1", field1: "f0"};
                                var r1 = {key: "key1", field1: "f1"};
                                var r2 = {key: "key1", field1: "f0"};
                                t1ds1.add(r1);
                                t1ds1.add(r2);

                                var dtrow =  t1ds1.rows[0].getRow();
                                var res1 = metaModel.checkForFalseUpdates(dtrow);
                                expect(res1).toBe(false); // diverso da modified lo stato della row quindi deve tornare sempre false

                                dtrow.old = r0; // setto la old così mette stato modified se modified, altrimenti metterebbe unchanged
                                dtrow.state = jsDataSet.dataRowState.modified;
                                res1 = metaModel.checkForFalseUpdates(dtrow);
                                expect(res1).toBe(false); // r0 e r1 differiscono per field1, quindi torna false, cioè le update non sono false ma vere

                                var dtrow1 =  t1ds1.rows[1].getRow(); // prendo r2
                                dtrow1.old = r0; // setto la old così mette stato modified se modified, altrimenti metterebbe unchanged
                                dtrow1.state = jsDataSet.dataRowState.modified; // eseguo la set dello stato
                                res1 = metaModel.checkForFalseUpdates(dtrow1);
                                expect(res1).toBe(true); // r0 e r2 NON differiscono per key1 e field1, quindi torna true, cioè l' update è "finta"
                                metaModel.removeFalseUpdates(ds1); // test la remove, in questo caso trova dei "false update" quindi resetta la dtRow1
                                expect(Object.keys(dtrow1.old).length).toBe(0);
                                expect(dtrow1.state).toBe(jsDataSet.dataRowState.unchanged);
                        });

                    it('xVerifyRowChange() and xVerifyChangeChilds() methods work fine',
                        function () {
                                var ds1 = new jsDataSet.DataSet("temp1");
                                var ds2 = new jsDataSet.DataSet("temp2");
                                var t1ds1 = ds1.newTable("table1");
                                var t2ds2 = ds2.newTable("table2");

                                var t1_rel_ds2 = ds1.newTable("table3");
                                var t2_rel_ds2 = ds2.newTable("table3");

                                // setto le prop delle colonne per t1
                            t1ds1.setDataColumn("key", CType.string);
                            t1ds1.setDataColumn("field1", CType.string);
                            t1_rel_ds2.setDataColumn("key", CType.string);
                            t1_rel_ds2.setDataColumn("other_field", CType.string);
                                ds1.newRelation("r1", "table1", ["key"], "table3", ["key"]); // relazione tra table 1 e 3 su key

                            t2ds2.setDataColumn("key", CType.string);
                            t2ds2.setDataColumn("field1", CType.string);
                            t2_rel_ds2.setDataColumn("key", CType.string);
                            t2_rel_ds2.setDataColumn("other_field", CType.string);

                                var r1 = {key: "key1", field1: "f1"};
                                var r2 = {key: "key2", field1: "f2"};
                                var r3 = {key: "key3", field1: "f3"};
                                var r9 = {key: "key4", field1: "v1"};
                                var r12 = {key: "key5", field1: "v2"};

                                t1ds1.add(r1);
                                t1ds1.add(r2);
                                t1ds1.add(r3);
                                t1ds1.add(r9);
                                t1ds1.add(r12);

                                //var r3 = {key: "key1", field1: "f3"};
                                var r4 = {key: "key2", field1: "f2"};
                                var r10 = {key: "key4", field1: "v1"};
                                var r13 = {key: "key5", field1: "v2"};
                                //t2ds2.add(r3);
                                t2ds2.add(r4);
                                t2ds2.add(r10);
                                t2ds2.add(r13);

                                var r5 = {key: "key1", other_field: "o1"};
                                var r6 = {key: "key2", other_field: "o2"};
                                var r11 = {key: "key4", other_field: "v1"};
                                var r14 = {key: "key5", other_field: "v2"};
                                t1_rel_ds2.add(r5);
                                t1_rel_ds2.add(r6);
                                t1_rel_ds2.add(r11);
                                t1_rel_ds2.add(r14);

                                var r12 = {key: "key4", other_field: "v1"};
                                var r15 = {key: "key5", other_field: "v3"};

                                //t2_rel_ds2.add(r7);
                                t2_rel_ds2.add(r12);
                                t2_rel_ds2.add(r15);

                                // imposto la chiave
                                t1ds1.key("key");
                                t2ds2.key("key");

                                var res1 = metaModel.xVerifyRowChange(ds2, t2ds2, ds1, t1ds1.rows[0]);
                                var res2 = metaModel.xVerifyRowChange(ds2, t2ds2, ds1, t1ds1.rows[1]);
                                var res3 = metaModel.xVerifyRowChange(ds2, t2ds2, ds1, t1ds1.rows[2]);

                                expect(res1).toBe(true); // su key1 hanno f1 source  e f3 dest
                                expect(res2).toBe(false);// su key2 hanno f2 source  e f2 dest quindi non cambia nulla
                                expect(res3).toBe(true);// // r3 non è in dest, quindi deve tornare true


                                var res4 = metaModel.xVerifyChangeChilds(ds2, t2ds2, ds1, t1ds1.rows[0]);
                                var res5 = metaModel.xVerifyChangeChilds(ds2, t2ds2, ds1, t1ds1.rows[1]);

                                expect(res4).toBe(true); // stesso caso res1
                                expect(res5).toBe(false); // false poichè la chiave non è settata su table3

                                t1_rel_ds2.key("key"); // setto la chiave
                                t2_rel_ds2.key("key");

                                var res6 = metaModel.xVerifyChangeChilds(ds2, t2ds2, ds1, t1ds1.rows[1]); // siamo su "key2", la riga figlia della relazione è r6
                                expect(res6).toBe(true); // nel ds2 la table3 non ha righe figlie trovate, quindi torna true

                                var res7 = metaModel.xVerifyChangeChilds(ds2, t2ds2, ds1, t1ds1.rows[3]); // indice 3 sarebbe r9 cioè "key4"
                                expect(res7).toBe(false); // la tabella child su ds2 essite e ha stessa riga del parent con stessi valori, quindi trona false

                                var res8 = metaModel.xVerifyChangeChilds(ds2, t2ds2, ds1, t1ds1.rows[4]); // indice 3 sarebbe r14 cioè "key5"
                                expect(res8).toBe(true); // la tabella child su ds2 esiste e ha stessa riga del parent con valore "v3" su other_field diverso da r13 che ha "v1" per "key5"
                        });

                    it('hasChanges() method returs true or false if there are or not changes',
                        function () {
                                var ds1 = new jsDataSet.DataSet("temp1");
                                var ds2 = new jsDataSet.DataSet("temp2");
                                var t1ds1 = ds1.newTable("table1");
                                var t2ds2 = ds2.newTable("table2");

                                var t1_rel_ds2 = ds1.newTable("table3");
                                var t2_rel_ds2 = ds2.newTable("table3");

                                // setto le prop delle colonne per t1
                            t1ds1.setDataColumn("key", CType.string);
                            t1ds1.setDataColumn("field1", CType.string);
                            t1_rel_ds2.setDataColumn("key", CType.string);
                            t1_rel_ds2.setDataColumn("other_field", CType.string);
                                ds1.newRelation("r1", "table1", ["key"], "table3", ["key"]); // relazione tra table 1 e 3 su key

                            t2ds2.setDataColumn("key", CType.string);
                            t2ds2.setDataColumn("field1", CType.string);
                            t2_rel_ds2.setDataColumn("key", CType.string);
                            t2_rel_ds2.setDataColumn("other_field", CType.string);

                                var r1 = {key: "key1", field1: "f1"};
                                var r2 = {key: "key2", field1: "f2"};
                                var r3 = {key: "key3", field1: "f3"};
                                var r9 = {key: "key4", field1: "v1"};
                                var r12 = {key: "key5", field1: "v2"};

                                t1ds1.add(r1);
                                t1ds1.add(r2);
                                t1ds1.add(r3);
                                t1ds1.add(r9);
                                t1ds1.add(r12);

                                var r4 = {key: "key2", field1: "f2"};
                                var r10 = {key: "key4", field1: "v1"};
                                var r13 = {key: "key5", field1: "v2"};
                                t2ds2.add(r4);
                                t2ds2.add(r10);
                                t2ds2.add(r13);

                                var r5 = {key: "key1", other_field: "o1"};
                                var r6 = {key: "key2", other_field: "o2"};
                                var r11 = {key: "key4", other_field: "v1"};
                                var r14 = {key: "key5", other_field: "v2"};
                                t1_rel_ds2.add(r5);
                                t1_rel_ds2.add(r6);
                                t1_rel_ds2.add(r11);
                                t1_rel_ds2.add(r14);

                                var r12 = {key: "key4", other_field: "v1"};
                                var r15 = {key: "key5", other_field: "v3"};

                                //t2_rel_ds2.add(r7);
                                t2_rel_ds2.add(r12);
                                t2_rel_ds2.add(r15);

                                // imposto la chiave
                                t1ds1.key("key");
                                t2ds2.key("key");

                                // la primary sarà r4 , sourceRow r1
                                var res1 = metaModel.hasChanges(ds2, t2ds2, t1ds1.rows[0].getRow(), false);
                                expect(res1).toBe(true); // le righe sono in stato added e non siamo in un detail

                                //CASO DETAIL
                                // la primary sarà r4 , sourceRow r1
                                var res2 = metaModel.hasChanges(ds2, t2ds2, t1ds1.rows[0].getRow(), true);
                                expect(res2).toBe(true); // r4 ed r1 sono differenti su field1

                                // la primary sarà r4 , sourceRow r2
                                var res3 = metaModel.hasChanges(ds2, t2ds2, t1ds1.rows[1].getRow(), true);
                                expect(res3).toBe(false); // r4 ed r2 sono uguali

                        });

                    it('getRelatedRow() method returns value row related childs, or null if no relation specified',
                        function () {
                                var ds = new jsDataSet.DataSet("temp2");
                                var table1 = ds.newTable("table1");
                                var table2 = ds.newTable("table2");

                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);

                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);

                                var r1 = {key: "key1", field1: "f1"};
                                var r2 = {key: "key2", field1: "f2"};
                                var r3 = {key: "key3", field1: "f3"};
                                table1.add(r1);
                                table1.add(r2);
                                table1.add(r3);
                                
                                var r4 = {key: "key1", other_field: "o1"};
                                var r5 = {key: "key2", other_field: "o2"};
                                var r6 = {key: "key4", other_field: "v1"};
                                var r7 = {key: "key5", other_field: "v2"};
                                table2.add(r4);
                                table2.add(r5);
                                table2.add(r6);
                                table2.add(r7);
                                
                                // imposto la chiave
                                table1.key("key");
                                table2.key("key");

                                var res1 = metaModel.getRelatedRowColumn(r1, table2.name, "other_field");
                                expect(res1).toBe(null); // Non hoe splicitatato relazione ok!

                                ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                                var res2 = metaModel.getRelatedRowColumn(r1, table2.name, "other_field");
                                expect(res2).toBe("o1"); // ok ritrovo il campo di r4, che corrisponde sulla chiave "key1"
                        });

                    it('getRelatedRow() method returns value row related parents, or null if no relation specified',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");
    
                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);
    
                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);
    
                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"};
                            var r3 = {key: "key3", field1: "f3"};
                            table1.add(r1);
                            table1.add(r2);
                            table1.add(r3);
    
                            var r4 = {key: "key1", other_field: "o1"};
                            var r5 = {key: "key2", other_field: "o2"};
                            var r6 = {key: "key4", other_field: "v1"};
                            var r7 = {key: "key5", other_field: "v2"};
                            table2.add(r4);
                            table2.add(r5);
                            table2.add(r6);
                            table2.add(r7);
    
                            // imposto la chiave
                            table1.key("key");
                            table2.key("key");

                            var res1 = metaModel.getRelatedRowColumn(r1, table2.name, "other_field");
                            expect(res1).toBe(null); // Non ho esplicitatato relazione ok!
    
                            ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                            var res2 = metaModel.getRelatedRowColumn(r5, table1.name, "field1");
                            expect(res2).toBe("f2"); // ok ritrovo il campo di r2, che corrisponde sulla chiave "key2"
                        });

                    it('calculateRow() evaluates evaluates custom fields for a single row "r"',
                        function () {
                        var ds = new jsDataSet.DataSet("temp2");
                        var table1 = ds.newTable("table1");

                        table1.setDataColumn("key", CType.string);
                        table1.setDataColumn("field1", CType.string);
                        table1.setDataColumn("age", "Int32");

                        var r1 = {key: "key1", field1: "f1", age : 1};
                        var r2 = {key: "key2", field1: "f2", age : 2};
                        var r3 = {key: "key3", field1: "f3", age : 3};
                        table1.add(r1);
                        table1.add(r2);
                        table1.add(r3);

                        // imposto la chiave
                        table1.key("key");

                        table1.calculatingListing = "listType";
                        table1.calculateFunction = function (r, listType) {
                            if (listType === "listType"){
                                r["age"] = r["age"] + 10;
                                r["field1"] = r["field1"] + " " + r["age"] ;
                            }
                        };

                        metaModel.calculateRow(r1);
                       // esegue la funz calculateFunction per la riga r1
                        expect(r1["age"]).toBe(11);
                        expect(r1["field1"]).toBe( "f1 11");

                        // le altre 3 righe della tabella non vengono interessate
                        expect(r2["age"]).toBe(2);
                        expect(r3["age"]).toBe(3);

                    });

                    it('calculateTable() evaluates custom fields for every row of a table',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            
                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);
                            table1.setDataColumn("age", CType.int);

                            var r1 = {key: "key1", field1: "f1", age : 1};
                            var r2 = {key: "key2", field1: "f2", age : 2};
                            var r3 = {key: "key3", field1: "f3", age : 3};
                            table1.add(r1);
                            table1.add(r2);
                            table1.add(r3);

                            // imposto la chiave
                            table1.key("key");

                            table1.calculatingListing = "listType";
                            table1.calculateFunction = function (r, listType) {
                                if (listType === "listType"){
                                    r["age"] = r["age"] + 10;
                                }
                            };

                            metaModel.calculateTable(table1);
                            expect(r1["age"]).toBe(11); // esegue la funz calculateFunction per ogni riga
                            expect(r2["age"]).toBe(12); 
                            expect(r3["age"]).toBe(13); 

                    });
    
                    it('getTemporaryValues() Evaluate expressions of all t rows',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");
    
                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);
                            table1.setDataColumn("age", CType.int);
                            table1.setDataColumn("lookupValue", CType.string);

                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);
                            table2.setDataColumn("lookupValueString", CType.string);

                            var r1 = {key: "key1", field1: "f1", age : 1, lookupValue : ""};
                            var r2 = {key: "key2", field1: "f2", age : 2, lookupValue : ""};
                            var r3 = {key: "key3", field1: "f3", age : 3, lookupValue : ""};
                            table1.add(r1);
                            table1.add(r2);
                            table1.add(r3);
    
                            var r4 = {key: "key1", other_field: "o1", lookupValueString: "quattro"};
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

                            // Configurazione per campi calcolati
                            table1.calculatingListing = "listType";
                            table1.calculateFunction = function (r, listType) {
                                if (listType === "listType"){
                                    r["age"] = r["age"] + 10;
                                }
                            };

                            table1.columns.lookupValue.expression = "table2.lookupValueString";
    
                            ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                            
                            // esegue funzione
                            metaModel.getTemporaryValues(table1);

                            expect(r1["age"]).toBe(11); // esegue la funz calculateFunction per ogni riga
                            expect(r1["field1"]).toBe("f1"); // rimane quello originale
                            expect(r1["lookupValue"]).toBe("quattro"); // prende valore di lookup da table2

                            expect(r2["age"]).toBe(12); // esegue la funz calculateFunction per ogni riga
                            expect(r2["field1"]).toBe("f2"); // rimane quello originale
                            expect(r2["lookupValue"]).toBe("cinque"); // prende valore di lookup da table2

                            expect(r3["age"]).toBe(13); // esegue la funz calculateFunction per ogni riga
                            expect(r3["field1"]).toBe("f3"); // rimane quello originale
                            expect(r3["lookupValue"]).toBe(null); // non esiste la chiave "key3" su table2, quindi non trova valore di lookup
                        });

                    it('addNotEntityChildFilter() set notEntityChild property on child table',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");
    
                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);
                            table1.setDataColumn("age", CType.int);
                            table1.setDataColumn("lookupValue", CType.string);
    
                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);
                            table2.setDataColumn("lookupValueString", CType.string);
                            table2.setDataColumn("field1", CType.string);
                            
                            // imposto la chiave
                            table1.key(["key", "field1"]);
                            table2.key(["key"]);
    
                            ds.newRelation("r1", "table1", ["key", "field1"], "table2", ["key", "field1"]); // relazione tra table 1 e 2 su key
    
                            // esegue funzione
                            metaModel.addNotEntityChildFilter(table1, table2);
    
                            expect(table2.notEntityChild).toBeDefined();
                            expect(table2.notEntityChild.myArguments.length).toBe(1); // solo field1 che è col relazione ma non in chiave primaria
                           
                        });

                    it('addNotEntityChildFilterRel() set notEntityChild property on child table',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");
    
                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);
                            table1.setDataColumn("age", CType.int);
                            table1.setDataColumn("lookupValue", CType.string);
    
                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);
                            table2.setDataColumn("lookupValueString", CType.string);
                            table2.setDataColumn("field1", CType.string);
    
                            // imposto la chiave
                            table1.key(["key", "field1"]);
                            table2.key(["key"]);
    
                            ds.newRelation("r1", "table1", ["key", "field1"], "table2", ["key", "field1"]); // relazione tra table 1 e 2 su key
    
                            // esegue funzione
                            metaModel.addNotEntityChildFilterRel(table2, "r1");
    
                            expect(table2.notEntityChild).toBeDefined();
                            expect(table2.notEntityChild.myArguments.length).toBe(1); // solo field1 che è col relazione ma non in chiave primaria
    
                        });

                    it('checkChildRel() returns true. it connects any field that is primarykey for both parent and child',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");

                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);

                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);

                            // imposto la chiave
                            table1.key("key");
                            table2.key("key");
                            
                            var rel = ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                            var res = metaModel.checkChildRel(rel);
                            expect(res).toBe(true); // ok it connects any field that is primarykey for both parent and child
                        });

                    it('xRemoveChilds() removes a Row with all his subentity childs',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");
                            var table3 = ds.newTable("table3");

                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);

                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);

                            table3.setDataColumn("other_field", CType.string);
                            table3.setDataColumn("other_field_table3", CType.string);

                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"};
                            var r3 = {key: "key3", field1: "f3"};
                            table1.add(r1);
                            table1.add(r2);
                            table1.add(r3);
                            table1.acceptChanges();

                            var r4 = {key: "key1", other_field: "o1"};
                            var r5 = {key: "key2", other_field: "o2"};
                            var r6 = {key: "key4", other_field: "v1"};
                            var r7 = {key: "key5", other_field: "v2"};
                            table2.add(r4);
                            table2.add(r5);
                            table2.add(r6);
                            table2.add(r7);
                            table2.acceptChanges();


                            var r8 = { other_field: "o1", other_field_table3:"o1_field"};
                            var r9 = { other_field: "o2", other_field_table3:"o1_field"};
                            var r10 = { other_field: "o3", other_field_table3:"o1_field"};

                            table3.add(r8);
                            table3.add(r9);
                            table3.add(r10);
                            table3.acceptChanges();

                            // imposto la chiave
                            table1.key("key");
                            table2.key("key", "other_field");
                            table3.key("other_field");

                            ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                            ds.newRelation("r2", "table2", ["other_field"], "table3", ["other_field"]); // relazione tra table 2 e 3 su other_field

                            // osservo le righe prima
                            expect(table1.rows.length).toBe(3);
                            expect(table2.rows.length).toBe(4);
                            expect(table3.rows.length).toBe(3);

                            metaModel.xRemoveChilds(ds, r1.getRow());

                            // r1 e childs sono rimossi, cioè r1 su table1, r4 su table2 e r8 su table3
                            expect(table1.rows.length).toBe(2);
                            expect(table2.rows.length).toBe(3);
                            expect(table3.rows.length).toBe(2);
                        });

                    it('moveDataRow() moves a Row from table to another',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            var table2 = ds.newTable("table2");
                            var table3 = ds.newTable("table3");

                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);

                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);

                            table3.setDataColumn("other_field", CType.string);
                            table3.setDataColumn("other_field_table3", CType.string);

                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"};
                            var r3 = {key: "key3", field1: "f3"};
                            table1.add(r1);
                            table1.add(r2);
                            table1.add(r3);
                            table1.acceptChanges();

                            var r4 = {key: "key6", other_field: "o1"};
                            var r5 = {key: "key2", other_field: "o2"};
                            var r6 = {key: "key4", other_field: "v1"};
                            var r7 = {key: "key5", other_field: "v2"};
                            table2.add(r4);
                            table2.add(r5);
                            table2.add(r6);
                            table2.add(r7);
                            table2.acceptChanges();

                            var r8 = { other_field: "o1", other_field_table3:"o1_field"};
                            var r9 = { other_field: "o2", other_field_table3:"o1_field"};
                            var r10 = { other_field: "o3", other_field_table3:"o1_field"};

                            table3.add(r8);
                            table3.add(r9);
                            table3.add(r10);
                            table3.acceptChanges();

                            // imposto la chiave
                            table1.key("key");
                            table2.key("key", "other_field");
                            table3.key("other_field");

                            ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                            ds.newRelation("r2", "table2", ["other_field"], "table3", ["other_field"]); // relazione tra table 2 e 3 su other_field

                            // osservo le righe prima
                            expect(table1.rows.length).toBe(3);
                            expect(table2.rows.length).toBe(4);

                            var rRes = metaModel.moveDataRow(table2, r1.getRow(), false);
                            expect(table1.rows.length).toBe(3);
                            expect(table2.rows.length).toBe(5);
                            expect(rRes.key).toBe("key1");
                            expect(rRes.getRow).toBeDefined();

                    });

                    it('xMoveChilds() moves rows from source to dest',
                        function () {
                        var dsRif = new jsDataSet.DataSet("dsRif");
                        var dsDest = new jsDataSet.DataSet("dsDest");
                            
                        var table1 = dsRif.newTable("table1");
                        var table1Rel = dsRif.newTable("table1Rel");

                        var table2 = dsDest.newTable("table2");
                        var table2Rel = dsDest.newTable("table1Rel");

                        table1.setDataColumn("key", CType.string);
                        table1.setDataColumn("field1", CType.string);

                        table1Rel.setDataColumn("key", CType.string);
                        table1Rel.setDataColumn("field1_table1Rel", CType.string);

                        table2Rel.setDataColumn("key", CType.string);
                        table2Rel.setDataColumn("field1_table1Rel", CType.string);

                        table2.setDataColumn("key", CType.string);
                        table2.setDataColumn("other_field", CType.string);

                        var r1 = {key: "key1", field1: "f1"};
                        var r2 = {key: "key2", field1: "f2"};
                        var r3 = {key: "key3", field1: "f3"};
                        table1.add(r1);
                        table1.add(r2);
                        table1.add(r3);
                        table1.acceptChanges();

                        var r1Rel = {key: "key1", field1_table1Rel: "f1"};
                        var r2Rel = {key: "key2", field1_table1Rel: "f2"};
                        var r3Rel = {key: "key3", field1_table1Rel: "f3"};
                        table1Rel.add(r1Rel);
                        table1Rel.add(r2Rel);
                        table1Rel.add(r3Rel);
                        table1Rel.acceptChanges();

                        var r4 = {key: "key1", other_field: "o1"};
                        var r5 = {key: "key2", other_field: "o2"};
                        var r6 = {key: "key4", other_field: "v1"};
                        var r7 = {key: "key5", other_field: "v2"};
                        table2.add(r4);
                        table2.add(r5);
                        table2.add(r6);
                        table2.add(r7);
                        table2.acceptChanges();

                        // imposto la chiave
                        table1.key("key");
                        table1Rel.key("key");

                        table2.key("key", "other_field");
                        dsRif.newRelation("r1", "table1", ["key"], "table1Rel", ["key"]); // relazione tra table 1 e 2 su key

                        // osservo le righe prima
                        expect(table1.rows.length).toBe(3);
                        expect(table1Rel.rows.length).toBe(3);
                        expect(table2Rel.rows.length).toBe(0);
                        expect(table2.rows.length).toBe(4);

                        metaModel.xMoveChilds(dsDest, table2, dsRif, r1.getRow(), false);

                        // dopo la xMoveChilds, le righe con chiave nelle rel vengono spostate
                        expect(table1.rows.length).toBe(2);
                        expect(table2.rows.length).toBe(5);
                        expect(table1Rel.rows.length).toBe(0);
                        expect(table2Rel.rows.length).toBe(3);

                    });

                    it('xCopy() copy rows from source to dest',
                        function () {
                            // TODO analizza emglio esmepio e risultato aspettato
                        var dsDest = new jsDataSet.DataSet("dsDest");
                        var dsSource = new jsDataSet.DataSet("dsSource");

                        var table1 = dsDest.newTable("table1");
                        var table1Rel = dsDest.newTable("table1Rel");

                        var table2 = dsSource.newTable("table1");
                        var table2Rel = dsSource.newTable("table1Rel");

                        table1.setDataColumn("key", CType.string);
                        table1.setDataColumn("field1", CType.string);

                        table1Rel.setDataColumn("key", CType.string);
                        table1Rel.setDataColumn("field1_table1Rel", CType.string);

                        table2.setDataColumn("key", CType.string);
                        table2.setDataColumn("other_field", CType.string);

                        table2Rel.setDataColumn("key", CType.string);
                        table2Rel.setDataColumn("field1_table1Rel", CType.string);


                        var r1 = {key: "key1", field1: "f1"};
                        var r2 = {key: "key2", field1: "f2"};
                        var r3 = {key: "key3", field1: "f3"};
                        table1.add(r1);
                        table1.add(r2);
                        table1.add(r3);
                        table1.acceptChanges();

                        var r1Tab2 = {key: "key1", other_field: "f1"}; // COPIO QUESTA da table2 a table1
                        var r2Tab2 = {key: "key2", other_field: "f2"};
                        var r3Tab2 = {key: "key3", other_field: "f3"};
                        table2.add(r1Tab2);
                        table2.add(r2Tab2);
                        table2.add(r3Tab2);
                        table2.acceptChanges();

                        var r1Rel1 = {key: "key1", field1_table1Rel: "o1"};
                        var r2Rel1 = {key: "key2", field1_table1Rel: "o2"};
                        var r3Rel1 = {key: "key4", field1_table1Rel: "v1"};
                        var r4Rel1 = {key: "key5", field1_table1Rel: "v2"};
                        table1Rel.add(r1Rel1);
                        table1Rel.add(r2Rel1);
                        table1Rel.add(r3Rel1);
                        table1Rel.add(r4Rel1);
                        table1Rel.acceptChanges();

                        var r1Rel2 = {key: "key11", field1_table1Rel: "o1"};
                        var r2Rel2 = {key: "key7", field1_table1Rel: "o3"};
                        table2Rel.add(r1Rel2);
                        table2Rel.add(r2Rel2);
                        table2Rel.acceptChanges();

                        // imposto la chiave
                        table1.key("key");
                        table1Rel.key("key");

                        table2.key("key");
                        table2Rel.key("key");

                        table1.lastSelectedRow = r1;


                        dsDest.newRelation("r1", "table1", ["key"], "table1Rel", ["key"]); // relazione tra table1 e table1Rel su keydel dsDest
                        dsSource.newRelation("r2", "table1", ["key"], "table1Rel", ["key"]); // relazione tra table1 e table1Rel su keydel dsDest
                        // osservo le righe prima
                        expect(table1.rows.length).toBe(3);
                        expect(table1Rel.rows.length).toBe(4);
                        expect(table2Rel.rows.length).toBe(2);
                        expect(table2.rows.length).toBe(3);
                                                       // source           rdest
                        metaModel.xCopy(dsSource, dsDest, r1Tab2.getRow(), r1.getRow());

                        // dopo la xCopy, le righe con chiave nelle rel vengono copaite
                        expect(table1.rows.length).toBe(3);
                        expect(table1Rel.rows.length).toBe(5);
                        expect(table2Rel.rows.length).toBe(0);
                        expect(table2.rows.length).toBe(2);
                            
                    });

                    it('copyDataRow() copy a Row from table to another',
                         function () {
                        var ds = new jsDataSet.DataSet("temp2");
                        var table1 = ds.newTable("table1");
                        var table2 = ds.newTable("table2");
                        var table3 = ds.newTable("table3");

                        table1.setDataColumn("key", CType.string);
                        table1.setDataColumn("field1", CType.string);

                        table2.setDataColumn("key", CType.string);
                        table2.setDataColumn("other_field", CType.string);

                        table3.setDataColumn("other_field", CType.string);
                        table3.setDataColumn("other_field_table3", CType.string);

                        var r1 = {key: "key1", field1: "f1"};
                        var r2 = {key: "key2", field1: "f2"};
                        var r3 = {key: "key3", field1: "f3"};
                        table1.add(r1);
                        table1.add(r2);
                        table1.add(r3);
                        table1.acceptChanges();

                        var r4 = {key: "key6", other_field: "o1"};
                        var r5 = {key: "key2", other_field: "o2"};
                        var r6 = {key: "key4", other_field: "v1"};
                        var r7 = {key: "key5", other_field: "v2"};
                        table2.add(r4);
                        table2.add(r5);
                        table2.add(r6);
                        table2.add(r7);
                        table2.acceptChanges();

                        var r8 = { other_field: "o1", other_field_table3:"o1_field"};
                        var r9 = { other_field: "o2", other_field_table3:"o1_field"};
                        var r10 = { other_field: "o3", other_field_table3:"o1_field"};

                        table3.add(r8);
                        table3.add(r9);
                        table3.add(r10);
                        table3.acceptChanges();

                        // imposto la chiave
                        table1.key("key");
                        table2.key("key", "other_field");
                        table3.key("other_field");

                        ds.newRelation("r1", "table1", ["key"], "table2", ["key"]); // relazione tra table 1 e 2 su key
                        ds.newRelation("r2", "table2", ["other_field"], "table3", ["other_field"]); // relazione tra table 2 e 3 su other_field

                        // osservo le righe prima
                        expect(table1.rows.length).toBe(3);
                        expect(table2.rows.length).toBe(4);

                        metaModel.copyDataRow(table2, r1.getRow());
                        expect(table1.rows.length).toBe(3);
                        expect(table2.rows.length).toBe(5);
                    });

                    it('xCopyChilds() moves rows from source to dest',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");
                            var dsDest = new jsDataSet.DataSet("dsDest");

                            var table1 = dsRif.newTable("table1");
                            var table1Rel = dsRif.newTable("table1Rel");

                            var table2 = dsDest.newTable("table2");
                            var table2Rel = dsDest.newTable("table1Rel");
                            var table1_2 = dsDest.newTable("table1");

                            table1.setDataColumn("key", CType.string);
                            table1.setDataColumn("field1", CType.string);

                            table1_2.setDataColumn("key", CType.string);
                            table1_2.setDataColumn("field1", CType.string);

                            table1Rel.setDataColumn("key", CType.string);
                            table1Rel.setDataColumn("field1_table1Rel", CType.string);

                            table2Rel.setDataColumn("key", CType.string);
                            table2Rel.setDataColumn("field1_table1Rel", CType.string);

                            table2.setDataColumn("key", CType.string);
                            table2.setDataColumn("other_field", CType.string);

                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"};
                            var r3 = {key: "key3", field1: "f3"};
                            table1.add(r1);
                            table1.add(r2);
                            table1.add(r3);
                            table1.acceptChanges();

                            var r1Rel = {key: "key1", field1_table1Rel: "f1"};
                            var r2Rel = {key: "key2", field1_table1Rel: "f2"};
                            var r3Rel = {key: "key3", field1_table1Rel: "f3"};
                            table1Rel.add(r1Rel);
                            table1Rel.add(r2Rel);
                            table1Rel.add(r3Rel);
                            table1Rel.acceptChanges();

                            var r4 = {key: "key1", other_field: "o1"};
                            var r5 = {key: "key2", other_field: "o2"};
                            var r6 = {key: "key4", other_field: "v1"};
                            var r7 = {key: "key5", other_field: "v2"};
                            table2.add(r4);
                            table2.add(r5);
                            table2.add(r6);
                            table2.add(r7);
                            table2.acceptChanges();

                            // imposto la chiave
                            table1.key("key");
                            table1Rel.key("key");

                            table2.key("key", "other_field");
                            dsRif.newRelation("r1", "table1", ["key"], "table1Rel", ["key"]); // relazione tra table 1 e 2 su key

                            // osservo le righe prima
                            expect(table1.rows.length).toBe(3);
                            expect(table1Rel.rows.length).toBe(3);
                            expect(table2Rel.rows.length).toBe(0);
                            expect(table1_2.rows.length).toBe(0);

                            metaModel.xCopyChilds(dsDest, dsRif, r1.getRow());
    
                            // dopo la xCopyChilds, le righe con chiave nelle rel vengono copiate
                            expect(table1.rows.length).toBe(3);
                            expect(table1Rel.rows.length).toBe(3);
                            expect(table2Rel.rows.length).toBe(1);
                            expect(table1_2.rows.length).toBe(1);
                            
                        });

                    it('cmpSelectors() compares the values of the rows on selector columns of the autoIncrement properties and returns boolean',
                         function () {
                        var dsRif = new jsDataSet.DataSet("dsRif");
                        var table1 = dsRif.newTable("table1");
                             
                        table1.setDataColumn("key", CType.string);
                        table1.setDataColumn("field1", CType.string);
                        table1.setDataColumn("field2", CType.string);
                             
                       // var r1 = {key: "key1", field1: "f1", field2: "f11"};
                       // var r2 = {key: "key2", field1: "f1", field2: "f22"};
                       // var r3 = {key: "key3", field1: "f1", field2: "f11"};

                         var r1 = table1.newRow({key: "key1", field1: "f1", field2: "f11"});
                         var r2 = table1.newRow({key: "key2", field1: "f1", field2: "f22"});
                         var r3 = table1.newRow({key: "key3", field1: "f1", field2: "f11"});
                       // table1.add(r2);
                       // table1.add(r3);
                        table1.acceptChanges();

                        var au1 = {
                            columnName : "field1",
                            idLen : 1,
                            middleConst : "middleConst1",
                            minimum : 1,
                            selector : ["field1", "field2"],
                            selectorMask : [123, 456]
                        };
                        
                        var au2 = {
                         columnName : "field2",
                         idLen : 1,
                         middleConst : "middleConst2",
                         minimum : 1,
                         selector : ["field1", "field2"],
                         selectorMask : [123, 456]
                        };
                             
                        table1.autoIncrement("field1", au1);
                        table1.autoIncrement("field2", au2);

                        var res1 = metaModel.cmpSelectors(table1, r1.getRow(), r2.getRow());
                        var res2 = metaModel.cmpSelectors(table1, r1.getRow(), r3.getRow());  
                        
                        expect(res1).toBe(false); // differenti su field2
                        expect(res2).toBe(true); // uguali tutti i valori

                    });

                    it('isSubEntityRelation() returns true beacause "childTable" is a subentity table of "parentTable"',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");
    
                            var parent = dsRif.newTable("parent");
                            var child = dsRif.newTable("child");
    
                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);
    
                            child.setDataColumn("key", CType.string);
                            child.setDataColumn("field1_table1Rel", CType.string);
    
                            // imposto la chiave
                            parent.key("key");
                            child.key("key");
    
                            dsRif.newRelation("r1", "parent", ["key"], "child", ["key"]); // relazione tra parent e child su key
    
                            var res = metaModel.isSubEntityRelation(dsRif.relations.r1, child, parent);
    
                            expect(res).toBe(true);
    
                        });

                    it('isSubEntityRelation() returns false because allthe key of parent are key of child',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");

                            var parent = dsRif.newTable("parent");
                            var child = dsRif.newTable("child");

                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);

                            child.setDataColumn("key", CType.string);
                            child.setDataColumn("field1_table1Rel", CType.string);

                            // imposto la chiave
                            parent.key(["key", "field1"]);
                            child.key("key");

                            dsRif.newRelation("r1", "parent", ["key"], "child", ["key"]); // relazione tra parent e child su key

                            var res = metaModel.isSubEntityRelation(dsRif.relations.r1, child, parent);

                            expect(res).toBe(false);

                          });

                    it('isParentTableByKey() returns true beacause table "parentTable" is related with KEY fields of Child table "childTable"',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");

                            var parent = dsRif.newTable("parent");
                            var child = dsRif.newTable("child");

                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);

                            child.setDataColumn("key", CType.string);
                            child.setDataColumn("field1_table1Rel", CType.string);

                            // imposto la chiave
                            parent.key(["key"]);
                            child.key("key");

                            dsRif.newRelation("r1", "parent", ["key"], "child", ["key"]); // relazione tra parent e child su key

                            var res = metaModel.isParentTableByKey(dsRif, parent, child);

                            expect(res).toBe(true);

                        });

                    it('isParentTableByKey() returns false because table "parentTable" is not related with KEY fields of Child table "childTable"',
                        function () {
                        var dsRif = new jsDataSet.DataSet("dsRif");

                        var parent = dsRif.newTable("parent");
                        var child = dsRif.newTable("child");

                        parent.setDataColumn("key", CType.string);
                        parent.setDataColumn("field1", CType.string);

                        child.setDataColumn("key", CType.string);
                        child.setDataColumn("field1_table1Rel", CType.string);

                        // imposto la chiave
                        parent.key(["key"]);
                        child.key("key");

                        dsRif.newRelation("r1", "parent", ["key","field1"], "child", ["key", "field1_table1Rel"]); // relazione tra parent e child su key

                        var res = metaModel.isParentTableByKey(dsRif, parent, child);

                        expect(res).toBe(false);

                    });

                    it('isSubEntity() returns false beacause "childTable" relation column is not a primary key of the table',
                         function () {
                        var dsRif = new jsDataSet.DataSet("dsRif");

                        var parent = dsRif.newTable("parent");
                        var child = dsRif.newTable("child");

                        parent.setDataColumn("key", CType.string);
                        parent.setDataColumn("field1", CType.string);

                        child.setDataColumn("key", CType.string);
                        child.setDataColumn("field1", CType.string);

                        var r1Rel = {key: "key1", field1_table1Rel: "f1"};

                        // imposto la chiave. parent ha chiave diversa, rispetto a quella della relazione
                        parent.key(["key", "field1"]);
                        child.key("key");

                        dsRif.newRelation("r1", "parent", ["key", "field1"], "child", ["key", "field1"]); // relazione tra parent e child su key e field1

                        var res = metaModel.isSubEntity(child, parent);

                        // false perchè ci sono colonne nella relazione che non sono chaive della child
                        expect(res).toBe(false);

                    });

                    it('isSubEntity() returns false beacause "parentTable" primaryKey is not the same of the keys of the relation',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");

                            var parent = dsRif.newTable("parent");
                            var child = dsRif.newTable("child");

                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);

                            child.setDataColumn("key", CType.string);
                            child.setDataColumn("field1_table1Rel", CType.string);

                            var r1Rel = {key: "key1", field1_table1Rel: "f1"};

                            // imposto la chiave. parent ha chiave diversa, rispetto a quella della relazione
                            parent.key(["key", "field1"]);
                            child.key("key");

                            dsRif.newRelation("r1", "parent", ["key"], "child", ["key"]); // relazione tra parent e child su key

                            var res = metaModel.isSubEntity(child, parent);

                            // false perchè le colonne della relazione, non sono tutte quelle della chaive primaria della parent
                            expect(res).toBe(false);

                        });

                    it('isSubEntity() returns true beacause "childTable" is a subentity table of "parentTable"',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");

                            var parent = dsRif.newTable("parent");
                            var child = dsRif.newTable("child");

                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);

                            child.setDataColumn("key", CType.string);
                            child.setDataColumn("field1_table1Rel", CType.string);

                            var r1Rel = {key: "key1", field1_table1Rel: "f1"};

                            // imposto la chiave
                            parent.key("key");
                            child.key("key");

                            dsRif.newRelation("r1", "parent", ["key"], "child", ["key"]); // relazione tra parent e child su key

                            var res = metaModel.isSubEntity(child, parent);

                            expect(res).toBe(true);

                    });

                    it('copyAutoincrementsProperties() copies all autoincrement properties from DataTable Input to DataTable output',
                         function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");
                            
                            var parent = dsRif.newTable("parent");
                            var child = dsRif.newTable("child");
                            
                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);
                            parent.setDataColumn("field2", CType.string);
                            
                            child.setDataColumn("key", CType.string);
                            child.setDataColumn("field2", CType.string);
                                 
                             //autoincrement
                             parent.autoIncrement('key', {middleConst: '14', idLen: 6, selector:['field1', 'field2'], selectorMask:[123, 456]});
                             parent.autoIncrement('field1', {middleConst: '15', idLen: 7, selector:['field2'], selectorMask:[123, 456, 678]});
                            
                             expect(child.autoIncrementColumns['key']).toBeUndefined();
                             expect(child.autoIncrementColumns['field1']).toBeUndefined();
                             // invoco il metodo
                             metaModel.copyAutoincrementsProperties(parent, child);
                             expect(child.autoIncrementColumns['key'].middleConst).toBe('14');
                             expect(child.autoIncrementColumns['field1'].middleConst).toBe('15');
                             expect(child.autoIncrementColumns['key'].idLen).toBe(6);
                             expect(child.autoIncrementColumns['field1'].idLen).toBe(7);
                             expect(child.autoIncrementColumns['key']).toBeDefined();
                             expect(child.autoIncrementColumns['field1'].selectorMask.length).toBe(3);
                             expect(child.autoIncrementColumns['field1'].selector.length).toBe(1);
                    });

                    it('lockRead() + cachedTable()',
                        function () {
                            var dsRif = new jsDataSet.DataSet("dsRif");

                            var parent = dsRif.newTable("parent");

                            parent.setDataColumn("key", CType.string);
                            parent.setDataColumn("field1", CType.string);
                            parent.setDataColumn("field2", CType.string);

                            metaModel.lockRead(parent);
                            var isCached = metaModel.cachedTable(parent);
                            expect(isCached).toBeTruthy();

                            metaModel.cachedTable(parent, false);
                            isCached = metaModel.cachedTable(parent);
                            expect(isCached).toBeFalsy();
                    });

                    it('copyPrimaryKey() sets the primary key of dest to table source',
                        function () {
    
                            var ds = new jsDataSet.DataSet("temp");
                            var tSource = ds.newTable("source");
                            var tDest = ds.newTable("dest");
                            tSource.setDataColumn("key1", CType.string);
                            tSource.setDataColumn("key2", CType.string);
                            tSource.setDataColumn("f1", "Double");
                            tSource.setDataColumn("f2", "Double");
    
                            tDest.setDataColumn("key1", CType.string);
                            tDest.setDataColumn("key2", CType.string);
                            tDest.setDataColumn("f3", "Double");
                            tDest.setDataColumn("f4", "Double");
    
                            tSource.key(["key1", "key2"]);
    
                            metaModel.copyPrimaryKey(tDest, tSource);
                            var keys = tDest.key();
    
                            expect(keys.length).toBe(2);
                            expect(_.isEqual(keys, ["key1","key2"])).toBe(true);
                        });

                    it('clearValue() sets a field to DBNull (or -1(int)  or 0-like values when DBNull is not allowed)',
                        function () {
                            var ds = new jsDataSet.DataSet("temp2");
                            var table1 = ds.newTable("table1");
                            table1.setDataColumn("k1", CType.string);
                            table1.setDataColumn("k2", "Decimal");
                            table1.setDataColumn("f1", CType.string);
                            table1.setDataColumn("f2", "Decimal");
                            metaModel.allowDbNull(table1.columns.k1, false);
                            metaModel.allowDbNull(table1.columns.k2, false);
                            metaModel.allowDbNull(table1.columns.f1, true);
                            metaModel.allowDbNull(table1.columns.f2, true);
                            var r1 = {k1: "key1", k2: "ke2", f1:"f1", f2: "f1"};
                            table1.add(r1);
                            table1.acceptChanges();
                            var res1 = metaModel.clearValue(r1.getRow().table.columns.k1);
                            expect(res1).toBe("");
                            res1 = metaModel.clearValue(r1.getRow().table.columns.k2);
                            expect(res1).toBe(0);
                            res1 = metaModel.clearValue(r1.getRow().table.columns.f1);
                            expect(res1).toBe(null);
                            res1 = metaModel.clearValue(r1.getRow().table.columns.f2);
                            expect(res1).toBe(null);


                        });

            });
});