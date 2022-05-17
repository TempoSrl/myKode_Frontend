"use strict";

describe("TreeViewManager",
    function () {
        var q = window.jsDataQuery;
        var stabilize = appMeta.stabilize;
        beforeEach(function () {
            appMeta.basePath = "base/";
            
            var mainwin = '<head></head><div id="tree" data-tag="table1.default">' +
                "</div>";
            $("html").html(mainwin);
            $("head").append('<script defer src="/base/app/styles/fontawesome/fontawesome-all.js"></script>');
            $("body").append('<link rel="stylesheet" href="/base/app/styles/app.css" />');
            // prox riga serve epr vedere la giusta grafica del tree
            // $("body").append('<link rel="stylesheet" href="/base/bower_components/jstree/dist/themes/default/style.css" />');
            $("body").append('<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/jstree/3.3.5/themes/default/style.min.css" />');
            
        });

        afterEach(function () {

        });

        describe("methods work",

            function () {

                it("treeviewManagerLeveled derivad from treeViewMaanger", function () {

                    // ********************** creo dt di prova ************************************************
                    var ds = new jsDataSet.DataSet("temp");
                    var t = ds.newTable("table1");
                    // setto le prop delle colonne per t1
                    t.setDataColumn("id_table", "Decimal");
                    t.setDataColumn("parid_table", "Decimal");
                    t.setDataColumn("campo1", "String");
                    t.setDataColumn("campo2", "String");
                    
                    // aggiungo  righe alla t
                    var r1 = { "id_table": 1, "parid_table":1, "campo1": "f1", "campo2": "c1" };
                    var r2 = { "id_table": 2, "parid_table":1, "campo1": "f2", "campo2": "c2" };
                    var r3 = { "id_table": 3, "parid_table":2, "campo1": "f3", "campo2": "c3" };
                    var r4 = { "id_table": 4, "parid_table":2, "campo1": "f4", "campo2": "c4" };
                    var r5 = { "id_table": 5, "parid_table":2, "campo1": "f5", "campo2": "c5" };
                    var r6 = { "id_table": 6, "parid_table":2, "campo1": "f6", "campo2": "c6" };
                    var r7 = { "id_table": 7, "parid_table":3, "campo1": "f7", "campo2": "c7" };
                    var r8 = { "id_table": 8, "parid_table":3, "campo1": "f8", "campo2": "c8" };
                    var r9 = { "id_table": 9, "parid_table":3, "campo1": "f9", "campo2": "c9" };
                    var r10 = { "id_table": 10, "parid_table":3, "campo1": "f10", "campo2": "c10" };
                    var r11 = { "id_table": 11, "parid_table":3, "campo1": "f11", "campo2": "c11" };
                    var r12 = { "id_table": 1, "parid_table":12, "campo1": "f12", "campo2": "c12" };
                    var r13 = { "id_table": 2, "parid_table":13, "campo1": "f13", "campo2": "c13" };

                    // aggiungo le righe con il ciclo for. utilizzando eval()
                    for(var i = 1; i<=13;i++ ){
                        t.add(eval('r'+i));
                    }

                    t.key("id_table");
                    t.tableForReading("table1");

                    // aggiungo relazione. table 2 è collegata a table 1 tramite la colonna c_name
                    ds.newRelation("r1", "table1", ["id_table"], "table1", ["parid_table"]);
                    // ************* fine config dt treeTable di test ***************************************

                    var state = new appMeta.MetaPageState();
                    state.DS = ds;
                    // il meta è invocato per chiamare la describeTree
                    var m = new appMeta.MetaData('table1');
                    state.meta  = m;
                    appMeta.addMeta('table1', m );
                    var helpForm = new appMeta.HelpForm(state, "table1", "#rootelement");

                    // override della funz describeTree, mi faccio tornare quello che serve, cioè il filtro root e il dispatcher
                    state.meta.describeTree = function () {
                        var d = $.Deferred();
                        return  d.resolve();
                    };

                    // instanzio il manger
                    var tvmDerived = new appMeta.TreeViewManager($("#tree"), helpForm ,t, t);
                    expect(tvmDerived).toBeDefined();
                       
                });

                it("treeviewManager initializeJsTree() + addNode() twice: tree ha 2 nodes",function (done) {
                    var text1 = "root1";
                    var text2 = "root2";
                    // instanzio il manger
                    // override della funz describeTree, mi faccio tornare quello che serve, cioè il filtro root e il dispatcher
                    var ds = new jsDataSet.DataSet("temp");
                    var t = ds.newTable("table1");
                    t.setDataColumn("id_table", "Decimal");
                    t.setDataColumn("parid_table", "Decimal");
                    var r1 = { "id_table": 1, "parid_table":1 };
                    var r2 = { "id_table": 2, "parid_table":1 };
                    t.add(r1);
                    t.add(r2);
                    t.key("id_table");
                    t.tableForReading("table1");
                    var state = new appMeta.MetaPageState();
                    state.DS = ds;
                    // il meta è invocato per chiamare la describeTree
                    var m = new appMeta.MetaData('table1');
                    state.meta  = m;
                    appMeta.addMeta('table1', m );
                    var helpForm = new appMeta.HelpForm(state, "table1", "#rootelement");
                    state.meta.describeTree = function () {
                        var d = $.Deferred();
                        return  d.resolve();
                    };
                    var tvm = new appMeta.TreeViewManager($("#tree"), helpForm, t, t);
                    var n1  = new appMeta.TreeNode(r1);
                    var n2  = new appMeta.TreeNode(r2);
                    n1.text = text1;
                    n2.text = text2;

                    tvm.initializeJsTree()
                        .then(function () {
                            tvm.addNode(null, n1);
                            tvm.addNode(null, n2);

                            // mi aspetto siano aggiunti 2 nodi
                            expect($("li:first > a").text()).toBe(text1);
                            expect($("li:last > a").text()).toBe(text2);
                            done();
                    });

                });

                it("treeviewManager initializeJsTree() + addNode() parent + child",function (done) {

                    var text1 = "root1";
                    var text2 = "root2";
                    // instanzio il manger
                    // override della funz describeTree, mi faccio tornare quello che serve, cioè il filtro root e il dispatcher
                    var ds = new jsDataSet.DataSet("temp");
                    var t = ds.newTable("table1");
                    t.setDataColumn("id_table", "Decimal");
                    t.setDataColumn("parid_table", "Decimal");
                    var r1 = { "id_table": 1, "parid_table":1 };
                    var r2 = { "id_table": 2, "parid_table":1 };
                    t.add(r1);
                    t.add(r2);
                    t.key("id_table");
                    t.tableForReading("table1");
                    var state = new appMeta.MetaPageState();
                    state.DS = ds;
                    // il meta è invocato per chiamare la describeTree
                    var m = new appMeta.MetaData('table1');
                    state.meta  = m;
                    appMeta.addMeta('table1', m );
                    var helpForm = new appMeta.HelpForm(state, "table1", "#rootelement");
                    state.meta.describeTree = function () {
                        var d = $.Deferred();
                        return  d.resolve();
                    };
                    var tvm = new appMeta.TreeViewManager($("#tree"), helpForm, t, q.like("campo1", "%f"));
                    var n1  = new appMeta.TreeNode(r1);
                    var n2  = new appMeta.TreeNode(r2);
                    n1.text = text1;
                    n2.text = text2;

                    tvm.initializeJsTree()
                        .then(function () {
                            tvm.addNode(null, n1);
                            tvm.addNode(n1, n2);

                            // mi aspetto siano aggiunti 2 nodi
                            expect($("li > a").text()).toBe(text1); // root
                            var childIDdNode1 = $("#tree").jstree( "get_node", $("li:nth-child(1) > a").prop("id")).children[0];
                            var childNode = $("#tree").jstree( "get_node", childIDdNode1);
                            expect(childNode.text).toBe(text2); // child

                            done();
                        });
                    // root1---
                    //      |--- root2
                    

                });

                xit("treeviewManager fillNodes() 1. builds a tree view -> collapsed and with children in the structure" +
                    " 2. select a node given a datarow",
                    function (done) {

                        // prima mdlw deve fare un describeTree()

                        // ********************** creo dt di prova ************************************************
                        var ds = new jsDataSet.DataSet("temp");
                        var t = ds.newTable("table1");
                        // setto le prop delle colonne per t1
                        t.setDataColumn("id_table", "Decimal");
                        t.setDataColumn("parid_table", "Decimal");
                        t.setDataColumn("campo1", "String");
                        t.setDataColumn("campo2", "String");

                        /*
                         1
                         |--- c1
                         --- c2

                         2
                         |--- c3
                         |--- c4
                          --- c5
                          --- c6


                         */
                        // aggiungo  righe alla t
                        var r1 = { "id_table": 1, "parid_table":1, "campo1": "f1", "campo2": "c1" };
                        var r2 = { "id_table": 2, "parid_table":1, "campo1": "f2", "campo2": "c2" };
                        var r3 = { "id_table": 3, "parid_table":2, "campo1": "f3", "campo2": "c3" };
                        var r4 = { "id_table": 4, "parid_table":2, "campo1": "f4", "campo2": "c4" };
                        var r5 = { "id_table": 5, "parid_table":2, "campo1": "f5", "campo2": "c5" };
                        var r6 = { "id_table": 6, "parid_table":2, "campo1": "f6", "campo2": "c6" };
                        var r7 = { "id_table": 7, "parid_table":3, "campo1": "f7", "campo2": "c7" };
                        var r8 = { "id_table": 8, "parid_table":3, "campo1": "f8", "campo2": "c8" };
                        var r9 = { "id_table": 9, "parid_table":3, "campo1": "f9", "campo2": "c9" };
                        var r10 = { "id_table": 10, "parid_table":3, "campo1": "f10", "campo2": "c10" };
                        var r11 = { "id_table": 11, "parid_table":3, "campo1": "f11", "campo2": "c11" };
                        var r12 = { "id_table": 1, "parid_table":12, "campo1": "f12", "campo2": "c12" };
                        var r13 = { "id_table": 2, "parid_table":13, "campo1": "f13", "campo2": "c13" };

                        // aggiungo le righe con il ciclo for. utilizzando eval()
                        for(var i = 1; i<=13;i++ ){
                            t.add(eval('r'+i));
                        }

                        t.key("id_table");
                        t.tableForReading("table1");
                        // aggiungo relazione. table 2 è collegata a table 1 tramite la colonna c_name
                        ds.newRelation("r1", "table1", ["id_table"], "table1", ["parid_table"]);
                        // ************* fine config dt treeTable di test ***************************************


                        var state = new appMeta.MetaPageState();
                        state.DS = ds;
                        // il meta è invocato per chiamare la describeTree
                        var m = new appMeta.MetaData('table1');
                        state.meta  = m;
                        appMeta.addMeta('table1', m );
                        var helpForm = new appMeta.HelpForm(state, "table1", "#rootelement");
                        

                        // *********** node dispatcher mock ******************************************************
                        function nodeDispatcherDerived() {
                            this.name = 'nodeDispatcherDerived';
                        }

                        nodeDispatcherDerived.prototype = _.extend(
                            new appMeta.TreeNode_Dispatcher(),
                            {
                                constructor: nodeDispatcherDerived,

                                /**
                                 *
                                 * @param parentRow
                                 * @param childRow
                                 * @returns {*|TreeNode}
                                 */
                                getNode:function (parentRow, childRow) {

                                    var node = new appMeta.TreeNode(childRow);

                                    var text = childRow["id_table"] + " - " + childRow["parid_table"]+ " - " + childRow["campo1"] + " - " + childRow["campo2"];
                                    // crea l'oogetto che rappresenta il nodo nel jstree
                                    node.text = text;

                                    return node;
                                },

                                superClass: appMeta.TreeNode_Dispatcher
                            });
                        var nodeDispatcher = new nodeDispatcherDerived();
                        state.meta.describeTree = function () {
                            var d = $.Deferred();
                            return  d.resolve({nodeDispatcher:nodeDispatcher,  rootCondition:q.like("campo1", "%f")});
                        };
                        // ******************** fine mock node dispatcher    ****************************************

                        // instanzio il manger
                        var tvm = new appMeta.TreeViewManager($("#tree"),helpForm , t, t);

                        // eseguo la fill
                        tvm.fillNodes()
                            .then(function () {

                                // verifico che siano non esapnsi. cioè mi aspetto solo le root nell'ordine giusto
                                expect($("li:first > a").text()).toBe("1 - 12 - f12 - c12");
                                expect($("li:nth-child(2) > a").text()).toBe("2 - 13 - f13 - c13");
                                expect($("li:nth-child(3) > a").text()).toBe("3 - 2 - f3 - c3");

                                // VERIFICO presenza dei figli, anche se non si vedono su html perchè da espandere
                                // recupero dato l'id del 1o nodo i figli
                                var childIDdNode1 = $("#tree").jstree( "get_node",$("li:nth-child(1) > a").prop("id")).children;
                                // recupero il 1o nodo associato al child di prima.
                                var childNode = $("#tree").jstree( "get_node", childIDdNode1[0]);
                                expect(childIDdNode1.length).toBe(1);
                                expect(childNode.children.length).toBe(4); // il primo nodo figlio ha a sua volta 4 child, cioè da r2-r6


                                // -> seleziono nodo
                                tvm.selectNodeByRow(r6)
                                    .then(function () {
                                    // recupero oggetto riga del nodo selezionato
                                    var selectedRow = tvm.selectedRow();
                                    //  mi aspetto siua proprio quella che avevo selzionato
                                    expect(selectedRow).toBe(r6);
                                    done();
                                })
                               
                            });
                });
            });
    });
