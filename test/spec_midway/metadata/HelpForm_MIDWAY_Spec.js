"use strict";
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */

describe("helpForm midway",
    function(){
        var Deferred = appMeta.Deferred;
        var HelpForm = appMeta.HelpForm;
        var stabilize = appMeta.stabilize;
        var Stabilizer = appMeta.Stabilizer;
        var common = appMeta.common;
        var state;
        var helpForm;
        var ds;
        var t1, t2, t3;
        var objrow1, objrow2, objrow3, objrow4, objrow5, objrow6, objrow7;

        var q = window.jsDataQuery;

        // Separatori
        var numberDecimalSeparator = appMeta.numberDecimalSeparator;
        var numberGroupSeparator = appMeta.numberGroupSeparator;
        var currencyDecimalSeparator = appMeta.currencyDecimalSeparator;
        var currencySymbol = appMeta.currencySymbol;
        var origDoGet; // mock funz doGet


        /**
         * @class ConnMockServer
         * @summary ConnMockServer
         * @description
         *
         */
        function ConnMockServer(){
            "use strict";
        }

        ConnMockServer.prototype = {

            /**
             * Override of call method
             * @method callGet
             * @public
             * @param {string} method
             * @param {Object} prm
             * @returns {Promise}
             */
            call: function (objConn){
                if (this[objConn.method]) return this[objConn.method](objConn.prm);
                throw  "method " + objConn.method + " not defined on ConnMockServer";
            },


            // ********** Private methods. They are customized based on unit test **********
            /**
             * @param prm
             * @returns {Promise}
             */
            select: function (prm){
                var ds = new jsDataSet.DataSet("temp");
                var datasource = ds.newTable("datasource");
                var cCodice = "c_codice";
                var cField1 = "c_field1";
                var cField2 = "c_field2";
                // colonne per il datasource
                datasource.setDataColumn(cCodice, "Decimal");
                datasource.setDataColumn(cField1, "String");
                datasource.setDataColumn(cField2, "String");

                return $.Deferred().resolve(datasource).promise();
            },

        };

        // invoca la getToolBarManager per instanziare la toolbar, che poi sarà richiamata nei vari freshForm
        beforeAll(function (){
            appMeta.basePath = "base/";
            appMeta.config.defaultDecimalFormat = "c";
            appMeta.config.defaultDecimalPrecision = 2;

            appMeta.logger.setLanguage(appMeta.localResourceIt);
        });

        beforeEach(function (){
            Stabilizer.nesting = 0;
            //jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function (){
                return new $.Deferred().resolve();
            };

            appMeta.common.buildDs1();
            ds = appMeta.common.ds1;
            t1 = appMeta.common.t1;
            t2 = appMeta.common.t2;
            t3 = appMeta.common.t3;
            objrow1 = appMeta.common.objrow1;
            objrow2 = appMeta.common.objrow2;
            objrow3 = appMeta.common.objrow3;
            objrow4 = appMeta.common.objrow4;
            objrow5 = appMeta.common.objrow5;
            objrow6 = appMeta.common.objrow6;
            objrow7 = appMeta.common.objrow7;

            appMeta.dbClickTimeout = 1;

            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";
            // costrusico ogetto stato e ds
            state = new appMeta.MetaPageState();

            state.DS = ds;
            // inizializzo la form
            helpForm = new HelpForm(state, "table1", "#rootelement");

            // seleziono anche la lastSelected. Per default nei test è la 1. la possocambiare all'interno dei singoli test se voglio
            helpForm.lastSelected(t1, objrow1);

            // imposto mock del backend
            appMeta.connection = new ConnMockServer();

            origDoGet = appMeta.getData.doGet;
            appMeta.getData.doGet = function (){
                return new $.Deferred().resolve().promise();
            };
        });

        afterEach(function (done){
            appMeta.getData.doGet = origDoGet;
            stabilize(true).then(done);
        });

        describe("HelpForm class",
            function (){

                describe("CHECK_BOX threestate",
                    function (){
                        it("get correct checkbox state",
                            function (done){
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" data-threestate="true" data-tag="table3.c_sex:maschio:femmina">' +
                                    "</div>";
                                $("html").html(mainDiv);
                                // reinizializzo l'oggetto helpForm. la tab principale in queasto test è table3
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                helpForm.preScanControls();
                                helpForm.lastSelected(t3,
                                    objrow7); // prendo quella con il valore nullo, quindi deve settare INDETERMINATE=true
                                helpForm.fillControls()
                                .then(function (){
                                    expect($("#mycheck1").is(":indeterminate")).toBe(true);

                                    $("#mycheck1").click(); // simulo il click
                                    return stabilize(true); //il checkbox scatena Deferred!!
                                })
                                .then(function (){
                                    // INDETERMINATE -> UNCHECKED

                                    expect($("#mycheck1").is(":indeterminate")).toBe(false);
                                    expect($("#mycheck1").is(":checked")).toBe(false);

                                    // UNCHECKED -> CHECKED
                                    $("#mycheck1").click(); // simulo il click
                                    return stabilize(true); //il checkbox scatena Deferred!!
                                })
                                .then(function (){
                                    expect($("#mycheck1").is(":indeterminate")).toBe(false);
                                    expect($("#mycheck1").is(":checked")).toBe(true);

                                    // CHECKED -> INDETERMINATE
                                    $("#mycheck1").click(); // simulo il click
                                    return stabilize(true);
                                })
                                .then(function (){
                                    expect($("#mycheck1").is(":indeterminate")).toBe(true);

                                    // ESEGUO LA GET su altra riga. da femmina deve diventare null, poichè è stato indeterminate
                                    helpForm.lastSelected(t3, objrow6);
                                    expect(objrow6.c_sex).toBe("femmina"); // prendo quella con il valore nullo
                                    helpForm.getControls();
                                    expect(objrow6.c_sex).toBe(null);
                                    done();
                                });


                            });
                    });

                describe("Enter/Leave/Select/Click row Events",
                    function (){
                        it("INPUT TEXT - Enter/Leave events - DECIMAL and DOUBLE",
                            function (done){
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="table1.c_name"><br>' +
                                    '<input type="text" id="txtBox2" data-tag="table1.c_dec"><br>' +
                                    '<input type="text" id="txtBox3" data-tag="table1.c_double"><br>' +
                                    '<input type="text" id="txtBox4" data-tag="table1.c_dec.fixed.3..%.100"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents();
                                    return helpForm.fillControls();
                                })
                                .then(function (){

                                    // testo i valori prima del FOCUS
                                    var txt2Init = currencySymbol + " 11" + currencyDecimalSeparator + "00";
                                    var txt3Init = "1" + numberGroupSeparator + "001" + numberDecimalSeparator + "00";
                                    var txt4Init = "1" +
                                        numberGroupSeparator +
                                        "100" +
                                        numberDecimalSeparator +
                                        "000 %";

                                    // valori che mi aspetto dopo il focus
                                    var txt2Focus = "11" + currencyDecimalSeparator + "00";
                                    var txt3Focus = "1001" + numberDecimalSeparator + "00";
                                    var txt4Focus = "1100" + numberDecimalSeparator + "000";
                                    expect($("#txtBox2").val()).toBe(txt2Init);
                                    expect($("#txtBox3").val()).toBe(txt3Init);
                                    expect($("#txtBox4").val()).toBe(txt4Init);


                                    //helpForm.enterNumTextBox.call($("#txtBox2"), helpForm);
                                    $("#txtBox2").focus(); // simulo focus
                                    expect($("#txtBox2").val()).toBe(txt2Focus); // mi aspetto il nuovo valore

                                    $("#txtBox2").blur(); // simulo blur
                                    expect($("#txtBox2").val())
                                    .toBe(txt2Init); // dopo il blur mi aspetto il valore di partenza

                                    $("#txtBox3").focus();
                                    expect($("#txtBox3").val()).toBe(txt3Focus); // mi aspetto il nuovo valore

                                    $("#txtBox3").blur();
                                    expect($("#txtBox3").val()).toBe(txt3Init);

                                    $("#txtBox4").focus();
                                    expect($("#txtBox4").val()).toBe(txt4Focus); // mi aspetto il nuovo valore

                                    $("#txtBox4").blur();
                                    expect($("#txtBox4").val()).toBe(txt4Init);
                                    done();


                                });


                            });

                        it("INPUT TEXT - Enter/Leave events - DATETIME",
                            function (done){
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="table3.c_date"><br>' +
                                    '<input type="text" id="txtBox2" data-tag="table3.c_int16.year"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                helpForm.lastSelected(t3, objrow5); // seleziono la riga con la colonna c_data
                                helpForm.preScanControls()
                                .then(() => {
                                    // per robustezza del test faccio anche la fillControls()
                                    return helpForm.fillControls();
                                })
                                .then(function (){
                                    $("#txtBox1")
                                    .val(
                                        "02/10/1980"); // quello preso dal dataset, vedi objrow5 come è inizializzato
                                    $("#txtBox2")
                                    .val("2018"); // quello preso dal dataset, vedi objrow5 come è inizializzato

                                    var txtblur = "07/02/2018";
                                    // provo vari formati inseriti
                                    var txtInput1 = "07 02 2018";
                                    var txtInput2 = "7 02 2018";
                                    var txtInput3 = "7 02 18";
                                    var txtInput4 = "7 2 18";
                                    var txtInput5 = "07 2 18";

                                    helpForm.addEvents();

                                    _.forEach([txtInput1, txtInput2, txtInput3, txtInput4, txtInput5],
                                        function (input){
                                            $("#txtBox1").val(input);
                                            $("#txtBox1").blur(); // simulo blur
                                            expect($("#txtBox1").val()).toBe(txtblur);
                                        });

                                    $("#txtBox1").val("7 2 8");
                                    $("#txtBox1").blur(); // simulo blur
                                    expect($("#txtBox1").val()).toBe("07/02/2008");

                                    $("#txtBox2").val("18");
                                    $("#txtBox2").blur();
                                    expect($("#txtBox2").val()).toBe("2018");

                                    $("#txtBox2").val("1");
                                    $("#txtBox2").blur();
                                    expect($("#txtBox2").val()).toBe("2001");
                                    done();

                                });


                            });

                        it("SELECT - Change Event case 1",
                            function (done){

                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="datasource.x">' +
                                    '<input type="text" id="txtBox3" data-tag="trel.c_text">' +
                                    "<div><p>" +
                                    '<input type="text" id="txtBox4" data-tag="datasource.x">' +
                                    "</div></p>" +
                                    '<input type="checkbox" id="mycheck1" data-tag="t.c_sex:maschio:femmina">' +
                                    '<input type="radio" id="radio1" name="season" value="winter" checked data-tag="t.c_season:winter"> winter<br>' +
                                    '<input type="radio" id="radio2" name="season" value="spring" data-tag="t.c_season:spring"> spring<br>' +
                                    '<input type="radio" id="radio3" name="season" value="summer" data-tag="t.c_season:summer"> summer <br>' +
                                    '<input type="radio" id="radio4" name="season" value="autumn" data-tag="t.c_season:autumn"> autumn' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox2"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" id="radio5" name="op" value="add" data-tag="+"> Add<br>' +
                                    '<input type="radio" id="radio6" name="op" value="sub" data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    '<select id="combo1" data-tag="t.c_codice"   data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_name">' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var cCodice = "c_codice";
                                var cName = "c_name";
                                var fieldX = "x";
                                // costruisco ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                state.meta = new appMeta.MetaData('datasource');
                                var ds = new jsDataSet.DataSet("temp");
                                var datasource = ds.newTable("datasource");
                                datasource.isTemporaryTable = true;
                                datasource.insertFilter = q.eq(cCodice, "3");
                                datasource.searchFilter = null;
                                var t = ds.newTable("t");
                                var trel = ds.newTable("trel");

                                ds.newRelation("r1", "trel", [cCodice], "datasource", [cCodice]);

                                // colonne per il datasource
                                datasource.setDataColumn(cCodice, "Decimal");
                                datasource.setDataColumn(cName, "String");
                                datasource.setDataColumn(fieldX, "Int32");

                                // colonne per il datasource
                                trel.setDataColumn(cCodice, "Decimal");
                                trel.setDataColumn("c_text", "String");

                                //tabella principale
                                t.setDataColumn(cCodice, "Decimal");
                                t.setDataColumn("field1", "String"); // colonna di test per textbox
                                t.setDataColumn("c_sex", "String"); // colonna di test per checkbox
                                t.setDataColumn("c_season", "String"); // colonna di test per radio button
                                t.setDataColumn("ctemp", "Single"); // colonna di test per valuesigned

                                var objrow1 = {c_codice: 1, c_name: "uno", x: 10};
                                var objrow2 = {c_codice: 2, c_name: "due", x: 20};
                                var objrow3 = {c_codice: 3, c_name: "tre", x: 30};
                                var objrow4 = {c_codice: 4, c_name: "quattro", x: 40};
                                datasource.add(objrow1);
                                datasource.add(objrow2);
                                datasource.add(objrow3);
                                datasource.add(objrow4);

                                var objrow5 = {
                                    ckey: "key1",
                                    c_codice: 1,
                                    "field1": "v5",
                                    "c_sex": "maschio",
                                    "c_season": "winter",
                                    "ctemp": 11
                                };
                                var objrow6 = {
                                    ckey: "key2",
                                    c_codice: 2,
                                    "field1": "v6",
                                    "c_sex": "maschio",
                                    "c_season": "winter",
                                    "ctemp": 21
                                };
                                var objrow7 = {
                                    ckey: "key3",
                                    c_codice: 3,
                                    "field1": "v7",
                                    "c_sex": "maschio",
                                    "c_season": "winter",
                                    "ctemp": 31
                                };
                                var objrow8 = {
                                    ckey: "key4",
                                    c_codice: 4,
                                    "field1": "v8",
                                    "c_sex": "femmina",
                                    "c_season": "spring",
                                    "ctemp": 41
                                };
                                t.add(objrow5);
                                t.add(objrow6);
                                t.add(objrow7);
                                t.add(objrow8);

                                var objrow9 = {c_codice: 1, "c_text": "100"};
                                var objrow10 = {c_codice: 2, "c_text": "200"};
                                var objrow11 = {c_codice: 3, "c_text": "300"};
                                var objrow12 = {c_codice: 4, "c_text": "400"};
                                trel.add(objrow9);
                                trel.add(objrow10);
                                trel.add(objrow11);
                                trel.add(objrow12);

                                state.DS = ds;

                                var metapage = new appMeta.MetaPage('t', 'def', false);
                                metapage.state = state;
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow7);
                                metapage.helpForm = helpForm;

                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    return helpForm.fillControls();
                                })
                                .then(function (){
                                    // TESTO ELEMENTI DELLA TAB PRINCIPALE DOPO LA FILL E PRIMA DEL CHANGE
                                    // TEST CHECKBOX

                                    // la riga objrow7 ha maschio su c_sex ,che corrisponde al valore selezionato
                                    expect($("#mycheck1").is(":checked")).toBe(true);

                                    // TEST RADIO
                                    expect($("#radio1").is(":checked"))
                                    .toBe(true); // la riga objrow7 ha winter, quindi seleziona la prima radio
                                    expect($("#radio2").is(":checked")).toBe(false);
                                    expect($("#radio3").is(":checked")).toBe(false);
                                    expect($("#radio4").is(":checked")).toBe(false);
                                    // TEST VALUESIGNED
                                    expect($("#txtBox2").val())
                                    .toBe("31" + numberDecimalSeparator + "00"); // valore di ctemp di objrow8
                                    expect($("#radio5").is(":checked"))
                                    .toBe(true); // il sign è "+" quindi la seleziona
                                    expect($("#radio6").is(":checked")).toBe(false);
                                    // COMBO principale che fa scattare l'evento di "change"
                                    expect($("#combo1").html())
                                    .toBe(
                                        '<option value=""></option><option value="2">due</option><option value="4">quattro</option><option value="3" data-select2-id="2">tre</option><option value="1">uno</option>');
                                    expect($("#combo1").val())
                                    .toBe("3"); // objrow7 è la lastSelected quindi codice "3"


                                    var s = stabilize();
                                    // **** simulo la selezione del valore "4" - corrisponde ad objrow8 ***
                                    $("#combo1").val(4);
                                    $("#combo1").trigger('change');
                                    //$('#combo1').trigger({type: 'select2:select'});
                                    return s;
                                })
                                .then(function (){
                                    // **** L'ELEMENTO CHE AFFERISCE ALLA STESSA TABELLA CAMBIA
                                    // scatta il sel del codice 4, sulla relazione corrisponde alla riga objrow8 di t, quindi il field1 deve valere "v8"
                                    expect($("#txtBox1").val()).toBe("40");
                                    expect($("#txtBox4").val()).toBe("40"); // nested control
                                    // ha una relazione con il datasouce quindi al change prende il valore che sta sulla nuova chiave
                                    expect($("#txtBox3").val()).toBe("400");


                                    // **** GLI ELEMENTI DELLA TABELLA PRINCIPALE RIMANGONO GLI STESSI
                                    expect($("#mycheck1").is(":checked")).toBe(true);
                                    expect($("#radio1").is(":checked")).toBe(true);
                                    expect($("#radio2").is(":checked")).toBe(false);
                                    expect($("#radio3").is(":checked")).toBe(false);
                                    expect($("#radio4").is(":checked")).toBe(false);
                                    expect($("#txtBox2").val()).toBe("31" + numberDecimalSeparator + "00");
                                    expect($("#radio5").is(":checked")).toBe(true);
                                    expect($("#radio6").is(":checked")).toBe(false);

                                    done();
                                });

                            });

                        it("SELECT - Change Event 2",
                            function (done){
                                var mainwin = '<div id="rootelement">' +
                                    '<select id="combomaster" data-tag="dmaster.c_codice"  data-source-name="dmaster" data-value-member="c_codice"  data-display-member="c_name">' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var dmaster = ds.newTable("dmaster");
                                dmaster.isTemporaryTable = true;
                                dmaster.insertFilter = q.eq("c_codice", "3");
                                dmaster.searchFilter = null;

                                // colonne per il datasource
                                dmaster.setDataColumn("c_codice", "Decimal");
                                dmaster.setDataColumn("c_name", "String");

                                var objrow1 = {"c_codice": 1, "c_name": "nome1"};
                                var objrow2 = {"c_codice": 2, "c_name": "nome2"};
                                dmaster.add(objrow1);
                                dmaster.add(objrow2);

                                state.DS = ds;
                                state.meta = new appMeta.MetaData('dmaster');
                                var metapage = new appMeta.MetaPage('dmaster', 'def', false);
                                metapage.state = state;
                                helpForm = new HelpForm(state, "dmaster", "#rootelement");
                                metapage.helpForm = helpForm;
                                helpForm.lastSelected(dmaster, objrow1);
                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    return helpForm.fillControls();
                                })
                                .then(function (){
                                    expect($("#combomaster").val()).toBe("1");
                                    done();
                                });

                            });


                        it("SELECT - Change Event 3",
                            function (done){
                                var mainwin = '<div id="rootelement">' +
                                    '<select id="combo3" data-tag="t.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_field1">' +
                                    "</select><BR>" +
                                    '<select id="combo4" data-tag="t.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_field2">' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var cCodice = "c_codice";
                                var cField1 = "c_field1";
                                var cField2 = "c_field2";
                                // costruisco ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var datasource = ds.newTable("datasource");
                                datasource.isTemporaryTable = true;
                                datasource.insertFilter = q.eq(cCodice, "3");
                                datasource.searchFilter = null;
                                var t = ds.newTable("t");

                                // colonne per il datasource
                                datasource.setDataColumn(cCodice, "Decimal");
                                datasource.setDataColumn(cField1, "String");
                                datasource.setDataColumn(cField2, "String");
                                var objrow1 = {c_codice: 1, c_field1: "uno", c_field2: "f2_1"};
                                var objrow2 = {c_codice: 2, c_field1: "due", c_field2: "f2_2"};
                                var objrow3 = {c_codice: 3, c_field1: "tre", c_field2: "f2_3"};
                                var objrow4 = {c_codice: 4, c_field1: "quattro", c_field2: "f2_4"};
                                datasource.add(objrow1);
                                datasource.add(objrow2);
                                datasource.add(objrow3);
                                datasource.add(objrow4);

                                //tabella principale
                                t.setDataColumn(cCodice, "Decimal");
                                t.setDataColumn("field1", "String"); // colonna di test per textbox
                                t.setDataColumn("c_sex", "String"); // colonna di test per checkbox
                                t.setDataColumn("c_season", "String"); // colonna di test per radio button
                                t.setDataColumn("ctemp", "Single"); // colonna di test per valuesigned
                                var objrow5 = {
                                    ckey: "key1",
                                    c_codice: 1,
                                    "field1": "v5",
                                    "c_sex": "maschio",
                                    "c_season": "winter",
                                    "ctemp": 11
                                };
                                var objrow6 = {
                                    ckey: "key2",
                                    c_codice: 2,
                                    "field1": "v6",
                                    "c_sex": "maschio",
                                    "c_season": "winter",
                                    "ctemp": 21
                                };
                                var objrow7 = {
                                    ckey: "key3",
                                    c_codice: 3,
                                    "field1": "v7",
                                    "c_sex": "maschio",
                                    "c_season": "winter",
                                    "ctemp": 31
                                };
                                var objrow8 = {
                                    ckey: "key4",
                                    c_codice: 4,
                                    "field1": "v8",
                                    "c_sex": "femmina",
                                    "c_season": "spring",
                                    "ctemp": 41
                                };
                                t.add(objrow5);
                                t.add(objrow6);
                                t.add(objrow7);
                                t.add(objrow8);


                                state.DS = ds;

                                var metapage = new appMeta.MetaPage('t', 'def', false);
                                metapage.state = state;
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow7);
                                metapage.helpForm = helpForm;

                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    return helpForm.fillControls();
                                })
                                .then(function (){

                                    expect($("#combo3").val()).toBe("3");
                                    expect($("#combo3>option:selected").html()).toBe("tre");
                                    var s = stabilize();
                                    $("#combo3").val("4").change(); // **** simulo la selezione del valore "4" - corrisponde ad objrow4 ***
                                    return s;
                                })
                                .then(function (){
                                    expect($("#combo3").val()).toBe("4");
                                    expect($("#combo3>option:selected").html()).toBe("quattro");
                                    expect($("#combo4>option:selected").html()).toBe("f2_4");
                                    done();
                                });


                            });

                        it("SELECT - Change Event 4. Grid + Combo, UNCHANGED state of rows",
                            function (done){
                                var mainwin = '<div id="rootelement">' +
                                    '<div id="grid1" data-tag="table2.c_codice" data-custom-control="grid"></div>' +
                                    '<select id="combo3" data-tag="table2.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_field1">' +
                                    '</select>' +
                                    '</div>';
                                $("html").html(mainwin);

                                // costruisco oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var table2 = ds.newTable("table2");

                                // colonne per il datasource
                                table2.setDataColumn("c_codice", "Decimal");
                                table2.setDataColumn("c_field1", "String");
                                table2.columns["c_codice"].caption = "CODICE";
                                table2.columns["c_field1"].caption = "FIELD1";
                                var objrow1 = {c_codice: 1, c_field1: "uno"};
                                var objrow2 = {c_codice: 2, c_field1: "due"};
                                var objrow3 = {c_codice: 3, c_field1: "tre"};
                                var objrow4 = {c_codice: 4, c_field1: "quattro"};
                                table2.add(objrow1);
                                table2.add(objrow2);
                                table2.add(objrow3);
                                table2.add(objrow4);

                                var datasource = ds.newTable("datasource");
                                datasource.isTemporaryTable = true;
                                datasource.insertFilter = q.eq("c_codice", "3");
                                datasource.searchFilter = null;
                                // colonne per il datasource
                                datasource.setDataColumn("c_codice", "Decimal");
                                datasource.setDataColumn("c_field1", "String");
                                var objrow5 = {c_codice: 1, c_field1: "uno"};
                                var objrow6 = {c_codice: 3, c_field1: "tre"};
                                var objrow7 = {c_codice: 4, c_field1: "quattro"};
                                datasource.add(objrow5);
                                datasource.add(objrow6);
                                datasource.add(objrow7);

                                state.DS = ds;
                                state.meta = new appMeta.MetaData('dmaster');
                                state.currentRow = objrow1;
                                var metapage = new appMeta.MetaPage('table2', 'def', false);
                                helpForm = new HelpForm(state, "table2", "#rootelement");
                                helpForm.lastSelected(table2, objrow1);
                                metapage.helpForm = helpForm;
                                metapage.state = state;
                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    return helpForm.fillControls();
                                })
                                .then(() => {
                                    stabilize(true).then(function (){
                                        // setto lo stato unchanged
                                        table2.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                        table2.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                        table2.rows[2].getRow().state = jsDataSet.dataRowState.unchanged;
                                        table2.rows[3].getRow().state = jsDataSet.dataRowState.unchanged;

                                        datasource.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                        datasource.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                        datasource.rows[2].getRow().state = jsDataSet.dataRowState.unchanged;


                                        expect($("#grid1").find("tr").length).toBe(5);
                                        expect($("#combo3").val()).toBe("1");
                                        //expect($("#combo3").html()).toBe('<option value=""></option><option value="4">quattro</option><option value="3">tre</option><option value="1" data-select2-id="2">uno</option>');
                                        var res = stabilize();
                                        $("#grid1").find("tr").eq(1).click(); // clicco sulla prima riga dei dati
                                        return res;
                                    })
                                    .then(function (){
                                        expect($("#combo3").val()).toBe("1");
                                        var res = stabilize();
                                        $("#grid1").find("tr").eq(2).click(); // clicco sulla seconda riga dei dati
                                        return res;
                                    })
                                    .then(function (){

                                        expect($("#combo3").val()).toBe(null); // non esiste il valore sulla combo
                                        var res = stabilize();
                                        $("#grid1").find("tr").eq(3).click(); // clicco sulla prima terza dei dati
                                        return res;
                                    })
                                    .then(function (){
                                        expect($("#combo3").val()).toBe("3");
                                        done();
                                    });


                                });
                            });

                        it("SELECT - Change Event 4. Grid + Combo, CHANGED state of rows, show msgBox",
                            function (done){
                                var mainwin = '<div id="rootelement">' +
                                    '<div id="grid1" data-tag="table2.c_codice" data-custom-control="grid"></div>' +
                                    '<select id="combo3" data-tag="table2.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_field1">' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);

                                // costruisco oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var table2 = ds.newTable("table2");

                                // colonne per il datasource
                                table2.setDataColumn("c_codice", "Decimal");
                                table2.setDataColumn("c_field1", "String");
                                table2.columns["c_codice"].caption = "CODICE";
                                table2.columns["c_field1"].caption = "FIELD1";
                                var objrow1 = {c_codice: 1, c_field1: "uno"};
                                var objrow2 = {c_codice: 2, c_field1: "due"};
                                var objrow3 = {c_codice: 3, c_field1: "tre"};
                                var objrow4 = {c_codice: 4, c_field1: "quattro"};
                                objrow1 = table2.add(objrow1).current;
                                objrow2 = table2.add(objrow2).current;
                                objrow3 = table2.add(objrow3).current;
                                objrow4 = table2.add(objrow4).current;

                                var datasource = ds.newTable("datasource");
                                datasource.isTemporaryTable = true;
                                datasource.insertFilter = q.eq("c_codice", 3);
                                datasource.searchFilter = null;
                                // colonne per il datasource
                                datasource.setDataColumn("c_codice", "Decimal");
                                datasource.setDataColumn("c_field1", "String");
                                var objrow5 = {c_codice: 1, c_field1: "uno"};
                                var objrow6 = {c_codice: 3, c_field1: "tre"};
                                var objrow7 = {c_codice: 4, c_field1: "quattro"};
                                objrow5 = datasource.add(objrow5).current;
                                objrow6 = datasource.add(objrow6).current;
                                objrow7 = datasource.add(objrow7).current;

                                state.DS = ds;
                                state.meta = new appMeta.MetaData('dmaster');
                                state.currentRow = objrow1;
                                var metapage = new appMeta.MetaPage('table2', 'def', false);
                                helpForm = new HelpForm(state, "table2", "#rootelement");
                                helpForm.lastSelected(table2, objrow1);
                                metapage.helpForm = helpForm;
                                metapage.state = state;
                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    return helpForm.fillControls();
                                })
                                .then(() => {
                                    // setto lo stato unchanged
                                    table2.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                    table2.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                    table2.rows[2].getRow().state = jsDataSet.dataRowState.unchanged;
                                    table2.rows[3].getRow().state = jsDataSet.dataRowState.unchanged;

                                    datasource.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                    datasource.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                    // N.B la terza riga rimane nello stato added

                                    expect($("#grid1").find("tr").length).toBe(5);
                                    expect($("#combo3").val()).toBe("1");
                                    // expect($("#combo3").html()).toBe(
                                    //         '<option value=""></option><option value="4">quattro</option><option value="3">tre</option><option value="1" data-select2-id="21">uno</option>');
                                    var s = stabilize();
                                    $("#grid1").find("tr").eq(1).click(); // clicco sulla prima riga dei dati
                                    return s;
                                })
                                .then(function (){
                                    expect($("#combo3").val()).toBe("1");
                                    // mi dovrebbe mostrare la messageBox, poichè la 3riga di datasource è in stato added io premo tasto chiusura
                                    var s = stabilize();
                                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                    .then(function (){
                                        $(".modal").find("button")[0].click();
                                    });
                                    $("#grid1").find("tr").eq(3).click(); // clicco sulla seconda riga dei dati
                                    return s;
                                })
                                .then(function (){
                                    expect($("#combo3").val()).toBe("1"); // mi aspetto che non cambi nulla
                                    expect(datasource.rows.length).toBe(3); // non ho permesso la discard dei cambiamenti, quindi il ds con la riga cambiata ,ancora ce l'ha
                                    var s = stabilize();
                                    // mi dovrebbe mostrare la messageBox, Stavolta premo su ok, quindi sulla combo appare il valore 3. inoltre facendo la discard dei dati, perdo la riga added sul datasource
                                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                    .then(function (){
                                        $(".modal").find("button")[1].click();
                                    });
                                    $("#grid1").find("tr").eq(3).click(); // riclicco sulla seconda riga dei dati
                                    return s;
                                })
                                .then(function (){

                                    expect($("#combo3").val()).toBe("3"); // ho premuto ok sulla msgBox che diceva c'erano cambiamenti
                                    expect(datasource.rows.length).toBe(2); // ho fatto la discard dei dati, quindi mi aspetto che su datasource ci siano 2 righe

                                    // Rimetto in stato added, quindi mi deve mostrare la msgBox perchè ci sono modifiche
                                    datasource.rows[0].getRow().state = jsDataSet.dataRowState.added;

                                    var s = stabilize();
                                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                    .then(function (){
                                        $(".modal").find("button")[2].click();
                                    });

                                    $("#grid1").find("tr").eq(1).click(); // riclicco sulla prima riga dei dati
                                    return s;
                                })
                                .then(function (){
                                    expect($("#combo3").val()).toBe("3"); // ho premuto annulla sulla msgBox , rimane valore 3

                                    var s = stabilize();
                                    // mi dovrebbe mostrare la messageBox, Stavolta premo su ok, quindi sulla combo appare il valore 1. inoltre facendo la discard dei dati, perdo la riga added sul datasource
                                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                    .then(function (){
                                        $(".modal").find("button")[1].click(); //premo ok, quindi faccio la discard dei dati
                                    });

                                    $("#grid1").find("tr").eq(1).click(); // riclicco sulla seconda riga dei dati
                                    return s;
                                })
                                .then(function (){
                                    expect($("#combo3").val()).toBe(null); // ho premuto ok sulla msgBox che diceva c'erano cambiamenti, mentre sulla griglia sul valore 1, che none esiste più sulla combo
                                    expect(datasource.rows.length).toBe(1); // ho fatto la discard dei dati, quindi mi aspetto che su datasource rimanga 1 sola riga
                                    expect($("#combo3 > option").length).toBe(2);
                                    // gli unici valori che rimangono sono , la riga vuota e l'ipzione 3
                                    expect($("#combo3 > option")[0].text).toBe("");
                                    expect($("#combo3 > option")[1].text).toBe("tre");

                                    done();
                                });

                                // --> da qui in poi non ci sono più righe in stato diverso da unchached, quindi non deve mostrare messageBox
                                /*$("#grid1").find("tr").eq(1).click(); // riclicco sulla prima riga dei dati
                                jasmine.clock().tick(300);
                                expect($("#combo3").val()).toBe("1"); // ho premuto annulla sulla msgBox , rimane valore 3
                                */
                            },
                            3000);

                        it('GRID must be master/detail',
                            function (done){
                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();

                                var ds = new jsDataSet.DataSet("temp1");
                                var t1 = ds.newTable("table1");
                                var t2 = ds.newTable("table2");
                                ds.newRelation("r1", "table1", ["key"], "table2", ["key"]);

                                // setto le prop delle colonne per t1
                                t1.setDataColumn("key", "String");
                                t1.setDataColumn("field1", "String");

                                t2.setDataColumn("key", "String");
                                t2.setDataColumn("field1", "String");

                                t1.columns["key"].caption = "key_1";
                                t1.columns["field1"].caption = "field_1";
                                t2.columns["key"].caption = "key_2";
                                t2.columns["field1"].caption = "field_2";

                                //
                                var r1 = {key: "key1", field1: "f1"};
                                var r2 = {key: "key2", field1: "f2"};
                                r1 = t1.add(r1).current;
                                r2 = t1.add(r2).current;

                                var r3 = {key: "key1", field1: "f3"};
                                var r4 = {key: "key2", field1: "f4"};
                                var r5 = {key: "key2", field1: "f5"};
                                r3 = t2.add(r3).current;
                                r4 = t2.add(r4).current;
                                r5 = t2.add(r5).current;

                                // imposto la chiave
                                t1.key("key");
                                t2.key("key");
                                state.DS = ds;

                                t1.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                t1.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                t2.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                t2.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                t2.rows[2].getRow().state = jsDataSet.dataRowState.unchanged;


                                // inizializzo metapage, usata in AddEvents
                                var metapage = new appMeta.MetaPage('table1', 'def', false);
                                metapage.state = state;
                                state.meta = new appMeta.MetaData('dmaster');
                                // inizializzo la form
                                var helpForm = new HelpForm(state, "table1", "#rootelement");
                                helpForm.lastSelected(t1, r1);
                                metapage.helpForm = helpForm;
                                var mainwin = '<div id="rootelement">' +
                                    '<div id="grid1" data-tag="table1.key" data-custom-control="grid"></div>' +
                                    '<div id="grid2" data-tag="table2.key" data-custom-control="grid" data-master="table1"></div></div>';
                                $("html").html(mainwin);

                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    spyOn(metapage, "showMessageOkCancel").and.callThrough();
                                    return helpForm.fillControls();
                                })
                                .then(function (){
                                    expect($("#grid1").find("tr").length).toBe(3);
                                    expect($("#grid2").find("tr").length)
                                    .toBe(
                                        2); // filtrata sulla relazione, quindi vedo solo key1 + header poichè ho selezionato r1 su t1
                                    expect($("#grid2").find("tr").find("td").eq(0).text()).toBe("key1");
                                    expect($("#grid2").find("tr").find("td").eq(1).text()).toBe("f3");
                                    var s = stabilize();
                                    $("#grid1").find("tr").eq(2).click();
                                    return s;
                                })
                                .then(function (){
                                    // non ci sono righe cambiate quindi non deve partire la messageBox
                                    expect(metapage.showMessageOkCancel).not.toHaveBeenCalled();
                                    // seleziono chiave key2
                                    expect($("#grid2").find("tr").length).toBe(3);
                                    expect($("#grid2").find("tr").find("td").eq(0).text()).toBe("key2");
                                    expect($("#grid2").find("tr").find("td").eq(1).text()).toBe("f4");
                                    expect($("#grid2").find("tr").find("td").eq(2).text()).toBe("key2");
                                    expect($("#grid2").find("tr").find("td").eq(3).text()).toBe("f5");
                                    done();

                                });
                            });

                        it('GRID must be master/detail, row modified on detail',
                            function (done){
                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();

                                var ds = new jsDataSet.DataSet("temp1");
                                var t1 = ds.newTable("table1");
                                var t2 = ds.newTable("table2");
                                ds.newRelation("r1", "table1", ["key"], "table2", ["key"]);

                                // setto le prop delle colonne per t1
                                t1.setDataColumn("key", "String");
                                t1.setDataColumn("field1", "String");

                                t2.setDataColumn("key", "String");
                                t2.setDataColumn("field1", "String");

                                t1.columns["key"].caption = "key_1";
                                t1.columns["field1"].caption = "field_1";
                                t2.columns["key"].caption = "key_2";
                                t2.columns["field1"].caption = "field_2";

                                //
                                var r1 = {key: "key1", field1: "f1"};
                                var r2 = {key: "key2", field1: "f2"};
                                r1 = t1.add(r1).current;
                                r2 = t1.add(r2).current;

                                var r3 = {key: "key1", field1: "f3"};
                                var r4 = {key: "key2", field1: "f4"};
                                var r5 = {key: "key2", field1: "f5"};
                                r3 = t2.add(r3).current;
                                r4 = t2.add(r4).current;
                                r5 = t2.add(r5).current;

                                // imposto la chiave
                                t1.key("key");
                                t2.key("key");
                                state.DS = ds;

                                t1.rows[0].getRow().state = jsDataSet.dataRowState.unchanged;
                                t1.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                t2.rows[0].getRow().state = jsDataSet.dataRowState.added; // simulo una riga aggiunta
                                t2.rows[1].getRow().state = jsDataSet.dataRowState.unchanged;
                                t2.rows[2].getRow().state = jsDataSet.dataRowState.unchanged;


                                // inizializzo metapage, usata in AddEvents

                                var metapage = new appMeta.MetaPage('table1', 'def', false);
                                metapage.state = state;
                                // inizializzo la form
                                var helpForm = new HelpForm(state, "table1", "#rootelement");
                                helpForm.lastSelected(t1, r1);
                                metapage.helpForm = helpForm;
                                var mainwin = '<div id="rootelement">' +
                                    '<div id="grid1" data-tag="table1.key" data-custom-control="grid"></div>' +
                                    '<div id="grid2" data-tag="table2.key" data-custom-control="grid" data-master="table1"></div></div>';
                                $("html").html(mainwin);


                                helpForm.preScanControls()
                                .then(() => {
                                    helpForm.addEvents(metapage);
                                    return helpForm.fillControls();
                                })
                                .then(function (){
                                    spyOn(metapage, "showMessageOkCancel").and.callThrough();

                                    expect($("#grid1").find("tr").length).toBe(3);
                                    expect($("#grid2").find("tr").length)
                                    .toBe(
                                        2); // filtrata sulla relazione, quindi vedo solo key1 + header poichè ho selezionato r1 su t1
                                    expect($("#grid2").find("tr").find("td").eq(0).text()).toBe("key1");
                                    expect($("#grid2").find("tr").find("td").eq(1).text()).toBe("f3");
                                    var s = stabilize();
                                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                    .then(function (){
                                        expect($(".modal").length).toBe(1); // c'è una messagebox
                                        $(".modal").find("button")[0].click();
                                    });
                                    $("#grid1").find("tr").eq(2).click();
                                    return s;
                                })
                                .then(function (){
                                    expect(metapage.showMessageOkCancel).toHaveBeenCalled();
                                    // rimangono stessi dati
                                    expect($("#grid2").find("tr").find("td").eq(0).text()).toBe("key1");
                                    expect($("#grid2").find("tr").find("td").eq(1).text()).toBe("f3");
                                    done();
                                });


                            });

                        it('editclick()', function (done){

                            var mainwin = '<div id="rootelement">' +
                                '<div id="grid1" data-tag="table1.key" data-custom-control="grid"></div><br>' +
                                '<button id="btn1" data-tag="edit">Edit</button>' +
                                '</div>';
                            $("html").html(mainwin);

                            //costruisco oggetto stato e ds
                            var state = new appMeta.MetaPageState();

                            var ds = new jsDataSet.DataSet("temp1");
                            var t1 = ds.newTable("table1");

                            // setto le prop delle colonne per t1
                            t1.setDataColumn("key", "String");
                            t1.setDataColumn("field1", "String");

                            t1.columns["key"].caption = "key_1";
                            t1.columns["field1"].caption = "field_1";

                            var r1 = {key: "key1", field1: "f1"};
                            var r2 = {key: "key2", field1: "f2"};
                            r1 = t1.add(r1).current;
                            r2 = t1.add(r2).current;
                            // imposto la chiave
                            t1.key("key");
                            state.DS = ds;

                            var metapage = new appMeta.MetaPage('table1', 'def', false);
                            var helpForm = new HelpForm(state, "table1", "#rootelement");
                            helpForm.lastSelected(t1, r2);
                            metapage.helpForm = helpForm;
                            metapage.state = state;

                            helpForm.preScanControls()
                            .then(() => {
                                helpForm.addEvents(metapage);
                                return helpForm.fillControls();
                            })
                            .then(function (){
                                expect($("#grid1").find("tr").length).toBe(3);
                                //$("#btn1").click();
                                done();
                            });
                        });

                    });

            });

        describe("Focus Field",
            function (){

                it('focus field should work',
                    function (){
                        var mainwin = '<div id="firstroot">' +
                            '<input type="text" id="txtBox0" data-my="v"><br>' +
                            "</div>" +
                            '<div id="rootelement">' +
                            'NoTag: <input type="text" id="txtBox00" data-notag="table1.c_name" value="notag"><br>' +
                            'Nome: <input type="text" id="txtBox1" data-tag="table1.c_name" value="ric"><br>' +
                            '<div id="otherdiv">' +
                            'Eta: <input type="text" id="txtBox2" data-tag="table1.c_dec" value="37"><br>' +
                            '</div>' +
                            "</div>";

                        $("html").html(mainwin);
                        var ds = new jsDataSet.DataSet("temp1");
                        var t1 = ds.newTable("table1");

                        // setto le prop delle colonne per t1
                        t1.setDataColumn("c_name", "String");
                        t1.setDataColumn("c_dec", "Decimal");

                        var r1 = {"c_name": "ric", "c_dec": 11};
                        var r2 = {"c_name": "pro", "c_dec": 12};
                        r1 = t1.add(r1).current;
                        r2 = t1.add(r2).current;
                        var helpForm = new HelpForm(state, "table2", "#rootelement");

                        helpForm.focusField("c_name", r1.getRow().table.name);
                        expect($(document.activeElement)).toEqual($("#txtBox1"));
                        expect($(document.activeElement)).not.toEqual($("#txtBox2"));
                        helpForm.focusField("c_dec", r1.getRow().table.name);
                        expect($(document.activeElement)).toEqual($("#txtBox2"));
                        expect($(document.activeElement)).not.toEqual($("#txtBox1"));
                        // n.b $(":focus"); qui questo non funziona su jasmine, questo si invevce $(document.activeElement)
                    });

                xit('focus field on tab nested',
                    function (){
                        // TODO controllare test!
                        $("html").html("");
                        jasmine.getFixtures().fixturesPath = 'base/test/spec_midway/fixtures';
                        loadFixtures('tabTest.html');
                        helpForm.preScanControls();
                        helpForm.focusField("c_name", objrow1.getRow().table.name);
                        $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                        $("head").append('<script defer src="/base/test/app/styles/bootstrap/js/bootstrap.js"></script>');
                        expect($(document.activeElement)).toEqual($("#int3"));
                        // verifico siano attivi i tab che mi aspetto
                        expect($('.nav-tabs .active > a').attr('href')).toBe('#2');
                        expect($('.nav-tabs .active > a[href="#2"]').length).toBe(1);
                        expect($('.nav-tabs .active > a[href="#22"]').length).toBe(1);
                        // verifico tutti gli altri tab non siano attivi
                        expect($('.nav-tabs .active > a[href="#1"]').length).toBe(0);
                        expect($('.nav-tabs .active > a[href="#3"]').length).toBe(0);
                        expect($('.nav-tabs .active > a[href="#21"]').length).toBe(0);
                        expect($('.nav-tabs .active > a[href="#23"]').length).toBe(0);
                    });
            });

        describe("Add custom Events on standard button",
            function (){

                // TODO è giusto fallisca,poichè ho cambiato la gestione dei bottoni in girglia. riprogettare con griglia
                xit('Add/Edit/Delete buttons have attached events',
                    function (done){
                        var mainwin = '<div id="rootelement">' +
                            '<button id="btn1" type="button" data-tag="insert">Add</button>' +
                            '<button id="btn2" type="button" data-tag="edit">Edit</button>' +
                            '<button id="btn3" type="button" data-tag="delete">Delete</button>' +
                            '</div>';

                        $("html").html(mainwin);
                        var metapage = new appMeta.MetaPage('table1', 'def', false);
                        metapage.helpForm = helpForm;
                        helpForm.addEvents(metapage);


                        common.eventWaiter(metapage, appMeta.EventEnum.insertClick)
                        .then(function (){
                            // vedo solo se la console non torna errori
                            expect(true).toBe(true);
                        });
                        $("#btn1").click();


                        common.eventWaiter(metapage, appMeta.EventEnum.editClick)
                        .then(function (){
                            // vedo solo se la console non torna errori
                            expect(true).toBe(true);
                        });
                        $("#btn2").click();

                        common.eventWaiter(metapage, appMeta.EventEnum.deleteClick)
                        .then(function (){
                            // vedo solo se la console non torna errori
                            expect(true).toBe(true);
                            done();
                        });

                        $("#btn3").click();

                    });

                it('Edit button raises event and call EditGridRow',
                    function (done){
                        var mainwin = '<div id="rootelement">' +
                            '<div>' +
                            '<div id="grid0" data-tag="table2.c_codice" data-custom-control="grid"></div>' +
                            '</div>' +
                            '<div id="grid1" data-tag="table2.c_codice" data-custom-control="grid" data-mdlbuttonedit></div>' +
                            '</div>';

                        $("html").html(mainwin);

                        var metapage = new appMeta.MetaPage('table2', 'def', false);
                        var meta = new appMeta.MetaData();
                        metapage.helpForm = helpForm;
                        state.meta = meta;
                        metapage.state = state;

                        helpForm.preScanControls()
                        .then(() => {
                            helpForm.addEvents(metapage);
                            var grid = $("#grid1").data("customController");
                            grid.forceSelectRow = true;

                            var editclickdone = false;
                            var originEditGridRow = metapage.editGridRow;
                            metapage.editGridRow = function (){
                                editclickdone = true;
                                return appMeta.Deferred('editGridRow').resolve().promise();
                            };

                            grid.fillControl($("#grid1"))
                            .then(function (){
                                expect($("#grid1").find("tr").length).toBe(2);
                                var s = stabilize();
                                $($($("#grid1").find("tr")[1]).find("td:eq(2)")[0]).find("div").click(); // clicco su bottone di edit
                                s.then(function (){
                                    metapage.editGridRow = originEditGridRow;
                                    expect(editclickdone).toBeTruthy();
                                    done();
                                });

                            });

                        });

                    });


                it('Insert button raises event and invoke insertClick() method',
                    function (done){
                        var mainwin = '<div id="rootelement">' +
                            '<div>' +
                            '<div id="grid0" data-tag="table2.c_codice" data-custom-control="grid"></div>' +
                            '</div>' +
                            '<div id="grid1" data-tag="table2.c_codice" data-custom-control="grid" data-mdlbuttoninsert></div>' +
                            '</div>';

                        $("html").html(mainwin);

                        var metapage = new appMeta.MetaPage('table2', 'def', false);
                        var meta = new appMeta.MetaData();
                        metapage.helpForm = helpForm;
                        metapage.primaryTable = t1;
                        state.meta = meta;
                        metapage.state = state;
                        t2.columns["c_name"].caption = "NOME";
                        t2.columns["c_citta"].caption = "CITTA";

                        var insertclickdone = false;

                        // mocked function. per comprire altri rami della funzione
                        metapage.insertClick = function (){
                            var def = Deferred('insertClick');
                            insertclickdone = true;
                            return def.resolve();
                        }

                        helpForm.preScanControls()
                        .then(() => {
                            helpForm.addEvents(metapage);
                            var grid = $("#grid1").data("customController");
                            grid.forceSelectRow = true;
                            grid.fillControl($("#grid1"))
                            .then(function (){
                                expect($("#grid1").find("tr").length).toBe(2);
                                var s = stabilize();
                                $($($("#grid1").find("tr")[0]).find("th:eq(2)")[0]).find("div").click();
                                s.then(function (){
                                    expect(insertclickdone).toBeTruthy();
                                    done();
                                });

                            });
                        }); // serve per leggere il GridController

                    });

                fit('AutoChoose attaches events on textbox, with mock of function choose() on MetaPage',
                    function (done){

                        var mainwin = '<div id="rootelement">' +
                            '<div data-tag="AutoChoose.myname.ListType.StartFilter">' +
                            '<input type="text" name="myname" id="txtBox1" data-tag="table1.c_name" value="ric"><br>' +
                            '<input type="text" name="yourname" id="txtBox2" data-tag="table1.c_name" value="pro"><br>' +
                            '</div>' +
                            '</div>';
                        $("html").html(mainwin);
                        let metapage = new appMeta.MetaPage('table1', 'def', false);
                        metapage.state = state;
                        metapage.helpForm = helpForm;
                        helpForm.preScanControls()
                        .then(() => {
                            console.log("preScanControls called");
                            helpForm.addEvents(metapage);
                            var fChooseOriginal = metapage.choose;
                            // mock funzione choose
                            metapage.choose = function (command, filter, origin){
                                return Deferred().resolve(true).promise();
                            };
                            common.eventWaiter(helpForm.metaPage, appMeta.EventEnum.textBoxGotFocus)
                            .then(function (){
                                expect(helpForm.lastValidText()).toBe("txtBox1#ric");
                                console.log("textBoxLostFocus to call");
                                // per semplicità simulo il blur direttamente chiamando il metodo per semplicità con i prm giusti
                                helpForm.textBoxLostFocus.call($("#txtBox1"), helpForm)
                                .then(function (){
                                    console.log("textBoxLostFocus called");
                                    // nessun cambio all'interno del text
                                    expect(helpForm.lastValidText()).toBe("txtBox1#ric");
                                    // cambio del testo all'interno della text
                                    $("#txtBox1").val("new text");

                                    helpForm.textBoxLostFocus.call($("#txtBox1"), helpForm)
                                    .then(function (){
                                        expect(helpForm.lastValidText()).toBe("txtBox1#new text");
                                        metapage.choose = fChooseOriginal; //ripristino funz prima del mock
                                        done();
                                    });

                                });
                            });

                            console.log("txtBox1 focused");
                            $("#txtBox1").focus(); // simulo focus
                        });


                    });
            });
    });
