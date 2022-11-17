'use strict';

describe('AuthManager', function () {
  
    var timeout  = 20000;
    
    beforeEach(function () {
    });

    afterEach(function () {
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
                            done();
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
                            done();
                        })
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
