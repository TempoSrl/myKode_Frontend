/**
 * @module CalendarControl
 * @description
 * Manages the graphics and the logic of a calendar
 */
(function () {

	var dataRowState = jsDataSet.dataRowState;
	var Deferred = appMeta.Deferred;
	var Stabilizer = appMeta.Stabilizer;
	var utils = appMeta.utils;
	var localResource = appMeta.localResource;
	var logger = appMeta.logger;
	var logType = appMeta.logTypeEnum;
    /**
     *
     * @param {element} el
     * @param {HelpForm} helpForm
     * @param {DataTable} table
     * @param {DataTable} primaryTable
     * @param {string} listType
	 * @param {bool} isListManager
     * @constructor
     */
	function CalendarControl(el, helpForm, table, primaryTable, listType, isListManager) {
		this.helpForm = helpForm;
		this.dataTable = table;
		this.el = el;
		this.isListManager = isListManager;
		this.listType = listType;
		return this;
	}

	CalendarControl.prototype = {
		constructor: CalendarControl,

		init: function () {
			this.tag = $(this.el).data("tag");
			this.dataSourceName = this.dataTable.name;
			this.dataTable.linkedCalendar = this;
			this.DS = this.dataTable.dataset;

			// gestione colonne di configurazione
			this.startColumnName = (typeof $(this.el).data("mdlstartcolumnname") === "undefined") ? "start" : $(this.el).data("mdlstartcolumnname"); // default start
			this.titleColumnName = (typeof $(this.el).data("mdltitlecolumnname") === "undefined") ? "" : $(this.el).data("mdltitlecolumnname"); // default start
			this.stopColumnName = (typeof $(this.el).data("mdlstopcolumnname") === "undefined") ? "" : $(this.el).data("mdlstopcolumnname"); // opzionale
			this.mainColor = (typeof $(this.el).data("mdlmaincolor") === "undefined") ? '#0275d8' : $(this.el).data("mdlmaincolor"); // opzionale
			this.defaultDate = moment(); // centrato su oggi

			// gestione bottoni editing direttamente su griglia
			this.isInsertBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttoninsert");
			this.isEditBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttonedit");
			this.isDeleteBtnVisible = this.helpForm.existsDataAttribute(this.el, "mdlbuttondelete");
			this.weekendEnabled = this.helpForm.existsDataAttribute(this.el, "mdlweekend");

			this.enableDragDrop = this.helpForm.existsDataAttribute(this.el, "mdldragdrop");

			// invoco la describe column per i nomi delle colonne e anche per i campi calcolati
			this.meta = appMeta.getMeta(this.dataTable.tableForReading());
			this.listType = this.listType ? this.listType : this.helpForm.getField(this.tag, 1);
			this.defDescribedColumn = this.meta.describeColumns(this.dataTable, this.listType);

			// costrusice l'oggetto custom per la config iniziale del fullCalendar
			var fullCalendarOptionsObj = this.getOptionsInitFullCalendar();
			// inizializzo oggetto calendario
			$(this.el).fullCalendar(fullCalendarOptionsObj);
		},

        /**
         * @method buildEvents
         * @private
         * @description SYNC
         * Builds the collection of EventObject , starting from the rows of the table linked collection
         */
		buildEvents: function (dt, objConfig) {
			var self = this;
			var events = [];
			_.forEach(dt.rows, function (row) {
				if (row.getRow().state !== dataRowState.deleted) {
					var currEv = self.getEventObject(row, objConfig);
					if (currEv) events.push(currEv);
				}
			});

			return events;
		},

        /**
         * @method getEventObject
         * @private
         * @description SYNC
         * Builds an eventObject with the ObjectRow attached to the event
         * @param {ObjectRow} row
         * @param {Object} {
								startColumnName: 'start',
								stopColumnName: 'stop',
								titleColumnName : 'title',
								color: 'yellow'
							}
         * @returns {{title: *, start: *, stop: *row: *} | null}
         */
		getEventObject: function (row, objConfig) {
			var dtRow = row.getRow();
			var evObj = {}; // obj evento di ritorno

			if (!dtRow) {
				logger.log(logType.ERROR, localResource.calendarNotRowCorrect);
				return null;
			}

			// check su esistenza della colonna start
			var startColName = this.startColumnName;
			if (objConfig && objConfig.startColumnName) startColName = objConfig.startColumnName;
			if (!startColName) {
				logger.log(logType.ERROR, localResource.calendarWrongConfig + ": start");
				return null;
			}
			if (dtRow.table.columns[startColName].ctype !== 'DateTime') {
				logger.log(logType.ERROR, localResource.calendarWrongConfig + ": start is not a DateTime");
				return null;
			}
			// check su colonna con valori nulli
			if (!row[startColName]) {
				logger.log(logType.INFO, localResource.calendarWrongConfig + "a row has null value on start");
				return null;
			}

			// colonna title opzionale
			var titlecolName = this.titleColumnName;
			if (objConfig && objConfig.titleColumnName) titlecolName = objConfig.titleColumnName;
			if (titlecolName) {
				if (!dtRow.table.columns[titlecolName]) {
					logger.log(logType.ERROR, localResource.calendarWrongConfig + ": title");
					return null;
				}
			}

			var stopColumnName = null;
			// gestisco stopColumnName degli eventi esterni
			if (objConfig) {
				// se è specificata la data di fine allora non è un allDay
				if (objConfig.stopColumnName) stopColumnName = objConfig.stopColumnName;
			} else {
				var colStart = dtRow.table.columns[startColName];
				// se solo data metto allday, altrimenti vado a verifiare la colonna di end
				if ((colStart.sqltype && colStart.sqltype.toLowerCase() !== 'date')) stopColumnName = this.stopColumnName;
			}

			// se non è all day eseguo cehck su colonna di stop
			if (stopColumnName) {
				var colStop = dtRow.table.columns[stopColumnName];
				if (!colStop) {
					logger.log(logType.ERROR, localResource.calendarWrongConfig + ": stop ");
					return null;
				}
				if (colStop.ctype !== 'DateTime') {
					logger.log(logType.ERROR, localResource.calendarWrongConfig + ": stop is not a DateTime");
					return null;
				}
				// check su colonna con valori nulli
				//if (!row[stopColumnName]){
				//    logger.log(logType.INFO, localResource.calendarWrongConfig + "a row has null value on stop");
				//    return null;
				//}
				evObj.end = row[stopColumnName]; // opzionale del controllo FullCalendar
			}

			evObj.title = this.getEventStringCellFormatted(row, titlecolName);  // obbligatorio del controllo FullCalendar.default vuoto;
			evObj.start = row[startColName]; // obbligatorio del controllo FullCalendar.
			evObj.row = row; // bind ObjectRow necessario per il funzionamento del framework mdlw. sui bottoni sò che riga è.
			evObj.color = (objConfig && objConfig.color) ?
				(objConfig.color === 'color' ? row.color : objConfig.color) //se ho passato come colore 'color' vuol dire che il colore è sulla riga
				: this.mainColor;
			evObj.allDay = !evObj.end;
			evObj.mine = !objConfig;
			return evObj;
		},

		/**
		 * Format the cell value, based on tag and format
		 * @param {ObjectRow} row
		 * @param {string} field the column name
		 * @returns {string} the value of "field" in the "row"
		 */
		getEventStringCellFormatted:function(row, field) {
			var formattedDate = function(d) {
				if (!d) {
					return "";
				}
				var month = String(d.getMonth() + 1);
				var day = String(d.getDate());
				var year = String(d.getFullYear());
				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				return day + '/' + month + '/' + year;
			};

			var t = row.getRow().table;
			var dc = t.columns[field];
			// formattazione specifica per campi di tipo data.
			if (dc.ctype === 'DateTime') {
				return formattedDate(row[field]);
			}
			var tag = t.name + '.' + field + (dc.format ? '.' + dc.format : '');
			var typedObject = new appMeta.TypedObject(dc.ctype, row[field], tag);
			return typedObject.stringValue(tag);
		},

        /**
         * @method getOptionsInitFullCalendar
         * @private
         * @description SYNC
         * Builds the options for the fullCalendar component. set default and manage the events
         * @returns {object}
         */
		getOptionsInitFullCalendar: function () {
			// self per utilizzare all'interno di fullCalendar, in cui "this" cambia
			var self = this;
			// tipo di evento sul click
			var clickActionEnum = {
				none: "none",
				edit: "edit",
				delete: "delete",
				info: "info"
			};
			var clickAction = clickActionEnum.none;
			// oggetto delle opzioni da passare all componente di terze parti fullCalendar
			var fullCalendarOptionsObj = {
				header: {
					right: 'month,agendaWeek,agendaDay,listMonth,addEventButton,toggleWeekendy,toggleWeekendn' // il bottone di add è posto come custom button sull'header
				},
				// viste custom "type agenda" mette caselline, type "list" elenco eventi fatti a riga listWeek è il suo diu defualt
				views: {
					listMonth: {
						type: 'list',
						duration: { days: 31 },
						buttonText: localResource.agenda
					}
				},
				bootstrapFontAwesome: {
					addEventButton: 'fa-plus-square',
					goNextButton: 'fas fa-arrow-right',
					goPrevButton: 'fa-arrow-left',
					toggleWeekendn: 'fa-eye-slash',
					toggleWeekendy: 'fa-eye'
				},
				themeSystem: 'bootstrap4',
                /*themeSystem: 'jquery-ui',
                 themeButtonIcons:{
                 addEventButton: 'ui-icon-circle-plus'
                 },*/
				defaultDate: self.defaultDate, // default ad oggi
				locale: localResource.currLng,
				navLinks: true, // can click day/week names to navigate views
				eventLimit: true, // allow "more" link when too many events

				// quando è Calendar normale al click sull'evdento mostro dialog con altri pulsanti e info varie
				// altrimenti in ricerca gestisco il lcick e doppio click per selezionare la riga dalla lista
				eventClick: function (calEvent, jsEvent, view) {
					if (!self.isListManager) self.infoClick(calEvent);
				},
				// attacca delle icone cliccabili, per eventi di edit e delete
				eventRender: function (event, element) {
					element.find(".fc-title").append('<span style="cursor:pointer"></span>');
					if (event.title) {
						// html nei titoli e in agenda
						element.find(".fc-time").html(self.getEventTime(event));
						element.find(".fc-title").html(event.title);
						element.find(".fc-list-item-title").html(event.title);
					}

					// se è ospitato su listManager allora gestisco click e dblcick i quali lanciano eventi di selezione riga sulla metaPage
					if (self.isListManager) {
						element.bind('dblclick', _.partial(self.rowDblClickEv, self, event));
						element.bind('click', _.partial(self.rowClickEv, self, event));
					}
				},
				viewRender: function (view, element) {
					// rimuove l'img info che appare nel giorno attuale (solo in bootstrap4). la mette lui di defualt sul css
					if ($(".alert-info").length > 0) $(".alert-info").css('background-image', 'none');
					self.toggleIconWeekendButtons();
				},

			};

			fullCalendarOptionsObj['customButtons'] = {};
			// vedo se devo aggiungere bottone di add. utilizzo proprietà "customButtons" del fullCalendar
			if (self.isInsertBtnVisible) {
				fullCalendarOptionsObj['customButtons'] = {
					addEventButton: {
						// text: localResource.maininsert + ' - ' + table.name, // visibile se non metto icona
						click: function () {
							self.insertClick(self);
						}
					}
				}
			}

			// inserisco bottone custom per mostrare/nascondere i weekend
			Object.assign(fullCalendarOptionsObj['customButtons'], {
				// no
				toggleWeekendn: {
					click: function () {
						self.toggleWeekend(self);
					}
				},
				// yes
				toggleWeekendy: {
					click: function () {
						self.toggleWeekend(self);
					}
				}
			});

			// se è list manager mostro prev e next per paginazione altriemnti quelli suoi di default next,prev
			if (self.isListManager) {
				fullCalendarOptionsObj.header.left = '';
				fullCalendarOptionsObj.header.center = 'title, goPrevButton,goNextButton';

				_.extend(fullCalendarOptionsObj['customButtons'], {
					goNextButton: {
						click: function () {
							self.goNextClick(self);
						}
					},
					goPrevButton: {
						click: function () {
							self.goPrevClick(self);
						}
					}
				});
			} else {
				// caso grid normale, mostro i bottoni di default per la navigazione
				fullCalendarOptionsObj.header.left = 'prev,next today';
				fullCalendarOptionsObj.header.center = 'title';
			}


			// se è abilitato drag n drop
			if (self.enableDragDrop) {

				fullCalendarOptionsObj['editable'] = true;// abilita drag and drop
				fullCalendarOptionsObj['eventDrop'] = function (event, delta, revertFunc) {
					self.eventDrop(event, delta, revertFunc);
				};
				fullCalendarOptionsObj['eventResize'] = function (event, delta, revertFunc) {
					self.eventResize(event, delta, revertFunc);
				};
			}

			// default nascondo weekend
			fullCalendarOptionsObj.weekends = this.weekendEnabled;

			return fullCalendarOptionsObj;

		},

        /**
         * calendar default not show minutes 00. So it calculates the string with the minutes.
         * @param event
         * @returns {string} return "hh:mm"
         */
		getEventTime: function (event) {
			try {
				if (!event.allDay) {
					return event.start.hours() + ":" + _.padStart(event.start.minutes(), 2, '0');
				}
				return '';
			} catch (e) {
				return "";
			}
		},

        /**
         * @method rowDblClickEv
         * @private
         * @description SYNC
         * @param {CalendarControl} that
         * @param {EventObject} event
         * @returns {Deferred}
         */
		rowDblClickEv: function (that, event) {
			if (that.timeoutId) {
				clearTimeout(that.timeoutId);
				that.timeoutId = null;
				Stabilizer.decreaseNesting("rowDblClickEv");
			}

			return Deferred("rowDblClickEv").from(that.rowDblClick(event));
		},


        /**
         * @method rowClickEv
         * @private
         * @description SYNC
         * @param {CalendarControl} that
         * @param {EventObject} event
         * @returns {Deferred}
         */
		rowClickEv: function (that, event) { //this è l'element
			// inserisco meccanismo con timeout per evitare che scatti CLICK + DBL_CLICK insieme
			if (that.timeoutId) {
				clearTimeout(that.timeoutId);
				that.timeoutId = null;
				Stabilizer.decreaseNesting("rowClickEv.timeout");
			}
			//console.log("increasing for Timeout");
			Stabilizer.increaseNesting("rowClickEv");
			that.timeoutId = setTimeout(function () {
				that.timeoutId = null;
				that.rowClick(event);
				Stabilizer.decreaseNesting("rowClickEv.timeout");
			}, appMeta.currApp.dbClickTimeout);
		},


        /**
         * @method rowDblClick
         * @private
         * @description SYNC
         * @param {event} event
         * @returns {Deferred}
         */
		rowDblClick: function (event) {
			// chiamo il rowClick con il this che è il tr che cliccato, + il that che è il Gridcontrol. Poi invoco il rowDblClick su MetaPage
			var self = this;
			return Deferred("rowDblClick")
				.from(self.rowClick(event)
					.then(function () {
						// solamente se è definito
						if (self.metaPage.rowDblClick) {
							// recupero riga dall'evento
							var row = event.row;
							self.metaPage.rowDblClick(self, self.dataTable, row);
						}
					}));
		},

        /**
         * @method rowClick
         * @private
         * @description SYNC
         * @param {EventObject} event
         * @returns {Deferred}
         */
		rowClick: function (event) {
			var self = this;
			// distinguo il doppio click s è o meno gestito come treeNavigator
			var row = event.row;
			var def = Deferred("rowClick");

			// TODO gestisci riga già selezionata
			if (this.metaPage) {
				this.metaPage.canSelect(this.dataTable, row)
					.then(function (result) {
						if (result) {
							return self.metaPage.rowSelect(self.el, self.dataTable, row)
								.then(function () {
									return def.resolve(true);
								})
						} else {
							return def.resolve(false);
						}
					});

			} else {
				return self.metaPage.rowSelect(self.el, self.dataTable, row)
					.then(function () {
						return def.resolve(true);
					})
			}

			return def;
		},

        /**
         * @method eventResize
         * @private
         * @description SYNC
         * Modifies the end hour of an event in week view
         * @param {EventObject} event
         * @param delta
         * @param revertFunc
         */
		eventResize: function (event, delta, revertFunc) {
			var self = this;
			// alert(event.title + " end is now " + event.end.format());
			var start = event.start;
			// se end non esiste , metto default 1 ora dallo start
			var end = event.end ? event.end : start.add(moment.duration(1, 'hours'));

			if (!event.mine) {
				revertFunc();
				return true;
			}

			return this.metaPage.showMessageOkCancel(localResource.getDoYouWantModifyEventResize(event.title, end.format("DD/MM/YYYY HH:mm")))
				.then(function (res) {
					if (res) {
						// bind valore sulla riga
						if (self.stopColumnName) {
							event.row[self.stopColumnName] = self.normalizeDatetime(end.toDate());
							return self.metaPage.freshForm();
						}
					} else {
						revertFunc();
						return true;
					}
				});
		},

        /**
         * @method eventDrop
         * @private
         * @description SYNC
         * Manages the drop event, ask to the user if event can be dropped and then drop it, saevng the new hour on the row binded to the datatabel
         * @param event
         * @param delta
         * @param revertFunc
         */
		eventDrop: function (event, delta, revertFunc) {
			var self = this;

			if (!event.mine) {
				revertFunc();
				return true;
			}

			// alert(event.title + " was dropped on " + event.start.format());
			var start = event.start;
			// se end non esiste , metto default 1 ora dallo start
			var end = event.end ? event.end : event.start.add(moment.duration(1, 'hours'));

			return this.metaPage.showMessageOkCancel(localResource.getDoYouWantModifyEvent(event.title, start.format("DD/MM/YYYY HH:mm"), end.format("DD/MM/YYYY HH:mm")))
				.then(function (res) {
					if (res) {
						// bind valore sulla riga
						event.row[self.startColumnName] = self.normalizeDatetime(start.toDate());
						if (self.stopColumnName) {
							event.row[self.stopColumnName] = self.normalizeDatetime(end.toDate());
							return self.metaPage.freshForm();
						}
					} else {
						revertFunc();
						return true;
					}
				});
		},

        /**
         * @method normalizeDatetime
         * @public
         * @description SYNC
         * Normalize a date to timeoffset, here I read from calendar, because the date get from calendar apply this offset
         * @param {Date} d
         * @returns {Date}
         */
		normalizeDatetime: function (d) {
			return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
		},

		// QUI INZIANO METODI DI INTERFACCIA Del CUSTOM CONTROL

        /**
         * @method fillControl
         * @public
         * @description ASYNC
         * Fills the control. First to fill it resets the events rect
         */
		fillControl: function (el) {
			var def = Deferred("calendar-fillControl");
			var self = this;
			var res = this.defDescribedColumn
				.then(function () {
					// ricarico eventi a partire dal datatable
					var myEvents = self.buildEvents(self.dataTable);
					$(self.el).fullCalendar('removeEvents');
					//Getting new event json data
					$(self.el).fullCalendar('addEventSource', myEvents);
					//Updating new events
					$(self.el).fullCalendar('rerenderEvents');
					//getting latest Events
					$(self.el).fullCalendar('refetchEvents');
				});

			return def.from(res).promise();

		},

        /**
         * Returns all the events on the calendar
         */
		getAllEvents: function () {
			return $(this.el).fullCalendar('clientEvents');
		},

        /**
         *
         * @param {{dt:DataTable, config:{}}[]} arrayDtConfig
         * @param objConfig
         */
		addExternalEvents: function (arrayDtConfig) {
			if (this.myEventsSourceSaved) $(this.el).fullCalendar('removeEventSource', this.myEventsSourceSaved);
			var self = this;
			var myEventsSource = _.reduce(arrayDtConfig, function (acc, obj) {
				return _.concat(acc, self.buildEvents(obj.dt, obj.config));
			}, []);

			$(this.el).fullCalendar('addEventSource', myEventsSource);
			this.myEventsSourceSaved = myEventsSource;
		},


        /**
         * @method getControl
         * @public
         * @description ASYNC
         */
		getControl: function () {
		},

        /**
         * @method clearControl
         * @public
         * @description ASYNC
         * Executes a clear of the control. It removes rows and set the index to -1 value.
         * @returns {Deferred}
         */
		clearControl: function () {
			var def = Deferred("calendar-clearControl");
			$(this.el).fullCalendar('removeEvents');
			$(this.el).fullCalendar('rerenderEvents');
			return def.resolve();
		},

        /**
         * @method addEvents
         * @public
         * @description ASYNC
         * @param {html node} el
         * @param {MetaPage} metaPage
         */
		addEvents: function (el, metaPage) {
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
			var def = Deferred("preFill-Grid");
			return def.resolve();
		},

        /**
         * @method getCurrentRow
         * @private
         * @description SYNC
         * @returns {{table: *, row: *}}
         */
		getCurrentRow: function () {
			// necessario per il metodo su MetaPage ,lo stesso che esegue ilgrid
			return {table: this.dataTable, row: this.currentRow };
		},

        /**
         * @method setCurrentRow
         * @private
         * @description SYNC
         * Used when the user click the event to set the current row. read from metapage with getCurrentRow() method
         * @param {ObjectRow} row
         */
		setCurrentRow: function (row) {
			// prm necessari alla metapage, gli stessi che utilizza il grid
			this.currentRow = row;
		},

		/**
		 * Return an obj, with key = value
		 * @param {DataRow} row
		 * @returns {*}
		 */
		buildObjCell:function(row) {
			var self = this;

			// la describeColumns ha descritto le colonne
			return _.chain(_.sortBy(this.dataTable.columns, 'listColPos'))
				// in base alle colonne  costruisce l'oggetto per popolare le celle nipoti
				.reduce(function (acc, dc) {
					if (!row.getRow) {
						return acc;
					}
					// filtro quelli che hanno listColPos e che hanno un valore
					if (dc.listColPos === -1 || !row[dc.name]) {
						return acc;
					}
					acc[dc.caption] = self.getEventStringCellFormatted(row, dc.name);
					return acc;
				}, {})
				.value();
		},

		/**
		 * @method getPopupInfo
		 * @private
		 * @description SYNC
		 * Build the text for info popup
		 * @param {EventObject} event
		 */
		getPopupInfo: function(event) {
			if (event.mine) {
				var obj = this.buildObjCell(event.row);
				return _.reduce(Object.keys(obj), function (acc, key) {
					acc += '<strong>' + key + '</strong>: ' + obj[key] + '<BR>';
					return acc;
				}, '');
			}
			return '<span>' + event.title + '</span>' ;
		},

        /**
         * @method infoClick
         * @private
         * @description SYNC
         * Fired on click event. It shows a dialog with info a some options
         * @param {EventObject} event
         */
		infoClick: function (event) {
			var self = this;
			var htmlInfo = '<div>';

			// mostra titolo se c'è , eventualmente vede se deve mettere link
			if (this.titleColumnName) {
				var title = this.getPopupInfo(event) ;
				if (utils.validURL(title)) {
					htmlInfo += '<a style="color: blue" target="_blank" href="' + title + '">' + title + '</a>';
				} else {
					htmlInfo += title;
				}
			}

			// mostra data inizio
			//verifico se si trata di un evento "tutto il giorno" allora tolgo l'ora
			if (!event.end) {
				var startdate = moment(event.start).format("DD/MM/YYYY");
				htmlInfo += '<br><span><strong>' + localResource.date + ':  </strong>' + startdate + '</span>';
			} else {
				var startdate = moment(event.start).format("DD/MM/YYYY HH:mm");
				htmlInfo += '<br><span><strong>' + localResource.start + ':  </strong>' + startdate + '</span>';
			}

			// mostra data fine
			if (/*this.stopColumnName &&*/ event.end) {
				var stopdate = moment(event.end).format("DD/MM/YYYY HH:mm");
				htmlInfo += '<br><span><strong>' + localResource.end + ':  </strong>' + stopdate + '</span>';
			}

			// aggiungo bottoni di editing se esistono
			htmlInfo += '<br>';
			var currid = utils.getUniqueId();
			if (event.mine) {
				if (this.isDeleteBtnVisible) htmlInfo += '<span id="' + currid + 'deleteon" ><i class="fa fa-trash" style="cursor:pointer"></i></span>';
				if (this.isEditBtnVisible) htmlInfo += '<span id="' + currid + 'editon">&nbsp;&nbsp;<i class="fa fa-edit" style="cursor:pointer"></i></span>';
			}

			htmlInfo += '</div>';

			// mostro dialog
			this.dialogEvent = $('<div></div>');

			this.dialogEvent.dialog({
				modal: true,
				autoResize: true,
				title: localResource.infoevent,
				open: function () {
					// inserisco qui html ad -hoc e associo handler solo dopo averlo aggiungo nell'html
					$(this).html(htmlInfo);
					$(this).find("#" + currid + "deleteon").on("click", _.partial(self.deleteClick, event, self));
					$(this).find("#" + currid + "editon").on("click", _.partial(self.editClick, event, self));
				},
				position: { my: "center bottom", at: "center center", of: window }
			});
		},

        /**
         * @method editClick
         * @private
         * @description SYNC
         * Event triggered on the click on the edit button on the event rect
         * @param {EventObject} event of the FullCalendar component
         * @param {CalendarControl} that
         */
		editClick: function (event, that) {
			// chiudo dialog di opzioni
			if (that.dialogEvent) that.dialogEvent.dialog('close');
			that.setCurrentRow(event.row); // imposto la currentrow, perchè poi la metaPage leggerà tramite il getCurrentRow()
			return that.metaPage.editClick(that.metaPage, that);
			// alert("edit riga " + JSON.stringify(event.row));
		},

        /**
         * @method deleteClick
         * @private
         * @description SYNC
         * Event triggered on the click on the delete button on the event rect
         * @param {EventObject} event
         * @param {CalendarControl} that
         */
		deleteClick: function (event, that) {
			// chiudo dialog di opzioni
			if (that.dialogEvent) that.dialogEvent.dialog('close');
			that.setCurrentRow(event.row);
			return that.metaPage.deleteClick(that.metaPage, that);
			// alert("delete riga " + JSON.stringify(event.row));
		},

        /**
         * @method insertClick
         * @private
         * @description SYNC
         * Event triggered on the click on the add button on header
         * @param {CalendarControl} that
         * @returns {*|Deferred}
         */
		insertClick: function (that) {
			return that.metaPage.insertClick(that.metaPage, that);
		},

        /**
         * @method goNextClick
         * @private
         * @description SYNC
         * Manages the custom next button, used in the pagination
         * @param {CalendarControl} that
         */
		goNextClick: function (that) {
			// vado avanti di 1 mese
			$(that.el).fullCalendar('next');
			// invoco su metaPage che in questo cas è il ListManagerCalendar
			return that.metaPage.goNextClick(that);
		},

        /**
         * @method goPrevClick
         * @private
         * @description SYNC
         * Manages the custom next button, used in the pagination
         * @param {CalendarControl} that
         */
		goPrevClick: function (that) {
			$(that.el).fullCalendar('prev');
			// invoco su metaPage che in questo cas è il ListManagerCalendar
			return that.metaPage.goPrevClick(that);
		},

        /**
         * @method toggleWeekend
         * @private
         * @description SYNC
         */
		toggleWeekend: function () {
			var weekends = $(this.el).fullCalendar('option', 'weekends');
			// toogle weekend , lancia un viewRender, sul quale gestisco l'icona, vedi metodo toggleIconWeekendButtons
			$(this.el).fullCalendar('option', { weekends: !weekends });
		},

        /**
         * @method toggleIconWeekendButtons
         * @private
         * @description SYNC
         */
		toggleIconWeekendButtons: function () {
			var weekends = $(this.el).fullCalendar('option', 'weekends');
			// a seconda del valore booleano mostro/nascondo bottone con relativa icona
			if (weekends) {
				$(this.el).find(".fc-toggleWeekendy-button").hide();
				$(this.el).find(".fc-toggleWeekendn-button").show();
			} else {
				$(this.el).find(".fc-toggleWeekendy-button").show();
				$(this.el).find(".fc-toggleWeekendn-button").hide();
			}
		}

	};

	window.appMeta.CustomControl("calendar", CalendarControl);

}());
