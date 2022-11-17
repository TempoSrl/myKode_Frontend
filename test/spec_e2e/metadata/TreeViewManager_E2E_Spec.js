"use strict";

describe("TreeViewManager E2E",
    
    function () {

        var getData  =  appMeta.getData;
        var q = window.jsDataQuery;

        beforeEach(function () {
            appMeta.basePath = "base/";
        });

        afterEach(function () {
        });

        describe("methods work",

            function () {

                it("start() method retrieve tree row structure of finview",function (done) {

                    var mainwin = '<head></head>' +
                        '<div id="metaroot">' +
                        '<div id="tree">' +
                        "</div></div>";
                    $("html").html(mainwin);
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                    $("body").append('<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/jstree/3.3.5/themes/default/style.min.css" />');

                    var ds = new jsDataSet.DataSet("temp");
                    ds.newTable("fin");
                    ds.newRelation("r1", "fin", ["idfin"], "fin", ["paridfin"]);

                    // configura var ausilairie, lo state serve in helpForm, il qaule è passato nel costruttore di treeViewManger
                    var s = new appMeta.MetaPageState();
                    s.DS = ds;
                    // il meta è invocato per chiamare la describeTree
                    var m = new appMeta.MetaData('fin');
                    s.meta  = m;
                    appMeta.addMeta('fin', m );
                    var helpForm = new appMeta.HelpForm(s, "fin", "#metaroot");

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

                                var text = childRow["idfin"] + " - " + childRow["paridfin"]+ " - " + childRow["title"];
                                // crea l'oogetto che rappresenta il nodo nel jstree
                                node.text = text;

                                var def = appMeta.Deferred("nodeDispatcherDerived1-getNode");

                                return def.resolve(node);
                            },

                            superClass: appMeta.TreeNode_Dispatcher
                        });
                    var nodeDispatcher = new nodeDispatcherDerived();

                    // ******************** fine mock node dispatcher    ****************************************

                    // override della funz describeTree, mi faccio tornare quello che serve, cioè il filtro root e il dispatcher
                    s.meta.describeTree = function () {
                      var d = $.Deferred();

                      return  d.resolve({nodeDispatcher:nodeDispatcher,  rootCondition:q.gt("idfin",0)});
                    };

                   //var filter = q.or(q.eq("idfin",12), q.eq("idfin",13), q.eq("idfin",18), q.eq("idfin",450),q.eq("idfin",9), q.eq("idfin",50), q.eq("idfin",1),  q.eq("idfin",2), q.eq("idfin",309));
                    var filter = q.or(q.eq("idfin",1),  q.eq("idfin",2), q.eq("idfin",309));

                   getData.runSelect("fin", "ayear, codefin, title, idfin, paridfin, nlevel", filter, 100)
                    .then(function (dtTree) {

                        // assegno dataset, perchè il test non mi torna un dataset, ma parto da una query.
                        // ma poi ovviamente il codice utilizza concetti tipo le relazioni che sono sull'oggetto dataset
                        ds.tables["fin"] = dtTree;
                        dtTree.dataset  = ds;

                        expect(dtTree.name).toBe("fin"); // nome tabella

                        // passo come filtro tutti gli id >0 cioè prendo tutti
                        var tvm = new appMeta.TreeViewManager($("#tree"), helpForm, dtTree);

                        // i non roots saranno 12, 13, 18, 450
                        var rootFilter =  q.or(q.eq("idfin",1),  q.eq("idfin",2), q.eq("idfin",309));
                        tvm.start(rootFilter, false )
                            .then(function () {
                                var rootNode = $("#tree").jstree("get_node" , "#");
                                expect(rootNode.children.length).toBeGreaterThan(0);
                                done();
                            })
                    })
                }, 120000);

                it("startWithField() method retrieve tree row structure of finview and select node",function (done) {

                    var mainwin = '<head></head>' +
                        '<div id="metaroot">' +
                        '<div id="tree">' +
                        "</div></div>";
                    $("html").html(mainwin);
                    $("body").append('<link rel="stylesheet" href="/base/test/app/styles/app.css" />');
                    $("body").append('<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/jstree/3.3.5/themes/default/style.min.css" />');

                    var ds = new jsDataSet.DataSet("temp");
                    ds.newTable("fin");
                    ds.newRelation("r1", "fin", ["idfin"], "fin", ["paridfin"]);

                    // configura var ausilairie, lo state serve in helpForm, il qaule è passato nel costruttore di treeViewManger
                    var s = new appMeta.MetaPageState();
                    s.DS = ds;
                    // il meta è invocato per chiamare la describeTree
                    var m = new appMeta.MetaData('fin');
                    s.meta  = m;
                    appMeta.addMeta('fin', m );
                    var helpForm = new appMeta.HelpForm(s, "fin", "#metaroot");

                    var metapage = new appMeta.MetaPage('fin', 'default', false);
                    metapage.state = s;
                    metapage.helpForm  = helpForm;
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

                                var text = childRow["idfin"] + " - " + childRow["paridfin"]+ " - " + childRow["title"];
                                // crea l'oogetto che rappresenta il nodo nel jstree
                                node.text = text;

                                var def = appMeta.Deferred("nodeDispatcherDerived2-getNode");

                                return def.resolve(node);
                            },

                            superClass: appMeta.TreeNode_Dispatcher
                        });
                    var nodeDispatcher = new nodeDispatcherDerived();

                    // ******************** fine mock node dispatcher    ****************************************

                    // override della funz describeTree, mi faccio tornare quello che serve, cioè il filtro root e il dispatcher
                    s.meta.describeTree = function () {
                        var d = $.Deferred();

                        return  d.resolve({nodeDispatcher:nodeDispatcher,  rootCondition:q.gt("idfin",0)});
                    };

                    //var filter = q.or(q.eq("idfin",12), q.eq("idfin",13), q.eq("idfin",18), q.eq("idfin",450),q.eq("idfin",9), q.eq("idfin",50), q.eq("idfin",1),  q.eq("idfin",2), q.eq("idfin",309));
                    var filter = q.or(q.eq("idfin",1),  q.eq("idfin",2), q.eq("idfin",309));

                    getData.runSelect("fin", "ayear, codefin, title, idfin, paridfin, nlevel", filter, 100)
                        .then(function (dtTree) {

                            // assegno dataset, perchè il test non mi torna un dataset, ma parto da una query.
                            // ma poi ovviamente il codice utilizza concetti tipo le relazioni che sono sull'oggetto dataset
                            ds.tables["fin"] = dtTree;
                            dtTree.dataset  = ds;

                            expect(dtTree.name).toBe("fin"); // nome tabella

                            // passo come filtro tutti gli id >0 cioè prendo tutti
                            var tvm = new appMeta.TreeViewManager($("#tree"), helpForm, dtTree);
                            tvm.addEvents($("#tree"),metapage );

                            // i non roots saranno 12, 13, 18, 450
                            var rootFilter =  q.or(q.eq("idfin",1),  q.eq("idfin",2), q.eq("idfin",309));
                            tvm.startWithField(q.eq("idfin",2), "import", "lu")
                                .then(function () {
                                    var rootNode = $("#tree").jstree("get_node" , "#");
                                    expect(rootNode.children.length).toBeGreaterThan(0);
                                    var selRow  = tvm.selectedRow();
                                    expect(selRow["idfin"]).toBe(2);
                                    done();
                                })
                        })
                }, 120000);


            });
    });
