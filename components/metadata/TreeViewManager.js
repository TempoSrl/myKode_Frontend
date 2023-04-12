/**
 * @module TreeViewManager
 * @description
 * Contains a manager for the treeview control
 *
 * inizializzo oggetto jsTree: vedi doc https://www.jstree.com/
 * prima fare "bower install jstree"
 */
(function () {

    var security = appMeta.security;
    var Deferred = appMeta.Deferred;
    var getData = appMeta.getData;
    var getDataUtils  = appMeta.getDataUtils;
    var utils = appMeta.utils;
    var metaModel = appMeta.metaModel;
    var q = window.jsDataQuery;
    var logger = appMeta.logger;
    var logType = appMeta.logTypeEnum;
    var dataRowState = jsDataSet.dataRowState;
    // **** Vedi doc https://www.jstree.com/api/

    /**
     * Method of jsTree lib.
     * Example of call:
     * this.tree.jstree("<method>" , [params]);
     * @type {{TOGGLE_NODE: string, CREATE_NODE: string, SELECT_NODE: string, GET_SELECTED_BOTTOM: string}}
     */
    var jsTreeMethod = {
        GET_NODE : 'get_node',
        TOGGLE_NODE : 'toggle_node', // collapses/expands node
        CREATE_NODE : 'create_node', // creates a new node
        SELECT_NODE : 'select_node', // selects a given node. lancia evento di select_node
        GET_SELECTED: 'get_selected', // gets an array of low level selected nodes
        GET_SELECTED_BOTTOM: 'get_bottom_selected', // gets an array of low level selected nodes
        SET_ICON : 'set_icon', // changes the icon. for exampel for loading node
        OPEN_NODE : 'open_node', // expand node children,
        DELETE_NODE: 'delete_node', // remove a node
        DESELECT_ALL: 'deselect_all', // re,move a node
        GET_PARENT: 'get_parent',
        RENAME_NODE: 'rename_node'
    };

    /***
     * Events of jsTree lib.
     * Example of subscribing
     * this.tree.on(jsTreeEvent.ACTIVATE_NODE, function (e, data) {})
     * @type {{ACTIVATE_NODE: string, LOADED: string}}
     */
    var jsTreeEvent = {
        ACTIVATE_NODE : 'activate_node.jstree', // fired after a node click by user
        LOADED: 'loaded.jstree', // fired after a jstree is loaded
        SELECT_NODE: 'select_node.jstree'
    };

    var jsTreeCssClass = {
        LOADING : 'jstree-loading' // loading indicator
    };


    /**
     *
     * @param {node} elTree
     * @param {DataTable} treeTable
     * @param {HelpForm} helpform
     * @patram {DataTable} primaryTable
     * @returns {TreeViewManager}
     * @constructor
     */
    function TreeViewManager(elTree, helpform, treeTable, primaryTable) {

        if (!elTree) return;
        this.elTree = elTree;
        this.el = elTree;       //rimedio a potenziale incompatibilità con altri controlli custom
        this.helpform = helpform;
        this.treeTable = treeTable;
        this.primaryTable = primaryTable;

        var tag = $(elTree).data("tag");
        this.tag = tag; // lo espongo,lo usa helpform
        this.meta = appMeta.getMeta(this.treeTable.tableForReading());

        this.listType =  this.helpform.getField(tag, 1);

        // calcolo autorelazione
        this.autoChildRelation = getDataUtils.getAutoChildRelation(this.treeTable);

        // var private
        this.doubleClickForSelect = true; // se true al dblclick lanbcia òla select
        this.fixedData = false; // indica se il tree è caricato tutto all'inizio cioè true, false nel caso incrementale
        this.inited= false;
        this.treeNodes = [];
        this.jsTreeMethod = jsTreeMethod;
        this.setManager(treeTable);

        // apre un deferred
        this.defDescribeTree = this.meta.describeTree(this.treeTable, this.listType);

        // m.security = security;

        return this;

    }

    TreeViewManager.prototype = {
        constructor: TreeViewManager,

        /**
         * @method setManager
         * @private
         * @description SYNC
         * @param {DataTable} treeTable
         * Assigns for the dataTable "treeTable" the property treemanager to "this" TreeViewManager
         */
        setManager:function (treeTable) {
            if (treeTable) treeTable.treemanager = this;
        },

        /**
         * @method getManager
         * @public
         * @description SYNC
         * @param {DataTable} treeTable
         * @returns {TreeViewManager} the TreeViewManager linked to the "treeTable"
         */
        getManager:function (treeTable) {
            return  treeTable.treemanager;
        },

        /**
         *
         * @param el
         * @param metaPage
         * @param subscribe
         */
        addEvents: function(el, metaPage, subscribe) {
            subscribe = ( subscribe === undefined) ? true : subscribe;
            this.metaPage = metaPage;

            if (metaPage && subscribe) {
                metaPage.eventManager.subscribe(appMeta.EventEnum.ROW_SELECT, this.selectRowCallBack, this);
            }
        },

        /***
         *
         * @param sender
         * @param table
         * @param row
         * @returns {*|JQueryPromise<{}>|String}
         */
        selectRowCallBack: function(sender, table, row) {
            // TODO.vedere se bisogna gestire la callback ad una row_select
            if (sender === this.el) return Deferred("selectRowCallBack").resolve(); //does never enter in a loop
        },

        /**
         * @method addInternalEvents
         * @private
         * @description SYNC
         */
        addInternalEvents:function () {
            var self  = this;

            // eseguito al click sul nodo da parte dell'utnete
            this.tree.on(jsTreeEvent.ACTIVATE_NODE, function (e, data) {

                if (self.timeoutId) {
                    clearTimeout(self.timeoutId);
                    self.timeoutId = null;
                }

                self.timeoutId = setTimeout(function () {
                    self.selectNodeEv(data.node, true);
                }, appMeta.currApp.dbClickTimeout);


            });

            $(this.elTree).bind("dblclick.jstree", function (event) {

                if (self.timeoutId) {
                    clearTimeout(self.timeoutId);
                    self.timeoutId = null;
                }

                var tree = $(this).jstree();
                var node = tree.get_node(event.target);
                self.dblclickEv(node, true);

            });

            // manda a capo il testo
            $(this.elTree).bind('hover_node.jstree', function() {
                var bar = $(this).find('.jstree-wholerow-hovered');
                bar.css('height',
                    bar.parent().children('a.jstree-anchor').height() + 'px');
            });
        },

        /**
         *
         * @param {jstree node} node
         */
        dblclickEv:function (node) {
            if (!this.metaPage) return;
            if (!this.metaPage.inited) return;
            if (!this.metaPage.mainSelectionEnabled) return;
            var self = this;
            node.original.canSelect()
                .then(function (res) {
                    if (res) {
                        if (!node.original.dataRow) return;
                        if (!node.original.dataRow.getRow) return;
                        if (node.original.dataRow.getRow().table.name !== self.metaPage.primaryTableName) return;
                        if (!self.doubleClickForSelect) return;
                        self.metaPage.mainSelect();
                    }
            })

        },

        /**
         *
         * @param {jstree node} node
         */
        selectNodeEv:function (node, propagate) {
            //console.log("tree- selectNodeEv || single click");
            var self = this;
            var def = Deferred('selectNodeEv');
            if (!node)  return def.resolve();
            if (!node.original)  return def.resolve();

            var res = this.metaPage.beforeSelectTreeManager()
                .then(function (res) {
                    if (res){
                        // osservo se devo navigare i figli
                        return self.beforeOpen(node)
                            .then(function () {
                                // permette di espandere/collassare sul click
                                self.openNode(node);
                                if (self.metaPage && propagate) {
                                    return self.metaPage.rowSelect(self.elTree, self.treeTable, node.original.dataRow);
                                }
                                return def.resolve();
                            });
                    }

                    return def.resolve();
                });

            return def.from(res).promise();
        },

        /**
         *
         * @param {jsTreeNode} node
         */
        openNode:function (node) {
            this.tree.jstree(jsTreeMethod.OPEN_NODE, node);
        },

        /**
         * @method getCurrentRow
         * @public
         * @description SYNC
         * @returns {{result: boolean, changed: (DataTable|*), rowChanged: (ObjectRow|*)}}
         */
        getCurrentRow: function() {
            return { table: this.treeTable, row: this.selectedRow() };
        },

        /**
         * @method beforeOpen
         * @private
         * @description ASYNC
         * It checks if is node to explore and in this case go to the db to read if it has children
         * @param {Object} jstree node. node
         */
        beforeOpen:function (node) {
            var def = Deferred('beforeOpen');
            var self = this;
            if (this.fixedData) return def.resolve();
            if (!node.original) return def.resolve(); // original contiene l'oggetto TreeNode originale
            // metto indicatore di caricamento
            this.setLoadingNodeIcon(node);
            // se è un nodo da esplorare vado a trovare i figli. al ritorno tolgo indicatore
            var res =  utils._if(node.original.toExplore)
                ._then(function () {
                    return self.expandNode(node)
                        .then(function () {
                            self.setDefaultNodeIcon(node);
                            node.original.toExplore = false;
                            return true
                        })
                })._else(function () {
                    self.setDefaultNodeIcon(node);
                    return true;
                }).then(function () {
                    def.resolve();
                });

            return def.from(res).promise();
        },

        /**
         * Add loading indicator to the "node"
         * @param {jstree node} node
         */
        setLoadingNodeIcon:function (node) {
            // inserisce indicatore di loading. utilizzato non meotod standard del jstree, ma posta la classe come fa internamente lui.
            // non ho trovato altro modo

            // true come terzo parametro permette dir ecuperare il dom del nodo. sul quale poi invoco i metodo addclass e removeclass
            var currJsTreeNode = this.tree.jstree("get_node" , node, true);
            currJsTreeNode.addClass(jsTreeCssClass.LOADING).attr('aria-busy',true);
        },

        /**
         * @method setDefaultNodeIcon
         * @private
         * @description SYNC
         * Removes the loading indicator to the "node"
         * @param {jstree node} node
         */
        setDefaultNodeIcon:function (node) {
            var currJsTreeNode = this.tree.jstree("get_node" , node, true);
            currJsTreeNode.removeClass(jsTreeCssClass.LOADING).attr('aria-busy',false);
        },

        removeChilds:function (node) {
            var self = this;
            _.forEach(node.children, function (childNodeId) {
                self.tree.jstree(jsTreeMethod.DELETE_NODE , childNodeId);
            });
        },

        /**
         * @method expandNode
         * @private
         * @description ASYNC
         * @param {Object (jstree node)} node
         * @returns {Deferred}
         */
        expandNode:function (node) {
            var def = Deferred("exapandNode");
            var self = this;
            var r = node.original.dataRow;
            if (!r) return def.resolve();
            if (!r.getRow) return def.resolve();
            var dtRow = r.getRow();
            if ( dtRow.state === dataRowState.detached) def.resolve();

            this.removeChilds(node);
            //TODO n.Nodes.Clear();

            var res = this.expandChilds([r])

                .then(function () {
                    var added = false;

                    var rel = getDataUtils.getAutoChildRelation(self.treeTable);

                    var parentCols = _.map(rel.parentCols,
                        function (cName) {
                            return  self.treeTable.columns[cName];
                        });

                    var childCols = _.map(rel.childCols,
                        function (cName) {
                            return  self.treeTable.columns[cName];
                        });

                    var filterChild = getData.getWhereKeyClauseByColumns(dtRow, parentCols, childCols, self.treeTable,false);
                    // console.log(filterChild.toString());
                    //var sort = r.getRow().table.orderBy();

                    var filterChildList  = dtRow.table.select(filterChild);
                    // console.log(filterChildList);

                    var allAddrowDeferred = [];

                    // TODO canSelect è async : gestire nel loop
                    _.forEach(filterChildList, function (rci) {
                        if (!security.canSelect(rci)){
                            rci.del();
                            rci.acceptChanges();
                        }

                        allAddrowDeferred.push(self.addRow(node, rci));

                    });

                    return $.when.apply($, allAddrowDeferred)
                        .then(function() {

                            added = true;

                            // alla fine apro il nodo
                            self.openNode(node);

                            def.resolve(added);

                        });

                });


            return def.from(res).promise();
        },

        /**
         *
         * @param {treenode js} parentNode
         * @param {ObjectRow} childRow
         * @returns {Deferred<jsTreeNode>)}
         */
        addRow:function(parentNode, childRow){
            var def = Deferred("addRow");
            var self =this;
            return this.createNodeFromRow(parentNode, childRow)
                .then(function (newnode) {
                    // se passo null come 1o prm aggiunge in testa all'albero. oppure potrei passare "#"
                    self.addNode(parentNode, newnode);
                    if (!self.fixedData) newnode.toExplore = true;
                    return def.resolve(newnode);
                });

        },

        /**
         *
         * @param {treenode js} parentNode
         * @param {ObjectRow} row
         * @returns {Deferred}
         */
        createNodeFromRow:function(parentNode, row){
            var def = Deferred("createNodeFromRow");
            var rParent = null;
            if (parentNode){
                if ( parentNode.original.dataRow) {
                    rParent = parentNode.original.dataRow;
                }
            }
            return def.from(this.createNewNode(rParent, row)).promise();
        },

        /**
         * @method InitializeJsTree
         * @private
         * @description ASYNC
         * Loading of jstree is not syncronous, so it launches the first init and returns a deferred.
         * It sets to true the global class var "inited" to store that loading is done
         */
        initializeJsTree:function () {
            var def = Deferred("firstLoad");
            var self = this;
            if (self.inited) return def.resolve(true);

            // passo a jsTree un obj di config. nella 'loaded.jstree' risolvo ildeferred
            this.tree = $(this.elTree)
                .on(jsTreeEvent.LOADED, function(e, data) {
                    self.inited = true;
                    // aggiungo eventi al tree
                    self.addInternalEvents();
                    // risolvo il deferred
                    return def.resolve(true);
                })
                .jstree({
                    "core" : { // core options go
                        'data' : [
                        ],
                        "check_callback" : true, // permit to listen the event callbacks
                        "multiple" : false, // no multiselection
                        "themes" : {
                            "dots" : false, // no connecting dots between dots
                            // "stripes" : true, // mette righe alternate di sfondo
                            "responsive" : true
                        }
                    },
                    "plugins" : ["state", "types", "sort"],  // activate the state plugin on this instance,
                    "sort": function(a, b) {
                        var a1 = this.get_node(a);
                        var b1 = this.get_node(b);
                        var t1 = a1.text ? a1.text.toLowerCase() : '';
                        var t2 = a1.text ? b1.text.toLowerCase() : '';
                        return (t1 > t2) ? 1 : -1;
                    }
                });

            return def.promise();
        },

        /**
         * @method removeLastNodeByRow
         * @private
         * @description SYNC
         */
        removeLastNodeByRow:function() {
            var self = this;
            var objRow = self.helpform.lastSelected(self.treeTable);
            if (!objRow) return;
            // trovo il nodo data la riga e lo rimuovo dall'albero
            var retNode = this.getNodeByRow(objRow);
            if (!retNode) return;
            self.cascadeRemoveLastNodeByRow(retNode);
        },

        cascadeRemoveLastNodeByRow:function(node) {
            var self = this;
            var jsNode = self.tree.jstree(jsTreeMethod.GET_NODE, node.id);
            var nodechildren = _.cloneDeep(jsNode.children);
            _.forEach(nodechildren, function (childId) {
                var childNode = self.tree.jstree(jsTreeMethod.GET_NODE, childId);
                self.cascadeRemoveLastNodeByRow(childNode);
            });

            this.treeNodes = this.treeNodes.filter(function(currNode, index, arr){
                return currNode.id !== node.id;
            });
            this.tree.jstree(jsTreeMethod.DELETE_NODE, jsNode);
        },

        /**
         * @method fillNodes
         * @private
         * @description SYNC
         * Fills the treeview with the nodes taken from all tree_table rows
         * Selects no node.
         * @returns Promise
         */
        fillNodes:function (isToSelect, last) {
            // console.log('executing fillNodes');
            var def = Deferred('fillNodes');
            var self = this;
            var sort = this.getSorting(this.treeTable);

            if (isToSelect) {
               this.removeLastNodeByRow();
            }

            // mi assicuro che il jstree è caricato, così posso aggiungere i nodi.
            // Altrimenti succede che aggiunge solamente l'ultimo nodo.
            var res = this.initializeJsTree()

                .then(function () {

                    return self.defDescribeTree.then(function (res) {

                        self.rootCondition = res.rootCondition;
                        self.nodeDispatcher =  res.nodeDispatcher;

                        var roots = self.treeTable.select(self.rootCondition);

                        var allCreateNodeDeferred = [];

                        // le createnode sono asincrone dentro un ciclo, metto in array e risolvo in when()
                        _.forEach(roots, function (rootRow) {
                            allCreateNodeDeferred.push(self.createNewNode(null, rootRow));
                        });

                        // risolvo i deferred
                        return $.when.apply($, allCreateNodeDeferred)
                            .then(function() {

                                // ogni def risolto lancia un altro def, che quinid appoggio in un array che a sua volta risolverò nela when
                                var allfillChildsNodeDeferred = [];

                                _.forEach(arguments, function (newNode) {

                                    // se passo null come 1o prm aggiunge in testa all'albero. oppure potrei passare "#"
                                    self.addNode(null, newNode);
                                    allfillChildsNodeDeferred.push(self.fillChildsNode(newNode, newNode.dataRow));
                                });


                                return $.when.apply($, allfillChildsNodeDeferred)
                                    .then(function() {

                                        self.tree.jstree("redraw" , true);

                                        if (self.treeNodes.length > 0 && isToSelect) {
                                            // vedo se seleziono l'ultimo inserito o il primo
                                            if (last) {
                                                return def.from(self.selectNodeByRow(self.treeNodes[self.treeNodes.length - 1].dataRow, !self.navigator));
                                            }
                                            var objRow = self.helpform.lastSelected(self.treeTable) || self.treeNodes[0].dataRow;
                                            return def.from(self.selectNodeByRow(objRow, !self.navigator ));
                                        }

                                        def.resolve();

                                    });

                            });
                    })
                });

            return def.from(res).promise();
        },

        /**
         * @method getSorting
         * @private
         * @description SYNC
         * Returns the sorting for the DataTable. Ex "title asc"
         * It calls first the getSorting of the js metadata, and if it is null call the orderby on the dt.
         * orderBy is the getSorting of the backend metadata
         * @param {DataTable} dt
         * @returns {string} the sorting
         */
        getSorting: function (dt) {
            var sorting  = this.meta.getSorting(this.listType);
            return (sorting ? sorting : dt.orderBy());
        },

        /**
         * Seleziona lputlimo nodo inserito. utilizzato per selezionare dopo add
         */
        selectLastNode:function () {
            if (this.treeNodes.length > 0){
                var lastNode =  this.treeNodes[this.treeNodes.length - 1];
                this.tree.jstree(jsTreeMethod.DESELECT_ALL, true);
                var jsTreeNodetoSelect = this.tree.jstree(jsTreeMethod.GET_NODE, lastNode.id);
                if (jsTreeNodetoSelect) this.tree.jstree(jsTreeMethod.SELECT_NODE, jsTreeNodetoSelect, true);
            }
        },

        /**
         * @method fillChildsNode
         * @private
         * @description ASYNC
         * @param {node} parentNode
         * @param {ObjectRow} parentRow
         * @returns {Deferred}
         */
        fillChildsNode:function (parentNode, parentRow) {

            var def = Deferred("fillChildsNode");
            // reset del booleano che indica che devo esplorare il nodo
            parentNode.toExplore = false;

            var self = this;

            var childList = parentRow.getRow().getChildRows(this.autoChildRelation.name);

            // le createnode sono asyncrone dentro un ciclo, metto in array e risolvo in when()
            var allCreateNodeDeferred = [];
            _.forEach(childList, function (childRow) {
                if (childRow === parentRow) return true; // prossima iterazione

                // TODO canSelect è async : gestire nel loop
                if (!security.canSelect(childRow)){
                    childRow.del();
                    childRow.acceptChanges();
                    return true; // prossima iterazione
                }

                allCreateNodeDeferred.push(self.createNewNode(parentRow, childRow));
            });

            var res = $.when.apply($, allCreateNodeDeferred)
                .then(function() {
                    var allfillChildsNodeDeferred = [];
                    _.forEach(arguments, function (newNode) {
                        self.addNode(parentNode, newNode);
                        allfillChildsNodeDeferred.push(self.fillChildsNode(newNode, newNode.dataRow));
                    });

                    return $.when.apply($, allfillChildsNodeDeferred)
                        .then(function(defObj) {
                            // if fixed data don't add dummy nodes
                            if (self.fixedData) return def.resolve();

                            // se non ho figli devo esplorare. recupero i children dall'oggetto node intenro al jstree
                            var currJsTreeNode = self.tree.jstree("get_node" , parentNode);
                            if (currJsTreeNode){
                                if (currJsTreeNode.children.length === 0){
                                    parentNode.toExplore = true;
                                }
                            }
                            return def.resolve();
                        });

                });

            return def.from(res).promise();

        },

        /**
         * @method createNewNode
         * @private
         * @description ASYNC
         * @param {ObjectRow} parentRow
         * @param {ObjectRow} childRow
         * Creates a new TreeNode and returns a js object the representation of the node in jstree
         * @returns {Deferred<TreeNode>)}
         */
        createNewNode:function (parentRow, childRow) {
            return this.nodeDispatcher.getNode(parentRow, childRow);
        },

        /**
         * @method compareNodes
         * @private
         * @description SYNC
         * Return true if the "n1" node is the same of "n2"
         * @param {TreeNode} n1
         * @param {TreeNode} n2
         */
        compareNodes:function (n1, n2) {
            // return (n1.text === n2.text);
            if (this.compareNodeByRow(n1.dataRow, n2.dataRow)){
                if (n2.text !== n1.text){
                    n2.text = n1.text; // aggiorno il testo eventualmente
                    this.tree.jstree(jsTreeMethod.RENAME_NODE, n2 , n1.text );
                }

                return true;
            }
            return false;
        },

        /**
         *
         * @param {ObjectRow} r1
         * @param {ObjectRow} r2
         * @returns {boolean}
         */
        compareNodeByRow:function (r1, r2) {
            return getDataUtils.isSameRow(this.treeTable, r1, r2);
        },

        /**
         * @method addNode
         * @private
         * @description SYNC
         * @param {TreeNode} parentNode
         * @param {TreeNode} node
         * adds the node in the jsTree structure.
         * modifies the "node" with the "id" the autogenerated jstree create_node function
         * The id is mandatory to adding the children. If it hasn0't id it not adds child
         */
        addNode:function (parentNode ,node) {

            var retNode = null;
            var self  = this;
            // evita l'aggiunta di nodi già aggiunti
            _.forEach(this.treeNodes, function (currNode) {
                if (self.compareNodes(node,  currNode)){
                    node.setJsTreeNodeId(currNode.id);
                    retNode = currNode; // per robustezza attacco lo stesso id
                    return false; // esco dal ciclo perchè l'ho trovato e lo assegno alla var locale che poi tornerò
                }
            });

            // se già esiste lo ritorno senza aggiungere
            if (retNode) return retNode;

            // la create_node autogenera un id, lo lego al nodo attuale creato, così poi potrò aggiungere dei figli,
            // in quanto ora ha un suo id

            // recupero l'autogenerato id e lo lego al nodo jstree
            var retNodeId = this.tree.jstree(jsTreeMethod.CREATE_NODE , parentNode, node, 'last', false, false);
            // il node non viene modificato, quindi configuro l'id autogenerato tramite il metodo setJsTreeNodeId()
            //   della classe TreeNode
            // N.B id è importante per la lib jstree per aggiungere i nodi al posto giusto
            node.setJsTreeNodeId(retNodeId);

            // aggiungo alla collection dei nodes
            this.treeNodes.push(node);
        },

        /**
         * @method compareNode
         * @private
         * @description SYNC
         * @param {TreeNode} node
         * @param {ObjectRow} dataRow
         * Returns true if the node "node" is linked to the row "dataRow" , false otherwise
         * @returns {boolean}
         */
        compareNode:function (node, dataRow){
            if (!node.dataRow || !dataRow) return false;
            return this.compareNodeByRow(node.dataRow, dataRow);
        },

        /**
         * @method selectNodeByRow
         * @public
         * @description SYNC
         * Selects the TreeNode corresponding to a given DataRow
         * @param {ObjectRow} dataRow
         * @param {boolean} propagate
         */
        selectNodeByRow:function(dataRow, propagate){
            var def = Deferred('selectNodeByRow');
            // **** **** **** ***
            // ===> N:B Commentata riga 3823 della libreria jstree.js poichè la extend perde la getRow() dell'ObjectRow
            //  linkato al nodo in fase di costruzione.
            // capire il motivo, se possibile, oppure modificare la libreria commentando appunto tale riga che
            //   estende un ogetto plaintext vuoto con il nodo passato
            // "node = $.extend(true, {}, node);

            var self = this;
            var retNode = this.getNodeByRow(dataRow);

            // lo seleziono. apre il tree fino al nodo in questione
            return this.selectNodeByNode(retNode, propagate)
                .then(function () {
                    def.resolve(retNode);
                });
        },

        /**
         *
         * @param {ObjectRow} dataRow
         * @returns {null}
         */
        getNodeByRow:function(dataRow) {
            var retNode = null;
            var self = this;
            _.forEach(this.treeNodes, function (currNode) {
                // se non ho dataRow, provo a selezionare il primo
                if (!dataRow && currNode.dataRow){
                    retNode = currNode;
                    return false;
                }
                if (self.compareNode(currNode, dataRow)){
                    retNode = currNode;
                    return false; // esco dal ciclo perchè l'ho trovato e lo assegno alla var locale che poi tornerò
                }
            });
            return retNode;
        },

        /**
         * @method selectNodeByNode
         * @public
         * @description SYNC
         * @param  {TreeNode} nodeToSelect
         * @param {boolean} propagate
         */
        selectNodeByNode:function (nodeToSelect, propagate) {
            var def = Deferred('selectNodeByNode');
            // lo seleziono. apre il tree fino al nodo in questione e lancoia evento selct_node gestito
            this.tree.jstree(jsTreeMethod.DESELECT_ALL, true);

            // propagate = propagate === undefined ? false : (propagate ? true : false);
            // this.preventDefaultEvent = propagate ? false : true;
            if (!nodeToSelect) return  def.resolve();
            var jsTreeNodetoSelect = this.tree.jstree(jsTreeMethod.GET_NODE, nodeToSelect.id);
            this.tree.jstree(jsTreeMethod.SELECT_NODE, jsTreeNodetoSelect, true);
            var res = this.selectNodeEv(jsTreeNodetoSelect, propagate)
                .then(function () {
                    def.resolve();
                });
            return def.from(res).promise();
        },

        /**
         * @method selectedRow
         * @public
         * @description SYNC
         * Gets the row linked to currently selected TreeNode
         * @returns {ObjectRow|null}
         */
        selectedRow:function () {
            var selectedNodes = this.tree.jstree( jsTreeMethod.GET_SELECTED , true); // torna un array. dovrebbe essere sempre di lunghezza 1
            if (selectedNodes.length > 0){
                var selNode = selectedNodes[0];
                // la funz torna il nodo del jsTree, per recuperare l'oggetto TreeNode di partenza utilizzo orginal dell'oggetto jsTree stesso
                return selNode.original.dataRow;
            }

            return null;
        },

        /**
         * @method selectedRow
         * @public
         * @description SYNC
         * Gets the row linked to currently selected TreeNode
         * @returns {jsTreeNode|null}
         */
        selectedNode:function () {
            var selectedNodes = this.tree.jstree( jsTreeMethod.GET_SELECTED, true); // torna un array. dovrebbe essere sempre di lunghezza 1
            if (selectedNodes.length > 0){
                return  selectedNodes[selectedNodes.length - 1];
            }
            return null;
        },


        /**
         * @method selectRow
         * @public
         * @description ASYNC
         * Reads all the rows parent pf a row "r" and select it on the tree
         * @param {DataRow} r
         * @param {string} listType
         * @return {Deferred<DataRow>)}
         */
        selectRow:function( r,  listType) {
            //console.log("executing selectRow");
            var def = Deferred("selectRow_treeViewManager");
            var self = this;

            if (!r) return def.resolve(null);

            //Verify if R is already in Tree
            var keyfilter = this.treeTable.keyFilter(r.current);//, this.treeTable, this.treeTable, false);
            var existent = this.treeTable.select(keyfilter);

            var toSelect = null;
            var res = utils._if(existent.length > 0)
                ._then(function () {
                    toSelect = existent[0];
                    return true; // mando sul the finale
                })
                ._else(function () {
                    return getData.getByKey(self.treeTable, r)
                        .then(function (dtRowToSelect) {
                            toSelect = dtRowToSelect.current;
                            return true; // mando sul the finale
                        })
                })
                .then(function () {
                    if (!toSelect) return def.resolve(null);

                    return self.doGetAllRowsParents([toSelect])
                        .then(function () {
                            return self.expandChilds(self.treeTable.rows);
                        })
                        .then(function () {
                            return self.fillNodes(false)
                                .then(function () {
                                    return self.selectNodeByRow(toSelect, true)
                                        .then(function () {
                                            return def.resolve(toSelect);
                                        }); // lancerà evento di selezione riga su metapage
                                });
                        });
                });

            return def.from(res).promise();
        },

        /***
         * @method startWithField
         * @public
         * @description AYNC
         * Fills a tree given a start condition. Also Accepts FilterTree **CHECKED**
         * @param startCondition
         * @param startValueWanted
         * @param startFieldWanted
         * @returns {Deferred<null|ObjectRow>}
         */
        startWithField:function(startCondition, startValueWanted, startFieldWanted) {
            var def = Deferred("startWithField");
            var self =  this;
            this.helpform.myClear(this.treeTable);

            return getData.getSpecificChild(this.treeTable, startCondition, startValueWanted, startFieldWanted)
                .then(function (dtRow) {
                    if (!dtRow) return def.resolve(null);

                    //checks if any filter is present
                    if (self.treeTable.MetaData_TreeFilterTable) {
                        var rowkey = dtRow.table.keyFilter(dtRow.current);
                            //getData.getWhereKeyClause(dtRow, dtRow.table, dtRow.table, false);
                        var list = self.treeTable.MetaData_TreeFilterTable;
                        var founded = list.select(rowkey);
                        if (founded.length === 0) {
                            return def.resolve(null);
                        }
                    }

                    return self.defDescribeTree
                        .then(function (res){
                            // dopo la describeTree assegno le 2 prop che servono per il popolamento
                            self.rootCondition = res.rootCondition;
                            self.nodeDispatcher =  res.nodeDispatcher;

                            var filter = self.helpform.mergeFilters(startCondition, self.rootCondition);

                            return self.start(filter, false)
                                .then(function () {
                                    //search a node that has StartCondition + StartFieldWanted LIKE StartValueWanted
                                    return self.selectNodeByRow(dtRow, true)
                                        .then(function () {
                                            self.helpform.lastSelected(self.treeTable, dtRow);
                                            return def.resolve(dtRow);
                                        });
                                });
                        }) ;
                });
        },

        /**
         * @method start
         * @public
         * @description ASYNC
         * @param {jsDataQuery} rootFilter
         * @param {boolean} clear
         * @returns {Deferred}
         */
        start:function( rootFilter,  clear) {
            // console.log("executing start");
            var def =  Deferred("start");
            var self = this;

            // N.B MetaData_TreeFilterTable è una extendedPropertis impostata dallafunz helpform.SetFilterToTree()
            // che pare non sia piùusata al momento, quindi nel ramo _else non entreremo mai

            var res = utils._if(!this.treeTable.MetaData_TreeFilterTable)
                ._then(function () {
                    self.fixedData = false;

                    // recupera i nodi non root
                    var notRoots = self.treeTable.select(q.not(rootFilter));

                    // TODO la clear pulisce la tabella, quindi i notRoots calcolati non hanno più getRow, sono semplic object invece di objectRow
                    //this.treeTableCopy = getD

                    // popola self.treeTable con i nodi root e i figli
                    return getData.doGetTableRoots(self.treeTable, rootFilter, clear)
                        .then(function () {
                            return self.populateTreeFromChilds(notRoots);
                        });

                })
                ._else(function () {

                    self.fixedData = true;
                    var list = self.treeTable.MetaData_TreeFilterTable;
                    metaModel.copyPrimaryKey(list, self.treeTable);

                    _.forEach(list.rows, function (toCopy) {
                        var searchFilter =self.treeTable.keyFilter(toCopy.current);
                            //getData.getWhereKeyClause(toCopy, toCopy.table, toCopy.table, false);

                        if (self.treeTable.select(searchFilter).length > 0) {
                            return true;
                        } // continuo iterazione
                        var newR = self.treeTable.newRow();
                        _.forEach(self.treeTable.columns, function (col) {
                            newR[col.name] = toCopy[col.name];
                            // TreeTable.Rows.Add(newR);
                            newR.acceptChanges();
                        });
                    });

                    var rowsChild  = [];
                    _.forEach(list.rows, function (toCopy) {
                        var searchFilter =self.treeTable.keyFilter(toCopy.current);
                            //getData.getWhereKeyClause(toCopy, toCopy.table, toCopy.table, false);
                        var found = self.treeTable.select(searchFilter)[0];
                        rowsChild.push(found);
                    });

                    return getData.populateTreeFromChilds(rowsChild);

                })
                .then(function () {
                    return self.fillNodes(true);
                });

            return def.from(res).promise();
        },

        // ********************************************************************************************************************** //
        // INIZIO FUNZIONI PER ALGORITMO PER RECUPERARE I PARENTS di un set di child, e poi
        //  recuperarne tutti i children di primo livello

        /**
         * @method populateTreeFromChilds
         * @public
         * @description ASYNC
         * 1. Get all parents of the rows and  2. get all children of each row of point1
         * @param {ObjectRow[]} rowsChild
         * @returns {Deferred}
         */
        populateTreeFromChilds:function (rowsChild) {

            /*
             1. Dati n child, lancio una funz server doGetAllRowsParents(): cioè 1 query con or dei filtri dei childs attuali su AutoParent Relation.
             2. Per ogni riga tornata verifico che effettivamente siano tornati dei parents. se non trovo parents vado al punto 4.
             3. itero il punto 1 e 2 su tutti i nuovi parents del punto 2.
             4. Trovo tutti i childs di tutte le righe precedenti tramite AutoChild Relation

             Per evitare che aggiungiamo più volte la stessa riga quanto riempiamo man mano il DataTable con le righe
             ci pensa già la mergeRowsIntoTable() richiamata internamente alle nostre select().

             Quindi nel caso di N livelli, faremo al max N query parents + 1 per tutti i childs di primo livello.
             */

            var def = Deferred('populateTreeFromChilds');
            var self = this;

            var res = utils._if(rowsChild.length === 0)

                ._then(function () {
                    // Condizione uscita funz. ricorsiva
                    // 4. Trovo tutti i childs di tutte le righe precedenti tramite AutoChild Relation. un or con il filtri per ogni riga
                    return self.expandChilds(self.treeTable.rows);
                })
                ._else(function () {
                    // 1. Dati n child, lancio una funz server doGetAllRowsParents(): cioè 1 query con or dei filtri dei childs attuali su AutoParent Relation.
                    self.doGetAllRowsParents(rowsChild).then(
                        function (parentRows) {
                            // vado in ricorsione perchè ho trovato parents di cui devo trovare i rispettivi parents
                            return self.populateTreeFromChilds(parentRows);
                        });
                });

            return def.from(res).promise();
        },

        /**
         * @method expandChilds
         * @public
         * @description ASYNC
         * Returns all the child rows of the table "treeTable"
         */
        expandChilds:function (list) {
            // console.log("invoking expandChilds");
            var childFilter = null;
            var self = this;
            var def = Deferred("getParents");

            if (!list) return def.resolve(false);
            if (list.length === 0) return def.resolve(false);

            var rel = getDataUtils.getAutoChildRelation(self.treeTable);

            var rowsManaged = [];

            _.forEach(list, function (row) {

                // con return true, eseguo prox iterazione
                if (!row) return true;
                if (!row.getRow) return true;
                //  if (self.treeTable.existingRow(row)) return true; // se esiste non considero di nuovo nel filtro
                var dtRow = row.getRow();
                if (dtRow.state === dataRowState.deleted || dtRow.state === dataRowState.detached ) return true;

                //  osservo se già ho considerato
                var arr = _.filter(rowsManaged, self.treeTable.keyFilter(row));
                if (arr.length !== 0) return true;
                rowsManaged.push(row);

                var parentCols = _.map(rel.parentCols,
                    function (cName) {
                        return  self.treeTable.columns[cName];
                    });

                var childCols = _.map(rel.childCols,
                    function (cName) {
                        return  self.treeTable.columns[cName];
                    });

                // calcolo nuovo filtro
                var currFilter = getData.getWhereKeyClauseByColumns(dtRow, parentCols , childCols, self.treeTable, true);
                if (!currFilter) return true;

                // se esiste il filtro lo concateno in or con il filtro parziale se già esiste, altrimenti inizializzo con il  currFilter
                childFilter = childFilter ? q.or(childFilter, currFilter) : currFilter;
            });

            childFilter = self.helpform.mergeFilters(childFilter, self.treeTable.staticFilter());
            // eseguo la select, con il filtro di or costruito con e clausole dei child. popolo la self.treeTable
            var res =  getData.runSelectIntoTable(self.treeTable, childFilter, null);

            return  def.from(res).promise();
        },

        /**
         * @method doGetAllRowsParents
         * @public
         * @description ASYNC
         * Returns an array of ObjectRow on Deferred. those rows are the parents of "rows"
         * @param {ObjectRow[]} rows
         */
        doGetAllRowsParents:function (rows) {
            var self = this;
            var def = Deferred("doGetAllRowsParents");

            // prendo autorelazione
            var parentRel = getDataUtils.getAutoParentRelation(self.treeTable);

            // array dei nuovi parents di cui poi dovrò trovare a sua volta i parent
            var newParentRows = [];

            var res = this.getRowParents(rows)

                .then(function () {

                    // 2. Per ogni riga child di input verifico che effettivamente siano tornati dei parents dopo la query
                    _.forEach(rows, function (rowChild) {

                        var parents = parentRel.getParents(rowChild);
                        // aggiungo ai nuovi parent. Ha senso solo se ha un padre. N.B non è un grafo!
                        // Se avesse più di 1 padre ci sarebbe errore nei dati!
                        if (parents.length === 1 )  newParentRows.push(parents[0]);
                        if (parents.length > 1 )  logger.log(logType.ERROR, self.getMessageErrorTree(rowChild));
                    });

                    // risolvo il def con tutti i parents delle rows di input
                    return def.resolve(newParentRows);

                });

            return  def.from(res).promise();
        },

        /**
         * @method getMessageErrorTree
         * @public
         * @description SYNC
         * @param {ObjectRow} row
         * Returns a string log error
         * @returns {string}
         */
        getMessageErrorTree:function (row) {
            // TODO sistemare messaggio, mettere maggiori info
            try {
                return "IMPOSSIBILE: 1 riga della tabella del tree " + row.getRow().table.name + " ha più righe padri";
            }catch (e){
                return "IMPOSSIBILE: 1 riga della tabella del tree ha più righe padri";
            }

        },

        /**
         * @method getRowParents
         * @public
         * @description ASYNC
         * Gets all rows parent rows of "rows". Builds an or clause among the filter for each row.
         * It fires only 1 query
         * @param {ObjectRow[]} rows
         * @returns {Deferred}
         */
        getRowParents:function (rows) {
            var parentFilter = null;
            var self = this;
            var def = Deferred("getParents");
            var rel = getDataUtils.getAutoParentRelation(self.treeTable);

            var rowsManaged = [];

            _.forEach(rows, function (childRow) {

                // con return true, eseguo prox iterazione
                if (!childRow) return true;
                if (!childRow.getRow) return true;
                var dtRow = childRow.getRow();
                if (dtRow.state === dataRowState.deleted || dtRow.state === dataRowState.detached ) return true;
                if (getDataUtils.containsNull(childRow, rel.childCols)) return true;

                //  osservo se già ho considerato
                var arr = _.filter(rowsManaged, self.treeTable.keyFilter(childRow));
                if (arr.length !== 0) return true;
                rowsManaged.push(childRow);

                var childCols = _.map(rel.childCols,
                    function (cName) {
                        return  self.treeTable.columns[cName];
                    });

                var parentCols = _.map(rel.parentCols,
                    function (cName) {
                        return  self.treeTable.columns[cName];
                    });

                // calcolo nuovo filtro
                var currFilter = getData.getWhereKeyClauseByColumns(dtRow, childCols, parentCols, self.treeTable, true);
                if (!currFilter) return true;

                // se esiste il filtro lo concateno in or con il filtro parziale se già esiste, altrimenti inizializzo con il  currFilter
                parentFilter = parentFilter ? q.or(parentFilter, currFilter) : currFilter;
            });

            // eseguo la select, con il filtro di or costruito con e clausole dei parent. popolo la self.treeTable
            var res =  getData.runSelectIntoTable(self.treeTable, parentFilter, null);

            return  def.from(res).promise();
        },

        // FINE FUNZIONI PER ALGORITMO PER RECUPERARE I PARENTS di un set di children, e poi recuperarne tutti i children
        //  di primo livello
        // ********************************************************************************************************************** //

        /***
         *
         * @param el
         * @param value
         * @returns {*}
         */
        fillControl:function (el, value) {
            // console.log("executing fillControl");
            var def = Deferred('fillComtrol-treeview');
            if (this.treeTable.name === this.helpform.primaryTableName) return def.resolve();
            var res = this.fillNodes(false);
            return def.from(res).promise();
        },

        /**
         * Reads some row related to a tree in order to display it at beginning
         * @param {jsDataQuery} filter
         * @param {boolean} skipPrimary
         * @returns {Deferred}
         */
        filteredPreFillTree:function (filter, skipPrimary) {
            var def = Deferred('filteredPreFillTree');
            var self =  this;
            if (skipPrimary &&  this.treeTable.name === this.helpform.primaryTableName) return def.resolve();

            var res = self.defDescribeTree
                .then(function (res){
                    // dopo la describeTree assegno le 2 prop che servono per il popolamento
                    self.rootCondition = res.rootCondition;
                    self.nodeDispatcher =  res.nodeDispatcher;

                    filter = self.helpform.mergeFilters(filter, res.rootCondition);
                    return self.start(filter, true);
                }) ;

            return def.from(res).promise();
        },

        /**
         *
         * @param {node} el
         * @param {Object} param {tableWantedName:tableWantedName, filter:filter, selList:selList}
         * @returns {*}
         */
        preFill: function(el, param) {
            // Metodo di interfaccia del customControl
            let def = Deferred("preFill-treeviewManager");

            if(param.tableWantedName && param.tableWantedName !== this.treeTable.name ) return def.resolve();

            if (!this.helpform.mainTableSelector && this.treeTable.name === this.helpform.primaryTableName){
                this.helpform.mainTableSelector = this;
            }

            return def.from(this.filteredPreFillTree(param.filter, true)).promise();
        },

        /**
         *
         */
        clearControl:function () {
            // DO NOTHING?
        },

        /**
         * Deletes current node from tree (and all childs recursively)
         */
        deleteCurrentNode:function() {
            var current = this.selectedNode();
            if (!current) return;
            this.cascadeDelete(current);

        },

        /**
         *
         * @param {TreeNode} node
         */
        cascadeDelete:function (node) {
            var self = this;
            _.forEach(node.children, function (childId) {
                var childNode =  self.tree.jstree(jsTreeMethod.GET_NODE, childId);
                self.cascadeDelete(childNode);
            });

            if (!node.original) return;
            var r = node.original.dataRow;
            if (!r) return;
            if (r.getRow) r.getRow().del();
            this.tree.jstree(jsTreeMethod.DELETE_NODE, node);
        },

        /**
         *
         * @param gridCtrl
         */
        setNavigator:function (gridCtrl) {
            this.navigator = gridCtrl;
        },

        /**
         *
         * @param  {TreeNode} node
         * @returns {boolean}
         */
        isRoot:function (node) {
            var parentId = this.tree.jstree(jsTreeMethod.GET_PARENT, node);
            // il nodo root per ogni jstree ha un parentId = "#"
            return (parentId === "#");
        },

        /**
         *
         * @param  {TreeNode} node
         * @returns {boolean}
         */
        isLeaf:function (node) {
            return (node.children.length === 0);
        },

        /**
         * @param  {TreeNode} node
         * @returns {boolean}
         */
        hasDummyChild:function (node) {
            return node.original.toExplore;
        },

        /**
         *
         * @param node
         * @returns {*}
         */
        getParent:function (node) {
            var parentId = this.tree.jstree(jsTreeMethod.GET_PARENT, node);
            return this.tree.jstree(jsTreeMethod.GET_NODE, parentId);
        },

        /**
         *
         * @param id
         * @returns {TreeNode}
         */
        getNodeById:function (id) {
            if (id === undefined || id === null) return null;
            return this.tree.jstree(jsTreeMethod.GET_NODE, id);
        }
    };

    appMeta.CustomControl("tree", TreeViewManager);
    appMeta.TreeViewManager = TreeViewManager;


}());
