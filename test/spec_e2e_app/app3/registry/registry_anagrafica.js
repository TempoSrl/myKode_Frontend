(function() {
    var MetaPage = window.appMeta.MetaPage;
    var q = window.jsDataQuery;
    function metaPage_registry() {
        MetaPage.apply(this, arguments);
        this.name = 'metaPage_registry';

        // *****************************************************************************************************
        // ****************************** TEST FILE GRID_MANAGER************************************************
        // *****************************************************************************************************

        // OK 8. Html con griglia Manager. Deve fungere da manager. Una volta caricato, clicca sulle righe, i controlli della pagina si popolano con la corrispondente riga selezionata

        // OK 8.1 Dopo activate() premi su una riga da editare, Poi premi il tasto correggi, apre nuova form registry_reference, digita un nuovo titolo, poi premi mainsave
        // torna sul form principale, con la colonna della riga , modificata correttamente. (Ha fatto la propagate chanegs to master)
        // Poi premi il tasto save sulla toolbar, deve andare sul db e fare la doPost. Torna messaggio di warning, su "partita doppia"
        // -> Ai fini della corretta generazione delle scritture in partita doppia è necessario inserire la causale di debito o di credito nella scheda "Altri dati"
        // Puoi salvare ed ignorare, torna 1 altro errore stavolta non ignorabile. si può solo che fare ignora.

        // OK 8.2 Dopo activate() premi su una riga da editare, Poi premi il tasto aggiungi, apre nuova form registry_reference, con i campi popolati con i defaults
        // -> id deve essere un amx preso dal default. Digita i valori, senza toccare idreg, che è lì solo per debug. Premi mainsave. Lui esegue la porpagation
        // aggiunge quindi la riga alla tabella del form principale. si chiude il dettaglio. e la riga è aggiunta sulla griglia html.
        // Poi premo save sulla toolbar. dovrebbe risultare una riga in stato added.
        // Dopo che fa la post appare messaggio errore:
        // "Ai fini della corretta generazione delle scritture in partita doppia è necessario inserire la causale di debito o di credito nella scheda "Altri dati"
        // "Premi ignora e salva!". Lui effettua la insert a Db. Basta andare su db e fare la query opportuna con l'id aspettato.
        // C'era un bug, inserisce ID creato dal client! Perchè non c'era la ser js -> c# delle prop di Autoincrement. Ora sono state gestite, ed inserisce correttamente idreg giusto.

        // Seleziona la riga, premi "cancella" lui toglie la riga dalla griglia. Se premi "Salva" sulla toolbar effettua la post con la riga deleted.
        // Se controlli a db la riga è effettivamente cancellata.

        // se ripeti 8.2 ma non salvi a db, e cambi riga, deve mostrare popup "ci sono modifiche", vuoi perdere, se premo no rimane così, se premo ok, il dettaglio si popola con l
        // i nuovi valori, mentre sulla griglia la colonna editata torna con il vecchio valore, successivamente può essere cliccta ed editata.

        // OK 8.3 Dopo activate() premi su una riga da fare unlink; Mostra messagebox "Impossibile unlink. DataTable registry non è child di registry."
        // premo "ok" e torna sulla pag

        // OK 8.4 Dopo activate() premi su una riga. Premi tasto inserisci copia sulla toolbar. Apre il form di dettaglio per fare edit. se premo mainsave, torna sulla apg
        // principale, automaticamente lui fa la save a db, apre la form errori ignorabili
        // Se lo fai su una riga di quelle esistenti, dà un errore non ignorabile, quindi devi premere non salvare. Lui inserisce la riga
        // graficamente, ma se cambi selezione, dà il popup, ci sono modifiche, premo ok perdi loemod, la riga sulla griglia sparisce.
        // Se fa il copy su una riga inserita con un test di inserimento e cambi il title ad esempio dà errore ignorabile.
        // Ai fini della corretta generazione delle scritture in partita doppia è necessario inserire la causale di debito o di credito nella scheda "Altri dati"
        // Premi salva e ignora, lui torna sulla griglia. A db se controlli c'è la nuova riga copiata de inserita
        

        // 9 Bottone cmdMainInsertCopy.
        // 9.0 caso non lista entra su EditNewCopy. Devi decommentare la parte sulla activation che per debug fa la fill de ds. e togli
        // dall'AfterLink la setList()
        // Dopo la copia appare nuova riga su griglia, con id calcolato dal client. Premi "salva", ad db appare il record nuovo, sulla ui la griglia si rinfresca
        // con l'id calcolato dal server con autoincrement.
        // -> "Doppio click" va in edit, metto un testo nel campo annotation, e premo
        // -> "main save" torna sulla pag principale e la griglia si rinfresca con i dati editati
        // -> "premo salva" sulla toolbar ricevo 1 msg ignorabile, e salvo -> ritrovo la riga con il campo editato

        // 9.1 Caso  lista: metti dall'AfterLink la setList()
        // Premi "Inserici copia" -> apre il dettaglio per editare, e cambiare alcuni parametri.
        // Premi mainsave, trona al padre e salva. -> A DB appare il record.
        // Fai doppio click
        // doppio click sulla riga creata, cambia annotazione premi mani save, la griglia mostra nuovo valore,
        // "Salva" ignora e salva-> a db viene salvato la modifica
        // Premi "Elimina" sulla toolbar -> la griglia si rinfresca togliendo la riga, a DB la riga scompare.
        // this.startFilter = q.or(q.eq('idreg',1) , q.eq('idreg',2), q.eq('idreg',6), q.eq('idreg',9990001), q.eq('idreg',1040471), q.eq('idreg',1040479));
        switch (appMeta.testCaseNumber){
            case 1:
                this.firstSearchFilter = appMeta.testStartFilter;
                break;
            case 7:
                break;

        }
        
    }

    metaPage_registry.prototype = _.extend(
        new MetaPage('registry', 'anagrafica', false),
        {
            constructor: metaPage_registry,

            superClass: MetaPage.prototype,

            /**
             * Metodo ereditato da farne l'override
             */
            afterLink:function () {
                //this.setList($("#grid1"));
            }
        }
      );

    window.appMeta.addMetaPage('registry', 'anagrafica', metaPage_registry);
}());
