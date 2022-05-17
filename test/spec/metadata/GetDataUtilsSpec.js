'use strict';

describe('getDataUtils', function () {
    var q = window.jsDataQuery;
    var getDataUtils = appMeta.getDataUtils;

    beforeEach(function() {

    });

    describe("getDataUtils class",
        function () {

            it('mergeRowsIntoTable() with checkExistance=false, merges rows correctly into the dsTarget ',
                function () {

                    var ds = new jsDataSet.DataSet("temp");
                    var tSource = ds.newTable("tSource");
                    var tTarget = ds.newTable("tTarget");
                    var cCodice = "c_codice";
                    var cField1 = "c_field1";
                    var cField2 = "c_field2";
                    // colonne per il datasource
                    tSource.setDataColumn(cCodice, "Decimal");
                    tSource.setDataColumn(cField1, "String");
                    tSource.setDataColumn(cField2, "String");
                    tTarget.setDataColumn(cCodice, "Decimal");
                    tTarget.setDataColumn(cField1, "String");
                    tTarget.setDataColumn(cField2, "String");
                    var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                    var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                    var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                    tSource.add(objrow1);
                    tSource.add(objrow2);
                    tSource.add(objrow3);
                    tSource.add(objrow4);


                    expect(tTarget.rows.length).toBe(0);
                    getDataUtils.mergeRowsIntoTable(tTarget, tSource.rows, false);
                    expect(tTarget.rows.length).toBe(4);

                });

            it('mergeRowsIntoTable() with checkExistance=false, merges rows correctly into the dsTarget ',
                function () {

                    var ds = new jsDataSet.DataSet("temp");
                    var tSource = ds.newTable("tSource");
                    var tTarget = ds.newTable("tTarget");
                    var cCodice = "c_codice";
                    var cField1 = "c_field1";
                    var cField2 = "c_field2";
                    // colonne per il datasource
                    tSource.setDataColumn(cCodice, "Decimal");
                    tSource.setDataColumn(cField1, "String");
                    tSource.setDataColumn(cField2, "String");
                    tTarget.setDataColumn(cCodice, "Decimal");
                    tTarget.setDataColumn(cField1, "String");
                    tTarget.setDataColumn(cField2, "String");
                    tSource.key("c_codice");
                    tTarget.key("c_codice");
                    var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                    var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                    var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                    tSource.add(objrow1);
                    tSource.add(objrow2);
                    tSource.add(objrow3);
                    tSource.add(objrow4);

                    var objrow3old = { c_codice: 3, c_field1: "tre_old", c_field2: "f2_3" };
                    tTarget.add(objrow3old);

                    expect(tTarget.rows.length).toBe(1); // inizialmente solo 1 riga
                    getDataUtils.mergeRowsIntoTable(tTarget, tSource.rows, true);
                    expect(tTarget.rows.length).toBe(4); // diventano 4
                    var sel = q.eq("c_codice", 3); // seleziono la riga che mi interessa testare
                    var objRows = tTarget.select(sel); // seleziono la riga di codice 3, che era l'unica inserita, il valore deve esssere sovrascritto
                    expect(objRows[0].c_field1).toBe("tre");

                });

            it('mergeRowsIntoTable() with checkExistance=false, deleted rows, merges rows correctly into the dsTarget ',
                function () {

                    var ds = new jsDataSet.DataSet("temp");
                    var tSource = ds.newTable("tSource");
                    var tTarget = ds.newTable("tTarget");
                    var cCodice = "c_codice";
                    var cField1 = "c_field1";
                    var cField2 = "c_field2";
                    // colonne per il datasource
                    tSource.setDataColumn(cCodice, "Decimal");
                    tSource.setDataColumn(cField1, "String");
                    tSource.setDataColumn(cField2, "String");
                    tTarget.setDataColumn(cCodice, "Decimal");
                    tTarget.setDataColumn(cField1, "String");
                    tTarget.setDataColumn(cField2, "String");
                    tSource.key("c_codice");
                    tTarget.key("c_codice");
                    var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                    var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                    var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                    tSource.add(objrow1);
                    tSource.add(objrow2);
                    tSource.add(objrow3);
                    tSource.add(objrow4);

                    objrow3.getRow().state = jsDataSet.dataRowState.deleted;

                    var objrow3old = { c_codice: 3, c_field1: "tre_old", c_field2: "f2_3" };
                    tTarget.add(objrow3old);

                    expect(tTarget.rows.length).toBe(1); // inizialmente solo 1 riga
                    getDataUtils.mergeRowsIntoTable(tTarget, tSource.rows, true);
                    expect(tTarget.rows.length).toBe(4); // diventano 4
                    // var sel = q.eq("c_codice", 3); // sleziono la riga che mi interessa testare
                    // var objRows = tTarget.select(sel); // seleziono la riga di codice 3, che era l'unica inserita, il valore deve esssere sovrascritto
                    expect(tTarget.rows[0].getRow().state).toBe(jsDataSet.dataRowState.deleted); // lo stato diventa quello della source
                    expect(tTarget.rows[0].c_field1).toBe("tre"); // il campo cambia da "tre_old" a "tre"

                });

            it('mergeDataSet() merges a dsSource into dsTarget',
                function () {

                    var dsTarget = new jsDataSet.DataSet("dsTarget");
                    var dsSource = new jsDataSet.DataSet("dsSource");
                    var tSource1 = dsSource.newTable("tSource1");
                    var tSource2 = dsSource.newTable("tSource2");
                    var tTarget1 = dsTarget.newTable("tSource1");
                    var tTarget2 = dsTarget.newTable("tSource2");
                    // colonne per il datasource
                    tSource1.setDataColumn("c_codice", "Decimal");
                    tSource1.setDataColumn("c_field1", "String");
                    tSource1.setDataColumn("c_field2", "String");
                    tSource2.setDataColumn("c_codice_2", "Decimal");
                    tSource2.setDataColumn("c_field1_2", "String");
                    tSource2.setDataColumn("c_field2_2", "String");
                    tTarget1.setDataColumn("c_codice", "Decimal");
                    tTarget1.setDataColumn("c_field1", "String");
                    tTarget1.setDataColumn("c_field2", "String");
                    tTarget2.setDataColumn("c_codice_2", "Decimal");
                    tTarget2.setDataColumn("c_field1_2", "String");
                    tTarget2.setDataColumn("c_field2_2", "String");
                    tSource1.key("c_codice");
                    tSource2.key("c_codice_2");
                    var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                    var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                    var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                    var objrow5 = { c_codice_2: 5, c_field1_2: "cinque", c_field2_2: "f2_5" };
                    var objrow6 = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };

                    var objrow7 = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };

                    tSource1.add(objrow1);
                    tSource1.add(objrow2);
                    tSource1.add(objrow3);
                    tSource1.add(objrow4);

                    tSource2.add(objrow5);
                    tSource2.add(objrow6);

                    tTarget2.add(objrow7);

                    // check preliminari
                    expect(tSource1.rows.length).toBe(4);
                    expect(tSource2.rows.length).toBe(2);
                    expect(tTarget1.rows.length).toBe(0);
                    expect(tTarget2.rows.length).toBe(1);
                    getDataUtils.mergeDataSet(dsTarget, dsSource);
                    // dopo il merge devo ritrovare le stringhe che avevo più quellenuove
                    expect(tTarget1.rows.length).toBe(4); // 0 + 4
                    expect(tTarget2.rows.length).toBe(3); // 2 + 1
                });

            it('mergeDataSet() merges a dsSource modified into dsTarget, with flag "changes committed to db" = true, easy case ',
                function () {

                    var dsTarget = new jsDataSet.DataSet("dsTarget");
                    var dsSource = new jsDataSet.DataSet("dsSource");
                    var tSource1 = dsSource.newTable("t1");
                    var tSource2 = dsSource.newTable("t2");

                    var tTarget1 = dsTarget.newTable("t1");
                    var tTarget2 = dsTarget.newTable("t2");
                    // colonne per il datasource
                    tSource1.setDataColumn("c_codice", "Decimal");
                    tSource1.setDataColumn("c_field1", "String");
                    tSource1.setDataColumn("c_field2", "String");

                    tSource2.setDataColumn("c_codice_2", "Decimal");
                    tSource2.setDataColumn("c_field1_2", "String");
                    tSource2.setDataColumn("c_field2_2", "String");

                    tTarget1.setDataColumn("c_codice", "Decimal");
                    tTarget1.setDataColumn("c_field1", "String");
                    tTarget1.setDataColumn("c_field2", "String");

                    tTarget2.setDataColumn("c_codice_2", "Decimal");
                    tTarget2.setDataColumn("c_field1_2", "String");
                    tTarget2.setDataColumn("c_field2_2", "String");

                    tTarget1.key("c_codice");
                    tSource1.key("c_codice");
                    //tSource2.key("c_codice_2");
                    var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                    var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                    var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                    var objrow5 = { c_codice_2: 5, c_field1_2: "cinque", c_field2_2: "f2_5" };
                    var objrow6 = { c_codice_2: 6, c_field1_2: "seiModificato", c_field2_2: "f2_6" };

                    var objrow7 = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };
                    var objrow8 = { c_codice_2: 8, c_field1_2: "otto", c_field2_2: "f2_5" };
                    var objrow9= { c_codice_2: 9, c_field1_2: "nove", c_field2_2: "f2_8" };

                    tSource1.add(objrow1);
                    tSource1.add(objrow2);
                    tSource1.add(objrow4);

                    tTarget1.add(objrow1);
                    tTarget1.add(objrow2);
                    tTarget1.add(objrow3);
                    tTarget1.add(objrow4);

                    // la 3 era deleted e infatti simulo che sul source non ci sia
                    tTarget1.acceptChanges();
                    tSource1.acceptChanges();

                    objrow3.getRow().del();  // jsDataSet.dataRowState.deleted;


                    tSource2.add(objrow5);
                    tSource2.add(objrow6);

                    tTarget2.add(objrow8);
                    tTarget2.add(objrow5);
                    tTarget2.add(objrow9);
                    tTarget2.add(objrow7);


                    tSource2.acceptChanges();
                    tTarget2.acceptChanges();

                    //simulo riga "modified"    
                    objrow7.getRow().old = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };
                    objrow7.getRow().state = jsDataSet.dataRowState.modified;
                    // cancello riga in pos 1
                    objrow8.getRow().del();
                    objrow9.getRow().del();

                    // check preliminari
                    expect(tSource1.rows.length).toBe(3);
                    expect(tSource2.rows.length).toBe(2);
                    expect(tTarget1.rows.length).toBe(4);
                    expect(tTarget2.rows.length).toBe(4);

                    var rowsPre =  tTarget2.select(q.eq("c_codice_2", 6));
                    expect(rowsPre[0].c_field1_2).toBe("sei");

                    getDataUtils.mergeDataSetChanges(dsTarget, dsSource, true);
                    expect(tTarget1.rows.length).toBe(3);
                    expect(objrow3.getRow).toBeUndefined(); // la 3 viene detachata, senza metodo getRow()

                    expect(objrow1.getRow).toBeDefined();
                    expect(objrow2.getRow).toBeDefined();
                    expect(objrow4.getRow).toBeDefined();

                    expect(tTarget2.rows.length).toBe(2); // 2 cancellate
                    expect(objrow5.getRow).toBeDefined();
                    expect(objrow7.getRow).toBeDefined();

                    // devono risultare detachate
                    expect(objrow8.getRow).toBeUndefined();
                    expect(objrow9.getRow).toBeUndefined();

                    var rowsPost =  tTarget2.select(q.eq("c_codice_2", 6));
                    expect(rowsPost[0].c_field1_2).toBe("seiModificato");
                });
                
            it('mergeDataSet() merges a dsSource modified into dsTarget, with flag "changes committed to db" = true, complex case ',
                    function () {

                            var dsTarget = new jsDataSet.DataSet("dsTarget");
                            var dsSource = new jsDataSet.DataSet("dsSource");
                            var tSource1 = dsSource.newTable("t1");
                            var tSource2 = dsSource.newTable("t2");

                            var tTarget1 = dsTarget.newTable("t1");
                            var tTarget2 = dsTarget.newTable("t2");
                            // colonne per il datasource
                            tSource1.setDataColumn("c_codice", "Decimal");
                            tSource1.setDataColumn("c_field1", "String");
                            tSource1.setDataColumn("c_field2", "String");

                            tSource2.setDataColumn("c_codice_2", "Decimal");
                            tSource2.setDataColumn("c_field1_2", "String");
                            tSource2.setDataColumn("c_field2_2", "String");

                            tTarget1.setDataColumn("c_codice", "Decimal");
                            tTarget1.setDataColumn("c_field1", "String");
                            tTarget1.setDataColumn("c_field2", "String");

                            tTarget2.setDataColumn("c_codice_2", "Decimal");
                            tTarget2.setDataColumn("c_field1_2", "String");
                            tTarget2.setDataColumn("c_field2_2", "String");

                            tTarget1.key("c_codice");
                            tSource1.key("c_codice");
                            //tSource2.key("c_codice_2");
                            var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                            var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                            var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                            var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                            var objrow5 = { c_codice_2: 5, c_field1_2: "cinque", c_field2_2: "f2_5" };
                            var objrow6 = { c_codice_2: 6, c_field1_2: "seiModificato", c_field2_2: "f2_6" };

                            var objrow7 = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };
                            var objrow8 = { c_codice_2: 8, c_field1_2: "otto", c_field2_2: "f2_5" };
                            var objrow9 = { c_codice_2: 9, c_field1_2: "nove", c_field2_2: "f2_8" };

                            var objrowToMod = { c_codice_2: 10, c_field1_2: "dieci", c_field2_2: "f2_10" };
                            var objrowMod = { c_codice_2: 10, c_field1_2: "dieciMod", c_field2_2: "f2_10mod" };

                            tSource1.add(objrow1);
                            tSource1.add(objrow2);
                            tSource1.add(objrow4);

                            tTarget1.add(objrow1);
                            tTarget1.add(objrow2);
                            tTarget1.add(objrow3);
                            tTarget1.add(objrow4);

                            // la 3 era deleted e infatti simulo che sul source non ci sia
                            tTarget1.acceptChanges();
                            tSource1.acceptChanges();

                            objrow3.getRow().del();  // jsDataSet.dataRowState.deleted;


                            tSource2.add(objrow5);
                            tSource2.add(objrow6);
                            tSource2.add(objrowMod);


                            tTarget2.add(objrow5);
                            tTarget2.add(objrow7);
                            tTarget2.add(objrow8);
                            tTarget2.add(objrowToMod);
                            tTarget2.add(objrow9);


                            tTarget2.acceptChanges();

                            //simulo riga "modified"    
                            objrow7.getRow().old = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };
                            objrow7.getRow().state = jsDataSet.dataRowState.modified;
                            objrowToMod.getRow().old = { c_codice_2: 10, c_field1_2: "dieci", c_field2_2: "f2_10" };
                            objrowToMod.getRow().state = jsDataSet.dataRowState.modified;
                            // cancello riga in pos 1
                            objrow8.getRow().del();
                            objrow9.getRow().del();
                            tSource2.acceptChanges();

                            // check preliminari
                            expect(tSource1.rows.length).toBe(3);
                            expect(tSource2.rows.length).toBe(3);
                            expect(tTarget1.rows.length).toBe(4);
                            expect(tTarget2.rows.length).toBe(5);

                            var rowsPre =  tTarget2.select(q.eq("c_codice_2", 6));
                            expect(rowsPre[0].c_field1_2).toBe("sei");

                            getDataUtils.mergeDataSetChanges(dsTarget, dsSource, true);
                            expect(tTarget1.rows.length).toBe(3);
                            expect(objrow3.getRow).toBeUndefined(); // la 3 viene detachata, senza metodo getRow()
                            expect(objrow1.getRow).toBeDefined();
                            expect(objrow2.getRow).toBeDefined();
                            expect(objrow4.getRow).toBeDefined();

                            expect(tTarget2.rows.length).toBe(3); // 2 deleted
                            expect(objrow5.getRow).toBeDefined();
                            expect(objrow7.getRow).toBeDefined();

                            // devono risultare detachate
                            expect(objrow8.getRow).toBeUndefined();
                            expect(objrow9.getRow).toBeUndefined();

                            var rowsPost =  tTarget2.select(q.eq("c_codice_2", 6));
                            expect(rowsPost[0].c_field1_2).toBe("seiModificato");

                            var rowsPost =  tTarget2.select(q.eq("c_codice_2", 10)); // quella frappsotatra 8 e 9 deleted, viene modificata
                            expect(rowsPost[0].c_field1_2).toBe("dieciMod");
                            expect(rowsPost[0].c_field2_2).toBe("f2_10mod");
                    }); 
                
            it('mergeDataSet() merges a dsSource modified into dsTarget, with flag "changes committed to db" = false, complex case ',
                    function () {

                            var dsTarget = new jsDataSet.DataSet("dsTarget");
                            var dsSource = new jsDataSet.DataSet("dsSource");
                            var tSource1 = dsSource.newTable("t1");
                            var tSource2 = dsSource.newTable("t2");

                            var tTarget1 = dsTarget.newTable("t1");
                            var tTarget2 = dsTarget.newTable("t2");
                            // colonne per il datasource
                            tSource1.setDataColumn("c_codice", "Decimal");
                            tSource1.setDataColumn("c_field1", "String");
                            tSource1.setDataColumn("c_field2", "String");

                            tSource2.setDataColumn("c_codice_2", "Decimal");
                            tSource2.setDataColumn("c_field1_2", "String");
                            tSource2.setDataColumn("c_field2_2", "String");

                            tTarget1.setDataColumn("c_codice", "Decimal");
                            tTarget1.setDataColumn("c_field1", "String");
                            tTarget1.setDataColumn("c_field2", "String");

                            tTarget2.setDataColumn("c_codice_2", "Decimal");
                            tTarget2.setDataColumn("c_field1_2", "String");
                            tTarget2.setDataColumn("c_field2_2", "String");

                            tTarget1.key("c_codice");
                            tSource1.key("c_codice");
                            //tSource2.key("c_codice_2");
                            var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                            var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                            var objrow3 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                            var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                            var objrow5 = { c_codice_2: 5, c_field1_2: "cinque", c_field2_2: "f2_5" };
                            var objrow6 = { c_codice_2: 6, c_field1_2: "seiModificato", c_field2_2: "f2_6" };

                            var objrow7 = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };
                            var objrow8 = { c_codice_2: 8, c_field1_2: "otto", c_field2_2: "f2_5" };
                            var objrow9 = { c_codice_2: 9, c_field1_2: "nove", c_field2_2: "f2_8" };

                            var objrowToMod = { c_codice_2: 10, c_field1_2: "dieci", c_field2_2: "f2_10" };
                            var objrowMod = { c_codice_2: 10, c_field1_2: "dieciMod", c_field2_2: "f2_10mod" };

                            tSource1.add(objrow1);
                            tSource1.add(objrow2);
                            tSource1.add(objrow4);

                            tTarget1.add(objrow1);
                            tTarget1.add(objrow2);
                            tTarget1.add(objrow3);
                            tTarget1.add(objrow4);

                            // la 3 era deleted e infatti simulo che sul source non ci sia
                            tTarget1.acceptChanges();
                            tSource1.acceptChanges();

                            objrow3.getRow().del();  // jsDataSet.dataRowState.deleted;


                            tSource2.add(objrow5);
                            tSource2.add(objrow6);
                            tSource2.add(objrow8);
                            tSource2.add(objrowMod);
                            tSource2.add(objrow9);

                            tTarget2.add(objrow5);
                            tTarget2.add(objrow7);
                            tTarget2.add(objrow8);
                            tTarget2.add(objrowToMod);
                            tTarget2.add(objrow9);

                            tSource2.acceptChanges();
                            tTarget2.acceptChanges();

                            //simulo riga "modified"    
                            objrow7.getRow().old = { c_codice_2: 6, c_field1_2: "sei", c_field2_2: "f2_6" };
                            objrow7.getRow().state = jsDataSet.dataRowState.modified;
                            objrowToMod.getRow().old = { c_codice_2: 10, c_field1_2: "dieci", c_field2_2: "f2_10" };
                            objrowToMod.getRow().state = jsDataSet.dataRowState.modified;
                            // cancello riga in pos 1
                            objrow8.getRow().del();
                            objrow9.getRow().del();

                            // check preliminari
                            expect(tSource1.rows.length).toBe(3);
                            expect(tSource2.rows.length).toBe(5);
                            expect(tTarget1.rows.length).toBe(4);
                            expect(tTarget2.rows.length).toBe(5);

                            var rowsPre =  tTarget2.select(q.eq("c_codice_2", 6));
                            expect(rowsPre[0].c_field1_2).toBe("sei");

                            getDataUtils.mergeDataSetChanges(dsTarget, dsSource, false);
                            expect(tTarget1.rows.length).toBe(4);
                            expect(objrow3.getRow).toBeDefined(); // la 3 viene detachata, senza metodo getRow()
                            expect(objrow1.getRow).toBeDefined();
                            expect(objrow2.getRow).toBeDefined();
                            expect(objrow4.getRow).toBeDefined();

                            expect(tTarget2.rows.length).toBe(5);
                            expect(objrow5.getRow).toBeDefined();
                            expect(objrow7.getRow).toBeDefined();

                            // devono risultare detachate
                            expect(objrow8.getRow).toBeDefined();
                            expect(objrow9.getRow).toBeDefined();

                            var rowsPost =  tTarget2.select(q.eq("c_codice_2", 6));
                            expect(rowsPost[0].c_field1_2).toBe("seiModificato");

                            var rowsPost =  tTarget2.select(q.eq("c_codice_2", 10));
                            expect(rowsPost[0].c_field1_2).toBe("dieciMod");
                            expect(rowsPost[0].c_field2_2).toBe("f2_10mod");
                    });

            it('cloneDataTable() clone a DatTable, new DatTable is another instance',
                function () {

                    var dsSource = new jsDataSet.DataSet("dsSource");
                    var tSource1 = dsSource.newTable("t1");

                    // colonne per il datasource
                    tSource1.setDataColumn("c_codice", "Decimal");
                    tSource1.setDataColumn("c_field1", "String");
                    tSource1.setDataColumn("c_field2", "String");

                    tSource1.key("c_codice");

                    var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                    var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                    tSource1.add(objrow1);
                    tSource1.add(objrow2);
                    tSource1.add(objrow4);

                    tSource1.acceptChanges();

                    var dtCloned = getDataUtils.cloneDataTable(tSource1);

                    expect(tSource1).not.toEqual(dtCloned);
                    expect((tSource1 === dtCloned)).toBe(false);
                    expect(dtCloned.name).toBe(tSource1.name);
                    var initRowsLengtDtCloned = dtCloned.rows.length;
                    expect(initRowsLengtDtCloned).toBe(tSource1.rows.length);

                    // tolgo riga al cloned, sul source non cambia nulla
                    dtCloned.rows[0].getRow().del();
                    dtCloned.acceptChanges();
                    expect(dtCloned.rows.length).toBe(initRowsLengtDtCloned - 1);
                    expect(tSource1.rows.length).toBe(initRowsLengtDtCloned);
                });

            it('cloneDataSet() clone a DataSet, new DataSet is another instance',
                    function () {

                            var dsSource = new jsDataSet.DataSet("dsSource");
                            var tSource1 = dsSource.newTable("t1");

                            // colonne per il datasource
                            tSource1.setDataColumn("c_codice", "Decimal");
                            tSource1.setDataColumn("c_field1", "String");
                            tSource1.setDataColumn("c_field2", "String");

                            tSource1.key("c_codice");

                            var objrow1 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                            var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                            var objrow4 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };

                            tSource1.add(objrow1);
                            tSource1.add(objrow2);
                            tSource1.add(objrow4);

                            tSource1.acceptChanges();

                            // invoco metodo di clone
                            var dsCloned = getDataUtils.cloneDataSet(dsSource);

                            expect(dsSource).not.toEqual(dsCloned);
                            expect((dsSource === dsCloned)).toBe(false);
                            expect(dsCloned.name).toBe(dsSource.name);
                            var initRowsLengtDtCloned = dsCloned.tables.t1.rows.length;
                            expect(initRowsLengtDtCloned).toBe(dsSource.tables.t1.rows.length);

                            // tolgo riga al cloned, sul source non cambia nulla
                            dsCloned.tables.t1.rows[0].getRow().del();
                            dsCloned.acceptChanges();
                            expect(dsCloned.tables.t1.rows.length).toBe(initRowsLengtDtCloned - 1);
                            expect(dsSource.tables.t1.rows.length).toBe(initRowsLengtDtCloned);
                    });

            it('containsNull() Returns true if there is a null value or "", for some value in row on the columns cols',
                function () {

                    var dsSource = new jsDataSet.DataSet("dsSource");
                    var tSource1 = dsSource.newTable("t1");

                    // colonne per il datasource
                    tSource1.setDataColumn("c_codice", "Decimal");
                    tSource1.setDataColumn("c_field1", "String");
                    tSource1.setDataColumn("c_field2", "String");

                    tSource1.key("c_codice");

                    var objrow1 = { c_codice: 1, c_field1: null, c_field2: "f2_1" };
                    var objrow2 = { c_codice: 2, c_field1: "due", c_field2: "" };
                    var objrow3 = { c_codice: 3, c_field1: "", c_field2: "" };
                    var objrow4 = { c_codice: 4, c_field1: "4", c_field2: "f4" };

                    tSource1.add(objrow1);
                    tSource1.add(objrow2);
                    tSource1.add(objrow3);
                    tSource1.acceptChanges();

                    // invoco metodo di clone
                    var containsNull1 = getDataUtils.containsNull(objrow1, tSource1.columns);
                    var containsNull2 = getDataUtils.containsNull(objrow2, tSource1.columns);
                    var containsNull3 = getDataUtils.containsNull(objrow3, tSource1.columns);
                    var containsNull4 = getDataUtils.containsNull(objrow4, tSource1.columns);
                    expect(containsNull1).toBe(true);
                    expect(containsNull2).toBe(true);
                    expect(containsNull3).toBe(true);
                    expect(containsNull4).toBe(false);

                });

            it('isSameRow() Returns true if r1 and r2 are the same row',
                function () {

                    var dsSource = new jsDataSet.DataSet("dsSource");
                    var tSource1 = dsSource.newTable("t1");

                    // colonne per il datasource
                    tSource1.setDataColumn("c_codice", "Decimal");
                    tSource1.setDataColumn("c_field1", "String");
                    tSource1.setDataColumn("c_field2", "String");

                    tSource1.key(["c_codice","c_field1"]);

                    var objrow1 = { c_codice: 1, c_field1: null, c_field2: "f2_1" };
                    var objrow2 = { c_codice: 1, c_field1: "due", c_field2: "" };
                    var objrow3 = { c_codice: 1, c_field1: "due", c_field2: "f3" };
                    var objrow4 = { c_codice: 4, c_field1: "due", c_field2: "f4" };

                    tSource1.add(objrow1);
                    tSource1.add(objrow2);
                    tSource1.add(objrow3);
                    tSource1.acceptChanges();

                    // invoco metodo di clone
                    var isSameRow1 = getDataUtils.isSameRow(tSource1, objrow1, objrow2);
                    var isSameRow2 = getDataUtils.isSameRow(tSource1, objrow1, objrow3);
                    var isSameRow3 = getDataUtils.isSameRow(tSource1, objrow1, objrow4);
                    var isSameRow4 = getDataUtils.isSameRow(tSource1, objrow2, objrow3);
                    var isSameRow5 = getDataUtils.isSameRow(tSource1, objrow2, objrow4);
                    expect(isSameRow1).toBe(false);
                    expect(isSameRow2).toBe(false);
                    expect(isSameRow3).toBe(false);
                    expect(isSameRow4).toBe(true);
                    expect(isSameRow5).toBe(false);

                });


        });
});
