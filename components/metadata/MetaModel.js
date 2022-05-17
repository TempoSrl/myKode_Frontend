/**
 * @module MetaModel
 * @description
 * Knows how to manipulate DataSet accordingly to MetaData assumptions
 */
(function () {
	var dataRowState = jsDataSet.dataRowState;
	var dataRowVersion = jsDataSet.dataRowVersion;
	var q = window.jsDataQuery;

    /**
     * @constructor
     * @description
     */
	function MetaModel() {
		"use strict";
	}

	MetaModel.prototype = {
		constructor: MetaModel,

        /**
         * @method allowClear
         * @public
         * @description SYNC
         * Gets/sets the clearAllowed property for a DataTable "t". It is used to check if a table can be cleared without loosing data
         * @param {DataTable} t
         * @param {boolean} allow
         * @returns {boolean}
         */
		allowClear: function (t, allow) {
			if (allow !== undefined) {
				t.denyClear("y");
				if (allow) {
					t.denyClear(null);
				}
			}
			return (t.denyClear() !== "y");
		},

        /**
         * @method allowAllClear
         * @public
         * @description SYNC
         * Sets all "NotSubEntityChild" tables ofthe dataset "ds" as "CanClear". Called when form is cleared or data is posted
         * @param {DataSet} ds
         */
		allowAllClear: function (ds) {
			var self = this;
			_.forEach(ds.tables,
				function (t) {
					if (!self.notEntityChild(t)) return;
					self.allowClear(t, true);
					self.notEntityChildFilter(t, null);
				});
		},

        /**
         * @method sorting
         * @public
         * @description SYNC
         * Gets/sets the sorting of the DataTable "t"
         * @param {DataTable} t
         * @param {string} orderBy
         * @returns {string}
         */
		sorting: function (t, orderBy) {
			if (orderBy !== undefined) t.orderBy(orderBy);
			return t.orderBy();
		},

        /**
         * @method notEntityChildFilter
         * @public
         * @description SYNC
         * Gets/sets the "notEntityChild" property of the DataTable "t".
         * @param {DataTable} t
         * @param {jsDataQuery} [filter]
         * @returns {jsDataQuery}
         */
		notEntityChildFilter: function (t, filter) {
			if (filter) t.notEntityChild = filter;
			return t.notEntityChild;

		},

        /**
         * @method notEntityChild
         * @public
         * @description SYNC
         * Gets the "notEntityChild" property of the DataTable "t".
         * @param {DataTable} t
         * @returns {jsDataQuery}
         */
		notEntityChild: function (t) {
			return this.notEntityChildFilter(t);
		},

        /**
         * @method addNotEntityChild
         * @public
         * @description SYNC
         * Sets the table as "notEntityChild". So the table isn't cleared during freshform and refills
         * @param {DataTable} t
         * @param {DataTable} child
         */
		addNotEntityChild: function (t, child) {
			this.allowClear(child, false);
			this.addNotEntityChildFilter(t, child);
		},

        /**
         * @method addNotEntityChildRel
         * @public
         * @description SYNC
         * Sets the table as NotEntitychild. So the table isn't cleared during freshform and refills
         * @param {DataTable} child
         * @param {string} relName
         */
		addNotEntityChildRel: function (child, relName) {
			this.allowClear(child, false);
			this.addNotEntityChildFilterRel(child, relName);
		},

        /**
         * @method getName
         * @public
         * @description SYNC
         * @param {DataTable} child
         * @param {string} relName
         */
		addNotEntityChildFilterRel: function (child, relName) {
			if (!child) return;
			if (!relName) return;

			if (!child.dataset.relations[relName]) return;

			var rel = child.dataset.relations[relName];
			var filter = null;
			var conditions = [];
			_.forEach(rel.childCols, function (cName) {
				if (!child.columns[cName].isPrimaryKey) {
					conditions.push(q.isNull(q.field(cName)));
				}
			});

			if (conditions.length === 1) {
				filter = conditions[0];
			} else if (conditions.length > 1) {
				filter = q.and(conditions);
			}

			this.notEntityChildFilter(child, filter);
		},

        /**
         * @method addNotEntityChildFilter
         * @public
         * @description SYNC
         *
         * @param {DataTable} t
         * @param {DataTable} child
         */
		addNotEntityChildFilter: function (t, child) {
			if (this.notEntityChildFilter(child)) return;
			var r = t.dataset.getParentChildRelation(t.name, child.name);
			if (!r) return;
			if (r.length === 0) return;
			var rel = r[0];
			var filter = null;
			var conditions = [q.constant(true)];
			_.forEach(rel.childCols, function (cName) {
				// metodo alternativo jQuery if ($.inArray(cName, child.key()) !== -1 ){
				if (!child.columns[cName].isPrimaryKey) {
					conditions.push(q.isNull(q.field(cName)));
				}
			});

			if (conditions.length === 1) {
				filter = conditions[0];
			} else if (conditions.length > 1) {
				filter = q.and(conditions);
			}

			this.notEntityChildFilter(child, filter);
		},

        /**
         *
         * @method getName
         * @public
         * @description SYNC
         * Removes a table from being a NotEntitychild
         * @param {DataTable} table
         */
		clearNotEntityChild: function (table) {
			this.notEntityChildFilter(table, null);
		},

        /**
         * @method temporaryTable
         * @public
         * @description SYNC
         * Gets/sets temporary flag on a table
         * @param {DataTable} t
         * @param {boolean} value
         * @returns {boolean}
         */
		temporaryTable: function (t, value) {
			if (value !== undefined) t.isTemporaryTable = !!value;
			return t.isTemporaryTable;
		},

        /**
         * @method getTemporaryValues
         * @public
         * @description SYNC
         * Evaluates expressions for each DataTable "t" rows
         * @param {DataTable} t
         */
		getTemporaryValues: function (t) {
			var that = this;
			var ds = t.dataset;
			_.forEach(t.columns,
				function (c) {
					var expr = that.columnExpression(c);
					if (!expr) return;
					if (_.isString(expr)) {
						if (!ds) return;
						var parts = expr.split(".");
						if (parts.length !== 2) return;
						var table = ds.tables[parts[0]];
						if (!table) return;
						expr = function (r) {
							return that.getRelatedRow(r, table.name, parts[1]);
						}
					}
					if (_.isFunction(expr)) {
						_.forEach(t.rows,
							function (r) {
								var dRow = r.getRow();
								if (dRow.state === dataRowState.deleted) return;
								var toMark = (dRow.state === dataRowState.unchanged);
								r[c.name] = expr(r);
								if (toMark) dRow.acceptChanges();
							});
					};
				});
			this.calculateTable(t);
		},

        /**
         * @method getRelatedRow
         * @public
         * @description SYNC
         * Returns a field of a row related to row "r" in the table relatedTableName
         * @param {ObjectRow} r base row
         * @param {string} relatedTableName  table where the related row is to be searched
         * @param {string} relatedColumn  column containing the value
         * @returns {object}
         */
		getRelatedRow: function (r, relatedTableName, relatedColumn) {
			var dr = r.getRow();
			var related = dr.getChildInTable(relatedTableName);
			if (related.length !== 0) return related[0][relatedColumn];
			related = dr.getParentsInTable(relatedTableName);
			if (related.length !== 0) return related[0][relatedColumn];
			return null;
		},

        /**
         * @method calculateTable
         * @public
         * @description SYNC
         * Evaluates custom fields for every row of a DataTable "t". Calls the delegate linked to the table,
         * corresponding to the MetaData.CalculateFields() virtual method (if it has been defined).
         * @param {DataTable} t
         */
		calculateTable: function (t) {
			if (!t) return;
			if (!t.calculatingListing) return;
			var listType = t.calculatingListing;
			var calc = t.calculateFunction;
			if (!_.isFunction(calc)) return;
			_.forEach(t.rows,
				function (r) {
					var dRow = r.getRow();
					if (dRow.state === dataRowState.deleted) return;
					var toMark = (dRow.state === dataRowState.unchanged);
					calc(r, listType);
					if (toMark) dRow.acceptChanges();
				});
		},

        /**
         * @method calculateRow
         * @public
         * @description SYNC
         * Evaluates custom fields for a single row "r". Calls the delegate linked to the table,
         * corresponding to the MetaData.CalculateFields() virtual method (if it has been defined).
         * @param {ObjectRow} r
         */
		calculateRow: function (r) {
			if (!r) return;
			var t = r.getRow().table;
			if (!t.calculatingListing) return;
			var listType = t.calculatingListing;
			var calc = t.calculateFunction;
			if (!_.isFunction(calc)) return;

			var dRow = r.getRow();
			if (dRow.state === dataRowState.deleted) return;
			var toMark = (dRow.state === dataRowState.unchanged);
			calc(r, listType);
			if (toMark) dRow.acceptChanges();

		},

        /**
         * @method computeRowsAs
         * @public
         * @description SYNC
         *  Tells MetaData Engine to call CalculateFields(R,ListingType) whenever:
         * - a row is loaded from DataBase
         * - a row is changed in a sub-entity form and modification accepted with mainsave
         * @param {DataTable} t
         * @param {string} listType
         * @param {function} calcFunction
         */
		computeRowsAs: function (t, listType, calcFunction) {
			t.calculatingListing = listType;
			t.calculateFunction = calcFunction;
		},

        /**
         * @method realTable
         * @public
         * @description SYNC
         * Checks if a table is a real table (not temporary)
         * @param {DataTable} t
         * @returns {boolean}
         */
		realTable: function (t) {
			return !this.temporaryTable(t);
		},

        /**
         * @method columnExpression
         * @public
         * @description SYNC
         * Gets/Sets an expression associated to a DataColumn "c"
         * @method columnExpression
         * @param {DataColumn} c
         * @param {string|jsDataQuery} value
         * @returns {string|jsDataQuery|*}
         */
		columnExpression: function (c, value) {
			if (value === undefined) return c.expression;
			c.expression = value;
			return c;
		},

        /**
         * @method temporaryColumn
         * @public
         * @description SYNC
         * Returns true if the DataColumn "c" is a temporay Column, flase otherwise
         * @method temporaryColumn
         * @param {DataColumn} c
         * @returns {boolean}
         */
		temporaryColumn: function (c) {
			if (c.name.startsWith("!")) return true;
			if (c.expression) return true; // expression viene letto dals erver, che inserisce o stirnga p ME cioè jsDataQuery
			return false;
		},

        /**
         * @method clearEntity
         * @public
         * @description SYNC
         * Clears all tables of dataset "d" except for temporary and cached (including pre-filled combobox).
         * Also undoes the effect of denyclear on all secondary tables setting tables with AllowClear()
         * @param {DataSet} d
         * @returns {}
         */
		clearEntity: function (d) {
			var self = this;
			_.forEach(d.tables,
                /**
                 * clears a table if it is an entity
                 * @param {DataTable} t
                 * @returns {}
                 */
				function (t) {
					if (self.temporaryTable(t)) return true;
					if (self.cachedTable(t)) return true;
					if (!self.visitedFullyTable(t)) {
						t.clear();
					}
					self.allowClear(t, true);
					return true;
				});

		},

        /**
         * @method lockRead
         * @public
         * @description SYNC
         * Set cached flag on a DataTable "t"
         * @param {DataTable} t
         */
		lockRead: function (t) {
			t.isCached = "1";
		},

        /**
         * @method canRead
         * @public
         * @description SYNC
         *  Tells if a table should be cleared and read again during a refresh.
         *  Cached tables are not read again during refresh if they have been already been read
         * @param {DataTable} t
         * @returns {boolean}
         */
		canRead: function (t) {
			if (t.isCached === null || t.isCached === undefined) return true;
			return t.isCached === "0";
		},

        /**
         * @method reCache
         * @public
         * @description SYNC
         * If a table "t" is cached, is marked to be read again in next
         * ReadCached. If the table is not cached, has no effect
         * @param {DataTable} t
         */
		reCache: function (t) {
			if (!this.cachedTable(t)) return;
			this.cachedTable(t, true);
		},

        /**
         * @method setAsRead
         * @public
         * @description SYNC
         * Set a table as "read". It has no effect if table isn't a chached table
         * @param {DataTable} t
         */
		setAsRead: function (t) {
			if (this.cachedTable(t)) this.lockRead(t);
		},

        /**
         * @method cachedTable
         * @public
         * @description SYNC
         * Gets/sets cached flag on a table "t"
         * @param {DataTable} t
         * @param {bool(true|false)} value
         * @returns {*}
         */
		cachedTable: function (t, value) {
			if (value !== undefined) {
				if (value) {
					if (t.isCached !== "1") t.isCached = "0";
				} else {
					t.isCached = undefined;
				}
				return t.isCached;
			}
			return t.isCached !== undefined && t.isCached !== null;
		},

        /**
         * @method insertFilter
         * @public
         * @description SYNC
         * Gets/sets insert filter "value" on a table "t"
         * @param {DataTable} t
         * @param {jsDataQuery} value
         * @returns {jsDataQuery}
         */
		insertFilter: function (t, value) {
			if (value !== undefined) t.insertFilter = value;
			return t.insertFilter;
		},

        /**
         * @method searchFilter
         * @public
         * @description SYNC
         * Gets/Sets a search filter "value" on a table "t"
         * @param {DataTable} t
         * @param {jsDataQuery} [value]
         * @returns {*}
         */
		searchFilter: function (t, value) {
			if (value !== undefined) t.searchFilter = value;
			return t.searchFilter;
		},

        /**
         * @method getgetMaxLenName
         * @public
         * @description SYNC
         * Given col type returns the length of the field
         * @param {DataColumn} col
         * @returns {*}
         */
		getMaxLen: function (col) {
			if (!col) return 32767;
			if (col.ctype === "Decimal") return 20;
			if (col.ctype === "Float") return 20;
			if (col.ctype === "Double") return 20;
			if (col.ctype === "Int32") return 10;
			if (col.ctype === "Int16") return 5;
			if (!col.maxstringlen) return 2147483647;
			return col.maxstringlen;
		},

        /**
         * @method denyNull
         * @public
         * @description SYNC
         * Gets/sets denyNull property on DataColumn "c" property
         * @param {DataColumn} c
         * @param {boolean} value
         * @returns {boolean}
         */
		denyNull: function (c, value) {
			if (value === undefined) {
				return !this.allowDbNull(c);
			}
			return !this.allowDbNull(c,!value);
		},

        /**
         * @method denyZero
         * @public
         * @description SYNC
         * Gets/sets denyZero property on DataColumn "c" property
         * @param {DataColumn} c
         * @param {boolean} value
         * @returns {boolean}
         */
		denyZero: function (c, value) {
			if (value === undefined) {
				return !this.allowZero(c);
			}
			return !this.allowZero(c,!value);
		},

        /**
         * @method allowDbNull
         * @public
         * @description SYNC
         * Gets/sets "allowDbNull"  property on DataColumn "c" property (False if data is not nullable in the database)
         * @param {DataColumn} c
         * @param {boolean} value
         * @returns {boolean}
         */
		allowDbNull: function (c, value) {
			if (value === undefined) {
				if (c.allowDbNull === undefined) return true;
				return c.allowDbNull;
			}
			c.allowDbNull = value;
			return this;
		},

        /**
         * @method allowZero
         * @public
         * @description SYNC
         * Gets/sets "allowZero"  property on DataColumn "c" property (False if data not permit zero in the database)
         * @param {DataColumn} c
         * @param {boolean} value
         * @returns {boolean}
         */
		allowZero: function (c, value) {
			if (value === undefined) {
				if (c.allowZero === undefined) return true;
				return c.allowZero;
			}
			c.allowZero = value;
			return this;
		},

        /**
         * @method isColumnNumeric
         * @public
         * @description SYNC
         * Returns true if the column is numeric, false otherwise
         * @param {DataColumn} c
         * @returns {boolean}
         */
		isColumnNumeric: function (c) {
			if (!c) return false;
			var ctype = c.ctype;
			if (!ctype) return false;
			return (ctype === "Decimal" ||
				ctype === "Double" ||
				ctype === "Single" ||
				ctype === "Int16" ||
				ctype === "Int32" ||
				ctype === "Int64");
		},

        /**
         * @method visitedFullyTable
         * @public
         * @description SYNC
         * Gets/Sets cached flag on a table "t"
         * @method visitedFullyTable
         * @param {DataTable} t
         * @param {bool} value
         * @returns {boolean}
         */
		visitedFullyTable: function (t, value) {
			if (value !== undefined) t.isvisitedFully = !!value;
			return t.isvisitedFully;
		},

        /**
         * @method isSubEntity
         * @public
         * @description SYNC
         * Returns true if "childTable" is a subentity table of "parentTable", false otherwise
         * A table is subentity if it is child and all columns of primary table must be connected to a child key field
         * @param {DataTable} childTable
         * @param {DataTable} parentTable
         * @returns {boolean}
         */
		isSubEntity: function (childTable, parentTable) {
			var that = this;
			return _.some(parentTable.childRelations(),
				function (rel) {
					if (rel.childTable !== childTable.name) return false;
					return that.isSubEntityRelation(rel, childTable, parentTable);
				});
		},

        /**
         * @method isSubEntityRelation
         * @private
         * @description SYNC
         * Returns true if the relation "rel" is a db relation between "childTable" and "parentTable"
         * and all columns of primary table must be connected to a child key field
         * @param {DataRelation} rel
         * @param {DataTable} childTable
         * @param {DataTable} parentTable
         * @returns {boolean}
         */
		isSubEntityRelation: function (rel, childTable, parentTable) {
			// verifica della condizione di subentity forzata dalla metapage
			if (this.notEntityChildFilter(rel.dataset.tables[rel.childTable])) return true;
			if (rel.parentTable !== parentTable.name) return false;
			if (rel.childTable !== childTable.name) return false;

			// relation must connect all key fields of parentTable
			if (_.some(rel.parentCols,
				function (cName) {
					return !(parentTable.isKey(cName));
				})) return false;

			if (rel.parentCols.length !== parentTable.key().length) return false;

			// Check that ALL columns of relation must be connected to a child key field
			if (_.some(rel.childCols,
				function (cName) {
					return !(childTable.isKey(cName));
				})) return false;

			return true;

		},

        /**
         * @method isParentTableByKey
         * @public
         * @description SYNC
         * Checks if parent table "parentTable" is related with KEY fields of Child table "childTable"
         * @param {DataSet} ds
         * @param {DataTable} parentTable
         * @param {DataTable} childTable
         * @returns {boolean}
         */
		isParentTableByKey: function (ds, parentTable, childTable) {
			var rel = ds.getParentChildRelation(parentTable.name, childTable.name);
			if (rel.length === 0) return false;
			if (rel[0].childCols.length === 0) return false;
			var kFound = true;
			_.forEach(rel[0].childCols,
				function (col) {
					if (!childTable.isKey(col)) {
						kFound = false;
						return false;
					}
					return true;
				});
			return kFound;
		},

        /**
         * @method hasChanges
         * @public
         * @description SYNC
         * Returns true if dataset has changes, false otherwise.
         * @param {DataSet} ds
         * @param {DataTable} primary
         * @param {DataRow} sourceRow >> Row in master DataSet
         * @param {boolean} detailPage
         * @returns {boolean}
         */
		hasChanges: function (ds, primary, sourceRow, detailPage) {
			this.removeFalseUpdates(ds);

			if (!detailPage) return ds.hasChanges();

			if (primary.rows.length === 0) return false;

			if (!sourceRow) return false;

			// Per una subentità (detail form) confronta i dati con quelli dell'origine
			var masterDataSet = sourceRow.table.dataset;

			var myRow = primary.rows[0];
			if (this.xVerifyChangeChilds(masterDataSet, sourceRow.table, ds, myRow)) return true;
			return this.xVerifyChangeChilds(ds, primary, masterDataSet, sourceRow.current);
		},

        /**
         * @method removeFalseUpdates
         * @private
         * @description SYNC
         * Removes false updates from a DataSet, i.e. calls AcceptChanges for any DataRow erroneously marked as modified
         * @param {DataSet} ds
         */
		removeFalseUpdates: function (ds) {
			var that = this;
			_.forEach(ds.tables,
				function (t) {
					if (that.temporaryTable(t)) return true; //doesn't make anything on temporary tables
					_.forEach(t.rows,
						function (r) {
							var dRow = r.getRow();
							if (dRow.state !== dataRowState.modified) return true;
							if (that.checkForFalseUpdates(dRow)) {
								dRow.acceptChanges();
							}
							return true;
						});
					return true;
				});

		},

        /**
         * @method checkForFalseUpdates
         * @public
         * @description SYNC
         * Returns true if row (modified) is not really a modified row
         * @param {DataRow} dRow
         * @returns {boolean}
         */
		checkForFalseUpdates: function (dRow) {
			if (dRow.state !== dataRowState.modified) return false;
			var hasRealUpdates = false;
			var that = this;
			_.forEach(dRow.table.columns,
				function (c) {
					if (that.temporaryColumn(c)) return true;
					if (!that.areEqualValuesOriginalCurrent(dRow, c)) {
						if (!(dRow.getValue(c.name, dataRowVersion.original) === undefined && dRow.getValue(c.name, dataRowVersion.current) === null)) {
							hasRealUpdates = true;
							return false;
						}
					}
					return true;
				});
			return !hasRealUpdates;
		},

		areEqualValuesOriginalCurrent:function (dRow, column) {
			if (column.ctype === 'DateTime') {
				var d1 = dRow.getValue(column.name, dataRowVersion.current);
				var d2 = dRow.getValue(column.name, dataRowVersion.original);
				if (!d1 && d2) {
					return false;
				}
				if (d1 && !d2) {
					return false;
				}
				if (!d1 && !d2) {
					return true;
				}
				return d1.getTime() === d2.getTime();
			}

			return dRow.getValue(column.name, dataRowVersion.current) === dRow.getValue(column.name, dataRowVersion.original);
		},

        /**
         * @method xVerifyChangeChilds
         * @public
         * @description SYNC
         * Checks if rSource and all childs have not changed comparing them with Dest content
         * Returns true if there are changes
         * @param {DataSet} dest
         * @param {DataTable} tDest
         * @param {DataSet} rif
         * @param {ObjectRow} rSource
         * @returns {boolean}
         */
		xVerifyChangeChilds: function (dest, tDest, rif, rSource) {
			if (this.xVerifyRowChange(dest, tDest, rif, rSource)) return true;
			var drSource = rSource.getRow();
			var t = drSource.table;
			var that = this;

			var changeNotSubentity = _.some(
				_.filter(dest.tables, function (t) {
					return that.notEntityChildFilter(t) && t.hasChanges();
				}));
			if (changeNotSubentity) return true;

			return _.some(t.childRelations(),
				function (rel) { //rel collega la parentTable ove c'è rSource con una childTable con le figlie

					if (!dest.tables[rel.childTable]) return false; //la tabella child non è presente nel dataset di origine
					if (!that.isEntityChildRelation(rel)) return false; //la relazione non è di tipo "subentity"
					return _.some(rel.getChild(rSource),
						function (rChild) {
							return that.xVerifyChangeChilds(dest, dest.tables[rel.childTable], rif, rChild);
						});
				});
		},

        /**
         * @method isEntityChildRelation
         * @public
         * @description SYNC
         * Checks if a relation connects any field that is primarykey for both parent and child
         * @param {DataRelation} r
         * @returns {boolean}
         */
		isEntityChildRelation: function (r) {
			// Autorelation are not children
			if (r.parentTable === r.childTable) return false;
			var parentTable = r.dataset.tables[r.parentTable];
			var childTable = r.dataset.tables[r.childTable];
			return _.some(_.map(
				_.zip(r.parentCols, r.childCols),
				_.curry(_.zipObject)(['parentCol', 'childCol'])
			), function (pair) {
				return (parentTable.isKey(pair.parentCol) && childTable.isKey(pair.childCol));
			});
		},

        /**
         * @method xVerifyRowChange
         * @public
         * @description SYNC
         * Verifies if a row is not changed beetwen parent and child dataset
         * Retrun true if there are changes
         * @param {DataSet} dest
         * @param  {DataTable} tDest
         * @param {DataSet} source
         * @param {ObjectRow} rSource
         * * @returns {boolean}
         */
		xVerifyRowChange: function (dest, tDest, source, rSource) {
			var drSource = rSource.getRow();
			if (drSource.state === dataRowState.deleted) return false; //shouldn't happen
			var tSource = drSource.table;
			var found = tDest.select(tSource.keyFilter(rSource));
			if (found.length === 0) return true;
			var rFound = found[0];
			var that = this;
			return _.some(tSource.columns,
				function (c) {
					if (that.temporaryColumn(c)) return false;
					if (!tDest.columns[c.name]) return false;
					var colDest = tDest.columns[c.name];
					if (that.temporaryColumn(colDest)) return false;
					return rFound[c.name] !== rSource[c.name];
				});
		},

        /**
         * @method xCopy
         * @public
         * @description SYNC
         * Copies a DataRow from dsSource to dsDest.
         * rSource and rDest must have same key, or rSource have to not generate conflicts in dsDest
         * @param {DataSet} dsSource
         * @param {DataSet} dsDest
         * @param {DataRow} rSource
         * @param {DataRow} rDest
         * @returns {DataRow}
         */
		xCopy: function (dsSource, dsDest, rSource, rDest) {
			var destIsInsert = (rDest.state === dataRowState.added);
			var destTableName = rDest.table.name;
			this.xRemoveChilds(dsSource, rDest);
			return this.xMoveChilds(dsDest, dsDest.tables[destTableName], dsSource, rSource, destIsInsert);
		},

        /**
         * @method xCopyChilds
         * @public
         * @description SYNC
         * Copies a DataRow and all its childs from "dsSource" to "dsDest"
         * @param {DataSet} dsDest
         * @param {DataSet} dsSource
         * @param {DataRow} rowSource
         */
		xCopyChilds: function (dsDest, dsSource, rowSource) {
			var t = rowSource.table;
			var source_unaliased = t.tableForReading();
			if (!dsDest.tables[source_unaliased]) source_unaliased = rowSource.table.name;
			this.copyDataRow(dsDest.tables[source_unaliased], rowSource);
			this.allowClear(dsDest.tables[source_unaliased], false);
			var self = this;
			_.forEach(t.childRelations(), function (rel) {
				if (dsDest.tables[rel.childTable]) {
					if (self.checkChildRel(rel)) {
						self.allowClear(dsDest.tables[rel.childTable], false);
						var childs = rowSource.getChildRows(rel.name);
						_.forEach(childs, function (child) {
							self.xCopyChilds(dsDest, dsSource, child.getRow());
						});
					}
				}
			});
		},

        /**
         * @method copyDataRow
         * @private
         * @description SYNC
         * Copies "toCopy" row to "destTables" DataTable
         * @param {DataTable} destTable
         * @param {DataRow} toCopy
         */
		copyDataRow: function (destTable, toCopy) {
			var destRow = destTable.newRow();
			var isCurrentToConsider = true;
			if (toCopy.state === dataRowState.deleted) isCurrentToConsider = false;
			if (toCopy.state === dataRowState.modified) isCurrentToConsider = false;
			if (toCopy.state !== dataRowState.added) {
				_.forEach(destTable.columns, function (col) {
					if (toCopy.table.columns[col.name]) {
						if (isCurrentToConsider) {
							destRow[col.name] = toCopy.getValue(col.name, dataRowVersion.current)
						} else {
							destRow[col.name] = toCopy.getValue(col.name, dataRowVersion.original)
						}
					}
				});

				destRow.getRow().acceptChanges();
			}

			if (toCopy.state === dataRowState.deleted) {
				destRow.getRow().del();
				return;
			}

			// sopra ho fatto acceptChanges. solo per le diverse da added rimetto il currnet
			// così lo stato viene preservato tra tocopy e copiato
			if (toCopy.state !== dataRowState.unchanged) {
				_.forEach(destTable.columns, function (col) {
					if (toCopy.table.columns[col.name]) {
						destRow[col.name] = toCopy.getValue(col.name, dataRowVersion.current)
					}
				});
			}

			if ((toCopy.state === dataRowState.modified || toCopy.state === dataRowState.unchanged)) {
				this.calculateRow(destRow);
				if (this.checkForFalseUpdates(destRow)) destRow.acceptChanges();
				return;
			}

			this.calculateRow(destRow);
		},

        /**
         * @method getName
         * @public
         * @description SYNC
         * Moves a DataRow and all its childs from "dsRif" to "dsDest".
         * @param {DataSet} dsDest
         * @param {DataTable} tDest
         * @param {DataSet} dsRif
         * @param {DataRow} rSource
         * @param {boolean} forceAddState
         * @returns {DataRow}
         */
		xMoveChilds: function (dsDest, tDest, dsRif, rSource, forceAddState) {
			var t = rSource.table;
			var resultRow = this.moveDataRow(tDest, rSource, forceAddState);
			var self = this;
			_.forEach(t.childRelations(), function (rel) {
				if (dsDest.tables[rel.childTable]) {
					if (self.checkChildRel(rel)) {
						var childDataTable = dsRif.tables[rel.childTable];
						// copia gli autoincrements
						self.copyAutoincrementsProperties(childDataTable, dsDest.tables[rel.childTable]);
						while (childDataTable.rows.length > 0) {
							var child = childDataTable.rows[0];
							self.xMoveChilds(dsDest, dsDest.tables[rel.childTable], dsRif, child.getRow(), false);
						}
					}
				}
			});

			if (rSource.state !== dataRowState.deleted) rSource.del();
			if (rSource.state !== dataRowState.detached) rSource.acceptChanges();
			return resultRow;
		},

        /**
         * @method moveDataRow
         * @public
         * @description SYNC
         * Moves "toCopy" row to "destTable" DataTable
         * @param {DataTable} destTable
         * @param {DataRow} toCopy
         * @param {boolean} forceAddState
         * @returns {DataRow}
         */
		moveDataRow: function (destTable, toCopy, forceAddState) {
			var dest = destTable.newRow();
			var isCurrentToConsider = true;
			if (toCopy.state === dataRowState.deleted) isCurrentToConsider = false;
			if (toCopy.state === dataRowState.modified) isCurrentToConsider = false;
			if (toCopy.state !== dataRowState.added && !forceAddState) {
				_.forEach(destTable.columns, function (col) {
					if (toCopy.table.columns[col.name]) {
						if (isCurrentToConsider) {
							dest[col.name] = toCopy.getValue(col.name, dataRowVersion.current)
						} else {
							dest[col.name] = toCopy.getValue(col.name, dataRowVersion.original)
						}
					}
				});

				// destTable.add(dest);
				dest.getRow().acceptChanges();
			}

			if (toCopy.state === dataRowState.deleted) {
				dest.getRow().del();
				return dest;
			}

			_.forEach(destTable.columns, function (col) {
				if (toCopy.table.columns[col.name]) {
					dest[col.name] = toCopy.getValue(col.name, dataRowVersion.current)
				}
			});

			if ((toCopy.state === dataRowState.modified || toCopy.state === dataRowState.unchanged) && !forceAddState) {
				this.calculateRow(dest);
				if (this.checkForFalseUpdates(dest.getRow())) dest.getRow().acceptChanges();
				return dest;
			}

			// Vedo se nella tab. di dest. c'è una riga cancellata che matcha
			var filter = appMeta.getData.getWhereKeyClause(toCopy, toCopy.table, toCopy.table, false);
			var deletedFound = _.filter(destTable.select(filter), function (r) {
				return r.getRow().state === dataRowState.deleted;
			});

			if (deletedFound) {

				if (deletedFound.length === 1) {
					_.forEach(destTable.columns, function (col) {
						dest[col.name] = deletedFound[0].getValue(col.name, dataRowVersion.original)
					});

					// Elimina la riga cancellata dal DataSet
					deletedFound[0].getRow().acceptChanges();

					// Considera la riga sorgente non più cancellata ma invariata
					dest.getRow().acceptChanges();

					_.forEach(destTable.columns, function (col) {
						if (toCopy.table.columns[col.name]) {
							dest[col.name] = toCopy.getValue(col.name, dataRowVersion.current)
						}
					});

					this.calculateRow(dest);
					if (this.checkForFalseUpdates(dest)) dest.getRow().acceptChanges();
					return dest;
				}
			}
			this.calculateRow(dest);
			return dest;
		},

        /**
         * @method xRemoveChilds
         * @public
         * @description SYNC
         * Removes a row "rDest" with all his subentity childs. Only considers tables of D inters. Rif
         * @param {DataSet} dsRif
         * @param {DataRow} rDest
         */
		xRemoveChilds: function (dsRif, rDest) {
			var t = rDest.table;
			var self = this;
			_.forEach(t.childRelations(), function (rel) {
				if (dsRif.tables[rel.childTable]) {
					if (self.checkChildRel(rel)) {
						var childs = rDest.getChildRows(rel.name);
						_.forEach(childs, function (child) {
							self.xRemoveChilds(dsRif, child.getRow());
						})
					}
				}
			});

			rDest.del();
			if (rDest.state !== dataRowState.detached) rDest.acceptChanges();
		},

        /**
         * @method checkChildRel
         * @private
         * @description SYNC
         * Checks if a relation connects any field that is primarykey for both parent and child
         * @param {DataRelation} rel
         * @returns {boolean}
         */
		checkChildRel: function (rel) {

			if (this.notEntityChildFilter(rel.dataset.tables[rel.childTable])) return true;
			// Autorelation are not childRel
			if (rel.parentTable === rel.childTable) return false;

			var linkparentkey = false;


			_.forEach(rel.parentCols, function (parentCol, index) {
				var childCol = rel.childCols[index];

				if (rel.dataset.tables[rel.parentTable].columns[parentCol].isPrimaryKey &&
					rel.dataset.tables[rel.childTable].columns[childCol].isPrimaryKey) {
					linkparentkey = true;
				}

			});

			return linkparentkey;
		},

        /**
         * @method postingColumnName
         * @private
         * @description SYNC
         * Gets the Column name to use for posting a given field into DB
         * @param {DataColumn} col
         * @param {DataTable} table DatTable attached to the column
         * @returns {string|null}
         */
		postingColumnName: function (col, table) {
			if (table.tableForWriting() === undefined || col.forPosting === undefined) return col.name;
			if (col.forPosting === "") return null;
			return col.forPosting;
		},

        /**
         * @method copyAutoincrementsProperties
         * @public
         * @description SYNC
         * Copies the autoincrement properties form DataTable  "dtIn" to  DataTable "dtOut"
         * @param {DataTable} dtIn
         * @param {DataTable} dtOut
         */
		copyAutoincrementsProperties: function (dtIn, dtOut) {
			// faccio un semplice clone
			dtOut.autoIncrementColumns = _.cloneDeep(dtIn.autoIncrementColumns);
		},

        /**
         * @method cmpSelectors
         * @public
         * @description SYNC
         * For each AutoIncrement obj of table t, compares the values of the two rows.
         * Returns false if a value is different, returns true if all values on selector columns are equal
         * @param {DataTable} t
         * @param {DataRow} row1
         * @param {DataRow} row2
         * @returns {boolean} true if all values for row1 and row2 in all selector columns are equal, false otherwise
         */
		cmpSelectors: function (t, row1, row2) {
			// valore partenza true, setto a false appena trovo un valore diverso
			var cmpRes = true;

			// 1o ciclo su ogni AutoIncrementColumn
			_.forEach(t.autoIncrementColumns, function (aic) {

				// se già è false esco dal ciclo
				if (!cmpRes) {
					return false;
				}

				// 2. ciclo sui selettori
				_.forEach(aic.selector, function (sel) {

					// recupero per quella colonna i valori su row1 e row2
					var v1 = row1.current[sel];
					var v2 = row2.current[sel];

					if (v1 instanceof Date) {
						if (v1.valueOf() !== v2.valueOf()) {
							cmpRes = false; // valore diverso, metto booleano a false ed esco dal ciclo
							return false;
						}
					} else if (v1 !== v2) {
						cmpRes = false; // valore diverso, metto booleano a false ed esco dal ciclo
						return false;
					}

				}); // chiude for interno

			}); // chiude for esterno

			return cmpRes;
		},

        /**
         * @method calcTemporaryID
         * @public
         * @description SYNC
         * Evaluates a temporary value for a field of a row, basing on AutoIncrement
         * properties of the column, without reading from DB.
         * @param {DataTable} table
         * @param {DataRow} row
         */
		calcTemporaryID: function (table, row) {
			_.forEach(table.columns, function (dc) {
				if (table.autoIncrement(dc.name)) {
					table.calcTemporaryId(row.current, dc.name);
				}
			});
		},

        /**
         * @method applyCascadeDelete
         * @public
         * @description SYNC
         * Does the cascade delete of the row "rowToDelete"
         * @param {ObjectRow} rowToDelete
         */
		applyCascadeDelete: function (rowToDelete) {
			// TODO in mdl memorizzava le row, ma poi non usava più l'oggetto rollback
			this.cascadeDelete(rowToDelete);
		},

		/**
		 * Deletes a row with all subentity child
		 * @method cascadeDelete
		 * @param {ObjectRow} row
		 * @return {*}
		 */
		cascadeDelete: function (row) {
			var r = row.getRow(),
				table = r.table,
				that = this;
			_.forEach(table.dataset.relationsByParent[table.name], function (rel) {
				if (that.checkChildRel(rel)) {
					_.forEach(rel.getChild(row), function (toDel) {
						if (toDel.getRow().state !== dataRowState.deleted) {
							that.cascadeDelete(toDel);
						}
					});
				} else {
					_.forEach(rel.getChild(row), function (toUnlink) {
							rel.makeChild(null, toUnlink);
						}
					);
				}
			});
			r.del();
		},

        /**
         * @method copyPrimaryKey
         * @private
         * @description SYNC
         * Set the primary key of Dest conformingly to table Source
         * @param {DataTable} dest
         * @param {DataTable} source
         */
		copyPrimaryKey: function (dest, source) {
			// se già contiene una chiave esco
			var destKeys = dest.key();
			if (destKeys) {
				if (destKeys.length > 0) return;
			}

			var keys = _.filter(source.key(), function (cName) {
				if (dest.columns[cName]) return true;
				return false;
			});

			if (keys.length > 0) dest.key(keys);
		},

        /**
         * @method columnNameList
         * @public
         * @description ASYNC
         * Returns the list of real (not temporary or expression) columns NAMES of a table "table"
         * formatting it like "fieldname1, fieldname2,...."
         * Returns "*" if no column is set
         * @param {DataTable} table
         * @returns {string}
         */
		columnNameList: function (table) {
			var self = this;
			var cols = _.map(_.filter(table.columns,
				function (c) {
					if (self.temporaryColumn(c)) return false;
					return true;
				}),
				function (dc) {
					return dc.name
				});

			if (cols.length > 0) return cols.join(",");
			return '*';
		},

        /**
         * Sets a field to DBNull (or -1(int)  or 0-like values when DBNull is not allowed)
         * @param {DataColumn} col The col to check to return the clear value
         * @returns {Object}
         */
		clearValue: function (col) {
			if (this.allowDbNull(col)) {
				return null;
			}
			var typename = col.ctype;
			switch (typename) {
				case "String":
				case "Char":
					return "";
				case "Single":
				case "Double":
				case "Int16":
				case "Int32":
				case "Byte":
				case "Decimal":
					return 0;
				case "DateTime":
					return new Date("1000-01-01");
				default:
					return "";
			}
		}
	};
	window.appMeta.metaModel = new MetaModel();
}());
