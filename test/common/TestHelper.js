(function () {
	var stabilizeToCurrent = appMeta.stabilizeToCurrent;
	var common = appMeta.common;
	var dataRowState = jsDataSet.dataRowState;
	var controlTypeEnum = {
		inputText: "inputText",
		inputRadio: "inputRadio",
		inputCheck: "inputCheck",
		select: "select",
		inputAutoChoose: "inputAutoChoose",
		grid: "grid",
		textarea: "textarea",
		checklist: "checklist",
		upload: "upload",
		uploadwin: "uploadwin",
		calendar: "calendar",
		gridsearch: "gridsearch",
		dropdowngrid: "dropdowngrid",
		customFunction: "customFunction",
		command: "command",
		openPage: "openPage",
		buttonInsert: "buttonInsert",
		treecustom: "treecustom"
	};

	var EnumLogType = {
		log: 0,
		warn: 1,
		err: 2
	};

	function TestHelper() {
	}

	TestHelper.prototype = {
		constructor: TestHelper,

        /**
         * @method initAppTests
         * @public
         * @description SYNC
         * Initializes the appMeta for the test app.
         * @param {string} pathRelativeOfTest string that indicates the relative path from spec_e2e_app/ for the specific MetaPage of the test
         */
		initAppTests: function (pathRelativeOfTest) {

			// inizializzo per ogni test l'oggetto appMeta
			appMeta.basePath = 'base/';

			// inserisco html con il "metaRoot"
			setFixtures("<h3>My App Test</h3><div id='toolbar'></div><div id='metaRoot'></div>");
			$("body").append('<link rel="stylesheet" href="base/app/styles/bootstrap/css/bootstrap.css" />');
			$("body").append('<link rel="stylesheet" href="base/app/styles/app.css" />');
			appMeta.toolBarManager = null;
			appMeta.initToolBarManager();
			// rebase del path poichè i file necessari per il test, in particolare la MetAPage derivata sta sotto base/test/spec_e2e_app/registry
			appMeta.basePath = 'base/test/spec_e2e_app/' + pathRelativeOfTest + '/';
			appMeta.rootElement = "#metaRoot";
			appMeta.metaPages = []; // rinizializzo array di MetaPage e Html, altrimenti ad ogni test non posso usare stesso tableName ed EditType, prenderebbe steso .js e .html 
			appMeta.htmlPages = [];
			appMeta.globalEventManager = new appMeta.EventManager();
			// N.B non c'è bisogno passa per il proxy di Karma. (vedi nel Karma_e2e_app.conf.js
			//appMeta.routing.changeUrlMethods("http://localhost:54471");
		},

        /**
         * Initializes the appMeta for the production apps.
         * @param {string} appfolder, folder name of the app. Assumes that the folder is on the root of the client project
         */
		initAppTestProduction: function (appfolder) {
			// inizializzo per ogni test l'oggetto appMeta
			appMeta.appMain = {}; // inizializza oggetto appMain che in test non verrebbe tirato su

			//nell'ambiete di Quality Assurance attivo il log al livello debug altrimento lascio quello di produzione ERROR
			appMeta.logger.levelLog = appMeta.logTypeEnum.DEBUG;

			// registra ws utilizzato in app_segreterie metaPage perfvalutazionepersonale_default
			appMeta.routing.builderConnObj("calcolaComportamenti", 'POST', 'performance', false, true);

			appMeta.basePath = 'base/';
			appMeta.config.backendType = '.net';
			appMeta.routing.backendUrl = "http://localhost:54471";
			appMeta.config.env = appMeta.config.envEnum.QA;
			// rebase del path poichè i file necessari per il test, in particolare la MetaPage derivata sta sotto base/<pathapp>
			appMeta.basePathMetadata = 'base/' + appfolder + '/metadata/';
			appMeta.config.path_maintoolBarTemplate = "components/userTemplate/mainToolBar_Template.html";
			appMeta.config.defaultDecimalFormat = 'n';
			appMeta.config.defaultDecimalPrecision = 2;
			appMeta.config.dataContabileYear = (new Date()).getFullYear();
			appMeta.config.codiceDipartimento = 'amministrazione';
			appMeta.config.virtualUserUserKind = 3;


			// appMeta.config.enableSearchLikeOnTextBox = true;
			// inserisco elemento con id "teste2e_mp_id" in modo da popolarlo con info utili tramite il metodo setMetaPageTitleOnTestHtml()
			setFixtures("<body class='bg-light'><h3>App " + appfolder + " - TEST e2e automatici</h3><h5 id='teste2e_mp_id'></h5><div id='toolbar'></div><div class='container' id='metaRoot'></div></body>");
			// importo css per corretta visualizzazione sul browser in questione durante il running del test
			$("body").append('<link rel="stylesheet" href="base/' + appfolder + '/styles/italia/bootstrap-italia.min.css" />');
			$("body").append('<link rel="stylesheet" href="base/' + appfolder + '/styles/italia/italia-icon-font.css" />');
			$("body").append('<link rel="stylesheet" href="base/' + appfolder + '/styles/custom.css" />');
			$("body").append('<link rel="stylesheet" href="base/components/styles/app.css" />');
			$("body").append('<link rel="stylesheet" href="base/components/styles/jquery.toast.css" />');
			$("body").append('<link rel="stylesheet" href="base/components/styles/select2.min.css" />');
			// Configurazioni generali
			appMeta.rootElement = "#metaRoot";
			// ad ogni test rinizializzo la toolbar
			appMeta.toolBarManager = null;
			appMeta.start();
		},

        /**
         * Show the MetaPage on fixture app html test. Useful when test is launched on browser, to see what metpage is testing
         * @param {string} tname is the table name
         * @param {string} edittype is the  edit type of metapage
         * @param {string} fname name of the function, that calls the method
         */
		setMetaPageTitleOnTestHtml: function (tname, edittype, fname) {
			$('#teste2e_mp_id').text("MetaPage: " + tname + "_" + edittype + ". test: " + fname);
			this.buildFakeMenuWeb(tname, edittype);
		},

		/**
		 * I bottoni di editing dipendono dalle usr env. in base alla voce di menù quindi all'idmenuweb
		 * si accede alle var mw_* e mr_* per spegnere i bottoni. E' usato su MetaSegreteriePage, quindi creo un dt fake così è sincrono
		 * @param tname
		 * @param edittype
		 */
		buildFakeMenuWeb: function(tname, edittype) {
			var dtMenuWeb = new jsDataSet.DataTable('menuweb');
			dtMenuWeb.setDataColumn("tableName", "String");
			dtMenuWeb.setDataColumn("editType", "String");
			dtMenuWeb.setDataColumn("idmenuweb", "String");
			var idmenuweb = "99999";
			// creo fake row
			var objrow1 = { tableName: tname, editType: edittype, idmenuweb: idmenuweb };
			// per pagine custom
			var objrow2 = { tableName: "didprogcurr", editType: "default", idmenuweb: idmenuweb };
			var objrow3 = { tableName:"fasciaiseedef", editType: "default", idmenuweb: idmenuweb };
			var objrow3 = { tableName:"fasciaiseedef", editType: "more", idmenuweb: idmenuweb };
			var objrow4 = { tableName:"fasciaiseedef", editType: "sconti", idmenuweb: idmenuweb };
			dtMenuWeb.add(objrow1);
			dtMenuWeb.add(objrow2);
			dtMenuWeb.add(objrow3);
			dtMenuWeb.add(objrow4);
			dtMenuWeb.acceptChanges();
			// assegno fake dtMenuWeb
			appMeta.security.dtMenuWeb = dtMenuWeb;

			// inserisco fake usr_envche matcha con la riga dtMenuWeb
			appMeta.security.usr("mw_" + idmenuweb, "'S'");
			appMeta.security.usr("mr_" + idmenuweb, "'S'");
		},

        /**
         * @method waitPageLoaded
         * @public
         * @description ASYNC
         * Subscribes an event triggered by the appMeta object. When the callback is invoked it unsubscribes the event and resolves the deferred.
         * Used in test case to wait the load of a metaPage
         * @param {string} eventName
         * @returns {Deferred}
         */
		waitPageLoaded: function (eventName) {
			var def = $.Deferred();
			var that = this;
			var f = function () {
				appMeta.globalEventManager.unsubscribe(eventName, f, that);
				// arguments[0] è il sender, ovvero la metaPage che ha lanciato l'evento
				def.resolve(arguments[0]);
			};
			appMeta.globalEventManager.subscribe(eventName, f, that);
			return def;
		},

        /**
         * @method testMetaPageInitialization
         * @public
         * @description SYNC
         * Tests if the MetaPage is correctly initialized. Checks the main object of the metaPage
         * @param {MetaPage}  metaPage
         * @param {string} tableName
         * @param {string} editType
         */
		testMetaPageInitialization: function (metaPage, tableName, editType) {

			expect(appMeta.currentMetaPage).toBeDefined();

			// verifico Stato e DataSet presente
			expect(metaPage.state).toBeDefined();
			expect(metaPage.state.DS).toBeDefined();
			expect(metaPage.state.DS.tables[tableName]).toBeDefined();

			// verifico inizializzazione oggetti principali
			expect(metaPage.helpForm).toBeDefined();
			expect(metaPage.primaryTableName).toBe(tableName);
			expect(metaPage.editType).toBe(editType);
			expect(metaPage.detailPage).toBeDefined();
		},

        /**
         * @method htmlNodeByTagExists
         * @public
         * @description SYNC
         * Tests if exist an html node with data-tag attribute "tag"
         * @param {string} tag
         * @param {string} htmlTagType. html tag, can be input, div, select, etc..
         */
		htmlNodeByTagExists: function (tag, htmlTagType) {
			if (!htmlTagType) htmlTagType = "input";
			expect($(htmlTagType + "[data-tag='" + tag + "']").length).toBe(1);
		},

        /**
         * @method htmlNodeByTagExists
         * @public
         * @description SYNC
         * Tests if exist an html node with a css class "className"
         * @param {string} className
         */
		htmlNodeByClassExists: function (className) {
			expect($("." + className).length).toBe(1);
		},

        /**
        * @method htmlNodeByClassNotExists
        * @public
        * @description SYNC
        * Tests if not exist an html node with a css class "className"
        * @param {string} className
        */
		htmlNodeByClassNotExists: function (className) {
			expect($("." + className).length).toBe(0);
		},

        /**
         * @method htmlNodeByTagValueFilled
         * @public
         * @description SYNC
         * Checks if the element with data-tag "tag" has a value
         * @param {string} tag
         */
		htmlNodeByTagValueFilled: function (tag) {
			expect($("input[data-tag='" + tag + "']").val()).not.toBe(""); // non vuoto
		},

        /**
         * @method htmlNodeByTagNotFilled
         * @public
         * @description SYNC
         * Checks if the element with data-tag "tag" has not a value. It has an empty string
         * @param {string} tag
         */
		htmlNodeByTagNotFilled: function (tag) {
			expect($("input[data-tag='" + tag + "']").val()).toBe(""); // vuoto
		},

        /**
         * @method htmlNodeByTagValue
         * @public
         * @description SYNC
         * Checks if the element with data-tag "tag" has value "value"
         * @param {string} tag
         * @param {string} value
         */
		htmlNodeByTagValue: function (tag, value) {
			expect($("input[data-tag='" + tag + "']").val()).toBe(value);
		},

        /**
         * @method insertValueInputByTag
         * @public
         * @description SYNC
         * @param {string} tag
         * @param {string} value
         */
		insertValueInputByTag: function (tag, value) {
			$("input[data-tag='" + tag + "']").val(value);
		},

        /**
         * 
         * @param {string} tag
         * @param {boolean} ischecked
         */
		checkRadioByTag: function (tag, ischecked) {
			$("input[data-tag='" + tag + "']").prop("checked", ischecked);
			// forzo indeteminato false, così i casi indeterminati jquery li mette subito secondo isChecked
			$("input[data-tag='" + tag + "']").prop("indeterminate", false);
		},

        /**
         *
         * @param {string} tag
         * @returns {number|jQuery}
         */
		getLengthValueByTag: function (tag) {
			return $("input[data-tag='" + tag + "']").val().length;
		},

        /**
         * Returns a value of an input html element by its "tag"
         * @param {string} tag
         * @returns {string}
         */
		getValueByTag: function (tag) {
			return $("input[data-tag='" + tag + "']").val();
		},



		/** INIT REGION FOR THE EVENTS **/

        /**
         * @method clickButtonByTag
         * @public
         * @description SYNC
         * Invokes click() event on button element with data-tag attribute "tagCmd"
         * @param {string} tagCmd
         */
		clickButtonByTag: function (tagCmd, detailLog) {
			this.log("Comando invocato : " + tagCmd + " " + (!!detailLog ? detailLog : ""));
			$("button[data-tag='" + tagCmd + "']")[0].click();
		},

        /**
         * @method clickButtonByCssClass
         * @public
         * @description SYNC
         * Invokes click() event on element with css class "className"
         * @param {string} className. the css class
         */
		clickButtonByCssClass: function (className) {
			$('.' + className)[0].click();
		},

        /**
         * Triggers a blur() event on input
         * @param {string} tag
         */
		inputLostFocus: function (tag) {
			$("input[data-tag='" + tag + "']")[0].blur();
		},

        /**
         * Triggers a focus() event on input
         * @param {string} tag
         */
		inputGotFocus: function (tag) {
			$("input[data-tag='" + tag + "']")[0].focus();
		},

        /**
         * @method testHtmlNodeByTagExists
         * @public
         * @description SYNC
         * Checks if the controls, specified in "arrayInput" exist or not, depending on "mustExist"
         * @param {Array} arrayInput a js object {value:string, tag:string, type:controlTypeEnum}
         * @param {boolean} mustExist. If true verifies that all inputs exist on the page, if false inputs must not be present  
         */
		testHtmlNodeByTagExists: function (arrayInput, mustExist) {
			var self = this;
			_.forEach(arrayInput, function (input) {
				switch (input.type) {
					case controlTypeEnum.inputCheck:
					case controlTypeEnum.inputText:
					case controlTypeEnum.inputRadio:
					case controlTypeEnum.select:
					case controlTypeEnum.inputAutoChoose:
					case controlTypeEnum.grid:
					case controlTypeEnum.checklist:
					case controlTypeEnum.upload:
					case controlTypeEnum.uploadwin:
					case controlTypeEnum.calendar:
					case controlTypeEnum.gridsearch:
					case controlTypeEnum.treecustom:
					case controlTypeEnum.dropdowngrid:
						var selector = $("[data-tag='" + input.tag + "']");
						if (mustExist) {
							if (selector.length === 0) {
								self.log('ERRORE: tag non esistente ' + input.tag, EnumLogType.err);
							}
							if (selector.length > 1) {
								self.log('ERRORE: tag ripetuto più di una volta' + input.tag, EnumLogType.err);
							}
							expect(selector.length).toBe(1);

						}
						if (!mustExist) {
							if (selector.length > 0) {
								self.log('ERRORE: tag inatteso ' + input.tag, EnumLogType.err);
							}
							expect(selector.length).toBe(0);
						}
						break;
				}
			});
		},


        /**
         * @method testHtmlNodeByTagFilledValue
         * @public
         * @description SYNC
         * Checks if controls, specified in "arrayInput" have the "value" equals to the value configured
		 * and if the dataset has the values expected based on those configured on input array
         * @param {Array} arrayInput arrayInput a js object {value:string, tag:string, type:controlTypeEnum}
		 * @param {MetaPage} metapage the current metaPage
         */
		testHtmlNodeByTagFilledValue: function (arrayInput, metapage, afterCheckTree) {
			// check dei valori sul ds bindato
			this.testHtmlNodeByTagBindedDataSet(arrayInput, metapage, undefined, undefined, afterCheckTree);
			// check dei valori sui controlli grafici
			this.testHtmlNodeByTagFilledCtrl(arrayInput, metapage);
		},

		/**
		 * @method testHtmlNodeByTagBindedDataSet
		 * @private
		 * @description SYNC
		 * Checks if the dataset has the values expected based on those configured on input array
		 * @param {Array} arrayInput
		 * @param {MetaPage} metapage
		 * @param {string} treal
		 * @param {string} talias
		 */
		testHtmlNodeByTagBindedDataSet: function (arrayInput, metapage, treal, talias ,afterCheckTree, recursive) {
			var self = this;

			// funzione ausiliaria che dal tag recupera il valore nel dataset e verifica correttezza con quello inserito preso da vett di config
			function checkInputText(elInputText) {
				var tag = metapage.helpForm.getStandardTag(elInputText.tag);
				var tagArray = tag.split(".");
				var tableName = tagArray[0];
				var columnName = tagArray[1];

				if (tableName !== treal && tableName !== talias) {
					//caso in cui sto esplorando il tag di un campo affogato nella pagina che non è della tabella principale
				}
				else {
					//il dataset non ha mai alias nella riga principale nelle subpage, anche se si raggiungono da una grid che nella interfaccia principale è riferita ad una tabella con alias.
					tableName = treal === talias ? tableName : talias;
				}

				var dt = metapage.state.DS.tables[tableName];
				if (!dt) {
					self.log("La tabella nel tag " + elInputText.tag + " non esiste sul dataset ", EnumLogType.err);
					return; // esco da iterazione
				}
				if (dt.rows.length) {
					var row = dt.rows[dt.rows.length - 1];
					// recupero il valore come dovrebbe essere stato inserito sul dt
					// faccio il compelteTag poichèanche il framework lo fa.

					if (!dt.columns[columnName]) {
						self.log("La tabella nel ds, del tag " + elInputText.tag + " non ha la colonna " + columnName, EnumLogType.err);
					}
					else {
						var completeTag = metapage.helpForm.completeTag(tag, dt.columns[columnName]);
						var ctype = dt.columns[columnName].ctype;
						var value = new appMeta.TypedObject(ctype, elInputText.value, completeTag).value;
						if (ctype === "DateTime") {
							expect(row[columnName].getDate()).toBe(value.getDate());
							expect(row[columnName].getMonth()).toBe(value.getMonth());
							expect(row[columnName].getFullYear()).toBe(value.getFullYear());
							if (row[columnName].getDate() !== value.getDate()) {
								self.log('ERRORE: nella tabella ' + tableName + ' la riga presente non ha nel campo ' + columnName + ' il valore atteso giorno' + value, EnumLogType.err);
							}
							if (row[columnName].getMonth() !== value.getMonth()) {
								self.log('ERRORE: nella tabella ' + tableName + ' la riga presente non ha nel campo ' + columnName + ' il valore atteso mese ' + value, EnumLogType.err);
							}
							if (row[columnName].getFullYear() !== value.getFullYear()) {
								self.log('ERRORE: nella tabella ' + tableName + ' la riga presente non ha nel campo ' + columnName + ' il valore atteso anno ' + value, EnumLogType.err);
							}
						} else {
							expect(row[columnName]).toBe(value);

							if (row[columnName] !== value) {
								self.log('ERRORE: nella tabella ' + tableName + ' la riga presente non ha nel campo ' + columnName + ' il valore atteso ' + value + ' ma è ' + row[columnName], EnumLogType.err);
							}
						}
					}
				} else {
					self.log("La tabella nel tag " + elInputText.tag + " non ha righe!", EnumLogType.warn);
				}
			}

			// funzione ausiliaria che dal tag recupera il valore nel dataset e verifica il num di righe e i valori attesi
			// prm elName può essere "grid" o "calendar". utilizzato solamente nei messaggi stringa
			function checkInputGridOrCalendar(elInput, elName) {
				// verifico contenuto della riga dati aggiunta
				// 1. recupero tabella dal tag
				var tagArray = elInput.tag.split(".");
				var detailTableName = tagArray[0];
				var detailEditType = tagArray[2];
				var dt = metapage.state.DS.tables[detailTableName];
				if (!dt) {
					self.log("La tabella nel tag del " + elName + " " + elInput.tag + " non esiste sul dataset", EnumLogType.warn);
					return true; // esco da iterazione
				}

				var ctrl = $("[data-tag='" + elInput.tag + "']");

				// recupero il controllo del bottone, sul quale invocare il click()
				var isInsertBtnVisible = metapage.helpForm.existsDataAttribute(ctrl, "mdlbuttoninsert");
				if (!isInsertBtnVisible) {
					self.log('Il controllo ' + elName + " " + elInput.tag + " non ha il bottone add, quindi non controllo se ci sono righe nel check dataset!", EnumLogType.log);
				} else {
					// numero righe è quello atteso anche su dt del ds
					var len = elInput.rows || 1;

					var rowsToCount = dt.rows.length;
					// se sto in un tree, potrei aver caricato anche altri figli. quindi controllo solo quelli della riga principale
					if (afterCheckTree) {
						rowsToCount = metapage.state.currentRow.getRow().getChildInTable(detailTableName).length;
					}

					expect(rowsToCount).toBe(len);
					if (rowsToCount !== len) {
						self.log("ATTENZIONE: Il controllo " + elName + " " + detailTableName + " ha sul dataset righe " + rowsToCount + " metre ne aspetto " + len, EnumLogType.err);
					} else {
						self.log("OK: La tabella " + detailTableName + " nel  " + elName + " " + elInput.tag + " ha sul dataset " + rowsToCount + " righe attese", EnumLogType.info);
					}

					// trattandosi di grid o calendar vado ricosivamente a fare check dei dati, in base ai valori che ho inseirto tramite vettore di config
					if (rowsToCount) {
						// 2.  recupero valori del vettore di configurazione del dettaglio per capire quali valori avevo inserito
						var detailTableNameReal = metapage.state.DS.tables[detailTableName].tableForReading();
						var detailTestPrototype = 'appMeta.' + detailTableNameReal + '_' + detailEditType;
						var myinstance = eval(detailTestPrototype);
						if (!myinstance) {
							self.log(detailTestPrototype + " non trovato durante check valori di riga del " + elName + " " + elInput.tag, EnumLogType.warn);
						} else {
							var arrayInputDetail = myinstance.arrayInput;
							self.testHtmlNodeByTagBindedDataSet(arrayInputDetail, metapage, detailTableNameReal, detailTableName, afterCheckTree, true);
						}
					}
				}
			}

			function checkTreeCustom(elInput, isRootAndChild) {
				var tagArray = elInput.tag.split(".");
				var detailTableName = tagArray[0];
				var detailEditType = tagArray[2];
				var dtTree = metapage.state.DS.tables[detailTableName];
				if (!dtTree) {
					self.log("La tabella nel tag del treecustom " + elInput.tag + " non esiste sul dataset", EnumLogType.warn);
					return true; // esco da iterazione
				}

				var autoChildRelation = appMeta.getDataUtils.getAutoChildRelation(dtTree);
				var childCols = autoChildRelation.childCols;
				var parIdTreeColumnName = childCols[0];

				var rows = dtTree.rows;
				var rowRoot = rows[0];
				expect(rowRoot[parIdTreeColumnName]).toBe(9999999);
				expect(rowRoot.getRow().state).toBe(dataRowState.unchanged);
				if (rowRoot[parIdTreeColumnName] !== 9999999) {
					self.log("La tabella nel tag del treecustom " + elInput.tag + " ha la root non standard, non ha 9999999", EnumLogType.err);
				}
				// il test all'inizio inserisce solo la root. nel save successivo invece anche 1 figlio.
				// quindi da fuori è chiamata con prm onlyRoot a seconda della fase
				var expectedRows = 1;
				if (isRootAndChild) {
					expectedRows = 2;
					// root più nodo figlio
				}
				// verifico solo la root
				expect(rows.length).toBe(expectedRows);
				if (rows.length !== expectedRows) {
					self.log("La tabella nel tag del treecustom " + elInput.tag + " si aspettava " + expectedRows + " righe root", EnumLogType.err);
				} else {
					self.log("OK: La tabella " + detailTableName + " nel  tree " + elInput.tag + " ha sul dataset " + rows.length + " righe attese", EnumLogType.info);
				}
			}

			function checkDropDownGrid(elInput, mp) {
				var tagArray = elInput.tag.split(".");
				var tname = tagArray[0];
				var cname = tagArray[1];
				var val = mp.state.DS.tables[tname].rows[0][cname];
				// --> expect(val).toBe(elInput.value);
				if (val !== elInput.value) {
					self.log("ATTENZIONE: Il controllo dropdowngrid " + tname + "  ha sulla tabella un valore differente. ho inserito " + elInput.value + " invece c'è " + val, EnumLogType.warn);
				} else {
					self.log("OK: La tabella " + tname + " nel dropdowngrid " + elInput.tag + " ha sulla tabella il valore atteso", EnumLogType.info);
				}
			}

			// loop sui valori del vett di config
			_.forEach(arrayInput, function (input) {
				switch (input.type) {
					case controlTypeEnum.textarea:
					case controlTypeEnum.inputText:
						checkInputText(input);
						break;
					case controlTypeEnum.select:
						break;
					case controlTypeEnum.inputCheck:
					case controlTypeEnum.inputRadio:
						break;
					case controlTypeEnum.inputAutoChoose:
						break;
					case controlTypeEnum.grid:
						checkInputGridOrCalendar(input, controlTypeEnum.grid);
						break;
					case controlTypeEnum.checklist:
						break;
					case controlTypeEnum.upload:
						break;
					case controlTypeEnum.treecustom:
						checkTreeCustom(input, afterCheckTree);
						break;
					case controlTypeEnum.calendar:
						checkInputGridOrCalendar(input, controlTypeEnum.calendar);
						break;
					case controlTypeEnum.gridsearch:
						break;
					case controlTypeEnum.dropdowngrid:
						// solamente nel caso che sto sulla principale controllo. altrimenti devo prendere la tabella che sta nel ds figlio.
						if(!recursive) {
							//checkDropDownGrid(input, metapage);
						}
						break;
				}
			});
		},


		/**
		 * @method testHtmlNodeByTagFilledCtrl
		 * @private
		 * @description SYNC
		 * Checks if controls, specified in "arrayInput" have the "value" equals to the value configured
		 * @param {Array} arrayInput
		 * @param {MetaPage} metapage
		 * @param {Array} nodeToExclude. Array of element to exclude for the insert
         */
		testHtmlNodeByTagFilledCtrl: function (arrayInput, metapage, nodeToExclude) {
			var self = this;
			nodeToExclude = nodeToExclude || []; // se non è passato inizializzo ad array vuoto, quindi nessuno da escludere
			_.forEach(arrayInput, function (input) {

				// se non devo considerarlo in insert, vado prossima iterazione
				if (_.includes(nodeToExclude, input.type)) return true;

				switch (input.type) {
					case controlTypeEnum.textarea:
						expect($("textarea[data-tag='" + input.tag + "']").val()).toBe(input.value.toString());
						break;
					case controlTypeEnum.inputText:
						expect($("input[data-tag='" + input.tag + "']").val()).toBe(input.value.toString());
						break;
					case controlTypeEnum.select:

						if (input.value) {
							expect($("select[data-tag='" + input.tag + "']").val()).toBe(input.value.toString());
						} else {
							self.log("combo " + input.tag + " aveva un input.value nullo");
						}

						break;
					case controlTypeEnum.inputCheck:
					case controlTypeEnum.inputRadio:
						expect($("input[data-tag='" + input.tag + "']").prop("checked")).toBe(!!input.value);
						break;
					case controlTypeEnum.inputAutoChoose:
						expect($("input[data-tag='" + input.tag + "']").val()).toBe(input.value.toString());
						if ($("input[data-tag='" + input.tag + "']").val() !== input.value.toString())
							self.log('ERRORE: Il controllo ' + input.tag + ' contiene ' + $("input[data-tag='" + input.tag + "']").val() + ' ma mi aspettavo ' + input.value.toString(),
								EnumLogType.err);
						break;
					case controlTypeEnum.dropdowngrid:
						expect($("input[data-tag='" + input.tag + "']").val()).toBe(input.value.toString());
						if ($("input[data-tag='" + input.tag + "']").val() !== input.value.toString())
							self.log('ERRORE: Il controllo ' + input.tag + ' contiene ' + $("input[data-tag='" + input.tag + "']").val() + ' ma mi aspettavo ' + input.value.toString(),
								EnumLogType.err);
						break;
					case controlTypeEnum.grid:
						var gridCtrl = $("[data-tag='" + input.tag + "']");

						// recupero il controllo del bottone, sul quale invocare il click()
						var isInsertBtnVisible = metapage.helpForm.existsDataAttribute(gridCtrl, "mdlbuttoninsert");
						if (!isInsertBtnVisible) {
							self.log('La griglia ' + input.tag + " non ha il bottone add, quindi non controllo se ci sono righe!", EnumLogType.log);
						} else {
							// verifica l'esistenza delle righe + 1 di header
							var len = input.rows || 1;
							var checkTr = "tr:not([data-mdlgrouped]):not(.table-in-cell-tr)";
							expect(gridCtrl.find(checkTr).length).toBe(len + 1);
							if (gridCtrl.find(checkTr).length < len + 1)
								self.log('ERRORE: numero di righe inferiore a quello atteso nella grid ' + input.tag, EnumLogType.err);

							// verifico contenuto della riga dati aggiunta su html

							// 1. recupero tabella dal tag
							var tagArray = input.tag.split(".");
							var detailTableName = tagArray[0];
							var detailEditType = tagArray[2];
							var dt = metapage.state.DS.tables[detailTableName];

							// numero righe è quello atteso anche su dt del ds
							// se sto in un tree, potrei aver caricato anche altri figli. quindi controllo solo quelli della riga principale
							// var rowsToCount = dt.rows.length;
							var rowsToCount = metapage.state.currentRow.getRow().getChildInTable(detailTableName).length;
							expect(rowsToCount).toBe(len);
							// effettuo check dei dati, in base ai valori che ho inserito tramite vettore di config

							if (rowsToCount === len) {

								var detailTableNameReal = metapage.state.DS.tables[detailTableName].tableForReading();
								// 2.  recupero valori del vettore di configurazione del dettaglio per capire quali valori avevo inserito
								var detailTestPrototype = 'appMeta.' + detailTableNameReal + '_' + detailEditType;
								var myinstance = eval(detailTestPrototype);
								if (!myinstance) {
									self.log(detailTestPrototype + " non trovato durante check valori di riga del grid");
								} else {

									var arrayInputDetail = myinstance.arrayInput;
									// per ogni elemento del vett prendo tag e recupero tablename per quelli che posso verificare cioè input combo e radio e checkbox
									_.forEach(arrayInputDetail, function (elArr) {

										// check dei valori inseriti nei campi text semplici.
										if (elArr.type === controlTypeEnum.inputText ||
											elArr.type === controlTypeEnum.textarea) {
											var tagArray = elArr.tag.split(".");
											var tNameElement = tagArray[0];
											var fNameElement = tagArray[1];
											// osservo il valore presente sul dt del ds di pagina. quindi se il controllo ha il tag con la tabella attesa
											if (tNameElement === detailTableName) {
												// controllo anche il valore sul grid html
												var checkTr = "tr:not([data-mdlgrouped]):not(.table-in-cell-tr)";
												gridCtrl.find(checkTr).each(function () {
													var $row = $(this);
													var $elments = $row.find("td");
													// scorro le celle e recupero quella in cui la colonna è quella corrente sotto esame
													$elments.each(function () {
														var columnname = $(this).data("mdlcolumnname");
														// osserva se è il td è quello che interessa
														if (fNameElement === columnname) {
															// recupero i 2 valori da confrontare. uno su html, l'altro lo stringValue() della cella nel dt.
															var tdvalue = $(this).html();
															var completeTag = metapage.helpForm.completeTag(elArr.tag, dt.columns[fNameElement]);
															var tdvalueinserted = new appMeta.TypedObject(dt.columns[fNameElement].ctype, elArr.value, completeTag).stringValue(completeTag);
															expect(tdvalue).toBe(tdvalueinserted);
															if (tdvalue !== tdvalueinserted) {
																self.log('ERRORE: nel grid html ' + tNameElement + ' la riga presente non ha nel campo ' + fNameElement + ' il valore atteso ' + tdvalueinserted, EnumLogType.err);
															}
														}
													});
												});
											}
										}
										// TODO gestire altri tipi di input.
									})
								}

							} else {
								self.log('ERRORE: nella tabella ' + detailTableName + ' ci sono ' + dt.rows.length + ' righe, invece di ' + len, EnumLogType.err);
							}
						}


						break;
					case controlTypeEnum.checklist:
						// verifico che solo la 1a opzione sia selezionata, le altre no. poichè il test tende a selezionare la prima per default
						var listCtrl = $("[data-tag='" + input.tag + "']");
						var trs = listCtrl.find("tr");
						// loop su tutte le righe e poi su tutti i checkbox. tramite
						_.forEach(trs, function (tr, indexRow) {
							var tds = $(tr).find("td");
							_.forEach(tds, function (td) {
								// 1a riga di hedader  indexRow === 0; la 1a riga dati è indexRow === 1
								if (indexRow === 1 && $(td).find("input").length > 0) {
									expect($(td).find("input").prop("checked")).toBeTruthy();
									if (!$(td).find("input").prop("checked"))
										self.log('ERRORE: check non selezionato per il tag ' + input.tag, EnumLogType.err);

								}
								if (indexRow !== 1 && $(td).find("input").length > 0) {
									expect($(td).find("input").prop("checked")).toBeFalsy();
									if ($(td).find("input").prop("checked"))
										self.log('ERRORE: check non selezionato per il tag ' + input.tag, EnumLogType.err);
								}
							});
						});
						break;
					case controlTypeEnum.upload:
						// TODO
						//var tag = helpForm.getStandardTag(input.tag);
						//var tableName = helpForm.getField(tag, 0);
						//var columnName_AttachRif =    helpForm.getField(tag, 1);
						//// expect($("div[data-tag='" + input.tag + "']").val()).toBe(input.value.toString());
						break;
					case controlTypeEnum.calendar:
						// verifica l'esistenza della riga sul ds
						var tagArray = input.tag.split(".");
						var detailTableName = tagArray[0];

						var calendarCtrl = $("[data-tag='" + input.tag + "']");
						// recupero il controllo del bottone, sul quale invocare il click()
						var isInsertBtnVisible = metapage.helpForm.existsDataAttribute(calendarCtrl, "mdlbuttoninsert");
						if (!isInsertBtnVisible) {
							self.log('Il calendario ' + input.tag + " non ha il bottone add, quindi non controllo se ci sono righe!", EnumLogType.log);
						} else {
							// 1 riga dati
							var events = metapage.state.DS.tables[detailTableName].rows;
							expect(events.length).toBe(1);
						}


						break;

					case controlTypeEnum.gridsearch:
						var gridCtrl = $("[data-tag='" + input.tag + "']");
						// verifica l'esistenza delle righe + 1 di header
						var len = input.rows || 1;
						expect(gridCtrl.find("tr").length).toBe(len + 1);
						if (gridCtrl.find("tr").length < len + 1) self.log('ERRORE: numero di righe inferiore a quello atteso nella grid di coll.' + input.tag, EnumLogType.err);
						break;
				}
			})
		},


		/**
		 * Tests if the grids have the coorect columns, based on array of columns on input array
		 * @param {Array} arrayInput
         */
		testGridColumns: function (arrayInput) {
			// TODO
			_.forEach(arrayInput, function (input) {
				// se non c'è default inutile fare il check
				if (input.type === controlTypeEnum.grid) {
					var i = 0;
				}
			});
		},

        /**
         * @method testDefaultValues
         * @public
         * @description SYNC
         * Test the default values for the controls that have default property set
         * @param {Array} arrayInput
         */
		testDefaultValues: function (arrayInput) {

			var getStandardTag = function (tag) {
				if (!tag) return null;
				var s = tag.toString().trim();
				var pos = s.indexOf("?");
				if (pos === -1) return s;
				return s.substring(0, pos);
			};

			var self = this;

			_.forEach(arrayInput, function (input) {
				// se non c'è default inutile fare il check
				if (input.default === undefined || input.default === null) return true;
				switch (input.type) {
					case controlTypeEnum.textarea:
						var expectVal = $("textarea[data-tag='" + input.tag + "']").val();
						expect(expectVal).toBe(input.default.toString());
						if (expectVal !== input.default.toString())
							self.log('ERRORE: mancata corrispondenza del valore di default per il tag textarea ' + input.tag + ' sul ctrl è ' + expectVal + ' sul vettore input ' + input.default.toString() , EnumLogType.err);
						break;
					case controlTypeEnum.inputText:
						var expectVal = $("input[data-tag='" + input.tag + "']").val();
						expect(expectVal).toBe(input.default.toString());
						if (expectVal !== input.default.toString())
							self.log('ERRORE: mancata corrispondenza del valore di default per il tag text ' + input.tag + ' sul ctrl è ' + expectVal + ' sul vettore input ' + input.default.toString() , EnumLogType.err);
						break;
					case controlTypeEnum.select:
						var expectVal = $("select[data-tag='" + input.tag + "']").val();
						expect(expectVal).toBe(input.default.toString());
						if (expectVal !== input.default.toString())
							self.log('ERRORE: mancata corrispondenza del valore di default per il tag tendina ' + input.tag + ' sul ctrl è ' + expectVal + ' sul vettore input ' + input.default.toString() , EnumLogType.err);
						break;
					case controlTypeEnum.inputCheck:
						var tag = getStandardTag(input.tag);
						var pos = tag.indexOf(':');
						if (pos !== -1) {
							var values = tag.substring(pos + 1).trim();
							if (values.indexOf(":") === -1) {
								var yValue = values.split(":", 2)[0].trim();
								// confronto il value "Yes" con quello di default, se corrisponde allora deve essere "checked" altrimenti sarà "unchecked"
								expect($("input[data-tag='" + input.tag + "']").prop("checked")).toBe(yValue === input.default.toString());
							}
						}

						break;
					case controlTypeEnum.inputRadio:
						// prendo il radio in questione, verifico il value yes: e verifico se il default sia uguale al value yes,
						// in quel caso deve essere checked=true , false altrimenti
						// non devo considerare la parte eventuale di search tag con "?" etc..
						var tag = getStandardTag(input.tag);
						var pos = tag.indexOf(":");
						var cvalue = tag.substring(pos + 1).trim();
						if (!cvalue.startsWith(":")) expect($("input[data-tag='" + input.tag + "']").prop("checked")).toBe(cvalue === input.default.toString());
						break;
					case controlTypeEnum.inputAutoChoose:
						break;
				}
			})
		},

        /**
         * @method testHtmlNodeByTagNotFilled
         * @public
         * @description SYNC
         * @param {Array} arrayInput arrayInput a js object {value:string, tag:string, type:controlTypeEnum, default:object}
         */
		testHtmlNodeByTagNotFilled: function (arrayInput, metaPage) {
			var self = this;
			_.forEach(arrayInput, function (input) {
				switch (input.type) {
					case controlTypeEnum.textarea:
						expect($("textarea[data-tag='" + input.tag + "']").val()).toBe(""); // vuoto
						break;
					case controlTypeEnum.inputText:
						expect($("input[data-tag='" + input.tag + "']").val()).toBe(""); // vuoto
						break;
					case controlTypeEnum.select:
						// vuoto
						var res = ($("select[data-tag='" + input.tag + "']").val() === "") || ($("select[data-tag='" + input.tag + "']").val() === null);
						expect(res).toBeTruthy();
						break;
					case controlTypeEnum.inputCheck:
					case controlTypeEnum.inputRadio:
						expect($("input[data-tag='" + input.tag + "']").prop("checked")).toBeFalsy();
						break;
					case controlTypeEnum.inputAutoChoose:
					case controlTypeEnum.dropdowngrid:
						expect($("input[data-tag='" + input.tag + "']").val()).toBe(""); // vuoto
						break;
					case controlTypeEnum.grid:
					case controlTypeEnum.gridsearch:
						var gridCtrl = $("[data-tag='" + input.tag + "']");
						// verifica che non ci siano righe dati
						expect(gridCtrl.find("tr").eq(1).length).toBe(0);
						break;
					case controlTypeEnum.checklist:
						// verifico che non ci siano record selezionato tramite la checkbox list
						var listCtrl = $("[data-tag='" + input.tag + "']");
						var trs = listCtrl.find("tr");
						// loop su tutte le righe e poi su tutti i checkbox
						_.forEach(trs, function (tr) {
							var tds = $(tr).find("td");
							_.forEach(tds, function (td) {
								expect($(td).find("input").prop("checked")).toBeFalsy();
							})
						});
						break;
					case controlTypeEnum.calendar:
						// verifica l'esistenza della riga sul ds
						var tagArray = input.tag.split(".");
						var detailTableName = tagArray[0];
						// 1 riga dati
						var events = metaPage.state.DS.tables[detailTableName].rows;
						expect(events.length).toBe(0);
						break;
				}
			})
		},

		getTime:function () {
			var time = new Date();
			return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
		},

        /**
         * @method insertValueNodeByTagAsync
         * @public
         * @description SYNC
         * Inserts the input value on the controls. Depending on control type it invokes different routines
         * In case of autochoose control it chains the deferred functions. and returns a deferred
         * In case of grid it opens the detail page and insert the row in the detail
         * @param {Array} arrayInput arrayInput a js object {value:string, tag:string, type:controlTypeEnum}
         * @param {HelpForm} helpForm
         * @param {boolean} isForSearch. If "false" insert the value for all controls. If "true" only for the controls that have "search"
		 * @param {Array} nodeToExclude. Array of element to exclude for the insert
         * @returns {Deferred}
         */
		insertValueNodeByTagAsync: function (arrayInput, helpForm, isForSearch, nodeToExclude,tablename, edittype) {
			var self = this;
			nodeToExclude = nodeToExclude || []; // se non è passato inizializzo ad array vuoto, quindi nessuno da escludere
			// catena delle eventauli fill asincrone
			var chainFill = $.when();

			// è un deferred, poichè se ci sono autochoose, grid, liste o controlli upload per attachment , il popolamento è asincorno
			_.forEach(arrayInput, function (input) {

				// se non devo considerarlo in insert, vado prossima iterazione
				if (_.includes(nodeToExclude, input.type)) return true;
				

				switch (input.type) {

					case controlTypeEnum.openPage:

						chainFill = chainFill.then(function () {
							return this.waitPageLoaded(appMeta.EventEnum.showPage);
						});
						appMeta.callPage(tablename, edittype, false);
						break;

					case controlTypeEnum.buttonInsert:
						chainFill = chainFill.then(function () {
							return common.eventGlobalWaiter(null, appMeta.EventEnum.buttonClickEnd)
						});
						// 2. premo bottone di "Nuovo"
						this.clickButtonByTag('maininsert');
						break;

					case controlTypeEnum.command:
						if (!isForSearch) {
							chainFill = chainFill.then(function () {
								var stabilize = stabilizeToCurrent();
								self.clickButtonByTag(input.tag, " - premuto comando custom configurato nell'array di input");
								return stabilize;
							});
						}
						break;

					case controlTypeEnum.textarea:
						$("textarea[data-tag='" + input.tag + "']").val(input.value);
						break;

					case controlTypeEnum.inputText:

						self.insertValueInputByTag(input.tag, input.value);
						// eseguo perdita focus sui controlli text così scattano eventuali eventi gestiti dal fmw
						// come le dipendenze tra controlli   
						$("input[data-tag='" + input.tag + "']").blur();

						// se il controllo ha eventi di change attacchati allora vengono invocati forzatamente nel test.
						// --> gli eventi change DEVONO essere gestiti con Deferred solito
						var elem =$("input[data-tag='" + input.tag + "']")[0];
						var data = $.hasData( elem ) && $._data( elem );
						if (data.events && data.events.change && data.events.change.length) {
							var ev = data.events.change[0].handler;
							chainFill = chainFill.then(function () {
								return ev(helpForm.metaPage);
							});
						}

						break;
					case controlTypeEnum.select:


						var fillSelect = function (input) {
							var defSelect = $.Deferred();
							self.log("Eseguo fill di select " + input.tag);
							// attendo la fine del tasto di add sulla metaPage chiamante
							common.eventWaiter(helpForm.metaPage, appMeta.EventEnum.afterComboChanged)
								.then(function () {
									// afterRowSelect è stata invocata, gli eventi si sono svolti.vado avanti

									return defSelect.resolve();
								});

							// seleziona sempre la 1a opzione dati. la memorizzo su input.value così poi la confronto quanto salvo, nel check successivo
							input.value = input.value ? input.value : $("select[data-tag='" + input.tag + "'] option:eq(1)").val();
							if (input.value) {
								var vcur = $("select[data-tag='" + input.tag + "']").val();
								if (vcur == input.value) {
									return defSelect.resolve();
								}
								$("select[data-tag='" + input.tag + "']").val(input.value).trigger('select2:select');
							} else {
								return defSelect.resolve();
							}


							return defSelect.promise();
						};

						// Eseguo catena di autochoose, una di seguito all'altra, così il chiamante attende che tutte siano terminate per fare la sua then
						chainFill = chainFill.then(function () {
							return fillSelect(input);
						});

						break;
					case controlTypeEnum.inputCheck:
					case controlTypeEnum.inputRadio:
						// SYNC
						self.checkRadioByTag(input.tag, !!input.value);
						break;
					// le autochoose vanno in asincrono
					case controlTypeEnum.inputAutoChoose:
						// ASYNC
						// funzione ausiliaria, per fare focus e blur sul controllo ed attendere quindi
						// il metodo asincrono per il popolamento della autochoose
						var fillAutochoose = function ($txt, input) {
							self.log("Eseguo fill di autochoose " + input.tag);
							// metto il focus
							// il .focus() e .blur() sul controllo non fanno scattare l'handler. Forse perchè non sono sullo spec?
							// per ora invoco direttamente le funzioni con i prm giusti.
							return helpForm.textBoxGotFocus.call($txt, helpForm)
								.then(function () {
									// inserisco valore
									$txt.val(input.valueSearch);

									// Se appare il grid con la lista, premo sula prima riga per convenzione
									var clickRowOnListManager = function () {
										// prendo il grid ospitato sulla modale
										$(".modal-body table:first").find("tr").eq(1).dblclick();
									};
									// si registra all'evento di modale visualizzata
									helpForm.metaPage.eventManager.subscribe(appMeta.EventEnum.showModalWindow, clickRowOnListManager, self);

									// attendo che si risolva. o subito se esiste una sola riga, oppure tramite la selezione della prima riga
									return helpForm.textBoxLostFocus.call($txt, helpForm)
										.then(function () {
											// tolgo la sottoscrizione all'evento. non utilizzo l'utility eventWaiter, poichè se non entra,
											// se ad esempio trovo il valore secco, senza passare per la lista modale, nessuno ne fa l'unsubsribe.
											// Passa qui sia se c'è una riga in ricerca, sia se apre la griglia con risultati, in questo secondo caso
											// invocherò clickRowOnListManager(), cioè la callback, verrà risolto il deferred ed entreremo in questo ramo then()
											// successivamente
											helpForm.metaPage.eventManager.unsubscribe(appMeta.EventEnum.showModalWindow, clickRowOnListManager, self);
											return true;
										})
								});
						};

						// Eseguo catena di autochoose, una di seguito all'altra, così il chiamante attende che tutte siano terminate per fare la sua then
						chainFill = chainFill.then(function () {
							var ctrl = $("input[data-tag='" + input.tag + "']");
							return fillAutochoose(ctrl, input);
						});

						break;
					case controlTypeEnum.grid:
						// ASYNC

						// premo su tasto add, attendo caricamento dettaglio, invoco check a partire da vettore di configurazione del dettaglio
						var fillgrid = function (tag, rowcount) {
							var defFillGrid = $.Deferred();
							var gridCtrl = $("[data-tag='" + tag + "']");
							// recupero il controllo del bottone, sul quale invocare il click()
							var btnAdd = gridCtrl.find("tr").eq(0).find("[data-insert]");
							if (!btnAdd || !btnAdd.length) return defFillGrid.resolve();

							// righe dati sul grid precedenti a quella che devo aggiungere
							var checkTr = "tr:not([data-mdlgrouped]):not(.table-in-cell-tr)";

							var haveGrouped = helpForm.existsDataAttribute(gridCtrl, "mdlgroupedcolumns");

							if (haveGrouped) {
								self.log("la griglia " + tag + " ha un raggruppamento.");
							}

							expect(gridCtrl.find(checkTr).length).toBe(rowcount + (haveGrouped ? 0 : 1)); //+1 sta per la riga vuota
							if ((rowcount + (haveGrouped ? 0 : 1)) !== gridCtrl.find(checkTr).length) {
								self.log("ERRORE: Numero di righe grid: " + tag + " differenti da quelle aspettate prima dell'aggiunta." + tag, EnumLogType.err);
							}

							// attendo che si apra il dettaglio
							self.waitPageLoaded(appMeta.EventEnum.showPage)
								.then(function (metaPageDetail) {
									// recupero tablename ed edittype dal tag della griglia
									var tagArray = tag.split(".");
									var detailTableName = tagArray[0];
									var detailEditType = tagArray[2];

									// in caso di alias deve prendere il tableForRading
									detailTableName = helpForm.metaPage.state.DS.tables[detailTableName].tableForReading();

									// TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
									// in questo caso è la metaPage dettaglio aperta dal grid
									self.testMetaPageInitialization(metaPageDetail, detailTableName, detailEditType);

									// recupero dal file del dettaglio opportuno gli input
									var detailTestPrototype = 'appMeta.' + detailTableName + '_' + detailEditType;
									var myinstance = eval(detailTestPrototype);
									if (!myinstance) console.log(detailTestPrototype + " not FOUND");
									var arrayInputDetail = myinstance.arrayInput;

									// TEST SPECIFICO DI PAGINA.
									self.testHtmlNodeByTagExists(arrayInputDetail, true);
									self.testDefaultValues(arrayInputDetail);
									// sul dettaglio il tasto close
									expect($("button[data-tag='mainclose']").is(":visible")).toBeFalsy();

									self.log("Inserisco su dettaglio grid: " + tag);
									// 2. inserisco i dati nel dettaglio, ricorsivamente

									// esegue il test comune di pagina per verificare la correttezza del dataset con il database
									return self.testDatasetCompliant(detailTableName, detailEditType).then(function () {
										return self.insertValueNodeByTagAsync(arrayInputDetail, metaPageDetail.helpForm, false)
									}).then(function () {
										// attendo la fine del tasto di add sulla metaPage chiamante
										common.eventWaiter(helpForm.metaPage, appMeta.EventEnum.insertClick)
											.then(function () {
												// c'è la riga dei dati + header
												var checkTr = "tr:not([data-mdlgrouped]):not(.table-in-cell-tr)";
												expect(gridCtrl.find(checkTr).length).toBe(rowcount + 1);
												if (gridCtrl.find(checkTr).length !== rowcount + 1) self.log("ERRORE: Ci sono delle righe in meno nella grid: " + tag, EnumLogType.err);
												self.log("torno su principale da dettaglio grid: " + tag);
												// torno sulla meta page chiamante
												return defFillGrid.resolve();
											});

										// 3. premo bottone di "MainSave", cioè "Ok" nel dettaglio che effettua la propagate e torna al chiamante
										self.clickButtonByTag('mainsave', ' dettaglio - ' + detailTableName + '-' + detailEditType);
									});
								});

							// 1. premo bottone di add sulla griglia, aprirà meta page dettaglio
							self.log("Apro dettaglio grid: " + tag);
							btnAdd.click();

							return defFillGrid.promise();
						};

						// se chiamo la funz per inserire i valori per poi ricercare il record allora non eseguo fill della griglia
						if (!isForSearch) {
							// concateno il deferred che inserisce riga nel dettaglio per ogni griglia
							// A seconda delle righe invoco n-volte la funzione, altriemnti se il parametro non esiste una volta sola
							if (!input.rows) input.rows = 1;
							for (var i = 1; i <= input.rows; i++) {
								// metto iif passando "i" altrimenti nella "then" della chain andrebbe come i sempre l'ultimo input.rows e non il current "i"
								(function (i) {
									chainFill = chainFill.then(function () {
										// passo indice di riga che sto inserendo così eseguo check
										return fillgrid(input.tag, i)
									});
								})(i)
							}
						}

						break;
					case controlTypeEnum.checklist:
						if (!isForSearch) {
							// SYNC
							var listCtrl = $("[data-tag='" + input.tag + "']");
							var trs = listCtrl.find("tr");
							// se ci sono record seleziono il primo per convenzione
							if (trs.length > 1) { // 1 riga header e almeno 1 riga dati
								var tds = $(trs[1]).find("td");
								self.log("Eseguo fill di checklist " + input.tag);
								if (tds.length) $(tds[0]).find("input").prop("checked", true);
							} else {
								self.log("la checklist tra gli input " + input.tag + " non ha righe da selezionare", EnumLogType.warn)
							}
						}
						break;
					case controlTypeEnum.upload:
					case controlTypeEnum.uploadwin:
						// ASYNC
						var fillupload = function (tag) {
							// simulo un upload di 1 file, chiamando la funzione del controllo
							var defUpload = $.Deferred();
							var uploadCtrl = $("[data-tag='" + tag + "']");
							// recuperol'istanza del controllore
							var customControllerForUpload = uploadCtrl.data("customController");
							// creo file per upload vero e proprio. il test quindi non passa per il contorllo del browser
							// ma invoca direttamente la routine della classe
							var file = new File(['foo', 'bar'], 'foobar.txt');
							// simulo chiamando il metodo core con un file creato al volo
							self.log("Upload allegato " + input.tag);
							customControllerForUpload.uploadCore(file)
								.then(function () {
									return defUpload.resolve();
								});

							return defUpload.promise();
						};

						if (!isForSearch) {
							chainFill = chainFill.then(function () {
								return fillupload(input.tag)
							});
						}
						break;
					case controlTypeEnum.calendar:
						var fillCalendar = function (tag) {
							var defFillCalendar = $.Deferred();
							var calendarCtrl = $("[data-tag='" + tag + "']");
							// recupero il controllo del bottone, sul quale invocare il click()
							var isInsertBtnVisible = helpForm.existsDataAttribute(calendarCtrl, "mdlbuttoninsert");
							if (!isInsertBtnVisible) return defFillCalendar.resolve();

							// attendo che si apra il dettaglio
							self.waitPageLoaded(appMeta.EventEnum.showPage)
								.then(function (metaPageDetail) {
									// recupero tablename ed edittype dal tag del calendario
									var tagArray = tag.split(".");
									var detailTableName = tagArray[0];
									var detailEditType = tagArray[2];

									// TEST GENERICO DA INVOCARE per testare inizializzazione di qualsiasi MetaPage
									// in questo caso è la metaPage dettaglio aperta dal grid
									self.testMetaPageInitialization(metaPageDetail, detailTableName, detailEditType);

									// recupero dal file del dettaglio opportuno gli input
									var detailTestPrototype = 'appMeta.' + detailTableName + '_' + detailEditType;
									var myinstance = eval(detailTestPrototype);
									if (!myinstance) console.log(detailTestPrototype + " not FOUND");
									var arrayInputDetail = myinstance.arrayInput;

									// TEST SPECIFICO DI PAGINA.
									self.testHtmlNodeByTagExists(arrayInputDetail, true);
									self.testDefaultValues(arrayInputDetail);
									// sul dettaglio il tasto close
									expect($("button[data-tag='mainclose']").is(":visible")).toBeFalsy();

									self.log("inserisco valori input su dettaglio calendario: " + tag);
									// 2. inserisco i dati nel dettaglio, ricorsivamente
									return self.insertValueNodeByTagAsync(arrayInputDetail, metaPageDetail.helpForm, false).then(function () {


										// attendo la fine del tasto di add sulla metaPage chiamante
										common.eventWaiter(helpForm.metaPage, appMeta.EventEnum.insertClick)
											.then(function () {
												// c'è la riga sul ds
												var events = helpForm.metaPage.state.DS.tables[detailTableName].rows;
												expect(events.length).toBe(1);
												self.log("torno su principale da dettaglio calendario: " + tag);
												// torno sulla meta page chiamante
												return defFillCalendar.resolve();
											});

										// 3. premo bottone di "MainSave", cioè "Ok" nel dettaglio che effettua la propagate e torna al chiamante
										self.clickButtonByTag('mainsave', ' calendario dettaglio - ' + detailTableName + '-' + detailEditType);
									});
								});

							// verifico non ci siano eventi
							var tagArray = tag.split(".");
							var detailTableName = tagArray[0];
							// nessuna riga dati
							var events = helpForm.metaPage.state.DS.tables[detailTableName].rows;
							expect(events.length).toBe(0);
							// 1. premo bottone di add sul calendario, aprirà meta page dettaglio
							self.log("apro dettaglio calendario: " + tag);
							calendarCtrl.find($("button[aria-label='addEventButton']")).click();
							return defFillCalendar.promise();
						};

						if (!isForSearch) {
							chainFill = chainFill.then(function () {
								return fillCalendar(input.tag)
							});
						}
						break;
					case controlTypeEnum.gridsearch:

						// ASYNC
						// funzione ausiliaria, lanciare la funzione custom
						// per aggiungere record nella tabella di collegamento tra 2 tabelle
						var fillGridSearch = function (input) {
							self.log("Eseguo fill della tabella di collegamento tramite searchAndFill: " + input.tag);
							var $txt = $("#" + input.txtId);
							// inserisco valore da cercare
							$txt.val(input.value);
							var defGridSearch = $.Deferred();
							// invoco funz custom e attendo deferred
							helpForm.metaPage[input.functSearchAndAssign](helpForm.metaPage).then(function () {
								return defGridSearch.resolve();
							});
							return defGridSearch.promise();
						};

						// non inserisco in fase di "Effettua ricerca"
						if (!isForSearch) {
							// Eseguo catena di autochoose, una di seguito all'altra, così il chiamante attende che tutte siano terminate per fare la sua then
							chainFill = chainFill.then(function () {
								return fillGridSearch(input)
							});
						}

						break;
					case controlTypeEnum.customFunction:
						if (input.canInSearch(isForSearch)) {
							// Esegue la funzione deferred custom, che si occuperà di fare una insert personalizzata
							chainFill = chainFill.then(function () {
								// lancio la insertValueNodeByTagAsync specifica della funzione eprsonalizzata
								return input.insertValueNodeByTagAsync(helpForm.metaPage);
							});
						}

						break;
					// le dropdown vanno in asincrono
					case controlTypeEnum.dropdowngrid:
						// ASYNC
						// funzione ausiliaria, per fare focus scelta sul grid
						var fillDropDown = function ($txt, input) {
							self.log("Eseguo fill di dropdowngrid " + input.tag);

							// inserisco valore
							$txt.val(input.valueSearch);

							// Se appare il grid con la lista, premo sula prima riga per convenzione
							var clickRowOnListManager = function () {
								// prendo il grid ospitato sulla modale
								$(".mdlautochoose table:first").find("tr").eq(1).dblclick();
							};
							// si registra all'evento di lista visualizzata
							helpForm.metaPage.eventManager.subscribe(appMeta.EventEnum.listCreated, clickRowOnListManager, self);

							var dropdownCtrl = $("[data-tag='" + input.tag + "']");
							// recuperol'istanza del controllore
							var customDropDownCtrl = dropdownCtrl.data("customController");

							// attendo che si risolva. o subito se esiste una sola riga, oppure tramite la selezione della prima riga
							return customDropDownCtrl.keyup(customDropDownCtrl, false)
								.then(function () {
									self.log("Finito fill di dropdowngrid " + input.tag);
									// tolgo la sottoscrizione all'evento. non utilizzo l'utility eventWaiter, poichè se non entra,
									// se ad esempio trovo il valore secco, senza passare per la lista modale, nessuno ne fa l'unsubsribe.
									// Passa qui sia se c'è una riga in ricerca, sia se apre la griglia con risultati, in questo secondo caso
									// invocherò clickRowOnListManager(), cioè la callback, verrà risolto il deferred ed entreremo in questo ramo then()
									// successivamente
									helpForm.metaPage.eventManager.unsubscribe(appMeta.EventEnum.listCreated, clickRowOnListManager, self);
									return true;
								})

						};

						// Eseguo catena di autochoose, una di seguito all'altra, così il chiamante attende che tutte siano terminate per fare la sua then
						chainFill = chainFill.then(function () {
							var ctrl = $("input[data-tag='" + input.tag + "']");
							try {
								return fillDropDown(ctrl, input);
							} catch (e) {
								self.log("dropdowngrid " + input.tag + " probabilmente numero caratteri insufficienti nel dropdown per far continuare il test", EnumLogType.err);
							}

						});

						break;

					case controlTypeEnum.treecustom:

						var getParentPagePath = function (metapage, arrayPath) {
							if (metapage.state.callerPage) {
								arrayPath.push({ tname: metapage.state.callerPage.primaryTableName, edittype: metapage.state.callerPage.editType });
								return getParentPagePath(metapage.state.callerPage, arrayPath);
							}
							return arrayPath;
						};

						// se la riga relativa alla tabella è in added, significa che è la prima volta che entro.
						// quindi non faccio nulla
						var fillTreeCustom = function (tag) {
							var defTreecustom = $.Deferred();
							var tagArray = tag.split(".");
							var treeTableName = tagArray[0];
							var treeEditType = tagArray[2];

							self.log("Ho trovato un treecustom verifico solo presenza nodo root, tabella " + treeTableName);

							//recupero il controllo
							var treeCustomCtrl = $("[data-tag='" + tag + "']").data("customController");
							// siccome è un tree custom, vedo lo stato della riga principale
							if (treeCustomCtrl.metaPage.state.currentRow.getRow().state === dataRowState.added) {
								// verifico solo che sulla tabella del tree ci sia 1 riga added, poichè viene aggiunta nella beforeFill()
								// della mp.
								var dtTree = treeCustomCtrl.metaPage.getDataTable(treeTableName);
								var rowRoot = dtTree.rows[0];

								expect(rowRoot.getRow().state).toBe(dataRowState.added);
								if (rowRoot.getRow().state !== dataRowState.added) {
									self.log("Il tree " + treeTableName + "_" + treeEditType +  " non ha la root ", EnumLogType.err);
								}

								// salvo nella dictionary globale il tree custom, perchè poi mi serve per mfare altri ragionamenti
								if (!appMeta.dictTestAuxTree) {
									appMeta.dictTestAuxTree = {};
								}
								// mi salvo il path della navigazione delle varie pagine. che servono poi dopo il save()
								// per tornare sulla sub page ed effettuare l'inserimento di un nodo figlio
								var pathArray = getParentPagePath(treeCustomCtrl.metaPage, [{ tname: treeCustomCtrl.metaPage.primaryTableName, edittype: treeCustomCtrl.metaPage.editType }]);
								appMeta.dictTestAuxTree[treeTableName] = {
									ctrl: treeCustomCtrl,
									tname: treeTableName,
									edittype: treeEditType,
									pathArray: pathArray.reverse()
								};
								return defTreecustom.resolve();
							}

							return defTreecustom.promise();
						};

						if (!isForSearch) {
							chainFill = chainFill.then(function () {
								return fillTreeCustom(input.tag);
							});
						}
				}
			});

			// ritorno la catena di then dei vari componenti che richiedono caricamenti async (autochoose, grid, upload).Sarà risolto dal chiamante dopo che iterarivamente verranno svolte le funzioni async concatenate
			return chainFill;
		},


        /**
         * @method getRandomStringTest
         * @public
         * @description SYNC
         * Returns a random string with character [a-zA-Z] -> teste_2e_xyz
         * Used to create random values to insert in the controls , to test "maininsert" button
         * @param {Number} length of the string to return
         * @returns {String}
         */
		getRandomStringTest: function (length) {
			if (!length) length = 14;
			if (length > 1024) {
				this.log("Hai inserito una lunghezza grande ho normalizzato a 1024 era " + length.toString(), EnumLogType.warn);
				length = 1024;
			}
			var result = '';
			var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
			var charactersLength = characters.length;
			for (var i = 0; i < length; i++) {
				result += characters.charAt(Math.floor(Math.random() * charactersLength));
			}
			return ("test_e2e_" + result).substring(0, length);
		},

        /**
         * @method getRandomNumber
         * @public
         * @description SYNC
         * Returns a random floor number among max and min
         * @param {number} min
         * @param {number} max
         * @returns {number}
         */
		getRandomNumber: function (min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		},

        /**
         * @method getRandomDecimalTest
         * @public
         * @description SYNC
         * Returns a random number in "0,1" and "0,9" interval with "precision" number of decimal
         * @param {number} precision, an integer, indicates the decimal cipher
         * @returns {String}
         */
		getRandomDecimalTest: function (precision) {
			return (Math.random() * (0.1 - 0.9) + 0.9).toFixed(precision).replace(".", appMeta.numberDecimalSeparator);
		},

		/**
		 * write the message "msg" on js console
		 * @param {string} msg
		 * @param {number} type
         */
		log: function (msg, type) {
			msg = "Log Test e2e: " + msg;
			if (type === EnumLogType.err) {
				console.error("ERR:" + msg);
				// expect("failed").toBe(msg);
			} else if (type === EnumLogType.warn) {
				console.warn("WARNING " + msg);
			} else {
				console.log(msg);
			}
		},

		/**
		 * 	Esegue query top1 su ttte le tabelle del datsset per verificarne la coerenza con il database
		 * @param tablename
		 * @param edittype
		 * @returns {jQuery}
		 */
		testDatasetCompliant: function (tablename, edittype) {
			var def = appMeta.Deferred('testDatasetCompliant');
			return def.resolve();  //commentare per attivare il metodo
			//appMeta.modalLoaderControl.show("TEST QUERY TABELLE DATASET IN CORSO...", false);
			//// recupera il dataset di pagina vuoto
			//appMeta.getData.getDataSet(tablename, edittype)
			//	.then(function (ds) {
			//		// per ogni tabella costrusice la query e la lancia
			//		var arraySelect = [];
			//		// prendo le colonne dal dataset
			//		_.forEach(ds.tables, function (t) {
			//			var columnList =
			//				_.filter(
			//					_.map(t.columns, function (c) {
			//						if (!c.name.startsWith("!")) {
			//							return c.name;
			//						}
			//					}), function (el) {
			//						return !!el;
			//					});

			//			var tnameLog = t.name;
			//			if (t.tableForReading() !== t.name) {
			//				tnameLog = "alias table " + t.name + " on real table " + t.tableForReading();
			//			}
			//			arraySelect.push(appMeta.getData.runSelect(t.tableForReading(), columnList.join(","), null, 1)
			//				.then(function (res) {
			//					console.log("OK query on " + tnameLog + " done. top 1 returns rows:" + res.rows.length);
			//					return true;
			//				}));
			//		});

			//		// lancio le query
			//		$.when.apply($, arraySelect).then(function (res) {
			//			appMeta.modalLoaderControl.hide();
			//			def.resolve();
			//		});
			//	});

			//return def.promise();
		}

	};

	appMeta.testHelper = new TestHelper();
	appMeta.testHelper.controlTypeEnum = controlTypeEnum;
	appMeta.testHelper.enumLogType = EnumLogType;
}());
