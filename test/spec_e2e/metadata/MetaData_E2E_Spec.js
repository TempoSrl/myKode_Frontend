'use strict';

describe('MetaData', function () {
    var metaData;
    var conn;
    var ds;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var $q = window.jsDataQuery;
    var methodEnum = appMeta.routing.methodEnum;
    var timeout  = 60000;

    let defLogin;
    // effettuo login
    beforeAll(function () {
        appMeta.basePath = "base/";
        appMeta.serviceBasePath = "/"; // path relativo dove si trovano i servizi
        appMeta.globalEventManager = new appMeta.EventManager();
        appMeta.localResource.setLanguage("it");
        appMeta.logger.setLanguage(appMeta.LocalResource);

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
        metaData = new appMeta.MetaData("table2");

        appMeta.basePath = "base/";
        $("body").append('<link rel="stylesheet" href="base/test/app/styles/bootstrap/css/bootstrap.css" />');
        $("body").append('<link rel="stylesheet" href="base/test/app/styles/app.css" />');
    });


    afterEach(function () {
        expect(appMeta.Stabilizer.nesting).toBe(0);
    });

    describe("Test methods that returns DB data from server",
        function() {

            it('1. getDataSet empty from server, 2. invoke FillDataSet filtered on idreg=1 3.getNewRow() on child table -> row is created ',
                function(done) {
                    defLogin.then(function () {
                        var editType = "anagrafica";
                        //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:editType}
                        };

                        // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                        conn.call(objConn)
                            .then(function (res) {

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    // imposto filtro sulla chiave
                                    var filter =  $q.eq($q.field("idreg"), 1);

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

                                                var tChild = tRegistryAddress;
                                                var tParent = tRegistry;
                                                var rowsCount = tChild.rows.length;
                                                metaData.getNewRow(tParent.rows[0].getRow(), tChild, editType)
                                                    .then(function (row) {
                                                        expect(row).toBeDefined();
                                                        expect(row.current.idreg).toBe(tParent.rows[0].getRow().current.idreg);
                                                        expect(tChild.rows.length).toBe(rowsCount + 1); // riga aggiunta
                                                        expect(row.current.active).toBe("S");
                                                        expect(row.current.lu).toBe("-");
                                                        done();
                                                    });


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
                    })
                }, timeout);

            it('1. getDataSet empty from server, 2. invoke FillDataSet filtered on idreg=1 3.getNewRow() on registry table ',
                function (done) {
                    var editType = "anagrafica";
                    //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                    var objConn = {
                        method: methodEnum.getDataSet,
                        prm: { tableName: "registry", editType: editType }
                    };
                    defLogin.then(function () {
                        // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                        conn.call(objConn)
                            .then(function (res) {

                                var ds1 = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                // imposto filtro sulla chiave
                                var filter = $q.eq($q.field("idreg"), 1);

                                appMeta.getData.fillDataSet(ds1, "registry", "anagrafica", filter)
                                    .then(function (dsTarget) {

                                        expect(dsTarget.name).toBe("registry_anagrafica");
                                        // verifico che tornino dei dati
                                        var tRegistry = dsTarget.tables["registry"];
                                        var tChild = dsTarget.tables["registryreference"];
                                        let metaRegRef = appMeta.getMeta("registryreference");
                                        metaRegRef.getNewRow(tRegistry.rows[0].getRow(), tChild, editType)
                                            .then(function (row) {
                                                expect(row).toBeDefined();
                                                expect(row.current.idreg).toBe(1); // id chiave autoincrmento calcolato
                                                expect(row.current.idregistryreference).toBe(2); // id
                                                expect(tChild.rows.length).toBeGreaterThan(1); // riga aggiunta
                                                expect(row.current.flagdefault).toBe("N");
                                                expect(row.current.lu).toBe("-");
                                                done();
                                            })

                                    },
                                        function (err) {
                                            logger.log(logType.ERROR, err);
                                            expect(1).toBe(0);
                                        })
                            },
                                function (err) {
                                    logger.log(logType.ERROR, err);
                                    expect(1).toBe(0);
                                })
                    })
                }, timeout);

            it('1. get dataSet 2. describeColumns() on "registry" gets table described ',
                function(done) {
                    var editType = "anagrafica";
                    //  creo oggetto per l'invio al server, per recuperare un ds vuoto
                    var objConn = {
                        method: methodEnum.getDataSet,
                        prm: { tableName:"registry", editType:editType}
                    };
                    defLogin.then(function () {
                        // 1. recupero ds vuoto, eseguo delle configurazioni a poi invoco la prefillDataSet
                        conn.call(objConn)
                            .then(function (res) {

                                    var ds1  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    // imposto filtro sulla chiave
                                    var filter =  $q.eq($q.field("idreg"), 1);

                                    appMeta.getData.fillDataSet(ds1, "registry", "anagrafica", filter )
                                        .then(function (dsTarget) {

                                                expect(dsTarget.name).toBe("registry_anagrafica");
                                                // verifico che tornino dei dati
                                                var tRegistryAddress = dsTarget.tables["registryaddress"];
                                            var metaRegistryAddress = appMeta.getMeta("registryaddress");
                                            

                                            metaRegistryAddress.describeColumns(tRegistryAddress, "seg")
                                                    .then(function () {
                                                        // eseguo check su una colonna che mi aspetto sia stata descritta
                                                        expect(tRegistryAddress).toBeDefined();
                                                        expect(tRegistryAddress.columns.address.caption).toBe("Indirizzo");
                                                        expect(tRegistryAddress.columns.address.listColPos).toBe(70);
                                                        done();
                                                    })

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
                    })
                }, timeout);

        });
});
