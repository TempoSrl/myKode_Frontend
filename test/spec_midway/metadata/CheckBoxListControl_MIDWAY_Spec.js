/* global beforeEach, afterEach,describe,jasmine,it,expect,inject,spyOn,$,jsDataSet,appMeta,_ */

describe("CheckBoxListControl",
    function () {
        var MetaPage = appMeta.MetaPage;
        var HelpForm = appMeta.HelpForm;
        var state;
        var helpForm;
        var ds;
        var check1, t1, t2, middle, objrow1, objrow2, objrow3, objrow4, objrow5, objrow6, objrow7, objrow8, objrow9;
        var metapage;

        // invoca la getToolBarManager per instanziare la toolbar, che poi sarà richiamata nei vari freshForm
        beforeAll(function () {
            appMeta.basePath = "base/";
            appMeta.currApp.initToolBarManager();
          
        });
        
        beforeEach(function (done) {
            jasmine.getFixtures().fixturesPath = "base/test/spec/fixtures";

            // costrusico ogetto stato e ds
            state = new appMeta.MetaPageState();
            ds = new jsDataSet.DataSet("temp");
            t1 = ds.newTable("table1");
            t2 = ds.newTable("table2");
            middle = ds.newTable("middle");
            // setto le prop delle colonne per t1
            t1.setDataColumn("id1", "Decimal");
            t1.setDataColumn("c1", "String");

            t2.setDataColumn("id2", "Decimal");
            t2.setDataColumn("c2", "String");

            middle.setDataColumn("id2", "Decimal");
            middle.setDataColumn("id1", "Decimal");
            middle.setDataColumn("c3", "Decimal");

            t1.key("id1");
            t2.key("id2");

            t2.columns["id2"].caption = "identificativo2";
            t2.columns["c2"].caption = "colonna2";
            t2.columns["id2"].listColPos = 1;
            t2.columns["c2"].listColPos = 2;

            // aggiungo 2 righe alla t2
            objrow1 = {id2: 1, c2: "one"};
            objrow2 = {id2: 2, c2: "two"};
            objrow3 = {id2: 3, c2: "three"};
            objrow4 = {id2: 4, c2: "four"};
            objrow5 = {id2: 5, c2: "five"};
            objrow1 = t2.add(objrow1).current;
            objrow2 = t2.add(objrow2).current;
            objrow3 = t2.add(objrow3).current;
            objrow5 = t2.add(objrow5).current;
            objrow4 = t2.add(objrow4).current;

            t2.add(objrow2);
            t2.add(objrow3);
            t2.add(objrow5);
            t2.add(objrow4);
            t2.acceptChanges();

            objrow6 = {id1: 11, c1: "mainrow1"};
            objrow7 = {id1: 22, c2: "mainrow2"};
            objrow6 = t1.add(objrow6).current;
            objrow7 = t1.add(objrow7).current;
            t1.acceptChanges();
            state.DS = ds;
            state.meta  = new appMeta.MetaData('table1');

            objrow8 = {id1: 11, id2: 3, c3: "rowmiddle1"};
            objrow9 = {id1: 11, id2: 4, c3: "rowmiddle2"};
            objrow8 = middle.add(objrow8).current;
            objrow9 = middle.add(objrow9).current;
            middle.acceptChanges();
            state.DS = ds;
            state.meta  = new appMeta.MetaData('table1');

            // creo le 2 relazioni parent
            ds.newRelation("r1", "table1", ["id1"], "middle", ["id1"]);
            ds.newRelation("r2", "table2", ["id2"], "middle", ["id2"]);

            // mock funzione asyn describeColumns()
            appMeta.MetaData.prototype.describeColumns = function() {
                return new $.Deferred().resolve();
            };
            // mock funzione utilizzata nella preFill. (la tabella della lista è già popolata a mano sopra)
            appMeta.getData.runSelectIntoTable = function () {
                return new $.Deferred().resolve();
            };
            appMeta.getData.multiRunSelect = function () {
                return new $.Deferred().resolve();
            };
            appMeta.config.defaultDecimalFormat = "g";
            appMeta.config.defaultDecimalPrecision = 0;

            // inizializzo metapage, usata in AddEvents
            metapage = new MetaPage('table1', 'def', true);
            metapage.state = state;

            // inizializzo la form
            helpForm = new HelpForm(state, "table1", "#rootelement");
            metapage.helpForm  = helpForm;
            var mainwin = '<div id="rootelement">' +
                '<div id="check1" data-tag="table2.default.default" data-custom-control="checklist"></div>' +
                '</div>';
            $("html").html(mainwin);
            // aggiungo stili, così a runtime li vedo
            $('body').append('<link rel="stylesheet" href="/base/test/app/styles/bootstrap/css/bootstrap.css" />');
            $('body').append('<link rel="stylesheet" href="/base/test/app/styles/app.css">');

            helpForm.preScanControls()
            .then(()=>{
                helpForm.addEvents(metapage);
                check1 = $("#check1").data("customController");
                done();
            });

        });

        afterAll(function () {
            appMeta.basePath = "/";
        });

        it("getMiddleTable returns the 'middle' table", function () {
            var m = check1.getMiddleTable(t1, t2);
            expect(m).toBe(middle);
        });
                
        it("preFill populates the list, with first column with checkboxes", function (done) {

            helpForm.lastSelected(t1, objrow6);
            check1.preFill($("#check1"),{tableWantedName:"table2"})
                .then(function() {
                    expect($("#check1").find("tr").length).toBe(6);

                    // controllo che sulla prima colonna ci siano checkbox
                    var tr1 = $("#check1").find("tr")[1];
                    var td1 = $(tr1).find("td")[0];
                    var inputType =  $(td1).find("input").attr("type");
                    expect(inputType).toBe("checkbox");

                    var countExpect = 0;
                    _.forEach($("#check1").find("tr"), function (tr, index) {
                        if (index > 0){
                            var tds  = $($(tr)[0]).find("td");

                            _.forEach(tds, function (td, indexTd) {
                                var inputType =  $(td).find("input").attr("type");
                                // nella prima ci sono checkbox
                                if (indexTd === 0){
                                    expect(inputType).toBe("checkbox");
                                } else {
                                    expect(inputType).not.toBe("checkbox");
                                }
                                countExpect++;
                            });
                        }
                    });

                    // la prefill esegue anche il fill se nel dt ci sono righe, quindi in questo caso ci sono e valuto
                    var tr1, td1, ischecked;
                    tr1  = $("#check1").find("tr")[1];
                    td1 = $(tr1).find("td")[0];
                    ischecked =  $(td1).find("input").prop("checked");
                    expect(ischecked).toBeFalsy();

                    tr1 = $("#check1").find("tr")[2];
                    td1 = $(tr1).find("td")[0];
                    ischecked =  $(td1).find("input").prop("checked");
                    expect(ischecked).toBeFalsy();

                    tr1 = $("#check1").find("tr")[3];
                    td1 = $(tr1).find("td")[0];
                    ischecked =  $(td1).find("input").prop("checked");
                    expect(ischecked).toBeTruthy();

                    tr1 = $("#check1").find("tr")[4];
                    td1 = $(tr1).find("td")[0];
                    ischecked =  $(td1).find("input").prop("checked");
                    expect(ischecked).toBeTruthy();

                    tr1 = $("#check1").find("tr")[5];
                    td1 = $(tr1).find("td")[0];
                    ischecked =  $(td1).find("input").prop("checked");
                    expect(ischecked).toBeFalsy();

                    expect(countExpect).toBe(15); // 5 righe dati per tre colonne
                    done();
                });

        }, 5000);

        it("preFill populates + fillcontrol selects checkboxes", function (done) {

            helpForm.lastSelected(t1, objrow6);
            check1.preFill($("#check1"),{tableWantedName:"table2"})
                .then(function() {
                    check1.fillControl($("#check1"))
                      .then(function () {
                          var tr1, td1, ischecked;
                          tr1  = $("#check1").find("tr")[1];
                          td1 = $(tr1).find("td")[0];
                          ischecked =  $(td1).find("input").prop("checked");
                          expect(ischecked).toBeFalsy();

                          tr1 = $("#check1").find("tr")[2];
                          td1 = $(tr1).find("td")[0];
                          ischecked =  $(td1).find("input").prop("checked");
                          expect(ischecked).toBeFalsy();

                          tr1 = $("#check1").find("tr")[3];
                          td1 = $(tr1).find("td")[0];
                          ischecked =  $(td1).find("input").prop("checked");
                          expect(ischecked).toBeTruthy();

                          tr1 = $("#check1").find("tr")[4];
                          td1 = $(tr1).find("td")[0];
                          ischecked =  $(td1).find("input").prop("checked");
                          expect(ischecked).toBeTruthy();

                          tr1 = $("#check1").find("tr")[5];
                          td1 = $(tr1).find("td")[0];
                          ischecked =  $(td1).find("input").prop("checked");
                          expect(ischecked).toBeFalsy();

                          done();
                       });
                });

        }, 5000);

        it("preFill populates + fillcontrol selects checkboxes + select check + getcontrol -> ds has changes", function (done) {

            helpForm.lastSelected(t1, objrow6);
            check1.preFill($("#check1"),{tableWantedName:"table2"})
                .then(function() {
                    check1.fillControl($("#check1"))
                        .then(function () {
                            var tr1,tr2,tr3,tr4,tr5, td1,td2,td3,td4,td5, ischecked;
                            tr1  = $("#check1").find("tr")[1];
                            td1 = $(tr1).find("td")[0];
                            ischecked =  $(td1).find("input").prop("checked");
                            expect(ischecked).toBeFalsy();

                            tr2= $("#check1").find("tr")[2];
                            td2 = $(tr2).find("td")[0];
                            ischecked =  $(td2).find("input").prop("checked");
                            expect(ischecked).toBeFalsy();

                            tr3 = $("#check1").find("tr")[3];
                            td3 = $(tr3).find("td")[0];
                            ischecked =  $(td3).find("input").prop("checked");
                            expect(ischecked).toBeTruthy();

                            tr4 = $("#check1").find("tr")[4];
                            td4 = $(tr4).find("td")[0];
                            ischecked =  $(td4).find("input").prop("checked");
                            expect(ischecked).toBeTruthy();

                            tr5 = $("#check1").find("tr")[5];
                            td5 = $(tr5).find("td")[0];
                            ischecked =  $(td5).find("input").prop("checked");
                            expect(ischecked).toBeFalsy();

                            // seleziono primo check e deseleziono il terzo che era selezionato
                            $(td1).find("input").prop("checked", true);
                            $(td3).find("input").prop("checked", false);
                            // invoco funzione
                            check1.getControl();

                            // verifico che il ds abbia le righe nello stato che mi aseptto
                            // la objrow8 è la stessa della num zero del ds
                            expect(middle.rows[0]).toBe(objrow8);
                            expect(middle.rows[0].getRow().state).toBe(jsDataSet.dataRowState.deleted); // deselezionata

                            expect(middle.rows[1].getRow().state).toBe(jsDataSet.dataRowState.unchanged); // non ho fatto nulla su questa riga
                            expect(middle.rows[2].getRow().state).toBe(jsDataSet.dataRowState.added); // selezionata

                            // verifico che la riga added sia quella che mia aspetto
                            expect(middle.rows[2].getRow().current.id1).toBe(11);
                            expect(middle.rows[2].getRow().current.id2).toBe(1);
                            done();
                        });
                });

        }, 5000);

        
        
    });
