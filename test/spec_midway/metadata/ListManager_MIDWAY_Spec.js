'use strict';

describe('ListManager', function () {
    var ListManager = appMeta.ListManager;
    var HelpForm = appMeta.HelpForm;
    var helpForm, metapage;
    var stabilizeToCurrent = appMeta.stabilizeToCurrent;
    var stabilize = appMeta.stabilize;
    var origDoGet; // mock funz doGet
    var $q = window.jsDataQuery;
    var common = appMeta.common;

    /**
     * @class ConnMockServer
     * @summary ConnMockServer
     * @description
     *
     */
    function ConnMockServer() {
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
        call:function (objConn) {
            if (this[objConn.method]) return this[objConn.method](objConn.prm);
            throw  "method " + objConn.method + " not defined on ConnMockServer" ;
        },


        // ********** Private methods. They are customized based on unit test **********
        /**
         * Returns the number of the rows in a table
         * @param prm
         * @returns {Promise}
         */
        selectCount:function (prm) {
            return $.Deferred().resolve(100).promise();
        },

        /**
         * get rows of paginated table
         * @param {Object} prm
         * @returns {Promise}
         */
        getPagedTable:function (prm) {
            // recupero parametro
            var nPage = prm.nPage;
            var nrowperpage = prm.nRowPerPage;

            var ds = new jsDataSet.DataSet("temp");
            var t = ds.newTable("table1");
            t.setDataColumn("c_name", "String");
            t.setDataColumn("c_dec", "Single");
            t.setDataColumn("c_citta", "String");
            t.columns["c_name"].caption = "Name";
            t.columns["c_dec"].caption = "Age";
            t.columns["c_citta"].caption = "Citta";
            t.key(["c_name"]);
            var init = ( nPage - 1 ) * nrowperpage;
            for (var i = init; i < init + nrowperpage; i++){
                var cname;
                if (i % 3 ===0){
                    cname= "Long nameeeeeeeeeeeeeeeeee" + i;
                } else {
                    cname= "nome" + i;
                }
                var objrow = {c_name: cname , c_dec: i, c_citta: "citta" + i};
                t.add(objrow);
            }

            // costruisco json con i 3 prm che mi aspetto
            var jsonDt = appMeta.getDataUtils.getJsonFromDataTable(t);
            var json = {};
            json['dt'] = jsonDt;
            json['totpage'] = 10;
            json['totrows'] = t.rows.length;
            return $.Deferred().resolve(json);
        },

        /**
         * Simulate a getDsByRowKey. Retuns a ds with one row
         * @returns {*}
         */
        getDsByRowKey:function () {
            var ds = new jsDataSet.DataSet("temp");
            var t = ds.newTable("table1");
            t.setDataColumn("c_name", "String");
            t.setDataColumn("c_dec", "Single");
            t.setDataColumn("c_citta", "String");
            t.columns["c_name"].caption = "Name";
            t.columns["c_dec"].caption = "Age";
            t.columns["c_citta"].caption = "Citta";
            t.key("c_name");

            var objrow = {c_name: "cname_sel" , c_dec: 999, c_citta: "cname_sel"};
            t.add(objrow);
            t.acceptChanges();
            return $.Deferred().resolve(appMeta.getDataUtils.getJsonFromJsDataSet(ds, true)).promise();
        }
    };


    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
        appMeta.basePath = "base/";

        metapage = new appMeta.MetaPage('table1', 'def', false);

        var state = new appMeta.MetaPageState();
        var ds = new jsDataSet.DataSet("temp");
        var t = ds.newTable("table1");
        t.setDataColumn("c_name", "String");
        t.setDataColumn("c_dec", "Single");
        t.setDataColumn("c_citta", "String");
        t.columns["c_name"].caption = "Name";
        t.columns["c_dec"].caption = "Age";
        t.columns["c_citta"].caption = "Citta";
        t.key("c_name");
        state.DS = ds;
        metapage.state = state;


        var mainwin = '<div id="rootelement">' +
            'c_name: <input type="text" id="txtBox1" data-tag="table1.c_name"><br>' +
            '<div id="lm1"></div>' +
            "</div>";
        $("html").html(mainwin);
        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
        $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
        helpForm = new HelpForm(state, "table1", "#rootelement");
        metapage.helpForm = helpForm;

        // imposto mock del backend
        appMeta.connection = new ConnMockServer();

        // mock funzione asyn describeColumns()
        appMeta.MetaData.prototype.describeColumns = function() {
            return new $.Deferred().resolve();
        };

        appMeta.config.listManager_nRowPerPage  = 10;
        origDoGet =  appMeta.getData.doGet;
        appMeta.getData.doGet = function () {
            return new $.Deferred().resolve().promise();
        }
    });

    afterEach(function () {
        appMeta.basePath = "/";
        appMeta.getData.doGet = origDoGet;
        appMeta.config.listManager_nRowPerPage  = 100;
    });

    describe("ListManager class",
        function () {

            it("createList(npgage) method", function (done) {

                var lm = new ListManager("table1", "listType", null, false, $("#lm1"), metapage);
                lm.init();
                var $footerTable;
                lm.createList()
                    .then(function () { // passo pagina 1
                        expect($("table:first").find("tr").length).toBe(11); // grid dati 11 righe. 1 header + 10 dati
                        $footerTable = $($("table")[1]);
                        expect($footerTable.find("tr").length).toBe(1); // footer 1 riga
                        expect($("table:first").find("tr:nth-child(2) > td:nth-child(4)").text()).toBe("citta0");
                        expect($footerTable.find("tr").find("td:last").text()).toBe(">>");
                        expect($footerTable.find("tr").find("td:first").text()).toBe("<<");
                        expect($footerTable.find("tr").find("td:first > button").prop("disabled"))
                            .toBe(true); // primo bottone << disabilitato
                        expect($footerTable.find("tr").find("td:last > button").prop("disabled"))
                            .toBe(false); // >> abilitato
                        expect($footerTable.find("tr").find("td:nth-child(2) > button").prop("disabled"))
                            .toBe(true); // < disabilitato
                        expect($footerTable.find("tr").find("td:nth-child(3) > button").prop("disabled"))
                            .toBe(true); // 1 pagina corrente disabilitato

                        // bottoni pagina da 2 a 5 abilitati
                        for (var i = 4; i <= 7; i++) {
                            expect($footerTable.find("tr").find("td:nth-child(" + i + ") > button")
                                .prop("disabled")).toBe(false);
                        }
                        var s = stabilizeToCurrent();
                        $footerTable.find("tr").find("td:last > button").click(); // clicco ">>"
                        //return  common.eventWaiter(metapage, appMeta.EventEnum.listCreated);
                        return s;
                    })
                    .then(function () {
                        $footerTable = $($("table")[1]);
                        // verifico effettivamente cambio dei dati sulla tabella
                        expect($("table:first").find("tr:nth-child(2) > td:nth-child(4)").text()).toBe("citta51");
                        // verifico stato dei bottoni
                        expect($footerTable.find("tr").find("td:first > button").prop("disabled"))
                            .toBe(false); // primo bottone << abilitato
                        expect($footerTable.find("tr").find("td:last > button").prop("disabled"))
                            .toBe(true); // >> disabilitato
                        expect($footerTable.find("tr").find("td:nth-child(2) > button").prop("disabled"))
                            .toBe(false); // < abilitato
                        expect($footerTable.find("tr").find("td:nth-child(3) > button").prop("disabled"))
                            .toBe(true); // 1 pagina corrente disabilitato
                        done();
                    });

            });

            it("method show() not modal builds the grid and footer", function (done) {
                var lm =  new ListManager("table1", "listType", null, false, $("#lm1"), metapage);
                lm.init();
                var res = lm.show();
                var $footerTable;
                res.then(function() {
                    expect($("table:first").find("tr").length).toBe(11); // grid dati 11 righe. 1 header + 10 dati
                    $footerTable = $($("table")[1]);
                    expect($footerTable.find("tr").length).toBe(1); // footer 1 riga
                    expect($footerTable.find("tr").find("td:last").text()).toBe(">>");
                    expect($footerTable.find("tr").find("td:first").text()).toBe("<<");
                    expect($footerTable.find("tr").find("td:first > button").prop("disabled")).toBe(true); // primo bottone << disabilitato
                    expect($footerTable.find("tr").find("td:last > button").prop("disabled")).toBe(false); // >> abilitato
                    expect($footerTable.find("tr").find("td:nth-child(2) > button").prop("disabled")).toBe(true); // < disabilitato
                    expect($footerTable.find("tr").find("td:nth-child(3) > button").prop("disabled")).toBe(true); // 1 pagina corrente disabilitato

                    var s = stabilizeToCurrent();
                    $footerTable.find("tr").find("td:last > button").click(); // clicco ">>"
                    return s;
                }).then(function() {
                    $footerTable = $($("table")[1]);
                        // bottoni pagina da 2 a 5 abilitati
                        for (var i = 4; i <= 7; i++) {
                            expect(  $footerTable .find("tr").find("td:nth-child(" + i + ") > button")
                                .prop("disabled")).toBe(false);
                        }
                        var s = stabilizeToCurrent();
                        $footerTable .find("tr").find("td:last > button").click(); // clicco ">>" quindi vado avanti di "numberOfPagesInFooter"
                        return s;

                    }).then(function() {
                        $footerTable = $($("table")[1]);
                        expect( $footerTable.find("tr").find("td:first > button").prop("disabled")).toBe(false); // primo bottone << abilitato
                        expect( $footerTable.find("tr").find("td:last > button").prop("disabled")).toBe(true); // >> disabilitato
                        expect( $footerTable.find("tr").find("td:nth-child(2) > button").prop("disabled")).toBe(false); // < abilitato
                        expect( $footerTable.find("tr").find("td:nth-child(3) > button").prop("disabled")).toBe(false); // 1 pagina corrente abilitato, sarebbe pagina 6
                        expect( $footerTable.find("tr").find("td:nth-child(7) > button").prop("disabled")).toBe(true); // ultima pag dati, num 10

                        done();
                    })
                    .catch(function(e) {
                        console.log(e);
                        done();
                    });

            });

            it("method show() modal builds grid", function(done) {
                $('body').append(
                    '<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                var lm =  new ListManager("table1", "listType", null, true, $("#lm1"), metapage);
                lm.init();
                lm.show();
                common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                    .then(function() {
                        expect($("table:first").find("tr").length).toBe(11); // grid dati 11 righe. 1 header + 10 dati
                        expect($("table:first").parent().parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale
                        var s = stabilize();
                        lm.gridControl.isEditBtnVisible = true;
                        $("table:first").find("tr").eq(2).dblclick(); // doppio click su una riga. La modale si deve chiudere. così chiudo anche tutti i deferred
                        return s;
                    }).then(function() {
                        expect($("table:first").length).toBe(0); // la modale è stata rimossa, quindi anche la griglia che vi era ospitata
                        done();
                });
            });

            it("show MODAL:false resolve promise", function (done) {
                var lm =  new ListManager("table1", "listType", null, false, $("#lm1"), metapage);
                lm.init();
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                lm.show().
                then(function (res) {
                    expect(res).toBeUndefined();
                    done();
                });
            });

            it("show MODAL:false multiple click invoke row select on metaPage", function (done) {
                var lm =  new ListManager("table1", "listType", null, false, $("#lm1"), metapage);
                lm.init();
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                spyOn(metapage, "reFillControls").and.callThrough(); // verifico venga scatenato rowSelect su metapage, vedendo se viene chiamato il metodo interno freshForm

                lm.show().then(function(res) {
                    expect(res).toBeUndefined();

                    // ci sono 2 def appesi, il listManager e lo show
                    var s = stabilizeToCurrent();
                    $("table:first").find("tr").eq(3).click();
                    return s;

                }).then(function() {
                        expect($("table:first").length).toBe(1); // la grid è ancora presente
                        expect( $("#txtBox1").val()).toBe("cname_sel");
                        expect(metapage.reFillControls).toHaveBeenCalled();

                        // ci sono 2 def appesi, il listManager e lo show
                        var s = stabilizeToCurrent();
                        lm.gridControl.isEditBtnVisible = true;
                        $("table:first").find("tr").eq(4).dblclick();
                        return s;

                    })
                    .then(function() {
                        expect($("table:first").length).toBe(0); // la grid al doppio click viene chiusa
                        expect( $("#txtBox1").val()).toBe("cname_sel");
                        expect(metapage.reFillControls).toHaveBeenCalled();
                        done();
                    });
            });

            it("show MODAL:false button close works", function (done) {
                var lm =  new ListManager("table1", "listType", null, false, $("#lm1"), metapage);
                lm.init();
                $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                $('body').append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.11.3/themes/smoothness/jquery-ui.css" />');

                lm.show()
                    .then(function () {
                        expect($("table:first").length).toBe(1); // prima del chiudi verifico presenza della tabella
                        expect($(lm.currentRootElement).find("button:first").text()).toBe("<<"); // mi asoetto ci sia bottone chiudi
                        var wait = common.eventWaiter(metapage, appMeta.EventEnum.listManagerHideControl);
                        lm.closeEl.click(); // premo su bottone chiudi
                        return wait;
                    })
                    .then(function () {
                        expect($("table:first").length).toBe(0); // tabella viene tolta dopo il chiudi
                        done();
                    });

            });

            it("show MODAL:true resolve promise after click close btn", function (done) {
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                var lm =  new ListManager("table1", "listType", null, true, $("#lm1"), metapage);
                lm.init();
                lm.show();
                common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                    .then(function () {
                        expect($("table:first").find("tr").length).toBe(11); // grid dati 11 righe. 1 header + 10 dati
                        expect($("table:first").parent().parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale

                        var wait =  common.eventWaiter(metapage, appMeta.EventEnum.listManagerHideControl);
                        $(lm.currentRootElement).find("button:first").click(); // premo su bottone chiudi
                        return wait;
                    })
                    .then(function () {
                        expect($("table:first").length).toBe(0); // tabella viene tolta dopo il chiudi
                        done();
                    });
            });

            it("show MODAL:true resolve promise after dblClick on data row number 2", function (done) {
                $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                var lm =  new ListManager("table1", "listType", null, true, $("#lm1"), metapage);
                lm.init();
                lm.show();

                common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                    .then(function() {
                        expect($("table:first").parent().parent().parent().hasClass("modal-body"))
                            .toBe(true); // griglia dati ospitata sulla modale

                        var s = stabilize();
                        lm.gridControl.isEditBtnVisible = true;
                        $("table:first").find("tr").eq(3).dblclick(); // doppio click su seconda riga, mi aspetto citta2
                        return s;
                    }).then(function(res) {
                    expect($("table:first").length).toBe(0); // la modale è stata rimossa, quindi anche la griglia che vi era ospitata
                    done();
                });
            });

            it("show MODAL:true resolve click row + click nav button + dblclick", function (done) {
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');


                var lm =  new ListManager("table1", "listType", null, true, $("#lm1"), metapage);
                lm.init();
                lm.show(); // mostra il listManager in versione modale, attendo quindi nell'evento che sia visualzzata e posso effettuare le operazioni
                common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                    .then(function() {
                        expect($("table:first").parent().parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale
                        var s = stabilizeToCurrent();
                        $("table:first").find("tr").eq(2).click(); // single click su una riga
                        return s;

                    }).then(function() {
                    expect($("table:last").find("tr").find("td:first > button").prop("disabled")).toBe(true); // primo bottone "<<" disabilitato
                    expect($("table:last").find("tr").find("td:last > button").prop("disabled")).toBe(false); // ">>" abilitato
                    expect($("table:last").find("tr").find("td:nth-child(2) > button").prop("disabled")).toBe(true); // "<" diabilitato
                    expect($("table:last").find("tr").find("td:nth-child(3) > button").prop("disabled")).toBe(true); // 1 pagina corrente disabilitato

                    var s = stabilizeToCurrent();
                    $("table:last").find("tr").find("td:last > button").click(); // clicco su bottone di navigazione ">>"
                    return s;

                }).then(function() {
                    expect($("table:last").find("tr").find("td:first > button").prop("disabled")).toBe(false); // primo bottone "<<" abilitato
                    expect($("table:last").find("tr").find("td:last > button").prop("disabled")).toBe(true); // ">>" disabilitato
                    expect($("table:last").find("tr").find("td:nth-child(2) > button").prop("disabled")).toBe(false); // "<" abilitato
                    expect($("table:last").find("tr").find("td:nth-child(3) > button").prop("disabled")).toBe(true); // 1 pagina corrente disabilitato

                    var s = stabilize();
                    lm.gridControl.isEditBtnVisible = true;
                    $("table:first").find("tr").eq(3).dblclick(); // doppio click su una riga. La modale si deve chiudere.
                    return s;
                }).then(function() {
                    expect($("table:first").length).toBe(0); // la modale è stata rimossa, quindi anche la griglia che vi era ospitata
                    done();
                });
            });

            it("show MODAL:true, with ds, selectCount(), getPagedTable() mocked, with toMerge table", function (done) {
                $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');

                var mp = new appMeta.MetaPage('registry', 'anagrafica', false);
                var state = new appMeta.MetaPageState();
                var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                state.DS = ds;
                mp.state = state;
                var tRegistry = ds.tables['registry'];
                var tRegistryAddress = ds.tables['registryaddress'];

                appMeta.getData.selectCount = function (prm) {
                    return $.Deferred().resolve(100).promise();
                };

                appMeta.getData.getPagedTable = function () {
                    tRegistryAddress.orderBy  = function (o) {
                        return "idreg";
                    };
                    return $.Deferred().resolve(tRegistryAddress).promise();
                };

                var hf = new HelpForm(state, "registry", "#rootelement");
                hf.lastSelected(tRegistry, tRegistry.rows[0]);
                mp.helpForm = hf;
                tRegistry.notEntityChild = $q.like($q.field("p_iva"), "0");
                var lm =  new ListManager("registryaddress", "listType", null, true, $("#lm1"), mp, true, tRegistry);
                lm.init();
                lm.show();
                common.eventWaiter(mp, appMeta.EventEnum.showModalWindow)
                    .then(function () {
                        expect($("table:first").parent().parent().parent().hasClass("modal-body")).toBe(true);
                        expect($("table:first").find("tr").length).toBeGreaterThan(0);
                        var s = stabilize();
                        lm.gridControl.isEditBtnVisible = true;
                        $("table:first").find("tr").eq(2).dblclick(); // doppio click su una riga. La modale si deve chiudere.
                        return s;
                    }).then(function() {
                        expect($("table:first").length).toBe(0); // la modale è stata rimossa, quindi anche la griglia che vi era ospitata
                        done();
                    });

            }, 10000);

        });
});
