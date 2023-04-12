'use strict';

describe('DataQuery', function () {
    var conn;
    var $q = window.jsDataQuery;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var jsonToSend = null;
    var inputFilter = null;
    var methodEnum = appMeta.routing.methodEnum;

    var ds, t1, funcCompOnTable, funcCompOnRow, funcCompSql, rows;
    var objrow1, objrow2, objrow3, objrow4, objrow5;
    var timeout = 20000;
    var stabilize = appMeta.stabilize;

    let defLogin;
    // effettuo login
    beforeAll(function () {
        appMeta.basePath = "base/";
        appMeta.serviceBasePath = "/"; // path relativo dove si trovano i servizi
        if (appMeta.globalEventManager === undefined) {
            appMeta.globalEventManager = new appMeta.EventManager();
        }
        appMeta.connection.setTestMode(false); //shows the modal window
        appMeta.localResource.setLanguage("it");
        appMeta.logger.setLanguage(appMeta.LocalResource);
        //logger.setLogLevel(logType.INFO);
      
        defLogin = appMeta.Deferred("login test");
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

        conn = appMeta.connection;

        // dichiaro tabella di prova, su cui eseguirò le selectcon le jsDataQuery da testare
        ds = new jsDataSet.DataSet("temp");
        t1 = ds.newTable("table1");

        var c_name = "c_name";
        var c_dec = "c_dec";
        var c_double = "c_double";
        var c_date = "c_date";

        // setto le prop delle colonne per t1
        t1.setDataColumn(c_name, "String");
        t1.setDataColumn(c_dec, "Decimal");
        t1.setDataColumn(c_double, "Double");
        t1.setDataColumn(c_date, "Double");

        // aggiungo righe alla t1
        objrow1 = { c_name: "nome1", c_dec: 11, c_double: 1000, c_date: new Date(2018, 0, 25, 15, 6) };
        objrow2 = { c_name: "nome2", c_dec: 22, c_double: 2000, c_date: new Date(2018, 0, 25, 15, 7) };
        objrow3 = { c_name: "nome3", c_dec: 33, c_double: 3000, c_date: new Date(2018, 0, 25, 15, 8) };
        objrow4 = { c_name: "nome4", c_dec: 44, c_double: 4000, c_date: new Date(2018, 0, 25, 15, 9) };
        objrow5 = { c_name: "notlike", c_dec: 55, c_double: 5000 };
        rows = [objrow1, objrow2, objrow3, objrow4, objrow5];
        // aggiungo righe tab 1
        t1.add(objrow1);
        t1.add(objrow2);
        t1.add(objrow3);
        t1.add(objrow4);
        t1.add(objrow5);

        $("html").html("");
        appMeta.modalLoaderControl.clear();

        // funzione generica che confornta risultato orifginale del filtro, con quello tornato dal server
        // inputFilter è un generico jsDataQuery
        funcCompOnTable = function (inputFilter) {
            var def = $.Deferred();

            var t1filter1 = t1.select(inputFilter); // serve per confrontare

            jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
            // 4. creo oggetto per l'invio al server
            var objConn = {
                method: methodEnum.getJsDataQuery,
                prm: { dquery: jsonToSend }
            };
            // 4. invio la richiesta al server
            conn.call(objConn)
                .then(function (res) {
                    // riconverto la stringa json proveniente dal server
                    var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                    var t1filter2 = t1.select(m); // serve per confrontare

                    expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                    expect(m.myName).toBe(inputFilter.myName);
                    expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                    def.resolve(true);
                },
                    function (err) {
                        let winRes = logger.log(logType.DEBUG, 'Errore jsDataQuery ', 'err: ', err);
                        def.resolve(false);
                    });

            return def.promise();
        }

        funcCompOnRow = function (inputFilter, row) {
            var def = $.Deferred();

            var t1filter1 = inputFilter(row); // serve per confrontare

            jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
            // 4. creo oggetto per l'invio al server
            var objConn = {
                method: methodEnum.getJsDataQuery,
                prm: { dquery: jsonToSend }
            };
            // 4. invio la richiesta al server
            return conn.call(objConn)
                .then(function (res) {
                    // riconverto la stringa json proveniente dal server
                    var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                    var t1filter2 = m(row); // serve per confrontare
                    expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                    expect(m.myName).toBe(inputFilter.myName);
                    expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                    def.resolve(true);
                },
                    function (err) {
                        //console.log("funcCompOnRow displaying log but who knows?", err);
                        let winRes = logger.log(logType.DEBUG, 'Errore jsDataQuery ', 'err: ', err);
                        expect(err).toBe(0);
                        def.resolve(false);
                    })

            return def.promise();
        }

        funcCompSql = function (inputFilter, sqlRes) {
            var def = $.Deferred();

            jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
            // 4. creo oggetto per l'invio al server
            var objConn = {
                method: methodEnum.fromJsDataQueryToSql,
                prm: { filter: jsonToSend }
            };
            // 4. invio la richiesta al server
            return conn.call(objConn)
                .then(function (res) {
                    expect(res).toBe(sqlRes);
                    def.resolve(true);
                },
                    function (err) {
                        expect(err).toBe(0);
                        def.resolve(false);
                    });

            return def.promise();
        }

    });

    afterEach(function () {
        expect(appMeta.Stabilizer.nesting).toBe(0);
    });
    afterAll(() => {
        appMeta.connection.setTestMode(true); //shows the modal window
    })
            it('Send jsDataQuery to server, basic test: Function "Eq" + "Field" undefined value in integer non nullable',
                function (done) {
                   
                    defLogin.then(function () {
                        // inputFilter = $q.eq($q.field('idreg'), undefined);
                        inputFilter = $q.or(
                            $q.eq($q.field('idreg'), undefined),
                            $q.eq($q.field('title'), undefined),
                            $q.eq($q.field('idreg'), 1),
                            $q.isIn($q.field('idreg'), []),
                        );
                        appMeta.getData.runSelect('registry', '*', inputFilter)
                            .then(function (res) {
                                expect(false).toBe(true);
                                done();
                            }, function (err) {
                                expect(err.text).toBe("FilterWithUndefined$__$Tabella registry la colonna idreg ha un valore indefinito nella condizione di filtro. - Tabella registry la colonna title ha un valore indefinito nella condizione di filtro.");
                                $(".modal:visible").find("button")[0].click();
                                stabilize(true).then(done);
                            })
                    },
                    function (err) {
                        expect(err).toBe(null);
                        expect(true).toBe(false);
                        done();
                    });
                });

            it('Multirunselect Send jsDataQuery to server, basic test: Function "Eq" + "Field" undefined value in integer non nullable',
                function (done) {
                    defLogin.then(function () {
                        var ds = new jsDataSet.DataSet("temp");
                        var t1 = ds.newTable("t1");
                        var t2 = ds.newTable("t2");
                        var t3 = ds.newTable("t3");
                        // costruisco selBuilderArray
                        var selBuilderArray = new Array();
                        selBuilderArray.push({ filter: $q.eq("lu", undefined), top: 300, tableName: "registryreference", table: t1 });
                        selBuilderArray.push({ filter: $q.eq("cu", "assistenza"), top: 100, tableName: "registry", table: t2 });
                        selBuilderArray.push({ filter: $q.and($q.eq("cap", undefined), $q.eq("lu", "Vercelli")), top: 100, tableName: "registryaddress", table: t3 });

                        appMeta.getData.multiRunSelect(selBuilderArray)
                            .then(
                                function (res) {
                                    expect(false).toBe(true);
                                    done();
                                },
                                function (err) {
                                    expect(err.text).toBe("FilterWithUndefined$__$Tabella t1 la colonna lu ha un valore indefinito nella condizione di filtro. - Tabella t3 la colonna cap ha un valore indefinito nella condizione di filtro.");
                                    $(".modal:visible").find("button")[0].click();
                                    stabilize(true).then(done);

                                })
                            .fail(
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore notify ', 'err: ' , err.text);
                                    expect(false).toBe(true);
                                    done();
                                });
                    }, function (err) {
                        expect(true).toBe(false);
                        done();
                    });
                }, timeout);




            it('Send jsDataQuery to server, basic test: Function "Eq" + "Field" undefined value',
                function (done) {
                    defLogin.then(function () {
                        inputFilter = $q.eq($q.field('c_name'), undefined);
                        funcCompOnTable(inputFilter).then(function (fnRes) {
                            //$(".modal:visible").find("button")[0].click();
                            expect(fnRes).toBe(false);
                            $(".modal:visible").find("button")[0].click();
                            stabilize(true).then(done);

                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                });


            it('Send jsDataQuery to server, basic test: Function "Eq" + "Field", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        inputFilter = $q.eq($q.field('c_name'), "nome1");
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "like", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        inputFilter = $q.like($q.field('c_name'), 'nome');
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                });


            it('Send jsDataQuery to server, basic test: Function "constant"',
                function (done) {
                    defLogin.then(function () {
                        inputFilter = $q.constant('a');
                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                expect(m.myName).toBe('constant');
                                expect(m.myArguments[0]).toBe('a');
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }
                , timeout);



            it('Send jsDataQuery to server, basic test: Function "isIn"',
                function (done) {
                    defLogin.then(function () {

                        var inputFilter = $q.isIn('q', ['a', 'A', ' ', null, 1]);

                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments[0]).toBe('q');
                                expect(_.isEqual(m.myArguments[1], "a")).toBe(true);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ' , err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            //REAL XIT    
            xit('Send jsDataQuery to server, basic test: Function "isIn", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {

                        var inputFilter = $q.isIn('c_dec', [11, 33]);
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            //REAL XIT
            xit('Send jsDataQuery to server, basic test: Function "isNotIn", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.isNotIn('c_dec', [11, 33]);
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "And + eq", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.and($q.eq('c_dec', 11), $q.eq('c_name', "nome1"));
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "And + eq", passing array of clause in "and" select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.and([$q.eq('c_dec', 11), $q.eq('c_name', "nome1")]);
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                var t1filter2 = t1.select(m); // serve per confrontare

                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                expect(m.myName).toBe(inputFilter.myName);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    done();
                                })

                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "Or + eq", passing array of clause in "or" select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.or([$q.eq('c_dec', 11), $q.eq('c_dec', 22)]);
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                var t1filter2 = t1.select(m); // serve per confrontare

                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                expect(m.myName).toBe(inputFilter.myName);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    done();
                                })

                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "Or + eq", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.or($q.eq('c_dec', 11), $q.eq('c_name', "nome2"));
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "le", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.le('c_dec', 22);
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "lt", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.lt('c_dec', 22);
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "ge", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.ge('c_dec', 22);
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "gt", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.gt('c_dec', 22);
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "lt" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient = new Date(2018, 0, 25, 15, 7);
                        var inputFilter = $q.lt('c_date', mydateClient);
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var inputFilter = $q.lt('c_date', mydateToSend);
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >= 
                                expect(t1filter1.length).toBe(1);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                }, timeout);


            it('Send jsDataQuery to server, basic test: Function "le" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient = new Date(2018, 0, 25, 15, 7);

                        var inputFilter = $q.le('c_date', mydateClient);
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var inputFilter = $q.le('c_date', mydateToSend);
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >= 
                                expect(t1filter1.length).toBe(2);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                });

            it('Send jsDataQuery to server, basic test: Function "gt" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient = new Date(2018, 0, 25, 15, 7);
                        var inputFilter = $q.gt('c_date', mydateClient);
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var inputFilter = $q.gt('c_date', mydateToSend);
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >= 
                                expect(t1filter1.length).toBe(2);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                });

            it('Send jsDataQuery to server, basic test: Function "ge" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient = new Date(2018, 0, 25, 15, 7);
                        var inputFilter = $q.ge('c_date', mydateClient);
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var inputFilter = $q.ge('c_date', mydateToSend);
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >= 
                                expect(t1filter1.length).toBe(3);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "And(le, gt)" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient = new Date(2018, 0, 25, 15, 7);

                        var inputFilter = $q.and($q.le('c_date', mydateClient), $q.gt('c_date', mydateClient));
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var inputFilter = $q.and($q.le('c_date', mydateToSend), $q.gt('c_date', mydateToSend));
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >=
                                expect(t1filter1.length).toBe(0);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "Or(le, gt)" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient = new Date(2018, 0, 25, 15, 7);

                        var inputFilter = $q.or($q.le('c_date', mydateClient), $q.gt('c_date', mydateClient));
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var inputFilter = $q.or($q.le('c_date', mydateToSend), $q.gt('c_date', mydateToSend));
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >=
                                expect(t1filter1.length).toBe(4);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "And(gt, lt)" on field type Date, select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var mydateClient1 = new Date(2018, 0, 25, 15, 7);
                        var mydateClient2 = new Date(2018, 0, 25, 15, 9);
                        var inputFilter = $q.and($q.gt('c_date', mydateClient1), $q.lt('c_date', mydateClient2));
                        var t1filter1 = t1.select(inputFilter); // serve per confrontare

                        // da spedire quidni applico offset epr evitare lo stri gfy
                        var mydateToSend1 = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var mydateToSend2 = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 9), true);
                        var inputFilter = $q.and($q.gt('c_date', mydateToSend1), $q.lt('c_date', mydateToSend2));
                        var jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        };
                        // 4. invio la richiesta al server
                        return conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                // la getJsDataQueryFromJson applica lei l'offset quindi ho quello coretto, cioè quello inviato
                                var t1filter2 = t1.select(m); // serve per confrontare
                                expect(_.isEqual(t1filter1, t1filter2)).toBe(true);
                                // verifico che siano ir ecord aspettati, sono 4 gli input e quindi vale la pena vedere se funzionao i < > <= >=
                                expect(t1filter1.length).toBe(1);
                                expect(m.myName).toBe(inputFilter.myName);
                                expect(m.myArguments.length).toBe(inputFilter.myArguments.length);
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ', err);
                                    expect(err).toBe(0);
                                    expect(true).toBe(false);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "Or(Eq, And(like,eq))", select on t1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.or($q.eq('c_dec', 11), $q.and($q.like($q.field('c_name'), 'nome'), $q.eq('c_dec', 22)));
                        funcCompOnTable(inputFilter).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function Add(field, field)", select on objrow1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.add($q.field('c_dec'), $q.field('c_double'));
                        funcCompOnRow(inputFilter, objrow1).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function Mul(field, field)", select on objrow1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.mul($q.field('c_dec'), $q.field('c_double'));
                        funcCompOnRow(inputFilter, objrow1).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function Sub(field, field)", select on objrow1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.sub($q.field('c_dec'), $q.field('c_double'));
                        funcCompOnRow(inputFilter, objrow1).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                });

            it('Send jsDataQuery to server, basic test: Function Div(field, field)", select on objrow1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.div($q.field('c_dec'), $q.field('c_double'));
                        funcCompOnRow(inputFilter, objrow1).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function Minus(Add(field, field))", select on objrow1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.minus($q.add($q.field('c_dec'), $q.field('c_double')));
                        funcCompOnRow(inputFilter, objrow1).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function Minus(Minus(Add(field, field)))", select on objrow1 is ok',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.minus($q.minus($q.add($q.field('c_dec'), $q.field('c_double'))));
                        funcCompOnRow(inputFilter, objrow1).then(function () {
                            done();
                        }, function (err) {
                            expect(true).toBe(false);
                            done();
                        });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "mcmp" with empty keys array, should be the true constant',
                function (done) {
                    defLogin.then(function () {
                        var keys = [];
                        inputFilter = $q.mcmp(keys, objrow1);
                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                expect(m.myName).toBe('constant');
                                expect(m.isTrue).toBeTruthy();
                                done();
                            },
                                function (err) {
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ' , err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "mcmp" with two fields, should be defined',
                function (done) {
                    defLogin.then(function () {
                        var keys = ['c_name', 'c_dec'];
                        inputFilter = $q.mcmp(keys, objrow1);
                        var res1 = inputFilter(objrow1);
                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                expect(m).toBeDefined();
                                //var res2 = t1.select(m);
                                done();
                            },
                                function (err) {
                                    $(".modal:visible").find("button")[0].click();
                                    //logger.log(logType.ERROR, 'Errore jsDataQuery ', 'err: ' , err);
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "mcmp" with 1 element keys array, should be the true constant',
                function (done) {
                    defLogin.then(function () {
                        var keys = ['c_name'];

                        var o1 = { c_name: "nome1", c_dec: 11, c_double: 1000 };
                        var o2 = { c_name: "nome1", c_dec: 22, c_double: 2000 };
                        var o3 = { c_name: "nome1", c_dec: 33, c_double: 3000 };
                        t1.add(o1);
                        t1.add(o2)
                        t1.add(o3);

                        inputFilter = $q.mcmp(keys, objrow1);
                        var res1 = inputFilter(objrow1);
                        var rows1 = t1.select(inputFilter); // righe selezionate dal filtro di input
                        jsonToSend = appMeta.getDataUtils.getJsonFromJsDataQuery(inputFilter);
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.getJsDataQuery,
                            prm: { dquery: jsonToSend }
                        }
                        // 4. invio la richiesta al server
                        conn.call(objConn)
                            .then(function (res) {
                                // riconverto la stringa json proveniente dal server
                                var m = appMeta.getDataUtils.getJsDataQueryFromJson(res);
                                var res2 = m(objrow1);
                                var rows2 = t1.select(m); // righe selezionate dal filtro ser/des
                                expect(m).toBeDefined();
                                expect(_.isEqual(rows1, rows2)).toBe(true);
                                expect(res1).toBe(res2);
                                done();
                            },
                                function (err) {
                                    $(".modal:visible").find("button")[0].click();
                                    expect(err).toBe(0);
                                    done();
                                });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "and + eq", sql string is expected',
                function (done) {
                    defLogin.then(function () {
                        var inputFilter = $q.and($q.eq('c_dec', 11), $q.eq('c_name', "nome1"));

                        funcCompSql(inputFilter, "(c_dec=11)AND(c_name='nome1')")
                            .then(function () {
                                done();
                            }, function (err) {
                                expect(true).toBe(false);
                                done();
                            });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "And(gt, lt)" on field type Date, sql string is expected',
                function (done) {
                    defLogin.then(function () {
                        var mydateToSend1 = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 7), true);
                        var mydateToSend2 = appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new Date(2018, 0, 25, 15, 9), true);
                        var inputFilter = $q.and($q.gt('c_date', mydateToSend1), $q.lt('c_date', mydateToSend2));

                        funcCompSql(inputFilter, "(c_date>{ts '2018-01-25 15:07:00.000'})AND(c_date<{ts '2018-01-25 15:09:00.000'})")
                            .then(function () {
                                done();
                            }, function (err) {
                                expect(true).toBe(false);
                                done();
                            });
                    });
                }, timeout);

            it('Send jsDataQuery json of doPar serialized',
                function (done) {
                    defLogin.then(function () {
                        var j2 = '{"name":"doPar","args":[{"name":"or","args":[{"name":"doPar","args":[{"name":"and","args":[{"name":"eq","args":[{"name":"field","args":[{"value":"a"}],"alias":"a"},{"name":"constant","args":[{"value":111}]}]},{"name":"eq","args":[{"name":"field","args":[{"value":"b"}],"alias":"b"},{"name":"constant","args":[{"value":222}]}]}]}]},{"name":"doPar","args":[{"name":"eq","args":[{"name":"field","args":[{"value":"c"}],"alias":"c"},{"name":"constant","args":[{"value":333}]}]}]}]}]}';
                        var q = appMeta.getDataUtils.getJsDataQueryFromJson(j2);
                        expect(q({})).toBeFalsy();
                        expect(q({ a: 111, b: 222, c: 333 })).toBeTruthy();
                        expect(q({ a: 111, b: 222 })).toBeTruthy();
                        expect(q({ a: 111, c: 333 })).toBeTruthy();
                        expect(q({ b: 222, c: 333 })).toBeTruthy();
                        expect(q({ a: 111, c: 111 })).toBeFalsy();
                        // 4. creo oggetto per l'invio al server
                        var objConn = {
                            method: methodEnum.fromJsDataQueryToSql,
                            prm: { filter: j2 }
                        };
                        var sqlRes = "(((a=111)AND(b=222))OR(c=333))";

                        appMeta.authManager.login(
                            appMeta.configDev.userName,
                            appMeta.configDev.password,
                            appMeta.configDev.datacontabile).then(function (res) {
                                // 4. invio la richiesta al server
                                conn.call(objConn)
                                    .then(function (res) {
                                        expect(res.trim()).toBe(sqlRes.trim());
                                        done()
                                    },
                                        function (err) {
                                            expect(1).toBe(0);
                                            done();
                                        });
                            }, timeout)

                    });
                }, timeout);


            // lato backenbd se utilizza pars.Skip(1).ToArray()  torna "(c_dec='System.Object[]') poichè la toArray fa un Object di Object[]
            // invece eseguo cast di pars che è un array ad Object[],
            it('Send jsDataQuery to server, basic test: Function "isIn", sql string is expected',
                function (done) {
                    var inputFilter = $q.isIn('c_dec', [11, 33]);
                    defLogin.then(function () {
                        funcCompSql(inputFilter, "(c_dec IN (11,33))")
                            .then(function () {
                                done();
                            }, function (err) {
                                expect(true).toBe(false);
                                done();
                            });
                    });
                }, timeout);

            it('Send jsDataQuery to server, basic test: Function "isIn", sql string is expected',
                function (done) {
                    var inputFilter = $q.isNotIn('c_dec', [11, 33]);
                    defLogin.then(function () {
                        funcCompSql(inputFilter, "(c_dec NOT IN (11,33))")
                            .then(function () {
                                done();
                            }, function (err) {
                                expect(true).toBe(false);
                                done();
                            });
                    });
                }, timeout);

});
