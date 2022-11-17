'use strict';

describe('ConnectionWebSocket', function () {
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var methodEnum = appMeta.routing.methodEnum;
    var $q = window.jsDataQuery;
    var arrayReturned = [];
    var countCall = 0;

    var ds1MultiRunSelect;

    beforeEach(function () {
        // jasmine.clock().install();
        countCall  = 0;
    });
    afterEach(function () {
        // jasmine.clock().uninstall();
    });

    describe("ConnectionWebSocket class",
        function () {

            it('WebSocket "Select" method on table registry returns a DataTable',
                function(done) {
                    var conWs  = appMeta.connection;
                    conWs.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SOCKET);

                    var filter = $q.eq($q.field("cu"), "assistenza");
                    var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);

                    //  creo oggetto per l'invio al server
                    var objConn = {
                        method: methodEnum.select,
                        prm: { tableName:"registry", columnList:"idreg,active,cu", top:3, filter:filterSerialized},
                        noLogError:true
                    };

                    // mi assicuro che il canale sia aperto, prima di fare la send sul canale web socket
                    var procId = setInterval(function () {
                        if (conWs.backedManagerCurrent){
                            if (conWs.currentBackendManager.isOpen){
                                clearInterval(procId);
                                // chiamata al server di tipo web socket
                                conWs.call(objConn).then(
                                    function (res) {
                                       
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
                                    })
                                    .fail(
                                        function (err) {
                                            logger.log(logType.ERROR, 'Errore select ', 'err: ' , err.text);
                                            done();
                                        })
                                    .progress(
                                        function (data) {
                                            expect(true).toBe(false); // deve andare in err se va in questo ramo
                                            done();
                                        }
                                    )
                            }
                        }
                    }, 1000); // fine setInterval per attendere canale web socket aperto

                }, 10000);

            it('Two consecutive WebSocket "Select" calls on table registry returns a DataTable',
                function(done) {
                  
                    var conWs  = appMeta.connection;
                    conWs.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SOCKET);

                    var filter = $q.eq($q.field("cu"), "assistenza");
                    var filterSerialized = appMeta.getDataUtils.getJsonFromJsDataQuery(filter);

                    //  creo oggetto per l'invio al server
                    var objConn = {
                        method: methodEnum.select,
                        prm: { tableName:"registry", columnList:"idreg,active,cu", top:3, filter:filterSerialized},
                        noLogError:true
                    };

                    // mi assicuro che il canale sia aperto, prima di fare la send sul canale web socket
                    var procId = setInterval(function () {
                        if (conWs.backedManagerCurrent){
                            if (conWs.currentBackendManager.isOpen){
                                clearInterval(procId);

                                // 1a chiamata al server di tipo web socket
                                conWs.call(objConn).then(
                                    function (res) {
                                        console.log("1a call tornata");
                                        countCall++;
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
                                        if (countCall===2){done();}
                                    })
                                    .fail(
                                        function (err) {
                                            logger.log(logType.ERROR, 'Errore select ', 'err: ' , err.text);
                                            done();
                                        })
                                    .progress(
                                        function (data) {
                                            expect(true).toBe(false); // deve andare in err se va in questo ramo
                                            done();
                                        });


                                // 2a chiamata al server di tipo web socket
                                conWs.call(objConn).then(
                                    function (res) {
                                        console.log("2a call tornata");
                                        countCall++;
                                        //expect(appMeta.connection.requestIdCurrent).toBe(2);
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
                                        if (countCall===2){done();}
                                    })
                                    .fail(
                                        function (err) {
                                            logger.log(logType.ERROR, 'Errore select ', 'err: ' , err.text);
                                            done();
                                        })
                                    .progress(
                                        function (data) {
                                            expect(true).toBe(false); // deve andare in err se va in questo ramo
                                            done();
                                        });
                                

                            }
                        }
                    }, 1000); // fine setInterval per attendere canale web socket aperto

                }, 10000);
            
            it('WebSocket test notify caling testNotify',
                function(done) {
                    var conWs  = appMeta.connection;
                    conWs.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SOCKET);

                    //  creo oggetto per l'invio al server
                    var objConn = {
                        method: "testNotify",
                        prm: { p1: 5 }
                    };

                    // mi assicuro che il canale sia aperto, prima di fare la send sul canale web socket
                    var procId = setInterval(function () {
                        if (conWs.backedManagerCurrent){
                            if (conWs.currentBackendManager.isOpen){
                                clearInterval(procId);
                                // chiamata al server di tipo web socket
                                conWs.call(objConn).then(
                                    function (res) {
                                        expect(res).toBeUndefined();
                                        expect(arrayReturned.length).toBe(5);
                                        console.log("ottenuta resolve finale");
                                        logger.log(logType.INFO, 'Server acceso ' + appMeta.basePath, 'res: ' , res);
                                        done();
                                    })
                                    .fail(
                                        function (err) {
                                            logger.log(logType.ERROR, 'Errore select ', 'err: ' , err.text);
                                            expect(err).toBe(null);
                                            done();
                                        })
                                    .progress(
                                        function (data) {
                                            arrayReturned.push(data);
                                            console.log(data);
                                            //expect(true).toBe(false); // deve andare in err se va in questo ramo
                                        }
                                    )
                            }
                        }
                    }, 1000); // fine setInterval per attendere canale web socket aperto

                }, 10000);

            it('Metodo multiRunSelect: 1. GetDataSet method; 2. Builds array with selectBuilder; 3. Launches multiRunSelect, returns correct num of rows' ,
                function(done) {
                    // setto ilbackend per questa chiamata che usa http
                    var conn = appMeta.connection;
                    conn.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SERVICE);
                    //  creo oggetto per l'invio al server
                    var objConn = {
                        method: methodEnum.getDataSet,
                        prm: { tableName:"registry", editType:"anagrafica"},
                        noLogError:true
                    }
                    // 1. invio la richiesta al server
                    conn.call(objConn)
                        .then(function (res) {

                                ds1MultiRunSelect  = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                // Verifiche preliminari
                                expect(ds1MultiRunSelect.name).toBe("registry_anagrafica"); // nome aspettato
                                //no dati
                                expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(0);
                                expect(ds1MultiRunSelect.tables["registryaddress"].rows.length).toBe(0);
                                expect(ds1MultiRunSelect.tables["registryreference"].rows.length).toBe(0);

                                // costrusico selBuilderArray
                                var selBuilderArray = new Array();

                                selBuilderArray.push({ filter: $q.eq("lu", "sa"), top: 300, tableName: "registryreference", table: ds1MultiRunSelect.tables['registryreference']});
                                selBuilderArray.push({ filter: $q.eq("cu", "assistenza"), top: 100, tableName: "registry", table: ds1MultiRunSelect.tables['registry']});
                                selBuilderArray.push({ filter: $q.and($q.eq("cap", 13100),$q.eq("lu", "Vercelli")) , top: 100, tableName: "registryaddress", table: ds1MultiRunSelect.tables['registryaddress']});
                                // serializzo i dati e invio al server
                                var selBuilderArraySer = appMeta.getData.selectBuilderArraySerialize(selBuilderArray);
                                var objConn = {
                                    method: methodEnum.multiRunSelect,
                                    prm: { selBuilderArr: selBuilderArraySer }
                                }

                                // la chiamata alla multiRunSelct la mando sul websocket
                                conn.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SOCKET);

                                // mi assicuro che il canale sia aperto, prima di fare la send sul canale web socket
                                var procId = setInterval(function () {
                                    if (conn.backedManagerCurrent){
                                        if (conn.currentBackendManager.isOpen){
                                            clearInterval(procId);
                                            // chiamata al server di tipo web socket
                                            console.log("START " + logger.getTime());
                                            // chiamata al server
                                            conn.call(objConn)
                                                .progress(
                                                    function (data) {
                                                        // data mi aspetto sia un DataTable
                                                        var dt = appMeta.getDataUtils.getJsDataTableFromJson(data);
                                                        var destTable = ds1MultiRunSelect.tables[dt.name];
                                                        var tableWasEmpty = (destTable.rows.length === 0);
                                                        if (destTable){
                                                            appMeta.getDataUtils.mergeRowsIntoTable(destTable, dt.rows, !tableWasEmpty);
                                                        }else{
                                                            var dtCurr = ds1MultiRunSelect.newTable(dt.name);
                                                            appMeta.getDataUtils.mergeRowsIntoTable(dtCurr, dt.rows, false);
                                                        }
                                                    })
                                                .then(
                                                    function (res) {
                                                        // TODO il num di righe sul db di test potrebbe cambiare. trovare un modo abbastanza affidabile per capire
                                                        // TODO se le righe tornate sono tutte e sole quelle che mi aspetto
                                                        expect(res).toBeUndefined();
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
                                        } // fine   if (conWs.currentBackendManager.isOpen){
                                    }
                                }, 1000); // fine setInterval per attendere canale web socket aperto
                            },
                            function(err) {
                                logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                expect(err).toBe(false);
                                done();
                            });
                }, 30000);

            it('Metodo multiRunSelect: 1. GetDataSet method; 2. Builds array with selectBuilder, one with empty filter; 3. Launches multiRunSelect,  returns correct num of rows',
                function(done) {
                    // setto ilbackend per questa chiamata che usa http
                    var conn = appMeta.connection;
                    conn.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SERVICE);
                    //  creo oggetto per l'invio al server
                    var objConn = {
                        method: methodEnum.getDataSet,
                        prm: { tableName:"registry", editType:"anagrafica"},
                        noLogError:true
                    }
                    // 1. invio la richiesta al server
                    conn.call(objConn)
                        .then(function (res) {

                                ds1MultiRunSelect  = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                // Verifiche preliminari
                                expect(ds1MultiRunSelect.name).toBe("registry_anagrafica"); // nome aspettato
                                //no dati
                                expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(0);
                                expect(ds1MultiRunSelect.tables["registryaddress"].rows.length).toBe(0);

                                // costrusico selBuilderArray
                                var selBuilderArray = new Array();
                                selBuilderArray.push({ filter: $q.eq("cu", "assistenza"), top: 100, tableName: "registry", table: ds1MultiRunSelect.tables['registry']});
                                selBuilderArray.push({ filter: "", top: 100, tableName: "registryaddress", table: ds1MultiRunSelect.tables['registryaddress']});
                                // serializzo i dati e invio al server
                                var selBuilderArraySer = appMeta.getData.selectBuilderArraySerialize(selBuilderArray);
                                var objConn = {
                                    method: methodEnum.multiRunSelect,
                                    prm: { selBuilderArr: selBuilderArraySer }
                                }

                                // la chiamata alla multiRunSelct la mando sul websocket
                                conn.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SOCKET);

                                // mi assicuro che il canale sia aperto, prima di fare la send sul canale web socket
                                var procId = setInterval(function () {
                                    if (conn.backedManagerCurrent){
                                        if (conn.currentBackendManager.isOpen){
                                            clearInterval(procId);
                                            // chiamata al server
                                            conn.call(objConn)
                                                .progress(
                                                    function (data) {
                                                        // data mi aspetto sia un DataTable
                                                        var dt = appMeta.getDataUtils.getJsDataTableFromJson(data);
                                                        var destTable = ds1MultiRunSelect.tables[dt.name];
                                                        var tableWasEmpty = (destTable.rows.length === 0);
                                                        if (destTable){
                                                            appMeta.getDataUtils.mergeRowsIntoTable(destTable, dt.rows, !tableWasEmpty);
                                                        }else{
                                                            var dtCurr = ds1MultiRunSelect.newTable(dt.name);
                                                            appMeta.getDataUtils.mergeRowsIntoTable(dtCurr, dt.rows, false);
                                                        }
                                                    })
                                                .then(
                                                    function (res) {
                                                        expect(res).toBeUndefined();
                                                        expect(ds1MultiRunSelect.tables["registry"].rows.length).toBeGreaterThan(0);
                                                        expect(ds1MultiRunSelect.tables["registryaddress"].rows.length).toBeGreaterThan(0);
                                                        done();
                                                    })
                                                .fail(
                                                    function (err) {
                                                        logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                                        expect(false).toBe(true);
                                                        done();
                                                    });
                                        } // fine   if (conWs.currentBackendManager.isOpen){
                                    }
                                }, 1000); // fine setInterval per attendere canale web socket aperto
                            },
                            function(err) {
                                logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                expect(err).toBe(false);
                                done();
                            });
                }, 30000);

            it('Method multiRunSelect: Loads 10000 rows from registry; (test performance)',
                function(done) {
                    var conn = appMeta.connection;
                    conn.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SERVICE);
                    //  creo oggetto per l'invio al server
                    var objConn = {
                        method: methodEnum.getDataSet,
                        prm: { tableName:"registry", editType:"anagrafica"},
                        noLogError:true
                    }
                    // 1. invio la richiesta al server
                    conn.call(objConn)
                        .then(function (res) {

                                ds1MultiRunSelect  = appMeta.getDataUtils.getJsDataSetFromJson(res);
                                var top = 10000;
                                expect(ds1MultiRunSelect.name).toBe("registry_anagrafica"); // nome aspettato
                                expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(0);

                                // costrusico selBuilderArray
                                var selBuilderArray = new Array();
                                selBuilderArray.push({ filter: "", top: top, tableName: "registry", table: ds1MultiRunSelect.tables['registry']});
                                // serializzo i dati e invio al server
                                var selBuilderArraySer =  appMeta.getData.selectBuilderArraySerialize(selBuilderArray);
                                var objConn = {
                                    method: methodEnum.multiRunSelect,
                                    prm: { selBuilderArr: selBuilderArraySer }
                                }

                                // la chiamata alla multiRunSelct la mando sul websocket
                                conn.setCurrentBackend(appMeta.BackendTypeEnum.WEB_SOCKET);

                                // mi assicuro che il canale sia aperto, prima di fare la send sul canale web socket
                                var procId = setInterval(function () {
                                    if (conn.backedManagerCurrent){
                                        if (conn.currentBackendManager.isOpen){
                                            clearInterval(procId);
                                            // chiamata al server di tipo web socket
                                            console.log("START " + logger.getTime());
                                            // chiamata al server
                                            conn.call(objConn)
                                                .progress(
                                                    function (data) {
                                                        // data mi aspetto sia un DataTable
                                                        var dt = appMeta.getDataUtils.getJsDataTableFromJson(data);
                                                        var destTable = ds1MultiRunSelect.tables[dt.name];
                                                        var tableWasEmpty = (destTable.rows.length === 0);
                                                        if (destTable){
                                                            appMeta.getDataUtils.mergeRowsIntoTable(destTable, dt.rows, !tableWasEmpty);
                                                        }else{
                                                            var dtCurr = ds1MultiRunSelect.newTable(dt.name);
                                                            appMeta.getDataUtils.mergeRowsIntoTable(dtCurr, dt.rows, false);
                                                        }
                                                    })
                                                .then(
                                                    function (res) {
                                                        expect(res).toBeUndefined();
                                                        expect(ds1MultiRunSelect.tables["registry"].rows.length).toBe(top);
                                                        console.log("FINISH " + logger.getTime());
                                                        done();
                                                    })
                                                .fail(
                                                    function (err) {
                                                        logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                                        expect(false).toBe(true);
                                                        done();
                                                    });
                                        } // fine   if (conWs.currentBackendManager.isOpen){
                                    }
                                }, 1000); // fine setInterval per attendere canale web socket aperto
                            },
                            function(err) {
                                logger.log(logType.ERROR, 'Errore getDataSet ', 'err: ' , err.text);
                                expect(err).toBe(false);
                                done();
                            });
                }, 30000);

        });
});