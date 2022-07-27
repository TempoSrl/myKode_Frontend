# Frontend myKode

myKode frontend è un framework che consente di sviluppare maschere web anche molto sofisticate con pochissimo codice.

Il frontend javascript è un rich client, quindi l'interazione avviene senza continui postback.

Tramite dei servizi presenti nel backend (disponibile sia in versione Node.js che .NET), svolge un set di 
 operazioni che consentono una "normale ""operatività nelle maschere web, consentendo al tempo stesso una facile
 estendibilità sia dal punto di vista delle componenti visuali contenute nella maschera e sia delle funzioni
 di interazione specifiche che la maschera può prevedere.

Una generica maschera si intenda associata ad un [DataSet](https://github.com/TempoSrl/myKode_Backend/blob/main/jsDataSet.md), (simile a quelli di ADO.NET) che contiene la copia locale di un set
  di righe che sono presenti sul database (o che lo saranno in futuro)

Il DataSet però 

 Per "normale operatività" si intende:
 - la possibilità di impostare una ricerca in modalità "query by example", ossia immettendo i dati che si desidera confrontare
  nella maschera e poi avviare la ricerca sulla base dei dati inseriti
- modificare dei dati esistenti
- inserire nuovi dati 
- aprire delle maschere "di dettaglio" (anche di secondo o terzo livello ) sulle righe "figlie" della riga principale
- elenchi sulla selezione di righe parent della riga principale, al fine di valorizzare campi della tabella principale


L'idea di base è avere un DataSet (simile a quelli di ADO.NET) per memorizzare la copia locale