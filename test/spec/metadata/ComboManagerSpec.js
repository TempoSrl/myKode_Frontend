/* global beforeEach, afterEach,describe,jasmine,it,expect,inject,spyOn,$,jsDataSet,appMeta,_ */


describe("ComboManager",
    function () {
        var MetaPage = appMeta.MetaPage;
        var HelpForm = appMeta.HelpForm;
        var q = window.jsDataQuery;
        var metapage;
        var helpForm, combo;
        var objrow1, objrow2, objrow3, objrow4, objrow5, objrow6, objrow7;
        var stabilize = appMeta.stabilize;
        var origDoGet; // mock funz doGet
        beforeEach(function (done) {
            
            appMeta.basePath = "base/";
            
            //jasmine.clock().install();
            var cCodice = "c_codice";
            var cName = "c_name";
            var state = new appMeta.MetaPageState();
            var ds = new jsDataSet.DataSet("temp");
            var datasource = ds.newTable("datasource");
            var t = ds.newTable("t");

            datasource.isTemporaryTable = true;

            datasource.setDataColumn(cCodice, "Single");
            datasource.setDataColumn(cName, "String");
            //tabella principale
            t.setDataColumn(cCodice, "Single");

            // sovrascrivo il mio doc con un html di test, co i tag che mi servono. metto anche riga bianca
            var mainwin = '<div id="rootelement">' +
                '<select id="combo1" data-tag="datasource.c_codice"  data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_name">' +
                    "<option></option>" +
                    "<option value='1'></option>" +
                    "<option value='2'></option>" +
                    "<option value='3'></option>" +
                    "<option value='4'></option>" +
                "</select>" +
                "</div>";
            $("html").html(mainwin);

            // colonne per il datasource
            datasource.insertFilter = q.eq("c_codice", "3"); // sto in searchState, quindi non viene preso in considerazione
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
            state.meta  = new appMeta.MetaData('datasource');
            metapage = new MetaPage('datasource', 'def', true);
            metapage.state = state;
            helpForm = new HelpForm(state, "datasource", "#rootelement");
            helpForm.lastSelected(t, objrow6);
            metapage.helpForm = helpForm;
            helpForm.preScanControls()
            .then(()=>{
                helpForm.addEvents(metapage);
                combo = $("#combo1").data("customController");
                origDoGet =  appMeta.getData.doGet;
                appMeta.getData.doGet = function () {
                    return new $.Deferred().resolve(true).promise();
                };
               return metapage.freshForm(false,true);
            })
            .then(()=>{
                done();
            })

            
        });

        afterEach(function () {
            appMeta.getData.doGet = origDoGet;
            appMeta.basePath = "/";
        });

        describe("methods work",
            function (){

                it("exists", function (){
                    expect(combo).toBeDefined();
                });

                it("setRow", function (done){
                    //combo.addEvents(null, metapage);

                    spyOn(metapage, "freshForm").and.callThrough();

                    combo.setRow(objrow1, true)
                    .then(function (x){
                        expect(x).toBeDefined();
                        expect(combo.currentRow).toEqual(objrow1);
                        expect(metapage.freshForm).toHaveBeenCalled();
                        done();
                    });
                });

                it("setIndex with several values of index", function (done){

                    // inizializzo la grid con gli oggetti necessari
                    //combo.addEvents(null, metapage);
                    //combo.comboRows = [objrow1, objrow2, objrow3, objrow4];
                    spyOn(metapage, "freshForm").and.callThrough();
                     combo.setIndex(3)
                    .then(function (){
                        //expect(x).toBeDefined();

                        expect(metapage.freshForm).toHaveBeenCalled();
                        expect(combo.currentRow).toEqual(objrow3);
                        expect($('#combo1').get(0).selectedIndex).toBe(3); // è l'indice del elemento dom, parte da zero
                        expect($('#combo1').val()).toBe("3");

                        // chiama la rowSelect, quindi osservo se chiama a sua volta "freshForm"
                        // 10 è più grande del num di righe, quindi setta l'ultima riga disponibile,
                        // cioè la objrow4 che ha indice 4
                        return combo.setIndex(10);
                    })
                    .then(function (x){
                        // indice maggiore del consentito, quindi seleziona ultima riga, che in quest caso che "uno"
                        //   poiché ricordiamo rows viene ordinato
                        expect(x).toBeDefined();
                        expect(combo.currentRow).toEqual(objrow1);
                        expect($('#combo1').get(0).selectedIndex).toBe(4);
                        expect($('#combo1').val()).toBe('1');

                        // chiama la rowSelect, quindi osservo se chiama a sua volta "freshForm"
                        expect(metapage.freshForm).toHaveBeenCalled();
                        done();
                    });

                });

                it("setValue with blank row", function (done){

                    // without row
                    combo.setValue("3")
                    .then(function (x){
                        expect(x).toBeDefined();
                        expect(combo.currentRow).toEqual(null);
                        expect($('#combo1').get(0).selectedIndex).toBe(-1);
                    })
                    .then(function (){
                        combo.comboRows = [objrow1, objrow2, objrow3, objrow4];
                        // without row
                        return combo.setValue(3);
                    })
                    .then(function (x){
                        expect(x).toBeDefined();
                        expect(combo.currentRow).toEqual(objrow3);
                        expect($('#combo1').get(0).selectedIndex).toBe(3); // la zero è la riga bianca
                        expect($('#combo1').val()).toBe('3');
                        var v = combo.getValue();
                        expect(v).toBe(3);
                        done();
                    });

                });

                it("setValue without blank row", function (done){

                    // sovrascrivo il mio doc con un html di test, con i tag che mi servono.
                    var mainwin = '<div id="rootelement">' +
                        '<select id="combo1" data-tag="datasource.c_codice" data-noblank="true"' +
                        '  data-source-name="datasource"' +
                        ' data-value-member="c_codice"  ' +
                        'data-display-member="c_name">' +
                        "<option value='1'></option>" +
                        "<option value='2'></option>" +
                        "<option value='3'></option>" +
                        "<option value='4'></option>" +
                        "</select>" +
                        "</div>";
                    $("html").html(mainwin);
                    helpForm.preScanControls()
                    .then(() => {
                        combo = $("#combo1").data("customController");

                        // without row
                        combo.setValue("3")
                        .then(function (){
                            expect(combo.currentRow).toEqual(null);
                            expect($('#combo1').get(0).selectedIndex).toBe(-1);
                        })
                        .then(function (){
                            combo.comboRows = [objrow1, objrow2, objrow3, objrow4];
                            // without row
                            return combo.setValue(3);
                        })
                        .then(function (x){
                            expect(combo.currentRow).toEqual(objrow3);
                            expect($('#combo1').get(0).selectedIndex)
                            .toBe(2); // non c'è la riga bianca quindi la 3 ha selectedIndex  2, poichè parte da zero
                            expect($('#combo1').val()).toBe('3');
                            var v = combo.getValue();
                            expect(v).toBe(3);
                            done();
                        });
                    });
                });
            });
        
    });
