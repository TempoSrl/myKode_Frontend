"use strict";

describe("CodiceFiscale",
    function () {
        var CF = appMeta.CodiceFiscale;

        describe("methods work",
            function () {

                it("codice fiscale is generated correctly",function () {
                    var cf = CF.computes_codice_fiscale("Mario", "Rossi", "M", "02", "10", "1980", "Subiaco");
                    expect(cf).toBe("RSSMRA80R02I992D");
                });

                it("codice fiscale is reverted correctly",function () {
                    var cfreverse = CF.reverse_codice_fiscale("RSSMRA80R02I992D");
                    expect(cfreverse.name).toBe("MRA");
                    expect(cfreverse.surname).toBe("RSS");
                    expect(cfreverse.gender).toBe("M");
                    expect(cfreverse.birthday.getDate()).toBe(2);
                    expect(cfreverse.birthday.getMonth() + 1).toBe(10);
                    expect(cfreverse.birthday.getFullYear()).toBe(1980);
                    expect(cfreverse.birthplace).toBe("SUBIACO (RM)");
                });

                it("codice fiscale computed from reverted is correct",function () {
                    var cf = CF.computes_codice_fiscale("Mario", "Rossi", "M", "02", "10", "1980", "Subiaco");
                    // inverto
                    var cfreverse = CF.reverse_codice_fiscale(cf);
                    // ricalcolo
                    var cf2 = CF.computes_codice_fiscale(cfreverse.name, 
                        cfreverse.surname,
                        cfreverse.gender,
                        cfreverse.birthday.getDate().toString(),
                        (cfreverse.birthday.getMonth() + 1).toString(),
                        cfreverse.birthday.getFullYear().toString(),
                        cfreverse.birthplace);
                    // verifica
                    expect(cf2).toBe("RSSMRA80R02I992D");
                });
            });
    });