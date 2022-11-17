(function() {
    var MetaPage = window.appMeta.MetaPage;
    var q = window.jsDataQuery;
    function metaPage_registry() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registry';
         
        // *****************************************************************************************************
        // ****************************** TEST FILE FROM_LIST_AUTOCHOOSE****************************************
        // *****************************************************************************************************
        
        switch (appMeta.testCaseNumber){
            case 1:
            // 1. test search: dopo activate, premo su Effettua ricerca. filter form semplice con apertura lista e doppio click, su una riga.
            // -> la form si deve popolare con i dati della riga scelta
            // 1.2 Dopo activate se rpemo tasto "Info riga" deve dare messaggio con riga non selezionata
            // 1.3 Dopo aver effettuato la scelta, premere su tasto "Info riga" -> si deve aprire popup con info sulla riga selezionata
            case 3:
                // 3 test imposta ricerca: dopo activate, metto testo nelle text, premo imposta ricerca-> deve sbianchettare tutto. Poi digito id 1040471
                // premo "search" -> la forma deve popolarsi con i dati della riga
            case 5:
                // 5. dopo activate  , digita 2 su idreg. Tutti i campi, tra cui piva e i reference vengono popolati
                this.startFilter = q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6), q.eq('idreg',4)); 
                break;
            case 2:
                // 2. test search: dopo activate, premo su Effettua ricerca. filtro con una sola riga. no apre la lista per la scelta, ma popola direttamente il form con i dati per 
                this.startFilter = q.eq('idreg',1);
                break;
            case 4:
                break;
            
            case 6:
                // 6. Activate. digita 016 su piva, perdi il focus, scatta autochoose, lista modale, doppio click , su una riga lui
                // popola le text con i dati. (no i text reference)
                break;
            case 7:
                break;
            
        }
    }

    metaPage_registry.prototype = _.extend(
        new MetaPage('registry', 'anagrafica', false),
        {
            constructor: metaPage_registry,

            superClass: MetaPage.prototype
        }
    );

    window.appMeta.addMetaPage('registry', 'anagrafica', metaPage_registry);
}());
