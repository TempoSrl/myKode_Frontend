/*globals ObjectRow,DataRelation,define,self,jsDataSet,jsDataQuery,metaModel */
/**
 * @module localResourceIt
 * @description  Collection of the localized strings ITALIAN
 */
(function () {

    /**
     * @constructor LocalResourceIt
     * @description
     * Resources for italian language
     */

    const LocalResourceIt = {
        yes : "Si",
        no : "No",
        error : "Errore",
        and : "e",
        alert : "Avviso",
        ok : "Ok",
        of : "di",
        cancel : "Annulla",
        eliminate : "Elimina",
        confirm: "Conferma",
        close : "Chiudi",
        changesUnsaved : "Ci sono modifiche ai dati non salvate. Si desidera perdere le modifiche?",
        emptyKeyMsg : "Un campo chiave non può essere vuoto o duplicato.",
        emptyFieldMsg : "Un determinato campo non può essere vuoto.",
        stringTooLong : "Campo troppo lungo",
        noDataSelected : "Nessun dato selezionato" ,
        saveLayout: "Salva layout",
        visible : 'visibile',
        column : 'colonna',
        from: "da",
        to : "a",
        date: 'Data',
        start: 'Inizio',
        end: 'Fine',
        infoevent: 'Info evento',
        loading: 'Caricamento...',
        eq: '=',
        like : 'like',
        cambioRuolo : 'Scelta ruolo',

        logoutMsg : "Vuoi uscire dall' applicazione?",
        logoutSSOMsg : "Vuoi effettuare anche il Logout dal sistema di \"Single sign on\"",

        noNetwork : "Il tuo dispositivo non è connesso a nessuna rete! Prova a connetterti e riprova",
        networkConnectionError : "Errore di connessione con il server. Controllare la connessione e riprova!",
        itemChooseNotSelectable : "La voce scelta non potoeva essere selezionata",

        toast_login_success : "Login effettuata correttamente",
        toast_reg_success : "Registrazione avvenuta correttamente",
        info_not_avalilable : "Informazioni di riga non presenti per questo oggetto",

        rowSelectedNoMoreInDb : "La riga selezionata non è più presente nel db",
        noElementFound:"Nessun elemento trovato",

        sameValuesForTheKey: "E' stata inserita una riga con la stessa chiave primaria di un altra esistente. " +
            " E' necessario modificare i dati immessi per salvarli.",

        noPrimaryDataSelected: "Nessuna riga principale selezionata",
        selectRowInAGrid: "Seleziona una riga da modificare",

        requiredRow_not_found: "Riga richesta non trovata sul tree",
        selectedRowIsNotOperative: "La riga selezionata non è operativa",
        gridEmpty : "Nessun dato presente",

        // label bottoni standard
        editButton : "Correggi",
        deleteButton : "Cancella",
        insertButton : "Aggiungi",
        unlinkButton : "Unlink",

        // form title suffux
        searchTitle : "Ricerca",
        changeTitle : "Modifica",
        insertTitle : "Inserimento",

        insertFilterSearch : "Inserisci filtri di ricerca",

        // Main Command button label, la chiave è il tag
        mainsetsearch : "Vai alla ricerca",
        maindosearch : "Ricerca",
        maininsert : "Nuovo",
        maininsertcopy : "Crea copia",
        mainsave : "Salva",
        mainselect : "Seleziona",
        maindelete : "Elimina",
        editnotes : "Edita Note",
        mainclose : "Chiudi",
        showlast: "Info riga",
        mainexportpdf: "Stampa",

        emptyField: "Svuota campi",

        isValidFieldMandatory: "Attenzione! Il campo <strong>S%field%S</strong> è obbligatorio",
        isValidMaxLength: "Attenzione! il campo <strong>S%field%S</strong> è al massimo di <strong>S%maxlenght%S</strong> caratteri",

        multiSelect_addRows: "Aggiungi",
        multiSelect_removeRows : "Rimuovi",
        multiSelect_addRowsTitle: "Da aggiungere",
        multiSelect_toolbarButtonsTitle:  "E' possibile selzionare_ TODO",
        multiSelect_lbl_toAdd: "Da aggiungere",
        multiSelect_lbl_added: "Aggiunti",
        multiSelect_lbl_description: "Ctrl/Shift + Click &egrave; possibile selezionare o deselezionare una o pi&ugrave; righe di un elenco. \<BR\> Con il tasto destro &egrave; possibile selezionare o deselezionare tutte le righe di un elenco",
        multiSelect_lbl_wait: "Attendi caricamento delle tabelle",

        procedureMessage_btn_nosave : "Non salvare",
        procedureMessage_btn_ignoreandsave : "Ignora i messaggi e salva lo stesso",
        procedureMessage_modal_title: "Elenco errori ed avvertimenti",

        // header columns
        prodMess_id: "Id",
        prodMess_lonMsg: "Messaggio",
        prodMess_type: "Tipo",

        // messaggi su indicatori di attesa
        loader_waitListLoading:"Caricamento lista dei risultati",

        modalLoader_wait_search: "Ricerca in corso",
        modalLoader_wait_save: "Salvataggio in corso",
        modalLoader_wait_insertcopy: "Copia in corso, attendi per modificare e salvare",
        modalLoader_wait_metapage_loading: "Caricamento pagina",
        modalLoader_wait_metapageDetail_loading: "Caricamento pagina di dettaglio",
        modalLoader_wait_insert: "Creazione nuova riga, attendi prima di poter modificare",
        modalLoader_wait_delete: "Cancellazione della riga selezionata in corso",
        modalLoader_wait_page_update:"Attendi aggiornamento pagina",
        modalLoader_wait_tree_updating: "Aggiornamento albero",
        modalLoader_wait_tree_node_search : "Ricerca nodo sull'albero",
        modalLoader_wait_unlink_row : "Unlink della riga selezionata",
        modalLoader_wait_valuesSearching : "Ricerca valori in corso",
        modalLoader_wait_for_registration: "Attendi la registrazione utente",
        modalLoader_wait_for_save_layout:  "Salvataggio del layout in corso",
        modalLoader_wait_page_init : "Inizializzazione pagina",
        modalLoader_wait_tree_navigation : "Navigazione albero in corso",
        modalLoader_wait_waiting: "Attendere...",

        // server error
        serverUnracheable: "Rete non disponibile, oppure chiamata bloccata da un sistema di sicurezza (provare a disabilitare firewall o antivirus)",
        serverErrorInternal : "Errore interno del server: ",

        saveSuccesfully: "Dati salvati correttamente",

        adding_row: "Aggiungo riga..",
        newEvent: "Nuovo evento per",

        calendarWrongConfig: "La tabella del calendario non contiene le giuste colonne configurate. Contatta lo sviluppatore!",
        calendarNotRowCorrect : "Nel controllo calendario gli eventi non sono oggetti della tabella. Contatta lo sviluppatore!",
        agenda : "Agenda",
        details: "Dettagli",

        dragHereColumns: "Trascina qui le colonne che vuoi raggruppare",
        configAggrTitle: "Seleziona le funzioni di aggregazione",

        // Attachment
        download_attach: "Scarica allegato",
        upload_attach : "Carica",
        noAttachmentToUpload: "Devi specificare un allegato!",
        attachment : "allegato",
        tableAttachNotAvailable: "Non è presente la colonna S%cname%S sulla tabella principale della pagina",
        waitAttachLoading: "Attendi il caricamento dell'allegato",
        attachSent : "L'allegato è stato inviato correttamente, continua le tue modifiche e poi premi salva per confermare!",
        downloadAttachWaiting: "Download in corso",
        removeAttachWaiting : "Rimozione allegato in corso",
        removeAttach : "Rimuovi allegato",
        tableNotMatch: "La tabella principale non corrisponde a quella configurata sul tag del controllo di upload",
        //attachRemoved : "L'allegato è stato rimosso."

        // BEGIN STRING with the replacement
        calendarEventResizeEnd:  "Vuoi modificare la fine dell'evento: <br/> S%eventTitle%S  data-fine: <strong>S%endDate%S?</strong> <br/> <br/> Ricorda per rendere effettiva la tua modifica devi premere il tasto <strong>Salva</strong>",
        calendarEventMoveEventQuestion : "Stai modificando l'evento <br/> S%eventTitle%S mettendo data inizio: <strong>S%startDate%S</strong> data-fine: <strong>S%endDate%S</strong>. <br/><br/> Ricorda per rendere effettiva la tua modifica devi premere il tasto <strong>Salva</strong>",

        errorListingTypeNull : "ListingType è nullo sulla tabella S%searchTableName%S con il filtro S%filter%S nella MetaPage S%title%S",
        errorLoadingMetaData: "Errore nel caricamento del metadato  S%searchTableName%S è necessario riavviare l'applicazione",
        commandExecutionError: "Errore nell'esecuzione del comando S%command%S",
        entityNotfound: "Entità S%unaliased%S non trovata nel form S%formTitle%S",
        gridControlTagWrong : "DataGrid con tag S%gridTag%S nel form  S%formTitle%S è sbagliato",
        deleteRowConfirm : "La riga selezionata verrà rimossa immediatamente dalla banca dati. Confermi la cancellazione della riga selezionata?",
        cantUnlinkDataTable: "Impossibile unlink. DataTable S%sourceTableName%S  non " + decodeURI('%C3%A8') + " child di  S%primaryTableName%S",
        missingTableDataSet: "La tabella  S%tableName%S  non " + decodeURI('%C3%A8') + " presente sul DataSet",
        moreThenRow: "Errore: c'" + decodeURI('%C3%A8') + " più di una riga nella tabella S%tableName%S",
        gridDataNoValid : "La tabella S%tableName%S contiene dati non validi. Contattare il servizio di assistenza",
        cancelObjInsert: "Annullo l'inserimento dell'oggetto <strong>S%formTitle%S</strong>",
        deleteObjInsert : "Cancello l'oggetto selezionato?", //  S%formTitle%S
        formNoMainTreeView : "Il form S%formTitle%S non ha un treeview principale",
        invalidData : "La tabella S%tableName%S contiene dati non validi. Contattare il servizio di assistenza",
        noRowSelected : "Nessuna riga selezionata sulla tabella S%tableName%S",
        minNumrowRequired : "Occorre inserire almeno S%numrows%S S%msg%S",
        unvalidEMail: "L'email S%email%S non è corretta, inserisci una email valida",
        unvalidIp : "L'indirizzo ip S%ip%S inserito non è corretto",

        filterDateString: "Data compresa tra S%date1%S e S%date2%S",

        rowCouldBeDetached: "La riga selezionata potrebbe essere in stato detached",
        rowCouldBeDetachedOrDeleted: "La riga selezionata potrebbe essere in stato detached o deleted",
        copyPressedMsg : "E' stato premuto il tasto inserisci copia. Si desidera davvero creare una copia dei dati già salvati?",
        noRowOnTable: "Nella tabella S%searchTableName%S non è stata trovata alcuna riga.\r\n",
        filterWas: "La condizione di ricerca impostata era: S%mergedFilter%S \r\n",
        listName: "Nome Elenco",
        onDate: "il",
        createdByStr:  "Creato da S%user%S",
        createdOnStr:  "Creato il S%time%S",
        modifiedByStr:  "Modificato da S%user%S",
        modifiedOnStr: "Modificato il S%time%S",
        result: "Risultati: S%count%S",

        noNumericColumnForAggregation: "Nessuna colonna numerica presente, sulla quale calcolare funzioni di aggregazione",
        sum:"somma",
        avg: "media",
        max: "max",
        min : "min",

        passwordMismatched: "La conferma della password non corrisponde",

        // errori server
        serverErrorDataNotPermitted  : "Accesso non consentito in tale data in base alla gestione della sicurezza.",
        serverErrorNoCredential  : "Inserisci le credenziali",
        serverErrorExpiredCredential  : "Credenziali scadute, rieffettuare l'accesso",
        serverErrorExpiredSession  : "Sessione scaduta, rieffettuare l'accesso",
        serverErrorBadCredential  : "Credenziali non corrette, riprovare l'inserimento di utente e/o password",
        serverErrorTokenEmpty : "E' stato effettuato il logout",
        serverErrorUserNotSecurity: "Utente fuori dalla gestione di sicurezza. " +
            "1. Contatta Admin per inserimento utente virtuale, associato all'utente che sta eseguendo la login, su Organigramma (Organigramma ->  profilo -> tab utenti). " +
            "2. Potrebbe essere necessario eseguire la chiusura dell'anno precedente e generare il nuovo organigramma per l'anno nuovo.  " +
            "3. Controllare infine il dipartimento associato all' utente virtuale",
        serverErrorAnonymous : "Operazione anonima non permessa, provare ad effettuare di nuovo l'accesso",
        serverErrorSSO: "Non è stato possibile autenticare tramite SSO",
        dataContabileMissing : "Bisogna specificare una data contabile",
        filterWithUndefined : "La condizione di filtro contiene degli errori:",

        gridoption_tab1 : "Opzioni colonne",
        gridoption_tab2 : "Salva layout",
        savingLayoutError : "Errore nel salvataggio del layout",
        savingLayoutSucceded : "Layout della griglia correttamente salvato",

        pressSaveAfterDelete : "Premi ok per eliminare l'oggetto:<br/><br/><strong> S%valuecell%S </strong><br/> Poi premi salva sulla pagina se vuoi salvare le modifiche!",

        confirmSelection: "Conferma selezione",
        selectedRows: "righe selezionate"
    };
    let resource = LocalResourceIt;


    if (typeof appMeta !== "undefined"){
        appMeta.LocalResource.prototype.registerDictionary("it", resource);
    }
    else {
        module.exports = resource;
    }
}());


