# Frontend myKode

myKode frontend è un framework che consente di sviluppare maschere web anche molto sofisticate con pochissimo codice.

Il frontend javascript è un rich client, quindi l'interazione avviene senza continui postback.

Tramite dei servizi presenti nel backend (disponibile sia in versione Node.js che .NET), svolge un set di 
 operazioni che consentono una "normale ""operatività nelle maschere web, consentendo al tempo stesso una facile
 estendibilità sia dal punto di vista delle componenti visuali contenute nella maschera e sia delle funzioni
 di interazione specifiche che la maschera può prevedere.

Una generica maschera si intenda associata ad un [DataSet](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataSet.md), (simile a quelli di ADO.NET) che contiene la copia locale di un set
  di righe che sono presenti sul database (o che lo saranno in futuro)


 Per "normale operatività" si intende, ad esempio:
- la possibilità di impostare una ricerca in modalità "query by example", ossia immettendo i dati che si desidera confrontare
  nella maschera e poi avviare la ricerca sulla base dei dati inseriti [1]
- modificare dei dati esistenti
- inserire nuovi dati [2]
- aprire delle maschere "di dettaglio" (anche di secondo o terzo livello ) sulle righe "figlie" della riga principale
- cancellare una riga e con tutti i relativi dettagli
- elenchi sulla selezione di righe parent della riga principale, al fine di valorizzare campi della tabella principale



L'idea di base è avere un DataSet (simile a quelli di ADO.NET) per memorizzare la copia locale dei dati oggetti dell'elaborazione,
 e operare sul database sulla base di un insieme di convenzioni e proprietà delle colonne del DataSet, oltre che alle righe 
 (DataRow) contenute dei DataTable.

Tuttavia il DataSet non si intende contenere un set di righe qualsiasi del database, ma dei dati che devono rispettare una certa 
 logica. 
 
## Tabella principale e subentità

In particolare, c'è una tabella "principale" che contiene una riga oggetto "principale" dell'elaborazione.

La tabella principale nell'ambito del framework è definita *entità*.

Ad esempio potrebbe essere la riga di una tabella anagrafica o di una tabella ordine.

Poi (opzionalmente) vi sono un insieme di tabelle "subentità", che rappresentano i dettagli della riga principale.
 
Nel caso di un'anagrafica potrebbero essere una tabella "indirizzo" con i vari indirizzi di quella persona (ufficio,
  domicilio fiscale, residenza, etc.) o una tabella "telefono" con i vari numeri telefonici.

Nel caso di un caso di un ordine, potrebbe essere una tabella "dettaglio_ordine" con i dettagli della merce ordinata.

La riga "principale" è quella che si seleziona dalla ricerca effettuata con la "query by example" del punto [1] di cui sopra,
  oppure la riga che si crea nel punto [2].
  
Ci possono essere poi nel DataSet altre tabelle referenziate, parent delle entità e subentità, e che non sono oggetto di modifica
 da parte della maschera. 

Durante l'edit dei dati da parte dell'utente, la distinzione tra questi due insiemi di tabelle è cruciale, infatti le tabelle 
 oggetto di editing (entità e subentità) non saranno mai rilette dal database, altrimenti l'utente perderebbe le modifiche 
 che sta facendo. 

Anche una riga (DataRow) in stato di inserimento (entità o subentità) sarebbe persa se quella tabella fosse per sbaglio riletta nel 
 DataTable corrispondente.

Viceversa, le tabelle parent possono essere rilette, ad esempio per selezionare una nuova riga parent della riga principale, o 
 semplicemente per aggiornarle caso mai fossero nel frattempo cambiate, come può succedere in caso di tabelle dal contenuto
 molto volatile.

Quando si crea una maschera si deve decidere qual è la tabella principale e quali subentità consentire di modificare in quella maschera
 e nelle sue eventuali maschere di dettaglio, e tali tabelle vanno inserite nel DataSet e relazionate.
 
Le tabelle che servono a migliorare la visualizzazione del primo set di tabelle, tipicamente tabella parent, vanno aggiunte al DataSet
 e relazionate inserendo le DataRelation opportune.


## Lettura e scrittura automatica del DataSet

Il vantaggio che si ottiene a questo punto è che il framework sa perfettamente riempire tutto il DataSet quando l'utente seleziona
  una riga dall'elenco.

Allo stesso modo se l'utente decide di cancellare la riga principale, il framework sa già quali sono le righer delle tabelle di 
 dettaglio da eliminare.

Infine, durante l'inserimento, il framework sa l'ordine con cui inserire le righe e come propagare il calcolo dei campi chiave
 incrementali dalle tabelle parent alle child.
 
All'opposto, le tabelle che non sono entità o subentità non saranno mai scritte nel salvataggio dei dati di una maschera.


## Visualizzazione dei dati

Il disegno di una maschera web avviene con semplici tag HTML ove negli attributi si specifica un attributo data-tag per indicare quale campo di quale tabella
 sarà mostrato in quel controllo.

In ogni maschera sono normalmente visibili ed editabili (a meno di inibire tale comportamento) i campi della tabella principale. 

