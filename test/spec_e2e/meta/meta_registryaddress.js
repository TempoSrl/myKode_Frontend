(function() {

	var MetaData = window.appMeta.MetaData;

    function meta_registryaddress() {
		MetaData.apply(this, arguments);
        this.name = 'meta_registryaddress';
    }

    meta_registryaddress.prototype = _.extend(
        new MetaData(),
        {
            constructor: meta_registryaddress,
			superClass: MetaData.prototype,

			describeColumns: function (table, listType) {
				var nPos=1;
				var objCalcFieldConfig = {};
				var self = this;
				_.forEach(table.columns, function (c) {
					self.describeAColumn(table, c.name, '', null, -1, null);
				});
				switch (listType) {
					default:
						return this.superClass.describeColumns(table, listType);
					case 'seg':
						this.describeAColumn(table, 'start', 'Data inizio', null, 20, null);
						this.describeAColumn(table, 'stop', 'Data fine', null, 30, null);
						this.describeAColumn(table, 'active', 'Attivo', null, 60, null);
						this.describeAColumn(table, 'address', 'Indirizzo', null, 70, 100);
						this.describeAColumn(table, 'flagforeign', 'Estero', null, 80, null);
						this.describeAColumn(table, 'location', 'Località', null, 100, 50);
						this.describeAColumn(table, 'cap', 'CAP', null, 110, 20);
						this.describeAColumn(table, 'annotations', 'Annotazioni', null, 130, 400);
						this.describeAColumn(table, '!idaddresskind_address_description', 'Tipologia', null, 11, null);
						objCalcFieldConfig['!idaddresskind_address_description'] = { tableNameLookup:'address', columnNameLookup:'description', columnNamekey:'idaddresskind' };
						this.describeAColumn(table, '!idcity_geo_city_title', 'Comune', null, 91, null);
						objCalcFieldConfig['!idcity_geo_city_title'] = { tableNameLookup:'geo_city_alias5', columnNameLookup:'title', columnNamekey:'idcity' };
						this.describeAColumn(table, '!idnation_geo_nation_title', 'Nazione', null, 121, null);
						objCalcFieldConfig['!idnation_geo_nation_title'] = { tableNameLookup:'geo_nation_alias5', columnNameLookup:'title', columnNamekey:'idnation' };
//$objCalcFieldConfig_seg$
						break;
					case 'user':
						this.describeAColumn(table, 'address', 'Indirizzo', null, 70, 100);
						this.describeAColumn(table, 'location', 'Località', null, 100, 50);
						this.describeAColumn(table, 'cap', 'CAP', null, 110, 20);
						this.describeAColumn(table, '!idcity_geo_city_title', 'Comune', null, 91, null);
						objCalcFieldConfig['!idcity_geo_city_title'] = { tableNameLookup:'geo_city_alias1', columnNameLookup:'title', columnNamekey:'idcity' };
//$objCalcFieldConfig_user$
						break;
//$objCalcFieldConfig$
				}
				table['customObjCalculateFields'] = objCalcFieldConfig;
				appMeta.metaModel.computeRowsAs(table, listType, this.superClass.calculateFields);
				return appMeta.Deferred("describeColumns").resolve();
			},


			setCaption: function (table, edittype) {
				switch (edittype) {
					case 'user':
						table.columns["address"].caption = "Indirizzo";
						table.columns["cap"].caption = "CAP";
						table.columns["idaddresskind"].caption = "Tipologia";
						table.columns["idcity"].caption = "Comune";
						table.columns["idnation"].caption = "Nazione";
						table.columns["location"].caption = "Località";
//$innerSetCaptionConfig_user$
						break;
					case 'seg':
						table.columns["active"].caption = "Attivo";
						table.columns["start"].caption = "Data inizio";
						table.columns["stop"].caption = "Data fine";
//$innerSetCaptionConfig_seg$
						break;
//$innerSetCaptionConfig$
				}
			},


			getNewRow: function (parentRow, dt, editType){
               var def = appMeta.Deferred("getNewRow-meta_registryaddress");

				//$getNewRowInside$

				// metto i default
				return this.superClass.getNewRow(parentRow, dt, editType)
					.then(function (dtRow) {
						//$getNewRowDefault$
						return def.resolve(dtRow);
					});
			},


			//$isValidFunction$

			//$getStaticFilter$

			getSorting: function (listType) {
				switch (listType) {
					case "user": {
						return "start asc ";
					}
					//$getSortingin$
				}
				return this.superClass.getSorting(listType);
			}

        });

    window.appMeta.addMeta('registryaddress', new meta_registryaddress('registryaddress'));

	}());
