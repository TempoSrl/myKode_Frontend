'use strict';

describe('ConnectionWebService', function () {
    var conn = appMeta.connection;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var methodEnum = appMeta.routing.methodEnum;
    var Deferred  = appMeta.Deferred;
    var $q = window.jsDataQuery;

    var ds1MultiRunSelect;
    var arrayReturned = [];

    var timeout  = 120000;

    beforeEach(function () {
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
    });


    afterEach(function () {
    });

    describe("ConnectionWebService class",
        function () {


            it('Http Call: Select method on table registry returns a DataTable',
                function(done) {

                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile).then(function (res) {
                        var filter = $q.eq($q.field("cu"), "assistenza");
                        var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.select,
                            prm: { tableName:"registry", columnList:"idreg,active,cu", top:3, filter:filterSerialized},
                            noLogError:true
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {

                                    var dt = appMeta.getDataUtils.getJsDataTableFromJson(res);
                                    expect(dt.name).toBe("registry"); // nome tabella
                                    expect(dt.rows.length).toBe(3); // top tre righe
                                    expect(Object.keys(dt.columns).length).toBe(3); // solo le 3 colonne richeiste
                                    expect(dt.columns.active).toBeDefined(); // mi aspetto solo le colonne messe in columnList
                                    expect(dt.columns.cu).toBeDefined();
                                    expect(dt.columns.idreg).toBeDefined();

                                    // verifico che il campo cu abbia effettivamente solo "assistenza"
                                    for (var i = 0 ; i< dt.rows.length; i++){
                                        expect((dt.rows[i].cu).toUpperCase()).toBe("assistenza".toUpperCase());
                                    }
                                    logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);
                                    done();
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore select ', 'err: ' , err.text);
                                    expect(err).toBe(null);
                                    done();
                                });
                    }, timeout);
                }, timeout);

            it('Method multiRunSelect: 1. GetDataSet method; 2. Builds array with selectBuilder; 3. Launches multiRunSelect',
                function(done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile).then(function (res) {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"default"},
                            noLogError:true
                        }
                        // 1. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {

                                    ds1MultiRunSelect  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1MultiRunSelect.name).toBe("registry_default"); // nome aspettato
                                    //no dati
                                    expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(0);
                                    expect(ds1MultiRunSelect.tables["registryaddress"].rows.length).toBe(0);
                                    expect(ds1MultiRunSelect.tables["geo_city"].rows.length).toBe(0);

                                    /*
                                     SELECT count(*)
                                     FROM [Rettorato_Ok].[dbo].[registryaddress]
                                     where cap = '13100' and lu = 'Vercelli'

                                     SELECT count(*)
                                     FROM [Rettorato_Ok].[dbo].[registryreference]
                                     where lu ='sa'

                                     SELECT count(*)
                                     FROM [Rettorato_Ok].[dbo].[registry]
                                     where cu = 'assistenza'
                                     */
                                    // costrusico selBuilderArray
                                    var selBuilderArray = new Array();
                                    selBuilderArray.push({ filter: $q.eq("idcity", 1), top: 300, tableName: "geo_city", table: ds1MultiRunSelect.tables['geo_city']});
                                    selBuilderArray.push({ filter: $q.eq("idreg", 1), top: 100, tableName: "registry", table: ds1MultiRunSelect.tables['registry']});
                                    selBuilderArray.push({ filter: $q.eq("idreg", 1), top: 100, tableName: "registryaddress", table: ds1MultiRunSelect.tables['registryaddress']});
                                    // serializzo i dati e invio al server
                                    var selBuilderArraySer =  appMeta.getData.selectBuilderArraySerialize(selBuilderArray);
                                    var objConn = {
                                        method: methodEnum.multiRunSelect,
                                        prm: { selBuilderArr: selBuilderArraySer }
                                    }

                                    console.log("START " + logger.getTime());
                                    // chiamata al server
                                    conn.call(objConn)
                                        .then(
                                            function (res) {
                                                expect(res).toBeDefined();

                                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                                // vanno serializzate le chiamate alle sel.onRead(), ove siano definite

                                                // loop sulle select , metto i dati dels erver sulle table in memoria sulla selList
                                                _.forEach(selBuilderArray, function (sel) {
                                                    var destTable = sel.table;
                                                    var inputTable =  ds.tables[sel.table.name];
                                                    if (destTable){
                                                        var tableWasEmpty = (destTable.rows.length === 0);
                                                        appMeta.getDataUtils.mergeRowsIntoTable(destTable, inputTable.rows, !tableWasEmpty);
                                                    }

                                                });

                                                expect(ds1MultiRunSelect.tables["registry"].rows.length).toBeGreaterThan(0);
                                                expect(ds1MultiRunSelect.tables["registryaddress"].rows.length).toBeGreaterThan(0);
                                                expect(ds1MultiRunSelect.tables["geo_city"].rows.length).toBeGreaterThan(0);
                                                console.log("FINISH " + logger.getTime());
                                                done();
                                            })
                                        .fail(
                                            function (err) {
                                                logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                                expect(false).toBe(true);
                                                done();
                                            });
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                    expect(err).toBe(false);
                                    done();
                                });
                    }, timeout);
                }, timeout);

            it('Method multiRunSelect: Loads 10000 rows from registry table',
                function(done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile).then(function (res) {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getDataSet,
                            prm: { tableName:"registry", editType:"default"},
                            noLogError:true
                        };
                        // 1. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {

                                    ds1MultiRunSelect  = appMeta.getDataUtils.getJsDataSetFromJson(res);

                                    expect(ds1MultiRunSelect.name).toBe("registry_default"); // nome aspettato
                                    expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(0);
                                    var top = 1000;
                                    // costrusico selBuilderArray
                                    var selBuilderArray = new Array();
                                    selBuilderArray.push({ filter: "", top: top, tableName: "registry", table: ds1MultiRunSelect.tables['registry']});
                                    // serializzo i dati e invio al server
                                    var selBuilderArraySer =  appMeta.getData.selectBuilderArraySerialize(selBuilderArray);
                                    var objConn = {
                                        method: methodEnum.multiRunSelect,
                                        prm: { selBuilderArr: selBuilderArraySer }
                                    }

                                    console.log("START " + logger.getTime());
                                    // chiamata al server
                                    conn.call(objConn).then(
                                            function (res) {

                                                expect(res).toBeDefined();

                                                var ds = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                                // vanno serializzate le chiamate alle sel.onRead(), ove siano definite

                                                // loop sulle select , metto i dati dels erver sulle table in memoria sulla selList
                                                _.forEach(selBuilderArray, function (sel) {
                                                    var destTable = sel.table;
                                                    var inputTable =  ds.tables[sel.table.name];
                                                    if (destTable){
                                                        var tableWasEmpty = (destTable.rows.length === 0);
                                                        appMeta.getDataUtils.mergeRowsIntoTable(destTable, inputTable.rows, !tableWasEmpty);
                                                    }

                                                });

                                                expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(top);
                                                console.log("FINISH " + logger.getTime());
                                                done();
                                        }).fail(
                                            function (err) {
                                                logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                                expect(false).toBe(true);
                                                done();
                                            });
                                },
                                function(err) {
                                    logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                    expect(err).toBe(false);
                                    done();
                                });
                    }, timeout);
                }, timeout);

            it('Test notify/progress calling testNotify method on server',
                function(done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile).then(function (res) {
                        //  creo oggetto per l'invio al server
                        var objConn = {
                            method: "testNotify",
                            prm: { p1: 5 }
                        };

                        // chiamata al server di tipo web socket
                        conn.call(objConn).then(
                            function (res) {
                                console.log("then " + arrayReturned);
                                expect(res).toBeUndefined();
                                expect(arrayReturned.length).toBe(5);
                                expect(_.isEqual(arrayReturned, [5,6,7,8,9])).toBe(true);
                                console.log("ottenuta resolve finale");
                                done();
                            }).fail(
                                function (err) {
                                    logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                    expect(false).toBe(true);
                                    done();
                            }).progress(
                                function (data) {
                                    arrayReturned.push(data);
                                    console.log("progress " + arrayReturned);
                            })

                    }, timeout);
                }, timeout);

        });
});
