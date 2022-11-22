(function () {

   var timeout = 3000000;
   var stabilizeToCurrent = appMeta.stabilizeToCurrent;
   var stabilize = appMeta.stabilize;
   var testHelper = appMeta.testHelper;
   var common = appMeta.common;
   var controlTypeEnum = appMeta.testHelper.controlTypeEnum;
   var enumLogType = appMeta.testHelper.enumLogType;
   var dataRowState = jsDataSet.dataRowState;
   function TestCase() {
   }

   TestCase.prototype = {
      constructor: TestCase,

      /**
       * 1. Open MetaPage
       * 2. Close MetaPage
       * @param {string} tablename
       * @param {string} edittype
       * @returns {Deferred} returns deferred when test ends
       */
      testMetaPageCase0: function (tablename, edittype) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 3; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase0');
         // Eseguo login
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;
               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);
                     var s = stabilize();
                     // premo bottone di "Chiudi"
                     testHelper.clickButtonByTag('mainclose');
                     return s;
                  }).then(function () {
                     countExpect++;
                      expect(appMeta.currApp.currentMetaPage).toBeNull();
                     expect(countExpect).toBe(totExpect);
                     return def.resolve();
                  });

               // Apro la pagina
               appMeta.currApp.callPage(tablename, edittype, false);

            }, timeout);

         return def.promise();
      },

      /**
       * core actions of testMetaPageCase1
       * @param {MetaPage} mp
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput
       * @param prmChecks
       */
      coreTestMetaPageCase1: function (mp, tablename, edittype, arrayInput, prmChecks) {
          var self = this;
         // inizializzo var che contiene bottoni da escludere, ed evito vada in errore
         prmChecks = prmChecks || { exclude: [] };
         if (!prmChecks.exclude) prmChecks.exclude = [];

         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = (_.includes(prmChecks.exclude, "maindelete")) ? 10 : 13; // totale dei rami asincroni in cui il test deve passare

         var def = $.Deferred();

         countExpect++;
         var ds1 = null;
         // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
         testHelper.testMetaPageInitialization(mp, tablename, edittype);

         // TEST SPECIFICO DI PAGINA.
         testHelper.testHtmlNodeByTagExists(arrayInput, true);

         // se parto con un test in cui c'è una curretnMetaPage allora i campi potrebbero essere popolati
         if (!prmChecks.currentMetaPage) testHelper.testHtmlNodeByTagNotFilled(arrayInput, mp);

         // verifica prima la correttezza del dataset rispetto al db
         testHelper.testDatasetCompliant(tablename, edittype)
            .then(function () {
               // si mette in attesa della fine dell'evento del bottone di insert.
               // N.B non posso usare lo stabileToCurrnet poichè tornano nel mentre le chaimate ai ws delle describeColumns che quindi mi risolvono l'instabilità
               // e non va bene. Son costretto ad usare l'evento, quindi poi dalla usccessiva instabilità tutto sarà ok.
               common.eventGlobalWaiter(mp, appMeta.EventEnum.buttonClickEnd)
                  .then(function () {
                     countExpect++;
                     // verifico i valori di default che ho nel vettore di configurazione.
                     testHelper.testDefaultValues(arrayInput);

                     testHelper.log("Popolo i controlli con i valori di input");
                     // inserisco valori obbligatori, presi dai value dell'array di input
                     return testHelper.insertValueNodeByTagAsync(arrayInput, mp.helpForm, false)
                  }).then(function () {
                     countExpect++;
                     var s3 = stabilizeToCurrent();
                     // 3. premo bottone di "salva"
                     testHelper.log("Premo Salva");
                     // Messaggio conferma per la cancellazione. premo ok
                     common.eventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
                        testHelper.log("Tento di Premere ignora e salva");
                        if ($(".modal-footer .procedureMessage_btn_ignoreandsave").length) {
                           testHelper.log("Premuto ignora e salva");
                           $(".modal-footer .procedureMessage_btn_ignoreandsave").click();
                        }
                     });

                     ds1 = mp.state.DS;
                     testHelper.clickButtonByTag('mainsave');
                     return s3;
                  }).then(function () {
                     countExpect++;
                     // non appare form di errori dopo il salvataggio
                     expect($(".procedureMessage_grid").length).toBe(0);
                     var s4 = stabilizeToCurrent();
                     // 4. premo "vai alla ricerca"
                     testHelper.log("Premo Vai alla ricerca");
                     testHelper.clickButtonByTag('mainsetsearch');
                     return s4;
                  }).then(function () {
                     countExpect++;
                     // testo campi vuoti dopo bottone vai alla ricerca
                     testHelper.testHtmlNodeByTagNotFilled(arrayInput, mp);
                     // Re-inserisco valori precedentemente inseriti da cercare
                     testHelper.log("Popolo controlli con i valori per la ricerca");
                     return testHelper.insertValueNodeByTagAsync(arrayInput, mp.helpForm, true)
                  }).then(function () {
                     countExpect++;
                     var s5 = stabilizeToCurrent();
                     // 5. premo "Effettua ricerca" per verificare record appena inserito
                     testHelper.log("Premo Effettua ricerca");
                     testHelper.clickButtonByTag('maindosearch');
                     return s5;
                  }).then(function () {
                     // verifico che i campi siano quelli inseriti
                     testHelper.testHtmlNodeByTagFilledValue(arrayInput, mp);
                     countExpect++;
                     var s3 = stabilizeToCurrent();
                     // 3. premo bottone di "salva"
                     testHelper.log("Ripremo Premo Salva su oggetto appena riletto");
                     // Messaggio conferma per la cancellazione. premo ok
                     common.eventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
                        testHelper.log("Tento di Premere ignora e salva");
                        if ($(".modal-footer .procedureMessage_btn_ignoreandsave").length) {
                           testHelper.log("Premuto ignora e salva");
                           $(".modal-footer .procedureMessage_btn_ignoreandsave").click();
                        }
                     });
                     mp.canSave = true;
                     testHelper.clickButtonByTag('mainsave');
                     return s3;
                  }).then(function () {
                     countExpect++;
                     // verifico che i campi siano quelli inseriti
                     testHelper.testHtmlNodeByTagFilledValue(arrayInput, mp);

                     // qui devo verifica re se ci sono treecustom che ho popolato nel primo inseiremnto,
                     // poichè in quel caso devo navigare fino nella subpage riempirle e poi salvare,
                     // solo dopo rivado avcanti nel test
                     return self.checkTreeCustomToPopulateSubPage(mp, tablename, edittype, arrayInput);
                  })
                   .then(function () {
                       // verifico che i campi siano quelli inseriti
                       testHelper.testHtmlNodeByTagFilledValue(arrayInput, mp, true);
                       // se devo escludere di fare la delete vado avanti
                       if ((_.includes(prmChecks.exclude, "maindelete"))) return $.Deferred().resolve();

                       var s6 = stabilizeToCurrent();
                       // Messaggio conferma per la cancellazione. premo ok
                       common.eventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
                           countExpect++;
                           $(".modal").find("button")[1].click();
                       });
                       // 6. premo "Delete"
                       mp.canCancel = true;
                       testHelper.log("Premo Delete della riga");
                       testHelper.clickButtonByTag('maindelete');
                       return s6;
                   })
                   .then(function () {

                     // se devo escludere di fare la delete vado avanti
                     if ((_.includes(prmChecks.exclude, "maindelete"))) return $.Deferred().resolve();

                     countExpect++;
                     // testo campi vuoti dopo cancellazione
                     testHelper.testHtmlNodeByTagNotFilled(arrayInput, mp);

                     // Re-inserisco id, precedentemente inserito, da cercare
                     testHelper.log("Popolo controlli per rieffettuare la ricerca");
                     return testHelper.insertValueNodeByTagAsync(arrayInput, mp.helpForm, true);
                  }).then(function () {

                     // se devo escludere di fare la delete vado avanti
                     if ((_.includes(prmChecks.exclude, "maindelete"))) return $.Deferred().resolve();

                     var s7 = stabilizeToCurrent();
                     // 7. premo "Effettua ricerca" per verificare record inserito non trovato perchè cancellato
                     testHelper.log("Rieffettuo la ricerca");
                     testHelper.clickButtonByTag('maindosearch');
                     // Premo ok sul msgbox di riga non trovata
                     common.eventWaiter(mp, appMeta.EventEnum.showModalWindow).then(function () {
                        countExpect++;
                        testHelper.log("Premuto \"ok riga non trovata\"");
                        $(".modal").find("button")[0].click();
                     });
                     return s7;
                  }).then(function () {
                     var s8;
                     if (prmChecks.currentMetaPage) s8 = stabilizeToCurrent(); // c'è la chiamante quindi deffered ancora aperti
                     if (!prmChecks.currentMetaPage) s8 = stabilize();
                     mp.canCancel = true;
                     countExpect++;
                     // 8. premo bottone di "Chiudi". Mi attendo che la stabilize vada nel then quando tutti i deferred sono chiusi
                     testHelper.log("Chiudo pagina");
                     testHelper.clickButtonByTag('mainclose');
                     return s8;
                  }).then(function () {
                     countExpect++;
                      if (prmChecks.currentMetaPage) expect(appMeta.currApp.currentMetaPage).not.toBeNull();
                      if (!prmChecks.currentMetaPage) expect(appMeta.currApp.currentMetaPage).toBeNull();

                     testHelper.testHtmlNodeByTagExists(arrayInput, false);
                     expect(countExpect).toBe(totExpect);
                     return def.resolve();
                  });

               // 2. premo bottone di "Nuovo"
               testHelper.clickButtonByTag('maininsert');
            });

         return def.promise();
      },


       checkTreeCustomToPopulateSubPage: function(mp, tablename, edittype, arrayInput) {
          var self = this;
          var def = $.Deferred();
          // se non avevo trovato treecustom esce e prosegue come nel caso normale
          if (!appMeta.dictTestAuxTree) {
              return def.resolve();
          }

          // all'interno della metapage cerca un controllo griglia con tname ed edittype
          var getGridInMetaPage = function (mp, tname, edidtype) {
               var grid;
              _.forEach($(mp.rootElement).find("[data-custom-control=gridx]"), function (elGrid) {
                    var tag = $(elGrid).data("tag");
                    var tagArray = tag.split(".");
                    var treeTableName = tagArray[0];
                    var treeEditType = tagArray[2];

                    if (treeTableName === tname && edidtype === treeEditType) {
                        grid = elGrid;
                        return false;
                    }
              });
              return grid;
          };

          // accetta {tname, edittype}
          var navigateSubPage = function (metaPageCurrent, treeInfo, paths, index) {
                var def = $.Deferred();
                // recupero sulla metaPageCurrent il controllo griglia su cui poi devo preemre il tasto edit sulla prima riga dei dati
                var pathTNameEdittype = paths[index];

                if (paths.length > index) {

                    // recupero il grid che ha tname ed edittype del path pathTNameEdittype
                    // e premo edit.
                    var grid = getGridInMetaPage(metaPageCurrent, pathTNameEdittype.tname, pathTNameEdittype.edittype);

                    if (!grid) {
                        testHelper.log("Errore non ho trovato il grid o tree " + treeInfo.tname +  " navigando le subpage");
                        return def.resolve();
                    }

                    // si è aperta la sub page quindi vado in ricorsione.
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function (metaPageDetail) {
                            // si è aperta la mp di livello k.
                            var pathTNameEdittypeNavigated = paths[index + 1];
                             navigateSubPage(metaPageDetail, treeInfo, paths, index + 1)
                                .then(function () {
                                    // al ritorno premo su salva, cioè ok.
                                    common.eventWaiter(metaPageCurrent, appMeta.EventEnum.editClick)
                                        .then(function () {
                                            // ckeck sui due nodi sul tree TODO
                                            testHelper.log("torno su chiamante da dettaglio del treecustom: " + metaPageDetail.primaryTableName + '-' + metaPageDetail.editType);
                                            // torno sulla meta page chiamante
                                            return def.resolve();
                                        });

                                    // 3. premo bottone di "MainSave", cioè "Ok" nel dettaglio che effettua la propagate e torna al chiamante
                                    // se sto su principale sarà un save
                                    testHelper.clickButtonByTag('mainsave', ' tree dettaglio - ' + metaPageDetail.primaryTableName + '-' + metaPageDetail.editType);
                                })
                        });
                    testHelper.log("devo trovare subpage del tree - navigo verso sub page tramite dblclick su grid " + treeInfo.tname );
                    // clicco la prima riga dati, prima colonna, tastino di edit.
                    $(grid).find("tr").eq(1).find('td').eq(0).find("[data-mdleditbtn]").click();

                } else {
                    // termina la ricorsione
                    // sto sulla metaPage che contiene l'albero
                    var dttree = metaPageCurrent.getDataTable(treeInfo.tname);

                    var ctrl = $(metaPageCurrent.rootElement).find("[data-custom-control=treecontrol]").data('customController');
                    // clicco sul nodo, cioè imposto la currentRow del tree della metapage corrente
                    ctrl.currentRow = dttree.rows[0];

                    // attendo che si apra il dettaglio
                    testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function (metaPageDetail) {
                            // recupero tablename ed edittype dal tag della griglia
                            var detailTableName = treeInfo.tname;
                            var detailEditType = treeInfo.edittype;

                            // in caso di alias deve prendere il tableForRading
                            detailTableName = metaPageDetail.state.DS.tables[detailTableName].tableForReading();

                            // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                            // in questo caso è la metaPage dettaglio aperta dal grid
                            testHelper.testMetaPageInitialization(metaPageDetail, detailTableName, detailEditType);

                            // recupero dal file del dettaglio opportuno gli input
                            var detailTestPrototype = 'appMeta.' + detailTableName + '_' + detailEditType;
                            var myinstance = eval(detailTestPrototype);
                            if (!myinstance) console.log(detailTestPrototype + " not FOUND");
                            var arrayInputDetail = myinstance.arrayInput;

                            // TEST SPECIFICO DI PAGINA.
                            testHelper.testHtmlNodeByTagExists(arrayInputDetail, true);
                            testHelper.testDefaultValues(arrayInputDetail);
                            // sul dettaglio il tasto close
                            expect($("button[data-tag='mainclose']").is(":visible")).toBeFalsy();

                            testHelper.log("Inserisco su dettaglio del treecustom" + detailTableName + '-' + detailEditType);
                            // 2. inserisco i dati nel dettaglio, ricorsivamente

                            // esegue il test comune di pagina per verificare la correttezza del dataset con il database
                            testHelper.testDatasetCompliant(detailTableName, detailEditType).then(function () {
                                return testHelper.insertValueNodeByTagAsync(arrayInputDetail, metaPageDetail.helpForm, false)
                            }).then(function () {
                                // attendo la fine del tasto di add sulla metaPage chiamante
                                common.eventWaiter(metaPageCurrent, appMeta.EventEnum.insertClick)
                                    .then(function () {
                                        // ckeck sui due nodi sul tree TODO

                                        testHelper.log("torno su principale da dettaglio del treecustom: " + detailTableName + '-' + detailEditType);
                                        // torno sulla meta page chiamante
                                        return def.resolve();
                                    });

                                // 3. premo bottone di "MainSave", cioè "Ok" nel dettaglio che effettua la propagate e torna al chiamante
                                testHelper.clickButtonByTag('mainsave', ' tree dettaglio - ' + detailTableName + '-' + detailEditType);
                            });
                        });
                    // clicco add ()
                    testHelper.log("Apro dettaglio tree: " + treeInfo.tname);
                    ctrl.insertClick(ctrl);

                }

              return def.promise();
          };

          // treeInfo ha 3 propriertà: { tname, edittype, path:[{tname, edittype}, {tname, edittype}]}
          var fillTreeCustomPopulate = function (metaPageMain, treeInfo) {
               var def = $.Deferred();
               var paths = treeInfo.pathArray;
               // passo indice 1 , perchè 0 è la pag principale del test
               navigateSubPage(metaPageMain, treeInfo, paths, 1)
                   .then(function () {
                       // 3. premo bottone di "salva"
                       testHelper.log("Ripremo Premo Salva perchè ho popolato la subpage del treecustom " + treeInfo.tname );
                       // Messaggio conferma per la cancellazione. premo ok
                       common.eventWaiter(metaPageMain, appMeta.EventEnum.showModalWindow).then(function () {
                           testHelper.log("Tento di Premere ignora e salva");
                           if ($(".modal-footer .procedureMessage_btn_ignoreandsave").length) {
                               testHelper.log("Premuto ignora e salva");
                               $(".modal-footer .procedureMessage_btn_ignoreandsave").click();
                           }
                       });

                       // attendo inserisci copia
                       common.eventGlobalWaiter(metaPageMain, appMeta.EventEnum.buttonClickEnd)
                           .then(function () {
                               return def.resolve();
                           });

                       testHelper.clickButtonByTag('mainsave');
               });

              return def.promise();
          };

          var chainFilltree = $.when();
          _.forEach(appMeta.dictTestAuxTree, function (treeInfo) {
              chainFilltree = chainFilltree.then(function () {
                  return fillTreeCustomPopulate(mp, treeInfo);
              });
          });

           return chainFilltree;
       },

      /**
       * Uses stabilize() and stabilizeToCurrent instead event
       *  1. callPage() table:tablename, editType:edittype" should be async and return data. '
       * '2. Press "maininsert" -> new row is created'
       * '3. Fills mandatory fields and press "mainsave"'
       * '4. Press "mainsetsearch, fields are empty' redo a mainsave immediatly
       * '5. Press "maindosearch, record is found'
       * '6. Press "maindelete, deletes the record'
       * '7. Press "maindosearch, record is not found'
       * '8. Press "mainclose" -> page is closed
       *
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput array of configuration objects {tag:string, value:string, type:controlTypeEnum}
       * @param {object} prmChecks {currentMetaPage:boolean (default undefined|false)} parameters passed externally for specific checks
       * @returns {Deferred} returns deferred when test ends
       */
      testMetaPageCase1: function (tablename, edittype, arrayInput, prmChecks) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 3; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         prmChecks = prmChecks || {};
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase1');
         // Eseguo login
         testHelper.log("Eseguo Login");
         var self = this;
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;

               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                      // forzo esistenza bottone insert, per quelle pagine che ce l'hanno disabilitato
                     metaPage.canInsert = true;
                     metaPage.canCancel = true;

                     countExpect++;
                     return self.coreTestMetaPageCase1(metaPage, tablename, edittype, arrayInput, prmChecks);
                  }).then(function () {
                     countExpect++;
                     expect(countExpect).toBe(totExpect);
                     def.resolve();
                  });

               //  1.  Apro la pagina
               var wantsRow = prmChecks ? !!prmChecks.currentMetaPage : false;
               testHelper.log("Apro pagina " + tablename + "_" + edittype);

               // CHECK SU PAGINE CHE PARTONO IN RICERCA
               // Esegue reset del filtro firstSearchFilter
               // intercetto il emtodo della classe base afterLink
               appMeta.MetaEasyPage.prototype.afterLink = function (e) {
                   appMeta.currApp.currentMetaPage.firstSearchFilter = null;
                   return appMeta.MetaPage.prototype.afterLink.call(appMeta.currApp.currentMetaPage);
               };
               // ** fine mod PAGINE CHE PARTONO IN RICERCA

                appMeta.currApp.callPage(tablename, edittype, wantsRow);

            }, timeout);

         return def.promise();
      },

       testMetaPageCaseTree1: function (tablename, edittype, arrayInput, prmChecks) {
           var countExpect = 0; // contatore dei rami asincorni
           var totExpect = 3; // totale dei rami asincroni in cui il test deve passare
           var def = $.Deferred();
           prmChecks = prmChecks || {};
           testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCaseTree1');
           // Eseguo login
           testHelper.log("Eseguo Login");
           var self = this;
           appMeta.authManager.login(
               appMeta.configDev.userName,
               appMeta.configDev.password,
               appMeta.configDev.datacontabile)
               .then(function (res) {
                   expect(res).toBe(true);
                   countExpect++;

                   // Evento di attesa pagina caricata
                   testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                       .then(function (metaPage) {
                           countExpect++;
                           return self.coreTestMetaPageCaseTree1(metaPage, tablename, edittype, arrayInput, prmChecks);
                       }).then(function () {
                           countExpect++;
                           expect(countExpect).toBe(totExpect);
                           def.resolve();
                       });

                   //  1.  Apro la pagina
                   var wantsRow = prmChecks ? !!prmChecks.currentMetaPage : false;
                   testHelper.log("Apro pagina " + tablename + "_" + edittype);

                   // CHECK SU PAGINE CHE PARTONO IN RICERCA
                   // Esegue reset del filtro firstSearchFilter
                   // intercetto il emtodo della classe base afterLink
                   appMeta.MetaEasyPage.prototype.afterLink = function (e) {
                       appMeta.currApp.currentMetaPage.firstSearchFilter = null;
                       return appMeta.MetaPage.prototype.afterLink.call(appMeta.currApp.currentMetaPage);
                   };
                   // ** fine mod PAGINE CHE PARTONO IN RICERCA

                   appMeta.currApp.callPage(tablename, edittype, wantsRow);

               }, timeout);

           return def.promise();
       },

       coreTestMetaPageCaseTree1:function(metaPage, tablename, edittype, arrayInput, prmChecks) {

           var def = $.Deferred();

           // termina la ricorsione
           // sto sulla metaPage che contiene l'albero
           var dttree = metaPage.getDataTable(tablename);
           var rowsCount = dttree.rows.length;

           // esiste almeno il nodo root
           expect(dttree.rows.length).toBeGreaterThan(0);

           var countExpect = 0; // contatore dei rami asincorni
           var ctrl = $(metaPage.rootElement).find("[data-custom-control=tree]").data('customController');
           // clicco sul nodo, cioè imposto la currentRow del tree della metapage corrente
           ctrl.currentRow = dttree.rows[0];
           metaPage.helpForm.lastSelected(dttree, dttree.rows[0]);

           var ds1 = null;
           // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
           testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

           // TEST SPECIFICO DI PAGINA.
           testHelper.testHtmlNodeByTagExists(arrayInput, true);

           // se parto con un test in cui c'è una curretnMetaPage allora i campi potrebbero essere popolati
           // TODO dovrebbe esserci il dettaglio del nodo root

           common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
               .then(function () {
                   countExpect++;
                   // verifico i valori di default che ho nel vettore di configurazione.
                   testHelper.testDefaultValues(arrayInput);
                   testHelper.log("Popolo i controlli con i valori di input");
                   // inserisco valori obbligatori, presi dai value dell'array di input
                   return testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, false)
               }).then(function () {
                   countExpect++;
                   var s3 = stabilizeToCurrent();
                   // 3. premo bottone di "salva"
                   testHelper.log("Premo Salva pag principale tree");
                   // Messaggio conferma per la cancellazione. premo ok
                   common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                       testHelper.log("Tento di Premere ignora e salva");
                       if ($(".modal-footer .procedureMessage_btn_ignoreandsave").length) {
                           testHelper.log("Premuto ignora e salva");
                           $(".modal-footer .procedureMessage_btn_ignoreandsave").click();
                       }
                   });
                   // seleziono come lastseelcted la riga added
                   var rfiglio = _.find(dttree.rows, function (r) {
                       return r.getRow().state === dataRowState.added;
                   });
                   metaPage.helpForm.lastSelected(dttree, rfiglio);
                   testHelper.clickButtonByTag('mainsave');
                   return s3;
           }).then(function () {
               // TODO vedere veriifca nodo del tree
               expect(dttree.rows.length).toBe(rowsCount + 1);
               // verifico che i campi siano quelli inseriti
               testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage, true);
               // se devo escludere di fare la delete vado avanti
               if ((_.includes(prmChecks.exclude, "maindelete"))) return $.Deferred().resolve();

               var s6 = stabilizeToCurrent();
               // Messaggio conferma per la cancellazione. premo ok
               common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                   countExpect++;
                   $(".modal").find("button")[1].click();
               });
               // 6. premo "Delete"
               testHelper.log("Premo Delete della riga");
               testHelper.clickButtonByTag('maindelete');
               return s6;
           }).then(function () {
               // TODO vedere veriifca nodo del tree del passaggio precedente non più esistente
               var s8;
               expect(dttree.rows.length).toBe(rowsCount);
               if (prmChecks.currentMetaPage) s8 = stabilizeToCurrent(); // c'è la chiamante quindi deffered ancora aperti
               if (!prmChecks.currentMetaPage) s8 = stabilize();

               countExpect++;
               // 8. premo bottone di "Chiudi". Mi attendo che la stabilize vada nel then quando tutti i deferred sono chiusi
               testHelper.log("Chiudo pagina");
               testHelper.clickButtonByTag('mainclose');
               return s8;
           }).then(function () {
               countExpect++;
               if (prmChecks.currentMetaPage) expect(appMeta.currApp.currentMetaPage).not.toBeNull();
               if (!prmChecks.currentMetaPage) expect(appMeta.currApp.currentMetaPage).toBeNull();

               testHelper.testHtmlNodeByTagExists(arrayInput, false);
               //expect(countExpect).toBe(totExpect);
               return def.resolve();
           });

           // 2. premo bottone di "Nuovo"
           testHelper.clickButtonByTag('maininsert');

           return def.promise();
       },

      /**
       * 1. callPage() table:ccnl, editType:default" should be async and return data. ' + "\n" +
       ' 2. Press "maininsert" -> new row is created' + "\n" +
       ' 3. Press "mainclose" -> page is closed'  + "\n" +
       ' 4. Press "ok" on warning messagebox
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput
       */
      testMetaPageCase2: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 5; // totale dei rami asincroni in cui il test deve passare
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase2');
         var def = $.Deferred();
         // Eseguo login
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;

               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

                     // TEST SPECIFICO DI PAGINA.
                     testHelper.testHtmlNodeByTagExists(arrayInput, true);
                     testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                     // si mette in attesa della fine dell'evento del bottone di insert
                     common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                        .then(function () {
                           countExpect++;

                           // 4. dopo il close attendo messaggio di warning, poichè ho una riga in insert . premo ok
                           common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                              countExpect++;
                              $(".modal").find("button")[1].click();
                           });

                           var s2 = stabilize();

                           // 3. premo bottone di "Chiudi"
                           testHelper.clickButtonByTag('mainclose');

                           s2.then(function () {
                              countExpect++;
                               expect(appMeta.currApp.currentMetaPage).toBeNull();
                              testHelper.testHtmlNodeByTagExists(arrayInput, false);
                              expect(countExpect).toBe(totExpect);
                              return def.resolve();
                           })
                        });

                     // 2. premo bottone di "Nuovo"
                     testHelper.clickButtonByTag('maininsert');

                  });

               //  1.  Apro la pagina
               testHelper.log("Apro pagina");
                appMeta.currApp.callPage(tablename, edittype, false);

            }, timeout);

         return def.promise();
      },

      /**
       * Test for page attivformproped_default. Called by manage of didprog.
       * Simulates a fake  callingPage
       *  1. callPage() table:tablename, editType:edittype" should be async and return data. '
       * '2. Press "maininsert" -> new row is created'
       * '3. Fills mandatory fields and press "mainsave"'
       * '4. Press "mainsetsearch, fields are empty'
       * '5. Press "maindosearch, record is found'
       * '6. Press "maindelete, deletes the record'
       * '7. Press "maindosearch, record is not found'
       * '8. Press "mainclose" -> page is closed
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput array of configuration objects {tag:string, value:string, type:controlTypeEnum}
       * @param {object} callPrm. {object with the id passed by Calling MetaPage. Represents the "attività formativa propedeutica".
       * @returns {Deferred} returns deferred when test ends
       */
      testMetaPage_pageCallerButton: function (tablename, edittype, arrayInput, callPrm) {
         // simulo una pag chiamante per popolare i callingParameters
         // Deve partire con iddidprog che ha almeno un gruppo, altrimenti parte con la ricerca
         // e dovrei premere ok per andare avanti
         var mpCaller = new appMeta.MetaPage(callPrm.parent_tableName, callPrm.parent_editType, false);
         mpCaller.state = new appMeta.MetaPageState();
         // passo i parametri di input
         // _.extend(mpCaller.state.callingParameters, callPrm);
         mpCaller.state.DS = new jsDataSet.DataSet(callPrm.parent_tableName + "_" + callPrm.parent_editType);

         mpCaller.state.currentRow = {};
         Object.assign(mpCaller.state.currentRow, callPrm);

         // assegno alla currentMetaPage la apgina appena creata
          appMeta.currApp.currentMetaPage = mpCaller;
         callPrm = callPrm || {};
         return this.testMetaPageCase1(tablename, edittype, arrayInput, {
            currentMetaPage: true,
            exclude: callPrm.exclude
         }).then(function () {
            // forzo reset della currentMetaPage nel caso il test lasci una currentMetaPage papà
            // aperta. Capita ad esempio nei testa case testMetaPage_pageCallerButton()
            // cioè per pagine chaimate tramite un "manage" e che quindi hanno simulata una currMetaPage
             appMeta.currApp.currentMetaPage = null;
            return true;
         })
      },

      /**
       * TODO per test ricerca inziale con record
       * @param tablename
       * @param edittype
       * @param arrayInput
       * @returns {*}
       */
      testMetaPageCase3: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 10; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase1_v0');
         // Eseguo login
         testHelper.log("Eseguo Login per test " + tablename + "_" + edittype);
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;

               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

                     // TEST SPECIFICO DI PAGINA.
                     testHelper.testHtmlNodeByTagExists(arrayInput, true);
                     testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                     return def.resolve();
                  });

               //  1.  Apro la pagina
               testHelper.log("Apro pagina");
                appMeta.currApp.callPage(tablename, edittype, false);

            }, timeout);

         return def.promise();
      },

      /**
       * Test for insert and insertcopy
       * 1. callPage() table:tablename, editType:edittype" should be async and return data. '
       * 2. Press "maininsert" -> new row is created'
       * 3. Fills mandatory fields and press "mainsave"'
       * 4. Press "maininsertcopy, object are copied'
       * 5. Press "mainsave, object are saved'
       * 6. Pres "mainsetsearch"
       * 7. Press "maindosearch"  find 2 rows
       * 8. Click on 1st row on list
       * 9. Press "maindelete"
       * 10. Press "mainsetsearch, fields are empty'
       * 11. Press "maindosearch, record is found'
       * 12. Press "maindelete, deletes the record, the copy
       * 13. Press "maindosearch, record is not found'
       * 14. Press "mainclose" -> page is closed
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput array of configuration objects {tag:string, value:string, type:controlTypeEnum}
       * @returns {Deferred} returns deferred when test ends
       */
      testMetaPageCase4: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 17; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase4');
         // Eseguo login
         testHelper.log("Eseguo Login per test " + tablename + "_" + edittype);
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;
               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

                     // TEST SPECIFICO DI PAGINA.
                     testHelper.testHtmlNodeByTagExists(arrayInput, true);
                     testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                     // si mette in attesa della fine dell'evento del bottone di insert
                     common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                        .then(function () {
                           countExpect++;
                           // verifico i valori di default che ho nel vettore di configurazione.
                           testHelper.testDefaultValues(arrayInput);

                           testHelper.log("Inserisco valori dal vettore di input per inserimento");
                           // inserisco valori obbligatori, presi dai value dell'array di input
                           testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, false).then(function () {
                              // attendo bottone save
                              common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                 .then(function () {
                                    countExpect++;
                                    // verifico che i campi siano quelli inseriti
                                    testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage);
                                    // non appare form di errori dopo il salvataggio
                                    expect($(".procedureMessage_grid").length).toBe(0);

                                    // Messaggio conferma per la copia. premo "conferma"
                                    common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                                       countExpect++;
                                       $(".modal").find("button")[1].click();
                                    });

                                    // attendo inserisci copia
                                    common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                       .then(function () {

                                          // attendo bottone save
                                          common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                             .then(function () {
                                                countExpect++;
                                                // verifico che i campi siano quelli inseriti
                                                testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage);
                                                // non appare form di errori dopo il salvataggio
                                                expect($(".procedureMessage_grid").length).toBe(0);

                                                // attendo vai alla ricerca
                                                common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                   .then(function () {
                                                      countExpect++;
                                                      // testo campi vuoti dopo bottone vai alla ricerca
                                                      testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                                                      // Re-inserisco valori precedentemente inseriti da cercare
                                                      testHelper.log("Re-inserisco valori dal vettore di input per la ricerca");
                                                      testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, true)
                                                         .then(function () {

                                                            // Attendo la ricerca
                                                            common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                               .then(function () {
                                                                  countExpect++;

                                                                  var datatag = tablename + "." + edittype;
                                                                  // verifico che ci sono 2 record trovati + 1 header
                                                                  expect($("div[data-tag='" + datatag + "'] .table").find("tr").length).toBe(3);

                                                                  var s = stabilizeToCurrent();
                                                                  // 8. clicco su prima riga trovata
                                                                  testHelper.log("premo su elenco 1o record trovato");
                                                                  $("div[data-tag='" + datatag + "'] .table").find("tr").eq(1).click();
                                                                  s.then(function () {

                                                                     countExpect++;

                                                                     // verifico che i campi siano quelli inseriti
                                                                     testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage);

                                                                     // Messaggio conferma per la cancellazione. premo ok
                                                                     common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                                                                        countExpect++;
                                                                        $(".modal").find("button")[1].click();
                                                                     });

                                                                     // attendo delete 1o record
                                                                     common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                                        .then(function () {
                                                                           countExpect++;

                                                                           // testo campi vuoti dopo bottone vai alla ricerca
                                                                           testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                                                                           // attendo vai alla ricerca
                                                                           common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                                              .then(function () {
                                                                                 countExpect++;
                                                                                 // testo campi vuoti dopo bottone vai alla ricerca
                                                                                 testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                                                                                 // Re-inserisco valori precedentemente inseriti da cercare
                                                                                 testHelper.log("Re-inserisco valori dal vettore di input per la ricerca");
                                                                                 testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, true)
                                                                                    .then(function () {

                                                                                       // Attendo la ricerca
                                                                                       common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                                                          .then(function () {
                                                                                             countExpect++;
                                                                                             // verifico che i campi siano quelli inseriti
                                                                                             testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage);

                                                                                             // Messaggio conferma per la cancellazione. premo ok
                                                                                             common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                                                                                                countExpect++;
                                                                                                $(".modal").find("button")[1].click();
                                                                                             });

                                                                                             // Attendo la cancellazione del record appena inserito, dopo pressione del tasto ok sulla messagebox
                                                                                             common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                                                                .then(function () {
                                                                                                   countExpect++;
                                                                                                   // testo campi vuoti dopo bottone vai alla ricerca
                                                                                                   testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                                                                                                   // Re-inserisco id, precedentemente inserito, da cercare
                                                                                                   testHelper.log("Re-nserisco valori dal vettore di input per la ricerca dopo cancellazione");
                                                                                                   testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, true).then(function () {

                                                                                                      // Premo ok sul msgbox di riga non trovata
                                                                                                      common.eventWaiter(metaPage, appMeta.EventEnum.showModalWindow).then(function () {
                                                                                                         countExpect++;
                                                                                                         $(".modal").find("button")[0].click();
                                                                                                      });

                                                                                                      // attendo pressione ok su msgbox di avviso riga non trovata
                                                                                                      common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                                                                                                         .then(function () {

                                                                                                            var s2 = stabilize();
                                                                                                            // 14. premo bottone di "Chiudi". Mi attendo che la stabilize vada nel then quando tutti i deferred sono chiusi
                                                                                                            testHelper.clickButtonByTag('mainclose');
                                                                                                            s2.then(function () {
                                                                                                               countExpect++;
                                                                                                                expect(appMeta.currApp.currentMetaPage).toBeNull();
                                                                                                               testHelper.testHtmlNodeByTagExists(arrayInput, false);
                                                                                                               expect(countExpect).toBe(totExpect);
                                                                                                               testHelper.log("Test FINE");
                                                                                                               return def.resolve();
                                                                                                            })
                                                                                                         });


                                                                                                      // 13. premo "Effettua ricerca" per verificare recrod inserito non trovato perchè cancellato
                                                                                                      testHelper.clickButtonByTag('maindosearch');
                                                                                                   });

                                                                                                });

                                                                                             // 12. premo "Delete"
                                                                                             testHelper.log("Cancello 2o record trovato, cioè la copia");
                                                                                             testHelper.clickButtonByTag('maindelete');

                                                                                          });

                                                                                       // 11. premo "Effettua ricerca" per verificare record appena inserito
                                                                                       testHelper.clickButtonByTag('maindosearch');
                                                                                    });

                                                                              });

                                                                           // 10. premo "vai alla ricerca"
                                                                           testHelper.clickButtonByTag('mainsetsearch');

                                                                        });

                                                                     // 9. premo "delete"
                                                                     testHelper.log("Cancello 1o record trovato");
                                                                     testHelper.clickButtonByTag('maindelete');
                                                                  });

                                                               });

                                                            // 7. premo "Effettua ricerca" per verificare record appena inserito
                                                            testHelper.clickButtonByTag('maindosearch');

                                                         });
                                                   });

                                                // 6. premo "vai alla ricerca"
                                                testHelper.clickButtonByTag('mainsetsearch');

                                             });

                                          // 5. premo bottone di "salva"
                                          testHelper.log("Salvo la copia");
                                          testHelper.clickButtonByTag('mainsave');
                                       });

                                    // 4. premo "inserisci copia"
                                    testHelper.clickButtonByTag('maininsertcopy');
                                 });

                              // 3. premo bottone di "salva"
                              testHelper.clickButtonByTag('mainsave');
                           });

                        });

                     // 2. premo bottone di "Nuovo"
                     testHelper.clickButtonByTag('maininsert');
                  });

               //  1.  Apro la pagina
               testHelper.log("Apro pagina");
                appMeta.currApp.callPage(tablename, edittype, false);

            }, timeout);

         return def.promise();
      },

      /**
       * TEST for page registration of client INSTM
       *  1. callPage() table:tablename, editType:edittype" should be async and return data. '
       * '2. Press "maininsert" -> new row is created'
       * '3. Fills mandatory fields and press "cmd custom"'
       *
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput array of configuration objects {tag:string, value:string, type:controlTypeEnum}
       * @returns {Deferred} returns deferred when test ends
       */
      testCasePage_registry_instmuser_custom: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 4; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testCasePage_registry_instmuser_custom');

         // N.B non richiede Login. Lavora con connessione anonima

         // Evento di attesa pagina caricata
         testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
            .then(function (metaPage) {
               countExpect++;
               // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
               testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

               // TEST SPECIFICO DI PAGINA.
               testHelper.testHtmlNodeByTagExists(arrayInput, true);
               testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);
               testHelper.log("Invoco comando di inserimento nuova riga automaticamente");
               metaPage.doMainCommand("maininsert")
                  .then(function () {
                     appMeta.localResource.modalLoader_wait_insert = self.stringOriginal;

                     countExpect++;
                     // verifico i valori di default che ho nel vettore di configurazione.
                     testHelper.testDefaultValues(arrayInput);

                     // inserisco valori obbligatori, presi dai value dell'array di input
                     testHelper.log("Inserisco valori di input");
                     testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, false).then(function () {
                        countExpect++;
                        testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage);
                        testHelper.log("Premo bottone per la registrazione");
                        metaPage.firereg_btn_id(metaPage)
                           .then(function () {
                              countExpect++;
                               expect(appMeta.currApp.currentMetaPage).toBeNull();
                              testHelper.log("Termine test testCasePage_registry_instmuser_custom");
                              testHelper.testHtmlNodeByTagExists(arrayInput, false);
                              expect(countExpect).toBe(totExpect);
                              return def.resolve();
                           })
                     });
                  })

            });

         //  1.  Apro la pagina
         testHelper.log("Apro pagina");
          appMeta.currApp.callPage(tablename, edittype, false);


         return def.promise();
      },

      /**
       * As testMetaPageCase1 but uses stabilize() and stabilizeToCurrent instead event
       *  1. callPage() table:tablename, editType:edittype" should be async and return data. '
       * '2. Press "maininsert" -> new row is created'
       * '3. Fills mandatory fields, less subentity and press "mainsave"'
       * '4. Press curriculum button and executes the test for page curriculum, without to press the "delete"
       *  5. Fills the subentity pages (attivform etc..)
       *  6. Save the didprog entity
       *  7. Press "mainsetsearch, fields are empty'
       *  8. Press "maindosearch, record is found'
       *  9. Press deletete
       *  10.Verifies curriculum rows and descendant are deleted
       *  11 Press "mainclose" -> page is closed
       *
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput array of configuration objects {tag:string, value:string, type:controlTypeEnum}
       * @param {object} prmChecks {currentMetaPage:boolean (default undefined|false)} parameters passed externally for specific checks
       * @returns {Deferred} returns deferred when test ends
       */
      testCasePage_didprog_default_custom: function (tablename, edittype, arrayInput, prmChecks) {
         var childEntityName = "curriculum";
         var pageTableToOpen = "didprogcurr";
         var pageEditTypeToOpen = "default";
         var columnNameMainTable = "iddidprog";
         var tableArraySubentityToCheck = ["didprogcurr", "didprogori", "didproganno", "didprogporzanno", "didproggrupp", "didprograppstud", "didprogclassconsorsuale",
            "didprogcurrcaratteristica", "affidamento", "affidamentocaratteristica", "affidamentocaratteristicaora", "affidamentoattach"];
         var parentKeyToPassAsParameters = ["iddidprog", "idcorsostudio"];

         return this.testCasePage_insertMainthenChildWithButtonTheSave(tablename,
            edittype,
            arrayInput,
            prmChecks,
            childEntityName,
            pageTableToOpen,
            pageEditTypeToOpen,
            columnNameMainTable,
            parentKeyToPassAsParameters,
            tableArraySubentityToCheck);
      },

      /**
       *
       * @param tablename
       * @param edittype
       * @param arrayInput
       * @param prmChecks
       * @returns {jQuery}
       */
      testCasePage_insertMainthenChildWithButtonTheSave: function (tablename,
         edittype,
         arrayInput,
         prmChecks,
         childEntityName,
         pageTableToOpen,
         pageEditTypeToOpen,
         columnNameMainTable,
         parentKeyToPassAsParameters,
         tableArray) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 19; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         var mpDidProg;
         prmChecks = prmChecks || {};
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testCasePage_' + tablename + ' ' + edittype + '_custom');
         // Eseguo login
         testHelper.log("Eseguo Login");
         var ds1 = null;
         var self = this;
         var idMainTable; // id della entità principale che verà creata. serve poi per fare i check e le cancellazioni

         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;
               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     mpDidProg = metaPage;
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

                     // TEST SPECIFICO DI PAGINA.
                     testHelper.testHtmlNodeByTagExists(arrayInput, true);

                     // se parto con un test in cui c'è una curretnMetaPage allora i campi potrebbero essere popolati
                     if (!prmChecks.currentMetaPage) testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);

                     // si mette in attesa della fine dell'evento del bottone di insert.
                     // N.B non posso usare lo stabileToCurrnet poichè tornano nel mentre le chaimate ai ws delle describeColumns che quindi mi risolvono l'instabilità
                     // e non va bene. Son costretto ad usare l'evento, quindi poi dalla usccessiva instabilità tutto sarà ok.
                     common.eventGlobalWaiter(metaPage, appMeta.EventEnum.buttonClickEnd)
                        .then(function () {
                           countExpect++;
                           // verifico i valori di default che ho nel vettore di configurazione.
                           testHelper.testDefaultValues(arrayInput);

                           testHelper.log("Popolo i controlli con i valori di input, tranne che le subentity");
                           // inserisco valori obbligatori, presi dai value dell'array di input
                           // escludo le subentity, cioèle griglie.
                           testHelper.insertValueNodeByTagAsync(arrayInput, mpDidProg.helpForm, false, [controlTypeEnum.grid])
                              .then(function () {
                                 countExpect++;
                                 var s3 = stabilizeToCurrent();
                                 // 3. premo bottone di "salva"
                                 testHelper.log("Premo Salva");
                                 ds1 = mpDidProg.state.DS;
                                 testHelper.clickButtonByTag('mainsave');
                                 return s3;
                              }).then(function () {

                                 countExpect++;
                                 // non appare form di errori dopo il salvataggio
                                 expect($(".procedureMessage_grid").length).toBe(0);

                                 // 4. premo "bottone curriculom"
                                 testHelper.log("Premo apertura entità " + childEntityName + " tramite bottoni");

                                 // metto in attesa della'pertura della pagina figlia ("curriculum")
                                 testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                    .then(function (metaPageCurr1) {
                                       countExpect++;
                                       //5. Apro pagina figlia ("curriculum") con vettore di configurazione
                                       var arrayInputCurr = [];
                                       // recupero dal file del dettaglio opportuno gli input
                                       var detailTestPrototype = 'appMeta.' + pageTableToOpen + '_' + pageEditTypeToOpen;
                                       var myinstance = eval(detailTestPrototype);
                                       arrayInputCurr = myinstance.arrayInput;
                                       //arrayInputCurr fine

                                       // chiamo funzione parametrica core che testa da apertura pag in poi
                                       self.coreTestMetaPageCase1(metaPageCurr1, pageTableToOpen, pageEditTypeToOpen, arrayInputCurr,
                                          {
                                             currentMetaPage: true, // informo il test che c'è una mp chiamante
                                             exclude: ["maindelete"] // non eseguo delete
                                          }).then(function () {
                                             countExpect++;
                                             testHelper.log("Inserisco i valori delle subentity su " + tablename);
                                             // 6. popolo tutte le subentity, infatti passo solo gli input di tipo grid.
                                             return testHelper.insertValueNodeByTagAsync(arrayInput, mpDidProg.helpForm, false,
                                                _.filter(controlTypeEnum, function (o) {
                                                   return o !== controlTypeEnum.grid;
                                                }));
                                          }).then(function () {
                                             countExpect++;
                                             var s3 = stabilizeToCurrent();
                                             // 7. premo bottone di "salva"
                                             testHelper.log("Premo Salva su " + tablename);
                                             testHelper.clickButtonByTag('mainsave');
                                             return s3;
                                          }).then(function () {
                                             countExpect++;
                                             // non appare form di errori dopo il salvataggio
                                             expect($(".procedureMessage_grid").length).toBe(0);
                                             var s4 = stabilizeToCurrent();
                                             // 8. premo "vai alla ricerca"
                                             testHelper.log("Premo Vai alla ricerca");
                                             testHelper.clickButtonByTag('mainsetsearch');
                                             return s4;
                                          }).then(function () {
                                             countExpect++;
                                             // 9 testo campi vuoti dopo bottone vai alla ricerca
                                             testHelper.testHtmlNodeByTagNotFilled(arrayInput, mpDidProg);
                                             // Re-inserisco valori precedentemente inseriti da cercare
                                             testHelper.log("Popolo controlli con i valori per la ricerca");
                                             return testHelper.insertValueNodeByTagAsync(arrayInput, mpDidProg.helpForm, true)
                                          }).then(function () {
                                             countExpect++;
                                             var s5 = stabilizeToCurrent();
                                             // 10. premo "Effettua ricerca" per verificare record appena inserito
                                             testHelper.log("Premo Effettua ricerca");
                                             testHelper.clickButtonByTag('maindosearch');
                                             return s5;
                                          }).then(function () {
                                             countExpect++;
                                             // verifico che i campi siano quelli inseriti
                                             testHelper.testHtmlNodeByTagFilledValue(arrayInput, mpDidProg);
                                             var s6 = stabilizeToCurrent();
                                             // Messaggio conferma per la cancellazione. premo ok
                                             common.eventWaiter(mpDidProg, appMeta.EventEnum.showModalWindow).then(function () {
                                                countExpect++;
                                                $(".modal").find("button")[1].click();
                                             });
                                             // 6. premo "Delete"
                                             testHelper.log("Premo Delete della riga di " + tablename);
                                             testHelper.clickButtonByTag('maindelete');
                                             return s6;
                                          }).then(function () {
                                             countExpect++;
                                             // testo campi vuoti dopo bottone vai alla ricerca
                                             testHelper.testHtmlNodeByTagNotFilled(arrayInput, mpDidProg);
                                             // Re-inserisco id, precedentemente inserito, da cercare
                                             testHelper.log("Popolo controlli per rieffettuare la ricerca " + tablename);
                                             return testHelper.insertValueNodeByTagAsync(arrayInput, mpDidProg.helpForm, true)
                                          }).then(function () {
                                             countExpect++;
                                             var s7 = stabilizeToCurrent();
                                             // 7. premo "Effettua ricerca" per verificare record inserito non trovato perchè cancellato
                                             testHelper.log("Rieffettuo la ricerca su " + tablename);
                                             testHelper.clickButtonByTag('maindosearch');
                                             // Premo ok sul msgbox di riga non trovata
                                             common.eventWaiter(mpDidProg, appMeta.EventEnum.showModalWindow).then(function () {
                                                countExpect++;
                                                $(".modal").find("button")[0].click();
                                             });
                                             return s7;
                                          }).then(function () {
                                             countExpect++;
                                             // funzione ausiliaria che verifica se gli tem della tabella figlia sono stati cancellati
                                             var checkNotSubentityDeleted = function (idMainTable) {
                                                var def = $.Deferred();
                                                var self = this;
                                                var selBuilderArray = [];

                                                var idDidProgKey = columnNameMainTable;

                                                var filter = window.jsDataQuery.eq(idDidProgKey, idMainTable);
                                                // costruisco query
                                                _.forEach(tableArray, function (tname) {
                                                   selBuilderArray.push({
                                                      filter: filter,
                                                      top: null,
                                                      tableName: tname,
                                                      table: mpDidProg.state.DS.tables[tname]
                                                   });
                                                });

                                                var rowsFound = false;
                                                appMeta.getData.multiRunSelect(selBuilderArray)
                                                   .then(function () {
                                                      _.forEach(tableArray, function (tname) {
                                                         var currTab = mpDidProg.state.DS.tables[tname];
                                                         rowsFound = _.some(currTab.rows, function (r) {
                                                            return (r[idDidProgKey] === idMainTable)
                                                         });
                                                         // se trovo righe esco dal ciclo, così torno true
                                                         // cioè righe trovate e quindi test fallito!
                                                         if (rowsFound) {
                                                            testHelper.log("Sulla tabella " + tname + " ci sono ancora record con " + columnNameMainTable + " " + idMainTable, enumLogType.err);
                                                            return false;
                                                         }
                                                      });

                                                      def.resolve(rowsFound);
                                                   });

                                                return def.promise();
                                             };
                                             // test se i curriculum  tutti discendneti sono stati eliminati
                                             return checkNotSubentityDeleted(idMainTable);
                                          }).then(function (res) {
                                             if (res) testHelper.log(childEntityName + " e/o discendenti non eliminati del tutto");
                                             expect(res).toBeFalsy();
                                             countExpect++;
                                             var s8 = stabilize();
                                             // 8. premo bottone di "Chiudi". Mi attendo che la stabilize vada nel then quando tutti i deferred sono chiusi
                                             testHelper.log("Chiudo pagina " + tablename);
                                             testHelper.clickButtonByTag('mainclose');
                                             return s8
                                          }).then(function () {
                                             countExpect++;
                                             testHelper.testHtmlNodeByTagExists(arrayInput, false);
                                             expect(countExpect).toBe(totExpect);
                                              expect(appMeta.currApp.currentMetaPage).toBeNull();
                                             return def.resolve();
                                          });

                                    }); // fine evento apertura pag curr

                                 var callPrm = {};
                                 var arrMsg = [];
                                 idMainTable = ds1.tables[tablename].rows[0][columnNameMainTable];
                                 // passo i prm alla pagina didiprogcurr, passandoli al callingParameters delle mp principale didiprog
                                 _.forEach(parentKeyToPassAsParameters, function (k) {
                                    callPrm[k] = ds1.tables[tablename].rows[0][k];
                                    arrMsg.push(" " + k + ": " + callPrm[k]);
                                 });

                                 console.log("apro " + childEntityName + " con " + arrMsg.join(","));
                                 // passo i prm. NON più necessario. Le pagine leggono i prm dal callerState
                                 // che in questo caso è sempre popolato!
                                 // _.extend(mpDidProg.state.callingParameters, callPrm);
                                 // 4. clicco bottone manage dei curriculum
                                 testHelper.clickButtonByTag('manage.' + pageTableToOpen + '.' + pageEditTypeToOpen);

                              }); // chiude main save
                        }); // chiude main insert
                     // 2. premo bottone di "Nuovo"
                     testHelper.clickButtonByTag('maininsert');

                  }); // fine evento di sho page pag didprog

               //  1.  Apro la pagina
               var wantsRow = prmChecks ? !!prmChecks.currentMetaPage : false;
                appMeta.currApp.callPage(tablename, edittype, wantsRow);
            }, timeout);

         return def.promise();
      },

      /**
       * Test registration page for Segreterie
       * @param {string} tablename
       * @param {string} edittype
       * @param {Array} arrayInput
       * @param prmChecks
       * @returns {*}
       */
      testCasePage_registry_user_custom: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 4; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testCasePage_registry_user_custom');

         // N.B non richiede Login. Lavora con connessione anonima

         // Evento di attesa pagina caricata
         testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
            .then(function (metaPage) {
               countExpect++;
               // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
               testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

               // TEST SPECIFICO DI PAGINA.
               testHelper.testHtmlNodeByTagExists(arrayInput, true);
               testHelper.testHtmlNodeByTagNotFilled(arrayInput, metaPage);
               testHelper.log("Invoco comando di inserimento nuova riga automaticamente");
               metaPage.doMainCommand("maininsert")
                  .then(function () {
                     appMeta.localResource.modalLoader_wait_insert = self.stringOriginal;

                     countExpect++;
                     // verifico i valori di default che ho nel vettore di configurazione.
                     testHelper.testDefaultValues(arrayInput);

                     // inserisco valori obbligatori, presi dai value dell'array di input
                     testHelper.log("Inserisco valori di input");
                     testHelper.insertValueNodeByTagAsync(arrayInput, metaPage.helpForm, false).then(function () {
                        countExpect++;
                        testHelper.testHtmlNodeByTagFilledValue(arrayInput, metaPage);
                        testHelper.log("Premo bottone per la registrazione");
                        metaPage.firereg_btn_id(metaPage)
                           .then(function () {
                              countExpect++;
                               expect(appMeta.currApp.currentMetaPage).toBeNull();
                              testHelper.log("Termine test testCasePage_registry_user_custom");
                              testHelper.testHtmlNodeByTagExists(arrayInput, false);
                              expect(countExpect).toBe(totExpect);
                              return def.resolve();
                           })
                     });
                  })

            });

         //  1.  Apro la pagina
         testHelper.log("Apro pagina");
          appMeta.currApp.callPage(tablename, edittype, false);


         return def.promise();
      },

      testCasePage_costoscontodef_default_custom: function (tablename, edittype, arrayInput, prmChecks) {
         var childEntityName = "Fasce ISEE";
         var pageTableToOpen = "fasciaiseedef";
         var pageEditTypeToOpen = "default";
         var columnNameMainTable = "idcostoscontodef";
         var tableArraySubentityToCheck = ["fasciaiseedef", "ratadef"];
         var parentKeyToPassAsParameters = ["idcostoscontodef"];

         return this.testCasePage_insertMainthenChildWithButtonTheSave(tablename,
            edittype,
            arrayInput,
            prmChecks,
            childEntityName,
            pageTableToOpen,
            pageEditTypeToOpen,
            columnNameMainTable,
            parentKeyToPassAsParameters,
            tableArraySubentityToCheck);
      },

      testCasePage_costoscontodef_more_custom: function (tablename, edittype, arrayInput, prmChecks) {
         var childEntityName = "Fasce ISEE";
         var pageTableToOpen = "fasciaiseedef";
         var pageEditTypeToOpen = "more";
         var columnNameMainTable = "idcostoscontodef";
         var tableArraySubentityToCheck = ["fasciaiseedef", "ratadef"];
         var parentKeyToPassAsParameters = ["idcostoscontodef"];

         return this.testCasePage_insertMainthenChildWithButtonTheSave(tablename,
            edittype,
            arrayInput,
            prmChecks,
            childEntityName,
            pageTableToOpen,
            pageEditTypeToOpen,
            columnNameMainTable,
            parentKeyToPassAsParameters,
            tableArraySubentityToCheck);
      },

      testCasePage_costoscontodef_sconti_custom: function (tablename, edittype, arrayInput, prmChecks) {
         var childEntityName = "Fasce ISEE";
         var pageTableToOpen = "fasciaiseedef";
         var pageEditTypeToOpen = "sconti";
         var columnNameMainTable = "idcostoscontodef";
         var tableArraySubentityToCheck = ["fasciaiseedef", "ratadef"];
         var parentKeyToPassAsParameters = ["idcostoscontodef"];

         return this.testCasePage_insertMainthenChildWithButtonTheSave(tablename,
            edittype,
            arrayInput,
            prmChecks,
            childEntityName,
            pageTableToOpen,
            pageEditTypeToOpen,
            columnNameMainTable,
            parentKeyToPassAsParameters,
            tableArraySubentityToCheck);
      },

      /**
       * 1. Get dataset page
       * 2. runn all the select
       * @param {string} tablename
       * @param {string} edittype
       * @returns {Deferred} ends with no error
       */
      testMetaPageCase5_datasetCompliant: function (tablename, edittype) {
         var countExpect = 0; // contatore dei rami asincorni
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase0');
         // Eseguo login
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               // lancio le query
               testHelper.testDatasetCompliant(tablename, edittype)
                  .then(function () {
                     def.resolve()
                  });
            }, timeout);

         return def.promise();
      },

      testCasePage_registry_docenti_doc_custom: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 6; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testMetaPageCase0');

         // non prende i valori da arrai ma solo un sottoinsieme che si calcola qui, per non stravolgere l'oggetto
         var customArray = [];

         var originalObjRow;
         // Eseguo login
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;
               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);
                     var originalObjRow = _.clone(metaPage.state.DS.tables[tablename].rows[0]);
                     // premo bottone di "Chiudi"
                     customArray.push({ tag: 'registry_docenti.cv?registrydocenti_docview.registry_docenti_cv', value: "CV data " + new Date().getTime(), type: controlTypeEnum.textarea });
                     customArray.push({ tag: 'mainsave', type: controlTypeEnum.command });
                     return testHelper.insertValueNodeByTagAsync(customArray, metaPage.helpForm, false);
                  }).then(function () {
                     countExpect++;
                     var s = stabilize();
                     // premo bottone di "Chiudi"
                     testHelper.clickButtonByTag('mainclose');
                     return s;
                  }).then(function () {
                     countExpect++;
                      expect(appMeta.currApp.currentMetaPage).toBeNull();
                     expect(countExpect).toBe(4);
                     // RIAPRO PAGINA
                     // Evento di attesa pagina caricata
                     testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                        .then(function (metaPage) {
                           countExpect++;
                           // TEST GENERICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                           testHelper.testMetaPageInitialization(metaPage, tablename, edittype);
                           // verifico che i campi siano quelli inseriti poco prima
                           testHelper.testHtmlNodeByTagFilledValue(customArray, metaPage);
                           var s = stabilize();
                           // premo bottone di "Chiudi"
                           testHelper.clickButtonByTag('mainclose');
                           return s;
                        }).then(function () {
                           countExpect++;
                            expect(appMeta.currApp.currentMetaPage).toBeNull();
                           expect(countExpect).toBe(totExpect);
                           return def.resolve();
                        });

                     // FASE 2: Apro la pagina per verificare il dato inserito in fase 1
                     testHelper.log("Riapro Pagina");
                      appMeta.currApp.callPage(tablename, edittype, false);

                  });

               // FASE 1: Apro la pagina la 1a volta per inserire il nuovo dato
                appMeta.currApp.callPage(tablename, edittype, false);

            }, timeout);

         return def.promise();
      },

      testCasePage_affidamento_doc_custom: function (tablename, edittype, arrayInput) {
         var countExpect = 0; // contatore dei rami asincorni
         var totExpect = 7; // totale dei rami asincroni in cui il test deve passare
         var def = $.Deferred();
         testHelper.setMetaPageTitleOnTestHtml(tablename, edittype, 'testCasePage_affidamento_doc_custom');

         // non prende i valori da arrai ma solo un sottoinsieme che si calcola qui, per non stravolgere l'oggetto
         var customArray = [];
         var mp1;
         // Eseguo login
         appMeta.authManager.login(
            appMeta.configDev.userName,
            appMeta.configDev.password,
            appMeta.configDev.datacontabile)
            .then(function (res) {
               expect(res).toBe(true);
               countExpect++;
               // Evento di attesa pagina caricata
               testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                  .then(function (metaPage) {
                     mp1 = metaPage;
                     countExpect++;
                     // TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
                     testHelper.testMetaPageInitialization(metaPage, tablename, edittype);

                     common.eventWaiter(metaPage, appMeta.EventEnum.stopMainRowSelectionEvent)
                        .then(function () {
                           // eseguo modifica
                           customArray.push({ tag: 'affidamento.prog?affidamentodocview.affidamento_prog', value: "Programma data " + new Date().getTime(), type: controlTypeEnum.textarea });
                           return testHelper.insertValueNodeByTagAsync(customArray, mp1.helpForm, false);
                        }).then(function () {
                           countExpect++;
                           // premo bottone di "salva"
                           testHelper.log("Premo Salva su " + tablename);
                           common.eventGlobalWaiter(mp1, appMeta.EventEnum.buttonClickEnd)
                              .then(function () {
                                 countExpect++;
                                 var s = stabilize();
                                 // premo bottone di "Chiudi"
                                 testHelper.clickButtonByTag('mainclose');
                                 return s;
                              }).then(function () {
                                 countExpect++;
                                  expect(appMeta.currApp.currentMetaPage).toBeNull();
                                 expect(countExpect).toBe(5);
                                 // RIAPRO PAGINA
                                 // Evento di attesa pagina caricata
                                 testHelper.waitPageLoaded(appMeta.EventEnum.showPage)
                                    .then(function (metaPage) {
                                       common.eventWaiter(metaPage, appMeta.EventEnum.stopMainRowSelectionEvent)
                                          .then(function () {

                                             countExpect++;
                                             // TEST GENERICO DA INVOCARE per testare inizializzzione di qualsiasi MetaPage
                                             testHelper.testMetaPageInitialization(metaPage, tablename, edittype);
                                             // verifico che i campi siano quelli inseriti poco prima
                                             testHelper.testHtmlNodeByTagFilledValue(customArray, metaPage);
                                             var s = stabilize();
                                             // premo bottone di "Chiudi"
                                             testHelper.clickButtonByTag('mainclose');
                                             return s;
                                          }).then(function () {
                                             countExpect++;
                                              expect(appMeta.currApp.currentMetaPage).toBeNull();
                                             expect(countExpect).toBe(totExpect);
                                             return def.resolve();
                                          });

                                       // se apre elenco con i risultati di ricerca clicco sul primo
                                        if (appMeta.currApp.currentMetaPage.listManagerSearch != null &&
                                            appMeta.currApp.currentMetaPage.listManagerSearch.gridControl != null) {
                                            var trs = $(appMeta.currApp.currentMetaPage.listManagerSearch.gridControl.mytable).find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr)");
                                          if (trs.length > 0) {
                                              $(appMeta.currApp.currentMetaPage.listManagerSearch.gridControl.mytable).find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr):eq(0)").dblclick();
                                          }
                                       } else {
                                          metaPage.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, null, "selectRow")
                                       }
                                    });

                                 // FASE 2: Apro la pagina per verificare il dato inserito in fase 1
                                 testHelper.log("Riapro Pagina");
                                  appMeta.currApp.callPage(tablename, edittype, false);
                              });

                           testHelper.clickButtonByTag('mainsave');

                        });

                     // se apre elenco con i risultati di ricerca clicco sul primo
                      if (appMeta.currApp.currentMetaPage.listManagerSearch != null &&
                          appMeta.currApp.currentMetaPage.listManagerSearch.gridControl != null) {
                          var trs = $(appMeta.currApp.currentMetaPage.listManagerSearch.gridControl.mytable).find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr)");
                        if (trs.length > 0) {
                            $(appMeta.currApp.currentMetaPage.listManagerSearch.gridControl.mytable).find("tr:not(:has(>th)):not([data-mdlgrouped]):not(.table-in-cell-tr):eq(0)").dblclick();
                        }
                     } else {
                        mp1.eventManager.trigger(appMeta.EventEnum.stopMainRowSelectionEvent, null, "selectRow")
                     }

                  });

               // FASE 1: Apro la pagina la 1a volta per inserire il nuovo dato
                appMeta.currApp.callPage(tablename, edittype, false);

            }, timeout);

         return def.promise();
      }
   };

   appMeta.testCase = new TestCase();

}());
