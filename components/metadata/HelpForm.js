/**
 * @module HelpForm
 * @description
 * Contains all utility methods to manage events and interactions on a web form
 */
(function() {
    var app = window.appMeta;
    var TypedObject = app.TypedObject;
    var metaModel = app.metaModel;
    var dataRowState = jsDataSet.dataRowState;
    var DataColumn = jsDataSet.DataColumn
    var q = window.jsDataQuery;
    var Deferred = appMeta.Deferred;
    var jsObjFromString = appMeta.jsObjFromString;
    var stringFromJsObj = appMeta.stringFromJsObj;
    var locale = appMeta.localResource;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var utils = appMeta.utils;
    var numberDecimalSeparator = appMeta.numberDecimalSeparator;
    var numberGroupSeparator = appMeta.numberGroupSeparator;
    var currencyDecimalSeparator = appMeta.currencyDecimalSeparator;
    var currencyGroupSeparator = appMeta.currencyGroupSeparator;
    var currencySymbol = appMeta.currencySymbol;
    var getDataUtils = appMeta.getDataUtils;
    var cssDefault = appMeta.cssDefault;
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }

    /**
     * @constructor HelpForm
     * @description
     * Creates a new instance of HelpForm class
     * @constructor
     * @param {PageState} pageState
     * @param {string} primaryTable
     * @param {string} rootElement
     */
    function HelpForm(pageState, primaryTableName, rootElement) {

        /**
         * @type {jsDataSet}
         */
        this.DS = pageState.DS;

        /**
         * @type {PageState}
         */
        this.pageState = pageState;

        if (typeof (primaryTableName) !== "string") throw "primaryTable should be a string";
        this.primaryTableName = primaryTableName;

        /**
         * @type {DataTable}
         */
        this.primaryTable = pageState.DS.tables[primaryTableName];
        if (typeof (rootElement) !== "string") throw "rootElement should be a string";

        /**
         * @type {string}
         */
        this.rootElement = rootElement;

        this.comboBoxToRefill = true;
        this.name = "HelpForm of " + primaryTableName;

        this.metaPage = null;


        this.autoInfoDataTag= "autoInfo";
        /**
         * true if an autochoose txt is losing focus
         */
        this.insideTextBoxLeave = false;

        /**
         * Control can be GridControl , treeviewManager
         * @type {null}
         */
        this.mainTableSelector = null;

        return this;
    }

    HelpForm.prototype = {
        constructor: HelpForm,

        /**
         * @method addEvents
         * @public
         * @description SYNC
         * Loops over the html elements and adds the events handler
         * @method addEvents
         * @param {MetaPage} metaPage
         */
        addEvents: function (metaPage) {
            this.metaPage = metaPage;
            $(this.rootElement).off("click"); // rimuovo e poi rimetto. perchè ad ogni apertura il root element è lo stesso per ogni pagina
            $(this.rootElement).on("click", _.partial(this.showDebugDialog, this.metaPage, this));
            this.iterateOverTag("tag", "addEvent");
            this.iterateOverCustomTag("addEvents", metaPage);
        },

        /**
         * click + shift+ctrl show a dialog to show some debug useful info
         * @param mp
         */
        showDebugDialog:function (mp, that, ev) {
            var isCtrl = ev.ctrlKey;
            var isShift = ev.shiftKey;

            if (isCtrl && isShift && appMeta.security.isAdmin() && !that.debugOpen) {
                that.debugOpen = true;
                // torna la stringa con i data attributes meno che data-tag che già ho considerato nella funz chiamante getControlTag()
                function getDataAttributes(node) {
                    var  re_dataAttr = /^data\-(.+)$/, res = "";

                    $.each($(node).get(0).attributes, function(index, attr) {
                        if (re_dataAttr.test(attr.nodeName) && attr.nodeName !== "data-tag") {
                            var key = attr.nodeName.match(re_dataAttr)[1];
                            res = res + key + ": " + attr.nodeValue + ", ";
                        }
                    });

                    return res ? "<strong>data-attr*= </strong>" + res : "";
                }

                // torna le info sui controlli che hanno il data-tag
                getControlTag = function () {
                    var res = "";
                    var count = 1;
                    $(mp.rootElement + "  [data-tag]")
                        .each(function () {
                            var attrid  = $(this).attr('id');
                            if (attrid && attrid.includes("!")){
                                res = res + " <strong>" + count +
                                    " </strong> id: " + attrid
                            } else {
                                var labelFor = $('label[for='+ attrid  +']');
                                var labelText = labelFor.length ? labelFor.text() : "";
                                res = res + " <strong>" + count +
                                    " </strong> id: " + attrid +
                                    " " + (labelText ? "<strong>label: </strong>" + labelText : "") + // se ha label metto "label:"
                                    ": <strong>tag:</strong> " + $(this).data("tag") + " " + getDataAttributes(this) + "<BR>";
                            }

                            count += 1;
                        });
                    return res
                };

                // ritorna info su var di ambiente notevoli
                getUserInfo = function () {
                    var res = "";
                    getVar  = function (myvar) {return myvar || "" ;};
                    res = res + "<strong>userweb: </strong>" +  getVar(appMeta.security.usrEnv.userweb)  + "<BR>" +
                        "<strong>idcustomuser: </strong>" +  getVar(appMeta.security.sysEnv.idcustomuser)  + "<BR>" +
                        "<strong>Database: </strong>" + getVar(appMeta.security.sysEnv.database) + "<BR>" +
                        "<strong>server: </strong>" + getVar(appMeta.security.sysEnv.server) + "<BR>" +
                        "<strong>user: </strong>" + getVar(appMeta.security.sysEnv.user) + "<BR>" +
                        "<strong>idreg: </strong>" + getVar(appMeta.security.usrEnv.idreg) + "<BR>" +
                        "<strong>forename: </strong>" + getVar(appMeta.security.usrEnv.forename) + "<BR>" +
                        "<strong>surname: </strong>" + getVar(appMeta.security.usrEnv.surname) + "<BR>" +
                        "<strong>groupList: </strong>" + getVar(appMeta.security.usrEnv.usergrouplist) + "<BR>";

                    return res
                };

                // environment
                getEnv = function () {
                    if (appMeta.config.env === appMeta.config.envEnum.PROD) {
                        return "PROD";
                    }
                    if (appMeta.config.env === appMeta.config.envEnum.DEV) {
                        return "DEV";
                    }
                };

                // righe cambiate
                var modrows = _.reduce(mp.state.DS.tables, function (res, table, key) {
                    var rowsChanged = table.getChanges();
                    if (rowsChanged.length > 0) {
                        res += 'table: <strong>' +  table.name + '</strong> has ' + rowsChanged.length + ' rows changed:<BR>';
                        var del = 0;
                        var mod = 0;
                        var add = 0;
                        _.forEach(rowsChanged, function (o) {
                            if (o.getRow().state === dataRowState.deleted){
                                del++;
                            }
                            if (o.getRow().state === dataRowState.modified){
                                mod++;
                            }
                            if (o.getRow().state === dataRowState.added){
                                add++;
                            }
                        });
                        res += "modified: " + mod + ", added: " + add + ", deleted: " + del + "<BR>";
                    }
                    return res;
                }, "");

                // creo oggetti univoci, così siamo sicuri di vedere ogni volta dati freschi
                var jsondsid = "jsondsid" + utils.getUnivoqueId();
                var dialogid = "dialogid" + utils.getUnivoqueId();
                var htmlInfo = '<strong>MDLW version: </strong>' + appMeta.config.MDLW_VERSION;
                htmlInfo += "<BR><strong>Env: </strong>" + getEnv();
                htmlInfo += "<BR><strong>MetaPage: </strong>" + mp.primaryTableName + " - " + mp.editType;
                htmlInfo += "<BR><strong>Default listtype: </strong>" + mp.defaultListType;
                htmlInfo += "<BR><strong>base path: </strong>" + appMeta.basePath;
                htmlInfo += '<BR><strong>Dataset: </strong><div id="'+ jsondsid +'"></div>';
                htmlInfo += '<BR><strong>Righe già bindate sul dataset in modifica: </strong><BR>' + modrows;
                htmlInfo += '<BR><strong>User info: </strong><BR>' + getUserInfo();
                htmlInfo += '<BR><strong>Controls tag: </strong><BR>' + getControlTag();

                // form per settare e provare stile
                htmlInfo += "<div class=\"col-5 col-md-5\">\n" +
                "      <BR><strong>Seleziona tema: </strong><BR>\n" +
                "      <select id=\"selecttheme\" name=\"sheetFormat\">\n" +
                "         <option value=\"blue\">blue (default)</option>\n" +
                "         <option value=\"red\">red</option>\n" +
                "         <option value=\"yellow\">yellow</option>\n" +
                "       </select>\n" +
                "   </div>\n" +
                "<button id=\"btnSetTheme\" type=\"button\" class=\"btn btn-primary p-2 mt-2\" >\n" +
                "<i class=\"fa fa-file-pdf mr-1\" ></i>Set tema\n" +
                "</button>";

                var dialogrootelement = $('<div id="' + dialogid + '">');
                $(mp.rootElement).append(dialogrootelement);

                $("#" + dialogid).dialog({
                    modal: true,
                    autoResize:true,
                    width: appMeta.getScreenWidth() * 0.85,
                    title: 'Debug window',
                    open: function () {
                        // attacco html
                        $(this).html(htmlInfo);

                        $("#btnSetTheme").on("click", _.partial(that.setTheme, that ));

                        // ora sul div attaco il json viewer
                        var jsonViewer = new JSONViewer();
                        $("#"+jsondsid).append(jsonViewer.getContainer());
                        var json = getDataUtils.getJsonFromJsDataSet(mp.state.DS, true);
                        jsonViewer.showJSON(JSON.parse(json), null, 1);
                    },
                    close: function(event, ui) {
                        $(this).dialog("close");
                        that.debugOpen = false;
                        dialogrootelement.remove();
                    },
                    position: { my: "center bottom", at: "center center", of: window }
                });
            }
        },

        setTheme:function (that) {
            var theme = that.sheetFormat = $('#selecttheme').val();
            if (appMeta.appMainConfig.setTheme) {
                appMeta.appMainConfig.setTheme(theme);
            }
        },

        /**
         * @method addEvent
         * @private
         * @description SYNC
         * Adds to the page, the events necessary to enable framework enhancements.
         * For example it manages the format of the data in the input text, when it receives the focus or loses the focus
         * @param {html node} el
         */
        addEvent: function(el) {
            var controller = $(el).data("customController");
            if (controller) return;

            var eltag = $(el).data("tag");
            var ctype = this.getCtypeTagFromElTag(eltag);
            var tagName = el.tagName;
            switch (tagName.toUpperCase()) {
                case "INPUT":
                    switch ($(el).attr("type").toUpperCase()) {
                        case "TEXT":
                        case "TEXTAREA":
                            // a seconda del tipo di colonna
                            switch (ctype) {
                                case "Int64":
                                case "Int32":
                                case "Int16":
                                    $(el).on("blur", this.generalLeaveTextBox);
                                    break;
                                case "Decimal":
                                case "Double":
                                case "Float":
                                case "Single":
                                    $(el).on("focus", _.partial(this.enterNumTextBox, this));
                                    $(el).on("blur", this.generalLeaveTextBox);
                                    break;
                                case "DateTime":
                                    $(el).on("blur", this.generalLeaveDateTextBox);
                                    break;
                            }

                            break;
                        case "PASSWORD":
                        case "CHECKBOX":
                        case "RADIO":
                    }
                    break;

                case "TEXTAREA":
                    // a seconda del tipo di colonna
                    switch (ctype) {
                        case "Int64":
                        case "Int32":
                        case "Int16":
                            $(el).on("blur", this.generalLeaveTextBox);
                            break;
                        case "Decimal":
                        case "Double":
                        case "Float":
                        case "Single":
                            $(el).on("focus", _.partial(this.enterNumTextBox, this));
                            $(el).on("blur", this.generalLeaveTextBox);
                            break;
                        case "DateTime":
                            $(el).on("blur", this.generalLeaveDateTextBox);
                            break;
                    }

                    break;

                case "DIV":
                case "SPAN":
                    if (!this.isManagedCollection(el) && !this.isCustomControl(el)) {
                        this.setAutoMode(el, eltag);
                    }
                    break;
                case "LABEL":
                    break;
                case "TABLE":
                    break;
                case "BUTTON":
                    this.setButtonHandler(el, eltag);
                    break;
            }
        },

        isCustomControl:function (el) {
            var ctrlName = $(el).data("customControl");
            return !!ctrlName
        },

        /**
         * @method setAutoMode
         * @private
         * @description SYNC
         * Manages the logic to add to control for automode. For example during the text leave event framework should launch a manage() or choose() method on metapage.
         * "el" has tag: AutoChoose.TextBoxName.ListType.StartFilter or AutoManage.TextBoxName.EditType.StartFilter
         * @param {Html element} el.  Div or Span containing the autochoose or automanage text
         * @param {string} tag
         */
        setAutoMode:function (el, tag) {

            if (!tag) return;
            $(el).addClass(cssDefault.autoChoose); //  G.BackColor = formcolors.AutoChooseBackColor(); deleghiamo la cosa al css
            var tablename = null;
            var kind = this.getField(tag, 0);
            var type = this.getField(tag, 2);
            var startFilter = this.getFilterFormDataAttribute(el);  // N.B il filtro è impostato dall'esterno, tramite la MetaPage.registerFilter()

            //Gets start value - start field from control named textboxname
            var startf = null;
            var currTextBox;
            var tname = this.getField(tag, 1);
            var self = this;
            if (tname) {
                $(el).find("input[type=text], textarea")
                    .each(function() {
                        if ($(this).attr("name") !== tname) return true;
                        var currTag = $(this).data("tag");
                        if (!currTag) return false;
                        var standardTag = self.getStandardTag(currTag);
                        if (!standardTag) return false;
                        var ttag = self.getStandardTag(standardTag);

                        tablename = self.getFieldLower(ttag, 0);
                        if (!tablename) return false;
                        if (!self.DS.tables[tablename]) return false;

                        var tcol = self.getColumnName(ttag);
                        if (!tcol) return false;
                        startf = tcol;
                        //startv = $(this).text(); ??
                        currTextBox = $(this);
                        return true;
                    });
            }

            if (currTextBox) {
                var ai = new appMeta.AutoInfo(el, type, startFilter, startf, tablename, kind);
                var unlinked = (!this.pageState.AE[tname]);
                this.pageState.AE[tname] = ai;
                currTextBox.data(self.autoInfoDataTag, ai);//in data-autoinfo memorizzo l'autoinfo del textbox

                if (unlinked) {
                    currTextBox.on("focus", _.partial(this.textBoxGotFocus, this));
                    // nel caso di 2 autochoose consecutive scatta la perdita di focus sulla seconda se premo tab sulla 1a.
                    // e quindi scatta autochoose solo se premo tab  oppure click del mouse dell'utnete da 1 altra parte, non automaticamente
                    // quindi tolgo possibilità di ricevere focus tramite tab
                    currTextBox.attr('tabindex', '-1');
                    currTextBox.on("blur", _.partial(this.textBoxLostFocus, this ));
                    // aggiunge il text invisibile, che verrà utilizzato in ricerca tramite id sulla tabella referenziata,
                    // inoltre aggiungo al tag ?x in modo tale che se non c'è un search tag il campo verrà
                    // comunque abilitato in inserimento.
                    if (this.addInvisibleTextBox(ai)) {
                        $(currTextBox).data("tag", this.getStandardTag($(currTextBox).data("tag")) + "?x");
                    }
                }
            } else {
                logger.log(logType.ERROR, 'HelpForm.setAutoMode', "Non ho trovato il txtBox di nome " + tname + " nel groupbox, oppure la tabella del tag non esiste sul dataset", el);
            }
        },

        /**
         * @method mainChildRelation
         * @private
         * @description SYNC
         * Finds the main relation with "primary table", and if not exist, it loops on extraEntities and takes the first relation
         * @param {DataTable} parentTable
         * @returns {DataRelation} teh main DataRelation of parentTable
         */
        mainChildRelation:function(parentTable) {
            if (!parentTable) return null;
            var foundRelExtraEntity = null;
            var foundMainRel = null;
            var self = this;

            // loop sulle child relazioni, se trovo quella con tabella principale la restituisco
            // altrimenti prendo una plusibile inserita tra le extra entities
            _.forEach(parentTable.childRelations(), function (rel) {

                if (rel.childTable === self.primaryTableName){
                    foundMainRel = rel;
                    return false;
                }

                _.forEach(self.pageState.extraEntities, function (extra) {
                    if (rel.childTable === extra) {
                        foundRelExtraEntity = rel;
                        return  false;
                    }
                });

            });

            return foundMainRel || foundRelExtraEntity;

        },

        /**
         * @method addInvisibleTextBox
         * @private
         * @description SYNC
         * Adds an invisible text to the groupbox linked to an Autoinfo
         * @param {AutoInfo} ai
         * @returns {boolean}
         */
        addInvisibleTextBox: function (ai) {
            var parentTable = ai.table;
            var tParentTable = this.DS.tables[parentTable];
            if (!tParentTable) return false;

            var rel = this.mainChildRelation(tParentTable); //tParentTable.childRelations()[0];
            if (!rel) return false;
            var childTable = rel.childTable;
            if (rel.childCols.length > 1) return false;

            ai.parentTable = tParentTable;   //it is  a DataTable
            ai.childTable = this.DS.tables[childTable];  //it is  a DataTable
            ai.childField = rel.childCols[0];
            ai.parentField = rel.parentCols[0];

            var txtName = "InvisibleTxt" + parentTable + "_" + childTable;
            if (childTable !== this.primaryTable.name) {
                //txtName = "SubEntity" + txtName;
                this.addExtraEntity(childTable);
            }
            var txt = $("<input hidden readonly>").attr({
                type: "text",
                id: txtName,
                "data-tag": parentTable + "." + ai.parentField + "?" + childTable + "." + ai.childField
            });
            ai.invisibleTextBox = txt;

            txt.appendTo(ai.G);

            return txt;
        },

        /**
         * @method lastValidText
         * @private
         * @description SYNC
         * Gets or sets the last valid text in autochoose/automanage textbox
         * @param {html input|string} text
         * @returns {string}
         */
        lastValidText: function(txt) {
            if (txt === undefined) return this.pageState.lastTextNoFound;
            if (typeof txt === "string") {
                this.pageState.lastTextNoFound = txt;
                return txt;
            }
            this.pageState.lastTextNoFound = this.evaluateLastValidText(txt);
            return this.pageState.lastTextNoFound;
        },

        /**
         * @method evaluateLastValidText
         * @private
         * @description SYNC
         * Returns a concatenation <id of textbox>#<value of textbox>
         * @param {html input} textBox
         * @returns {string}
         */
        evaluateLastValidText: function (textBox) {
            return $(textBox).attr("id") + "#" + $(textBox).val();
        },

        /**
         * @method textBoxGotFocus
         * @private
         * @description ASYNC
         * Called when a textbox receives focus; stores its initial text. "this" is the textBox
         * @param {HelpForm} that
         * @returns {Deferred}
         */
        textBoxGotFocus: function (that) {
            if ($(this).prop("readonly")) return;
            if ($(this).prop("disabled")) return;
            if (that.insideTextBoxLeave) return; // does nothing where another textbox is still leaving focus
            that.lastValidText(this); // set lastTextNoFound

            //lancio evento SOLO PER TESTARE!
            //that.metaPage.eventManager.trigger(appMeta.EventEnum.textBoxGotFocus, that, "textBoxGotFocus");
            return  Deferred('textBoxGotFocus').resolve();
        },

        /**
         * @method textBoxLostFocus
         * @private
         * @description ASYNC
         * Called when a textbox loses focus. "this" is the textBox. Manages the cases of AutoChoose or AutoManage
         * @param {HelpForm} that
         * @returns {Deferred}
         */
        textBoxLostFocus: function(that, ev) {
            var def = Deferred('textBoxLostFocus' + $(this).attr("id"));
            if (that.insideTextBoxLeave) return def.resolve(false);
            var textBox = this;
            if ($(textBox).prop("readonly")) return def.resolve(false);
            if ($(textBox).prop("disabled")) return def.resolve(false);

            var savedLastTextNoFound = that.lastValidText();

            if (savedLastTextNoFound === $(textBox).attr("id") + "#" + $(textBox).val()) return def.resolve(false);
            /*{
                return that.metaPage.showMessageOk(locale.noElementFound)
                    .then(function () {
                        that.applyFocus(textBox);
                         //no change has been made on text
                })

            }*/
            var ai = $(textBox).data(that.autoInfoDataTag);
            if (!ai) return def.resolve(false);
            if (ai.busy) return def.resolve(false);
            ai.busy = true;
            var saved = that.pageState.closeDisabled;
            that.pageState.closeDisabled = true;
            var filter;
            var oldTag = $(textBox).data("tag");
            that.metaPage.titleAutochoose = $("label[for='" + $(textBox).attr('id') + "']").length > 0 ? $("label[for='" + $(textBox).attr('id') + "']").text() : ai.startfield; // salvo in var campo su cui ho fatto autochoose, la msoterò sullsitmanger
            if (ai.kind === "AutoManage") {
                $(textBox).data("tag", null); // removes temporarily the tag from the textbox
                filter = that.iterateGetSpecificSearchCondition(ai.G, ai.table);
                $(textBox).data("tag", oldTag); //restores the tag
            } else {
                var oldVal = $(textBox).val();
                var txtBoxTag = that.getStandardTag(oldTag);
                $(textBox).data("tag", txtBoxTag);
                var cType = that.getCtypeTagFromElTag(txtBoxTag);
                if (cType === "String" && !oldVal.endsWith("%")) $(textBox).val(oldVal + "%"); // temporarily appends a % to create a like filter

                filter = that.iterateGetSpecificSearchCondition(ai.G, ai.table); //ex AI.G
                $(textBox).val(oldVal);
                $(textBox).data("tag", oldTag); //restores the tag
            }

            var startValue = $(textBox).val().trim();
            var selected = false;

            var res = utils._if(startValue === "")
                ._then(function () {
                    return that.metaPage.choose("choose." + ai.table + ".unknown.clear", null, ai.G).then(function () {
                        selected = true;
                        return true;
                    })
                })
                .then(function () {

                    var newStr = that.evaluateLastValidText(textBox);
                    if (newStr === that.lastValidText()) {
                        ai.busy = false;
                        that.pageState.closeDisabled = saved;
                        return def.resolve(true);
                    }
                    that.lastValidText(textBox);
                    that.insideTexBoxLeave = true;

                    filter  = that.mergeFilters(filter, ai.startFilter);

                    //do a choose.table.listtype.filter

                    return utils._if((!selected) && (ai.kind === "AutoChoose"))
                        ._then(function () {
                            return that.metaPage.choose("choose." + ai.table + "." + ai.type, filter, null)
                                .then(function(result) {
                                    selected = result;
                                    return true;
                                });
                        }).then(function () {
                            return utils._if((!selected) && (ai.kind === "AutoManage"))
                                ._then(function () {
                                    return that.metaPage.manage("manage." + ai.table + "." + ai.type,
                                        ai.startfield,
                                        startValue,
                                        filter,
                                        ai.G)
                                        .then(function(result) {
                                            selected = result;
                                            return true;
                                        });
                                })
                                .then(function () {
                                    if (selected) {
                                        that.lastValidText(textBox);

                                    } else {
                                        that.lastValidText(savedLastTextNoFound);
                                        that.applyFocus(textBox);
                                    }
                                    that.insideTexBoxLeave = false;
                                    ai.busy = false;
                                    that.pageState.closeDisabled = saved;
                                    return def.resolve(true);
                                })
                        })
                });


            return def.from(res).promise();

        },

        /**
         * @method setButtonHandler
         * @private
         * @description SYNC
         * Adds the events to the control button. Each button could have a tag. Depending on this tag it adds different handler to the click event
         * @param {html button} el
         * @param {string} tag
         */
        setButtonHandler:function (el, tag) {
            if (!tag) tag = "";
            tag = tag.toLowerCase();

            if (tag.startsWith("edit")){
                $(el).text(locale.editButton);
                $(el).on("click", _.partial(this.metaPage.editClick, this.metaPage));
                return;
            }

            if (tag.startsWith("delete")){
                $(el).text(locale.deleteButton);
                $(el).on("click", _.partial(this.metaPage.deleteClick, this.metaPage));
                return;
            }

            if (tag.startsWith("insert")){
                $(el).text(locale.insertButton);
                $(el).on("click", _.partial(this.metaPage.insertClick, this.metaPage));
                return;
            }

            if (tag.startsWith("unlink")){
                $(el).text(locale.unlinkButton);
                $(el).on("click", _.partial(this.metaPage.unlinkClick, this.metaPage));
                return;
            }

            // Convenzione per cui ove prima ci fosse stata una parte di tag contenente un filtro,
            // questo va estratto da un data attribute del button, data-filter
            var filter = this.getFilterFormDataAttribute(el);

            // per i bottoni che trovo bindo il metodo doMainCommand() su metaPage
            $(el).on("click", _.partial(this.metaPage.doMainCommandClick, this.metaPage, tag , filter));

        },

        /**
         * @method getFilterFormDataAttribute
         * @private
         * @description SYNC
         * Returns the data-attribute "filter" of the control "el"
         * @param {html element} el , should be a button or textbox
         * @returns {jsDataQuery}
         */
        getFilterFormDataAttribute:function (el) {
            return $(el).data("filter");
        },

        /**
         * @method getLinkedGrid
         * @private
         * @description SYNC
         * Gets the grid contained in the same parent container of "el", undefined if the grid doesn't exist
         * @param {Html node} el usually a button
         * @returns {GridControl}
         */
        getLinkedGrid:function (el) {
            var g;
            $(el).parent()
                .children()
                .each(function() {
                    if ($(this).attr("data-custom-control") === "gridx") {
                        g = $(this).data("customController");
                        return false;
                    }
                    return true;
                });

            return g;
        },

        /**
         * @method getCurrentRow
         * @private
         * @description SYNC
         * Gets the current row from ComboBox, Grids and tree-views. Return false on errors
         * @param {Html node} el
         * @returns {Object} {table:DataTable, row:ObjectRow}
         */
        getCurrentRow: function(el) {
            var controller = $(el).data("customController");
            if (controller) {
                if (controller.getCurrentRow) {
                    return controller.getCurrentRow();
                }
            }
            return { table: null, row: null };
        },

        /**
         * @method findExternalRow
         * @private
         * @description SYNC
         * Returns a row having same key as "r" from a table "t"
         * @param {DataTable} t
         * @param {ObjectRow} r
         * @returns {ObjectRow|null}
         */
        findExternalRow: function(t, r) {
            if (!r) return r;
            var found = t.select(t.keyFilter(r));
            if (found.length === 0) return null;
            return found[0];
        },

        /**
         * @method iterateFillRelatedControls
         * @private
         * @description SYNC
         * Fills parent's child controls related to a specified DataTable "changedTable"
         * @param {Html node} parent
         * @param {Html node} changedControl
         * @param {DataTable} changedTable
         * @param {ObjectRow} changedRow
         */
        iterateFillRelatedControls: function(parent, changedControl, changedTable, changedRow) {
            var that = this;
            $(parent).children().each(function() { //only travels a single level down the DOM tree
                if (this !== changedControl) {
                    if (that.isManagedCollection(this)) {
                        //smette di iterare
                        that.fillRelatedToRowControl(this, changedTable, changedRow);
                    } else {
                        that.fillRelatedToRowControl(this, changedTable, changedRow);
                        that.iterateFillRelatedControls(this, changedControl, changedTable, changedRow);
                    }
                }
            });
        },

        /**
         * @method iterateSetDataRowRelated
         * @private
         * @description SYNC
         * Fills a collection of controls in order to display a specified row.
         * Only controls linked to the right table are affected. All others are left unchanged.
         * @param {Html node} parent
         * @param {DataTable} changedTable
         * @param {ObjectRow} changedRow Row to display
         */
        iterateSetDataRowRelated: function(parent, changedTable, changedRow) {
            var that = this;
            $(parent).children().each(function() {
                if (that.isManagedCollection(this)) {
                    // smette di iterare
                    that.fillRelatedToRowControl(this, changedTable, changedRow);
                } else {
                    that.fillRelatedToRowControl(this, changedTable, changedRow);
                    that.iterateSetDataRowRelated(this, changedTable, changedRow);
                }
            });
        },


        /**
         * @method fillRelatedToRowControl
         * @private
         * @description SYNC
         * Fills parent's child controls related to a specified changedTable
         * @param {Html node} el
         * @param {DataTable} changedTable
         * @param {ObjectRow} changedRow
         */
        fillRelatedToRowControl: function(el, changedTable, changedRow) {
            switch (el.tagName.toUpperCase()) {
                case "INPUT":
                    switch ($(el).attr("type").toUpperCase()) {
                        case "TEXT":
                        case "PASSWORD":
                        case "CHECKBOX":
                        case "TEXTAREA":
                        case "RADIO":
                            this.fillRelatedToRowControlGeneral(el, changedTable, changedRow);
                            return;
                    }
                    break;
                case "TEXTAREA":
                    this.fillRelatedToRowControlGeneral(el, changedTable, changedRow);
                    return;
                case "DIV":
                case "SPAN":
                    if (this.isManagedCollection(el)) {
                        this.fillRelatedToRowControlGeneral(el, changedTable, changedRow);
                        return;
                    }
                    break;
            }

            // N.B: GRID e COMBO rientrano nel giro della subscribe a appMeta.EventEnum.ROW_SELECT
        },

        /**
         * @method fillRelatedToRowControlGeneral
         * @private
         * @description SYNC
         * Sets the value of a control "el" based on its tag and on dataset content, only if there is a db relation with the input row "changedRow"
         * @param {Html element} el
         * @param {DataTable} changedTable
         * @param {ObjectRow} changedRow
         **/
        fillRelatedToRowControlGeneral: function( el, changedTable, changedRow) {
            var changedTableName = changedTable.name;
            var eltag = $(el).data("tag");

            var tag = this.getStandardTag(eltag);
            if (!tag) return;

            var tagTableName = this.getTableName(tag);
            if (!tagTableName) return;

            var tagTable = this.DS.tables[tagTableName];
            if (!tagTable) return;

            var tagColumnName = this.getColumnName(tag);
            if (!tagColumnName) return;

            var col = tagTable.columns[tagColumnName];
            if (!col) return;

            // memorizzerà il valore da fillare
            var val = changedRow ? changedRow[tagColumnName] : null;

            // CASO STESSA TABELLA
            if (changedTableName === tagTableName) {
                this.setControl(el, tagTable, val, col);
                return;
            }

            // TROVO EVENTUALE RELAZIONE
            var rfound = this.DS.getParentChildRelation(tagTableName, changedTableName);
            if (!rfound) return;
            if (rfound.length === 0) return;
            var relationFound = rfound[0]; // è sempre relazione del dataset this.DS

            if (!changedRow) {
                if (!this.checkToClear(tagTable, tagColumnName, rfound)) return;
                this.setControl(el, tagTable, null, col);
                return;
            }

            // RECUPERO PARENT ROW
            var parentRow = null;

            var parents = relationFound.getParents(changedRow);
            if (parents.length === 1) parentRow = parents[0];

            if (!parentRow) return;
            val = parentRow[tagColumnName];
            this.setControl(el, tagTable, val, col);
        },

        /**
         * @method checkToClear
         * @private
         * @description SYNC
         * Checks if a control displaying  childColumn of child table is to clear, knowing that
         * relation with parent was on column childColumn, assuming Parent Row was not found
         * @param {DataTable} childTable
         * @param {string} childColumn
         * @param {DataRelation} relChild
         * @returns {boolean}
         */
        checkToClear: function(childTable, childColumn, relChild) {
            // verifica che qualche colonna delle child columns non sia chiave
            if (_.some(relChild.childCols,
                    function(cCol) {
                        return childTable.isKey(cCol);
                    })) return false;

            return _.includes(relChild.childCols, childColumn);
        },

        /**
         * @method isManagedCollection
         * @private
         * @description SYNC
         * Returns true if "el" is a "valueSigned" control.
         * @param {Html element} el
         * @returns {boolean}
         */
        isManagedCollection: function (el) {
            var tag = this.getStandardTag($(el).data("tag"));
            if (!tag) return false;
            return $(el).data("valueSigned") !== undefined;
        },

        /**
         * @method isButtonControl
         * @private
         * @description SYNC
         * Returns true if the control "el" is an html button
         * @param {Html element} el
         * @returns {boolean}
         */
        isButtonControl:function (el) {
            var tagName = el.tagName;
            return (tagName.toUpperCase() === "BUTTON");
        },

        /**
         * @method enterNumTextBox
         * @private
         * @description SYNC
         * Manages the "enter" event in a textbox control binded with a Numeric column. It performs some formatting actions.
         * "this" represents the html control that fired the event
         * @param {HelpForm} that
         */
        enterNumTextBox: function(that) {
            if ($(this).prop("disabled")) return;
            if ($(this).prop("readonly")) return;
            var val = $(this).val();
            val = val.trim();
            if (val === "") return;
            var completeTag = $(this).data("tag"); //that.getCompleteTagFromElTag($(this).data("tag"));
            var fieldType = that.getFieldLower(completeTag, 2);
            var s = val;
            if (fieldType === "n") {
                s = s.replace(numberGroupSeparator, "");
                $(this).val(s.trim());
                return;
            }
            if (fieldType === "c") {
                s = s.replace(currencySymbol, "");
                s = s.replace(currencyGroupSeparator, "");
                $(this).val(s.trim());
                return;
            }

            if (fieldType === "fixed") {
                var prefix = that.getFieldLower(completeTag, 4);
                if (prefix === null) prefix = "";
                var suffix = that.getFieldLower(completeTag, 5);
                if (suffix === null) suffix = "";
                if (prefix !== "") s = s.replace(prefix, "");
                if (suffix !== "") s = s.replace(suffix, "");
                s = s.replace(numberGroupSeparator, "");
                $(this).val(s.trim());
            }
        },

        /**
         * @method generalLeaveTextBox
         * @private
         * @description SYNC
         * Manages the "leave" event from a text box with Decimal, Double column.
         * "this" represents the html control that fired the event
         */
        generalLeaveTextBox: function() {
            if ($(this).prop("disabled")) return;
            if ($(this).prop("readonly")) return;
            var val = $(this).val();
            val = val.trim();
            if (val === "") return;
            var completeTag = $(this).data("tag");
            var ctype = $(this).data("mdlColType");
            $(this).val(new TypedObject(ctype, val, completeTag).stringValue(completeTag));
        },

        /**
         * @method generalLeaveDateTextBox
         * @private
         * @description SYNC
         * Manages the leave event from text box with DateTime
         * "this" represents the html control that fired the event
         */
        generalLeaveDateTextBox: function() {
            if ($(this).prop("disabled")) return;
            if ($(this).prop("readonly")) return;

            var val = $(this).val();
            val = val.trim();
            if (val === "") return;
            var completeTag = $(this).data("tag");
            var ctype = $(this).data("mdlColType");
            try {
                $(this).val(new TypedObject(ctype, val, completeTag).stringValue(completeTag));
                return;

            } catch (e) {
                //throw "Unable to set value on textbox on leave Event:"+e;
            }

            var len = val.length;
            var obj = null;
            while (len > 0) {
                try {
                    obj = new TypedObject(ctype, val, completeTag);
                    break;
                } catch (e) {
                    //throw "Unable to set value on textbox on leave Event";
                }
                len = len - 1;
                val = val.substring(0, len);
            }

            $(this).val(obj === null ? "" : obj.stringValue(completeTag));
        },

        /**
         * @method getCurrParentRow
         * @private
         * @description SYNC
         * Gets the current parent Row of the specified Primary row. Can return null if the parent table is not parent-related with primary.
         * Returns a datarow also when there is exactly one row both in primary and parent table.
         * @method getCurrParentRow
         * @param {ObjectRow} primary
         * @param {DataTable} parent
         * @returns {ObjectRow|null}
         */
        getCurrParentRow: function(primary, parent) {
            if (!primary) return null;
            if (!parent) return null;
            var primaryRow = primary.getRow();
            var rels = parent.dataset.getParentChildRelation(parent.name, primaryRow.table.name);
            if (rels.length === 0) {
                if (primaryRow.table.rows.length === 1 && parent.rows.length === 1) return parent.rows[0];
                return null;
            }
            var rel = rels[0];
            var parents = rel.getParents(primary);
            if (parents.length === 1) return parents[0];
            return null;
        },

        /**
         * @method getCurrParentRow
         * @private
         * @description SYNC
         * Gets a child of a "row" located in a specified table "child"
         * @param {ObjectRow} parentRow
         * @param {DataTable} childTable
         * @returns {ObjectRow}
         */
        getCurrChildRow: function(parentRow, childTable) {
            if (!parentRow) return null;
            if (!childTable) return null;
            var rels = this.DS.getParentChildRelation(parentRow.getRow().table.name, childTable.name);
            var rFound = rels ? (rels[0]) : null;
            if (!rFound) {
                if (parentRow.getRow().table.rows.length === 1) {
                    if (childTable.rows.length === 1) return childTable.rows[0];
                }
                if (childTable.parentRelations().length !== 1) return null;
                var childRel = childTable.parentRelations()[0];
                var parentTable = childRel.parentTable;
                var currParent = this.getCurrChildRow(parentRow, this.DS.tables[parentTable]);
                var currChilds = currParent ? currParent.getRow().getChildRows(childRel.name) : null;
                return  currChilds ? (currChilds.length === 1 ? currChilds[0] : null) : null
            }
            var childs = parentRow.getRow().getChildRows(rFound.name);
            return childs.length == 1 ? childs[0] : null;
        },

        /**
         * @method getControls
         * @public
         * @description SYNC
         * Reads all data of the controls in the rootElement container that have data-tag attribute.
         *  data-tag  contains the tag
         *  data-subentity if present indicates that the table is a subentity
         */
        getControls: function() {
            this.iterateOverTag("tag", "getControl");
        },

        /**
         * @method clearControl
         * @private
         * @description SYNC
         * Clears a control "el". Clear the value of the control.
         * @param {html node} el
         */
        clearControl: function (el) {
            var ctrl = $(el).data("customController");
            if (ctrl) {
                ctrl.clearControl(el);
                return;
            }

            var eltag = $(el).data("tag");
            var tag = this.getStandardTag(eltag);
            if (!tag) return;

            var tagName = el.tagName;

            this.reEnable(el);

            switch (tagName.toUpperCase()) {
                case "INPUT":
                    switch ($(el).attr("type").toUpperCase()) {
                        case "TEXT":
                        case "PASSWORD":
                        case "TEXTAREA":
                            $(el).val("");
                            break;
                        case "CHECKBOX":
                            // Nella clear lo forziamo ad indeterminate
                            // $(el).data("threestate", true);
                            $(el).prop("indeterminate", true);
                            $(el).data("mdlindeterminate", true);
                            $(el).prop("checked", false);

                            break;
                        case "RADIO":
                            $(el).prop("checked", false);
                            break;
                    }
                    break;
                case "TEXTAREA":
                    $(el).val("");
                    break;
                case "DIV":
                case "SPAN":
                    break;
                case "LABEL":
                    return;
                case "TABLE":
                    $(el).find("tr:not(:has(th))").remove();
                    return;
            }

        },

        /**
         * @method clearControl
         * @public
         * @description SYNC
         * Clears all the controls manged by the framework
         */
        clearControls: function() {
            return this.iterateOverTag("tag", "clearControl");
        },

        /**
         * @method enableControl
         * @private
         * @description SYNC
         * Enables a control "el"
         */
        enableControl: function(el) {
            $(el).prop("disabled", false);
        },

        /**
         * @method disableControl
         * @private
         * @description SYNC
         * Disables a control "el" and marks it as "toEnable" so it will be re-enabled by reEnable() method
         * @param {html node} el
         * @param {boolean} hideContent
         */
        disableControl: function(el, hideContent) {
            var tagName = el.tagName.toUpperCase();
            if (tagName === "LABEL") return;

            if (tagName === "DIV" || tagName === "SPAN") {
                if ($(el).prop("disabled")) return;
                $(el).prop("disabled", true).data("mdlTagToEnable", true);
                //disable all not disable content, putting tagToEnable flag on them
                $(el).find(":input:not(:disabled)").data("mdlTagToEnable", true).prop("disabled", true);
                return;
            }
            if (tagName === "INPUT") {
                switch ($(el).attr("type").toUpperCase()) {
                    case "TEXT":
                    case "TEXTAREA":
                        if (hideContent) $(el).attr("type", "password");
                        if ($(el).prop("readonly")) return;
                        $(el).data("mdlTagToEnable", true).prop("readonly", true); // textbox are disabled setting readonly property
                        break;

                    case "PASSWORD":
                        if (!hideContent) $(el).attr("type", "text");
                        if ($(el).prop("readonly")) return;
                        // passwords are disabled setting readonly property
                        $(el).data("mdlTagToEnable", true).prop("readonly", true);
                        break;
                    default:
                        if ($(el).prop("disabled")) return;
                        $(el).prop("disabled", true).data("mdlTagToEnable", true);
                }
                return;
            }

            if (tagName === "TEXTAREA"){
                if (hideContent) $(el).attr("type", "password");
                if ($(el).prop("readonly")) return;
                $(el).data("mdlTagToEnable", true).prop("readonly", true); // textbox are disabled setting readonly property
            }

            if ($(el).prop("disabled")) return;

            $(el).data("mdlTagToEnable", true).prop("disabled", true);

        },

        /**
         * @method reEnable
         * @private
         * @description SYNC
         * Enables again a control "el" that has been previously disabled by the framework
         * @method reEnable
         * @private
         * @param {html element} el
         */
        reEnable: function(el) {
            var eltag = $(el).data("tag");
            var tag = this.getStandardTag(eltag);
            if (!tag) return;
            // se non è presente questo attributo non devo rieffettuare le'nable
            if (!$(el).data("mdlTagToEnable")) return;
            var tagName = el.tagName;

            //remove readonly
            if (tagName.toUpperCase() === "INPUT" || tagName.toUpperCase() === "TEXTAREA") {
                var inputType = $(el).attr("type").toUpperCase();
                if (inputType === "PASSWORD") {
                    $(el).attr("type", "text");
                    inputType = "TEXT";
                }
                if (inputType === "TEXT" || tagName.toUpperCase() === "TEXTAREA") {
                    if ($(el).prop("readonly")) $(el).prop("readonly", false);
                } else {
                    this.enableControl(el);
                }
            } else {
                this.enableControl(el);

                var self = this;
                // loop sui child interni che hanno mdlTagToEnable impostato a true
                $(el).children().filter(function() {
                    return ($(this).data('mdlTagToEnable') === true);
                }).each(function() {
                    self.enableControl(this);
                });

            }
            $(el).removeData("mdlTagToEnable");
        },

        /**
         * @method fillControls
         * @public
         * @description SYNC
         * Executes the fill of all html controls with the data-tag configured, contained in the root tag.
         *  Also enables/disables controls and sets their appearance accordingly to the form state
         * @returns {Deferred}
         */
        fillControls: function(container) {
            container = container || this.rootElement;
            return this.fillControlsGroup(container);
        },

        /**
         * @method enableDisable
         * @public
         * @description SYNC
         * Enables or disables a control accordingly to form state and to the linked field
         * @param {html node} c
         * @param {DataTable} table
         * @param {Object} column
         */
        enableDisable: function(c, table, column) {
            var tagName = c.tagName.toUpperCase();
            var eltag = $(c).data("tag");
            if (tagName === "LABEL") return;
            if (this.pageState.isSearchState()) {
                this.reEnable(c);
                return;
            }

            var currRow = this.lastSelected(this.primaryTable);
            if (this.pageState.isEditState() && currRow === null) {
                //If there is no primary table row disable all controls
                this.disableControl(c, false);
                return;
            }

            if (table.name === this.primaryTableName) {
                //Table is primary
                if (column) {
                    if (table.autoIncrement(column.name)) {
                        this.disableControl(c, this.pageState.isInsertState()); //hide and disable autoincrements fields on insert
                        return;
                    }
                }
                if (this.pageState.isInsertState()) {
                    //Enable all other fields on insert mode, unless they have been disable at design time
                    this.reEnable(c);
                    return;
                }

                if (column){
                    if (this.primaryTable.isKey(column.name)) {
                        //Disable primary key fields on edit mode
                        this.disableControl(c, false);
                        return;
                    }

                    var rel = getDataUtils.getAutoChildRelation(this.primaryTable);
                    if (rel){
                        if (_.includes(rel.childCols, column.name)){
                            this.disableControl(c, false);
                            return;
                        }
                    }

                }

                //Re enable all other fields in edit mode if they had been disabled
                this.reEnable(c);
                return;

            }
            //Table is not primary
            var t1 = this.getStandardTag(eltag);
            var t2 = this.getSearchTag(eltag);

            var subentity = this.existsDataAttribute(c, "subentity"); //flag che indica se la tabella è una subentità

            if (t1 === t2) {
                if (!subentity) {
                    //Disable all controls except subentity fields
                    this.disableControl(c, false);
                    return;
                }

                var currChild = this.getCurrChildRow(currRow, table);
                if (currChild === null) {
                    this.disableControl(c, false);
                    return;
                }

                //leave the control enabled
                this.reEnable(c);
                return;
            }

            // search tag has been specified and  Table is not primary
            if (this.pageState.isInsertState()) {
                this.reEnable(c);
                return;
            }

            // Table is not primary, mode is edit and search tag specified. In this case table could be a parent of primary table
            if (metaModel.isParentTableByKey(this.DS, table, this.primaryTable)) {
                this.disableControl(c, false);
                return;
            }

            this.reEnable(c);
        },

        /**
         * @method fillControl
         * @private
         * @description ASYNC
         * Executes the fill of a control "el" with the data-tag configured.
         *  Also enable/disable the control and set its appearance accordingly to form state
         * @param {html element} el
         * @param {object} value
         */
        fillControl: function(el, value) {
            // check sul tag. anche se in questo punto del codice, l'elemtno html dovrebbe avere il tag

            var eltag = $(el).data("tag");
            var tag = this.getStandardTag(eltag);
            var def = Deferred("fillControl " + tag);
            if (!tag) return def.resolve();
            var self = this;

            if (this.isButtonControl(el)) {
                this.setEnableGridButtons(el, eltag);
                this.setMainButtons(el, eltag);
                return def.resolve();
            }

            var tableName = this.getTableName(tag);
            if (!tableName) return def.resolve();
            var datatable = this.DS.tables[tableName];
            if (!datatable) return def.resolve();


            // il caso "GridControl" o "TreeViewMaanger" o derivati non esegue calcolo del value, poichè non necessita di un value, inoltre il tag è differente
            // quindi nel caso grid si creerebbero casi inconsisteni
            var ctrl = $(el).data("customController");
            var isStandardFill = ctrl ? ctrl.isStandardFill : true;

            var column, dataColumn ;

            if (isStandardFill){
                column = this.getColumnName(tag);
                if (column === null && value === undefined) return def.resolve();
                dataColumn = datatable.columns[column];
                if (!dataColumn && value === undefined) return def.resolve();
                //rimane il caso in cui value !== undefined e column null
            }

            if (value === undefined && isStandardFill) {
                var r = null;
                var currPrimary = this.lastSelected(this.primaryTable);

                if (currPrimary) {
                    if(currPrimary.getRow){
                        var currPrimaryRow = currPrimary.getRow();
                        if (currPrimaryRow.state === dataRowState.deleted) currPrimary = null;
                    }else{
                        currPrimary = null;
                    }
                }

                if ((currPrimary === null) || (tableName === this.primaryTableName)) {
                    // se non è tabella principale  e la tabella principale è vuota, assumi vuoto
                    r = currPrimary;
                } else {
                    // tabella secondaria
                    this.enableDisable(el, datatable, dataColumn);

                    // if the table is parent or child of primary table, try to draw it
                    r = this.getCurrChildRow(currPrimary, this.DS.tables[tableName]) ||
                        this.getCurrParentRow(currPrimary, this.DS.tables[tableName]);
                    if (r === null) {
                        var nFound = 0;
                        var dataRowFound = null;
                        //check if it is parent of an extra entity row
                        _.forOwn(
                            this.pageState.extraEntities,
                            function(extraName) { //consideriamo extraName come facente funzione della currPrimary
                                var extraRel = self.DS.getParentChildRelation(self.primaryTableName, extraName);
                                if (extraRel.length === 0) return true; //continue
                                var childRow = currPrimary.getRow().getChildRows(extraRel[0].name);
                                if (childRow.length !== 1) return true; //continue
                                var toConsider = childRow[0]; //fa le veci della currPrimary
                                var r1 = self.getCurrParentRow(toConsider, self.DS.tables[tableName]);
                                if (r1 !== null) {
                                    nFound++;
                                    dataRowFound = r1;
                                }
                                if (nFound > 1) return false; //break;
                                return true;
                            });
                        // non possono esserci più di una, significa c'è qualcosa di sbagliato
                        if (nFound === 1) {
                            r = dataRowFound;
                        }
                    }
                }

                if (!r || r.state === dataRowState.deleted) r = null;
                value = (r === null) ? null : r[column];
            }

            var that = this;

            if (ctrl) {
                return def.from(ctrl.fillControl(el, value)
                    .then(function () {
                        if(isStandardFill) that.enableDisable(el, datatable, dataColumn);
                        return true;
                    })).promise();

            } else {
                this.setControl(el, datatable, value, dataColumn);
                return def.resolve();
            }
        },

        /**
         * @method fillSpecificRowControls
         * @private
         * @description ASYNC
         * Fills "currRootElement" children controls related to all fields of a dataRow
         * @param {Html node} currRootElement
         * @param {DataTable} table
         * @param {DataRow} dataRow Row from which values have to be taken
         * @returns {Deferred}
         */
        fillSpecificRowControls:function(currRootElement, table, dataRow) {
            var self = this;
            var allCtrlPromise = [];
            $(currRootElement)
                .find("[data-tag]")
                .each(function () {
                        if ($(this).parents("[data-custom-control]").length > 0) {
                            return;
                        }
                        if ($(this).parents("[data-value-signed]").length > 0) {
                            return;
                        }

                        allCtrlPromise.push(self["fillSpecificRowControl"](this, table, dataRow));//"this" is the html element
                });
            return Deferred("fillSpecificRowControls").from($.when.apply($, allCtrlPromise));

        },

        /**
         * @method fillSpecificRowControl
         * @private
         * @description ASYNC
         * Fills "el" control related to all fields of a row
         * @param {Html node} el
         * @param {DataTable} table
         * @param {DataRow} dataRow
         * @returns {Deferred}
         */
        fillSpecificRowControl:function (el, table, dataRow) {
            var def = Deferred("fillSpecificRowControl");
            var eltag = $(el).data("tag");
            var tag = this.getStandardTag(eltag);
            if (!tag) return def.resolve();

            var tagTable = this.getTableName(tag);
            if (!tagTable) return def.resolve();
            if (tagTable !== table.name) return def.resolve();

            var column = this.getColumnName(tag);
            if (!column) return def.resolve();

            var fieldValue = null;
            if (dataRow){
                var dataColumn  = dataRow.table.columns[column];
                if (!dataColumn) return def.resolve();

                fieldValue =  dataRow.current[column];
            }

            this.setControl(el, table, fieldValue, dataColumn );
            this.enableDisable(el, table, dataColumn);
            return def.resolve();
        },

        /**
         * @method fillParentControls
         * @private
         * @description ASYNC
         * Fills a collection of controls related to a specified parent Table "parentTable"
         * @param {HtmlElement} el
         * @param {DataTable} parentTable
         * @param {DataRow} parentRow
         */
        fillParentControls:function (el, parentTable, parentRow) {
            var def = Deferred("fillParentControls");
            var self = this;
            //Search relation between PrimaryTable and ParentRow.Table
            var rfound = null;
            _.forEach(this.primaryTable.parentRelations(), function (rel) {
                if (rel.parentTable === parentTable.name) {
                    rfound = rel;
                    return false;
                }
            })

            if (rfound === null)  return def.resolve(false);

            var allCtrlPromise = [];
            _.forEach(rfound.parentCols, function (colParentName, index) {
                var colChildName = rfound.childCols[index];
                if (parentRow) {
                    allCtrlPromise.push(self.fillSpecificControls(el, self.primaryTable, colChildName, parentRow.current[colParentName]));
                }
                else {
                    allCtrlPromise.push(self.fillSpecificControls(el, self.primaryTable, colChildName, null));
                }
            })

            return def.from($.when.apply($, allCtrlPromise));
        },

        /**
         * @method fillSpecificControls
         * @private
         * @description ASYNC
         * Loops on all children controls of "el", managed by framework, and fills them with "fieldValue"
         * @param {Html node} el
         * @param {DataTable} table
         * @param {string} colName
         * @param {string} fieldValue
         * @returns {Deferred}
         */
        fillSpecificControls:function (el, table, colName, fieldValue) {
            var def = Deferred("fillSpecificControls");
            var self = this;
            var allCtrlPromise = [];
            $(el)
                .find("[data-tag]")
                .each(function () {
                    if ($(this).parents("[data-custom-control]").length>0) {
                        return;
                    }
                    if ($(this).parents("[data-value-signed]").length > 0) {
                        return;
                    }

                    allCtrlPromise.push(self["fillSpecificControl"](this, table, colName, fieldValue));// "this" is the html element
                });
            return def.from($.when.apply($, allCtrlPromise));
        },

        /**
         * @method fillSpecificControl
         * @private
         * @description ASYNC
         * Fills "el" control with "fieldValue"
         * @param {Html node} el
         * @param {DataTable} table
         * @param {string} colName
         * @param {string} fieldValue
         * @returns {Deferred}
         */
        fillSpecificControl:function (el, table, colName, fieldValue) {
            var def = Deferred("fillSpecificControl");
            var eltag = $(el).data("tag");
            var tag = this.getStandardTag(eltag);
            if (!tag) return def.resolve();

            var tagTable = this.getTableName(tag);
            if (!tagTable) return def.resolve();
            if (tagTable !== table.name) return def.resolve();

            var columnTag = this.getColumnName(tag);
            if (!columnTag) return def.resolve();
            if ((colName) && (colName !== columnTag))  return def.resolve();


            var dataColumn  = table.columns[columnTag];
            var ctrl = $(el).data("customController");
            if (ctrl){
                var self = this;
                this.fillControl(el, fieldValue).then(function () {
                    self.enableDisable(el, table, dataColumn);
                })
            } else {
                this.setControl(el, table, fieldValue, dataColumn);
                this.enableDisable(el, table, dataColumn);
            }


            return def.resolve();
        },

        /**
         * @method setEnableGridButtons
         * @private
         * @description SYNC
         * If "el" is a button linked to a grid managed by framewrok it enables it.
         * @param {html button} el
         * @param {string} tag
         */
        setEnableGridButtons:function (el, tag) {
            if (!tag) return;
            var cmd = this.getFieldLower(tag, 0);
            var g = this.getLinkedGrid(el);
            if (!g) return;
            if (!g.tag) return;
            var tableName = this.getTableName(g.tag);
            if (!tableName) return;
            var someCurrData = (this.lastSelected(this.primaryTable) !== null);
            if (cmd === ("edit") ||
                cmd === ("insert") ||
                cmd === ("delete") ||
                cmd === ("unlink")
            ) {
                this.enableButton(el, someCurrData);
            }
        },

        /**
         * @method enableButton
         * @private
         * @description SYNC
         * Enables/Disables a button
         * @param {Html button} btn
         * @param {boolean} enable
         */
        enableButton:function (btn, enable) {
            if (enable){
                this.enableControl(btn);
            }else{
                this.disableControl(btn);
            }
        },

        /**
         * @method setMainButtons
         * @private
         * @description SYNC
         * Enables/Disables a button "btn" depending on form status information
         * @param {html button} btn
         * @param {string} tag
         */
        setMainButtons:function (btn, tag) {
            if (!tag) return;
            var cmd = this.getFieldLower(tag, 0);
            var someCurrData = (this.lastSelected(this.primaryTable) !== null);
            switch (cmd) {
                case "mainselect":
                case "mainsetsearch":
                case "comboedit":
                case "maininsert":
                    this.enableControl(btn);
                    return;
                case "maindosearch":
                    this.enableButton(btn, this.pageState.isSearchState());  //TO CHECK FOR MAINDOSEARCH IN LIST FORMS
                    return;
                case "mainsave":
                case "maindelete":
                    var toEnable = (!this.pageState.isSearchState()) && someCurrData;
                    this.enableButton(btn, toEnable); //TO CHECK FOR MAINDOSEARCH IN LIST FORMS
                    return;
                case "maininsertcopy":
                    this.enableButton(btn, this.pageState.isEditState() && someCurrData);
                    return;
                case "choose":
                case "manage":

                    if (this.pageState.isSearchState()) {
                        this.enableButton(btn, true);
                        return;
                    }

                    var tablename = this.getField(tag, 1);
                    if (!tablename) {
                        this.enableButton(btn, false);
                        return;
                    }
                    var chooseTable = this.DS.tables[tablename];
                    if (!chooseTable) {
                        this.enableButton(btn, false);
                        return;
                    }

                    if (this.pageState.isInsertState()) {
                        this.enableButton(btn, true);
                        return;
                    }

                    // Check if relation implies primary key fields of primary table
                    if (metaModel.isParentTableByKey(this.DS, chooseTable, this.primaryTable)) {
                        this.enableButton(btn, false);
                        return;
                    }
                    this.enableButton(btn, true);
                    break;
            }
        },

        /**
         * @method setControl
         * @private
         * @description SYNC
         * Sets the value "value" on the control "el"
         * @param {html node} el
         * @param {DataTable} table
         * @param {object} value
         * @param {object(Column)} column
         */
        setControl: function (el, table, value, column) {
            if (value === null) {
                this.clearControl(el);
            } else {
                var columnType = column ? column.ctype : undefined;
                var tagName = el.tagName;

                // 2) distinguo a seconda del tipo e popolo la riga trovata
                switch (tagName.toUpperCase()) {
                    case "INPUT":
                        switch ($(el).attr("type").toUpperCase()) {
                            case "TEXT":
                            case "DATE":
                            case "PASSWORD":
                            case "TEXTAREA":
                                this.setText(el, value, columnType);
                                var hasFocus = $(el).is(':focus');
                                if (hasFocus) this.lastValidText(el);
                                break;
                            case "CHECKBOX":
                                this.setCheckBox(el, value, columnType);
                                break;
                            case "RADIO":
                                this.setRadioButton(el, value, columnType);
                                break;
                        }

                        break;
                    case "TEXTAREA":
                        this.setText(el, value, columnType);
                        var hasFocus = $(el).is(':focus');
                        if (hasFocus) this.lastValidText(el);
                        break;

                    case "DIV":
                    case "SPAN":
                        if ($(el).data("valueSigned") !== undefined) this.fillValueSignedGroup(el, value, columnType);

                        break;
                    case "LABEL":
                        this.setLabel(el, value, columnType);
                        break;
                }
            }

            this.enableDisable(el, table, column);
        },

        /**
         * @method setLabel
         * @private
         * @description SYNC
         * Fills the label of control "el" with value "value"
         * @param {HTML element} el
         * @param {object} value
         * @param {string} colType
         */
        setLabel: function(el, value, colType) {
            colType = colType || $.data(el, "mdlColType");
            var lblvalue = new TypedObject(colType, value).stringValue(null);
            $(el).html(lblvalue);
        },

        /**
         * @method fillValueSignedGroup
         * @private
         * @description SYNC
         * Fills the signed group control "el"
         * @param {html div| html span} el
         * @param {object} val
         * @param {string} colType
         */
        fillValueSignedGroup: function(el, val, colType) {
            this.reEnable(el);
            var textBox = this.searchValueTextBox(el);
            if (!textBox) return;

            if (val === null || val === undefined) {
                textBox.text = "";
                return;
            }
            colType = colType || $.data(el, "mdlColType");

            var sign = (parseInt(val) > 0);
            if (!sign) val.value = - val.value;
            $(textBox).val(new TypedObject(colType, val).stringValue(null));
            this.setSignForValueSigned(el, sign);

        },

        /**
         * @method setSignForValueSigned
         * @private
         * @description SYNC
         * Loops on radio button in groupbox "el" and sets the correct radio state based on "sign" value
         * @param {Groupbox node} el
         * @param {boolean} sign
         */
        setSignForValueSigned: function(el, sign) {
            //recupera tutti i radio btn
            var arrRadioBtn = $(el).find("input[type=radio]");
            // cicla sui radio button e setta lo stato checked a seconda di quale radio è selezionato e se si tratta di quello con il segno "-"
            _.forEach(
                arrRadioBtn,
                function(rb) {
                    var tag = $(rb).data("tag");
                    if (tag) {
                        if (tag.toString() === "-") rb.checked = !sign;
                        if (tag.toString() === "+") rb.checked = sign;
                    }
                });
        },

        /**
         * @method setText
         * @private
         * @description SYNC
         * Sets the text with the value "value" of the text control "el"
         * @param {html node} el
         * @param {object} value
         * @param {undefined | string} colType
         */
        setText: function(el, value, colType) {
            colType = colType || $(el).data("mdlColType");
            var tag = this.getStandardTag($(el).data("tag"));
            $(el).val(new TypedObject(colType, value, tag).stringValue(tag));
        },

        /**
         * @method setCheckBox
         * @private
         * @description SYNC
         * Sets the checkbox "el" based on value "value" (value read from dataset)
         * @param {html node} el
         * @param {object} value
         * @param {string} colType
         */
        setCheckBox: function(el, value, colType) {
            colType = colType || $(el).data("mdlColType");

            //va anche ragionato e potremmo stabilire che in fase di fill lo mettiamo sempre a false
            //$(el).data("threestate", metaModel.allowDbNull(col) && !metaModel.denyNull(col));

            var tag = this.getStandardTag($(el).data("tag"));
            var pos = tag.indexOf(':');
            if (pos === -1) return;
            var values = tag.substring(pos + 1).trim();
            if (value === null || value === undefined) {
                $(el).prop("checked", false);
                $(el).data("mdlindeterminate", true);
                $(el).prop("indeterminate", true);
                return;
            }

            if (values.indexOf(":") === -1) {
                var negato = false;
                if (values.startsWith("#")) {
                    negato = true;
                    values = values.substring(1);
                }
                var nbit = parseInt(values);
                var aval = 1;
                aval = aval << (nbit);
                var currval = value;
                var x = parseInt(currval);
                var valore = ((x & aval) === aval);
                if (negato) valore = !valore;
                $(el).prop("indeterminate", false);
                el.checked = valore;
            }
            else {
                var yValue = values.split(":", 2)[0].trim();
                //var nValue = values.split(":", 2)[1].trim();
                // confronto le stringhe esatte
                var rowvalue = stringFromJsObj(colType, value);

                // double conversion is necessary if we want to allow date or floating numbers as values
                var rowYvalue = stringFromJsObj(colType, jsObjFromString(colType, yValue));
                $(el).prop("indeterminate", false); // forzo a false poichè se fosse true, ad esempio nelal clear poi anche se faccio .checked lo lascia indeterminate!!
                el.checked = (rowvalue === rowYvalue);
            }

        },

        /**
         * @method setRadioButton
         * @private
         * @description SYNC
         * Sets the radio button "el" based on value "value" (value read from dataset)
         * @param {html node} el
         * @param {object} value
         */
        setRadioButton: function(el, value) {
            var tag = this.getStandardTag($(el).data("tag"));
            var pos = tag.indexOf(":");
            var cvalue = tag.substring(pos + 1).trim();
            if (!cvalue.startsWith(":")) {
                var rowvalue = "";
                if (value !== null && value !== undefined) rowvalue = value.toString();
                if (rowvalue === cvalue)
                    el.checked = true;
                else
                    el.checked = false;
            }
            else {
                //E' un campo bit,
                cvalue = cvalue.substring(1);
                var negato = false;
                if (cvalue.startsWith("#")) {
                    cvalue = cvalue.substring(1);
                    negato = true;
                }

                var nbit = parseInt(cvalue);
                var aval = 1 << (nbit);
                var currval = value;
                if (currval === null) currval = 0;
                var x = parseInt(currval);
                var valore = ((x & aval) === aval);
                if (negato) valore = !valore;

                el.checked = valore;
            }
        },

        /**
         * @method chkBoxClick
         * @private
         * @description SYNC
         * Manages the state transition of a checkbox when it is clicked
         */
        chkBoxClick: function() {
            // "this" will be the control
            // La normale gestione del checkbox è stata GIA applicata dal browser quindi ragioniamo A POSTERIORI
            // per correggere il comportamento ove non ci sta bene quello standard
            var threestate = $(this).data("threestate");
            if (threestate) {
                if ($(this).data("mdlindeterminate")) {
                    $(this).data("mdlindeterminate", false);
                    $(this).prop("checked", false);
                } else {
                    if (!$(this).prop("checked")) {
                        //da true è passato a false: doveva invece passare a indeterminate
                        $(this).data("mdlindeterminate", true);
                        $(this).prop("checked", true);
                        $(this).prop("indeterminate", true);
                    }
                }
            }
        },

        /**
         * @method preScanControl
         * @private
         * @description SYNC
         * Fixes control "el" properties to make it work with the framework
         * @param {html Control} c
         */
        preScanControl: function(el) { //ex adjustTableForDisplay
            var tag = this.getStandardTag($(el).data("tag"));
            if (!tag) return;
            var tagName = el.tagName.toUpperCase(); // INPUT/TABLE/SELECT...
            if (tagName === "BUTTON" ||
                tagName === "SPAN") return; //avoids warning on not existing tables for buttons tag

            var table = this.getTableName(tag);

            if (!table) {
                console.log("Element with tag " + tag + " of a "+tagName+"has not a valid Table in (Standard)Tag (" + table + ")");
                return;
            }

            if (tag.startsWith("TreeNavigator")) {
                table = this.primaryTableName;
                tag = tag.replace("TreeNavigator", table);
            }
            var t = this.DS.tables[table];
            if (!t) {
                console.log("Table  " + table + " of a "+tagName+ "  in (Standard)Tag (" + tag + ") does not exist in the dataset");
                return;
            }

            var subentity = this.existsDataAttribute(el, "subentity"); //flag che indica se la tabella è una subentità
            if (table !== this.primaryTableName && subentity) this.addExtraEntity(table);

            var col;
            var field;
            switch (tagName.toUpperCase()) {
                case "INPUT":
                    field = this.getColumnName(tag);
                    col = t.columns[field];
                    if (!col) {
                        console.log($(el).attr("type") +
                            " control with tag " +
                            tag +
                            " has not a valid Column in (Standard) Tag (" +
                            field +
                            ")");
                        return;
                    }

                    $.data(el, "mdlColType", col.ctype);
                    var elType = $(el).attr("type").toUpperCase();
                    switch (elType) {
                        case "CHECKBOX":
                            $(el).data("threestate", metaModel.allowDbNull(col) && !metaModel.denyNull(col));
                            $(el).on("click", this.chkBoxClick);
                            break;
                        case "TEXT":
                        case "DATE":
                        case "TEXTAREA":
                        case "PASSWORD":
                            tag = this.completeTag(tag, col);
                            this.setStandardTag(el, tag);
                            $(el).attr("maxlength", metaModel.getMaxLen(col));

                            var ctype = this.getCtypeTagFromElTag(tag);
                            var fieldStyle = cssDefault.getColumnsAlignmentCssClass(ctype);
                            $(el).addClass(fieldStyle);


                            // sui controlli data tolgo possibilità di ricevere focus, con tab, per evitare
                            // che si apra il calendarietto in automatico
                            if (ctype === "DateTime") $(el).attr('tabindex', '-1');
                            break;
                    }
                    break;
                case "SELECT":
                    if (!$(el).attr("data-custom-control")) $(el).attr("data-custom-control","combo");
                    if ($(el).attr("data-master")) this.controlsmaster = true;
                    break;
                case "DIV":

                    break;
                case "TEXTAREA":
                    field = this.getColumnName(tag);
                    col = t.columns[field];
                    if (!col) {
                        console.log($(el).attr("type") +
                            " control with tag " +
                            tag +
                            " has not a valid Column in (Standard) Tag (" +
                            field +
                            ")");
                        return;
                    }

                    $.data(el, "mdlColType", col.ctype);
                    tag = this.completeTag(tag, col);
                    this.setStandardTag(el, tag);
                    $(el).attr("maxlength", metaModel.getMaxLen(col));

                    var ctype = this.getCtypeTagFromElTag(tag);

                    // sui controlli data tolgo possibilità di ricevere focus, con tab, per evitare
                    // che si apra il calendarietto in automatico
                    if (ctype === "DateTime") $(el).attr('tabindex', '-1');
                    break;
            }


            //N.B: ---> Questo dovrebbe esser fatto nella prefillCustomControl che quindi chiama la prefill Del treeViewManager
            // A sua volta lì dentro viene fatta la describeTree deferred
            /**
             if (typeof(hwTreeView).IsAssignableFrom(C.GetType())) {
                MetaT.WebDescribeTree((hwTreeView)C, T, MetaT.ListingType(GridTag, 1));
                hwTreeViewManager M = hwTreeViewManager.GetManager(T);
                M.getd = getd;
            }
             */
        },

        /**
         * @method preScanCustomControl
         * @private
         * @description SYNC
         * Creates an instance of customController attaching it to an html element "el", if this is indicated by customControl data tag
         * @param {html node} el
         */
        preScanCustomControl: function(el) {
            var ctrlName = $(el).data("customControl");
            var CustomController = app.CustomControl(ctrlName);
            if (!CustomController) return;

            // recupero tableName dal tag
            var tag = $(el).data("tag");
            var tableName = this.getTableName(tag);
            var table = this.DS.tables[tableName];
            var primaryTable = this.primaryTable;
            var cc = new CustomController(el, this, table, primaryTable);
            if (cc.init) cc.init();
            $(el).data("customController", cc);
        },

        /**
         * @method preScanCustomContainer
         * @private
         * @description SYNC
         * Instantiates a customContainer Controller for control "el" if it has data-attribute "customContainer"
         * @param {html node} el
         */
        preScanCustomContainer: function(el) {
            var ctrlName = $(el).data("customContainer");
            var CustomContainerController = app.CustomContainer(ctrlName);
            if (!CustomContainerController) return;
            $(el).data("containerController", new CustomContainerController(el, this));
        },

        /**
         * @method preFillControls
         * @public
         * @description SYNC
         * Executes a prefill of the controls. Usually combo and grid. Iterates on controls
         * Prefills controls of "tablewanted", or prefills all controls if "tablewanted" is undefined.
         * @param {string} tableWantedName
         * @param {jsDataQuery} filter
         * @param {SelectBuilder[]} selList
         * @returns {Deferred}
         */
        preFillControls:function (tableWantedName, filter, selList) {
            return Deferred("preFillControls")
                .from(this.iterateOverCustomTag("preFill", {tableWantedName:tableWantedName, filter: filter, selList:selList })).promise();
        },

        /**
         * @method preScanControls
         * @public
         * @description SYNC
         * Instantiates all customController for any html elements that requires it
         */
        preScanControls: function () {
            this.iterateOverTag("tag", "preScanControl");
            this.iterateOverTag("custom-control", "preScanCustomControl");
            this.iterateOverTag("custom-container", "preScanCustomContainer");
        },

        /**
         * @method iterateOverTag
         * @private
         * @description ASYNC
         * Executes a function "task" over all elements under the rootElement having a data tag attribute
         * @param {string} tag
         * @param {function} task
         * @param {object} optParam
         * @returns {Deferred}
         */
        iterateOverTag: function(tag, task, optParam) {
            var self = this;
            var allCtrlPromise = [];
            $(this.rootElement)
                .find(" [data-" + tag + "]")
                .each(function () {
                    if ($(this).parents("[data-custom-control]").length > 0) return true;

                    if ($(this).parents("[data-value-signed]").length > 0) return true;

                    allCtrlPromise.push(self[task](this, optParam)); //"this" is the html element
                });

            return Deferred("iterateOverTag").from($.when.apply($,allCtrlPromise));
        },

        /**
         * @method fillControlsGroup
         * @public
         * @description ASYNC
         * @param {string} parentel. the id of the parent html element . Ex "#myid"
         * @returns {Deferred}
         */

        fillControlsGroup:function(parentel) {
            var self = this;
            var chain = $.when();
            var allCtrlPromise = [];

            $(parentel)
                .find("[data-tag]")
                .each(function () {
                    //"this" is the html element
                    if ($(this).parents("[data-custom-control]").length > 0) return true;
                    if ($(this).parents("[data-value-signed]").length > 0) return true;
                    if (self.controlsmaster && this.tagName.toUpperCase() === 'SELECT') {
                        var that = this;
                        chain = chain.then(function () {
                            return self.fillControl(that);
                        });
                    } else {
                        allCtrlPromise.push(self.fillControl(this)); 
                    }
                });

            allCtrlPromise.push(chain);
            return Deferred("fillControlsGroup").from($.when.apply($, allCtrlPromise))
        },

        /**
         * @method iterateOverCustomTag
         * @private
         * @description ASYNC
         * Execute a function "task" over all elements under the root having a data tag.
         * The task is invoked on the element linked instance of the customController
         * @param {function} task
         * @param {object} optParam
         */
        iterateOverCustomTag: function (task, optParam) {
            var allCtrlPromise = [];
            $(this.rootElement + " [data-custom-control] ")
                .each(function(index, el) {
                    var ctrl = $(el).data("customController");
                    if (!ctrl) return;
                    if (!task in ctrl) return;
                    allCtrlPromise.push(ctrl[task](el, optParam));
                });
            return Deferred("iterateOverCustomTag").from($.when.apply($, allCtrlPromise));
        },

        /**
         * @method getControl
         * @private
         * @description SYNC
         * Given an html element "el" reads its value and puts it into the main dataset
         * @param {html node} el
         */
        getControl: function(el) {
            var ctrl = $(el).data("customController");

            var subentity = this.existsDataAttribute(el, "subentity"); //flag che indica se la tabella è una subentità
            var eltag = $(el).data("tag");
            var tagName = el.tagName; // prende il tipo, quindi se è text, checkbox, date, number, radio etc..

            // check preliminare sul tipo di controllo
            if (tagName.toUpperCase() === "LABEL" || tagName.toUpperCase() === "BUTTON") return;


            var tag = this.getStandardTag(eltag); // recupero il tag, serve per prendere tabella e colonna
            var table = this.getTableName(tag); // this.getField(tag, 0);
            if (!table) return;
            if (!this.DS.tables[table]) return;

            // checkboxlist per ora
            if (ctrl && ctrl.isCustomGetcontrol) return ctrl.getControl();

            var column = this.getColumnName(tag);
            if (!column) return;
            if (!this.DS.tables[table].columns[column]) return;

            // 1) retrieve table row from dataset
            var objrow = null;
            if (table === this.primaryTableName) {
                objrow = this.lastSelected(this.primaryTable);
            } else {
                if (subentity) {
                    var currPrimary = this.lastSelected(this.primaryTable);
                    if (currPrimary !== null) {
                        objrow = this.getCurrChildRow(currPrimary, this.DS.tables[table]);
                    }
                    this.addExtraEntity(table); // mark the table
                }
            }

            if (!objrow) return;
            if (ctrl) {
                ctrl.getControl(el, objrow, column);
                return;
            }

            // 2) distinguo a seconda del tipo e popolo la riga trovata
            switch (tagName.toUpperCase()) {
                case "INPUT":
                    switch ($(el).attr("type").toUpperCase()) {
                        case "TEXT":
                        case "DATE":
                        case "PASSWORD":
                            this.getText(el, column, objrow, eltag);
                            break;
                        case "CHECKBOX":
                            this.getCheckBox(el, column, objrow, eltag);
                            break;
                        case "RADIO":
                            this.getRadioButton(el, column, objrow, eltag);
                            break;
                        case "TEXTAREA":
                            this.getTextArea(el, column, objrow, eltag);
                            break;
                    }
                    break;
                case "TEXTAREA":
                    this.getTextArea(el, column, objrow, eltag);
                    break;
                case "DIV":
                case "SPAN":
                    if ($(el).data("valueSigned")!==undefined) this.getValueSignedGroup(el, column, objrow, eltag);
                    break;
            }
        },

        /**
         * @method getTableName
         * @public
         * @description SYNC
         * Retuns table name from a tag that is in the format table.field[:val1:val2]
         * @param {string} tag Control Tag
         * @returns {string}
         */
        getTableName: function(tag) {
            return this.getField(tag, 0);
        },

        /**
         * @method getColumnName
         * @public
         * @description SYNC
         * Returns column name from a tag that is in the format table.field[:val1:val2]
         * @param  {string} tag
         * @returns {string} field name
         */
        getColumnName: function(tag) {
            tag = this.getLookup(tag);
            var table = this.getTableName(tag);
            if (!table) return null;
            var column = this.getField(tag, 1);
            if (column == null) return null;
            return column;
        },

        /**
         * @method getLookup
         * @public
         * @description SYNC
         * Gets column name from a combobox tag that is in the format parenttable.parentfield
         * @method getLookup
         * @private
         * @param {string} tag  in the format table.field[:val1:val2]
         * @returns {string} "table.field"
         */
        getLookup: function(tag) {
            if (tag == null) return null;
            var s = tag.trim();
            var pos = s.indexOf(":");
            if (pos === -1) return s;
            var tablecolumn = s.substring(0, pos).trim();
            return tablecolumn.indexOf(".") === -1 ? null : tablecolumn;
        },

        /**
         * @method getText
         * @public
         * @description SYNC
         * Reads value from a TextBox and puts it in a row field
         * @param {html node} el
         * @param {string} fieldname
         * @param {ObjectRow} datarow
         * @param {string} eltag
         */
        getText: function(el, fieldname, datarow, eltag) {
            var tag = this.getStandardTag(eltag);
            var value = $(el).val();
            this.getString(value, fieldname, datarow, tag, true);
        },

        /**
         * @method getText
         * @public
         * @description SYNC
         * Reads value from a TextBox and puts it in a row field
         * @param {html node} el
         * @param {string} fieldname
         * @param {ObjectRow} datarow
         * @param {string} eltag
         */
        getTextArea: function(el, fieldname, datarow, eltag) {
            var tag = this.getStandardTag(eltag);
            var value = $(el).val();
            this.getString(value, fieldname, datarow, tag);
        },

        /**
         * @method getCheckBox
         * @private
         * @description SYNC
         * Gets value from a CheckBox and puts it in a row field
         * @param {html node} el
         * @param {string} fieldname
         * @param {ObjectRow} datarow
         * @param {string} eltag
         */
        getCheckBox: function(el, fieldname, datarow, eltag) {
            var tag = this.getStandardTag(eltag);
            var checked = !el.checked ? false : el.checked;
            var pos = tag.indexOf(":");
            if (pos === -1) return;
            // predno la parte di stringa valueYes
            var values = tag.substring(pos + 1).trim();
            // vedo se manca il valueNo
            if (values.indexOf(":") === -1) {
                if ($(el).prop("indeterminate")) return;

                var negato = false;
                if (values.startsWith("#")) {
                    negato = true;
                    values = values.substring(1);
                }

                var nbit = parseInt(values);
                var val = 1;
                val = val << (nbit);
                var currval = datarow[fieldname];
                if (currval === null) currval = 0;
                var x = parseInt(currval);
                var valore = checked;
                if (negato) valore = !valore;
                if (valore)
                    x = x | val;
                else
                    x = x & (~val);
                datarow[fieldname] = x;
                return;
            }

            // limito il num di split a 2
            var yValue = values.split(":", 2)[0].trim();
            var nValue = values.split(":", 2)[1].trim();

            var newvalue;
            var dRow = datarow.getRow();
            var rowvalue = stringFromJsObj(dRow.table.columns[fieldname].ctype, datarow[fieldname]);
            if ($(el).prop("indeterminate")) {
                datarow[fieldname] = null;
            } else {

                newvalue = checked ? yValue : nValue;

                // aggiorno solamente se è differente
                if (newvalue !== rowvalue) {
                    var selectedValueJsObj = jsObjFromString(dRow.table.columns[fieldname].ctype, newvalue);
                    datarow[fieldname] = selectedValueJsObj;
                }
            }
        },

        /**
         * @method getRadioButton
         * @private
         * @description SYNC
         * Gets value selected from a html radiobutton and puts it in a row field
         * @param {html element}el
         * @param {string} fieldName
         * @param {ObjectRow} objectRow
         * @param {string} eltag
         */
        getRadioButton: function(el, fieldName, objectRow, eltag) {
            var tag = this.getStandardTag(eltag);
            var pos = tag.indexOf(":");
            if (pos === -1) return;
            var cvalue = tag.substring(pos + 1).trim();

            if (cvalue.startsWith(":")) {
                var negato = false;
                cvalue = cvalue.substring(1);
                if (cvalue.startsWith("#")) {
                    cvalue = cvalue.substring(1);
                    negato = true;
                }

                var nbit = parseInt(cvalue);
                var val = 1;
                val = val << (nbit);
                var currval = objectRow[fieldName];
                if (currval === null) currval = 0;
                var x = currval;
                var valore = el.checked;
                if (negato) valore = !valore;
                if (valore)
                    x = x | val;
                else
                    x = x & (~val);

                objectRow[fieldName] = x;

            } else {
                if (el.checked) {
                    var dRow = objectRow.getRow();
                    var rowvalue = stringFromJsObj(dRow.table.columns[fieldName].ctype, objectRow[fieldName]);
                    if (rowvalue !== cvalue)
                        objectRow[fieldName] = jsObjFromString(dRow.table.columns[fieldName].ctype, cvalue);
                }
            }

        },

        /**
         * @method getValueSignedGroup
         * @private
         * @description SYNC
         * Gets a value in a ValueSigned groupbox and puts it in a row field
         * @param {html element} el
         * @param {string} fieldname
         * @param {ObjectRow} objectRow
         */
        getValueSignedGroup: function(el, fieldname, objectRow) {
            var t = this.searchValueTextBox(el);
            if (t === null) return;
            var val = $(t).val();
            var dRow = objectRow.getRow();
            var obj = new TypedObject(dRow.table.columns[fieldname].ctype, val);
            if (obj.value === null) {
                this.getString("", fieldname, objectRow, null);
                return;
            }
            var sign = this.getSignForValueSigned(el);
            if (!sign) obj.value = (-1) * obj.value; // se è negativo rendo il valore pos
            // da qui in poi fa le operazioni per settare il valore sul dataset
            var tag = this.getStandardTag($(t).data("tag"));
            var s = obj.stringValue(tag);
            this.getString(s, fieldname, objectRow, tag);
        },

        /**
         * @method getSignForValueSigned
         * @private
         * @description SYNC
         * Gets the sign for a "valueSigned" control "el". It is true if radio selected, has not tag "-",
         * false if the radio selected has the tag "-"
         * @returns {boolean}
         */
        getSignForValueSigned: function(el) {
            //recupera tutti i radio btn
            var arrRadioBtn = $(el).find("input[type=radio]");

            // ciclas sui radio button e torna true eo false a seconda di quale radio è selezionato e se si tratta di quello con il segno "-"
            for (var i = 0; i < arrRadioBtn.length; i++) {
                var rb = arrRadioBtn[i];
                var tag = $(rb).data("tag");
                if (!tag) continue;
                if (tag.toString() === "-") {
                    if (rb.checked) return false;
                    return true;
                }
            }
            return true; //default sign
        },

        /**
         * @method searchValueTextBox
         * @private
         * @description SYNC
         * Retiurns the textbox input in a value signed group control "el". If there are more textboxes it assumes the first.
         * @param {html node} el  value sign group
         * @return  {html node}
         */
        searchValueTextBox: function(el) {
            var arrTxtInput = $(el).find("input[type=text]:first");
            if (arrTxtInput && arrTxtInput.length > 0) {
                return arrTxtInput[0];
            }
            return null;
        },

		cleanCRLF: function (value) {
            if (!value) return;
            if (typeof value !== 'string' && !(value instanceof String)) return value;
			return value.replace(/\r\n/g, "");
        },

        /**
         * @method getString
         * @private
         * @description SYNC
         * Sets R[fieldname] to (string) S but:
         * - don't do anything if R[fieldname] is already equal to S
         * - convert S to  R[fieldname] type accordingly to S'tag
         * @param {string} s
         * @param {string} fieldname
         * @param {ObjectRow} dataRow
         * @param {string} tag
         */
        getString: function(s, fieldname, dataRow, tag, replaceCRLF) {
            var dRow = dataRow.getRow();
            tag = this.completeTag(tag, dRow.table.columns[fieldname]);

            var pObjOrig = new  TypedObject(dRow.table.columns[fieldname].ctype, dataRow[fieldname], tag);

            // appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new  TypedObject(dRow.table.columns[fieldname].ctype, "18/05/2019 00:00", tag).value)

            // se è date e non datetime, quindi non ci sono ore e minuti per effettuare il check in ,maniera corretta
            // potrei far diventare il valore un datetime con 00:00 e poi lo normalizzo, così per averlo come quello del datarow
            // appMeta.getDataUtils.normalizeDataWithoutOffsetTimezone(new  TypedObject(dRow.table.columns[fieldname].ctype, "18/05/2019 00:00", tag).value)
            // Oppure confronto solo la parte del giorno non il getTime(). UTILIZZO questo procedimento in (***)

            var pObjToEvaluate = new  TypedObject(dRow.table.columns[fieldname].ctype, s, tag);
            if (!!pObjOrig.value && !!pObjToEvaluate.value){
              if (pObjToEvaluate.value instanceof  Date){
                  // (***) se un tipo Date a database confronto solo il giorno dd/mm/yyyy
                  if (s.length === 10){
                      if (pObjToEvaluate.value.getTime() ===  pObjOrig.value.setHours(0,0,0,0)) return;
                  } else {
                      // confronto tra date, verifico se è la stessa
                      if (pObjToEvaluate.value.getTime() ===  pObjOrig.value.getTime()) return;
                  }
              } else {
                  // jquery val() rimuove CRLF quindi confronto senza questi.
                  if (replaceCRLF) {
                      if (this.cleanCRLF(pObjOrig.value) === this.cleanCRLF(pObjToEvaluate.value)) return;
                  } else {
                      if (pObjOrig.value === pObjToEvaluate.value) return;
                  }
              }
            }

            // eseguo questo check così s se è stringa vuota e il valore attuale è comunque nullo non effetto l'assegnazione, la quale
            // farebbe scattare la riga a stato modified, quando invece non lo è
            if (!pObjOrig.value && !pObjToEvaluate.value && pObjToEvaluate.value !== 0 && pObjOrig.value !== 0 ){
                return
            }
            var value = null;
            if (s!== undefined && s !== null) {
                // farà lo shift della data solo in caso di JSON.stringfy per evitare di inviare al server date traslate del timeoffset
                // Vedi funz normalizeDate su getDataUtils()
                value = new TypedObject(dRow.table.columns[fieldname].ctype, s, tag).value;
            }
            // assegno alla riga il valore
            dataRow[fieldname] = value;
        },

        /**
         * @method completeTag
         * @public
         * @description SYNC
         * Returns tag for a datacolumn, completing it with DataColumn format properties
         * @param {string} tag
         * @param {DataColumn} c
         * @return {string}
         */
        completeTag: function(tag, c) {
            var fmt = this.getField(tag, 2);
            if (fmt) return tag;
            fmt = this.getFormatForColumn(c);
            if (!fmt) return tag;
            tag += "." + fmt;
            return tag;
        },

        /**
         * @method checkStandardTag
         * @private
         * @description SYNC
         * Checks if a "tag" is in the format master[:parenttable.parentcolumn]
         * @param {string} tag
         * @returns {boolean}
         */
        checkStandardTag: function(tag) {
            tag = this.getStandardTag(tag);
            if (tag === null) return false;
            return this.checkTag(tag);
        },

        /**
         * @method checkTag
         * @private
         * @description SYNC
         * Checks if a "tag" is in the format table.field[:val1:val2]. Retruns true if the "tag" is in a correct format
         * @param {string} tag
         * @returns {boolean}
         */
        checkTag: function(tag) {
            if (!tag) return false;
            tag = tag.trim();
            var table = this.getTableName(tag);
            var column = this.getColumnName(tag);
            if ((table === null) || (column === null)) return false;
            return true;
        },

        /**
         * @method getCtypeTagFromElTag
         * @private
         * @description SYNC
         * Returns the ctype of the column associated to the "tag" of the element
         * @param {string} tag
         * @returns {string}
         */
        getCtypeTagFromElTag: function(tag) {
            var sTag = this.getStandardTag(tag);
            if (!sTag) return null;

            //check preliminari
            var table = this.getTableName(sTag);
            if (table === null) return null;
            if (!this.DS.tables[table]) return null;

            var column = this.getColumnName(sTag);
            if (column === null) return null;
            if (!this.DS.tables[table].columns[column]) return null;

            var ctype = this.DS.tables[table].columns[column].ctype;
            return ctype;
        },

        /**
         * @method getFormatForColumn
         * @public
         * @description SYNC
         * Returns the display format for a column, or a default format if a format has not been specified for that column
         * @param {DataColumn} c
         * @returns {string}
         */
        getFormatForColumn: function(c) {
            if (!c) return "g";
            if (c.format) return c.format;
            if (c.ctype === "Decimal") return appMeta.config.defaultDecimalFormat; //default for decimals
            if (c.ctype === "Float") return "n"; //default for decimals
            if (c.ctype === "Single") return "n"; //default for decimals
            if (c.ctype === "Double") return "n"; //default for decimals
            if (c.ctype === "DateTime") return "d"; //default for datetimes
            return "g";
        },

        /**
         * @method getStandardTag
         * @public
         * @description SYNC
         * Gets standard tag from a "tag" object
         * @param  {string} tag
         * @returns {string}
         */
        getStandardTag: function(tag) {
            if (!tag) return null;
            var s = tag.toString().trim();
            var pos = s.indexOf("?");
            if (pos === -1) return this.blankToNull(s);
            return this.blankToNull(s.substring(0, pos));
        },

        /**
         * @method setStandardTag
         * @public
         * @description SYNC
         * Sets standard tag of control "el" from a tag object
         * @param {html node} el
         * @param  {string} tag
         */
        setStandardTag: function(el, tag) {
            var eltag = $(el).data("tag");
            if (!eltag) {
                $(el).data("tag", tag);
                return;
            }
            var s = eltag.toString().trim();
            var pos = s.indexOf("?");
            if (pos === -1) {
                $(el).data("tag", tag);
            } else {
                $(el).data("tag", tag + "?" + eltag.substr(pos + 1));
            }
        },

        /**
         * @method getSearchTag
         * @public
         * @description SYNC
         * Returns search tag from a tag object
         * @param {string} tag
         * @returns {string}
         */
        getSearchTag: function(tag) {
            if (!tag) return null;
            var s = tag.toString().trim();
            var pos = s.indexOf("?");
            if (pos === -1) return this.blankToNull(s);
            return this.blankToNull(s.substring(pos + 1));
        },

        /**
         * @method blankToNull
         * @private
         * @description SYNC
         * Converts blank values to null
         * @param {string} s
         * @returns {string|null}
         */
        blankToNull: function(s) {
            if (s === null || s === undefined) return null;
            s = s.trim();
            if (s === "") return null;
            return s;
        },

        /**
         * @method addExtraEntity
         * @public
         * @description SYNC
         * Marks a table "ytableName" as an extraEntity
         * @param {string} tableName
         */
        addExtraEntity: function(tableName) {
            this.pageState.extraEntities[tableName] = tableName;
        },

        /**
         * @method lastSelected
         * @public
         * @description SYNC
         * Gets/Sets last selected row "row" in table "datatable", if it exists
         * @param {DataTable} datatable
         * @param [{ObjectRow}] row
         * @returns {ObjectRow}
         */
        lastSelected: function(datatable, row) {
            if (row || row === null) {
                datatable.lastSelectedRow = row;
                // nel caso si tratti di primary table, mantnego sincronizzata il currentRow sullo stato.
                if (datatable.name === this.primaryTableName) this.pageState.currentRow = row;
                return row;
            } else {
                var r = datatable.lastSelectedRow;
                if (r === null || r === undefined) return null;
                if (!r.getRow) return null; // nel caso detached getRow viene tolto. La riga successiva la lasciamo per robustezza
                if (r.getRow().state === dataRowState.detached) return null;
                if (r.getRow().state === dataRowState.deleted) return null;

                return r;
            }
        },

        // Base Functions

        /**
         * @method getFieldLower
         * @public
         * @description SYNC
         * Returns the string at the position "tagNumber" (empty string if "tagNumber" > lenght of "tag").
         * ("tag" is a string of elements concatenated by a dot).
         * The string returned is converted in lowerCase
         * @param {string} tag
         * @param {int} tagNumber
         * @returns {string}
         */
        getFieldLower: function(tag, tagNumber) {
            return this.getField(tag, tagNumber) ? this.getField(tag, tagNumber).toLowerCase() : null;
        },

        /**
         * @method getField
         * @public
         * @description SYNC
         * Returns the "tagNumber"th field in a list of dot separated fields
         * @param {string} tag input string
         * @param {number} tagNumber 0 for first field
         * @returns {string} null if field not found
         */
        getField: function(tag, tagNumber) {
            if (tag === null || tag === "" || tag === undefined) return null;
            var tagArray = tag.split(".");
            if (tagNumber >= tagArray.length) return null;
            return tagArray[tagNumber];
        },

        /**
         * @method getField
         * @public
         * @description SYNC
         * Returns the Nth field in a list of dot separated fields. Assumes the field
         * is the last of the list, so that the extracted string is allowed to include dots.
         * @param {string} s input string
         * @param {number} nfield 0 for first field
         * @returns {string} null if field not found
         */
        getLastField:function(s, nfield) {
            if (!s) return null;
            s = s.trim();
            var n = 0;
            var pos = -1;
            while (n < nfield) {
                pos = s.indexOf(".", pos + 1);
                n++;
                if (pos === -1) return null;
            }
            return s.substring(pos + 1);
        },

        /**
         * @method iterateGetSpecificSearchCondition
         * @public
         * @description SYNC
         * Loops on "container" control children, managed by the framework, and builds the search clause for a specific "tableName"
         * @param {html node} container
         * @param {string} tableName
         * @returns {jsDataQuery}
         */
        iterateGetSpecificSearchCondition:function(container, tableName) {
            var conditions = [];
            var self = this;
            container = container || this.rootElement;
            $(container)
                .find("[data-tag]")
                .each(function() {
                    if ($(this).parents("[data-custom-control]").length > 0) {
                        return;
                    }

                    if ($(this).parents("[data-value-signed]").length > 0) {
                        return;
                    }

                    var clause = self.getSpecificSearchCondition(this, tableName);
                    if (clause !== null ){
                        conditions.push(clause);
                    }
                });

            if (conditions.length === 0) return undefined;

            if (conditions.length === 1) return conditions[0];


            return q.and(conditions);
        },

        /**
         * @method iterateGetSearchCondition
         * @public
         * @description SYNC
         * Loops on rootElement children, managed by the framework, and builds the search clause
         * @returns {jsDataQuery}
         */
        iterateGetSearchCondition:function() {
            var conditions = [];
             var self = this;
            $(this.rootElement)
                .find("[data-tag]")
                .each(function() {

                    if ($(this).parents("[data-custom-control]").length > 0) {
                        return;
                    }

                    if ($(this).parents("[data-value-signed]").length > 0) {
                        return;
                    }

                    var clause = self.getSearchCondition(this);
                    if (clause !== null ){
                        conditions.push(clause);
                    }
                });

            if (conditions.length === 0) return undefined;

            if (conditions.length === 1) return conditions[0];


            return q.and(conditions);
        },

        /**
         * @method getSpecificSearchCondition
         * @private
         * @description SYNC
         * Returns Search condition on a specific table
         * @param {Html node} el
         * @param {string} specTable name of table to search
         * @returns {jsDataQuery}
         */
        getSpecificSearchCondition:function (el, specTable) {
            if ($(el).attr("disabled")) return null;
            if ($(el).attr("readonly")) return null;
            var eltag = $(el).data("tag");
            var tag = this.getStandardTag(eltag);
            if (!tag) return null;

            var table = this.getTableName(tag);  //we assume this as search table
            if (!table) return null;

            if (table !== specTable) return null;

            var searchTable = this.DS.tables[table];
            var column = this.getColumnName(tag);
            if (column === null) return null;
            var col = searchTable.columns[column];
            if (!col) return null;

            return this.getSearchFromControl(el, col, tag);
        },

        /**
         * @method getSearchCondition
         * @public
         * @description SYNC
         * Returns the search clause for the control "el"
         * @param {Html node} el
         * @return {jsDataQuery}
         */
        getSearchCondition:function (el) {
            var eltag = $(el).data("tag");
            var tagSearch = this.getSearchTag(eltag);
            var tagStandard = this.getStandardTag(eltag);
            if (!tagSearch) return null;
            var mainCType = $(el).data("mdlColType");

            // osservo se il custom control ha una sua getSearchCondition()
            if ($(el).data("customController")){
                var getSearchCondition = $(el).data("customController")["getSearchCondition"];
                if (getSearchCondition) return getSearchCondition($(el).data("customController"));
            }

            var tableSearchName = this.getTableName(tagSearch); //SEARCH TABLE
            var tableStandardName = this.getTableName(tagStandard); //EDIT TABLE

            if ((tableSearchName === tableStandardName) &&
                (tableSearchName !== this.primaryTableName)
                && !this.hasSpecificSearchTag(eltag)) return null;
            var searchTable = this.DS.tables[tableSearchName];
            var columnSearch = this.getColumnName(tagSearch);
            if (columnSearch === null) return null;
            var maincol = this.getColumnName(tagStandard);
            var col = null;
            if (maincol) {
                if (this.primaryTable.columns[maincol])
                    col = this.primaryTable.columns[maincol];
            }
            if (!col) col = this.getSuitableColumnForSearchTag(tagSearch, mainCType);
            if (searchTable) {
                if (searchTable.columns[columnSearch]) col = searchTable.columns[columnSearch];
            }

            return this.getSearchFromControl(el, col, tagSearch);
        },

        /**
         * @method getSuitableColumnForSearchTag
         * @private
         * @description SYNC
         * Returns the search DataColumn, given the "tagSearch" and the "ctype"
         * @param {String} tagSearch
         * @param {String} cType
         * @return {DataColumn} DataColumn
         */
        getSuitableColumnForSearchTag:function (tagSearch, cType) {
            var colname = this.getColumnName(tagSearch);
            if (!colname ) colname = "temp";
            var fmt = this.getFieldLower(tagSearch, 2);
            if (!fmt) fmt = "";
            fmt = fmt.toUpperCase();
            if ((fmt === "")) {
                var tabname = this.getTableName(tagSearch);
                if ( this.DS.tables[tabname]) {
                    var t = this.DS.tables[tabname];
                    if (t.columns[colname]) return t.columns[colname];
                }
                // not_TO_DO IMPLEMENTARE PROSSIMA RIGA. Fare prima classe Dataccess
                // lasciamo perdere, o gli viene passata subito o niente
                // t = conn.CreateTableByName(tabname, "*");
                // if (t.columns[colname]) return t.columns[colname];

                return new DataColumn(colname, cType);
            }

			if (fmt === "G") return new DataColumn(colname, cType);
			if (fmt === "C") return new DataColumn(colname, cType);
            if (fmt === "N") return new DataColumn(colname, cType);
            if (fmt === "FIXED") return new DataColumn(colname, cType);
            return new DataColumn(colname, "String");
        },

        /**
         * @method getSearchFromControl
         * @private
         * @description SYNC
         * Returns the search clause for the control "el"
         * @param {Html node} el
         * @param {DataColumn} col
         * @param {String} tagSearch
         * @returns {jsDataQuery}
         */
        getSearchFromControl:function (el, col, tagSearch) {
            var tagName = el.tagName;

            // 1. Caso: controllo custom
            var ctrl = $(el).data("customController");
            if (ctrl){
                if (ctrl["getSearchControl"]) return ctrl["getSearchControl"](el, col, tagSearch);
                logger.log(logType.WARNING, "control " + ctrl.constructor.name + " has not getSearchControl() method");
                return null;
            }

            // 2. Caso: controlli base
            switch (tagName.toUpperCase()) {
                case "INPUT":
                    switch ($(el).attr("type").toUpperCase()) {
                        case "TEXT":
                        case "TEXTAREA":
                        case "DATE":
                        case "PASSWORD":
                            return this.getSearchText(el, col, tagSearch);
                        case "CHECKBOX":
                            return this.getSearchCheckBox(el, col, tagSearch);
                        case "RADIO":
                            return this.getSearchRadioButton(el, col, tagSearch);
                    }
                    break;
                case "TEXTAREA":
                    return this.getSearchText(el, col, tagSearch);
                    break;
                case "DIV":
                case "SPAN":
                    if (this.isManagedCollection(el)) return this.getSearchFromManagedCollection(el);
                    break;
            }

            return null;
        },

        /**
         * @method getSearchText
         * @private
         * @description SYNC
         * Returns the search clause for the textbox control "el"
         * @param {html node} el
         * @param {DataColumn} col
         * @param {String} tagSearch
         * @returns {jsDataQuery}
         */
        getSearchText:function (el, col,  tagSearch) {
            var val = $(el).val();
            if (val === "") return null;
            var searchcol = this.getColumnName(tagSearch);
            var tag = this.completeTag(tagSearch, col);

            var obj =  new TypedObject(col.ctype, val, tag);
            var sqltype = col.sqltype;

            if ((obj.value !== null) && (sqltype === "text")) {
                var s = obj.value.toString();
                if (s.indexOf("%") === -1) s += "%";
                obj.value = s;
            }

            if (obj.value === null) return null;
            var fmt = this.getFieldLower(tag, 2);
            if ((col.ctype === "DateTime") && (this.isOnlyTimeStyle(fmt)) && ( !(obj.getTime() === new Date("1000-01-01").getTime()))) {
                /* TODO QUESTO è un CASO particolare. Poi lo vediamo
                 var c1 = q.eq("(DATEPART(hh," + searchcol + ")",  obj.value.getHours());
                 var c2 = q.eq("(DATEPART(hh," + searchcol + ")",  obj.value.getMinutes());
                 var c3 = q.eq("(DATEPART(hh," + searchcol + ")",  obj.value.getSeconds());
                 var filter = q.and([c1, c2, c3]);
                 return this.mergeFilters(condition, filter);
                 */
            }
            return  this.compareLikeFields(searchcol, obj.value, obj.typeName);

        },


        /**
         * @method compareLikeFields
         * @public
         * @description SYNC
         * Returns a clause of compare eq or like, between "fieldname" and "val".
         * It returns "like" clause if the val contains "%" character
         * @param {string} fieldname
         * @param {object} val
         * @param {string} type
         * @return {jsDataQuery}
         */
        compareLikeFields: function (fieldname, val, type) {
            if (type === "String") {
                var s = stringFromJsObj(type, val); // solo per eccesso di sicurezza. E' già stringa se il type è string

                // se è configurato a livello di app sempre "like", altrimenti vedo se utente ha messo carattere "%"
                if (appMeta.config.enableSearchLikeOnTextBox) {
                    return q.like(fieldname, "%" + s + "%");
                } else if (s.indexOf("%") >= 0){
                    return q.like(fieldname, s);
                }
            }
            if (type === "DateTime") val = getDataUtils.normalizeDataWithoutOffsetTimezone(val, true);
            return q.eq(fieldname, val);
        },

        /**
         * @method getSearchCheckBox
         * @private
         * @description SYNC
         * Returns the search clause for the checkbox control "el"
         * @param {Html node} el
         * @param {DataColumn} col
         * @param {String} tagSearch
         * @return {jsDataQuery}
         */
        getSearchCheckBox:function (el, col, tagSearch) {
            if ($(el).prop("indeterminate")) return null;

            var checked = !!el.checked;

            var searchcol = this.getColumnName(tagSearch);
            var pos = tagSearch.indexOf(":");
            if (pos === -1) return null;
            var values = tagSearch.substring(pos + 1).trim();

            if (values.indexOf(":") === -1) {
                if (values.startsWith("#")) {
                    checked = !checked;
                    values = values.substring(1);
                }

                var nBit = parseInt(values);
                return checked ? q.bitClear(searchcol, 0) : q.bitSet(searchcol, nBit);
            }

            var yValue = values.split(":", 2)[0].trim();
            var nValue = values.split(":", 2)[1].trim();

            var newvalue = checked ? yValue : nValue;

            var obj =  new TypedObject(col.ctype, newvalue, tagSearch);
            return this.compareLikeFields(searchcol, obj.value, obj.typeName);
        },

        /**
         * @method getSearchRadioButton
         * @private
         * @description SYNC
         * Returns the search clause for the radioButton control "el"
         * @param {Html node} el
         * @param {DataColumn} col
         * @param {String} tagSearch
         * @return {jsDataQuery}
         */
        getSearchRadioButton:function (el, col, tagSearch) {
            var searchcol = this.getColumnName(tagSearch);
            var pos = tagSearch.indexOf(":");
            var cValue = tagSearch.substring(pos + 1).trim();
            if (!cValue.startsWith(":")) {
                if (el.checked) {
                    var obj =  new TypedObject(col.ctype, cValue, null);
                    if (obj.value === null) return null;
                    return this.compareLikeFields(searchcol, obj.value, obj.typeName);
                }
            }
            else {
                cValue = cValue.substring(1);
                var negato = false;

                if (cValue.startsWith("#")) {
                    negato = true;
                    cValue = cValue.substring(1);
                }

                var nBit = parseInt(cValue);
                if (el.checked) return negato ? q.bitClear(searchcol, nBit) : q.bitSet(searchcol, nBit);

            }

            return null;
        },

        /**
         * @method getSearchFromManagedCollection
         * @private
         * @description SYNC
         * Returns the search clause for the managed collection control "el". (usually it is a valueSigned)
         * @param {Html node} el
         * @return {jsDataQuery}
         */
        getSearchFromManagedCollection:function (el) {
            var eltag = $(el).data("tag");
            if (!eltag) return null;
            if ($(el).data("valueSigned") !== undefined) return this.getSearchFromValueSigned(el);
            return null;
        },

        /**
         * @method getSearchFromValueSigned
         * @private
         * @description SYNC
         * Returns the search clause for the valueSigned control "el"
         * @param {Html node} el
         * @return {v}
         */
        getSearchFromValueSigned:function (el) {
            var eltag = $(el).data("tag");
            var tag = this.getSearchTag(eltag);
            if (!tag) return null;

            var textbox = this.searchValueTextBox(el);
            var val = $(textbox).val();
            if (!textbox) return null;
            if (!val) return null;

            var tn = this.getTableName(tag);
            var cn = this.getColumnName(tag);
            if (!cn) return null;

            var colname = cn;
            var coltype = "String";
            var ttn = this.DS.tables[tn];
            var col;
            if (ttn) {
                col = ttn.columns[cn];
                if (col) coltype = col.ctype;
            }

            var obj = new TypedObject(coltype, val, tag);
            if (!obj.value) return null;
            var sign = this.getSignForValueSigned(el);
            if (!sign) obj.value = (-1) * obj.value;

            return this.compareLikeFields(colname, obj.value, obj.typeName);

        },

        /**
         * @method hasSpecificSearchTag
         * @private
         * @description SYNC
         * Returns true if "tag" contains an "?" character, false otherwise.
         * @param {string} tag
         * @returns {boolean}
         */
        hasSpecificSearchTag:function (tag) {
            if (!tag) return false;
            var s = tag.toString().trim();
            var pos = s.indexOf("?");
            if (pos === -1) return false;
            return true;
        },

        /**
         * @method isOnlyTimeStyle
         * @public
         * @description SYNC
         * Checks if format only displays time
         * @param {string} fmt
         * @returns {boolean}
         */
        isOnlyTimeStyle:function(fmt) {
            switch (fmt) {
                case "d":
                    return false; //short date format.
                case "D":
                    return false; //long date format
                case "t":
                    return true; //time using the 24-hour format
                case "T":
                    return true; //long time format
                case "f":
                    return false; // long date and short time
                case "F":
                    return false; //  long date and long time
                case "g":
                    return false; //  short date and short time
                case "G":
                    return false; //4/3/93 05:34 PM.
                case "m":
                    return false; // month and the day of a date
                case "M":
                    return false; // month and the day of a date
                case "r":
                    return false; // date and time as Greenwich Mean Time (GMT)
                case "R":
                    return false; // date and time as Greenwich Mean Time (GMT)
                case "s":
                    return false; // date and time as a sortable index.
                case "u":
                    return false; // date and time as a GMT sortable index
                case "U":
                    return false; // date and time with the long date and long time as GMT.
                case "y":
                    return false; // year and month.
                case "Y":
                    return false; // year and month.
                default:
                    return false;
            }
        },

        /**
         * @method focusField
         * @public
         * @description SYNC
         * Finds the control with tag "tableName"."errField" and focuses it.
         * If the control is in a tab nested control, it selects also the correct tabs
         * @param {string} errField
         * @param {string} tableName
         */
        focusField:function (errField, tableName) {
            var inputTag = errField;
            if (errField.indexOf('.') < 0) inputTag = tableName + "." + errField;
            var self = this;
            $(this.rootElement)
                .find("[data-tag]")
                .each(function() {
                    // "this" è il controllo
                    var currTag = $(this).data("tag");
                    var standardTag = self.getStandardTag(currTag);
                    if (standardTag){
                        var t = self.getField(currTag, 0);
                        var f = self.getField(currTag, 1);
                        if ( t && f) {
                            currTag = t + "." + f;
                            if (currTag === inputTag) self.applyFocus(this);
                        }
                    }
                });
        },

        /**
         * @method applyFocus
         * @private
         * @description SYNC
         * Applies the focus on the "ctrl" control and also focus its parent containers recursively
         * @param {Html node} ctrl
         */
        applyFocus:function(ctrl){
            // costruisco un array di parents, arrivando fino al root elements.Lo ordino da quello più esterno
            var arrayParentContainers = [];
            $(ctrl)
                .parentsUntil(this.rootElement)
                .addBack() // capire performance, se è conventiente fare la reverse con lodash
                .each(function () {
                    // se è un parent customContainer aggiungo all'array ausiliario
                    // il this dentro il ciclo diventa il controllo corrente
                    if ($(this).data("customContainer") !== undefined) {
                        arrayParentContainers.push(this);
                    }
                });

            // ciclo sui parents , da quello più esterno e metto focus man mano sui figli che trovo. Se non esistono altri container,
            // metto focus sul controllo iniziale
            _.forEach(arrayParentContainers,
                function(currContainer, index) {
                    // se arrivo all'ultimo elemento, signifca che è parents diretto del controllo in questione
                    var elementToFocus = (index === arrayParentContainers.length - 1)
                        ? $(ctrl)
                        : _.nth(arrayParentContainers, index + 1);
                    var cc = $(currContainer).data("containerController");
                    cc.focusContainer(elementToFocus);
                });

            // metto focus su controllo
            $(ctrl).focus();
        },

        /**
         * @method filter
         * @public
         * @description SYNC
         * Gets/Sets a jsDataQuery "filter" for a control in filter data-attribute, (jquery style)
         * @param {Html node} control
         * @param {jsDataQuery} filter
         * @retuns {jsDataQuery} filter
         */
        filter: function (control, filter) {
            if (filter === undefined) return  $(control).data("filter");
            $(control).data("filter", filter);
            return filter;
        },

        /**
         * @method makeChildPrimaryORSubentity
         * @public
         * @description SYNC
         * If possible, makes PrimaryEntity child (or other subentity) of R (of table T)
         * @param {DataRow} r Possible Parent Row (can be null)
         * @param {DataTable} t DataTable to which R belongs (can't be null)
         * @param {string} relName relation to use between PrimaryTable and T
         */
        makeChildPrimaryORSubentity:function( r,  t,  relName) {
            var self = this;
            var primary = this.lastSelected(this.primaryTable);
            if (!primary) return;

            if (this.makeChild(r, t, primary.getRow(), relName)) return;

            _.forEach( this.pageState.extraEntities, function (extraName) {
                var rels = self.DS.getParentChildRelation(self.primaryTableName, extraName);
                if (rels && rels.length > 0 ){
                    var childRows = primary.getRow().getChildRows(rels[0].name);
                    if (childRows.length === 1) {
                        if (self.makeChild(r, t, childRows[0].getRow(), null)) return false; // esco se fa makeChild
                    }
                }
            })
        },

        /**
         * @method makeChild
         * @public
         * @description SYNC
         * Makes a "Child" DataRow related as child with a Parent Row.
         * This function should be called after calling DataTable.NewRow and before calling CalcTemporaryID and DataTable.Add()
         * @param {DataRow} parentRow
         * @param {DataTable} parentTable
         * @param {DataRow} childRow
         * @param {string} relName
         * @returns {boolean} true if relName exists and makes childRow as parentRow, false otherwise
         */
        makeChild:function (parentRow, parentTable, childRow, relName) {
            var parentRel;
            var self = this;
            if (!relName){
                var madechild = false;
                _.forEach(childRow.table.parentRelations(), function (rel) {
                    if (self.makeChild(parentRow, parentTable,childRow, rel.name )) madechild = true;
                });
                return madechild;

            } else {
                parentRel = this.childRelation(parentTable, childRow.table, relName);
            }

            if (!parentRel) return false;
            // il metodo di jsdatase ci pensa lui a fare la copia o il clear.
            var parentObjectRow = parentRow ? parentRow.current : null;
            parentRel.makeChild(parentObjectRow, childRow.current);
            return true;
        },

        /**
         * @method childRelation
         * @public
         * @description SYNC
         * Searches a relation in child's Parent Relations that connect Child to Parent,
         * named relName. If it is not found, it is also searched in Parent's child relations.
         * @param {DataTable} parent
         * @param {DataTable} child
         * @param {string} relName Relation Name, null if it does not matter
         * @returns {DataRelation} a Relation from Child Parent Relations, or undefined if not found
         */
        childRelation:function(parent, child, relName){

            var relFound;

            _.forEach(child.parentRelations(), function (rel) {
                if ((rel) && (rel.name!==relName)) return true; // continuo nel froEach di lodash
                if (rel.parentTable === parent.name){
                    relFound =  rel;
                    return false; // trovata esco
                }
            });

            if (relFound) return relFound;

            _.forEach(parent.childRelations(), function (rel) {
                if ((rel) && (rel.name!== relName)) return true; // continuo nel froEach di lodash
                if (rel.childTable === child.name){
                    relFound =  rel;
                    return false; // trovata esco
                }
            });

            return relFound

        },

        /**
         * @method mergeFilters
         * @public
         * @description SYNC
         * Merges in "and" clause the two filters passed
         * @param {jsDataQuery} filter1
         * @param {jsDataQuery} filter2
         * @returns {jsDataQuery}
         */
        mergeFilters:function (filter1, filter2) {
            if (filter1 && filter2) return  q.and(filter1, filter2);
            return filter1 ? filter1 : filter2;
        },

        /**
         * @method setGridCurrentRow
         * @public
         * @description SYNC
         * Sets the current selected row of a grid
         * @param {GridControl} g
         * @param {ObjectRow} r. Row that must become the current row of the grid.
         */
        setGridCurrentRow:function (g, r) {
            // TODO
            /*if (r == null) return;
             if (r.RowState == DataRowState.Deleted) return;

             var dsv = (DataSet) g?.DataSource;
             var tv = dsv?.Tables[g.DataMember];
             if (tv == null) return;
             if (tv.Rows.Count == 0) return;

             var drv =  (DataRowView) g.BindingContext[dsv, tv.TableName].Current;
             if (drv == null) return;

             var dv = drv.DataView;

             var rk = QueryCreator.WHERE_KEY_CLAUSE(r, DataRowVersion.Default, false);
             if ((rk == "") || (rk == null)) return;

             if (dv.Sort == "") {
             ClearSelection(g);
             var count = -1;
             for (var index = 0; index < tv.Rows.Count; index++) {
             if (tv.Rows[index].RowState == DataRowState.Deleted) continue;
             count++;
             var rFk2 = QueryCreator.WHERE_KEY_CLAUSE(tv.Rows[index],DataRowVersion.Default, false);
             if (rFk2 == rk) {
             g.CurrentRowIndex = count;
             GridSelectRow(g, count);
             //G.Select(count);
             return;
             }
             }
             return;
             }


             var found = r.Table.Select(dv.RowFilter,
             dv.Sort, dv.RowStateFilter);
             if (found.Length == 0) return;


             var i = 0;
             foreach (var rf in found) {
             var rFk = QueryCreator.WHERE_KEY_CLAUSE(rf, DataRowVersion.Default, false);
             if (rFk == rk) {
             ClearSelection(g);
             g.CurrentRowIndex = i;
             GridSelectRow(g, i);
             //G.Select(i);
             return;
             }
             i++;
             }*/
        },

        /**
         * @method mergeFilters
         * @public
         * @description ASYNC
         * Fills a tree given a start condition. Also Accepts FilterTree
         * @param {TreeViewManager} treeManager
         * @param {jsDataQuery} startCondition
         * @param {string} startValueWanted
         * @param {string} startFieldWanted
         * @returns {*|JQueryPromise<{}>|String}
         */
        setTreeByStart:function (treeManager, startCondition, startValueWanted, startFieldWanted) {
            var def = Deferred("setTreeByStart");
            var tag = $(treeManager.elTree).data("tag");
            var tname = this.getField(tag, 0);
            var t = this.pageState.DS.tables[tname];
            if (!t) return def.resolve(false);
            var self = this;
            return treeManager.startWithField(startCondition, startValueWanted, startFieldWanted)
                .then(function (selected) {
                    if (!selected) return def.resolve(false);
                    self.lastSelected(t, selected);
                    return def.resolve(true);
                })
        },

        /**
         * @method myClear
         * @public
         * @description ASYNC
         * @param {DataTable} dt
         * Clears a DataTable setting the rowindex of the linked grid to 0
         */
        myClear : function (dt) {
            if (dt.rows.length === 0) return;
            var grid = dt.linkedGrid; // settato efentualmente sul construttuore del Gridcontrol
            if (grid) if (dt.rows.length > 1 && grid.DS === dt.dataset) grid.currentIndex = 0;
            dt.clear();
        },

        /**
         * @method existsDataAttribute
         * @public
         * @description SYNC
         * Returns true if data-attr is configured on control el
         * @param {Html node} el
         * @param {string} attr
         * @returns {boolean}
         */
         existsDataAttribute:function(el, attr){
            return (typeof $(el).data(attr) === "undefined") ? false : true;
        }

    };

    window.appMeta.HelpForm = HelpForm;

}());
