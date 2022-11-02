/**
 * Custom Control for the tree of a table with autorelation
 * @module TreeControl
 * @description
 * Manages the graphics and the logic of a upload for the attachments
 */
(function () {

   var Deferred = appMeta.Deferred;
   var getDataUtils = appMeta.getDataUtils;
   var dataRowState = jsDataSet.dataRowState;
   var q = window.jsDataQuery;
   /**
    * Method of jsTree lib.
    * Example of call:
    * this.tree.jstree("<method>" , [params]);
    * @type {{TOGGLE_NODE: string, CREATE_NODE: string, SELECT_NODE: string, GET_SELECTED_BOTTOM: string}}
    */
   var jsTreeMethod = {
      GET_NODE: 'get_node',
      TOGGLE_NODE: 'toggle_node', // collapses/expands node
      CREATE_NODE: 'create_node', // creates a new node
      SELECT_NODE: 'select_node', // selects a given node. lancia evento di select_node
      GET_SELECTED: 'get_selected', // gets an array of low level selected nodes
      GET_SELECTED_BOTTOM: 'get_bottom_selected', // gets an array of low level selected nodes
      SET_ICON: 'set_icon', // changes the icon. for exampel for loading node
      OPEN_NODE: 'open_node', // expand node children,
      DELETE_NODE: 'delete_node', // remove a node
      DESELECT_ALL: 'deselect_all', // re,move a node
      GET_PARENT: 'get_parent',
      RENAME_NODE: 'rename_node',
      REDRAW: 'redraw'
   };

   /***
    * Events of jsTree lib.
    * Example of subscribing
    * this.tree.on(jsTreeEvent.ACTIVATE_NODE, function (e, data) {})
    * @type {{ACTIVATE_NODE: string, LOADED: string}}
    */
   var jsTreeEvent = {
      ACTIVATE_NODE: 'activate_node.jstree', // fired after a node click by user
      LOADED: 'loaded.jstree', // fired after a jstree is loaded
      SELECT_NODE: 'select_node.jstree'
   };

   var jsTreeCssClass = {
      LOADING: 'jstree-loading' // loading indicator
   };

   /**
    *
    * @param {html node} el
    * @param {HelpForm} helpForm
    * @param {DataTable} table
    * @param {DataTable} primaryTable
    * @param {string} listType
    * @constructor
    */
   function TreeControl(el, helpForm, table, primaryTable, listType) {
      this.helpForm = helpForm;
      this.treeTable = table;
      this.dataSourceName = this.treeTable.name;
      this.DS = this.treeTable.dataset;
      this.el = el;
      this.tag = $(this.el).data("tag");
      this.listType = listType;
      return this;
   }

   TreeControl.prototype = {
      constructor: TreeControl,

      init: function () {
         this.tag = $(this.el).data("tag");
         this.dataSourceName = this.treeTable.name;
         this.DS = this.treeTable.dataset;
         // invoco la describe column per i nomi delle colonne e anche per i campi calcolati
         this.meta = appMeta.getMeta(this.treeTable.tableForReading());
         this.listType = this.listType ? this.listType : this.helpForm.getField(this.tag, 1);
         // calcolo autorelazione e colonne id e parent
         this.autoChildRelation = getDataUtils.getAutoChildRelation(this.treeTable);
         this.idColumnName = this.getIdColumnName();
         this.parIdColumnName = this.getParIdColumnName();
         this.defDescribedColumn = this.meta.describeColumns(this.treeTable, this.listType);

         this.inited = false;
         this.treeNodes = [];
         this.jsTreeMethod = jsTreeMethod;

         this.isInsertBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttoninsert");
         this.isEditBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttonedit");
         this.isDeleteBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttondelete");

         // costrusice la grafica del controllo con i bottoni
         this.buildTemplateHtml();
      },

      addEvents: function (el, metaPage, subscribe) {         
         this.metaPage = metaPage;               
      },
      /**
       * Finds root tree, and create it if doesn't exist
       * @param prms { 
                rootTitle : string,
                rootColumnNameTitle : string
                }
       * @returns {*}
       */
      findAndSetRoot: function (prms) {
         var def = appMeta.Deferred('findAndSetRoot');
         var metapage = this.metaPage;
         var currentRow = metapage.state.currentRow;
         var treeTableName = this.dataSourceName;
         var parIdTreeColumnName = this.parIdColumnName;
         var dtTree = metapage.getDataTable(treeTableName);
         var idParentVirtual = 9999999;


         var arrayEq = _.map(metapage.getPrimaryDataTable().key(), function (columnName) {
            return q.eq(columnName, currentRow[columnName]);
         });
         arrayEq.push(q.eq(parIdTreeColumnName, idParentVirtual));
         var rootCondition = q.and(arrayEq);
         this.rootCondition = rootCondition;
         // vedo se è added sul dataset
         var roots = dtTree.select(rootCondition);
         if (roots.length) {
            roots[0][prms.rootColumnNameTitle] = prms.rootTitle;
            return def.resolve(true);
         }
       
         // se non è sul dataset vedo sul db
         return appMeta.getData.runSelect(treeTableName, '*', rootCondition)
            .then(function (table) {
               // non esiste già rootcondition, creo la riga
               if (!table.rows.length) {
                  var meta = appMeta.getMeta(treeTableName);
                  var objDefaults = {};
                  objDefaults[parIdTreeColumnName] = idParentVirtual;
                  objDefaults[prms.rootColumnNameTitle] = prms.rootTitle;
                  dtTree.defaults(objDefaults);
                  return def.from(meta.getNewRow(currentRow.getRow(), dtTree));
               }               
               return def.resolve(true);
            });

      },

      getIdColumnName: function () {
         var partentCol = this.autoChildRelation.parentCols;
         return partentCol[0];
      },

      getParIdColumnName: function () {        
         var childCols = this.autoChildRelation.childCols;
         return childCols[0];
      },

      /**
       * @method buildTemplateHtml
       * @private
       * @description SYNC
       * Builds the upload control and appends to the parent
       */
      buildTemplateHtml: function () {
         var uniqueid = appMeta.utils.getUniqueId();
         this.idBtnAdd = "btn_add_node" + uniqueid;
         this.idBtnEdit = "btn_edit_node" + uniqueid;
         this.idBtnDel = "btn_del_node" + uniqueid;
         this.idRootAddedMsg = "lbl_root_msg" + uniqueid;
         var idElTree = "treecontrol" + uniqueid;
         this.elTree = '#' + idElTree;
         var htmlCodeTemplate = '';
         if (this.isInsertBtnVisible) {
            htmlCodeTemplate += '<button disabled class="btn btn-primary mr-2" type="button" id="' + this.idBtnAdd + '">Nuovo</button>';
         }
         if (this.isEditBtnVisible) {
            htmlCodeTemplate += '<button disabled class="btn btn-primary mr-2" type="button" id="' + this.idBtnEdit + '">Modifica</button>';
         }
         if (this.isDeleteBtnVisible) {
            htmlCodeTemplate += '<button disabled class="btn btn-primary" type="button" id="' + this.idBtnDel + '">Elimina</button>';
         }
         htmlCodeTemplate += '<div class="pt-2 text-danger" id="' + this.idRootAddedMsg + '">Salva i dati, per aggiungere nodi al nodo radice</div>';

         htmlCodeTemplate += '<div class="pt-3" id="' + idElTree + '"></div>';
         // appendo al controllo padre
         var $iconAdd = $('<i class="mr-2 fa fa-plus-square"></i>');
         var $iconEdit = $('<i class="mr-2 fa fa-edit"></i>');
         var $iconDel = $('<i class="mr-2 fa fa-trash"></i>');
         $(this.el).append(htmlCodeTemplate);
         $('#' + this.idBtnAdd).prepend($iconAdd);
         $('#' + this.idBtnEdit).prepend($iconEdit);
         $('#' + this.idBtnDel).prepend($iconDel);

         // aggiungo eventi;
         if (this.isInsertBtnVisible) {
            $('#' + this.idBtnAdd).on("click", _.partial(this.insertClick, this));
         }
         if (this.isEditBtnVisible) {
            $('#' + this.idBtnEdit).on("click", _.partial(this.editClick, this));
         }
         if (this.isDeleteBtnVisible) {
            $('#' + this.idBtnDel).on("click", _.partial(this.deleteClick, this));
         }
      },

      insertClick: function (that) {
         var objDefaults = {};
         // default sul parent id. il padre sarà quello selezionato
         objDefaults[that.parIdColumnName] = that.currentRow[that.idColumnName];
         that.treeTable.defaults(objDefaults);
         var def = Deferred("treecontrol-insertClick");
         that.metaPage.insertClick(that.metaPage, that).then(function () {
            that.enableEditButtons();
            def.resolve();
         });
         return def.promise();
      },

      editClick: function (that) {
         var def = Deferred("treecontrol-editClick");
         that.metaPage.editClick(that.metaPage, that).then(function () {
            that.enableEditButtons();
            def.resolve();
         });
         return def.promise();
      },

      deleteClick: function (that) {
         return that.metaPage.deleteClick(that.metaPage, that)
      },

      // QUI INZIANO METODI DI INTERFACCIA Del CUSTOM CONTROL

      /**
       * @method fillControl
       * @public
       * @description ASYNC
       * Fills the control. First to fill it resets the events rect
       */
      fillControl: function (el) {
         var def = Deferred("treecontrol-fillControl");
         return def.from(this.fillNodes());
      },

      /**
       * @method fillNodes
       * @private
       * @description SYNC
       * Fills the treeview with the nodes taken from all tree_table rows
       * Selects no node.
       * @returns {Deferred}
       */
      fillNodes: function () {
         var def = Deferred('fillNodes');
         var self = this;

         // mi assicuro che il jstree è caricato, così posso aggiungere i nodi.
         // Altrimenti succede che aggiunge solamente l'ultimo nodo.
         var res = this.initializeJsTree()
            .then(function () {
               // faccio describe column e vedo le colonne visibili, da passare quindi al dispatcher per la visurlizzazione dei nodi
               return self.defDescribedColumn
                  .then(function () {
                     if (!self.nodeDispatcher) {
                        var columns = _.chain(_.sortBy(self.treeTable.columns, 'listColPos'))
                           .filter(function (c) {
                              return (c.listColPos && c.listColPos !== -1);
                           })
                           .map(function (c) {
                              return c.name;
                           })
                            .value();
                        self.nodeDispatcher = new appMeta.SimpleUnLeveled_TreeNode_Dispatcher(columns);
                     }

                     var roots = self.treeTable.select(self.rootCondition);
                     var allCreateNodeDeferred = [];
                     // le createnode sono asyncrone dentro un ciclo, metto in array e risolvo in when()
                     _.forEach(roots, function (rootRow) {
                        allCreateNodeDeferred.push(self.createNewNode(null, rootRow));
                     });
                     // risolvo i deferred
                     return $.when.apply($, allCreateNodeDeferred)
                        .then(function () {

                           // ogni def risolto lancia un altro def, che quinid appoggio in un array che a sua volta risolverò nela when
                           var allfillChildsNodeDeferred = [];

                           _.forEach(arguments, function (newNode) {
                              // se passo null come 1o prm aggiunge in testa all'albero. oppure potrei passare "#"
                              self.addNode(null, newNode);
                              allfillChildsNodeDeferred.push(self.fillChildsNode(newNode, newNode.dataRow));
                           });

                           return $.when.apply($, allfillChildsNodeDeferred)
                              .then(function () {
                                 self.tree.jstree("redraw", true);
                                 def.resolve();
                              });
                        });
                  });
            });

         return def.from(res).promise();
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
      addNode: function (parentNode, node) {

         var retNode = null;
         var self = this;
         // evita l'aggiunta di nodi già aggiunti
         _.forEach(this.treeNodes, function (currNode) {
            if (self.compareNodes(node, currNode)) {
               node.setJsTreeNodeId(currNode.id);
               retNode = currNode; // per robustezza atatcco lo stesso id
               return false; // esco dal ciclo perchè l'ho trovato e lo assegno alla var locale che poi tornerò
            }
         });

         // se già esiste lo ritorno senza aggiungere
         if (retNode) {
            retNode.dataRow = node.dataRow;
            this.assignColorNode(retNode);
            return retNode;
         }

         if (node.dataRow.getRow().state === dataRowState.deleted) {
            return;
         }

         // la create_node autogenera un id, lo lego al nodo attuale creato, così poi potrò aggiungere dei figli,
         // in quanto ora ha un suo id

         // recupero l'autogenerato id e lo lego al nodo jstree
         this.assignColorNode(node);
         // espando radice all'apertura. se è nello stato aggiunto, metto messaggio
         if (this.isRootNodeRow(node.dataRow)) {
            node.state.opened = true;
            if (node.dataRow.getRow().state !== dataRowState.added) {
               $('#' + this.idRootAddedMsg).css('display', 'none');
            }
         }
         var retNodeId = this.tree.jstree(jsTreeMethod.CREATE_NODE, parentNode, node, 'last', false, false);
         // il node non viene modificato, quindi configuro l'id autogenerato tramite il emtodo setJsTreeNodeId() della classe TreeNode
         // N.B id è importante per la lib jstree per aggiungere i nodi al posto giusto
         node.setJsTreeNodeId(retNodeId);



         // aggiungo alla collection dei nodes
         this.treeNodes.push(node);
      },

      /**
       * assign the color to the node based on its state
       * @param {TreeNodeUnLeveled} node
       */
      assignColorNode: function (node) {
         switch (node.dataRow.getRow().state) {
            case dataRowState.added: node.li_attr = { "class": "addNode" }; break;
            case dataRowState.modified: node.li_attr = { "class": "modNode" }; break;
            case dataRowState.deleted: node.li_attr = { "class": "delNode" }; break;
         }

      },

      /**
       * @method compareNodes
       * @private
       * @description SYNC
       * Return true if the "n1" node is the same of "n2"
       * @param {TreeNode} n1
       * @param {TreeNode} n2
       */
      compareNodes: function (n1, n2) {
         // return (n1.text === n2.text);
         if (this.compareNodeByRow(n1.dataRow, n2.dataRow)) {
            if (n2.text !== n1.text) {
               n2.text = n1.text; // aggiorno il testo eventualmente
               this.tree.jstree(jsTreeMethod.RENAME_NODE, n2, n1.text);
            }
            return true
         }
         return false;
      },

      /**
       *
       * @param {ObjectRow} r1
       * @param {ObjectRow} r2
       * @returns {boolean}
       */
      compareNodeByRow: function (r1, r2) {
         return getDataUtils.isSameRow(this.treeTable, r1, r2);
      },

      /**
       * @method fillChildsNode
       * @private
       * @description ASYNC
       * @param {jstree node} parentNode
       * @param {ObjectRow} parentRow
       * @returns {Deferred}
       */
      fillChildsNode: function (parentNode, parentRow) {

         var def = Deferred("fillChildsNode");
         // reset del booleano che indica che devo esplorare il nodo
         parentNode.toExplore = false;

         var self = this;
         var childList = parentRow.getRow().getChildRows(this.autoChildRelation.name);

         // le createnode sono asyncrone dentro un ciclo, metto in array e risolvo in when()
         var allCreateNodeDeferred = [];
         _.forEach(childList, function (childRow) {
            if (childRow === parentRow) return true; // promssima iterazione
            allCreateNodeDeferred.push(self.createNewNode(parentRow, childRow));
         });

         var res = $.when.apply($, allCreateNodeDeferred)
            .then(function () {
               var allfillChildsNodeDeferred = [];
               _.forEach(arguments, function (newNode) {
                  self.addNode(parentNode, newNode);
                  allfillChildsNodeDeferred.push(self.fillChildsNode(newNode, newNode.dataRow));
               });

               return $.when.apply($, allfillChildsNodeDeferred)
                  .then(function (defObj) {

                     // se non ho figli devo esplorare. recupero i children dall'oggetto node intenro al jstree
                     var currJsTreeNode = self.tree.jstree("get_node", parentNode);
                     if (currJsTreeNode) {
                        if (currJsTreeNode.children.length === 0) {
                           parentNode.toExplore = true;
                        }
                     }
                     return def.resolve();
                  });
            });

         return def.from(res).promise();

      },

      /**
       * @method getControl
       * @public
       * @description ASYNC
       */
      getControl: function () {
         // TODO. LA GET NON DOVREBBE ESSER NECESSARIA, IL BIND VIENE FATTO SULLA UPLOAD STESSA, QUANDO ESEGUO L'ASSEGNAZIONE
         // DEL VALORE DELL'ID ATTACH TORNATO DAL SERVER
      },

      /**
       * @method clearControl
       * @public
       * @description ASYNC
       * Executes a clear of the control. It removes rows and set the index to -1 value.
       * @returns {Deferred}
       */
      clearControl: function () {
         var def = Deferred("upload-clearControl");
         return def.resolve();
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
         var def = Deferred("preFill-TreeControl");
         return def.resolve();
      },

      /**
       * @method getCurrentRow
       * @private
       * @description SYNC
       * @returns {{table: *, row: *}}
       */
      getCurrentRow: function () {
         return { table: this.treeTable, row: this.currentRow };
      },

      /**
       * @method addInternalEvents
       * @private
       * @description SYNC
       */
      addInternalEvents: function () {
         var self = this;

         // eseguito al click sul nodo da parte dell'utnete
         this.tree.on(jsTreeEvent.ACTIVATE_NODE, function (e, data) {

            if (self.timeoutId) {
               clearTimeout(self.timeoutId);
               self.timeoutId = null;
            }

            self.timeoutId = setTimeout(function () {
               self.selectNodeEv(data.node, true);
            }, appMeta.dbClickTimeout);


         });

         $(this.elTree).bind("dblclick.jstree", function (event) {

            if (self.timeoutId) {
               clearTimeout(self.timeoutId);
               self.timeoutId = null;
            }

            var tree = $(this).jstree();
            var node = tree.get_node(event.target);
            self.dblclickEv(node, true)

         });

         // manda a capo il testo
         $(this.elTree).bind('hover_node.jstree', function () {
            var bar = $(this).find('.jstree-wholerow-hovered');
            bar.css('height',
               bar.parent().children('a.jstree-anchor').height() + 'px');
         });
      },

      dblclickEv: function (node, bool) {
         //
      },

      /**
       * @method InitializeJsTree
       * @private
       * @description ASYNC
       * Loading of jstree is not syncronous, so the it launches the first init and returns a deferred.
       * It sets to true the global class var "inited" to store that loading is done
       */
      initializeJsTree: function () {
         var def = Deferred("firstLoad");
         var self = this;
         if (self.inited) return def.resolve(true);

         // passo a jsTree un obj di config. nella 'loaded.jstree' risolvo ildeferred
         this.tree = $(this.elTree)
            .on(jsTreeEvent.LOADED, function (e, data) {
               self.inited = true;
               // aggiungo eventi al tree
               self.addInternalEvents();
               // risolvo il deferred
               return def.resolve(true);
            })
            .jstree({
               "core": { // core options go
                  'data': [
                  ],
                  "check_callback": true, // permit to listen the event callbacks
                  "multiple": false, // no multiselection
                  "themes": {
                     "dots": false, // no connecting dots between dots
                     "responsive": true
                  }
               },
               "plugins": ["state", "types"] // activate the state plugin on this instance
            });

         return def.promise()
      },

      /**
       * @method createNewNode
       * @private
       * @description ASYNC
       * @param {ObjectRow} parentRow
       * @param {ObjectRow} childRow
       * Creates a new TreeNode and returns a js object the representation of the node in jstree
       * @returns {Deferred (TreeNode)}
       */
      createNewNode: function (parentRow, childRow) {
         return this.nodeDispatcher.getNode(parentRow, childRow);
      },

      /**
       *
       * @param {jstree node} node
       */
      selectNodeEv: function (node, propagate) {
         var self = this;
         var def = Deferred('selectNodeEv');
         if (!node) return def.resolve();
         if (!node.original) return def.resolve();
         // permette di espandere/collassare sul click
         self.openNode(node);
         if (self.metaPage && propagate) {
            return self.metaPage.rowSelect(self.elTree, self.treeTable, node.original.dataRow);
         }
         return def.resolve();
      },

      /**
       * @method selectedRow
       * @public
       * @description SYNC
       * Gets the row linked to currently selected TreeNode
       * @returns {jsTreeNode|null}
       */
      selectedNode: function () {
         var selectedNodes = this.tree.jstree(jsTreeMethod.GET_SELECTED, true); // torna un array. dovrebbe essere sempre di lunghezza 1
         if (selectedNodes.length > 0) {
            var selNode = selectedNodes[selectedNodes.length - 1];
            return selNode;
         }
         return null;
      },


      /**
       *
       * @param {jsTreeNode} node
       */
      openNode: function (node) {
         this.enableEditButtons();
         this.tree.jstree(jsTreeMethod.OPEN_NODE, node);
      },

      enableEditButtons: function () {
         var disabled = false;
         var selNode = this.selectedNode();
         var roots = this.treeTable.select(this.rootCondition);
         // se è nodo radice disabilito editing. metto solo add
         if (selNode &&
            roots.length &&
            this.isRootNodeRow(selNode.original.dataRow)) {
            disabled = true;
         }
         if (selNode) {
            this.currentRow = selNode.original.dataRow;
         }
         // sugli added non permetto di creare nodif figli
         $('#' + this.idBtnAdd).prop("disabled", false);
         if (selNode &&
            roots.length &&
            selNode.original.dataRow.getRow().state === dataRowState.added) {
            $('#' + this.idBtnAdd).prop("disabled", true);
         }
         $('#' + this.idBtnEdit).prop("disabled", disabled);
         $('#' + this.idBtnDel).prop("disabled", false);
         //if (selNode && selNode.children && !selNode.children.length) {
         //   $('#' + this.idBtnDel).prop("disabled", disabled);
         //}
      },

      isRootNodeRow: function (row) {
         var roots = this.treeTable.select(this.rootCondition);
         // se è nodo radice disabilito editing. metto solo add
         if (roots.length &&
            row === roots[0]) {
            return true;
         }
         return false;
      }

   };

   window.appMeta.CustomControl("treecontrol", TreeControl);

}());
