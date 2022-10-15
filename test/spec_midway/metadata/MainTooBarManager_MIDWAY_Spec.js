"use strict";

describe("MainTooBarManager",
    function () {
        var MetaPage = appMeta.MetaPage;
        var HelpForm = appMeta.HelpForm;
        var MainToolBarManager = appMeta.MainToolBarManager;
        var metapage, state, rootelement, mtbm;
        var stabilizeToCurrent = appMeta.stabilizeToCurrent;
       

        beforeEach(function () {
            appMeta.basePath = "base/";
            
            var mainwin = '<head></head><div id="rootelement">' +
                "</div>";
            $("html").html(mainwin);
            $("head").append('<script defer src="/base/test/app/styles/fontawesome/fontawesome-all.js"></script>');
            $("body").append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
            $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
            
            metapage = new MetaPage('t', 'def', false);
            state = new appMeta.MetaPageState();

            var ds = new jsDataSet.DataSet("temp1");
            var t = ds.newTable("t");
            // setto le prop delle colonne per t1
            t.setDataColumn("key", "String");
            t.setDataColumn("field1", "String");
            t.columns["key"].caption = "key_1";
            t.columns["field1"].caption = "field_1";
            state.DS = ds;
            metapage.state = state;
            metapage.state.meta = appMeta.getMeta("t");
            var helpForm = new HelpForm(state, "t", "#rootelement");
            metapage.helpForm  = helpForm;

            rootelement = $("#rootelement");

            mtbm = new MainToolBarManager(rootelement, metapage); // instanzio un oggetto di tipo MainToolBarManager
        });

        afterEach(function () {

        });

        describe("methods work",

            function () {

                it("MainToolBarManager - enableDisableAllButtons(false) disables all buttons",function () {
                    expect(mtbm).toBeDefined();
                    // controllalo stato della proprietà disabled per tutti i bottoni.
                    // Deve risultare uguale a qulla passata nel parametro "disableState"
                    var checkDis = function (disableState) {
                        $(mtbm.rootElement)
                            .find("button[type=button]")
                            .each(function() {
                                var button = this;
                                var cmd = $(button).data("tag");
                                if (!cmd) return true; // button unchanged
                                expect($(button).is(":visible")).toBe(disableState);
                                //expect($(button).prop('disabled')).toBe(disableState);
                            });
                    };

                    checkDis(false); // partono tutti visibili
                    mtbm.enableDisableAllButtons(true);
                    checkDis(true);
                    mtbm.enableDisableAllButtons(false);
                    checkDis(false);
                });

                it("MainToolBarManager constructor works and Events are attached to buttons",function (done) {
                    MetaPage.prototype.cmdMainInsert = function () {
                        return appMeta.Deferred("cmdMainInsert").resolve(true);
                    };

                    spyOn(metapage, "commandEnabled").and.callThrough();
                    var s = stabilizeToCurrent();
                    s.then(function () {
                      expect(metapage.commandEnabled).toHaveBeenCalled();
                      done();
                    });

                    $('#insert1').click(); // simulo click, vedo se metodo viene chiamato
                  
                });

                it("MainToolBarManager maindelete call correct methods, freshbuttons work fine",function (done) {

                    // memorizzo funz commandEnabled originale. Così non influenzo test successivi
                    var originalCommandEnabled =  MetaPage.prototype.commandEnabled;

                    // eseguo mock della funzione commandEnabled
                    MetaPage.prototype.commandEnabled = function (command) {
                        var res = false;
                        if (command === "mainsave") res = true;
                        if (command === "maindelete") res = true;
                        return appMeta.Deferred("commandEnabled").resolve(res).promise();
                    };

                    spyOn(metapage, "doMainCommand").and.callThrough();
                    
                    state.setInsertState();

                    var s = stabilizeToCurrent();
                    s.then(function () {
                        expect(metapage.doMainCommand).toHaveBeenCalled();
                        expect($("#maindelete1").find('span').text()).toBe(appMeta.localResource.cancel);

                        // N.B osserva il Mock della funzione commandEnabled
                        expect($("#search1").is(":visible")).toBe(false);
                        expect($("#insert1").is(":visible")).toBe(false);
                        expect($("#mainsave1").is(":visible")).toBe(true);
                        expect($("#maindelete1").is(":visible")).toBe(true);

                        //ripristino funzione originale
                        MetaPage.prototype.commandEnabled  = originalCommandEnabled;
                        done();
                    });
                    
                    $('#maindelete1').click(); // simulo click, vedos e metodo viene chiamato
                   
                });

                it("MainToolBarManager multiple click buttons",function (done) {
                    
                    // memorizzo funz commandEnabled originale. Così non influenzo test successivi
                    var originalCommandEnabled =  MetaPage.prototype.commandEnabled;
                    // eseguo mock della funzione commandEnabled
                    MetaPage.prototype.commandEnabled = function (command) {
                        var res = false;
                        if (command === "editnotes") res = true;
                        if (command === "maindelete") res = true;
                        return appMeta.Deferred("commandEnabled").resolve(res).promise();
                    };

                    // memorizzo funz commandEnabled originale. Così non influenzo test successivi
                    var originalNotesAvailable =  MetaPage.prototype.notesAvailable;
                    // eseguo mock della funzione notesAvailable
                    MetaPage.prototype.notesAvailable = function () {
                        return true;
                    };
                    state.setInsertState();

                    var s = stabilizeToCurrent();
                    s.then(function () {
                        // ha lo stato pushed
                        expect($("#editnotes1").hasClass("btnPushed")).toBe(true);

                        // simulo non ci sono più notesAvailable, non dovrà essere piùnello statopush
                        MetaPage.prototype.notesAvailable = function () {
                            return false;
                        };

                        s = stabilizeToCurrent();
                        s.then(
                            function () {
                                // al secondo click non ci sono notesAvailable quindi non sarà nello stato pushed
                                expect($("#editnotes1").hasClass("btnPushed")).toBe(false);
                                //ripristino funzione originale
                                MetaPage.prototype.notesAvailable  = originalNotesAvailable;
                                MetaPage.prototype.commandEnabled  = originalCommandEnabled;
                                done();
                            });

                        // Secondo click
                        $('#editnotes1').click();
                    });
                    
                    // Primo click
                    $('#editnotes1').click(); // simulo click
                    
                });
            });
    });
