'use strict';

describe('Security', function () {
  
    var timeout  = 20000;
    
    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe("Test Authentication methods",
        function() {

            it('setUsr set the user environment',
                function(done) {
                    appMeta.authManager.login(
                        appMeta.configDev.userName,
                        appMeta.configDev.password,
                        appMeta.configDev.datacontabile).then(function (res) {
                        var value = "surnamemodified_unittest";
                        var key = "surname";
                        appMeta.security.setUsrEnvOnBackend(key, value)
                            .then(function (res) {
                                expect(res).toBe('ok');
                                done();
                            })
                    }, timeout);
                    
                }, timeout);
            
        });
});
