/**
 * @module GetData
 * @description
 * Access data through server services
 */
(function () {

	var Deferred = appMeta.Deferred;
	var getDataUtils = appMeta.getDataUtils;
	var q = window.jsDataQuery;
	var logger = appMeta.logger;
	var logType = appMeta.logTypeEnum;
	var methodEnum = appMeta.routing.methodEnum;
	var model = appMeta.metaModel;
	var utils = appMeta.utils;

    /**
     * @constructor GetData
     * @description
     */
	function GetData() {
		"use strict";
		// cache dei DataTable di cui è stata già recuperata la conf. lato server
		this.cachedDescribedColumnTable = {};
		this.cachedDescribedTree = {};
		this.cachedSyncGetResults = {};
	}

	GetData.prototype = {
		constructor: GetData,

        /**
         * @method cachedSyncGetHtml
         * @public
         * @description SYNC
         * Returns synchronously the html content of the file, passed in parameter url.
         * The results are cached on local cache.
         * @param {string} url the relative path of the html file
         * @returns {string} the html of the file in the url
         */
		cachedSyncGetHtml: function (url) {
			var htmlCached = this.cachedSyncGetResults[url];
			if (htmlCached) return htmlCached;

			var htmlCached = $.get({
				url: url,
				async: false,
				type: "GET"
			}).responseText;

			this.cachedSyncGetResults[url] = htmlCached;
			return htmlCached;
		},

        /**
         * @method readCached
         * @public
         * @description ASYNC
         * Reads all cached tables
         * @param {DataSet} d
         * @returns {Deferred}
         */
		readCached: function (d) {
			var selectList = [];
			var that = this;
			var allPromises = [];
			_.forEach(d.tables,
				function (t) {
					if (!model.cachedTable(t)) return;
					if (!model.canRead(t)) return;
					allPromises.push(that.doGetTable(t, null, true, null, selectList));
				});
			return Deferred("readCached").from(
				$.when(allPromises)
					.then(function () {
						if (selectList.length === 0) return false;
						return that.multiRunSelect(selectList)
							.then(function () {
								_.forEach(selectList,
									function (sel) {
										model.getTemporaryValues(sel.table);
									});
								return true;
							});
					}));

		},

        /**
         * @method doGetTable
         * @public
         * @description ASYNC
         * Gets a DataTable with an optional set of Select
         * @param {DataTable} t DataTable to Get from DataBase
         * @param {jsDataQuery} filter
         * @param {boolean} clear  if true table is cleared before reading
         * @param {string} top  parameter for "top" clause of select
         * @param {SelectBuilder[]} selectList
         * @returns {Deferred}
         */
		doGetTable: function (t, filter, clear, top, selectList) {
			var def = Deferred("doGetTable");
			// log per controllo se il filtro di tipo mcmp non è su colonne presenti sulla tabella.
			var columnFilterInTable = function (t, f) {
				if (!t || !f) return true;
				if (f.myName === "mcmp") return _.every(f.myArguments[0], function (c) { return !!t.columns[c] })
				return true;
			};
			if (!columnFilterInTable(t, filter)) {
				// console.warn("warning: doGetTable: Table t " + t.name + " has not some columns on filter passed", filter);
				return def.resolve(false);
			}

			if (!model.canRead(t)) return def.resolve(false);
			var that = this;
			if (clear) t.clear();

			var mergedFilter = t.staticFilter();

			if (filter && mergedFilter) {
				mergedFilter = q.and(filter, mergedFilter);
				mergedFilter.isTrue = filter.isTrue;
			} 
			else {
				mergedFilter = filter ? filter : mergedFilter;
			}

			var mySel = null;
			var doGetResult = true;

			return def.from(
				utils._if(selectList)
					._then(function () {
						mySel = {
							filter: mergedFilter,
							top: top,
							table: t
						};
						selectList.push(mySel);
						doGetResult = mySel;
						return true; //new Deferred("doGetTable").resolve().promise();
					})
					._else(function () {
						return that.runSelectIntoTable(t, mergedFilter, top);
					})
					.then(function () {
						if (mergedFilter === null || mergedFilter === undefined || mergedFilter.isTrue) {
							model.setAsRead(t); //table has been read fully
						}
						if (!selectList) model.getTemporaryValues(t);
						return doGetResult;
					})).promise();
		},

        /**
         * @method getRowsByFilter
         * @public
         * @description ASYNC
         * Returns the Rows from the DataTable "table" based on the clause "filter"
         * @param {jsDataQuery} filter
         * @param {boolean} multiCompare
         * @param {DataTable} table
         * @param {Number} top
         * @param {boolean} prepare
         * @param {SelectBuilder[]}selList
         * @returns {Deferred}
         */
		getRowsByFilter: function (filter, multiCompare, table, top, prepare, selList) {
			var def = Deferred('getRowsByFilter');
			if (!model.canRead(table)) return def.resolve().promise();

			var mergedFilter = table.staticFilter();

			if (filter !== null && filter !== undefined) {
				if (mergedFilter) {
					mergedFilter = q.and(filter, mergedFilter);
				} else {
					mergedFilter = filter;
				}
			}
			var self = this;
			var res = utils._if(selList)
				._then(function () {
					selList.push({ filter: mergedFilter, top: top, tableName: table.name, table: table })
				})
				._else(function () {
					return self.runSelectIntoTable(table, mergedFilter, top);
				})
				.then(function () {
					model.setAsRead(table);
					return true;
				});

			return def.from(res).promise();
		},

        /**
         * @method selectCount
         * @public
         * @description ASYNC
         * Gets the rows count of the "tableName" filtered on "filter"
         * @param {string} tableName
         * @param {jsDataQuery} filter
         * @returns {Deferred}
         */
		selectCount: function (tableName, filter) {
			var filterSerialized = getDataUtils.getJsonFromJsDataQuery(filter);
			var objConn = {
				method: methodEnum.selectCount,
				prm: { tableName: tableName, filter: filterSerialized }
			};
			return appMeta.connection.call(objConn);
		},

        /**
         * @method runSelect
         * @public
         * @description ASYNC
         * Returns a deferred DataTable where the rows are select on "tableName" filtered on "filter". If "columnList" is "*" it returns all columns,
         * otherwise only those specified in "columnList".
         * If top is specified it returns only a max of "top" rows, otherwise it returns all the rows.
         * @param {string} tableName
         * @param {string} columnList
         * @param {jsDataQuery} filter
         * @param {number} top
         * @returns {Deferred(DataTable)}
         */
		runSelect: function (tableName, columnList, filter, top) {
			var def = Deferred('runSelect');
			var filterSerialized = filter ? getDataUtils.getJsonFromJsDataQuery(filter) : null;
			var objConn = {
				method: methodEnum.select,
				prm: {
					tableName: tableName,
					columnList: columnList,
					top: top,
					filter: filterSerialized
				}
			};
			return appMeta.connection.call(objConn)
				.then(function (dataJson) {
					return def.resolve(getDataUtils.getJsDataTableFromJson(dataJson));
				});
		},

        /**
         * @method addRowToTable
         * @public
         * @description SYNC
         * Adds the row "r" to the DataTable "t", and returns the row added
         * @param {DataTable} t
         * @param {ObjectRow} r
         * @returns {ObjectRow}
         */
		addRowToTable: function (t, r) {
			var newRow = t.newRow();

			_.forEach(t.columns, function (c) {
				if (r.getRow().table.columns[c.name]) {
					newRow[c.name] = r[c.name];
				}
			});

			t.add(newRow);
			newRow.getRow().acceptChanges();
			return newRow;
		},

        /**
         * @method selectBuilderArraySerialize
         * @public
         * @description SYNC
         * Serializes in json format a SelectBuilder list
         * @param {SelectBuilder[]} selBuilderArray
         * @returns {string}
         */
		selectBuilderArraySerialize: function (selBuilderArray) {
			var ar = _.map(selBuilderArray,
				function (sel) {
					return {
						table: getDataUtils.getJsonFromDataTable(sel.table),
						top: sel.top,
						tableName: sel.table.name,
						filter: getDataUtils.getJsonFromJsDataQuery(sel.filter)
					};
				});
			return JSON.stringify({ arr: ar });
		},

        /**
         * @method multiRunSelect
         * @public
         * @description ASYNC
         * Executes a bunch of select, based on "selectList". Not much different from a multiple runSelectIntoTable
         * @param {SelectBuilder[]} selectList
         * @returns {Deferred}
         */
		multiRunSelectAsync: function (selectList) {

			if (selectList.length === 0) {
				logger.log(logType.WARNING, "You are calling multiRunSelect with selectList empty");
				return Deferred("multiRunSelect").resolve().promise();
			}

			var selBuilderArr = this.selectBuilderArraySerialize(selectList);
			var objConn = {
				method: methodEnum.multiRunSelect,
				prm: { selBuilderArr: selBuilderArr }
			};

			return appMeta.connection.call(objConn)
				.progress(
					function (data) {
						// data mi aspetto sia un DataTable
						var dt = getDataUtils.getJsDataTableFromJson(data);
						// recupero il dataTable da riempire dalla lista di input
						var destTableArr = _.filter(selectList, function (sel) { return sel.table.name === dt.name; });
						if (destTableArr.length > 0) {
							var destTable = destTableArr[0].table;
							var tableWasEmpty = (destTable.rows.length === 0);
							getDataUtils.mergeRowsIntoTable(destTable, dt.rows, !tableWasEmpty);
						}
					})
				.then(
					function () {
						// vanno serializzate le chiamate alle sel.onRead(), ove siano definite

						var allDeferredOnRead = utils.filterArrayOnField(selectList, 'onRead');

						return utils.thenSequence(allDeferredOnRead);
					});
		},

        /**
         * @method multiRunSelect
         * @public
         * @description ASYNC
         * Executes a bunch of select, based on "selectList". Not much different from a multiple runSelectIntoTable
         * @param {SelectBuilder[]} selectList
         * @returns {Deferred}
         */
		multiRunSelect: function (selectList) {

			if (selectList.length === 0) {
				logger.log(logType.WARNING, "You are calling multiRunSelect with selectList empty");
				return Deferred("multiRunSelect").resolve();
			}

			var selBuilderArr = this.selectBuilderArraySerialize(selectList);
			var objConn = {
				method: methodEnum.multiRunSelect,
				prm: { selBuilderArr: selBuilderArr }
			};

			return appMeta.connection.call(objConn)
				.then(
					function (data) {

						var ds = getDataUtils.getJsDataSetFromJson(data);
						// vanno serializzate le chiamate alle sel.onRead(), ove siano definite

						// loop sulle select , metto i dati del server sulle table in memoria sulla selList
						_.forEach(selectList, function (sel) {
							var destTable = sel.table;
							var inputTable = ds.tables[sel.table.name];
							if (destTable) {
								var tableWasEmpty = (destTable.rows.length === 0);
								getDataUtils.mergeRowsIntoTable(destTable, inputTable.rows, !tableWasEmpty);
							}

						});

						var allDeferredOnRead = utils.filterArrayOnField(selectList, 'onRead');

						return utils.thenSequence(allDeferredOnRead);
					});
		},

        /**
         * @method runSelectIntoTable
         * @public
         * @description ASYNC
         * Reads a set of rows in a given DataTable "t" based on clause "filter"
         * @param {DataTable} t
         * @param {jsDataQuery} filter. The filter to apply to the select
         * @param {number} top. Max num of rows to read
         * @returns {DataTable} The table with the rows read
         */
		runSelectIntoTable: function (t, filter, top) {
			var def = Deferred("runSelectIntoTable");
			var res = this.runSelect(t.tableForReading(), model.columnNameList(t), filter, top)
				.then(function (dt) {
					//merges rows into t
					getDataUtils.mergeRowsIntoTable(t, dt.rows, t.rows.length !== 0);
					return def.resolve(t);
				});
			return def.from(res).promise();
		},

        /**
         * @method createTableByName
         * @public
         * @description ASYNC
         * Creates and returns a DataTable "tableName" with the specified columns
         * @param {string} tableName
         * @param {string} columnList
         * @returns {Deferred(DataTable)}
         */
		createTableByName: function (tableName, columnList) {
			var def = Deferred('createTableByName');
			var objConn = {
				method: methodEnum.createTableByName,
				prm: { tableName: tableName, columnList: columnList }
			}

			appMeta.connection.call(objConn)
				.then(function (jsonDataTable) {
					var dt = getDataUtils.getJsDataTableFromJson(jsonDataTable);
					// check di robustezza. Se capita che il server non invia chiave, la deserialize crea comunqnue un array di 1 elemento
					// che è stringa vuota. Ed 'è errato! Deve creare un array vuoto
					if (dt.key().length === 1) {
						if (dt.key()[0] === "") {
							dt.key([]);
						}
					}
					def.resolve(dt);
				});

			return def.promise();
		},

        /**
         * @method getPagedTable
         * @public
         * @description ASYNC
         * Returns the rows paginated of the DataTable "tableName".
         * The rows are filtered based on clause "filter"
         * @param {string} tableName
         * @param {number} nPage
         * @param {number} nRowPerPage
         * @param {jsDataQuery} filter
         * @param {string} listType
         * @param {string} sortby
         * @returns {Deferred}
         */
		getPagedTable: function (tableName, nPage, nRowPerPage, filter, listType, sortby) {
			var def = Deferred('getPagedTable');
			// se non passo il filtro, quindi non ho messo filtri, passo stringa vuota
			var prmfilter = getDataUtils.getJsonFromJsDataQuery(filter);
			var objConn = {
				method: methodEnum.getPagedTable,
				prm: {
					tableName: tableName,
					nPage: nPage,
					nRowPerPage: nRowPerPage,
					filter: prmfilter,
					listType: listType,
					sortby: sortby
				}
			};

			appMeta.connection.call(objConn)
				.then(function (json) {

					var jsonDtOut = json.dt;
					var totpage = json.totpage;
					var totrows = json.totrows;

					var dt = getDataUtils.getJsDataTableFromJson(jsonDtOut);
					def.resolve(dt, totpage, totrows);
				});

			return def.promise();
		},

        /**
         * @method getDsByRowKey
         * @public
         * @description ASYNC
         * Returns the dataSet filtered by dataRow keys
         * @param {DataRow} dataRow
         * @param {DataTable} table primaryTable
         * @param {string} editType
         * @returns {Deferred}
         */
		getDsByRowKey: function (dataRow, table, editType) {

			var def = Deferred('getDsByRowKey');

			if (!model.canRead(table)) return def.resolve(null);

			// trovo il filtro date le chiavi della riga
			var filter = table.keyFilter(dataRow.current);

			// check su eventuale errore
			if (_.some(table.key(), function (cname) {
				return dataRow.current[cname] === undefined;
			})) console.log("Table view " + dataRow.table.name + " has different column key name respect to the " + table.name);

			if (filter !== null && table.staticFilter()) filter = q.and(filter, table.staticFilter());

			var objConn = {
				method: methodEnum.getDsByRowKey,
				prm: {
					tableName: table.name,
					editType: editType,
					filter: getDataUtils.getJsonFromJsDataQuery(filter)
				}
			};

			return appMeta.connection.call(objConn)
				.then(function (res) {
					// deserializzo il json in ds
					var ds = getDataUtils.getJsDataSetFromJson(res);
					// eseguo merge con ds di input
					getDataUtils.mergeDataSet(table.dataset, ds, true);

					_.forEach(table.childRelations(), function (rel) {
						var childtable = table.dataset.tables[rel.childTable];
						if ((!model.isSubEntityRelation(rel, childtable, table)) && model.allowClear(childtable)) return true;
						model.getTemporaryValues(childtable);
					});
					model.getTemporaryValues(table);

					return def.resolve(table.dataset);
				}, function (err) {
					return def.reject(err);
				}
				)

		},

        /**
         * @method getByKey
         * @public
         * @description ASYNC
         * Returns a deferred with the DataRow of the table, filtered based on the keys of the DataTable "table", where the values are those of "row"
         * @param {DataTable} table
         * @param {DataRow} row
         * @returns {Deferred(DataRow)}
         */
		getByKey: function (table, row) {
			var def = Deferred('getByKey');

			var filter = table.keyFilter(row.current);

			var res = this.runSelect(table.name, "*", filter)
				.then(function (dt) {
					if (!dt) return def.resolve(null);
					if (dt.rows.length === 0) return def.resolve(null);
					model.getTemporaryValues(table);
					return def.resolve(dt.rows[0].getRow());
				});

			return def.from(res).promise();
		},

        /**
         * DEPRECATED not more used. In th code we use table.KeyFilter(objRow)
         * Given a dataRow build a jsDataQuery starting from the keys of the table attached
         * @param {DataRow} dataRow
         * @returns {jsDataQuery)
         */
		filterFromDataRow: function (dataRow, arrKey) {

			//return q.mcmp(arrKey, dataRow.current);

			// OPPURE

			var eqArr = _.map(arrKey, function (k) {
				return q.eq(k, dataRow.current[k]);
			});

			if (eqArr.length === 1) {
				return eqArr[0];
			}

			if (eqArr.length > 1) {
				return q.and(eqArr);
			}

			return null;

		},

        /**
         * @method getDataSet
         * @public
         * @description ASYNC
         * Returns a deferred resolved with jsDataSet based on "tableName" and "editType" keys
         * @param {string} tableName
         * @param {string} editType
         * @returns {Deferred (DataSet|err})
         */
		getDataSet: function (tableName, editType) {
			var def = Deferred("getDataSet");
			var objConn = {
				method: methodEnum.getDataSet,
				prm: { tableName: tableName, editType: editType }
			}

			return appMeta.connection.call(objConn)
				.then(function (dsJson) {
					return def.resolve(getDataUtils.getJsDataSetFromJson(dsJson));
				}, function (err) {
					return def.reject(err).promise();
				}
				)
		},

        /**
         * @method prefillDataSet
         * @public
         * @description ASYNC
         * Returns a deferred resolved with the DataSet. It loads data from cached DataTable, based on "staticfilter" property
         * @param {jsDataSet} dsTarget
         * @param {string} tableName
         * @param {string} editType
         * @returns {Deferred(DataSet|err})
         */
		prefillDataSet: function (dsTarget, tableName, editType) {
			var def = Deferred("prefillDataSet");

			// costruisco coppie chiave valore, poi lo serializzo facendo un json
			var objCachedTableFilter = {};

			_.forEach(dsTarget.tables,
				function (t) {
					if (model.cachedTable(t)) {
						objCachedTableFilter[t.name] = getDataUtils.getJsonFromJsDataQuery(t.staticFilter());
					}
				});
			// passo l'oggetto al server come json, così è comodo da deserializzare lato backend
			var filter = JSON.stringify(objCachedTableFilter);

			var objConn = {
				method: methodEnum.prefillDataSet,
				prm: { tableName: tableName, editType: editType, pairTableFilter: filter }
			};
			var res = appMeta.connection.call(objConn)
				.then(function (dsJson) {
					var myDS = getDataUtils.getJsDataSetFromJson(dsJson);
					getDataUtils.mergeDataSet(dsTarget, myDS, false);
					return def.resolve(dsTarget);
				}, function (err) {
					return def.reject(err).promise();
				}
				);

			return def.from(res);
		},

        /**
         * @method fillDataSet
         * @public
         * @description ASYNC
         * Reads and fills from the server the DatSet with tableName.editType, filters it on "filter" and merges it into dsTarget.
         * Returns a deferred resolved with the DataSet merged.
         * @param {DataSet} dsTarget
         * @param {string} tableName
         * @param {string} editType
         * @param {jsDataQuery} filter
         * @returns {Deferred(DataSet|err)}
         */
		fillDataSet: function (dsTarget, tableName, editType, filter) {
			var def = Deferred("fillDataSet");
			var objConn = {
				method: methodEnum.fillDataSet,
				prm: { tableName: tableName, editType: editType, filter: getDataUtils.getJsonFromJsDataQuery(filter) }
			};
			return appMeta.connection.call(objConn)
				.then(function (dsJson) {
					var myDS = getDataUtils.getJsDataSetFromJson(dsJson);
					getDataUtils.mergeDataSet(dsTarget, myDS, false);
					return def.resolve(dsTarget);
				}, function (err) {
					return def.reject(err).promise();
				}
				)
		},

        /**
         * @method doGet
         * @public
         * @description ASYNC
         * Returns a deferred resolved with a DataSet. The dataSet is the "ds" merged with the dataset filtered on the datarow values.
         * @param {DataSet} ds
         * @param {DataRow} dataRow
         * @param {string} primaryTableName
         * @param {boolean} onlyPeripherals
         * @returns {Deferred}
         */
		doGet: function (ds, dataRow, primaryTableName, onlyPeripherals) {
			var def = Deferred("doGet");
			var filter = null;

			// invio al server non la datarow che per ora non serializzo, ma la coppia tabella + filtro che individuano appunto la riga in questione
			if (dataRow) {
				filter = dataRow.table.keyFilter(dataRow.current); // this.getWhereKeyClause(dataRow, dataRow.table, dataRow.table, false);
			}

			var objConn = {
				method: methodEnum.doGet,
				prm: {
					ds: getDataUtils.getJsonFromJsDataSet(ds, true),
					primaryTableName: primaryTableName,
					filter: getDataUtils.getJsonFromJsDataQuery(filter),
					onlyPeripherals: onlyPeripherals
				}
			};

			var res = appMeta.connection.call(objConn)
				.then(function (dsJson) {
					var myDS = getDataUtils.getJsDataSetFromJson(dsJson);
					getDataUtils.mergeDataSet(ds, myDS, true);

					if (onlyPeripherals) {
						var primaryDataTable = ds.tables[primaryTableName];
						_.forEach(primaryDataTable.childRelations(), function (rel) {
							var childtable = ds.tables[rel.childTable];
							if ((!model.isSubEntityRelation(rel, childtable, primaryDataTable)) && model.allowClear(childtable)) {
								return true;
							}
							model.getTemporaryValues(childtable);
						});
						model.getTemporaryValues(primaryDataTable);
					}

					return def.resolve(ds);
				}, function (err) {
					return def.reject(err);
				});

			return def.from(res).promise();
		},

        /**
         * @method getWhereKeyClauseByColumns
         * @public
         * @description SYNC
         * Builds a DataQuery clause where the keys are the columns in "filterColTable" and the values are those in "valueRow" DataRow
         * @param {DataRow} valueRow Row to use for getting values to compare
         * @param {DataColumn[]} valueCol Columns  of ParentRow from which values to be compare have to be taken
         * @param {DataColumn[]} filterCol Columns  of ChildRows for which the Column NAMES have to be taken
         * @param {DataTable} filterColTable table linked to the filtercolcolumns
         * @returns {jsDataQuery}
         */
		getWhereKeyClauseByColumns: function (valueRow, valueCol, filterCol, filterColTable, sql) {
			var conditions = [];
			_.forEach(valueCol, function (c, index) {
				var val = valueRow.current[c.name] ? valueRow.current[c.name] : null;
				var filterColumn = filterCol[index];
				var fieldName = filterColumn.name;
				if (sql) {
					fieldName = model.postingColumnName(filterColumn, filterColTable);
				}

				if (val === null || val === undefined) {
					conditions.push(q.isNull(q.field(fieldName)));
				} else {
					conditions.push(q.eq(q.field(fieldName), val));
				}


			});

			if (conditions.length === 0) {
				return undefined;
			}

			if (conditions.length === 1) {
				return conditions[0];
			}

			return q.and(conditions);
		},

        /**
         * @method getWhereKeyClause
         * @public
         * @description SYNC
         * Builds a DataQuery clause where the keys are the columns in "filterColTable" and the values are those in "valueRow" DataRow
         * @param {DataRow} valueRow Row to use for getting values to compare
         * @param {DataTable} valueColTable Row Columns  of ParentRow from which values to be compare have to be taken
         * @param {DataTable} filterColTable Row Column  of ChildRows for which the Column NAMES have to be taken
         * @param {boolean} sql
         * @returns {jsDataQuery}
         */
		getWhereKeyClause: function (valueRow, valueColTable, filterColTable, sql) {

			var valueCol = _.map(valueColTable.key(),
				function (cName) {
					return valueColTable.columns[cName];
				});

			var filterCol = _.map(filterColTable.key(),
				function (cName) {
					return filterColTable.columns[cName];
				});

			return this.getWhereKeyClauseByColumns(valueRow, valueCol, filterCol, filterColTable, sql);
		},

        /**
         * @method doGetTableRoots
         * @public
         * @description ASYNC
         * Gets some row from a datatable, with all child rows in the same table
         * @remarks it was DO_GET_TABLE_ROOTS() in TreViewDataAccess
         * 
         * @param {DataTable} table
         * @param {jsDataQuery} filter
         * @param {boolean} clear
         */
		doGetTableRoots: function (table, filter, clear) {
			var def = Deferred('doGetTableRoots');

			if (!model.canRead(table)) return def.resolve(false);
			var res = this.doGetTable(table, filter, clear, null);
			return def.from(res).promise();
		},

        /**
         * @method describeColumns
         * @public
         * @description ASYNC
         * @param {DataTable} table
         * @param {string} listType
         * Calls the describeColumns server side method on "tableName" and "listType"
         * @returns {Deferred(DataTable)}
         */
		describeColumns: function (table, listType) {
			var def = Deferred('describeColumns');
			var self = this;

			var key = table.name + "-" + listType;
			// se ho in cache la DataTable di cui ho fatto la DescribeColumn risolvo immediatamente
			if (this.cachedDescribedColumnTable[key]) {
				return def.resolve(this.cachedDescribedColumnTable[key]);
			}

			// invio un dt solo struttura.rimuovo eventuali righe creando un dt clone
			// TODO sarebbe utile avere sulla libreria jsDataSet funz che serializzi/des solo struttura.Esiste solo [rows + (*structttura)}
			var dtCloned = getDataUtils.cloneDataTable(table);
			dtCloned.clear();

			var objConn = {
				method: methodEnum.describeColumns,
				prm: { dt: getDataUtils.getJsonFromDataTable(dtCloned), listType: listType }
			};

			appMeta.connection.call(objConn)
				.then(function (jsonDataTable) {
					var dtDescribed = getDataUtils.getJsDataTableFromJson(jsonDataTable);

					// salvo nella cache
					self.cachedDescribedColumnTable[key] = dtDescribed;
					def.resolve(dtDescribed);
				});

			return def.promise();
		},

        /**
         * @method describeTree
         * @public
         * @description ASYNC
         * @param {DataTable} table
         * @param {string} listType
         * Calls the describeTree server side method on "tableName" and "listType"
         * @returns {Deferred(DataTable)}
         */
		describeTree: function (table, listType) {
			var def = Deferred('describeColumns');
			var self = this;

			var key = table.name + "-" + listType;
			// se ho in cache le info del tree di cui ho fatto la describeTree risolvo immediatamente
			if (this.cachedDescribedTree[key]) {
				return def.resolve(this.cachedDescribedTree[key]);
			}

			// invio solo strruutra, quindi clono e tolgo righe
			var dtCloned = table.clone();
			dtCloned.clear();

			var objConn = {
				method: methodEnum.describeTree,
				prm: { dt: getDataUtils.getJsonFromDataTable(dtCloned), listType: listType }
			};

			// Torna un json con i campi a seconda del tree che si sta descrivendo. dipende da tableName e listType apssati.
			// Il client nel meta_dato derivato saprà quali campi si aspetta nella resolve
			appMeta.connection.call(objConn)
				.then(function (jsonRes) {
					// salvo nella cache
					self.cachedDescribedTree[key] = jsonRes;
					def.resolve(jsonRes);
				});

			return def.promise();
		},

        /**
         * @method getSpecificChild
         * @public
         * @description ASYNC
         * Gets a row from a table T taking the first row by the filter
         * startCondition AND (startfield like startval%)
         * If more than one row is found, the one with the smallest startfield is
         * returned. Used for AutoManage functions. and treevewmanger
         * @param {DataTable} table
         * @param {jsDataQuery} startCondition
         * @param {string} startValueWanted
         * @param {string} startFieldWanted
         * @returns {Deferred(ObjectRow)}
         */
		getSpecificChild: function (table, startCondition, startValueWanted, startFieldWanted) {
			var def = Deferred("getSpecificChild");

			var prmfilter = getDataUtils.getJsonFromJsDataQuery(startCondition);
			var jsonTable = getDataUtils.getJsonFromDataTable(table);
			var objConn = {
				method: methodEnum.getSpecificChild,
				prm: {
					dt: jsonTable,
					startconditionfilter: prmfilter,
					startval: startValueWanted,
					startfield: startFieldWanted
				}
			};

			var res = appMeta.connection.call(objConn)
				.then(function (jsonRes) {
					var jsonDtOut = jsonRes.dt;
					var jsonFilterOut = jsonRes.filter;
					// deserializzo
					var dtOut = getDataUtils.getJsDataTableFromJson(jsonDtOut);
					var filter = jsonFilterOut ? getDataUtils.getJsDataQueryFromJson(jsonFilterOut) : null;

					// recupero riga
					var rowFound = dtOut.select(filter);

					if (rowFound.length === 1) {
						// eseguo merge delle righe
						getDataUtils.mergeRowsIntoTable(table, rowFound, true);

						// E' necessario restituire la riga trasferita nel datatable originale e non quella del dt temporaneo
						var rowInTreeTable = table.select(dtOut.keyFilter(rowFound[0]))[0];

						return def.resolve(rowInTreeTable);
					}

					return def.resolve(null);

				});

			return def.from(res).promise();
		},

        /**
         * @method launchCustomServerMethod
         * @public
         * @description ASYNC
         * Launches a post call to the server with eventName that is the method custom to call, and with custom "prms"
         * @param {string} eventName
         * @param {object} prm
         * @returns {Deferred}
         */
		launchCustomServerMethod: function (eventName, prms) {
			var def = Deferred('launchCustomServerMethod');

			var objConn = {
				method: methodEnum.customServerMethod,
				prm: { eventName: eventName, parameters: JSON.stringify(prms) }
			};
			appMeta.connection.call(objConn)
				.then(function (jsonRes) {
					// non fa altro che risolvere il risultato, Lo sà chi lo chiama cosa fare con il risultato
					def.resolve(jsonRes);
				});

			return def.promise();
		},

        /**
         * @method doReadValue
         * @public
         * @description ASYNC
         * Returns a single value from a table based on filter. "select value from tableName where filter"
         * @param {string} tableName
         * @param {jsDataQuery} filter
         * @param {string} expr
         * @param {string} orderby
         * @returns {Deferred}
         */
		doReadValue: function (tableName, filter, expr, orderby) {
			var def = Deferred('doReadValue');
			var filterSer = getDataUtils.getJsonFromJsDataQuery(filter);
			var objConn = {
				method: methodEnum.doReadValue,
				prm: {
					table: tableName,
					filter: filterSer,
					expr: expr,
					orderby: orderby
				}
			};
			appMeta.connection.call(objConn)
				.then(function (jsonRes) {
					// non fa altro che risolvere il risultato, Lo sà chi lo chiama cosa fare con il risultato
					def.resolve(jsonRes);
				});

			return def.promise();
		}

	};

	appMeta.getData = new GetData();

}());
