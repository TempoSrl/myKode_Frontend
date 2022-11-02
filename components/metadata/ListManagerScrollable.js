(function() {

    var ListManager = window.appMeta.ListManager;
    var Deferred = appMeta.Deferred;
    var utils = appMeta.utils;
    var getData = appMeta.getData;


    function ListManagerScrollable(tableName, listType, filter, isModal, rootElement, metaPage, filterLocked, toMerge, sort) {
        ListManager.apply(this, [tableName, listType, filter, true, rootElement, metaPage, filterLocked, toMerge, sort]);
        this.scrollReqTimeout = null;
        this.scrollReqTimeoutMs = 200;
    }

    ListManagerScrollable.prototype = _.extend(
        new ListManager(),
        {
            constructor: ListManagerScrollable,
            superClass: ListManager.prototype,

            /**
             *
             */
            init:function() {
                this.trList = [1];
                this.rowStandardHeight = 32.3267;
                this.positionRelative();
                this.setShowFooter(false);
                // a seconda se modale o non appendo i vari html ad un nuovo root. così non serve if dopo.
                this.myRootListManger = $("<div data-tag='" + this.tableName + "." + this.listType + "' class='autoChooseDataTag'>");
                // aggiungo al mio root corrente il div dinamico con la griglia e il footer.
                $(this.currentRootElement).append(this.myRootListManger);
                this.loader = new appMeta.LoaderControl(this.myRootListManger, appMeta.localResource.loader_waitListLoading);
            },

            /**
             * Create an overlay relative to the input control, where the list must be showed
             */
            positionRelative:function() {
                this.defModal = Deferred("ListManagerScrollable-relative");
                this.dialogNotmodalId =  "dialog" + utils.getUniqueId();
                this.currentRootElement = $('<div class="mdlautochoose" id="' + this.dialogNotmodalId + '">'); // in alternativa aggiungi pure classe container di bootstrap, centra il tutto container
                // lo appendo al parent, cioè di solto la col. Poi in base al css su mdlautochoose verrà poszionato contestuale al controllo
                $(this.rootElement).parent().append(this.currentRootElement);
            },

            /**
             * @method show
             * @public
             * @description ASYNC
             * Builds and shows a listManger control, and returns a Promise
             * @param {DataTable} dataTablePaged
             * @param {int} totPage
             * @param {int} totRows
             * @returns {Deferred}
             */
            show: function (dataTablePaged, totPage, totRows) {
                var self = this;
                var def = Deferred("show-ListManagerScrollable");
                var res = self.createList(dataTablePaged, totPage, totRows)
                    .then(function () {
                        $(self.currentRootElement).find(".tableCont").on("scroll", _.partial(self.scrollList, self));
                        self.hideWaitingIndicator();
                        self.metaPage.eventManager.trigger(appMeta.EventEnum.listCreated, self, "show");
                        return self.defModal.promise();

                    });

                return def.from(res).promise();
            },


            /**
             * @method createList
             * @private
             * @description ASYNC
             * Creates the grid and the footer
             * @param {DataTable} dataTablePaged
             * @param {int} totPage
             * @param {int} totRows
             * @returns {Deferred}
             */
            createList: function(dataTablePaged, totPage, totRows) {
                var self = this;
                var def = Deferred("listManager.createList");
                // mostro il loader
                this.loader.showControl();

                if (self.gridControl) self.gridControl.setTrBefore();
                if (dataTablePaged) {
                    var res = self.loadCore(dataTablePaged, totPage, totRows)
                        .then(function () {
                            self.loader.hideControl();
                            self.resetScroll(totRows, totPage);
                            return true;
                        });
                } else {
                    // passo qui, quando premo i pulsanti di navigazione della paginazione, quindi qui si ricalcola il dt
                    var res = getData.getPagedTable(this.tableName, this.currentPageDisplayed, this.nRowPerPage, this.filter, this.listType, this.sort)
                        .then(function(dtp, totp, totr) {
                            return self.loadCore(dtp, totp, totr);
                            self.loader.hideControl();
                        });
                }

                return def.from(res).promise()
            },

            /**
             * At the scroll event calculates the ppge to get and show it on the grid
             * @param {ListManagerScrollable} that
             */
            scrollList: function (that) {

                // Clear Timout a 200ms
                clearTimeout(that.scrollReqTimeout);

                // SetTimeOut
                that.scrollReqTimeout = setTimeout(function () {

                    var tCont = $(that.currentRootElement).find(".tableCont");
                    var topRow = Math.ceil(($(tCont).scrollTop() - that.rowStandardHeight) / that.rowStandardHeight);
                    var bottomRow = Math.ceil(($(tCont).scrollTop() - that.rowStandardHeight + $(tCont).height() - 1) / that.rowStandardHeight);

                    var curr = Math.ceil(topRow / appMeta.config.listManager_nRowPerPage);
                    var currNext = Math.ceil(bottomRow / appMeta.config.listManager_nRowPerPage);
                    curr = curr > 0 ? curr : 1;
                    var pre;
                    var next;
                    var preH = 0;
                    var nextH = 0;

                    var bFound = false;
                    for (var i = 0; i < that.trList.length - 1; i++) {
                        if (curr == currNext && that.trList[i] == curr || curr < currNext && that.trList[i] == curr && that.trList[i + 1] == currNext) {
                            bFound = true;
                            continue;
                        } else if (curr < currNext && that.trList[i] == curr && that.trList[i + 1] != currNext) {
                            curr = currNext;
                            continue;
                        }
                    }

                    if (bFound) return;

                    var chain = $.when();

                    _.forEach(that.trList, function (elTr, i) {
                        if (elTr < curr && curr < that.trList[i + 1]) {
                            that.trList.splice(i + 1, 0, curr);

                            // Elemento Inferiore e superiore
                            pre = elTr;
                            next = that.trList[i + 2];

                            // Altezza del TR Fake che precede e segue
                            preH = (curr - pre - 1) * appMeta.config.listManager_nRowPerPage * that.rowStandardHeight;
                            nextH = (next - curr - 1) * appMeta.config.listManager_nRowPerPage * that.rowStandardHeight;

                            chain = chain.then(function () {
                                // Prendo le nRowPerPage (es. 100) righe da inserire partendo da curr (es. 12)
                                return getData.getPagedTable(that.tableName, curr, appMeta.config.listManager_nRowPerPage, that.filter, that.listType, that.sort)
                                    .then(function (dtp, totp, totr) {
                                        // nel momento in cui torno la riga alla metapage viene fatta della logica sulla riga seelzionata
                                        // su relazioni etc.. quindi recupera dalla table la proprietà dataset, che in questo caso non avrebbe perchè
                                        // getPagedTable() torna solo un datatable, e lo devo quindi associare al ds corrente della metapage
                                        dtp.dataset = that.metaPage.state.DS;
                                        var $tr = $("<tr id='trFake_" + curr + "' class='fakeTr'>");

                                        // Inserisco N colonne <TD> fake
                                        _.forEach(_.range(0, that.gridControl.getColsToInsert().length + 1), function () {
                                            var $td =  $("<td style='height:" + nextH + "px'>");
                                            $tr.append($td);
                                        });

                                        $('#trFake_' + pre).after($tr);
                                        that.gridControl.setTrBefore('#trFake_' + curr);
                                        return that.loadCore(dtp, totp, totr)
                                            .then(function () {
                                                // Se le righe sono successive
                                                if (preH == 0) {
                                                    // elimino il TR Fake
                                                    $('#trFake_' + pre).remove();
                                                } else {
                                                    // Altrimenti riduco il TR Fake precedente
                                                    $('#trFake_' + pre + ' td').css('height', preH + 'px');
                                                }

                                                // elimino il TR Fake
                                                if (nextH == 0) $('#trFake_' + curr).remove();

                                                if (curr < currNext) curr = currNext;

                                            });
                                    });
                            });
                        }
                    });

                    chain.then(function () {
                        return true;
                    })

                }, that.scrollReqTimeoutMs);
            },

            /**
             *
             * @param {number} totRows
             * @param {number} totPage
             */
            resetScroll: function (totRows, totPage) {
                this.trList = [1, totPage + 1];
                if (totPage > 1) {
                    var h = (totRows - appMeta.config.listManager_nRowPerPage) * this.rowStandardHeight;
                    var $tr = $("<tr id='trFake_1' class='fakeTr'>");
                    _.forEach(_.range(0, this.gridControl.getColsToInsert().length + 1), function () {
                        var $td =  $("<td style='height:" + h + "px'>");
                        $tr.append($td);
                    });
                    $(this.gridControl.tableCont).children(':first').append($tr);
                }
            },

            /**
             *
             * @param {DataTable} dt
             */
            getGridInstance:function(dt) {
                if (!this.gridControl) {
                    this.gridControl = new appMeta.GridControlXScrollable(this.myRootListManger, this.metaPage.helpForm, dt, null, this.listType);
                    this.gridControl.init();
                }
            }

        });

    appMeta.ListManagerScrollable = ListManagerScrollable;
}());
