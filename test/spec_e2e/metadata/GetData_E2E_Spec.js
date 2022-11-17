'use strict';

describe('GetData', function () {
    var getData;
    var conn;
    var ds;
    var model = appMeta.metaModel;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var $q = window.jsDataQuery;
    var methodEnum = appMeta.routing.methodEnum;
    var timeout  = 40000;
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
        appMeta.common.buildDs1();
        conn = appMeta.connection;
        ds = appMeta.common.ds1;
        getData = appMeta.getData;

        appMeta.basePath = "base/";
        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
    });

    afterEach(function () {
    });

    describe("Test methods that returns DB data from server",
        function() {

            var spec1 = it('1. getDataSet empty from server, 2. invoke preFillDataSet on one table 3. ds should be correctly formatted and filled',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                        conn.call(objConn)
                            .then(function(res) {
                                    logger.log(logType.INFO, "Tornato ds vuoto");

                                    var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    // setto le tab cached
                                    model.cachedTable(ds1.tables["registryaddress"], true);

                                    var cond2 = $q.eq($q.field("address"), "aaf");
                                    ds1.tables["registryaddress"].staticFilter(cond2);
                                    // N.B la tab registryreference e registry non inserisco nel dic. quindi non voglio caricare i dati

                                    appMeta.getData.prefillDataSet(ds1, "registry", "anagrafica")
                                        .then(function(dsTarget) {
                                                logger.log(logType.INFO, "Tornati i dati della prefill");

                                                expect(dsTarget.name).toBe("registry_anagrafica");

                                                // verifico coerenza dei dati rispetto al filtro
                                                var tRegistryAddress = dsTarget.tables["registryaddress"];
                                                if (tRegistryAddress.rows.length === 0) {
                                                    logger.log(logType.ERROR,
                                                        "Non sono tornate righe, il test '" +
                                                        spec1.description +
                                                        "' non è Attendibile con questi dati");
                                                }
                                                _.forEach(tRegistryAddress.rows,
                                                    function(r) {
                                                        expect(r.address.toUpperCase()).toBe("aaf".toUpperCase());
                                                    });

                                                // non hanno dati
                                                var tRegistry = ds1.tables["registry"];
                                                expect(tRegistry.rows.length).toBe(0);

                                                var tRegistryReference = dsTarget.tables["registryreference"];
                                                expect(tRegistryReference.rows.length).toBe(0);

                                                logger.log(logType.INFO, "fine test prefill");
                                                done();

                                            },
                                            function(err) {
                                                logger.log(logType.ERROR, err);
                                                expect(1).toBe(0);
                                            }
                                        );


                                }
                            )
                            ,
                            function(err) {
                                logger.log(logType.ERROR, err);
                                expect(1).toBe(0);
                            }
                    });
                }, timeout);

            var spec2 = it('1. getDataSet empty from server, 2. invoke preFillDataSet on two tables 3. ds should be correctly formatted and filled',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName: "registry", editType: "anagrafica"}
                        };
                        logger.log(logType.INFO, "Chiedo ds vuoto")

                        // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                        conn.call(objConn)
                            .then(function(res) {
                                    logger.log(logType.INFO, "Tornato ds vuoto");
                                    var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                    appMeta.getData.model = appMeta.metaModel;
                                    // setto le tab cached
                                    model.cachedTable(ds1.tables["registryaddress"], true);
                                    model.cachedTable(ds1.tables["registry"], true);

                                    // imposto 2 filtri
                                    var cond1 = $q.and($q.eq($q.field("cu"), "sa"),$q.isNotNull("birthdate"),$q.isNotNull("annotation"));
                                    var cond2 = $q.eq($q.field("address"), "aaf");
                                    ds1.tables["registry"].staticFilter(cond1);
                                    ds1.tables["registryaddress"].staticFilter(cond2);
                                    // N.B la tab registryreference è l'unica che non inserisco nel dic. quindi non voglio caricare i dati

                                    appMeta.getData.prefillDataSet(ds1, "registry", "anagrafica")
                                        .then(function(dsTarget) {
                                                logger.log(logType.INFO, "Tornati i dati della prefill");

                                                expect(dsTarget.name).toBe("registry_anagrafica");

                                                // verifico coerenza dei dati rispetto al filtro
                                                var tRegistry = ds1.tables["registry"];
                                                if (tRegistry.rows.length === 0) {
                                                    logger.log(logType.ERROR,
                                                        "Non sono tornate righe, il test '" +
                                                        spec2.description +
                                                        "' non è Attendibile con questi dati");
                                                }
                                                expect(tRegistry.rows.length).toBe(5);
                                                logger.log(logType.INFO, "rows registry: " + tRegistry.rows.length);
                                                _.forEach(tRegistry.rows,
                                                    function(r) {
                                                        expect(r.cu.toUpperCase()).toBe("sa".toUpperCase());
                                                        expect(r.annotation).not.toBeNull();
                                                        expect(r.birthdate).not.toBeNull();
                                                    });

                                                // verifico coerenza dei dati rispetto al filtro
                                                var tRegistryAddress = dsTarget.tables["registryaddress"];
                                                if (tRegistryAddress.rows.length === 0) {
                                                    logger.log(logType.ERROR,
                                                        "Non sono tornate righe, il test '" +
                                                        spec2.description +
                                                        "' non è Attendibile con questi dati");
                                                }

                                                expect(tRegistryAddress.rows.length).toBe(5);
                                                _.forEach(tRegistryAddress.rows,
                                                    function(r) {
                                                        expect(r.address.toUpperCase()).toBe("aaf".toUpperCase());
                                                    })

                                                // è l'unica di cui non avevo chiesto i dati
                                                var tRegistryReference = dsTarget.tables["registryreference"];
                                                expect(tRegistryReference.rows.length).toBe(0);
                                                logger.log(logType.INFO, "fine test prefill");
                                                done();

                                            },
                                            function(err) {
                                                logger.log(logType.ERROR, err);
                                                expect(1).toBe(0);
                                            }
                                        )
                                },
                                function(err) {
                                    logger.log(logType.ERROR, err);
                                    expect(1).toBe(0);
                                })
                    });
                }, timeout);

            var spec3 = it('1. getDataSet empty from server, 2. invoke FillDataSet filtered on idreg=1 3. ds should be correctly formatted and filled',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                        conn.call(objConn)
                            .then(function (res) {

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    // imposto filtro sulla chiave
                                    var filter =  $q.eq($q.field("idreg"), 1);
                                    // var filter =  $q.and($q.eq($q.field("cu"), "sa"), $q.isNull($q.field("rtf")));
                                    appMeta.getData.fillDataSet(ds1, "registry", "anagrafica", filter )
                                        .then(function (dsTarget) {

                                                expect(dsTarget.name).toBe("registry_anagrafica");

                                                // verifico che tornino dei dati
                                                var tRegistry = dsTarget.tables["registry"];
                                                var tRegistryAddress = dsTarget.tables["registryaddress"];
                                                var tRegistryReference = dsTarget.tables["registryreference"];

                                                // verifico almeno 1 riga, altrimenti test non è attendibile
                                                expect(tRegistry.rows.length).toBeGreaterThan(0);
                                                expect(tRegistryAddress.rows.length).toBeGreaterThan(0);
                                                expect(tRegistryReference.rows.length).toBeGreaterThan(0);

                                                // tutte le righe devono essere filtrate su idreg =1
                                                _.forEach(tRegistry.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });
                                                _.forEach(tRegistryAddress.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });
                                                _.forEach(tRegistryReference.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });

                                                done();

                                            } ,
                                            function(err) {
                                                logger.log(logType.ERROR, err);
                                                expect(1).toBe(0);
                                            })
                                } ,
                                function(err) {
                                    logger.log(logType.ERROR, err);
                                    expect(1).toBe(0);
                                })
                    });
                }, timeout);

            it('Method multiRunSelect: 1. Builds array with selectBuilder; 2. Launches multiRunSelect, tables contains correct num of rows',
                function(done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"},
                            noLogError:true
                        };
                        var ds1MultiRunSelect;
                        // 1. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {

                                ds1MultiRunSelect = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // costrusico selBuilderArray
                                var selBuilderArray = new Array();
                                selBuilderArray.push({ filter: $q.eq("lu", "sa"), top: 300, tableName: "registryreference", table: ds1MultiRunSelect.tables['registryreference']});
                                selBuilderArray.push({ filter: $q.eq("cu", "assistenza"), top: 100, tableName: "registry", table: ds1MultiRunSelect.tables['registry']});
                                selBuilderArray.push({ filter: $q.and($q.eq("cap", 13100),$q.eq("lu", "Vercelli")) , top: 100, tableName: "registryaddress", table: ds1MultiRunSelect.tables['registryaddress']});

                                console.log("START " + logger.getTime());

                                getData.multiRunSelect(selBuilderArray)
                                    .then(
                                        function () {
                                            expect(ds1MultiRunSelect.tables["registry"].rows.length).toBeGreaterThan(0);
                                            expect(ds1MultiRunSelect.tables["registryaddress"].rows.length).toBeGreaterThan(0);
                                            expect(ds1MultiRunSelect.tables["registryreference"].rows.length).toBeGreaterThan(0);
                                            console.log("FINISH " + logger.getTime());
                                            done();
                                        })
                                    .fail(
                                        function (err) {
                                            logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                            expect(false).toBe(true);
                                            done();
                                        });
                            });
                    });
                }, timeout);

            it('Method doGetTable: 1. getDataSet empty from server, 2. Launch method doGetTable, with selectList parameter empty, table correctly populated and calculated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // imposto dei filtri, per entrare nei vari rami del codice
                                var t = ds.tables['registry'];
                                t.staticFilter($q.eq('lu','sa'));
                                var filter = $q.and($q.eq('active','N'),$q.eq('gender','F'));
                                var selectList = undefined;

                                // Configurazione per campi calcolati
                                t.calculatingListing = "listType";
                                t.calculateFunction = function (r, listType) {
                                    if (listType === "listType"){
                                        r["gender"] = r["gender"] + "F";
                                    }
                                };

                                getData.doGetTable(t, filter, true, 10, selectList)
                                    .then(function () {
                                        expect(t.name).toBe("registry");
                                        expect(t.rows.length).toBeGreaterThan(0);

                                        // testo se ha fatto la getTemporaryValues
                                        _.forEach(t.rows,
                                            function(r) {
                                                expect(r.gender).toBe("FF"); // trasformato dalla calculateFunction
                                                expect(r.lu).toBe("sa");
                                                expect(r.active).toBe("N");
                                            });
                                        done();
                                    });
                            });
                    });

                }, timeout);

            it('Method doGetTable: 1. getDataSet empty from server, 2. Launch method doGetTable, with selectList parameter NOT empty, table correctly populated and calculated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // imposto dei filtri, per entrare nei vari rami del codice
                                var t = ds.tables['registry'];
                                t.staticFilter($q.eq('lu','sa'));
                                var filter = $q.and($q.eq('active','N'),$q.eq('gender','F'));
                                var composedFilter = $q.and(filter,t.staticFilter());
                                var selectList = [];
                                var mySel = {
                                    filter: $q.eq("forename", "Sabrina"),
                                    top: 10,
                                    tableName: "registry",
                                    table: t
                                };
                                selectList.push(mySel);

                                // Configurazione per campi calcolati
                                t.calculatingListing = "listType";
                                t.calculateFunction = function (r, listType) {
                                    if (listType === "listType"){
                                        r["gender"] = r["gender"] + "F";
                                    }
                                };

                                getData.doGetTable(t, filter, true, 10, selectList)
                                    .then(function () {
                                        expect(selectList.length).toBeGreaterThan(1);
                                        expect(selectList[0]).toBe(mySel);
                                        expect(appMeta.getDataUtils.getJsonFromJsDataQuery(selectList[1].filter))
                                            .toBe(appMeta.getDataUtils.getJsonFromJsDataQuery(composedFilter));
                                        expect(t.rows.length).toBe(0); // selectList è definito quindi non esegue la runSelectIntoTable
                                        // expect(t.rows.length).toBeLessThan(21);
                                        done();
                                    });
                            });
                    });

                }, timeout);

            it('Method readCached: 1. getDataSet empty from server, 2. Launch method readCached, tables cached correctly populated and calculated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // imposto dei filtri, per entrare nei vari rami del codice
                                var tRegistry = ds.tables['registry'];
                                var tRegistryAddress = ds.tables['registryaddress'];
                                var tRegistryReference = ds.tables['registryreference'];

                                tRegistry.staticFilter($q.eq('lu','sa'));
                                tRegistryAddress.staticFilter($q.and($q.eq("cap", 13100),$q.eq("lu", "Vercelli")));

                                // Configurazione per campi calcolati
                                tRegistry.calculatingListing = "listType";
                                tRegistry.calculateFunction = function (r, listType) {
                                    if (listType === "listType"){
                                        r["gender"] = r["gender"] + "F";
                                    }
                                };

                                model.cachedTable(tRegistryAddress, true);
                                model.cachedTable(tRegistry, true);

                                getData.readCached(ds)
                                    .then(function () {
                                        expect(ds.name).toBe("registry_anagrafica");
                                        expect(tRegistry.rows.length).toBeGreaterThan(0);
                                        expect(tRegistryAddress.rows.length).toBeGreaterThan(0);
                                        expect(tRegistryReference.rows.length).toBe(0); // Non è cachata quindi non la leggo
                                        done();
                                    });
                            });
                    });
                }, timeout);

            it('getDsByRowKey() is ASYNC builds a correct filter given a dataRow, and returns a dataset filtered on dataRow key value',
                function (done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                var idRegInput = 3;
                                // imposto dei filtri, per entrare nei vari rami del codice
                                var t = ds.tables['registry'];

                                var objrow1 = { idreg: idRegInput};

                                t.add(objrow1);

                                getData.getDsByRowKey(t.rows[0].getRow(), t, 'anagrafica')
                                    .then(function () {
                                        var ds = t.dataset;
                                        // verifico che tornino dei dati
                                        var tRegistry = ds.tables["registry"];
                                        var tRegistryAddress = ds.tables["registryaddress"];
                                        var tRegistryReference = ds.tables["registryreference"];

                                        // verifico almeno 1 riga, altrimenti test non è attendibile
                                        expect(tRegistry.rows.length).toBe(1); // sulla chaive , mia spetto una riga
                                        expect(tRegistryAddress.rows.length).toBeGreaterThan(0);
                                        expect(tRegistryReference.rows.length).toBeGreaterThan(0);

                                        // tutte le righe devono essere filtrate su idreg =1
                                        _.forEach(tRegistry.rows,function (r) {
                                            expect(r.idreg).toBe(idRegInput);
                                        });
                                        _.forEach(tRegistryAddress.rows,function (r) {
                                            expect(r.idreg).toBe(idRegInput);
                                        });
                                        _.forEach(tRegistryReference.rows,function (r) {
                                            expect(r.idreg).toBe(idRegInput);
                                        });

                                        done();
                                    });
                            })
                    });
                }, timeout);

            it('createTableByName() is ASYNC returns an empty dataTable, columnList = "*"',
                function (done) {
                    defLogin.then(function () {
                        getData.createTableByName('registry', '*')
                            .then(function (dt) {
                                expect(dt.name).toBe("registry");
                                expect(dt.rows.length).toBe(0);
                                expect(Object.keys(dt.columns).length).toBeGreaterThan(0); // ci sono colonne
                                done();
                            });
                    });
                }, timeout);

            it('createTableByName() is ASYNC returns an empty dataTable, columnList ="idreg,active"',
                function (done) {
                    defLogin.then(function () {
                        getData.createTableByName('registry', 'idreg,active')
                            .then(function (dt) {
                                expect(dt.name).toBe("registry");
                                expect(dt.rows.length).toBe(0);
                                expect( Object.keys(dt.columns).length).toBe(2); // 2 colonne attese
                                done();
                            });
                    });
                }, timeout);

            it('runSelect() is ASYNC , columnList ="idreg,active,cu", returns dataTable, filter on "cu" top=15',
                function (done) {
                    defLogin.then(function () {
                        var columnList = "idreg,active,cu";
                        var top = 15;
                        var filter = $q.eq($q.field("cu"), "sa");
                        getData.runSelect('registry', columnList, filter, top)
                            .then(function (dt) {
                                expect(dt.name).toBe("registry");
                                expect(dt.rows.length).toBe(top); // verifico ci siano 1 riga, poichè filyro su idreg e le colonne
                                expect( Object.keys(dt.columns).length).toBe(3);
                                // tutte le righe devono essere filtrate su idreg =1
                                _.forEach(dt.rows,function (r) {
                                    expect(r.cu).toBe("sa");
                                });
                                done();
                            });
                    });
                }, timeout);

            it('selectCount() is ASYNC returns an integer, table registry, filtered on "cu" field',
                function(done) {
                    defLogin.then(function () {
                        var filter = $q.eq($q.field("cu"), "assistenza");
                        var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);
                        getData.selectCount("registry", filterSerialized).then(function (res) {
                                // verifico torni un count, non posso utilizzare un count preciso, perchè il db potrebbe cambiare
                                expect(typeof res).toBe("number");
                                expect(res).toBeGreaterThan(-1);

                                logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);
                                done();
                            },
                            function(err) {
                                expect(true).toBe(false);
                                done();
                            })
                    });
                }, timeout);

            it('Method getRowsByFilter() is ASYNC: 1. getDataSet empty from server, 2. Launch method getRowsByFilter, with selectList parameter null, table correctly populated and calculated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // imposto dei filtri, per entrare nei vari rami del codice
                                var t = ds.tables['registry'];

                                expect(t.rows.length).toBe(0); // all'inizio è vuota

                                t.staticFilter($q.eq('lu','sa'));
                                var filter = $q.and($q.eq('active','N'), $q.eq('gender','F'));
                                var selectList = undefined;

                                getData.getRowsByFilter(filter, null, t, 10, null, selectList)
                                    .then(function () {
                                        expect(t.name).toBe("registry");
                                        expect(t.rows.length).toBeGreaterThan(0); // ci sono righe

                                        // testo i valori filtrati correttamente
                                        _.forEach(t.rows,
                                            function(r) {
                                                expect(r.gender).toBe("F");
                                                expect(r.lu).toBe("sa");
                                                expect(r.active).toBe("N");
                                            });
                                        done();
                                    });
                            });
                    });

                }, timeout);

            it('Method doGet is ASYNC: 1. getDataSet empty from server; 2.fillDataSet; 3. Launch method doGet, tables correctly populated and calculated',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                var filter =  $q.eq($q.field("idreg"), 1);

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {
                                        // n.B qui mi torna tre righe su tabella registryaddress
                                        // imposto dei filtri, per entrare nei vari rami del codice

                                        getData.doGet(dsTarget, dsTarget.tables.registryaddress.rows[0].getRow(), "registry", false)
                                            .then(function () {

                                                // verifico che tornino dei dati
                                                var tRegistry = dsTarget.tables["registry"];
                                                var tRegistryAddress = dsTarget.tables["registryaddress"];
                                                var tRegistryReference = dsTarget.tables["registryreference"];
                                                // verifico almeno 1 riga, altrimenti test non è attendibile
                                                expect(tRegistry.rows.length).toBeGreaterThan(0);
                                                expect(tRegistryAddress.rows.length).toBeGreaterThan(0);
                                                expect(tRegistryReference.rows.length).toBeGreaterThan(0);

                                                // tutte le righe devono essere filtrate su idreg =1
                                                _.forEach(tRegistry.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });
                                                _.forEach(tRegistryAddress.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });
                                                _.forEach(tRegistryReference.rows,function (r) {
                                                    expect(r.idreg).toBe(1);
                                                });
                                                done();
                                            });
                                    });
                            });

                    });
                }, timeout);

            it('Method doGet is ASYNC: 1. getDataSet empty from server; 2.fillDataSet; 3. Launch method doGet, with null, null for filterTableName e filter',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                var filter =  $q.eq($q.field("idreg"), 1);

                                appMeta.getData.fillDataSet(ds, "registry", "anagrafica", filter )
                                    .then(function (dsTarget) {

                                        getData.doGet(dsTarget, null, "registry", false)
                                            .then(function (ds) {
                                                // verifico che tornino dei dati
                                                var tRegistry = ds.tables["registry"];
                                                var tRegistryAddress = ds.tables["registryaddress"];
                                                var tRegistryReference = ds.tables["registryreference"];
                                                // verifico almeno 1 riga, altrimenti test non è attendibile
                                                expect(tRegistry.rows.length).toBeGreaterThan(0);
                                                expect(tRegistryAddress.rows.length).toBeGreaterThan(0);
                                                expect(tRegistryReference.rows.length).toBeGreaterThan(0);
                                                done();
                                            });
                                    });

                            });
                    });
                }, timeout);

            it('send mail: multiple user',
                function(done) {
                    defLogin.then(function () {
                        //  ---> inserire mail vere se si testa

                        var emails = ['mail1@a.it','mail2@a.it'];
                        var emailDest = emails.join(';');
                        var body = "mail di test body";
                        var subject = "subject mail di test";

                        appMeta.authManager.sendMail(emailDest, subject, body).then(
                            function (res) {
                                expect(res).toBe(true);
                            })
                    })
                }, timeout);

            it('getByKey() is ASYNC; 1. getDataSet empty from server; 2. returns dataRow on entityTable on row key values',
                function (done) {
                    defLogin.then(function () {
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                var idRegInput = 3;
                                // imposto dei filtri, per entrare nei vari rami del codice
                                var registry = ds.tables['registry'];
                                var registryaddress = ds.tables['registryaddress'];
                                var objrow1 = { idreg: idRegInput};

                                registryaddress.add(objrow1);

                                getData.getByKey(registry, objrow1.getRow())
                                    .then(function (row) {
                                        // verifico almeno 1 riga, altrimenti test non è attendibile
                                        expect(row.table.name).toBe("registry");
                                        expect(row.current.idreg).toBe(idRegInput);
                                        done();
                                    });
                            })
                    });
                }, timeout);

            it('Method doGetTable: 1. getDataSet empty from server, 2. Launch method doGetTable 3. Invoke table.newRow() -> new row is added to table',
                function(done) {
                    defLogin.then(function () {
                        appMeta.getData.model = appMeta.metaModel;
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"anagrafica"}
                        };

                        // 1. recupero ds vuoto
                        conn.call(objConn)
                            .then(function(res) {
                                // recupero ds vuoto
                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // imposto dei filtri, per entrare nei vari rami del codice
                                var t = ds.tables['registry'];
                                t.staticFilter($q.eq('lu','sa'));
                                var filter = $q.and($q.eq('active','N'),$q.eq('gender','F'));
                                var selectList = undefined;

                                getData.doGetTable(t, filter, true, 10, selectList)
                                    .then(function () {
                                        expect(t.name).toBe("registry");
                                        var countRows = t.rows.length;
                                        expect(countRows).toBeGreaterThan(0);
                                        var newRow = t.newRow();
                                        expect(newRow).toBeDefined();
                                        expect( t.rows.length).toBe(countRows + 1);
                                        done();
                                    });
                            });
                    });

                }, timeout);

            it('getPagedTable() is ASYNC returns a dataTable',
                function (done) {
                    defLogin.then(function () {
                        var filter = $q.and($q.eq('active','N'),$q.eq('gender','F'));

                        getData.getPagedTable('registry',2, 10, filter, "default" )
                            .then(function (dt, totpage, totrows) {
                                // expect(dt.name).toBe("registry");
                                expect(dt.rows.length).toBe(10);
                                expect(totpage).toBeGreaterThan(10);
                                expect(totrows).toBeGreaterThan(100);
                                done();
                            });
                    });
                }, timeout);

        });
});
