# MetaApp

MetaApp è la classe che si occupa della gestione a più alto livello dell'applicazione.

E' un singleton e funge anche da Mediator tra le varie componenti. Ossia è il fulcro attorno a cui gira la creazione/visualizzazione e la chiusura delle pagine ed il relativo scambio di informazioni.

myKode contiene una serie di pagine html, che costituiscono i template di alcuni componenti base utilizzati all’interno del framework come messageBox, indicatori di caricamento, toolbar etc. L’utente può ridefinire i suoi template e posizionarli in una qualsiasi cartella del suo progetto.

E' possibile modificare i template usati dall'applicazione ed eventualmente la loro dislocazione usando il file Config.js, che tipicamente aggiunge all'istanza globale di appMeta la proprietà config con tutte le impostazioni.

Nel file config.js i dettagli sulle singole proprietà personalizzabili.


## Metodi

### start()

Avvia l'applicazione, è il metodo da chiamare dopo aver creato e configurato le varie proprietà dell'applicazione


### addMetaPage(tableName, editType, metaPage) 

Associa la coppia (tableName,editType) ad una classe (non un'istanza) derivata da metaPage
Tipicamente troviamo una chiamata ad addMetaPage in ogni file in cui è implementato il codice di una MetaPage, ossia
 il "code behind" javascript di una pagina web.

###  \{MetaPage\} getMetaPage (tableName, editType)

Restituisce la MetaPage associata ad una coppia (tableName, editType)

### getMetaDataPath(tableName)

Restituisce il percorso dove sono dislocati il metadato, le metapage e gli html relativi ad una
 determinata tabella. Tipicamente è il l'indirizzo "base" seguito dal nome della tabella, tuttavia è possibile localizzare tutti i file nella stessa cartella, o in modi diversi, effettuando l'override di questo metodo.


### addMeta(tableName, meta)

Associa una classe derivante da MetaData alla sua relativa tabella

Tipicamente nel file del metadato troveremo qualcosa di simile a:

```js

    (function(_, metaModel, MetaData, Deferred) {
		/** BOILERPLATE **/
		/** Detect free variable `global` from Node.js. */
		let freeGlobal = typeof global === 'object' && global && global.Object === Object && global;
		/** Detect free variable `self`. */
		let freeSelf = typeof self === 'object' && self && self.Object === Object && self;
		/** Used as a reference to the global object. */
		let root = freeGlobal || freeSelf || Function('return this')();
		/** Detect free variable `exports`. */
		let freeExports = typeof exports === 'object' && exports && !exports.nodeType && exports;
		/** Detect free variable `module`. */
		let freeModule = freeExports && typeof module === 'object' && module && !module.nodeType && module;


		//noinspection JSUnresolvedVariable
		/** Detect free variable `global` from Node.js or Browserified code and use it as `root`. (thanks lodash)*/
		let moduleExports = freeModule && freeModule.exports === freeExports;

		/** THIS IS THE METADATA DEFINITION **/
             function meta_tableName() {
                    MetaData.apply(this, ["tableName"]);
                    this.name = 'meta_tableName';
                }

                meta_tableName.prototype = _.extend(
                    new MetaData(),
                    {
                        constructor: meta_tableName,
			             superClass: MetaData.prototype,
                        ... metodi  

                    }
                  });

		/** BOILERPLATE **/
		// Check for `exports` after `define` in case a build optimizer adds an `exports` object.
		if (freeExports && freeModule) {
				if (moduleExports) { // Export for Node.js or RingoJS.
					(freeModule.exports = meta_attach).meta_tableName = meta_tableName;
				} 
				else { // Export for Narwhal or Rhino -require.
					freeExports.meta_tableName = meta_tableName;
				}
		} else {
				// Export for a browser or Rhino.
				if (root.appMeta){
					//root.appMeta.meta = metatableName;
					appMeta.addMeta('tableName', new meta_attach('tableName'));
				} 
				else {
					root.meta_tableName = meta_tableName;
				}
		}

		}(  (typeof _ === 'undefined') ? require('lodash') : _,
			(typeof appMeta === 'undefined') ? require('./../client/components/metadata/MetaModel').metaModel : appMeta.metaModel,
			(typeof appMeta === 'undefined') ? require('./MetaApplicationData').MetaApplicationData : appMeta.MetaApplicationData,
			(typeof appMeta === 'undefined') ? require('./../client/components/metadata/EventManager').Deferred : appMeta.Deferred,
		)    

```

In questo codice si è assunto che ci sia una classe base per tutti i metadati dell'applicazione 
 di nome MetaApplicationData, derivante da MetaData, e che il nome della tabella associata al 
 metadato fosse tableName.

Il codice contiene del boilerplate atto a rendere possibile utilizzare lo stesso file javascript sia nel client (frontend eseguito dal browser) che nel backend Node.js o altri. Tale boilerplate può essere semplificato se si decide di non assicurare la compatibilità ad uno o più moduli di loading, o semplicemente non usare i metadati lato backend o lato frontend.

Nel Backend non esiste un'istanza di AppMeta pertanto i metadati sono ricavati direttamente dal modulo node.js che li contiene.

Si osservi che tale boilerplate è necessario solo per il codice del metadato ed eventuali altri file che si intendano condividere, nell'uso, nel backend e nel frontend. Il codice delle MetaPage invece, di norma non ha questa necessità, essendo usato solo nel frontend.


### \{MetaData\} getMeta(tableName)

Restituisce l'istanza del MetaDato tableName. Di default è un singleton per come è definito, ossia normalmente 
 ogni modulo che espone un metadato registra un'istanza di quel MetaDato stesso che poi è condivisa da tutta l'applicazione.

Volendo cambiare questo comportamento si può agire da questo metodo.


###  \{Deferred\<html\>} getPage (tableName, editType)

Restituisce l'html associato ad una coppia (tableName, editType). Questo è di solito preso dalla cartella \<base path>/\<tableName> se non è presente in una cache interna. Per registrare le pagine quindi non è necessario scrivere codice, basta riporle nella 
 opportuna sotto cartella di nome "tableName" e nominarle \<tableName>.\<editType>.html

Da questa interfaccia è facile capire che ad ogni tabella tableName è possibile associare una o più maschere, ognuna identificata
 da un codice, che è appunto l'editType.


### \{Deferred\<html\>} callPage(metaToCall, editType, wantsRow)

Apre una maschera identificata dalla coppia metaToCall-editType, e restituisce un deferred, che è true se l'editing si è concluso con un "Ok". wantsRow è un parametro che indica se il chiamante richiede la restituzione di una riga.
Ove wantsRow sia true, la maschera che si apre ha l'aspetto di un pop up.

All'apertura e visualizzazione di una pagina è anche generato un evento di tipo showPage, al quale è possibile registrarsi per effettuare specifice operazioni, ad esempio:

```js


	appMeta.globalEventManager.subscribe(appMeta.EventEnum.showPage, this.showPage, this);

	...

	showPage:function (metaPage) {
		if (metaPage.detailPage) ...
	}


```

### Deferred\<object>callWebService (method, prms)

Invoca un web service di nome "method" e con i parametri prms. Il risultato è girato pari pari al chiamante.
Il metodo "method" deve essere stato precedentemente registrato con il metodo 

### register(prms)

Registra un web service nel sistema, prms deve avere i seguenti campi:

- method: nome del metodo 
- type: può essere GET/POST/DELETE
- multipleResult: true se sono possibili più risposte
- url: absolute url, es: http://mysite/mypath/method