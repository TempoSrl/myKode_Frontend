'use strict';

describe('AuthManager', function () {
    var stabilize = appMeta.stabilize;
    var timeout  = 20000;

    beforeAll(function () {        
        appMeta.basePath = "base/";
        appMeta.serviceBasePath = "/"; // path relativo dove si trovano i servizi
        appMeta.globalEventManager = new appMeta.EventManager();
        appMeta.localResource.setLanguage("it");
        appMeta.logger.setLanguage(appMeta.LocalResource);


    });

    beforeEach(function () {
        appMeta.connection.setTestMode(true);
    });

    afterEach(function () {
        expect(appMeta.Stabilizer.nesting).toBe(0);
    });

    describe("Test Authentication methods",
        function() {

            it('login with user and password correct succeded',
                function(done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile)
                        .then(function (res) {
                            expect(res).toBe(true);
                            done();
                        })
                }, timeout);

            it('login with user incorrect fails',
                function(done) {
                    appMeta.authManager.login(
                        'xxx',
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile)
                        .then(function (res) {
                            expect(res).toBe(false);

                            var s = stabilize(true);
                            s.then(function () {
                                done();
                            })
                            //$(".modal").find("button")[0].click();
                        })
                }, timeout);

            it('login with password incorrect fails',
                function(done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        'xxx',
                        appMeta.configDev.datacontabile)
                        .then(function (res) {
                            expect(res).toBe(false);                            
                            var s = appMeta.stabilize(true);
                            s.then(function () {
                                done();
                            })
                            //$(".modal").find("button").first().trigger("click");
                        },
                            err => {
                                expect(err).toBe(undefined);
                                expect(true).toBe(false);
                                done();
                            }
                    )
                }, timeout);

            // OK! da abilitare solo quando si vuole fare reset password
            xit('resetPassword is async and reset the password',
                function(done) {
                    appMeta.authManager.resetPassword(appMeta.configDev.emailResetPassword)
                        .then(function (res) {
                            expect(res).toBe(true);
                            done();
                        })
                }, timeout);
            
        });
});