E' possibile anche, ove una subentità sia in rapporto 1:1 con l'entità (almeno nell'ambito della visualizzazione corrente), mostrare e consentire l'editing
 anche dei campi della sua riga. 

Un esempio di tale tabella potrebbe essere una tabella che contiene la dichiarazione dei redditi di un contribuente, e si decidesse di 
 visualizzare, in una certa maschera, solo la riga dell'anno corrente.

In questo caso si potrebbe filtrare la tabella della dichiarazione per anno fiscale, e con questa premessa diventerebbe in rapporto 1:1 con la tabella del 
 contribuente, pertanto si potrebbero visualizzare i dati della dichiarazione fiscale anche in una maschera ove la tabella principale fosse il contribuente.

Negli altri casi, ovvero ove una tabella non sia subentità e/o non sia in rapporto 1:1 con le righe della tabella principale, non sarà possibile mostrare i campi
 di quella tabella nei controlli "semplici", come input-text o simili, ma solo in html tables, che consentono di visualizzare più righe.
 
Grazie a queste premesse, il framework provvede in automatico a riempire i campi della maschera web che hanno l'attributo data-tag, che è del tipo "tabella.campo".

Analogamente, quando occorre, il framework è in grado di leggere i dati della maschera e riportarli nelle opportune righe del DataSet.
Ulteriori dettagli in [MetaPage HTML](metapagehtml.md).

## Ciclo di modifica dei dati

E' possibile anche aggiungere qualsiasi comportamento alla maschera, e di base non è necessario leggere o scrivere nei controlli html.

Infatti la convenzione per leggere o scrivere i dati della maschera è utilizzare il seguente schema:

1) invocare MetaPage.getFormData() che legge i dati della maschera aggiornando il contenuto del DataSet
2) operare sui DataRow del DataSet a piacimento, modificando o inserendo dati nelle tabelle entità e subentità
3) invocare MetaPage.freshForm() per visualizzare i dati del DataSet nella maschera web

in questo modo il codice diviene slegato dalla conoscenza specifica di quale controllo e di che tipo contenga ogni campo che deve essere oggetto 
 di una ipotetica elaborazione.


 ## Struttura dell'applicazione

### MetaApp

L'elemento di più alto livello di un'applicazione myKode è la classe [MetaApp](MetaApp.md), che si occupa di registrare e di fornire tutte le pagine
  ([MetaPage](MetaPage.md)) ed i [MetaDati](https://github.com/TempoSrl/myKode_Backend/blob/main/jsMetaData.md)

MetaApp si occupa di gestire lo stack delle pagine che vengono via via aperte e chiuse, e del passaggio dei dati tra le stesse.

Di solito non è necessario derivarne una sottoclasse, ma è possibile personalizzarla per modificare la cartella in cui reperisce i file ed i metadati sul server.

E' necessario registrare tutte le pagine e tutti i metadati con i metodi di MetaApp. In particolare il metodo 

			addMeta({string}tableName, {[MetaData](https://github.com/TempoSrl/myKode_Backend/blob/main/jsMetaData.md)} Meta)

serve ad associare al nome di una tabella il costruttore del relativo metadato, e analogamente

			addMetaPage({string}tableName, {string} editType, {[MetaPage](metapagehtml.md)}metaPage)

serve ad associare alla coppia tableName-editType una pagina (MetaPage).


### MetaData

Un [MetaDato](https://github.com/TempoSrl/myKode_Backend/blob/main/jsMetaData.md) è una classe javascript che descrive le proprietà di una tabella.

E' da notare che le proprietà suddette sono impostate come attributi dei DataTable e dei DataColumn del DataSet, ossia il DataSet contiene tutte le informazioni
 su tutte le tabelle che lo compongono. 
 
 Usare il metadato per impostarle invece di ripetere tali impostazioni in altri luoghi, come ad esempio in tutte le maschere
  che dovessero usare tali tabelle, è cruciale per non ripetere codice e rendere possibile la loro manutenzione in modo efficace.

Inoltre tali informazioni sono usate dal framework ogni volta che ne abbia la necessità, come ad esempio per creare nuove righe in una tabella
 o validare i dati di una riga.

Essendoci solo un luogo dove descriviamo tali proprietà sarà più comodo sia reperirle che cambiarle con sicurezza.


###  MetaPage

La [MetaPage](MetaPage.md) è la classe che contiene il codice "comune" a tutte le pagine, come la gestione dei controlli, la gestione della toolbar dei comandi,
 il riempimento della maschera con i dati del dataset (freshForm) e la lettura dei dati della maschera nel DataSet(getFormData)

La MetaPage è di norma derivata per implementare tutte le pagine utente, ed offre dei metodi appositi (degli hook) per integrare il comportamento base
 con funzioni specifiche di ogni pagina.

Pertanto se le classi derivate da MetaData contengono delle informazioni generali su ogni singola tabella, condivise da tutta l'applicazione, le 
 classi derivate da MetaPage descrivono ogni singola pagina

Ogni pagina web gestita dal frontend myKode è divisa (almeno) in due parti: l'html e la MetaPage corrispondente, che è una classe derivata da MetaPage
 e con le peculiarità di quella pagina.
Il frontend può, ove necessario, accedere a numerosi servizi del backend per leggere/scrivere dati, utilizzando generalmente la oggetti di tipo 
 [sqlFun](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataQuery.md) per i filtri e [DataSet](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataSet.md)
 per gestire i dati.

