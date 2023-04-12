/**
 * @module DropDownGridControl
 * @description
 * Manages the graphics and the logic of a autochoose.
 */
(function () {

   var Deferred = appMeta.Deferred;
   var getData = appMeta.getData;
   var metaModel = appMeta.metaModel;
   var q = window.jsDataQuery;
   var utils = appMeta.utils;
   /**
    *
    * @param {html node} el
    * @param {HelpForm} helpForm
    * @param {DataTable} table
    * @param {DataTable} primaryTable
    * @param {string} listType
    * @constructor
    */
   function DropDownGridControl(el, helpForm, table, primaryTable, listType) {
      this.listManager = null;
      this.timeoutId = 0; // timer che permette di lanciare la query se tra 2 keyup passa più di mezzo secondo
       
      $(el).prop("autocomplete","off");
      //$(el).attr("data-subentity"); non dovrebbe essere necessaria vista la presenza del tag di ricerca ?x

      this.helpForm = helpForm;
      this.DS = table.dataset;
      this.dataTable = table;
      this.tableName = table.name;
      this.tableNameForReading = table.tableForReading();
      this.tag = $(el).data("tag");
      this.el = el;
      this.listingType = $(el).data("listtype");
      //this.columnList = helpForm.existsDataAttribute(el, "columnlist") ? $(el).data("columnlist") : null;
      this.isStandardFill = true;
      var dataParent = $(el).data("parent");
      // numero di caratteri per cui scatta la query
      this.minCharacter = helpForm.existsDataAttribute(el, "minchar") ? $(el).data("minchar") : appMeta.config.dropDownMinCharTyped;
      // millisecondi di attesa massima
      this.msDelay = helpForm.existsDataAttribute(el, "delay") ? $(el).data("delay") : appMeta.config.dropDownDelayKeyUp;
      this.rootElement = $("#" + dataParent).length ? $("#" + dataParent) : $(el).parent();
      this.lastText = this.getLastText();
      $(el).addClass(appMeta.cssDefault.autoChoose);
      
      var startFilter = helpForm.getFilterFormDataAttribute(el);
      var kind = 'AutoChoose';
      this.startField = helpForm.getColumnName(this.tag);
      var col = this.dataTable.columns[this.startField];
      $(el).attr("maxlength", metaModel.getMaxLen(col));

      this.ai = new appMeta.AutoInfo(this.rootElement, this.listingType, startFilter, this.startField, table.name, kind);
      $(el).on("keyup", _.partial(this.keyUpDelay, this.msDelay, this));
      $(el).on("blur", _.partial(this.lostfocus, this));
      // aggiunge il text invisibile, che verrà utilizzato in ricerca tramite id sulla tabella referenziata,
      // inoltre aggiungo al tag ?x in modo tale che se non c'è un search tag il campo verrà
      // comunque abilitato in inserimento.
      this.txtHiddenForId = helpForm.addInvisibleTextBox(this.ai);
      $(el).data("tag", helpForm.getStandardTag(this.tag) + "?x");
      this.applyGrapichs();
   }

   DropDownGridControl.prototype = {
      constructor: DropDownGridControl,

      applyGrapichs: function () {
         var $parent = $(this.el).parent();
         $parent.addClass("oneRow");
         this.$buttonSearch = $('<button type="button" class="btn btn-outline-secondary">');
         var $iconSearch = $('<i class="fa fa-search mr-1">');
         this.$buttonSearch.append($iconSearch);
         $parent.append(this.$buttonSearch);
         this.$buttonSearch.on("click", _.partial(this.keyup, this, true));

         this.$buttonClose = $('<button type="button" class="btn btn-outline-secondary">');
         var $iconClose = $('<i class="fa fa-times-circle mr-1">');
         this.$buttonClose.append($iconClose);
         $parent.append(this.$buttonClose);
         this.$buttonClose.on("click", _.partial(this.closeBtnEv, this));
         this.$buttonClose.hide();
      },

      getLastText: function () {
         return ($(this.el).attr("id") + "#" + $(this.el).val());
      },

      closeBtnEv: function (that) {
         that.clearControl();
         that.listManagerHideControl(false);
      },

      /**
       * Executes the query paginated and show the listManager relative to the control
       * @returns {*}
       */
      keyup: function (that, buttonPressed) {
         // se il controllo è disabilitato non permetto la pressione del bottone
         if (buttonPressed && $(that.el).prop("disabled")) {
            return;
         }

         if (buttonPressed) {
            that.$buttonClose.show();
            that.$buttonSearch.hide();
         }

         // Riposiziona lo scroll in alto se viene fatta una nuova ricerca
         if (that.listManager) {
            $(that.listManager.currentRootElement).find(".tableCont").scrollTop(0);
            $(that.listManager.currentRootElement).find(".tableCont table tr:not(:has(>th))").remove();
         }

         that.dataTable = that.metaPage.state.DS.tables[that.tableName];
         var metaToConsider = appMeta.getMeta(that.dataTable.tableForReading());
         // il sort prendo dal metadato.se non lo trovo allora provo a vedere se sta sulla tabella, perchè configurato sul meta server e serializzato
         var sort = metaToConsider.getSorting(that.listingType);
         sort = (sort ? sort : that.dataTable.orderBy());
         var startFilter = that.helpForm.getFilterFormDataAttribute(that.el);
         var startValue = $(that.el).val().trim();

         // costrusico filtro
         var filter = jsDataQuery.like(that.startField, "%" + startValue + "%");
         if (startValue.length < that.minCharacter && !buttonPressed) {
            if (startValue.length === 0 && that.listManager) {
               that.listManagerHideControl(false);
            }
            return;
         }
         var staticFilter = that.dataTable.staticFilter();
         filter = that.helpForm.mergeFilters(filter, staticFilter);
         filter = that.helpForm.mergeFilters(filter, startFilter);
         this.rowSelected = false;
         var dataTablePaged, totPage, totRows;
         // eseguo chiamata al ws
         return getData.getPagedTable(that.tableNameForReading, 1, appMeta.config.listManager_nRowPerPage, filter, that.listingType, sort)
            .then(function (dt, totp, totr) {
               dataTablePaged = dt;
               totPage = totp;
               totRows = totr;
               dataTablePaged.dataset = that.metaPage.state.DS;
               return metaToConsider.describeColumns(dataTablePaged, that.listingType);
            })
            .then(function () {

               var keys = dataTablePaged.key();
               var isEmpty = keys.some(function (k) {
                  return !k;
               });

               if (isEmpty || !keys.length) {
                  return that.metaPage.showMessageOk("La tabella" + dataTablePaged.name +" ha chiavi sbagliate. Controllare la descrizione della tab a db, oppure in caso di vista controllare tabelle metadata*");
               }
               // se c'è una sola riga la seleziono subito ed eventualmente chiudo il listmanager
               if (totRows === 1) {
                  var r = dataTablePaged.rows[0];
                  that.listManagerHideControl(r.getRow());
                  return that.putRowInControl(r.getRow());
               }

               // se il list è già aperto allora lo rinfresco
               if (that.listManager) {
                  return that.listManager.createList(dataTablePaged, totPage, totRows);
               } else {
                  that.listManager = new appMeta.ListManagerScrollable(that.tableNameForReading, that.listingType, filter, true, that.el, that.metaPage, false, false, sort);
                  that.listManager.init();
                  that.$buttonClose.show();
                  that.$buttonSearch.hide();
                  return that.listManager.show(dataTablePaged, totPage, totRows).then(function (res) {
                     if (res) return that.putRowInControl(res.getRow());
                  });
               }
            })
      },

      /**
       * Select the row on the underline control
       * @param {DataRow} dtrow
       * @returns {Deferred}
       */
      putRowInControl: function (dtrow) {
         var self = this;
         // res tornato è un ObjectRow
         return self.metaPage.state.meta.checkSelectRow(self.dataTable, dtrow)
            .then(function (dataRow) {
               return self.metaPage.selectOneCompleted(dataRow, self.dataTable, self.rootElement)
            })
            .then(function (selected) {
               self.rowSelected = selected;
               if (!selected) {
                  self.helpForm.applyFocus(self.el);
               }
               if (selected) {
                  self.lastText = self.getLastText();
                  self.$buttonClose.hide();
                  self.$buttonSearch.show();
                  self.metaPage.eventManager.trigger("dropDownChoose", self, null)
               }
               return true;
            })

        
      },

      /**
       * Checks if user can lose the focus. if there is a clear text it empty the control
       */
      lostfocus: function (that) {
         if (that.getLastText() === that.lastText) return;
         if (!that.canGoOut()) return that.helpForm.applyFocus(that.el);
         var value = $(that.el).val().trim();
         // se ho sbianchettato eseguo pulizia chiamando stesso metodo che chiamerebbe autochoose
         if (value.length === 0) {
            var childTable = that.ai.childTable;
            var field = that.ai.childField;
            var col = childTable.columns[field];
            if (that.metaPage.state.isEditState() &&
               (metaModel.denyNull(col) || metaModel.denyZero(col) || !metaModel.allowNull(col) || !metaModel.allowZero(col))) {
               return that.metaPage.showMessageOk("Questo campo è obbligatorio, seleziona un valore!")
                  .then(function () {
                     that.helpForm.applyFocus(that.el);
                  });

            }
            that.metaPage.choose("choose." + that.tableName + ".unknown.clear", null, that.rootElement);
         }
      },

      /**
       * cancel the event if time < ms. otherwise it calls keyup
       * @param {Function} callback to call after delay
       * @param {number} ms. the delay
       * @param {DropDownGridControl} that
       */
      keyUpDelay: function (ms, that) {
         clearTimeout(that.timeoutId);
         that.timeoutId = setTimeout(function () {
            that.keyup(that, false);
         }, ms || 0);
      },

      // QUI INIZIANO METODI DI INTERFACCIA Del CUSTOM CONTROL

      /**
       * @method fillControl
       * @public
       * @description ASYNC
       * Fills the control. First to fill it resets the events rect
       */
      fillControl: function (el, value) {
         var def = Deferred("DropDown-fillControl");
         var dataTable = this.metaPage.state.DS.tables[this.tableName];
         this.helpForm.setControl(el || this.el, dataTable, value, this.startField);
         this.lastText = this.getLastText();

         // -> *** Le PROSSIME RIGHE SERVONO A CORREGGERE il caso in cui una subpage
         // abbia un dropdowngrid e una select che dipende da lei. Quindi nell'afterRowSelect di pagina programmatore gestisce
         // il filtraggio. (vecchio esempio missioni itineration o itinerationsegview di rendicontattivitaprogetto) ma che al momento non è
         // più implementato.) . quindi è stato disattivato, poichè genera un altro tipo di errore più grave
         // in pagina principale (es: progetto seg) in cui al salvataggio poi gli eventi non fanno popolare la combo slave.
         // -> *** LO LASCIAMO QUINDI COMMENTATO FINCHE' NON ABBIAMO UN CASO REALE DOVE PROVARE ENTRMABE I BUG.

         //*************************
         // esegue una rowselect sulla pagina come da flusso normale.
         var dtRow = this.findDtRowRelated();
         var objRow = !!dtRow ? (dtRow.current ? dtRow.current : null) : null;
         return def.from(this.metaPage.rowSelect(el, this.dataTable, objRow));
         //*************************
      },

      /**
       * @method findDtRowRelated
       * @public
       * @description ASYNC
       * @returns {null|DataRow}
       */
      findDtRowRelated: function () {
         var mainRow = this.metaPage.getPrimaryDataTable().lastSelectedRow;
         if (!mainRow) return null;
         if (!mainRow.getRow) return null;
         var dtRows = mainRow.getRow().getParentsInTable(this.tableName);
         if (dtRows.length) return dtRows[0].getRow();
         return null;
      },

      /**
       * @method getControl
       * @public
       * @description ASYNC
       */
      getControl: function (el, objrow, column) {
         this.helpForm.getText(el, column, objrow, this.tag);
      },

      /**
       * @method clearControl
       * @public
       * @description ASYNC
       * Executes a clear of the control. It removes rows and set the index to -1 value.
       * @returns {Deferred}
       */
      clearControl: function () {
         $(this.el).val("");
         $(this.txtHiddenForId).val("");
      },

      /**
       * @method addEvents
       * @public
       * @description ASYNC
       * @param {html node} el
       * @param {MetaPage} metaPage
       * @param {boolean} subscribe
       */
      addEvents: function (el, metaPage, subscribe) {
         this.metaPage = metaPage;
         this.metaPage.eventManager.subscribe(appMeta.EventEnum.listManagerHideControl, this.listManagerHideControl, this);
      },

      /**
       * close the list manager associated to the control
       */
      listManagerHideControl: function (row) {
         if (this.listManager) this.listManager.closeListManager();
         this.$buttonClose.hide();
         this.$buttonSearch.show();
         this.listManager = null
      },

      /**
       * return true if a value is selected
       * @returns {boolean}
       */
      canGoOut: function () {
         var value = $(this.el).val();
         return !!this.rowSelected || value.length === 0;
      },

      /**
       * @method preFill
       * @public
       * @description ASYNC
       * Executes a prefill of the control
       * @param {Html node} el
       * @param {Object} param {tableWantedName:tableWantedName, filter:filter, selList:selList}
       * @returns {Deferred}
       */
      preFill: function (el, param) {
         var def = Deferred("preFill-Grid");
         return def.resolve();
      },

      clearGroup: function () {
         var self = this;
         $(this.rootElement)
            .find("[data-tag]")
            .each(function () {
               self.helpForm.clearControl($(this));
            });
      },

      getAutoField: function () {
         return $(this.txtHiddenForId).length ? $(this.txtHiddenForId).val() : "";
      },

      /**
       *
       * @param newValId
       * @returns {Deferred}
       */
      setAutoField: function (newValId) {
         var self = this;
         var def = Deferred('setAutoField');
         var oldVal = this.getAutoField();
         if (oldVal == null) return def.resolve();
         var parentTable = this.ai.parentTable;
         var childTable = this.ai.childTable;
         var mustCallAfterRowSelect = newValId !== oldVal;
         if (!newValId) {
            this.clearGroup();
            if (childTable.rows.length === 1) childTable.rows[0][this.ai.childField] = null;
            if (mustCallAfterRowSelect) return def.from(this.metaPage.afterRowSelect(parentTable, null));
         }

         var filter = q.eq(this.ai.parentField, newValId);
         return utils._if(!parentTable.select(filter).length)
            ._then(function () {
               parentTable.clear();
               return getData.runSelectIntoTable(parentTable, filter, null)
            }).then(function () {
               if (!parentTable.select(filter).length) return def.resolve(); //Errore nei dati
               return self.helpForm.fillSpecificRowControls($(self.rootElement), parentTable, parentTable.rows[0].getRow()).then(function () {
                  if (childTable.rows.length === 1) childTable.rows[0][self.ai.childField] = newValId;
                  if (mustCallAfterRowSelect) return def.from(self.metaPage.afterRowSelect(parentTable, parentTable.rows[0]));
                  return def.resolve();
               });
            })
      }
   };

   window.appMeta.CustomControl("dropdowngrid", DropDownGridControl);

}());

