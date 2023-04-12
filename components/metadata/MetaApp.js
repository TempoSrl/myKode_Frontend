/*globals _,appMeta,$,alert */

/**
 * @module MetaApp
 * @description
 * It is the entry point of the application It contains the collection of metapage and the html pages
 */
(function () {
            "use strict";

    /**
     * Namespace for myKocde application
     * @constructor
     */
    function AppMeta(){
        this.allMeta = {};

        /**
         * @summary All user defined custom control manager
         */
        this.customControls = {};

        /**
         * @summary All user defined custom container control manager
         */
        this.customContainers = {};

        /**
         * Path to files in the web application
         */
        this.basePath = '';

        this.dbClickTimeout = 200;

        /**
         * @summary List of all html pages of the application
         */
        /* {tableName:null,editType:null,html:null}[] */ this.htmlPages = [
            //{tableName:null,editType:null,html:null}
        ];

        /**
         * @summary List of all metaPages of the application
         */
        this.metaPages = [
            //{tableName:null,editType:null,MetaPage:null}
        ];
    }

            AppMeta.prototype = {
                constructor: AppMeta,
                /**
                 * @method addMeta
                 * @public
                 * @description SYNC
                 * Adds a metadata to the application. This should be called from the defining javascript
                 * @param {string} tableName
                 * @param {MetaData} meta
                 */
                addMeta: function (tableName, meta) {
                    if (!this.allMeta[tableName]) {
                        this.allMeta[tableName] = meta;
                    }
                },

                /**
                 * @method getMeta
                 * @public
                 * @description SYNC
                 * Returns a singleton instance of MetaData for a specified "tableName"
                 * @param {string} tableName
                 * @returns {MetaData}
                 */
                getMeta: function (tableName) {
                    let meta = this.allMeta[tableName];
                    if (!meta) {
                        meta = new this.MetaData(tableName);
                    }
                    meta.setLanguage(this.localResource.currLng);
                    return meta;
                },

                /**
                 * @method CustomControl
                 * @public
                 * @description SYNC
                 * Gets/Sets the "control" for the "controlName". Saves it in the class variable "customControls"
                 * @param {string} controlName
                 * @param {CustomControl} control it can be GridControl, ComboControl
                 * @returns {constructor|this}
                 */
                CustomControl:function(controlName, control) {
                    if (control === undefined) {
                        return this.customControls[controlName];
                    }
                    this.customControls[controlName] = control;
                    return this.customControls[controlName];
                },

                /**
                 * @method CustomContainer
                 * @private
                 * @description SYNC
                 * Gets/Sets the "control" container for the "controlName". Saves it in the class variable "customContainers"
                 * @param {string} controlName
                 * @param {CustomControl} control
                 * @returns {constructor|this}
                 */
                CustomContainer:function(controlName, control) {
                    if (control === undefined) {
                        return this.customContainers[controlName];
                    }
                    this.customContainers[controlName] = control;
                    return this;
                },

                /**
                 * @method getPage
                 * @public
                 * @description ASYNC
                 * Loads and caches an html page from server and renders in rootElement of current page
                 * @param {element} rootElement
                 * @param {string} tableName
                 * @param {string} editType
                 * @returns Promise<string>
                 */
                getPage: function(rootElement, tableName, editType) {
                    let res = this.Deferred("getPage");
                    /*{tableName:null,editType:null,html:null}*/
                    let page = _.find(this.htmlPages, { "tableName": tableName, "editType": editType });

                    let self = this;
                    if (page) {
                        $(rootElement).html(page.html);
                        return res.resolve(page.html).promise();
                    }

                    let htmlFileName = this.getMetaPagePath(tableName) + "/" + tableName + "_" + editType + ".html";
                    $.get(htmlFileName)
                    .done(
                        function (data) {
                            self.htmlPages.push({ tableName: tableName, editType: editType, html: data });
                            $(rootElement).html(data);
                            res.resolve(data);
                        })
                    .fail(
                        function (err) {
                            res.reject('Failed to load ' + htmlFileName + ' ' + JSON.stringify(err.responseText));
                        });

                    return res.promise();

                },

                /**
                 * @method addMetaPage
                 * @public
                 * @description SYNC
                 * Adds to the metaPage collection the "metaPage"
                 * @param {string} tableName
                 * @param {string} editType
                 * @param {MetaPage} metaPage is the constructor of a metaPage
                 */
                addMetaPage: function (tableName, editType, metaPage) {
                    /*{tableName:null,editType:null,html:null}*/
                    let found = _.find(this.metaPages, { "tableName": tableName, "editType": editType });

                    if (found) {
                        //console.log("page "+tableName+":"+editType+" already exists");
                        return;
                    }
                    this.metaPages.push({ tableName: tableName, editType: editType, MetaPage: metaPage });
                },


                /**
                 * @method getMetaPage
                 * @public
                 * @description ASYNC
                 * Returns a deferred resolved with a new instance of a MetaPage
                 * @param {string} tableName
                 * @param {string} editType
                 * @returns Promise<MetaPage>
                 */
                getMetaPage: function(tableName, editType) {
                    let res = this.Deferred("getMetaPage");
                    /*{tableName:null,editType:null,html:null}*/
                    let found = _.find(this.metaPages, { "tableName": tableName, "editType": editType });
                    let self = this;
                    if (found){
                        let isDetail = found.MetaPage.prototype.detailPage;
                        return res.resolve(new found.MetaPage(tableName, editType, isDetail)); //non aggiunge due volte la metaPage
                    }

                    let jsFileName = this.getMetaPagePath(tableName) + "/" + tableName + "_" + editType + ".js";
                    //console.log("to get file"+jsFileName);
                    $.getScript(jsFileName) // questo esegue il js caricato
                    .done(
                        function () { //mi attendo che il js caricato abbia effettuato la addMetaPage
                            found = _.find(self.metaPages, { "tableName": tableName, "editType": editType });
                            if (found) {
                                let isDetail = found.MetaPage.prototype.detailPage;
                                res.resolve(new found.MetaPage(tableName,editType, isDetail));
                                return;
                            }

                            res.reject('Failed to load metaPage ' + jsFileName + ' edittype:' + editType + ". Compile wrong or missing file." );
                        })
                    .fail(
                        function (err) {
                            res.reject('Failed to load ' + jsFileName + ' edittype:' + editType + ". Compile wrong or missing file."+err );
                        });

                    return res.promise();

                },
                /**
                 * @method getMetaPagePath
                 * @public
                 * @description SYNC
                 * Returns the path are the MetaPages and html.
                 * It mustn't end with "/"
                 * Overridable
                 * @param {string} tableName, represents the main table of the page which we have to find page.js and html
                 * @returns {string} the path where to found metaPages and html
                 */
                getMetaPagePath:function (tableName) {
                    let bPath = this.basePathMetadata ? this.basePathMetadata : this.basePath;
                    return bPath  + tableName;
                },
            };

            window.appMeta = new  AppMeta();

            window.appMeta.currApp = undefined;

            /**
             * @constructor MetaApp
             * @description
             * Initializes a MetaApp
             */
            function MetaApp() {
                this.init();
            }

            MetaApp.prototype = {
                constructor: MetaApp,
                /**
                 * @method init
                 * @public
                 * @description SYNC
                 * Initializes the MetaApp object
                 */
                init: function() {
                    this.appvar = {};
                    this.q = window.jsDataQuery;

                    /**
                     * Current page displayed (the most nested called)
                     * @type MetaPage
                     */
                    this.currentMetaPage = null;

                    //this.allMeta = {};

                    this.rootElement = "";
                    
                    this.rootToolbar = "#toolbar";

                    /**
                     * stack of the names of opened pages
                     * @type {Array}
                     */
                    this.pagesNameStack = [];

                    this.isMobile = this.checkIsMobile();
                },

                checkIsMobile:function() {
                   try {
                       if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) ||
                            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(navigator.userAgent.substr(0,4))) {
                           return true;
                       }
                   }
                   catch (_) {
                       return false;
                   }
                },

                /**
                 * @method getToolBarManager
                 * @public
                 * @description SYNC
                 * Returns the toolbar MainToolBarManager
                 * @returns {appMeta.MainToolBarManager|*|MainToolBarManager}
                 */
                getToolBarManager:function () {
                    return this.toolBarManager;
                },

                /**
                 * @method start
                 * @public
                 * @description SYNC
                 * Invoke this method after the configuration of the appMeta
                 */
                start:function () {
                    appMeta.globalEventManager = new appMeta.EventManager();
                    this.initToolBarManager();
                },

                /**
                 * @method forceClosePopupWindow
                 * @public
                 * @description SYNC
                 * Force closing opened ui dialog
                 */
                forceClosePopupDialog:function () {
                    if (this.currentMetaPage) {
                        this.currentMetaPage.closeListManagerResultsSearch();
                    }
                },

                /**
                 * @method initToolBarManager
                 * @private
                 * @description SYNC
                 * Initializes the toolbar manager if it is not already initiated
                 */
                initToolBarManager:function () {
                    if (!this.toolBarManager)  {
                        this.toolBarManager = new appMeta.MainToolBarManager(this.rootToolbar, null);
                    }
                },

                /**
                 * Sets the "brad crumbs" title on the toolbar (on element with "toolbartitle" id) (Page1 -> page2 -> pageN)
                 */
                setTitle:function () {
                    // sull'array inserisco/rimuovo man mano i nomi delle metapage tramite log a pila LIFO, l'ultimo inserito , primo ad essere rimosso
                    // concetto "briciole di pane"
                    let title = this.pagesNameStack.join(" > ");
                    if (this.toolBarManager)  {
                        this.toolBarManager.setTitle(title);
                    }
                },

                /**
                 * push in pagesNameStack the name.
                 * Used when a new metaPage is called, and calls the "brad crumbs" building
                 * @param {string} name
                 */
                pushPageName:function (name) {
                    this.pagesNameStack.push(name);
                    this.setTitle();
                },

                /**
                 * Pop the last element form the array "pagesNameStack". And calls the "brad crumbs" building
                 * Used when a metapage is unloaded in returnToCaller() function
                 */
                popPageName:function () {
                    this.pagesNameStack.pop();
                    this.setTitle();
                },

                /**
                 * @method callPage
                 * @public
                 * @description ASYNC
                 * Opens a page and sets it as 'called' from the current page. Wait for the resolve of deferredResult.
                 * Sets this new page as MetaPage for the main toolbar
                 * @param {string} metaToCall
                 * @param {string} editType
                 * @param {boolean} wantsRow
                 * @return  {Deferred}
                 */
                callPage: function(metaToCall, editType, wantsRow) {
                    //("calling page "+metaToCall+":"+editType);
                    let self = this;
                    let createdPage;
                    // salva il vecchio root node in una proprietà savedRoot di currentMetaPage ove esista
                    // se currentMetaPage è null non deve fare nulla e savedRoot rimane null
                    // ottiene il parent del vecchio root, rimuove il vecchio
                    // ottiene un newChild avente pari id dell'old, e stessi attributes dell'old, ma senza contenuto
                    // esegue una parent.replaceChild(newChild, savedRoot)
                    let canOpenPage = true;
                    // se apro una nuova pagina principale, mi assicuro che io possa chiudere la precendente.
                    return appMeta.utils._if (this.currentMetaPage)
                        ._then(function(){
                            return appMeta.utils._if(!wantsRow)
                                ._then(function(){
                                    return self.currentMetaPage.cmdClose()
                                        .then(function (res) {
                                            canOpenPage = !!res;
                                            return true;
                                        });
                                })._else(function(){
                                    // Chiudo eventuale form di ricerca lista, altrimenti creo incongruenza con nuova metaPage
                                     //self.currentMetaPage.closeListManagerResultsSearch();
                                    // 1. salva il vecchio root node in una proprietà savedRoot di currentMetaPage ove esista
                                    self.currentMetaPage.savedRoot = $(self.rootElement);
                                    // 2. ottiene il parent del vecchio root
                                    let parentRoot =  $(self.rootElement).parent();
                                    //3. ottiene un newChild avente pari id dell'old, e stessi attributes dell'old, ma senza contenuto
                                let newChild = $(self.rootElement)[0].cloneNode(false);
                                    // 4. esegue replace del contenuto
                                    $(parentRoot)[0].replaceChild(newChild, self.currentMetaPage.savedRoot[0]);
                                    return true;
                                });
                        })
                        .then(function(){
                            // esco se non posso chiudere la precedente, perché magari ci sono modifiche e l'utente deve prima accettare
                            if (!canOpenPage) return;

                            return appMeta.getMetaPage(metaToCall, editType)
                            .then(function (calledMetaPage){
                                createdPage = calledMetaPage;
                                return calledMetaPage.init(); //returns an instance of metaPage (with meta and state and dataset)
                            }, function (err){
                                appMeta.logger.log(appMeta.logTypeEnum.ERROR, err);
                            })
                            .then(appMeta.utils.skipRun(
                                function (/*MetaPage*/ calledMetaPage) {
                                    // aggiunge accorgimento grafico per far apparire la pag di dettaglio come un popup
                                    if (wantsRow) $(self.rootElement).addClass(appMeta.cssDefault.detailPage);
                                    if (!wantsRow) $(self.rootElement).removeClass(appMeta.cssDefault.detailPage);
                                    return appMeta.getPage(self.rootElement,
                                        calledMetaPage.primaryTableName,
                                        calledMetaPage.editType); //gets and render calledMetaPage html
                                }))
                                .then(function (/*MetaPage*/ calledMetaPage) {
                                if (self.currentMetaPage){
                                    // DS è dataset della CALLING PAGE
                                    // currMetaData.ExtraParameter diventa calledMetaPage.state.extraParameters
                                    // currMetaData.ExtraParameter = DS.Tables[entity].ExtendedProperties[FormController.extraParams];
                                    // è corretta la prox istruzione??
                                    if (self.currentMetaPage.state.DS.tables[metaToCall]){
                                        calledMetaPage.state.extraParameters =
                                            self.currentMetaPage.state.DS.tables[metaToCall].extraParameters;
                                    }
                                    self.currentMetaPage.entityCalledChanged = false;
                                    self.currentMetaPage.setCallingPage(calledMetaPage, wantsRow);
                                }
                                self.currentMetaPage = calledMetaPage; //called page is the new current page
                                self.toolBarManager.setMetaPage(calledMetaPage); // set the currentMetaPage for the toolbar
                                return calledMetaPage.activate(); //activate the page
                                }).then(function () {
                                return createdPage.show();//this raises appMeta.EventEnum.showPage
                                }).then(function () {
                                self.pushPageName(createdPage.getName());
                                // Restituisco il deferred della pagina appena aperta.
                                // Si risolverà nel mainsave nel caso di dettaglio di un edit di una riga del grid,
                                // o nel mainSelect nel caso di autoManage
                                return createdPage.deferredResult;
                            });
                        });


                },

                /**
                 * @method returnToCaller
                 * @public
                 * @description ASYNC
                 * Closes current page and returns to the caller page.
                 * Sets newly the caller page as MetaPage for the main toolbar
                 * @returns {Deferred}
                 */
                returnToCaller: function() {
                    let def = appMeta.Deferred("returnToCaller");
                    if (!this.currentMetaPage || !this.currentMetaPage.state) {
                        //there is no caller 
                        //console.log("rejecting returnToCaller");
                        return def.reject('there is no caller page').promise();
                    }

                    // 1. currentRoot = root (è un node html) di currentMetaPage (metaPage)
                    let currentMetaPageRoot = $(this.currentMetaPage.rootElement);
                    // 2. parent = parent node di currentRoot
                    let parentRoot = $(currentMetaPageRoot).parent();

                    // rimuovo pag dal array dei nomi
                    this.popPageName();

                    if (!this.currentMetaPage.state.callerPage) {
                        //there is no caller or the caller is not a metaPage
                        currentMetaPageRoot.empty();
                        this.currentMetaPage.setTitle(""); // reset del titolo
                        this.currentMetaPage = null;
                        this.toolBarManager.setMetaPage(null); // la toolbar si disabilita o sparisce in questo momento
                        return def.resolve(true); // torna alla mainpage
                    }

                    let calledPageEntityChanged = this.currentMetaPage.entityChanged;
                    this.currentMetaPage = this.currentMetaPage.state.callerPage;
                    this.currentMetaPage.entityCalledChanged = calledPageEntityChanged;
                    this.currentMetaPage.clearCalls();
                    this.toolBarManager.setMetaPage(this.currentMetaPage); // set the currentMetaPage for the toolbar

                    // 3. recupera savedRoot = prop. savedRoot di currentMetaPage attuale, che sarebbe la pag chiamante  
                    let savedRoot = this.currentMetaPage.savedRoot;

                    // 4. esegue replace del contenuto
                    $(parentRoot)[0].replaceChild(savedRoot[0], currentMetaPageRoot[0]);
                    //console.log("currentMetaPage.show()", this.currentMetaPage);
                    return def.from(this.currentMetaPage.show()).promise();
                },

                /**
                 * 
                 * @returns {number}
                 */
                getScreenWidth:function () {
                    return  $(window).width(); //$(document).width(); la document prende la width considerando anche la scrollbar
                },

                /**
                 * 
                 * @returns {number}
                 */
                getScreenHeight:function () {
                   return  $(window).height(); //screen.height; //$(document).height();
                },

                /**
                 * @method callWebService
                 * @public
                 * @description ASYNC
                 * call a  web service named method with prms object. prms are the pairs key:value specific for each call.
                 * The "method" method must be registered with routing.registerService(...) function
                 * @param {string} method "the name of web service"
                 * @param {Object} prms pair of key:value.
                 */
                callWebService:function (method, prms) {
                    let def = appMeta.Deferred('callWebService');

                    // osserva se il metodo è stato censito e registrato
                    let objRouting  = appMeta.routing.getMethod(method);
                    if (!objRouting){
                        alert("method " + method + " not registered for this app. Add the configuration on Routing class calling " +
                            "routing.registerService('method, 'GET/POST', 'my controller path', false, true);");
                        return def.resolve();
                    }
                    // stampa di log
                    appMeta.logger.log( appMeta.logTypeEnum.INFO, "called web service " + method , objRouting);

                    // chiamata al web service
                    let objConn = {
                        method: method,
                        prm: prms
                    };
                    appMeta.connection.call(objConn)
                        .then(function (jsonRes) {
                            // non fa altro che risolvere il risultato, Lo sa chi lo chiama cosa fare con il risultato
                            def.resolve(jsonRes);
                        }).fail(function (err) {
                            def.reject(err);
                        });

                    return def.promise();
                }

            };
            window.appMeta.MetaApp = MetaApp;

}());


