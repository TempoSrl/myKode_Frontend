'use strict';

describe('ConnectionWebService', function () {
    var conn = appMeta.connection;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var methodEnum = appMeta.routing.methodEnum;
    var $q = window.jsDataQuery;
    var timeout  = 50000;
    beforeEach(function () {
        //conn = new Connection();
        jasmine.getFixtures().fixturesPath = 'base/test/spec/fixtures';
    });
    
    
    afterEach(function () {
        // resert del token, altrimenti la login memorizza il token, e i test potrebbero non avere una situazione pulita
        conn.currentBackendManager.setToken("");
    });

    describe("ConnectionWebServiceNoAuth class",
        function () {

            it("Login method works", function (done) {
                var objConn = {
                    method: methodEnum.login,
                    prm: {
                        userName: appMeta.configDev.userName,
                        password: appMeta.configDev.password,
                        datacontabile: appMeta.configDev.datacontabile.toJSON() }
                }
                conn.call(objConn)
                    .then(function(res) {
                            //logger.log(logType.INFO, "token ", res);
                            expect(res).toBeDefined();
                            expect(res.expiresOn).toBeDefined();
                            expect(res.token).toBeDefined();
                            expect(res.token.length).toBeGreaterThan(100);
                            done();
                        },
                        function(err) {
                            logger.log(logType.ERROR, "login err ", err);
                            expect(true).toBe(false);
                            done();
                        });
               
            }, timeout);

            xit("User already registered method works", function (done) { //Utente già registrato, status: 400
                var objConn = {
                    method: methodEnum.register,
                    prm: {
                        userName: appMeta.configDev.userName,
                        password: appMeta.configDev.password,
                        email: appMeta.configDev.email,
                        codiceFiscale : appMeta.configDev.codiceFiscale ,
                        partitaIva : appMeta.configDev.partitaIva,
                        cognome : appMeta.configDev.cognome,
                        nome: appMeta.configDev.nome ,
                        dataNascita: appMeta.configDev.dataNascita }
                }
                objConn.noLogError = true;
                conn.call(objConn)
                    .then(function(res) {
                            //logger.log(logType.INFO, 'register ok ', res);
                            expect(res).toBeDefined();
                            expect(true).toBe(false);
                            done();
                        },
                        function(err) {
                            //logger.log(logType.ERROR, 'register err ', err);
                            expect(err.status).toBe(400);
                            expect(err.text).toBe('"Utente già registrato."');
                            done();
                        });

                
            }, timeout);

            it("User reset Password, gets error 'Email not resgistered'", function (done) { //Utente già registrato, ma non ancora attivo su web
                var objConn = {
                    method: methodEnum.resetPassword,
                    prm: {
                        email: 'mailnotExists'
                    }
                };
                objConn.noLogError = true;
                conn.call(objConn)
                    .then(function(res) {
                            expect(true).toBe(false);
                            done();
                        },
                        function(err) {
                            expect(err.status).toBe(404);
                            expect(err.text).toBe('"E-mail non registrata."');
                            done();
                        })
                    .fail(function (err) {
                        expect(err.status).toBe(404);
                        expect(err.text).toBe('"E-mail non registrata."');
                        done();
                    })


            }, timeout);

            it("Login + httpCall", function (done) {

                appMeta.authManager.login(
                    appMeta.configDev.userName,
                    appMeta.configDev.password,
                    appMeta.configDev.datacontabile)
                    .then(function (res)  {

                           // expect per il token
                            expect(res).toBe(true);

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

                            done();
                        },
                        function(err) {
                            logger.log(logType.ERROR, "login err ", err);
                            expect(true).toBe(false);
                            done();
                        });

            }, timeout);

            // OK! prevede il cambio manuale di un flag a DB, fare solo se serve
            xit("User reset Password, gets error 'user non active'", function (done) { //Utente già registrato, ma non ancora attivo su web
                var objConn = {
                    method: methodEnum.resetPassword,
                    prm: {
                        email: appMeta.configDev.email
                    }
                };
                objConn.noLogError = true;
                conn.call(objConn)
                    .then(function(res) {
                            expect(true).toBe(false);
                            done();
                        },
                        function(err) {
                            expect(err.status).toBe(403);
                            expect(err.text).toBe('"Account non attivo."');
                            done();
                        })
                    .fail(function (err) {
                        expect(err.status).toBe(403);
                        expect(err.text).toBe('"Account non attivo."');
                        done();
                    })


            }, timeout);

            // OK! metodo da utilizzare quando si registra nuovo utente. non si può lanciare ad ogni run dei test.
            // oppure prevedere un unregister dopo il register
            xit("User registers method works", function (done) { //Utente già registrato, status: 400
                var objConn = {
                    method: methodEnum.register,
                    prm: {
                        // TODO cambiare ogni volta credenziali
                        /*userName: appMeta.configDev.userName2,
                        password: appMeta.configDev.password2,
                        email: appMeta.configDev.email2,
                        codiceFiscale : appMeta.configDev.codiceFiscale2 ,
                        partitaIva : appMeta.configDev.partitaIva2,
                        cognome : appMeta.configDev.cognome2,
                        nome: appMeta.configDev.nome2 ,
                        dataNascita: appMeta.configDev.dataNascita2 */
                    }
                };
                objConn.noLogError = true;
                conn.call(objConn)
                    .then(function(res) {
                            //logger.log(logType.INFO, 'register ok ', res);
                            expect(res).toBe('Registrazione completata.');
                            expect(true).toBe(true);
                            done();
                        },
                        function(err) {
                            //logger.log(logType.ERROR, 'register err ', err);
                            expect(err.status).toBe(400);
                            expect(err.text).toBe('"Utente già registrato."');
                            done();
                        });


            }, timeout);

            // OK! messo xit perchè per ora è disabilitato l'auth lato server. riabilitare quando abilito auth
            xit('runSelect() , columnList ="idreg,active,cu", must FAILS, because it requires logged user',
                function (done) {
                    var columnList = "idreg,active,cu";
                    var top = 15;
                    var filter = $q.eq($q.field("cu"), "sa");
                    appMeta.getData.runSelect('registry', columnList, filter, top)
                        .then(function (dt) {
                            // il metodo deve fallire se torna con succcesso, poichè deve essere richeista la login
                            expect(true).toBe(false);
                            done();
                        },
                            function(err) {
                                //  il test è ok se va in errore poichè, non ho le credenziali.
                                // Negli altri e2e messa nel beforeAll()
                                expect(true).toBe(true);
                                expect(err.text.indexOf("Autorizzazione negata per la richiesta")).not.toBe(-1);
                                done();
                            });
                }, timeout);

        });
});
