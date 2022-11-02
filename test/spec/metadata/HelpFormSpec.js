"use strict";
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */

describe("helpForm",
    function() {
        var HelpForm = appMeta.HelpForm;
        var stabilize = appMeta.stabilize;
        var Stabilizer = appMeta.Stabilizer;
        var state;
        var helpForm;
        var ds;
        var t1, t2, t3, tParent;
        var objrow1, objrow2, objrow3, objrow4, objrow5, objrow6, objrow7, objrow1Parent, objrow2Parent;
        
        var q = window.jsDataQuery;
        // Separatori
        var numberDecimalSeparator = appMeta.numberDecimalSeparator;
        var currencyDecimalSeparator = appMeta.currencyDecimalSeparator;
        var currencySymbol = appMeta.currencySymbol;
        var TypedObject = appMeta.TypedObject;
        
        beforeEach(function() {
            Stabilizer.nesting = 0;
            //jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

            appMeta.basePath = "base/";

            // mock funzione async describeColumns()
            appMeta.MetaData.prototype.describeColumns = function() {
                return new $.Deferred().resolve();
            };

            appMeta.common.buildDs1();
            ds = appMeta.common.ds1;
            tParent = appMeta.common.tParent;
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

            objrow1Parent = appMeta.common.objrow1Parent;
            objrow2Parent = appMeta.common.objrow2Parent;
            
            appMeta.dbClickTimeout = 1;

            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";
            // costruisco oggetto stato e ds
            state = new appMeta.MetaPageState();
        
            state.DS = ds;
            // inizializzo la form
            helpForm = new HelpForm(state, "table1", "#rootelement");

            // Seleziono anche la lastSelected. Per default nei test è la 1. la posso cambiare all'interno dei singoli test se voglio
            helpForm.lastSelected(t1, objrow1);

        });

        afterEach(function(done) {
            stabilize(true).then(done);
        });

        describe("HelpForm class",
            function() {

                // *** General test appMeta object ***
                it("exists",
                    function() {
                        expect(helpForm).toBeDefined();
                    });

                describe("auxiliar function",
                    function() {
                        it("getStandardTag()",
                            function() {

                                var tag = helpForm.getStandardTag("");
                                expect(tag).toBe(null);

                                tag = helpForm.getStandardTag("t.f");
                                expect(tag).toBe("t.f");

                                tag = helpForm.getStandardTag("t.f?t2.s");
                                expect(tag).toBe("t.f");

                                tag = helpForm.getStandardTag("t.f.year");
                                expect(tag).toBe("t.f.year");

                            });

                        it("completeTag()",
                            function() {
                                var tag = helpForm.completeTag("table1.c_name");
                                expect(tag).toBe("table1.c_name.g");

                                tag = helpForm.completeTag("table1.c_name.myformat");
                                expect(tag).toBe("table1.c_name.myformat");

                                // la Datacolumn che passo nel BeforeEach metta con tipo Decimal
                                tag = helpForm.completeTag("table1.c_dec",
                                    helpForm.DS.tables["table1"].columns["c_dec"]);
                                expect(tag).toBe("table1.c_dec.c");
                            });

                        //N.B: I dati nel TypedObj sono quelli presenti sul ds, provenienti quindi dal database
                        //ne prendo la rappresentazione a stringa, cioè xcome li vede l'utente. Ovviamente dipende dal tipo di colonna
                        it("stringValue()",
                            function() {

                                var pObj = new TypedObject("String", "valore1");
                                var s = pObj.stringValue("table1.c_name");
                                expect(s).toBe("valore1");

                                pObj = new TypedObject("Decimal", 11); // currency
                                // come secondo prm vuole un tag completo
                                s = pObj.stringValue("table1.c_dec.c");
                                expect(s).toBe(currencySymbol + " 11" + currencyDecimalSeparator + "00");

                                pObj = new TypedObject("Decimal", 11); // number
                                // come secondo prm vuole un tag completo
                                s = pObj.stringValue("table1.c_dec.n");
                                expect(s).toBe("11" + numberDecimalSeparator + "00");

                                pObj = new TypedObject("Double", 11); // number
                                // come secondo prm vuole un tag completo
                                s = pObj.stringValue("table1.c_dec.n");
                                expect(s).toBe("11" + numberDecimalSeparator + "00");

                                pObj = new TypedObject("Decimal", 0.10); // ad esempio 10 percento
                                // come secondo prm vuole un tag completo
                                s = pObj.stringValue(" table1.c_dec.fixed.3.prefix.suffix.100");
                                expect(s).toBe("prefix 10" + numberDecimalSeparator + "000 suffix");

                                pObj = new TypedObject("DateTime", new Date(2018, 0, 25));
                                // come secondo prm vuole un tag completo
                                s = pObj.stringValue("table1.c_dec.d");
                                expect(s).toBe("25/01/2018");

                                pObj = new TypedObject("DateTime", new Date(2018, 0, 25, 15, 6));
                                // come secondo prm vuole un tag completo
                                s = pObj.stringValue("table1.c_dec.g");
                                expect(s).toBe("25/01/2018 15.06");


                            });

                        // in value di TypedObj ci deve finire la rappresentazione valida per il backend. Quindi leggo la stringa e la devo
                        // trasformare in un oggetto backend friendly. Ovviamente a secondo del tipo specificato
                        it("TypedObject()",
                            function() {
                                var to = new TypedObject("String", "miovalore", "table1.c_name");
                                expect(to.typeName).toBe("String");
                                expect(to.value).toBe("miovalore");

                                to = new TypedObject("Char", "miovalore", "table1.c_name");
                                expect(to.typeName).toBe("Char");
                                expect(to.value).toBe("m");

                                // DOUBLE
                                //senza fieldtype specificato
                                to = new TypedObject("Double", "102", "table1.c_dec");
                                expect(to.typeName).toBe("Double");
                                expect(to.value).toBe(102);
                                // con fieldtype specificato n
                                to = TypedObject("Double", "102", "table1.c_dec.n");
                                expect(to.typeName).toBe("Double");
                                expect(to.value).toBe(102);

                                to = TypedObject("Double",
                                    "prefix 102" + numberDecimalSeparator + "001 suffix",
                                    "table1.c_dec.fixed.3.prefix.suffix.100");
                                expect(to.typeName).toBe("Double");
                                expect(to.value).toBe(1.02001);

                                to = TypedObject("Double",
                                    "102" + numberDecimalSeparator + "001 %",
                                    "table1.c_dec.fixed.3..%.100");
                                expect(to.typeName).toBe("Double");
                                expect(to.value).toBe(1.02001);

                                to = new TypedObject("Double",
                                    "# 102" + numberDecimalSeparator + "001",
                                    "table1.c_dec.fixed.3.#..100");
                                expect(to.typeName).toBe("Double");
                                expect(to.value).toBe(1.02001);

                                to = new TypedObject("Double",
                                    "102" + numberDecimalSeparator + "001",
                                    "table1.c_dec.fixed.3...100");
                                expect(to.typeName).toBe("Double");
                                expect(to.value).toBe(1.02001);

                                // SINGLE
                                //senza fieldtype specificato
                                to = new TypedObject("Single", "102", "table1.c_dec");
                                expect(to.typeName).toBe("Single");
                                expect(to.value).toBe(102);

                                // con fieldtype specificato n
                                to = new TypedObject("Single", "102", "table1.c_dec.n");
                                expect(to.typeName).toBe("Single");
                                expect(to.value).toBe(102);

                                // DECIMAL (fa sempre il .tofixed(2))
                                //senza fieldtype specificato
                                to = new TypedObject("Decimal", "102", "table1.c_dec");
                                expect(to.typeName).toBe("Decimal");
                                expect(to.value).toBe(102.00);

                                // con fieldtype specificato n
                                to = new TypedObject("Decimal", "102", "table1.c_dec.n");
                                expect(to.typeName).toBe("Decimal");
                                expect(to.value).toBe(102.00);

                                to = new TypedObject("Decimal",
                                    "prefix 102" + numberDecimalSeparator + "001 suffix",
                                    "table1.c_dec.fixed.3.prefix.suffix.100");
                                expect(to.typeName).toBe("Decimal");
                                expect(to.value).toBe(1.02001);

                                // DateTime
                                to = new TypedObject("DateTime", "25/01/2018", "table1.c_dec.d");
                                expect(to.typeName).toBe("DateTime");
                                expect(to.value.constructor.name).toBe("Date");
                                expect(to.value.getDate()).toBe(25);
                                expect(to.value.getMonth() + 1).toBe(1);
                                expect(to.value.getFullYear()).toBe(2018);
                            });

                        it("getLastField()",
                            function() {
                                var tag = "AutoManage.TextBoxName.EditType.StartFilter";
                                var sf = helpForm.getLastField(tag, 3);
                                expect(sf).toBe('StartFilter');
                            });

                        it("lastSelected() with several row state returns right value",
                            function() {
                                // seleziono anche la lastSelected. Per default nei test è la 1. la posso cambiare all'interno dei singoli test se voglio
                                helpForm.lastSelected(t1, objrow2);
                                var lsRow = helpForm.lastSelected(t1);
                                expect(objrow2).toEqual(lsRow);

                                // era addedd, mette detached, tricorda detached toglie la getRow
                                objrow2.getRow().del();
                                var lsRow = helpForm.lastSelected(t1);
                                expect(lsRow).toEqual(null);

                                // tutte righe unchanged, quando faccio la delete, stavolta la getRow rimane, la lastSelected() deve comuqnue tornare null
                                t1.acceptChanges();
                                helpForm.lastSelected(t1, objrow1);
                                objrow1.getRow().del();
                                var lsRow = helpForm.lastSelected(t1);
                                expect(lsRow).toEqual(null);
                            });

                        it("existsDataAttribute() returns true if data-attribute is present, false otherwise",
                            function(done) {
                              
                                var mainwin ='<input type="text" id="t1" data-tag="table1.c_name" data-onlytag data-zerotag="0" data-falsetag="false" value="notag">';
                                $("html").html(mainwin);
                                
                                expect(helpForm.existsDataAttribute($("#t1"), "tag")).toBeTruthy();
                                expect(helpForm.existsDataAttribute($("#t1"), "onlytag")).toBeTruthy();
                                expect(helpForm.existsDataAttribute($("#t1"), "zerotag")).toBeTruthy();
                                expect(helpForm.existsDataAttribute($("#t1"), "falsetag")).toBeTruthy();

                                expect(helpForm.existsDataAttribute($("#t1"), "notag")).toBeFalsy();
                                done();
                            });
                    });

                describe("getControls() method",
                    function() {
                        it("INPUT TEXT - should update correct fields",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, co i tag che mi servono.
                                // Ho inserito 2 div, di cui 1 con l'id del rooteleemtn che mi aspetto
                                // Ho inoltre inserito 2 tag data-tag con la formatazione attesa
                                var mainwin = '<div id="firstroot">' +
                                    'Textbox0: <input type="text" id="txtBox0" data-my="v"><br>' +
                                    "</div>" +
                                    '<div id="rootelement">' +
                                    'NoTag: <input type="text" id="txtBox00" data-notag="table1.c_name" value="notag"><br>' +
                                    'Nome: <input type="text" id="txtBox1" data-tag="table1.c_name" value="ric"><br>' +
                                    'Eta: <input type="text" id="txtBox2" data-tag="table1.c_dec" value="37"><br>' +
                                    "</div>";

                                $("html").html(mainwin);
                                helpForm.getControls();
                                expect(helpForm.DS.tables["table1"]).toBeDefined();
                                expect(helpForm.DS.tables["table1"].rows.length).toBe(2);
                                expect(helpForm.DS.tables["table1"].rows[0].c_name).toBe("ric");
                                expect(helpForm.DS.tables["table1"].rows[0].c_dec).toBe(37.00);
                                stabilize(true).then(done);
                            });

                        it("INPUT TEXT - should update correct fields on subEntity table",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, co i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    'Nome: <input type="text" id="txtBox1" data-ntag="table1.c_name" value="ric"><br>' +
                                    'Eta: <input type="text" id="txtBox2" data-ntag="table1.c_dec" value="37"><br>' +
                                    'Citta: <input type="text" id="txtBox3" data-tag="table2.c_citta" data-subentity="true" value="napoli"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                helpForm.getControls();
                                expect(helpForm.DS.tables["table2"]).toBeDefined();
                                expect(helpForm.DS.tables["table2"].rows.length).toBe(2);
                                expect(helpForm.DS.tables["table2"].rows[0].c_citta).toBe("napoli");
                                expect(helpForm.DS.tables["table2"].rows[1].c_citta).toBe("bari"); // l'altra riga che non matcha sulla chiave della selected row rimane con la città di partenza
                                stabilize(true).then(done);
                            });

                        it("INPUT TEXT - should update correct fields on Primary and Subentity tables",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, co i tag che mi servono.
                                // Ho inserito 2 div, di cui 1 con l'id del rooteleemtn che mi aspetto
                                // Ho inoltre inserito 2 tag data-tag con la formatazione attesa
                                var mainwin = '<div id="firstroot">' +
                                    'Textbox0: <input type="text" id="txtBox0" data-my="v"><br>' +
                                    "</div>" +
                                    '<div id="rootelement">' +
                                    'Eta: <input type="text" id="txtBox2" data-tag="table1.c_dec" value="30"><br>' +
                                    'Citta: <input type="text" id="txtBox3" data-tag="table2.c_citta" data-subentity="true" value="napoli"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                helpForm.getControls();
                                // cambia il valore della riga primaria
                                expect(helpForm.DS.tables["table1"].rows[0].c_dec).toBe(30.00);
                                // cambio la riga della tabella subentity
                                expect(helpForm.DS.tables["table2"].rows[0].c_citta).toBe("napoli");
                                stabilize(true).then(done);
                            });

                        it("INPUT DATE - should update correct fields",
                            function(done) {
                                // date default YYYY-MM-DD
                                var mainwin = '<div id="rootelement">' +
                                    'Data: <input type="date" id="txtBox1" data-tag="table3.c_date.dd" value ="2018-06-11"><br>' +
                                    "</div>";

                                $("html").html(mainwin);
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                helpForm.lastSelected(t3, objrow5);
                                helpForm.getControls();
                                expect(helpForm.DS.tables["table3"]).toBeDefined();
                                expect(helpForm.DS.tables["table3"].rows[0].c_date.getDate()).toBe(11);
                                expect(helpForm.DS.tables["table3"].rows[0].c_date.getMonth() + 1).toBe(6);
                                expect(helpForm.DS.tables["table3"].rows[0].c_date.getFullYear()).toBe(2018);
                                stabilize(true).then(done);
                            });
                        
                        it("SELECT combo STRING column - should update correct fields on Primary table",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, co i tag che mi servono.
                                // Ho inserito 2 div, di cui 1 con l'id del rooteleemtn che mi aspetto
                                // Ho inoltre inserito 2 tag data-tag con la formatazione attesa
                                var mainwin = '<div id="firstroot">' +
                                    'Textbox0: <input type="text" id="txtBox0" data-my="v"><br>' +
                                    "</div>" +
                                    '<div id="rootelement">' +
                                    'Eta: <input type="text" id="txtBox2" data-tag="table1.c_dec" value="30"><br>' +
                                    '<select id="combo1" data-tag="table1.c_name" data-source-name="table2" data-value-member="c_name">' +
                                    '<option value="value1">ric1</option>' +
                                    '<option value="value2" selected="selected">ric2</option>' +
                                    '<option value="value3">ric3</option>' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            helpForm.getControls();
                                            // cambia il valore della riga primaria. Deve mettere quello dell'opzione selezionata.
                                            // la c_name è di tipo String
                                            expect(helpForm.DS.tables["table1"].rows[0].c_name).toBe("value2");
                                            stabilize(true).then(done);
                                    });
                             });

                        it("SELECT combo DECIMAL column - should update correct fields on Primary table",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<select id="combo1" data-tag="table1.c_dec" data-source-name="table2" data-value-member="c_name">' +
                                    '<option value="1">ric1</option>' +
                                    '<option value="2" >ric2</option>' +
                                    '<option value="3" selected="selected">ric3</option>' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            // per sicurezza verifico quello di partenza sia quello della last selected cioè 11
                                            expect(helpForm.DS.tables["table1"].rows[0].c_dec).toBe(11);
                                            helpForm.getControls();
                                            expect(helpForm.DS.tables["table1"].rows[0].c_dec)
                                            .toBe(3); // è il value dell'opzione selected=true     
                                            stabilize(true).then(done);
                                    });
                            });

                        it("INPUT CHECKBOX case 1 - should update correct fields on Primary table",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" checked data-tag="table3.c_sex:maschio:femmina">' +
                                    '<input type="checkbox" id="mycheck2" data-tag="table3.c_alt:1.5:1.74">' +
                                    '<input type="checkbox" id="mycheck3" data-tag="table3.c_date:2/10/1980:2/10/1981">' +
                                    "</div>";
                                $("html").html(mainwin);

                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                // seleziono la giusta riga pereffettuare il test sulle colonne che servono
                                helpForm.lastSelected(t3, objrow5);
                                helpForm.getControls();

                                // cambia il valore della riga primaria. Deve mettere quello dell'opzione selezionata
                                expect(helpForm.DS.tables["table3"].rows[0].c_sex)
                                    .toBe("maschio"); // è il caso checked quindi prende il valore valueYes
                                expect(helpForm.DS.tables["table3"].rows[0].c_alt)
                                    .toBe(1.74); // è il caso unchecked quindi prende il valore valueNo. inoltre c_alt è di tipo Decimal
                                // test sul tipo DateTime. uncheck quindi prende il valore no, cioè il secondo
                                expect(helpForm.DS.tables["table3"].rows[0].c_date.getDate()).toBe(2);
                                expect(helpForm.DS.tables["table3"].rows[0].c_date.getMonth() + 1).toBe(10);
                                expect(helpForm.DS.tables["table3"].rows[0].c_date.getFullYear()).toBe(1981);
                                stabilize(true).then(done);

                            });
                        
                        it("INPUT CHECKBOX case 2 - should update correct fields on Primary table",
                            function(done) {
                                // Caso cehck/uncheck con numero di bit qualsiasi che funge da maschera
                                // maschera: 1 shift di 3 posti. 18 ->26, uncheck 26 ->18
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" checked data-tag="t.c_bit:3">' +
                                    "</div>";
                                $("html").html(mainDiv);

                                var cBit = "c_bit";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                t.setDataColumn(cBit, "Single");
                                var objrow = { c_bit: 18 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            helpForm.getControls();
                                            // cambia il valore della riga primaria. Deve mettere quello dell'opzione selezionata
                                            expect(helpForm.DS.tables["t"].rows[0].c_bit)
                                            .toBe(26); // è il caso checked quindi prende il valore valueYes


                                            // FACCIO UNCHECK - riassegno il nuovo html cambiato. data-tag rimane lo stesso ovviamente
                                            mainDiv = '<div id="rootelement">' +
                                                '<input type="checkbox" id="mycheck1" data-tag="t.c_bit:3">' +
                                                "</div>";
                                            $("html").html(mainDiv);
                                            //riprovo la getcontrols()
                                            helpForm.getControls();
                                            // da 26 torna 18
                                            expect(helpForm.DS.tables["t"].rows[0].c_bit)
                                            .toBe(18); // è il caso checked quindi prende il valore valueYes
                                            stabilize(true).then(done);
                                    });
                            });

                        it("INPUT CHECKBOX case 3 - should update correct fields on Primary table",
                            function(done) {
                                // Caso cehck/uncheck con numero di bit qualsiasi che funge da maschera
                                // checked + negato: 1 shift di 3 posti. 2 -> 2, uncheck 2 -> 10
                                // unchecked + negato: 1 shift di 3 posti. 2 -> 10, check 10 -> 2
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" checked data-tag="t.c_bit:#3">' +
                                    '<input type="checkbox" id="mycheck2" data-tag="t.c_bit2:#3">' +
                                    "</div>";
                                $("html").html(mainDiv);

                                var c_bit = "c_bit";
                                var c_bit2 = "c_bit2";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                t.setDataColumn(c_bit, "Single");
                                t.setDataColumn(c_bit2, "Single");
                                var objrow = { c_bit: 2, c_bit2: 2 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.getControls();
                                // cambia il valore della riga primaria. Deve mettere quello dell'opzione selezionata
                                expect(helpForm.DS.tables["t"].rows[0].c_bit).toBe(2); // è il caso checked
                                expect(helpForm.DS.tables["t"].rows[0].c_bit2).toBe(10);

                                // FACCIO UNCHECK/CHECK - riassegno il nuovo html cambiato. data-tag rimane lo stesso ovviamente
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" data-tag="t.c_bit:#3">' +
                                    '<input type="checkbox" id="mycheck2" checked data-tag="t.c_bit2:#3">' +
                                    "</div>";
                                $("html").html(mainDiv);
                                helpForm.getControls();
                                expect(helpForm.DS.tables["t"].rows[0].c_bit).toBe(10);
                                expect(helpForm.DS.tables["t"].rows[0].c_bit2).toBe(2);
                                stabilize(true).then(done);
                            });

                        it('INPUT RADIO - "String" column - should update correct fields on Primary table',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="radio" name="season" value="winter" checked data-tag="t.c_season:winter"> winter<br>' +
                                    '<input type="radio" name="season" value="spring" data-tag="t.c_season:spring"> spring<br>' +
                                    '<input type="radio" name="season" value="summer" data-tag="t.c_season:summer"> summer <br>' +
                                    '<input type="radio" name="season" value="autumn" data-tag="t.c_season:autumn"> autumn' +
                                    "</div>";
                                $("html").html(mainwin);

                                var cSeason = "c_season";
                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(cSeason, "String");
                                var objrow = { c_season: "spring" };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.getControls();
                                expect(helpForm.DS.tables["t"].rows[0].c_season).toBe("winter");
                                stabilize(true).then(done);
                            });

                        it('INPUT RADIO - "String" column - should update correct fields on Primary table',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="radio" name="season" value="winter" checked data-tag="t.c_season:1.0"> 1<br>' +
                                    '<input type="radio" name="season" value="spring" data-tag="t.c_season:2.0"> 2<br>' +
                                    '<input type="radio" name="season" value="summer" data-tag="t.c_season:3.0"> 3 <br>' +
                                    '<input type="radio" name="season" value="autumn" data-tag="t.c_season:4.0"> 4' +
                                    "</div>";
                                $("html").html(mainwin);

                                var cSeason = "c_season";
                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(cSeason, "Decimal");
                                var objrow = { c_season: 2.0 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.getControls();
                                // su html è selezionato season winter, cioè 1.0
                                expect(helpForm.DS.tables["t"].rows[0].c_season).toBe(1.0);
                                stabilize(true).then(done);
                            });


                        it('INPUT GROUP-BOX Add checked - "Single" column - should update correct fields on Primary table',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" name="op" value="add" checked> Add<br>' +
                                    '<input type="radio" name="op" value="sub" data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                var objrow = { ctemp: 4 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.getControls();

                                expect(helpForm.DS.tables["t"]).toBeDefined();
                                expect(helpForm.DS.tables["t"].rows[0].ctemp).toBe(10);
                                stabilize(true).then(done);
                            });

                        it('INPUT GROUP-BOX Sub checked - "Single" column - should update correct fields on Primary table',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" name="op" value="add" > Add<br>' +
                                    '<input type="radio" name="op" value="sub" checked data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                var objrow = { ctemp: 4 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.getControls();
                                expect(helpForm.DS.tables["t"]).toBeDefined();
                                expect(helpForm.DS.tables["t"].rows[0].ctemp)
                                    .toBe(-10); // va in sub quindi mi aspetto il valore negativo
                                stabilize(true).then(done);
                            });

                    });

                describe("fillControls() method",
                    function() {

                        it("LABEL - should fill correct html controls reading value from Primary table",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<label  id="label1" for="mycontrolid" data-tag="table1.c_name">mylabel</label>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                            expect($("#label1").html()).toBe("mylabel"); // test valore di partenza, dovrà cambiare
                                            helpForm.fillControls();

                                            //jasmine.clock().tick(1);
                                            stabilize(false)
                                            .then(function() {
                                                    expect($("#label1").html())
                                                    .toBe(
                                                        "nome1"); // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                                    done();

                                            });
                                    });
                           });

                        it("INPUT TEXT - should fill correct html controls reading value from Primary table 1",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="firstroot">' +
                                    'Textbox0: <input type="text" id="txtBox0" data-tag="table1.c_name"><br>' +
                                    "</div>" +
                                    '<div id="rootelement">' +
                                    'NoTag: <input type="text" id="txtBox00" data-notag="table1.c_name" value="notag"><br>' +
                                    'Nome: <input type="text" id="txtBox1"  data-tag="table1.c_name" value="ric"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            /*$("#txtBox1").bind('change', function(event) {
                                      console.log('onchange rised');
                                      });*/
                                            // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                            expect($("#txtBox1").val()).toBe("ric");
                                            helpForm.fillControls()
                                            .then(function() {
                                                    // N.B vedi la configurazione del DS sul beforeEach()
                                                    expect($("#txtBox1").val())
                                                    .toBe(
                                                        "nome1"); // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                                    done();
                                            });
                                    });
                        });

                        it("INPUT TEXT - should fill correct html controls reading value from Primary table 2",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    'Nome: <input type="text" id="txtBox1"  data-tag="table1.c_dec" value="12"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                /*$("#txtBox1").bind('change', function(event) {
                                 console.log('onchange rised');
                                 });*/
                                // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                expect($("#txtBox1").val()).toBe("12");
                                helpForm.preScanControls()
                                    .then(()=>{
                                            return helpForm.fillControls();
                                    })

                                    .then(function(){
                                            // N.B vedi la configurazione del DS sul beforeEach()
                                            expect($("#txtBox1").val())
                                            .toBe(currencySymbol + " 11" + currencyDecimalSeparator + "00");
                                            // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                            done();
                                    });

                                //jasmine.clock().tick(1);

                            });

                        it("INPUT DATE - should fill correct html controls reading value from Primary table",
                            function(done){
                                    // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                    var mainwin = '<div id="rootelement">' +
                                        'Date: <input type="date" placeholder="dd/mm/yyyy" id="txtBox1"  data-tag="table3.c_date.dd"><br>' +
                                        "</div>";
                                    $("html").html(mainwin);

                                    helpForm = new HelpForm(state, "table3", "#rootelement");
                                    helpForm.lastSelected(t3, objrow5);
                                    helpForm.preScanControls()
                                    .then(() => {
                                            // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                            expect($("#txtBox1").val()).toBe("");
                                            helpForm.fillControls()
                                            .then(function (){
                                                    expect($("#txtBox1").val()).toBe("1980-10-02");
                                                    stabilize(true).then(done);
                                            });
                                    });
                            });

                        it("INPUT CHECKBOX checked- should checkbox reading value from Primary table",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" checked data-tag="table3.c_sex:maschio:femmina">' +
                                    '<input type="checkbox" id="mycheck2" checked data-tag="table3.c_sex:femmina:maschio">' +
                                    "</div>";
                                $("html").html(mainwin);
                                // rinizializzo l'oggetto helpForm. la tab principale in queasto test è table3
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                // seleziono la giusta riga per effettuare il test sulle colonne che servono
                                helpForm.lastSelected(t3, objrow5);
                                helpForm.fillControls()
                                    .then(function() {
                                        // N.B vedi la configurazione del DS sul beforeEach()
                                        expect($("#mycheck1").prop("checked"))
                                            .toBe(
                                                true); // sul ds il valore è maschio, che corrisponde al valueYes quindi dovrei ritrovare checked
                                        expect($("#mycheck2").prop("checked"))
                                            .toBe(
                                                false); // sul ds il valore è maschio, che non corrisponde al valueYes quindi dovrei ritrovare unchecked
                                        done();
                                    });
                            });

                        it("INPUT CHECKBOX unchecked- should check checkbox reading value from Primary table",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" data-tag="table3.c_sex:femmina:maschio">' +
                                    '<input type="checkbox" id="mycheck2" data-tag="table3.c_sex:maschio:femmina">' +
                                    "</div>";
                                $("html").html(mainwin);
                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                // seleziono la giusta riga pereffettuare il test sulle colonne che servono
                                helpForm.lastSelected(t3, objrow5);
                                helpForm.fillControls()
                                    .then(function() {
                                        expect($("#mycheck1").prop("checked")).toBe(false);
                                        expect($("#mycheck2").prop("checked")).toBe(true);
                                        done();
                                    });
                                //jasmine.clock().tick(1);
                                // N.B vedi la configurazione del DS sul beforeEach()
                            });

                        it("INPUT RADIO - should check/uncheck radio button reading value from Primary table",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="radio" id="radio1" name="season" value="winter" checked data-tag="t.c_season:winter"> winter<br>' +
                                    '<input type="radio" id="radio2" name="season" value="spring" data-tag="t.c_season:spring"> spring<br>' +
                                    '<input type="radio" id="radio3" name="season" value="summer" data-tag="t.c_season:summer"> summer <br>' +
                                    '<input type="radio" id="radio4" name="season" value="autumn" data-tag="t.c_season:autumn"> autumn' +
                                    "</div>";
                                $("html").html(mainwin);
                                var cSeason = "c_season";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(cSeason, "String");
                                var objrow = { c_season: "spring" }; // valore finale che mi aspetto sia selezionato
                                t.add(objrow);
                                state.DS = ds;
                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                // seleziono la giusta riga pereffettuare il test sulle colonne che servono
                                helpForm.lastSelected(t, objrow);
                                helpForm.fillControls()
                                    .then(function() {
                                        expect($("#radio1").is(":checked"))
                                            .toBe(false); // era checked, ma diventa unchecked
                                        expect($("#radio2").is(":checked")).toBe(true); // mi aspetto che metta spring
                                        expect($("#radio3").is(":checked")).toBe(false);
                                        expect($("#radio4").is(":checked")).toBe(false);
                                        done();
                                    });


                            });

                        it("INPUT TEXT - should fill correct html control on ExraEntity - 1 primary row, 1 child row",
                            function() {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    'Annuale: <input type="text" id="txtBox1"  data-tag="tc.cnumdip" value="25"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                var cnumdip = "cnumdip";
                                var canno = "canno";
                                var ciddip = "ciddip";
                                var ccitta = "ccitta";

                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var tp = ds.newTable("tp");
                                var te = ds.newTable("te");
                                var tc = ds.newTable("tc");
                                // aggiungo relazione. table 2 è collegata a table 1 tramite la colonna c_name
                                ds.newRelation("r1", "tp", [canno], "te", [canno]);
                                ds.newRelation("r2", "tc", [ciddip], "te", [ciddip]);
                                // setto le prop delle colonne per t
                                tp.setDataColumn(canno, "Single");
                                te.setDataColumn(canno, "Single");
                                te.setDataColumn(ciddip, "Single");
                                te.setDataColumn(ccitta, "String");
                                tc.setDataColumn(ciddip, "Single");
                                tc.setDataColumn(cnumdip, "Single");
                                //primaryRow
                                var objrow00 = { canno: 2018 };
                                tp.add(objrow00);
                                // è la toConsider
                                var objrowEe = { canno: 2018, citta: "roma", ciddip: 1 };
                                te.add(objrowEe);
                                // riga della tabella del tag tablename
                                var objrow1 = { cnumdip: 30, ciddip: 1 };
                                tc.add(objrow1);

                                state.DS = ds;
                                state.addExtraEntity(
                                    "te"); // lo dovrebbe fare la getcontrols(). In questo unit test la setto io
                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "tp", "#rootelement");
                                helpForm.lastSelected(tp, objrow00);

                                // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                expect($("#txtBox1").val()).toBe("25");
                                helpForm.fillControls()
                                    .then(function() {
                                        expect($("#txtBox1").val())
                                            .toBe("30" +
                                                numberDecimalSeparator +
                                                "00"); // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                    });


                            });

                        it("INPUT TEXT - should fill correct html control on ExraEntity  2 primary row, 2 child row",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    'Annuale: <input type="text" id="txtBox1"  data-tag="tc.cnumdip" value="25"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                var cnumdip = "cnumdip";
                                var canno = "canno";
                                var ciddip = "ciddip";
                                var ccitta = "ccitta";

                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var tp = ds.newTable("tp");
                                var te = ds.newTable("te");
                                var tc = ds.newTable("tc");
                                // aggiungo relazione. table 2 è collegata a table 1 tramite la colonna c_name
                                ds.newRelation("r1", "tp", [canno], "te", [canno]);
                                ds.newRelation("r2", "tc", [ciddip], "te", [ciddip]);
                                // setto le prop delle colonne per t
                                tp.setDataColumn(canno, "Single");
                                te.setDataColumn(canno, "Single");
                                te.setDataColumn(ciddip, "Single");
                                te.setDataColumn(ccitta, "String");
                                tc.setDataColumn(ciddip, "Single");
                                tc.setDataColumn(cnumdip, "Single");
                                //primaryRow
                                var objrow00 = { canno: 2018 };
                                var objrow01 = { canno: 2017 };
                                tp.add(objrow00);
                                tp.add(objrow01);
                                // è la toConsider
                                var objrowEe1 = { canno: 2018, citta: "roma", ciddip: 1 };
                                var objrowEe2 = { canno: 2017, citta: "bari", ciddip: 2 };
                                te.add(objrowEe1);
                                te.add(objrowEe2);
                                // riga della tabella del tag tablename 
                                var objrow1 = { cnumdip: 30, ciddip: 1 };
                                var objrow2 = { cnumdip: 40, ciddip: 2 };
                                tc.add(objrow1);
                                tc.add(objrow2);

                                state.DS = ds;
                                state.addExtraEntity(
                                    "te"); // lo dovrebbe fare la getcontrols(). In questo unit test la setto io
                                // rinizializzo l'oggetto helpForm. la tab principale in questo test è tp
                                helpForm = new HelpForm(state, "tp", "#rootelement");
                                helpForm.lastSelected(tp, objrow00);
                                // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                expect($("#txtBox1").val()).toBe("25");
                                helpForm.fillControls()
                                    .then(function() {
                                        expect($("#txtBox1").val())
                                            .toBe("30" +
                                                numberDecimalSeparator +
                                                "00"); // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                        //se seleziono la 2a riga della primary, cioè anno 2017, deve mettere 40
                                        helpForm.lastSelected(tp, objrow01);
                                        // Per sicurezza rivaluto il valore di default che ho sui controlli html, prima della fill
                                        expect($("#txtBox1").val())
                                            .toBe("30" + numberDecimalSeparator + "00"); // sulla text mi asp
                                        return helpForm.fillControls();
                                    })
                                    .then(function() {
                                        expect($("#txtBox1").val())
                                            .toBe("40" +
                                                numberDecimalSeparator +
                                                "00"); // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                        done();
                                    });

                            });

                        it('INPUT GROUP-BOX positive value and minus operator in tag - "Single" column - should fill correct html controls',
                            function(done) {

                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" id="radio1" name="op" value="add" data-tag="+"> Add<br>' +
                                    '<input type="radio" id="radio2" name="op" value="sub" data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                var objrow = { ctemp: 4 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.fillControls();
                                stabilize(true).then(function() {
                                    expect($("#txtBox1").val())
                                        .toBe("4" +
                                            numberDecimalSeparator +
                                            "00"); // devo tritrovare il valore che era sul datatable opportunatamente formattato
                                    expect($("#radio1").is(":checked")).toBe(true);
                                    expect($("#radio2").is(":checked")).toBe(false);
                                    done();
                                });
                            });

                        it('INPUT GROUP-BOX positive value and plus operator in tag - "Single" column - should fill correct html controls',
                            function(done) {

                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" id="radio1" name="op" value="add" data-tag="+"> Add<br>' +
                                    '<input type="radio" id="radio2" name="op" value="sub"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                var objrow = { ctemp: 4 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.fillControls();
                                stabilize(true)
                                    .then(function() {
                                        expect($("#txtBox1").val()).toBe("4" + numberDecimalSeparator + "00");
                                        expect($("#radio1").is(":checked")).toBe(true);
                                        expect($("#radio2").is(":checked")).toBe(false);
                                        done();
                                    });
                            });

                        it('INPUT GROUP-BOX negative value and minus operator in tag  - "Single" column - should fill correct html controls',
                            function(done) {

                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" id="radio1" name="op" value="add"> Add<br>' +
                                    '<input type="radio" id="radio2" name="op" value="sub" data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                var objrow = { ctemp: -4 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.fillControls();
                                stabilize(true).then(function() {
                                    expect($("#txtBox1").val()).toBe("-4" + numberDecimalSeparator + "00");
                                    expect($("#radio1").is(":checked")).toBe(false);
                                    expect($("#radio2").is(":checked"))
                                        .toBe(
                                            true); // valore negativo, datatag "-" su radio2 , quindi devo trovarlo checked
                                    done();
                                });
                            });
                    });

                describe("SELECT fillcontrols()",
                    function() {
                        var cCodice = "c_codice";
                        var cName = "c_name";
                        var state = new appMeta.MetaPageState();
                        var ds = new jsDataSet.DataSet("temp");
                        var datasource = ds.newTable("datasource");
                        var t = ds.newTable("t");
                        var objrow1;
                        var objrow2;
                        var objrow3;
                        var objrow4;

                        var objrow5;
                        var objrow6;
                        var objrow7;
                        datasource.isTemporaryTable = true;

                        datasource.setDataColumn(cCodice, "Single");
                        datasource.setDataColumn(cName, "String");
                        //tabella principale
                        t.setDataColumn(cCodice, "Single");

                        beforeEach(function() {
                            // sovrascrivo il mio doc con un html di test, co i tag che mi servono.
                            // Ho inserito 2 div, di cui 1 con l'id del rooteleemtn che mi aspetto
                            // Ho inoltre inserito 2 tag data-tag con la formatazione attesa
                            var mainwin = '<div id="rootelement">' +
                                '<select id="combo1" data-tag="t.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_name">' +
                                "</select>" +
                                "</div>";
                            $("html").html(mainwin);

                            // colonne per il datasource
                            datasource.insertFilter =
                                q.eq("c_codice", "3"); // sto in searchState, quindi non viene preso in considerazione
                            datasource.searchFilter = null;

                            datasource.clear();
                            t.clear();
                            objrow1 = { c_codice: 1, c_name: "uno" };
                            objrow2 = { c_codice: 2, c_name: "due" };
                            objrow3 = { c_codice: 3, c_name: "tre" };
                            objrow4 = { c_codice: 4, c_name: "quattro" };

                            objrow5 = { ckey: "key1", c_codice: 1 };
                            objrow6 = { ckey: "key2", c_codice: 2 };
                            objrow7 = { ckey: "key3", c_codice: 3 };

                            datasource.add(objrow1);
                            datasource.add(objrow2);
                            datasource.add(objrow3);
                            datasource.add(objrow4);

                            t.add(objrow5);
                            t.add(objrow6);
                            t.add(objrow7);

                            state.DS = ds;

                            helpForm = new HelpForm(state, "t", "#rootelement");
                            helpForm.lastSelected(t, objrow6);

                        });

                        it("should fill html control valueMember DECIMAL column - SEARCH STATE + SEARCH FILTER",
                            function(done) {
                                datasource.searchFilter = q.eq("c_codice", 3);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            return helpForm.fillControls();
                                    })
                                .then(function() {
                                        expect($("#combo1").children("option").length).toBe(2); // c'è il filtro
                                        expect($("#combo1 option:selected").val()).toBeUndefined();
                                        expect($("#combo1 option:selected").html())
                                            .toBeUndefined(); // la riga selezionatano-blank è la objrow 6 che ha cCodice cioè valuemember 2, ma il filtro è solo su 3. quindi non lo trova
                                        return true;
                                    })
                                    .then(function() {
                                        helpForm.lastSelected(t,
                                            objrow7); // seleziono riga 7, quindi questa contiene stavolta il codice 3
                                        return helpForm.fillControls();
                                    })
                                    .then(function() {
                                        expect($("#combo1").children("option").length).toBe(2); // c'è il filtro
                                        expect($("#combo1 option:selected").val())
                                            .toBe(
                                                "3"); // la lastSelected è objrow7 che ha codice 3, come il filtro, quindi lo trova
                                        expect($("#combo1 option:selected").text()).toBe("tre");
                                        done();
                                    });

                                //jasmine.clock().tick(1);


                            });

                        it(
                            "should fill html control valueMember DECIMAL column - SEARCH STATE + SEARCH FILTER + NOBlank row",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<select id="combo1" data-tag="t.c_codice"  data-noblank="1" data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_name">' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);
                                datasource.searchFilter = q.eq("c_codice", 3);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            return helpForm.fillControls();
                                    })
                                    .then(function() {
                                        expect($("#combo1").children("option").length)
                                            .toBe(1); // c'è il filtro e noblank
                                        expect($("#combo1 option:selected").val()).toBeUndefined();
                                        expect($("#combo1 option:selected").html())
                                            .toBeUndefined(); // la riga selezionata è la objrow 6 che ha c_codice cioè valuemember 2, ma il filtro è solo su 3. quindi non lo trova

                                        helpForm.lastSelected(t,
                                            objrow7); // seleziono riga 7, quindi questa contiene stavolta il codice 3
                                        helpForm.fillControls();
                                        return stabilize(true);
                                    })
                                    .then(function() {
                                        expect($("#combo1").children("option").length)
                                            .toBe(1); // c'è il filtro e noblank
                                        expect($("#combo1 option:selected").val())
                                            .toBe(
                                                "3"); // la lastSelected è objrow7 che ha codice 3, come il filtro, quindi lo trova
                                        expect($("#combo1 option:selected").html()).toBe("tre");
                                        done();
                                    });

                            });

                        it("should fill html control valueMember DECIMAL column - SEARCH STATE WITHOUT SEARCH FILTER",
                            function(done) {
                                helpForm.preScanControls()
                                    .then(()=>{
                                            helpForm.fillControls()
                                            .then(function() {
                                                    expect($("#combo1").children("option").length).toBe(5);
                                                    expect($("#combo1 option:selected").val()).toBe("2");
                                                    expect($("#combo1 option:selected").html())
                                                    .toBe(
                                                        "due"); // la riga selezionata è la objrow6 che ha cCodice cioè valuemember 2, quindi la selezionata ha val cName "due" cioè objrow2

                                                    helpForm.lastSelected(t, objrow7); // cambio riga per sicurezza
                                                    helpForm.getControls();
                                                    expect($("#combo1").children("option").length).toBe(5);
                                                    expect(objrow7.c_codice)
                                                    .toBe(
                                                        2); // colonna numerica, quindi mi aspetto un numero per quel campo sulla riga selezionata
                                                    expect(objrow7.ckey)
                                                    .toBe(
                                                        "key3"); // cambiato il codice, cioè il valueMemeber, ma l'altro campo rimane quello di partenza

                                                    helpForm.lastSelected(t, objrow5);
                                                    helpForm.fillControls();
                                                    return stabilize(true);
                                            })
                                            .then(function() {
                                                    expect($("#combo1").children("option").length)
                                                    .toBe(5); // sempre 4 items devono essere
                                                    expect($("#combo1 option:selected").val())
                                                    .toBe(
                                                        "1"); // la lastSelected è objrow5 che ha codice 1, quindi ritrovo quel valore selezionato
                                                    expect($("#combo1 option:selected").html()).toBe("uno");

                                                    done();
                                            });
                                    });
                           });

                        it("should fill html control - valueMember STRING column - INSERT STATE",
                            function(done) {
                                let cCodice = "c_codice";
                                let cName = "c_name";

                                // costruisco ogetto stato e ds
                                    let state = new appMeta.MetaPageState();
                                state.setInsertState(); //  lo faccio passare nel ramo isInsertState()
                                var ds = new jsDataSet.DataSet("temp");
                                var datasource = ds.newTable("datasource");
                                datasource.isTemporaryTable = true;
                                datasource.insertFilter = q.eq(cCodice, "3");
                                datasource.searchFilter = null;

                                var t = ds.newTable("t");

                                // colonne per ildatasource
                                datasource.setDataColumn(cCodice, "String");
                                datasource.setDataColumn(cName, "String");
                                //tabella principale
                                t.setDataColumn(cCodice, "String");

                                var objrow1 = { c_codice: "1", c_name: "uno" };
                                var objrow2 = { c_codice: "2", c_name: "due" };
                                var objrow3 = { c_codice: "3", c_name: "tre" };
                                var objrow4 = { c_codice: "4", c_name: "quattro" };
                                datasource.add(objrow1);
                                datasource.add(objrow2);
                                datasource.add(objrow3);
                                datasource.add(objrow4);

                                let objrow5 = { ckey: "key1", c_codice: "1" };
                                let objrow6 = { ckey: "key2", c_codice: "2" };
                                let objrow7 = { ckey: "key3", c_codice: "3" };
                                t.add(objrow5);
                                t.add(objrow6);
                                t.add(objrow7);
                                state.DS = ds;

                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow7);
                                helpForm.preScanControls()
                                    .then(()=>{
                                          return helpForm.fillControls();
                                    })
                                    .then(function(){
                                            expect($("#combo1").children("option").length)
                                            .toBe(2); // filtro con insertFilter()
                                            expect($("#combo1 option:selected").val()).toBe("3");
                                            expect($("#combo1 option:selected").html()).toBe("tre");

                                            helpForm.lastSelected(t, objrow6);
                                            helpForm.getControls();
                                            expect(objrow6.c_codice).toBe("3"); // mette il codice che era selzionato
                                            expect(objrow6.ckey).toBe("key2");

                                            helpForm.lastSelected(t, objrow5);
                                            // la objrow5 ha codice 1, ma siccome è filtrata, non lo trova
                                            helpForm.fillControls();
                                            return stabilize(true);
                                    })
                                    .then(function() {
                                        expect($("#combo1").children("option").length).toBe(2);
                                        expect($("#combo1 option:selected").val()).toBeUndefined();
                                        expect($("#combo1 option:selected").html()).toBeUndefined();

                                        // la riga selezionata è la objrow6 che ha cCodice cioè valuemember 2, la getControls() mette null perchè il controllo non ha nulla selezionato
                                        helpForm.lastSelected(t, objrow6);
                                        helpForm.getControls();
                                        expect(objrow6.c_codice).toBe(null);
                                        expect(objrow6.ckey).toBe("key2");
                                        done();
                                    });


                            });

                        it("should fill html control - valueMember STRING column - EDIT STATE",
                            function(done) {
                                var cCodice = "c_codice";
                                var cName = "c_name";

                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                state.setEditState(); //  lo faccio passare nell'ultimo ramo,cioèquello dell'Edit
                                var ds = new jsDataSet.DataSet("temp");
                                var datasource = ds.newTable("datasource");
                                datasource.isTemporaryTable = true;
                                datasource.insertFilter = q.eq(cCodice, "3");
                                datasource.searchFilter = null;

                                var t = ds.newTable("t");

                                // colonne per ildatasource
                                datasource.setDataColumn(cCodice, "String");
                                datasource.setDataColumn(cName, "String");

                                //tabella principale
                                t.setDataColumn(cCodice, "String");

                                var objrow1 = { c_codice: "1", c_name: "uno" };
                                var objrow2 = { c_codice: "2", c_name: "due" };
                                var objrow3 = { c_codice: "3", c_name: "tre" };
                                var objrow4 = { c_codice: "4", c_name: "quattro" };
                                datasource.add(objrow1);
                                datasource.add(objrow2);
                                datasource.add(objrow3);
                                datasource.add(objrow4);

                                var objrow5 = { ckey: "key1", c_codice: "1" };
                                var objrow6 = { ckey: "key2", c_codice: "2" };
                                var objrow7 = { ckey: "key3", c_codice: "3" };
                                t.add(objrow5);
                                t.add(objrow6);
                                t.add(objrow7);
                                state.DS = ds;

                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow7);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            helpForm.fillControls()
                                            .then(function() {
                                                    expect($("#combo1").children("option").length)
                                                    .toBe(2); // filtro con insertFilter()
                                                    expect($("#combo1 option:selected").val()).toBe("3");
                                                    expect($("#combo1 option:selected").html()).toBe("tre");
                                                    done();
                                            });
                                    });
                            });

                    });

                describe("fillControls() + getcontrols()",
                    function() {
                        it("INPUT TEXT - should fill/get correct html controls reading value from Primary table",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table1.c_name" value="initvalue"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            // 1. HTML -> DS popolo il dt dal valore della test;
                                            helpForm.getControls();
                                            expect(helpForm.DS.tables["table1"].rows[0].c_name).toBe("initvalue");

                                            // 2. DS -> HTML fill nuova text con il valore memorizzato nella get
                                            var mainwin = '<div id="rootelement">' +
                                                '<input type="text" id="txtBox2"  data-tag="table1.c_name"><br>' +
                                                "</div>";
                                            $("html").html(mainwin);

                                            helpForm.fillControls()
                                            .then(function() {
                                                    expect($("#txtBox2").val()).toBe("initvalue");
                                                    done();
                                            });
                                    });
                             });

                        it("INPUT TEXT DECIMAL - should fill/get correct html controls reading value from Primary table",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table1.c_dec"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                // 1. HTML -> DS popolo il dt dal valore della test;
                                helpForm.preScanControls()
                                    .then(()=>{
                                            return helpForm.fillControls();
                                    })
                                    .then(function() {
                                        expect($("#txtBox1").val())
                                            .toBe(currencySymbol + " 11" + currencyDecimalSeparator + "00");
                                        helpForm.lastSelected(t1,
                                            objrow2); // seleziono un altra riga per sicurezza, così è diverso il valore iniziale prima della fillControls()
                                        helpForm.getControls();
                                        expect(helpForm.DS.tables["table1"].rows[1].c_dec)
                                            .toBe(
                                                11); // era 22 deve esere 11 poichè passa la fill e poi rifaccio la get
                                        done();
                                    });


                            });

                        it("INPUT TEXT DATE - should fill/get correct html controls reading value from Primary table",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table3.c_date"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                // 1. DS -> HTML da unchecked -> checked
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                helpForm.lastSelected(t3, objrow5);
                                // 1. HTML -> DS popolo il dt dal valore della test;
                                helpForm.fillControls()
                                    .then(function() {

                                        expect($("#txtBox1").val()).toBe("02/10/1980");
                                        helpForm.lastSelected(t3,
                                            objrow6); // seleziono un altra riga per sicurezza, così è diverso il valore iniziale prima della fillControls()
                                        helpForm.getControls();
                                        expect(helpForm.DS.tables["table3"].rows[1].c_date.constructor.name)
                                            .toBe("Date");
                                        expect(helpForm.DS.tables["table3"].rows[1].c_date.getDate()).toBe(2);
                                        expect(helpForm.DS.tables["table3"].rows[1].c_date.getMonth() + 1).toBe(10);
                                        expect(helpForm.DS.tables["table3"].rows[1].c_date.getFullYear())
                                            .toBe(
                                                1980); // la objrow6 aveva anno 1981, quindi ok deve emttere 1980 che lo predne dal valore della fillControls

                                        done();
                                    });
                            });

                        it("INPUT CHECKBOX bit case - should update correct fields on Primary table on multiple get/fill",
                            function(done) {
                                // Caso cehck/uncheck con numero di bit qualsiasi che funge da maschera
                                // maschera: 1 shift di 3 posti. 18 ->26, uncheck 26 ->18
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" data-tag="t.c_bit:3">' +
                                    "</div>";
                                $("html").html(mainDiv);
                                // DS -> HTML da unchecked -> checked
                                var cBit = "c_bit";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                t.setDataColumn(cBit, "Single");
                                var objrow = { c_bit: 26 };
                                t.add(objrow);
                                state.DS = ds;

                                // 1. DS -> HTML da unchecked -> checked
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow);
                                helpForm.fillControls()
                                    .then(function() {

                                        expect(helpForm.DS.tables["t"].rows[0].c_bit).toBe(26);
                                        expect($("#mycheck1").is(":checked")).toBe(true);

                                        // 2. HTML -> DS da checked -> unchecked
                                        mainDiv = '<div id="rootelement">' +
                                            '<input type="checkbox" id="mycheck1" data-tag="t.c_bit:3">' +
                                            "</div>";
                                        $("html").html(mainDiv);
                                        helpForm.getControls();
                                        expect(helpForm.DS.tables["t"].rows[0].c_bit).toBe(18);
                                        expect($("#mycheck1").is(":checked")).toBe(false);

                                        // 3. HTML -> DS da unchecked -> checked
                                        mainDiv = '<div id="rootelement">' +
                                            '<input type="checkbox" id="mycheck1" checked data-tag="t.c_bit:3">' +
                                            "</div>";
                                        $("html").html(mainDiv);
                                        helpForm.getControls();
                                        expect(helpForm.DS.tables["t"].rows[0].c_bit).toBe(26);
                                        expect($("#mycheck1").is(":checked")).toBe(true);

                                        // 4. DS -> HTML da checked -> unchecked
                                        mainDiv = '<div id="rootelement">' +
                                            '<input type="checkbox" id="mycheck1" checked data-tag="t.c_bit:3">' +
                                            "</div>";
                                        $("html").html(mainDiv);
                                        helpForm.fillControls();

                                        return stabilize(true);
                                    })
                                    .then(function() {
                                        expect(helpForm.DS.tables["t"].rows[0].c_bit).toBe(26);
                                        expect($("#mycheck1").is(":checked")).toBe(true);

                                        // 5. DS -> HTML da checked -> unchecked
                                        mainDiv = '<div id="rootelement">' +
                                            '<input type="checkbox" id="mycheck1" checked data-tag="t.c_bit:3">' +
                                            "</div>";
                                        $("html").html(mainDiv);
                                        var objrow1 = { c_bit: 18 };
                                        t.add(objrow1);
                                        helpForm.lastSelected(t, objrow1);
                                        helpForm.fillControls();
                                        return stabilize(true);
                                    })
                                    .then(function() {
                                        expect(helpForm.DS.tables["t"].rows[1].c_bit).toBe(18);
                                        expect($("#mycheck1").is(":checked")).toBe(false);
                                        done();
                                    });

                            });

                        it("INPUT CHECKBOX fill/get type preserved- should update correct fields on Primary table",
                            function(done) {
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" data-tag="table3.c_sex:maschio:femmina">' +
                                    '<input type="checkbox" id="mycheck2" data-tag="table3.c_alt:1.5:1.7">' +
                                    '<input type="checkbox" id="mycheck3" data-tag="table3.c_date:2/10/1980:2/10/1981">' +
                                    "</div>";
                                $("html").html(mainDiv);

                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                // seleziono la giusta riga per effettuare il test sulle colonne che servono
                                // DS -> HTML5 metto i valori YES
                                helpForm.lastSelected(t3, objrow5);
                                helpForm.fillControls();
                                stabilize().then(function() {
                                        expect($("#mycheck1").is(":checked")).toBe(true); // la riga 5 ha i valori yes
                                        expect($("#mycheck2").is(":checked")).toBe(true);
                                        expect($("#mycheck3").is(":checked")).toBe(true);
                                        expect(objrow5.c_sex).toBe("maschio");
                                        expect(objrow6.c_sex).toBe("femmina");
                                        expect(objrow5.c_alt).toBe(1.5);
                                        expect(objrow6.c_alt).toBe(1.6);
                                        expect(objrow5.c_date.getDate()).toBe(2);
                                        expect(objrow5.c_date.getMonth() + 1).toBe(10);
                                        expect(objrow5.c_date.getFullYear()).toBe(1980);

                                        // DS -> HTML5 seleziono la riga 6 metto i valori NO
                                        helpForm.lastSelected(t3, objrow6);
                                        helpForm.fillControls();
                                        return stabilize(true);
                                    })
                                    .then(function() {
                                        expect($("#mycheck1").is(":checked")).toBe(false);
                                        expect($("#mycheck2").is(":checked")).toBe(false);
                                        expect($("#mycheck3").is(":checked")).toBe(false);
                                        expect(objrow5.c_sex).toBe("maschio");
                                        expect(objrow6.c_sex).toBe("femmina");
                                        expect(objrow5.c_alt).toBe(1.5);
                                        expect(objrow6.c_alt).toBe(1.6);
                                        expect(objrow5.c_date.getDate()).toBe(2);
                                        expect(objrow5.c_date.getMonth() + 1).toBe(10);
                                        expect(objrow5.c_date.getFullYear()).toBe(1980);
                                        expect(objrow6.c_date.getDate()).toBe(2); // mette il valore No
                                        expect(objrow6.c_date.getMonth() + 1).toBe(10);
                                        expect(objrow6.c_date.getFullYear()).toBe(1981);

                                        // HTML5 -> DS seleziono la riga 5 che aveva i valori YES, li sovrascirve con i valori NO
                                        helpForm.lastSelected(t3, objrow5);
                                        helpForm.getControls();
                                        expect($("#mycheck1").is(":checked")).toBe(false);
                                        expect($("#mycheck2").is(":checked")).toBe(false);
                                        expect($("#mycheck3").is(":checked")).toBe(false);
                                        expect(objrow5.c_sex).toBe("femmina");
                                        expect(objrow6.c_sex).toBe("femmina");
                                        expect(objrow5.c_alt).toBe(1.7);
                                        expect(objrow6.c_alt).toBe(1.6);
                                        expect(objrow5.c_date.getDate()).toBe(2);
                                        expect(objrow5.c_date.getMonth() + 1).toBe(10);
                                        expect(objrow5.c_date.getFullYear()).toBe(1981);
                                        expect(objrow6.c_date.getDate()).toBe(2); // mette il valore No
                                        expect(objrow6.c_date.getMonth() + 1).toBe(10);
                                        expect(objrow6.c_date.getFullYear()).toBe(1981);

                                        done();
                                    });

                            });

                        it("INPUT RADIO fill/get - bit value",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="radio" name="season" value="winter" data-tag="t.c_bit::1"> <br>' +
                                    '<input type="radio" name="season" value="spring" data-tag="t.c_bit::2"><br>' +
                                    '<input type="radio" name="season" value="summer" data-tag="t.c_bit::3"><br>' +
                                    '<input type="radio" name="season" value="autumn" data-tag="t.c_bit::4">' +
                                    "</div>";
                                $("html").html(mainwin);

                                var c_bit = "c_bit";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                t.setDataColumn(c_bit, "Single");
                                var objrow1 = { c_bit: 2 };
                                t.add(objrow1);
                                t.add(objrow2);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.lastSelected(t, objrow1);
                                helpForm.fillControls()
                                    .then(function() {
                                        helpForm.getControls();
                                        helpForm.lastSelected(t, objrow2);
                                        helpForm.fillControls();
                                        return stabilize(true);
                                    })
                                    .then(function() {

                                        //TODO
                                        done();

                                    })
                            });

                    });

                describe("fillSpecificRowControls()",
                    function() {
                        
                        it("INPUT TEXT - should fill correct html controls reading value from a dataRow",
                            function(done) {
                            // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                            var mainwin = '<div id="rootelement">' +
                            '<input type="text" id="txtBox1"  data-tag="table1.c_name" value="initvalue"><br>' +
                                '<div id="rootelement2">' +
                                '<input type="text" id="txtBox2"  data-tag="table1.c_name" value="initvalue"><br>' +
                                "</div>";
                            "</div>";
                            $("html").html(mainwin);

                                helpForm.fillSpecificRowControls("#rootelement2", t1, objrow2.getRow())
                                    .then(function() {
                                        expect($("#txtBox2").val()).toBe("nome2");
                                        done();
                                    });


                            });

                        it("INPUT TEXT - should not fill html controls reading value from a dataRow, beacause different table, fromparameter and tag control",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table1.c_name" value="initvalue"><br>' +
                                    '<div id="rootelement2">' +
                                    '<input type="text" id="txtBox2"  data-tag="table1.c_name" value="initvalue"><br>' +
                                    "</div>";
                                "</div>";
                                $("html").html(mainwin);

                                helpForm.fillSpecificRowControls("#rootelement2", t2, objrow2.getRow())
                                    .then(function() {
                                        expect($("#txtBox2").val()).toBe("initvalue");
                                        done();
                                    });


                            });

                        it("INPUT CHECKBOX unchecked- should check checkbox reading value from a dataRow",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table1.c_name" value="initvalue"><br>' +
                                    '<div id="rootelement2">' +
                                        '<input type="checkbox" id="mycheck1" data-tag="table3.c_sex:femmina:maschio">' +
                                        '<input type="checkbox" id="mycheck2" data-tag="table3.c_sex:maschio:femmina">' +
                                    "</div>";
                                "</div>";
                             
                                $("html").html(mainwin);
                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3

                                helpForm.fillSpecificRowControls("#rootelement2", t3, objrow6.getRow())
                                    .then(function() {
                                        expect($("#mycheck1").prop("checked")).toBe(true); // objrow6 ha valore femmina "femmina" su c_sex, che nella check 1 corrisponde al valore si, quindi la devo trovare checked
                                        expect($("#mycheck2").prop("checked")).toBe(false); // vale il contrario del commento di sopra
                                        done();
                                    });
                                //jasmine.clock().tick(1);
                                // N.B vedi la configurazione del DS sul beforeEach()
                            });

                    });

                describe("fillParentControls()",
                    function() {

                        it("INPUT TEXT - should fill correct html controls reading value from a dataRow",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table1.c_name" value="initvalue"><br>' +
                                    '<div id="rootelement2">' +
                                    '<input type="text" id="txtBox2"  data-tag="table1.c_name" value="initvalue"><br>' +
                                    '<input type="text" id="txtBox3"  data-tag="table1.c_dec" value="initvalue"><br>' +
                                    "</div>";
                                "</div>";
                                $("html").html(mainwin);
                                helpForm.fillParentControls("#rootelement2", tParent, objrow2.getRow())
                                    .then(function() {
                                        expect($("#txtBox2").val()).toBe("nome2");
                                        expect($("#txtBox3").val()).toBe("22"+numberDecimalSeparator+"00");
                                        done();
                                    });


                            });

                    });
                
                describe("Clear/Enable/Disable  Control",
                    function() {
                        it("INPUT TEXT - ClearControl()",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, co i tag che mi servono.
                                // Ho inserito 2 div, di cui 1 con l'id del rooteleemtn che mi aspetto
                                // Ho inoltre inserito 2 tag data-tag con la formatazione attesa
                                var mainwin = '<div id="firstroot">' +
                                    'Textbox0: <input type="text" id="txtBox0" data-my="v"><br>' +
                                    '</div>' +
                                    '<div id="rootelement">' +
                                    'Nome: <input type="text" id="txtBox1" data-tag="table1.c_name" value="ric"><br>' +
                                    'Eta: <input type="text" id="txtBox2" data-tag="table1.c_dec" value="37"><br>' +
                                    '<input type="checkbox" id="mycheck1" data-threestate="true" data-tag="table3.c_sex:maschio:femmina">' +
                                    '<input type="radio" id="radio1" name="season" value="winter" checked data-tag="table3.c_sex:maschio"> winter<br>' +
                                    '<input type="radio" id="radio2" name="season" value="spring" data-tag="table3.c_sex:femmina"> spring<br>' +
                                    '<select id="combo1" data-tag="table1.c_name" data-noblank=true data-source-name="table2" data-value-member="c_name">' +
                                    '<option value="value1">ric1</option>' +
                                    '<option value="value2" selected="selected">ric2</option>' +
                                    '<option value="value3">ric3</option>' +
                                    '</select>' +
                                    '<table data-tag="table1" id="table1" ><tr> <th>Firstname</th> <th>Lastname</th></tr>' +
                                    '<tr><td>ric</td><td>pro</td></tr>' +
                                    '<tr><td>bill</td><td>clinton</td></tr></table>' +
                                    '<table data-tag="table1" id="table2"><thead><tr><th>Month</th><th>Savings</th> </tr> </thead> <tfoot><tr><td>Sum</td> <td>$180</td></tr></tfoot>' +
                                    '<tbody><tr><td>January</td> <td>$100</td></tr><tr><td>February</td> <td>$80</td></tr> </tbody></table>' +
                                    '</div>';

                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var rowCount1 = $('#table1 tr').length;
                                            expect(rowCount1).toBe(3);
                                            var rowCount2 = $('#table2 tr').length;
                                            expect(rowCount2).toBe(4);

                                            expect($("#txtBox1").val()).toBe("ric");

                                            // effettuo clear
                                            helpForm.clearControls();
                                            expect($("#txtBox1").val()).toBe("");
                                            expect($("#txtBox2").val()).toBe("");
                                            expect($("#mycheck1").is(":indeterminate")).toBe(true);
                                            expect($("#mycheck1").is(":checked")).toBe(false);
                                            expect($("#radio1").is(":checked")).toBe(false); // era checked , mi aspetto false
                                            expect($("#radio2").is(":checked")).toBe(false);
                                            expect($("#combo1 option:selected").val()).toBeUndefined();
                                            expect($("#combo1 option:selected").html()).toBeUndefined();

                                            rowCount1 = $('#table1 tr').length;
                                            expect(rowCount1).toBe(1); // rimane solo l'header
                                            rowCount2 = $('#table2 tr').length;
                                            expect(rowCount2).toBe(1); // rimane solo l'header
                                            done()
                                    })

                            });

                        it("INPUT TEXT EditState - should fill correct html control on ExraEntity - 1 primary row, 1 child row",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    'Annuale: <input type="text" id="txtBox1"  data-tag="tc.cnumdip" value="25"><br>' +
                                    "</div>";
                                $("html").html(mainwin);

                                var cnumdip = "cnumdip";
                                var canno = "canno";
                                var ciddip = "ciddip";
                                var ccitta = "ccitta";

                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                state.setEditState();
                                var ds = new jsDataSet.DataSet("temp");
                                var tp = ds.newTable("tp");
                                var te = ds.newTable("te");
                                var tc = ds.newTable("tc");
                                // aggiungo relazione. table 2 è collegata a table 1 tramite la colonna c_name
                                ds.newRelation("r1", "tp", [canno], "te", [canno]);
                                ds.newRelation("r2", "tc", [ciddip], "te", [ciddip]);
                                // setto le prop delle colonne per t
                                tp.setDataColumn(canno, "Single");
                                te.setDataColumn(canno, "Single");
                                te.setDataColumn(ciddip, "Single");
                                te.setDataColumn(ccitta, "String");
                                tc.setDataColumn(ciddip, "Single");
                                tc.setDataColumn(cnumdip, "Single");
                                //primaryRow
                                var objrow00 = { canno: 2018 };
                                tp.add(objrow00);
                                // è la toConsider
                                var objrowEe = { canno: 2018, citta: "roma", ciddip: 1 };
                                te.add(objrowEe);
                                // riga della tabella del tag tablename
                                var objrow1 = { cnumdip: 30, ciddip: 1 };
                                tc.add(objrow1);

                                state.DS = ds;
                                state.addExtraEntity(
                                    "te"); // lo dovrebbe fare la getcontrols(). In questo unit test la setto io
                                // rinizializzo l'oggetto helpForm. la tab principlae in queasto test è table3
                                helpForm = new HelpForm(state, "tp", "#rootelement");
                                helpForm.lastSelected(tp, objrow00);

                                // Per sicurezza valuto i valori di default che ho sui controlli html, prima della fill
                                expect($("#txtBox1").val()).toBe("25");
                                helpForm.fillControls()
                                    .then(function() {
                                        expect($("#txtBox1").val())
                                            .toBe("30" +
                                                numberDecimalSeparator +
                                                "00"); // sulla text mi aspetto il valore che avevo sul datarow inserito sul datatable
                                        expect($("#txtBox1").prop("readonly"))
                                            .toBe(true); // Edit state + campo della tabella child
                                        done();
                                    });
                            });

                        it("disableControl() + reEnable() should disable/enable correct html control",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table1.c_name" value="25"><br>' +
                                    '<input type="password" id="mypass" data-tag="table1.c_name" name="psw" value="1234">' +
                                    '<select id="combo1" data-tag="table1.c_name"  data-source-name="table1" data-value-member="c_codice"  data-display-member="c_name">' +
                                    '<input type="radio" id="radio1" name="season" value="winter" checked data-tag="table3.c_sex:maschio"> winter<br>' +
                                    '<div id="div1" data-tag="table1.c_dec" data-value-signed>' +
                                    '<input type="text" id="txtBox2" disabled="true"  data-tag="table1.c_dec" value="10" ><br>' +
                                    '<input type="text" id="txtBox3" data-tag="table1.c_name" value="10" ><br>' +
                                    '<input type="radio" id="radio2" name="op" value="add" checked> Add<br>' +
                                    '<input type="radio" id="radio3" disabled="true" name="op" value="sub" data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);

                                helpForm.preScanControls()
                                    .then(()=>{
                                            // helpForm.disableControl($("html").find("input:password")[0], false);

                                            helpForm.disableControl($("#txtBox1")[0], false);
                                            expect($("#txtBox1").prop("readonly")).toBe(true);
                                            helpForm.reEnable($("#txtBox1")[0]);
                                            expect($("#txtBox1").prop("readonly")).toBe(false);

                                            helpForm.disableControl($("#mypass")[0], false);
                                            expect($("#mypass").prop("readonly")).toBe(true);
                                            helpForm.reEnable($("#mypass")[0]);
                                            expect($("#mypass").prop("readonly")).toBe(false);

                                            helpForm.disableControl($("#combo1")[0], false);
                                            expect($("#combo1").prop("disabled")).toBe(true);
                                            helpForm.reEnable($("#combo1")[0]);
                                            expect($("#combo1").prop("disabled")).toBe(false);

                                            helpForm.disableControl($("#radio1")[0], false);
                                            expect($("#radio1").prop("disabled")).toBe(true);
                                            helpForm.reEnable($("#radio1")[0]);
                                            expect($("#radio1").prop("disabled")).toBe(false);

                                            helpForm.disableControl($("#div1")[0], false);
                                            expect($("#div1").prop("disabled")).toBe(true);
                                            expect($("#radio2").prop("disabled")).toBe(true);
                                            expect($("#radio3").prop("disabled")).toBe(true);
                                            expect($("#txtBox2").prop("disabled")).toBe(true);
                                            expect($("#txtBox3").prop("disabled")).toBe(true);
                                            helpForm.reEnable($("#div1")[0]);
                                            expect($("#div1").prop("disabled")).toBe(false);
                                            expect($("#radio2").prop("disabled")).toBe(false);
                                            expect($("#radio3").prop("disabled")).toBe(true); // era disabled all'inizio, deve continuare a rimanere disabled
                                            expect($("#txtBox2").prop("disabled"))
                                            .toBe(true); // era disabled all'inizio, deve continuare a rimanere disabled
                                            expect($("#txtBox3").prop("disabled"))
                                            .toBe(false); // non era disabled all'inizio, deve tornare abilitato
                                            done();
                                    })


                            });

                    });
                
                describe("Search Event",
                    function() {

                        it("getSuitableColumnForSearchTag return the correct DataColumn object",
                            function(done) {
                                var col = helpForm.getSuitableColumnForSearchTag("table1.c_name", "String");
                                expect(col.constructor.name).toBe("DataColumn");
                                expect(col.ctype).toBe("String");
                                expect(col.name).toBe("c_name");

                                var col = helpForm.getSuitableColumnForSearchTag("table1.c_dec.c", "Decimal");
                                expect(col.constructor.name).toBe("DataColumn");
                                expect(col.ctype).toBe("Decimal");
                                expect(col.name).toBe("c_dec");
                                done();
                            });

                        it("iterateGetSearchCondition  on TEXTBOX works, String Column + other empty element",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="table1.c_name" value="mystring"><br>' +
                                    '<input type="text" id="txtBox2" data-tag="table1.c_dec" value=1><br>' +
                                    '<input type="checkbox" id="mycheck1" data-tag="table3.c_sex:maschio:femmina">' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var cond = helpForm.iterateGetSearchCondition();
                                            expect(cond).toEqual(jasmine.any(Function));
                                            expect(cond.myArguments[0]).toEqual(jasmine.any(Array));
                                            var andArgs = cond.myArguments[0];
                                            expect(andArgs[0]).toEqual(jasmine.any(Function));
                                            var fun = andArgs[0];
                                            var fun2 = andArgs[1];
                                            expect(fun.myArguments[0]).toBe("c_name");
                                            expect(fun.myArguments[1]).toBe("mystring");
                                            expect(fun2.myArguments[0]).toBe("c_dec");
                                            expect(fun2.myArguments[1]).toBe(1);
                                            expect(fun.myName).toBe("eq");
                                            done();
                                    })

                            });

                        it("iterateGetSearchCondition on TEXTBOX works, String Column + Search Tag + Like case",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1" data-tag="table1.c_name?table2.c_citta" value="roma"><br>' +
                                    '<input type="text" id="txtBox2" data-tag="table1.c_name" value="capo%"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var cond = helpForm.iterateGetSearchCondition();
                                            expect(cond).toEqual(jasmine.any(Function));
                                            expect(cond.myArguments[0]).toEqual(jasmine.any(Array));
                                            var andArgs = cond.myArguments[0];
                                            expect(andArgs[0]).toEqual(jasmine.any(Function));
                                            var fun = andArgs[0];
                                            expect(fun.myArguments[0]).toBe("c_citta");
                                            expect(fun.myArguments[1]).toBe("roma");
                                            expect(fun.myName).toBe("eq");
                                            var fun2 = andArgs[1];
                                            expect(fun2.myArguments[0]).toBe("c_name");
                                            expect(fun2.myArguments[1]).toBe("capo%");
                                            expect(fun2.myName).toBe("like");
                                            done();
                                    })

                            });

                        it("iterateGetSearchCondition on TEXTBOX works, Decimal column",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox2" data-tag="table1.c_dec" value="123"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var cond = helpForm.iterateGetSearchCondition();
                                            expect(cond).toEqual(jasmine.any(Function));
                                            expect(cond.myName).toBe("eq");
                                            expect(cond.myArguments[0]).toBe("c_dec");
                                            expect(cond.myArguments[1]).toBe(123);
                                            done();
                                    })
                             });

                        it("iterateGetSearchCondition on TEXTBOX works, DateTime Column",
                            function(done) {
                                // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="text" id="txtBox1"  data-tag="table3.c_date" value ="02/10/1980"><br>' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var cond = helpForm.iterateGetSearchCondition();
                                            expect(cond).toEqual(jasmine.any(Function));
                                            expect(cond.myName).toBe("eq");
                                            expect(cond.myArguments[0]).toBe("c_date");
                                            expect(cond.myArguments[1].constructor.name).toBe("Date");
                                            expect(cond.myArguments[1].getDate()).toBe(2);
                                            expect(cond.myArguments[1].getMonth() + 1).toBe(10);
                                            expect(cond.myArguments[1].getFullYear()).toBe(1980);
                                            done();
                                    });

                               
                            });

                        it("iterateGetSearchCondition on CHECKBOX works, String Column",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" data-tag="table3.c_sex:maschio:femmina">' +
                                    "</div>";
                                $("html").html(mainwin);
                                helpForm = new HelpForm(state, "table3", "#rootelement");
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var cond = helpForm.iterateGetSearchCondition();
                                            expect(cond).toEqual(jasmine.any(Function));
                                            expect(cond.myName).toBe("eq");
                                            expect(cond.myArguments[0]).toBe("c_sex");
                                            expect(cond.myArguments[1]).toBe("femmina"); // è un unchecked quindi cerca il valore No

                                            mainwin = '<div id="rootelement">' +
                                                '<input type="checkbox" id="mycheck1" checked data-tag="table3.c_sex:maschio:femmina">' +
                                                "</div>";
                                            $("html").html(mainwin);
                                            cond = helpForm.iterateGetSearchCondition();
                                            expect(cond.myArguments[0]).toBe("c_sex");
                                            expect(cond.myArguments[1]).toBe("maschio"); // è checked quindi cerca il valore Yes
                                            expect(cond.myName).toBe("eq");
                                            done();
                                    });

                            });

                        it("iterateGetSearchCondition on CHECKBOX works, Bit Case",
                            function(done) {
                                // Caso cehck/uncheck con numero di bit qualsiasi che funge da maschera
                                // maschera: 1 shift di 3 posti. 18 ->26, uncheck 26 ->18
                                var mainDiv = '<div id="rootelement">' +
                                    '<input type="checkbox" id="mycheck1" checked data-tag="t.c_bit:3">' +
                                    '<input type="checkbox" id="mycheck1"  data-tag="t.c_bit:1">' +
                                    "</div>";
                                $("html").html(mainDiv);

                                var cBit = "c_bit";
                                // costruisco ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                t.setDataColumn(cBit, "Single");
                                var objrow = { c_bit: 18 };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                helpForm.preScanControls()
                                    .then(()=>{
                                            var cond = helpForm.iterateGetSearchCondition();
                                            // cambia il valore della riga primaria. Deve mettere quello dell'opzione selezionata
                                            var andArgs = cond.myArguments[0];
                                            expect(andArgs.length).toBe(2);
                                            var fun = andArgs[0];
                                            expect(fun.myArguments[0]).toBe("c_bit");
                                            expect(fun.myArguments[1]).toBe(0);
                                            expect(fun.myName).toBe("bitClear");

                                            var fun2 = andArgs[1];
                                            expect(fun2.myArguments[0]).toBe("c_bit");
                                            expect(fun2.myArguments[1]).toBe(1);
                                            expect(fun2.myName).toBe("bitSet");
                                            done();
                                    })

                            });

                        it("iterateGetSearchCondition with COMBO and Decimal column",
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<select id="combo1" data-tag="table2.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_name">' +
                                    "</select>" +
                                    "</div>";
                                $("html").html(mainwin);

                                // costruisco ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var table2 = ds.newTable("table2");
                                var t = ds.newTable("t");

                                // colonne per il datasource
                                table2.setDataColumn("c_codice", "Decimal");
                                table2.setDataColumn("c_field1", "String");
                                table2.columns["c_codice"].caption = "CODICE";
                                table2.columns["c_field1"].caption = "FIELD1";
                                    let objrow1 = { c_codice: 1, c_field1: "uno" };
                                    let objrow2 = {c_codice: 2, c_field1: "due"};
                                    let objrow3 = {c_codice: 3, c_field1: "tre"};
                                    let objrow4 = { c_codice: 4, c_field1: "quattro" };
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
                                var objrow5 = { c_codice: 1, c_field1: "uno" };
                                var objrow6 = { c_codice: 3, c_field1: "tre" };
                                var objrow7 = { c_codice: 4, c_field1: "quattro" };
                                datasource.add(objrow5);
                                datasource.add(objrow6);
                                datasource.add(objrow7);

                                state.DS = ds;
                                state.currentRow = objrow1;
                                var metapage = new appMeta.MetaPage('table2', 'def', false);
                                helpForm = new HelpForm(state, "table2", "#rootelement");
                                helpForm.lastSelected(table2, objrow1);
                                metapage.helpForm = helpForm;
                                metapage.state = state;
                                helpForm.preScanControls()
                                    .then(()=>{
                                            return  helpForm.fillControls();
                                    })
                                    .then(function() {
                                        $("#combo1").val("3"); // metto una selected
                                        let cond = helpForm.iterateGetSearchCondition();
                                        expect(cond.myName).toBe("eq");
                                        expect(cond.myArguments[0]).toBe("c_codice");
                                        expect(cond.myArguments[1]).toBe(3);
                                        done();
                                    });
                            });

                        it('iterateGetSearchCondition with RADIO BUTTONS and String column',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<input type="radio" name="season" value="winter" checked data-tag="t.c_season:winter"> winter<br>' +
                                    '<input type="radio" name="season" value="spring" data-tag="t.c_season:spring"> spring<br>' +
                                    '<input type="radio" name="season" value="summer" data-tag="t.c_season:summer"> summer <br>' +
                                    '<input type="radio" name="season" value="autumn" data-tag="t.c_season:autumn"> autumn' +
                                    "</div>";
                                $("html").html(mainwin);

                                var cSeason = "c_season";
                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(cSeason, "String");
                                var objrow = { c_season: "spring" };
                                t.add(objrow);
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                var cond = helpForm.iterateGetSearchCondition();
                                expect(cond).toEqual(jasmine.any(Function));
                                expect(cond.myName).toBe("eq");
                                expect(cond.myArguments[0]).toBe("c_season");
                                expect(cond.myArguments[1]).toBe("winter");
                                done();
                            });

                        it('iterateGetSearchCondition with Value signed control',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" name="op" value="add" checked> Add<br>' +
                                    '<input type="radio" name="op" value="sub" data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico ogetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                var cond = helpForm.iterateGetSearchCondition();
                                expect(cond).toEqual(jasmine.any(Function));
                                expect(cond.myName).toBe("eq");
                                expect(cond.myArguments[0]).toBe("ctemp");
                                expect(cond.myArguments[1]).toBe(10);
                                done();
                          
                            });

                        it('iterateGetSearchCondition with Value signed control with minus sign',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div data-tag="t.ctemp" data-value-signed>' +
                                    'amount: <input type="text" id="txtBox1"  data-tag="t.ctemp" value="10" ><br>' +
                                    '<input type="radio" name="op" value="add" > Add<br>' +
                                    '<input type="radio" name="op" value="sub" checked data-tag="-"> Sub<br>' +
                                    " </div>" +
                                    "</div>";
                                $("html").html(mainwin);

                                var ctemp = "ctemp";
                                // costrusico oggetto stato e ds
                                var state = new appMeta.MetaPageState();
                                var ds = new jsDataSet.DataSet("temp");
                                var t = ds.newTable("t");
                                // setto le prop delle colonne per t
                                t.setDataColumn(ctemp, "Single");
                                state.DS = ds;
                                // inizializzo la form
                                helpForm = new HelpForm(state, "t", "#rootelement");
                                var cond = helpForm.iterateGetSearchCondition();
                                expect(cond).toEqual(jasmine.any(Function));
                                expect(cond.myName).toBe("eq");
                                expect(cond.myArguments[0]).toBe("ctemp");
                                expect(cond.myArguments[1]).toBe(-10);
                                done();
                            });
                    });
                
                describe("Add custom Events on standard button",
                    function() {
                        
                        it('getLinkedGrid returns the grid in the same container of the button insert',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div><div id="grid0" data-tag="table2.c_codice" data-custom-control="gridx"></div></div>' +
                                    '<button id="btn1" type="button" data-tag="insert">Add</button>' +
                                    '<div id="grid1" data-tag="table2.c_codice" data-custom-control="gridx"></div>' +
                                    '</div>';

                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            let el = $("#btn1")[0];
                                            let g = helpForm.getLinkedGrid(el);
                                            expect(g).toBeDefined();
                                            expect($(g.el).attr("id")).toBe("grid1");
                                            done();
                                    })
                           });

                        it('FillControl with standard button + linked grid Enable/Disable insert button',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div><div id="grid0" data-tag="table2.c_codice" data-custom-control="grid"></div></div>' +
                                    '<button id="btn1" type="button" data-tag="insert">Add</button>' +
                                    '<div id="grid1" data-tag="table2.c_codice" data-custom-control="grid"></div>' +
                                    '</div>';

                                $("html").html(mainwin);
                                helpForm.preScanControls()
                                    .then(()=>{
                                            return helpForm.fillControls()
                                    })
                                    // serve per leggere il GridControllor
                                    .then(
                                        function() {
                                            expect($('#btn1').prop("disabled")).toBe(false);
                                            done();
                                        }
                                    );

                            });

                        it('setMainButtons works',
                            function(done) {
                                var mainwin = '<div id="rootelement">' +
                                    '<div><div id="grid0" data-tag="table2.c_codice" data-custom-control="grid"></div></div>' +
                                    '<button id="btn1" type="button" data-tag="manage.table2">Add</button>' +
                                    '<button id="btn2" type="button" data-tag="manage.tableNotExist">Add</button>' +
                                    '<div id="grid1" data-tag="table2.c_codice" data-custom-control="grid"></div>' +
                                    '</div>';

                                $("html").html(mainwin);
                                helpForm.setMainButtons($("#btn1")[0],
                                    "manage.table2"); // serve per leggere il GridControllor
                                expect($('#btn1').prop("disabled")).toBe(false);

                                helpForm.pageState.setEditState();
                                helpForm.setMainButtons($("#btn1")[0],
                                    "manage.table2"); // serve per leggere il GridControllor
                                expect($('#btn1').prop("disabled")).toBe(false);

                                helpForm.pageState.setInsertState();
                                helpForm.setMainButtons($("#btn1")[0],
                                    "manage.table2"); // serve per leggere il GridControllor
                                expect($('#btn1').prop("disabled")).toBe(false);

                                helpForm.setMainButtons($("#btn2")[0],
                                    "manage.tableNotExist"); // serve per leggere il GridControllor
                                expect($('#btn2').prop("disabled")).toBe(true);
                                done();
                            });
                        
                    });
                
                describe("DataSet/DataTable utilities",
                    function() {

                        it("childRelation(t1, t2, relExisting) returns relation existing",
                            function() {
                                var res = helpForm.childRelation(t1, t2, "r1");
                                expect(res.parentTable).toBe("table1");
                                expect(res.childTable).toBe("table2");
                                expect(res.childCols.length).toBe(1);
                                expect(res.parentCols.length).toBe(1);
                            });

                        it("childRelation(t1, t2, relNotExisting) returns undefined,  beacause relation not existing",
                            function() {
                                var res = helpForm.childRelation(t1, t2, "r3");
                                expect(res).toBeUndefined();
                            });

                        it("makechild() modifies the values of the childrow, with rel specified",
                            function() {
                                var res = helpForm.makeChild(objrow1Parent.getRow(), tParent, objrow1.getRow(), "r2");
                                expect(res).toBe(true);
                                expect(objrow1["c_double"]).toBe(1001); // non cambia. cambiano solo i valorie sulle colonne della relazione
                                expect(objrow1["c_name"]).toBe("nome1Parent");
                                expect(objrow1["c_dec"]).toBe(1122);
                            });

                        it("makechild() modifies the values of the childrow, with rel not specified, but existing",
                            function() {
                                var res = helpForm.makeChild(objrow1Parent.getRow(), tParent, objrow1.getRow(), "r2");
                                expect(res).toBe(true);
                                expect(objrow1["c_double"]).toBe(1001); // non cambia. cambiano solo i valorie sulle colonne della relazione
                                expect(objrow1["c_name"]).toBe("nome1Parent");
                                expect(objrow1["c_dec"]).toBe(1122);
                            });

                        it("makechild() modifies the values of the childrow, with rel not specified, but existing",
                            function() {
                                var res = helpForm.makeChild(objrow1Parent.getRow(), tParent, objrow1.getRow());
                                expect(res).toBe(true);
                                expect(objrow1["c_double"]).toBe(1001); // non cambia. cambiano solo i valorie sulle colonne della relazione
                                expect(objrow1["c_name"]).toBe("nome1Parent");
                                expect(objrow1["c_dec"]).toBe(1122);
                            });

                        it("checkToClear() returns true/false, depending if childColumn is key",
                            function() {
                                var res = helpForm.checkToClear(t2, t2.columns.c_name, ds.relations.r1);
                                expect(res).toBe(false);
                            });

                        it("mainChildRelation() returns the main relation child expected",
                            function() {
                                //Es 1.
                                var res = helpForm.mainChildRelation(t1);
                                expect(res).toBeNull();

                                //Es 2.
                                var res = helpForm.mainChildRelation(tParent);
                                expect(res.parentTable).toBe("tParent");
                                expect(res.childTable).toBe("table1");
                                expect(res.childCols.length).toBe(2);
                                expect(res.parentCols.length).toBe(2);

                                //Es 3.
                                helpForm.addExtraEntity("table2");
                                var res = helpForm.mainChildRelation(t1);
                                expect(res.parentTable).toBe("table1");
                                expect(res.childTable).toBe("table2");
                                expect(res.childCols.length).toBe(1);
                                expect(res.parentCols.length).toBe(1);
                                
                                // fine test ripulisco ExtraEntity
                                helpForm.pageState.extraEntities = {};
                            });
                        
                    });
            });
    });
