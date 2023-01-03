'use strict';

describe('HelpForm e2e', function () {
    var MetaPage = appMeta.MetaPage;
    var metapage;
    var $q = window.jsDataQuery;
    var conn;
    var stabilize = appMeta.stabilize;
    var timeout  = 60000;
    var common = appMeta.common;

    var defLogin;
    // effettuo login
    beforeAll(function () {
        defLogin = appMeta.Deferred("login");
        appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
                if (res) defLogin.resolve(true)
            });
        return defLogin.promise();
    });

    beforeEach(function () {
        appMeta.basePath = "base/";
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
        conn = appMeta.connection;
        appMeta.currApp.initToolBarManager();

        // mock funzione asyn describeColumns()
        appMeta.MetaData.prototype.describeColumns = function() {
            return new $.Deferred().resolve();
        };

    });
    afterEach(function () {
        appMeta.basePath = "/";
        metapage = null;
    });

    describe("HelpForm + MetaPage class",
        function () {


            it('AutoChoose is Asynch open a list (getPagedTable() mocked) + click row on list, text are correctly populated. registryaddress table',
                function(done) {
                    defLogin.then(function () {
                        var originGetPagedTable = appMeta.getData.getPagedTable;
                        var mainwin = '<div id="metaRoot">' +
                            '<div id="autochoose1" data-tag="AutoChoose.myaddress.anagrafica.StartFilter">' +
                            'address: <input type="text" name="myaddress" id="txtBox1" data-tag="registryaddress.address"><br>' +
                            'idreg: <input type="text" name="idreg" id="txtBox2" data-tag="registryaddress.idreg"><br>' +
                            '</div>' +
                            'cu: <input type="text" name="registrycu" id="txtBox2" data-tag="registry.cu" value="0"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        metapage = new MetaPage('registry', 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData('registry');
                        metapage.state = s;
                        metapage.listTop = 0;
                        var filter = $q.like('address', 'Via%');
                        metapage.registerFilter($("#autochoose1"), filter);

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);

                            // serve per simulare il getPagedTable()
                            var dsServer = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                            var tRegistryaddress = dsServer.tables["registryaddress"];

                            appMeta.getData.getPagedTable = function (prm) {
                                tRegistryaddress.orderBy  = function (o) {
                                    return "address";
                                };

                                return $.Deferred().resolve(tRegistryaddress, 1, 10);

                            };

                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    // per semplciità simulo il blur direttamente chiamando il metodo per semplicità con i prm giusti
                                    metapage.helpForm.textBoxLostFocus.call($("#txtBox1"), metapage.helpForm)
                                        .then(function() {

                                            // nessun cambio all'interno del text
                                            expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                            // cambio del testo all'interno della text
                                            $("#txtBox1").val("Via Verdi, 8");


                                            // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                                            common.pageEventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                                .then(function() {

                                                    appMeta.getData.getPagedTable  = originGetPagedTable;
                                                    expect($("table:first").find("tr").length).toBeGreaterThan(1); // grid dati 11 righe. 1 header + 10 dati
                                                    expect($("table:first").parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale

                                                    var s = stabilize();
                                                    $("table:first").find("tr").eq(2).dblclick();
                                                    return s;
                                                })
                                                .then(function () {
                                                    // nuovo valore scelto dalla lista aperta.
                                                    expect($("#txtBox1").val()).toBe("Via Ettore Ara,6");
                                                    done();
                                                });

                                            metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm);
                                        });
                                });
                        });
                    });
                }, timeout);

            it('AutoChoose is Asynch open a list (getPagedTable() mocked + ds mocked), fills controls after select row in the listManger. registry table',
                function(done) {
                    defLogin.then(function () {
                        var originGetPagedTable = appMeta.getData.getPagedTable;
                        var mainwin = '<div id="metaRoot">' +
                            '<div id="autochoose1" data-tag="AutoChoose.mypiva.anagrafica.StartFilter">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            'registryadress cap: <input type="text" name="registryaddresscap" id="txtBox4" data-tag="registryaddress.cap" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        var primaryTableName= "registry";
                        metapage = new MetaPage(primaryTableName, 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData(primaryTableName);
                        metapage.state = s;
                        metapage.listTop = 0;
                        var filter = null;
                        metapage.registerFilter($("#autochoose1"), filter);

                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                        // serve per simulare il getPagedTable()
                        var dsServer = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistryPaged = dsServer.tables["registry"];
                            appMeta.getData.getPagedTable = function (prm) {
                                tRegistryPaged.orderBy  = function (o) {
                                    return "idreg";
                                };
                                return $.Deferred().resolve(tRegistryPaged).promise();
                            };

                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    // cambio del testo all'interno della text che è una piva
                                    $("#txtBox1").val(common.pIvatoSearch);

                                    // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                                    common.pageEventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                        .then(function() {

                                            appMeta.getData.getPagedTable  = originGetPagedTable;
                                            expect($("table:first").find("tr").length).toBeGreaterThan(0); // grid dati 11 righe. 1 header + 10 dati
                                            expect($("table:first").parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale

                                            var s = stabilize();
                                            $("table:first").find("tr").eq(2).dblclick();
                                            return s;
                                        }).then(function () {

                                        // nuovo valore scelto dalla lista aperta.
                                        expect($("#txtBox1").val()).toBe("01669240028");
                                        expect($("#txtBox2").val()).toBe("M");
                                        expect($("#txtBox3").val()).toBe("sa");
                                        done();
                                    });

                                    metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm);

                                });
                        });
                    });

                }, timeout);

            it('AutoChoose is Asynch open a list (getPagedTable() mocked + ds mocked ), not value found, focus back to control',
                function(done) {
                    defLogin.then(function () {
                        var originGetPagedTable = appMeta.getData.getPagedTable;
                        var mainwin = '<div id="metaRoot">' +
                            '<div id="autochoose1" data-tag="AutoChoose.mypiva.anagrafica.StartFilter">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        metapage = new MetaPage('registry', 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData('registry');
                        metapage.state = s;
                        metapage.listTop = 0;
                        var filter = null;
                        var valueNotExisting = "0101010";
                        metapage.registerFilter($("#autochoose1"), filter);

                        // valorizzo dataset da json locale
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                        // serve per simulare il getPagedTable()
                        var dsServer = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistryPaged = dsServer.tables["registry"];
                            appMeta.getData.getPagedTable = function (prm) {
                                tRegistryPaged.orderBy  = function (o) {
                                    return "idreg";
                                };
                                return $.Deferred().resolve(tRegistryPaged, 1, 10).promise();
                            };

                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    // cambio del testo all'interno della text. Metto valore non esistente
                                    $("#txtBox1").val(valueNotExisting);

                                    // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                                    common.pageEventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                        .then(function() {
                                            appMeta.getData.getPagedTable  = originGetPagedTable;
                                            expect($(".modal").length).toBe(2); // modale della init
                                            // expect($(".modal .modal-body").text()).toContain("La condizione di ricerca impostata era: like(p_iva,"+valueNotExisting+"%) - Nome Elenco: 'anagrafica'.")

                                            var s = stabilize();
                                            s.then(function() {

                                                // non trovo valore, mi aspetto che la stringa rimane quella digitata, la modale sia chiusa e ci sia focus sulla text
                                                expect($("#txtBox1").val()).toBe(valueNotExisting);
                                                expect($(".modal").length).toBe(1);
                                                expect($(document.activeElement)).toEqual($("#txtBox1"));
                                                done();
                                            });
                                            // click sul bottone ok, chiude la message
                                            $(".modal").find("button")[0].click();

                                        })

                                    metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm);

                                });
                        });
                    });
                }, timeout);

            it('AutoChoose is Asynch, one value exist, not open listManager (ds mocked), fill related controls',
                function(done) {

                            defLogin.then(function () {
                                var mainwin = '<div id="metaRoot">' +
                                    '<div id="autochoose1" data-tag="AutoChoose.mypiva.anagrafica.StartFilter">' +
                                    'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        metapage = new MetaPage('registry', 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData('registry');
                        metapage.state = s;
                        // metapage.listTop = 0;
                        var filter = null;
                        var valueExisting = "00000440024";
                        metapage.registerFilter($("#autochoose1"), filter);

                        // valorizzo dataset da json locale
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistry = s.DS.tables["registry"];

                            // metto focus sul controllo
                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    tRegistry.orderBy  = function (o) {
                                        return "idreg";
                                    };

                                    // cambio del testo all'interno della text. Metto valore per cuie siste una sola riga
                                    $("#txtBox1").val(valueExisting);

                                    // con questa configurazione esegue solo fill dei controlli, poichè esiste una sola riga che matcha
                                    metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm)
                                        .then(function() {

                                            expect($(".modal").length).toBe(1);
                                            // trovo valore, mi aspetto che la stringa sia quella digitata, la modale non c'è
                                            // focus non torna sulla text
                                            expect($("#txtBox1").val()).toBe(valueExisting);
                                            expect($("#txtBox2").val()).toBe("M");
                                            expect($("#txtBox3").val()).toBe("sa");
                                            expect($(document.activeElement)).not.toEqual($("#txtBox1"));
                                            done();

                                        })
                                });
                        });
                    });

                }, timeout);

            xit('AutoChoose is Asynch, one value exist with relative row detached, specific messageBox are showed',
                function(done) {
                    defLogin.then(function () {
                        var mainwin = '<div id="metaRoot">' +
                            '<div id="autochoose1" data-tag="AutoChoose.mypiva.anagrafica.StartFilter">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        metapage = new MetaPage('registry', 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData('registry');
                        metapage.state = s;
                        // metapage.listTop = 0;
                        var filter = null;
                        var valueExisting = "00000440024";
                        metapage.registerFilter($("#autochoose1"), filter);

                        // valorizzo dataset da json locale
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistry = s.DS.tables["registry"];

                            //1. metto focus sul controllo
                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    tRegistry.orderBy  = function (o) {
                                        return "idreg";
                                    };

                                    // configuro riga detatched, per coprire altir rami di codice nella Choose() e nei vqri metodi chiamati
                                    var rows = tRegistry.select($q.eq("p_iva", valueExisting));
                                    rows[0].getRow().del();

                                    // 3. cambio del testo all'interno della text. Metto valore per cui esiste una sola riga
                                    $("#txtBox1").val(valueExisting);

                                    // con questa configurazione mi aspetto apra la modale con messaggio opportuno, poichè riga detached
                                    common.pageEventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                        .then(function() {

                                            expect($(".modal").length).toBe(1);
                                            expect($(".modal .modal-body").text()).toContain("Ci sono modifiche ai dati non salvate. Si desidera perdere le modifiche?")

                                            common.pageEventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                                .then(function() {

                                                    expect($(".modal").length).toBe(1);
                                                    expect($(".modal .modal-body").text()).toContain(appMeta.localResource.itemChooseNotSelectable);


                                                    // 4. click sul bottone ok, chiude la message
                                                    $(".modal").find("button")[0].click();

                                                });

                                            var s = stabilize();
                                            // 4. click sul bottone annulla, chiude la message
                                            $(".modal").find("button")[0].click();
                                            return s;
                                        }).then(function () {
                                        done();
                                    })

                                    //2. perdo focus, va in autochoose
                                    metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm);

                                });
                        });
                    });

                }, timeout);

            it('AutoChoose is Asynch open a list (getPagedTable() mocked + ds mocked + notEntityChild), fills controls after select row in the listManger. registry table',
                function(done) {
                    defLogin.then(function () {
                        var originGetPagedTable = appMeta.getData.getPagedTable;
                        var mainwin = '<div id="metaRoot">' +
                            '<div id="autochoose1" data-tag="AutoChoose.mypiva.anagrafica.StartFilter">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        var primaryTableName= "registry";
                        metapage = new MetaPage(primaryTableName, 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData(primaryTableName);
                        metapage.state = s;
                        metapage.listTop = 0;
                        var filter = null;
                        metapage.registerFilter($("#autochoose1"), filter);

                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                        // serve per simulare il getPagedTable()
                        var dsServer = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistryPaged = dsServer.tables["registry"];
                            appMeta.getData.getPagedTable = function (prm) {
                                tRegistryPaged.orderBy  = function (o) {
                                    return "idreg";
                                };
                                return $.Deferred().resolve(tRegistryPaged).promise();
                            };

                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    // cambio del testo all'interno della text che è una piva
                                    $("#txtBox1").val(common.pIvatoSearch);

                                    // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                                    common.eventWaiter(metapage, appMeta.EventEnum.showModalWindow)
                                        .then(function() {

                                            appMeta.getData.getPagedTable  = originGetPagedTable;
                                            expect($("table:first").find("tr").length).toBeGreaterThan(0); // grid dati 11 righe. 1 header + 10 dati
                                            expect($("table:first").parent().parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale

                                            var s = stabilize();
                                            $("table:first").find("tr").eq(2).dblclick();
                                            return s;
                                        }).then(function () {

                                        // nuovo valore scelto dalla lista aperta.
                                        expect($("#txtBox1").val()).toBe("01669240028");
                                        expect($("#txtBox2").val()).toBe("M");
                                        expect($("#txtBox3").val()).toBe("sa");
                                        done();
                                    });

                                    metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm);


                                });
                        });
                    });
                }, timeout);

            it('AutoManage is Asynch (edit() and ds mocked), row not found, back focus to control',
                function(done) {
                    defLogin.then(function () {
                        var mainwin = '<div id="metaRoot">' +
                            '<div id="automanage1" data-tag="AutoManage.mypiva.anagrafica.StartFilter">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender" value="M"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        var primaryTableName= "registry";
                        metapage = new MetaPage(primaryTableName, 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData(primaryTableName);
                        metapage.state = s;
                        metapage.listTop = 0;
                        var filter = null;
                        metapage.registerFilter($("#automanage1"), filter);

                        // override funz edit, per aprire form modale dove seleziono riga
                        metapage.edit = function () {
                            return $.Deferred().resolve(null).promise();
                        };

                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistry = s.DS.tables["registry"];

                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    // cambio del testo all'interno della text che è una piva
                                    $("#txtBox1").val(common.pIvatoSearch);

                                    // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                                    metapage.helpForm.textBoxLostFocus.call( $("#txtBox1"), metapage.helpForm)
                                        .then(function() {
                                            // non trovo valore, mi aspetto che la stringa rimane quella digitata, la modale sia chiusa e ci sia focus sulla text
                                            expect($("#txtBox1").val()).toBe(common.pIvatoSearch);
                                            expect($(document.activeElement)).toEqual($("#txtBox1"));
                                            done();
                                        })

                                });
                        });
                    });
                }, timeout);

            it("SELECT - Combo master with combo child, fillcontrol is Async",
                function(done) {
                    defLogin.then(function () {
                        var mainwin = '<div id="rootelement">' +
                            '<select id="combomaster" data-tag="dmaster.c_codice"  data-source-name="dmaster" data-value-member="c_codice"  data-display-member="c_name">' +
                            '</select><BR>' +
                            '<select id="combo4" data-tag="datasource.c_codice" data-master="dmaster" data-source-name="datasource" data-value-member="c_codice"  data-display-member="c_field2">' +
                            '</select>' +
                            '</div>';
                        $("html").html(mainwin);

                        var state = new appMeta.MetaPageState();
                        var ds = new jsDataSet.DataSet("temp");
                        var dmaster = ds.newTable("dmaster");
                        dmaster.isTemporaryTable = true;
                        dmaster.insertFilter = $q.eq("c_codice", "3");
                        dmaster.searchFilter = null;

                        // colonne per il datasource
                        dmaster.setDataColumn("c_codice", "Decimal");
                        dmaster.setDataColumn("c_name", "String");
                        dmaster.key("c_codice")
                        var objrow1 = { "c_codice": 1, "c_name": "nome1" };
                        var objrow2 = { "c_codice": 2, "c_name": "nome2" };
                        dmaster.add(objrow1);
                        dmaster.add(objrow2);
                        dmaster.acceptChanges();

                        var datasource = ds.newTable("datasource");
                        datasource.isTemporaryTable = true;
                        //datasource.insertFilter = q.eq(cCodice, "3");
                        //datasource.searchFilter = null;

                        var cCodice = "c_codice";
                        var cField1 = "c_field1";
                        var cField2 = "c_field2";
                        // colonne per il datasource
                        datasource.setDataColumn(cCodice, "Decimal");
                        datasource.setDataColumn(cField1, "String");
                        datasource.setDataColumn(cField2, "String");
                        var objrow3 = { c_codice: 1, c_field1: "uno", c_field2: "f2_1" };
                        var objrow4 = { c_codice: 2, c_field1: "due", c_field2: "f2_2" };
                        var objrow5 = { c_codice: 3, c_field1: "tre", c_field2: "f2_3" };
                        var objrow6 = { c_codice: 4, c_field1: "quattro", c_field2: "f2_4" };
                        datasource.add(objrow3);
                        datasource.add(objrow4);
                        datasource.add(objrow5);
                        datasource.add(objrow6);
                        datasource.acceptChanges();
                        ds.newRelation("r1", "dmaster", ["c_codice"], "datasource", ["c_codice"]);

                        state.DS = ds;
                        appMeta.getData.model =   window.appMeta.metaModel;
                        var metapage = new appMeta.MetaPage('dmaster', 'def', false);
                        metapage.state = state;
                        var helpForm = new appMeta.HelpForm(state, "dmaster", "#rootelement");
                        metapage.helpForm = helpForm;
                        helpForm.lastSelected(dmaster, objrow1);
                        helpForm.preScanControls();
                        helpForm.addEvents(metapage);
                        var s  = stabilize();
                        helpForm.fillControls();
                        s.then(function() {
                            // TODO capire meglio
                            expect($("#combomaster").val()).toBe("1");
                            done();
                        });
                    });
                }, timeout);

            xit('AutoManage is Asynch open a modal form (ds mocked), row found, form control are filled',
                function(done) {
                    defLogin.then(function () {
                        // inizializzo per ogni test l'oggetto appMeta
                        window.appMeta.basePath = 'base/test/spec_e2e/';

                        var mainwin = '<div id="metaRoot">' +
                            '<div id="automanage1" data-tag="AutoManage.mypiva.anagrafica.StartFilter">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.p_iva"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender" value="M"><br>' +
                            '</div>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        var primaryTableName= "registry";
                        metapage = new MetaPage(primaryTableName, 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData(primaryTableName);
                        metapage.state = s;
                        metapage.listTop = 0;
                        var filter = null;

                        // TODO conf su appMeta. capire chi li deve fare
                        appMeta.currApp.currentMetaPage = metapage;
                        appMeta.currApp.rootElement = "#metaRoot";

                        metapage.registerFilter($("#automanage1"), filter);

                        // recupero mock del dataset
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();

                        metapage.init().then(function (result) {
                            metapage.helpForm.preScanControls();
                            metapage.helpForm.addEvents(metapage);
                            metapage.state.DS = ds;
                            metapage.helpForm.DS = ds;

                            var tRegistry = s.DS.tables["registry"];


                            return metapage.helpForm.textBoxGotFocus.call($("#txtBox1"), metapage.helpForm)
                                .then(function() {

                                    expect(metapage.helpForm.lastValidText()).toBe("txtBox1#");

                                    // cambio del testo all'interno della text che è una piva
                                    $("#txtBox1").val(common.pIvatoSearch);

                                    /* common.pageEventWaiter(metapage, appMeta.EventEnum.metaPageActivate)
                                     .then(function () {
                                     // expect($("button").parent().hasClass("modal-body")).toBe(true); // griglia dati ospitata sulla modale

                                     // premo bottone di selezione
                                     var s = stabilize();
                                     $("#btn_select_id").click();
                                     return s;

                                     }).then(function () {
                                     expect($("#txtBox1").val()).toBe("01669240028");
                                     expect($("#txtBox2").val()).toBe("M");

                                     done();
                                     });*/

                                    // con questa configurazione mi aspetto apra la modale con la lista di opzioni da scegliere
                                    metapage.helpForm.textBoxLostFocus.call($("#txtBox1"), metapage.helpForm);

                                });
                        });
                    });
                }, timeout);

            xit('1. GeDataSet mocked 2. FillControl() 3. GetControls 4. and save data on Database',
                function(done) {
                    defLogin.then(function () {
                        var mainwin = '<div id="metaRoot">' +
                            'idreg: <input type="text" name="mypiva" id="txtBox1" data-tag="registry.idreg"><br>' +
                            'gender: <input type="text" name="mygender" id="txtBox2" data-tag="registry.gender"><br>' +
                            'registry cu: <input type="text" name="registrycu" id="txtBox3" data-tag="registry.cu" value="init"><br>' +
                            'registryaddress idreg: <input type="text" name="registryaddressidreg" id="txtBox4" data-tag="registryaddress.idreg"><br>' +
                            'registryaddress lu: <input type="text" name="registryaddresslu" id="txtBox5" data-tag="registryaddress.lu"><br>' +
                            'registryaddress address: <input type="text" name="registryaddressaddress" id="txtBox6" data-tag="registryaddress.address"><br>' +
                            'registryaddress start: <input type="date" name="registryaddressstart" id="txtBox7" data-tag="registryaddress.start.dd"><br>' +
                            'annotation: <input type="text" name="annotation" id="txtBox8" data-tag="registry.annotation"><br>' +
                            '</div>';
                        $("html").html(mainwin);
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
                        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
                        metapage = new MetaPage('registry', 'anagrafica', false);
                        var s = new appMeta.MetaPageState();
                        s.meta  = new appMeta.MetaData('registry');
                        metapage.state = s;
                        // valorizzo dataset da json locale
                        var ds = appMeta.common.getRegistryAnagraficaMockDataSetFilled();
                        // per eseigenza del test, tolgio 2 righe, così la tab registryaddress ha solo una riga filgia
                        ds.tables.registryaddress.rows[0].getRow().del();
                        ds.tables.registryaddress.rows[1].getRow().del();
                        ds.acceptChanges();
                        metapage.state.DS = ds;

                        var initOriginal =  metapage.init;
                        metapage.init = function () {
                            var def = appMeta.Deferred("init");
                            //Helpform is created when the page is inited
                            this.helpForm = new appMeta.HelpForm(this.state, this.primaryTableName, this.rootElement);
                            this.inited = true;
                            return def.resolve().promise();
                        },

                            metapage.init().then(function (result) {

                                metapage.helpForm.preScanControls();
                                metapage.helpForm.addEvents(metapage);
                                // riga 0, cioè idreg=1, così ho i record sulle altre tabelle nel ds mockato
                                metapage.helpForm.lastSelected( metapage.helpForm.primaryTable,  metapage.helpForm.primaryTable.rows[0]);
                                metapage.helpForm.fillControls()
                                    .then(function () {
                                        expect($("#txtBox1").val()).toBe("1");
                                        expect($("#txtBox2").val()).toBe("M");
                                        expect($("#txtBox3").val()).toBe("sa");
                                        expect($("#txtBox4").val()).toBe("1");
                                        expect($("#txtBox5").val()).toBe("SARA");
                                        expect($("#txtBox6").val()).toBe("aaf");
                                        expect($("#txtBox7").val()).toBe("2007-10-30");

                                        var annotationNewValue = "myannotation" + (new Date().toLocaleString());
                                        // Modifico valore
                                        $("#txtBox8").val(annotationNewValue);

                                        metapage.helpForm.getControls();

                                        var field = "annotation";
                                        expect(metapage.helpForm.primaryTable.rows[0][field]).toBe(annotationNewValue);
                                        metapage.init = initOriginal;
                                        done();
                                        // metapage.helpForm.primaryTable.rows[0].getRow().state  = jsDataSet.dataRowState.modified;

                                        // chiamo emtodo server
                                        /*appMeta.getData.saveDataSet(metapage.helpForm.pageState.DS)
                                         .then(function (dsTarget2) {

                                         expect((dsTarget2!==false)).toBe(true);

                                         // verifico che tornino dei dati
                                         var tRegistry = dsTarget2.tables["registry"];

                                         // verifico almeno 1 riga, altrimenti test non è attendibile
                                         expect(tRegistry.rows.length).toBeGreaterThan(0);

                                         // mi aspetto che il valore sia cambaito
                                         expect(tRegistry.rows[0][field]).toBe(annotationNewValue);

                                         // rimetto null
                                         tRegistry.rows[0][field] = null;
                                         tRegistry.rows[0].getRow().state  = jsDataSet.dataRowState.modified;

                                         appMeta.getData.saveDataSet(dsTarget2)
                                         .then(function (dsTarget3) {
                                         // mi aspetto che il valore sia cambaito
                                         expect(dsTarget3.tables["registry"].rows[0][field]).toBe(null);
                                         done();
                                         })


                                         });*/
                                    })

                            });

                    }, timeout);

                });
        });
});
