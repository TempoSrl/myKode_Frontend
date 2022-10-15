# HTML di una Pagina 

Affinché una web page sia gestita correttamente nel frontend myKode, è necessario che i controlli HTML relativi ai dati da visualizzare o modificare (quest'ultima opzione solo per le tabelle entità o subentità in relazione 1 a 1 con l'entità principale) siano corredate di specifici attributi. 


Alcune regole sono inoltre applicate per ciò che riguarda la disabilitazione dei campi:
- Se myKode trova un controllo nello stato di disabilitato (Enabled=false o ReadOnly=true) lo lascia in quello stato. Tuttavia imposta il suo valore a prescindere dallo stato. Quindi accertarsi, se si lascia un campo di disabilitato, di impostare i valori di default per quel campo, poiché l’utente non avrà modo di modificarlo.
- Se un campo della tabella principale fa parte della chiave primaria o è ad autoincremento ed il form è in fase di “edit”, quel campo sarà disabilitato. Ossia non è possibile cambiare la chiave primaria di una riga dopo averla creata.
- Se un campo non è associato alla tabella principale, sarà in genere disabilitato in fase di modifica/inserimento, a meno che non sia impostato esplicitamente come campo di “ricerca” diverso dal campo “standard”, includendo in esso la parte [? …] del Tag, ed abbia un data-attribute data-subentity=”true”. Quasi tutti i controlli hanno un Tag del tipo StandardTag:SearchTag.


Lo StandardTag è usato quando il controllo deve essere letto dal Form nel DataSet o preso dal DataSet per riempire il form. Il SearchTag è usato per costruire il filtro per visualizzare l’elenco che appare quando si spinge ‘effettua ricerca’


Il framework gestisce in maniera automatica il binding del controllo con i dati sottostanti ospitati sulla MetaPage associata, tramite l’utilizzo dei data-* attributes.


Vediamo di seguito la lista dei controlli html5 gestiti dal framework e il formato del tag di configurazione che essi supportano:



## INPUT 


Tutti i campi INPUT esclusi LABEL e BUTTON hanno un attributo di nome data-tag con la struttura

        standard tag[?search tag]

Lo standard tag è usato per la lettura e scrittura nel controllo, mentre il search-tag è usato per estrarre la condizione di ricerca. Entrambi hanno la stessa struttura interna. Il search tag è usato solo in particolari casi in cui la ricerca è effettuata su un campo il cui nome differisce da quello presente nello standard tag.


Ricorda che nel caso non si tratti della tabella principale il campo in fase di edit/inserimento è disabilitato, mentre in fase di ricerca è sempre abilitato.

L’unico modo per renderlo editabile è:
 1. inserire data-subentity e specificare un “seachTag.SearchField”. Il SearchField  dovrà essere presente sulla vista di ricerca della pagina. (per questo motivo sui campi AutoChoose verrà inserito automaticamente il tag “?x” dopo lo standard tag)

2. inserire data-subentity ed essere sicuri che il campo sia un child della riga principale.


Se la MetaPage trova che un controllo è disabilitato (Enabled=false o ReadOnly=true) lo lascia in quello stato. Tuttavia imposta il suo valore a prescindere dallo stato. Quindi accertarsi, se si lascia un campo di disabilitato, di impostare i valori di default per quel campo, poiché l’utente non avrà modo di modificarlo.


### type TEXT e TEXT AREA

Entrambi i tag, ove presenti, hanno la forma: tabella.campo[.formato]

- tabella è il nome della tabella a cui si riferisce il campo
- campo è il nome del campo visualizzato nel controllo
- formato è una stringa che modifica il modo in cui vengono mostrati i dati

Se il dato è numerico e formato inizia con **fixed** allora avrà la struttura:

        fixed.pos_decimali.prefix.suffix.scale

dove

- pos_decimali è il numero di cifre decimali da mostrare
- prefix è una eventuale stringa da preporre al numero in fase di visualizzazione 
- suffix è una eventuale stringa da postporre al numero in fase di visualizzazione (es. un simbolo di percentuale %) 
- scale è un fattore di scala da usare ai fini della visualizzazione. Ad esempio se il numero è una percentuale memorizzata come valore compreso tra 0 e 1, ma la si volesse visualizzare come numero compreso tra 0 e 100, scale dovrebbe essere 100


Questo formato è importante per visualizzare numeri con numeri di cifre prefissati o scalati o seguiti o preceduti da prefissi/suffissi. Tali modifiche sono applicate in modo trasparente quando si legge o scrive il dato nella casella interessata.

Altri valori che può assumere il formato sono:

Per i campi numerici:

- n: Number
- c: Currency ed in questo caso sarà formattato con il simbolo dell’euro
- d: Integer
- e, f: Float
- g: qualsiasi
- x: Esadecimale


Per le date:

- g: E’ il formato default. e mette nel formato dd/mm/yyyy hh:mm
- d: formato dd/mm/yyyy. E’ anche il default per i valori delle colonne di tipo “DataTime”. cioè nel caso non specifichiamo nessun formato
- dd: formato yyyy-MM-dd






### type CHECKBOX

Il data-tag del controllo CHECKBOX può assumere due forme:

- tabella.campo:valoreSI:valoreNO se si vuole che il campo assuma valoreSI o valoreNO a seconda che il checkbox sia settato o meno
- tabella.campo:nBit se nBit è il numero del bit da impostare nel campo indicato ove il checkbox sia selezionato, mentre sarà azzerato nel caso opposto
- tabella.campo:#nBit se nBit è il numero del bit da impostare nel campo indicato ove il checkbox sia deselezionato, mentre sarà azzerato nel caso opposto (funziona in logica negata rispetto al caso precedente)

caso particolare, se il controllo ha l'attribute indeterminate impostato, assume un valore indeterminato che non è né vero né falso e rappresenta il valore null

Se vogliamo che la checkBox gestisca il threestate, bisogna che le colonne del dataset abbiano configurate le seguenti proprietà:
-  isDenyNull = false 
-  allowDbNull = true
 
In tal caso il framework aggiunge automaticamente tale informazione sul controllo html attraverso il data-attribute:
data-threestate="true". 

### type RADIO

Il data-tag del controllo RADIO può assumere tre forme:

- tabella.campo:valoreSI  e il campo sarà impostato a valoreSI ove il RADIO corrispondente sia selezionato
- tabella.campo::nBit se nBit è il numero del bit da impostare nel campo ove il radiobutton sia selezionato
- tabella.campo::#nBit se nBit è il numero del bit da resettare nel campo ove il radiobutton sia selezionato

Nulla accade ove il radio non sia selezionato


### Label

Il data-tag ha il seguente formato: 
   
     Table.Field

ove
Table: Tabella da cui deve essere preso il dato da visualizzare
Field: Nome del campo da visualizzare

Esempio:
<label  data-tag="registry.annotation"></label>



## DIV e SPAN con attributo data-value-signed

In questo caso la DIV o SPAN deve contenere tre componenti: una input text e due input radio:

- la input TEXT è la prima text che viene trovata nella DIV/SPAN (dovrebbe essercene una sola)
- la input RADIO "segno +"  è il primo radio che viene trovato che non abbia il data-tag impostato a "-"
- la input RADIO "segno -"  è il primo radio che viene trovato che abbia il data-tag impostato a "-"

Una DIV o SPAN siffatta è interpretata in questo modo dal framework: l'input TEXT è usata per contenere un valore numerico, che si intenderà avere segno positivo se il radio di segno positivo è selezionato, altrimenti avrà segno meno.

LA DIV o SPAN di suo dovrà avere un data-tag nella forma tabella.campo (cosi come altri INPUT)
Pertanto in fase di visualizzazione, nella TEXT sarà messo il valore assoluto del numero mentre i radio button saranno selezionati o deselezionati in base al segno del valore rappresentato.


Esempio:

```HTML

        <div data-tag="tabella.colonnaNumerica" data-value-signed> 
            amount: <input type="text data-tag="t.ctemp" >
            <input type="radio" name="op" value="add" data-tag="+"> Add 
            <input type="radio" name="op" value="sub" data-tag="-">Sub
        </div>

```

## Button

E' possibile associare ai bottoni dei tag con vari comandi, alcuni dei quali sono spesso presenti sulla toolbar.

Una convenzione generale è che se ad un controllo deve essere applicato un filtro, questo è impostato nell'attributo data-filter, da codice, nella MetaPage, con una istruzione del tipo:

Nell'HTML:

```HTML

        <button type="button" id="btn_tratta_spese" class="btn btn-primary mb-2" data-tag="choose.chargehandling.default">Tratt. Spese</button>

```

nella MetaPage:

```JS

        afterLink:function () {
            var filterTrattaSpese = this.q.ne("active", 'N');
            this.registerFilter($("#btn_tratta_spese"), filterTrattaSpese);
        }
```

in questo caso al bottone btn_tratta_spese è associato un filtro sul campo active

Ci sono diverse funzioni standard a cui può essere associato un bottone, ma volendo se ne possono aggiungere altri effettuando l'overload del metodo doMainCommand(tag, filter) della MetaPage.

Vediamo le funzioni standard associabioli ad un button tramite il data-tag

### choose

Questo controllo serve ad attivare la visualizzazione di un elenco su una determinata tabella o vista.
Il tag ha la forma:

    choose.tableName.listType[.clear]

la coppia tableName-listType come abbiamo visto individua una modalità di visualizzazione di un elenco sulla tabella tableName.

Se presente la parte .clear, l'effetto è lo stesso di selezionare "nessuna riga" sulla tabella indicata, con conseguente svuotamento degli eventuali controlli relativi ad essa.

Una volta che appare l'elenco, l'utente ha la possibilità di selezionare una riga o uscirne senza selezionare nulla.

Se l'utente seleziona la riga, abbiamo due casi:

- [1] se le tabella visualizzata è parent della tabella principale della maschera, la riga corrente delle tabella principale è modificata valorizzando i campi child della relazione in modo che diventi effettivamente child della riga selezionata
- [2] se la tabella visualizzata è una figlia, ma non subentità della tabella principale, allora viene marcata come tabella child non-subentità e la riga selezionata è unita al DataSet e modificata in modo da risultare effettivamente figlia della riga corrente della tabella principale. Tale riga entrerà nel processo di salvataggio a meno che non venga in seguito deselezionata o non si decida di annullare tutte le modifiche


tutto questo se la maschera si trova in fase di modifica o inserimento, mentre se la maschera si trova in fase di "imposta ricerca", nel caso [2] non succede nulla, mentre nel caso [1] in fase di effettua ricerca il campo che collega la tabella principale sarà unito al filtro da applicare all'elenco



### manage

Questo controllo serve ad attivare la visualizzazione di una maschera di tipo "lista" su una determinata tabella o vista. In questa maschera sarà possibile eventualmente aggiungere nuove righe, salvarle e 
Il tag ha la forma:

    manage.tableName.editType

dove tableName-editType identifica quale pagina da visualizzare e relativa MetaPage

Sarà possibile, nella maschera aperta, selezionare una riga e tornare in questo modo alla maschera di partenza con un effetto simile a quello descritto nel comando Choose


### insert, edit, delete, unlink

ove presenti nello stesso contenitore di un grid, serviranno ad invocare i metodi insertClick, editClick, deleteClick, unlinkClick descritte in [MetaPage](MetaPage.md)


### comandi principali

Ogni tag descritto in [MetaPage](MetaPage.md) relativo al comando commandEnabled causa l'esecuzione del relativo comando. Il bottone risulterà disabilitato se la funzione commandEnabled restituisce false per quel tag.

Anche per i bottoni rimane valida la convenzione che se presente un filtro nel tag data-filter, sarà applicato alla funzione eseguita da quel bottone.




## DIV e SPAN

I tag AutoChoose e AutoManage causano la visualizzazione paginata, di un insieme di righe, la possibilità di selezionare da tale elenco. Essendo usata la paginazione, tale elenco può anche complessivamente abbastanza corposo. Se si tratta invece di voler consentire la selezione da un numero limitato di righe, è possibile usare il tag SELECT, nel qual  caso il DataSet conterrà una copia cached delle righe da visualizzare.

### AutoChoose

E' un tag che si applica a DIV o SPAN che contengono un controllo TEXT con un data-tag relativo ad una tabella e campo  tableName.fieldName 

Il data-tag della DIV o SPAN invece sarà del tipo 
        
    AutoChoose.idTEXT.listType

L'effetto sarà che quando si cambierà manualmente il contenuto della TEXT apparirà un elenco della tabella indicata nel data-tag della TEXT relativo al listType indicato, filtrato con il contenuto della TEXT al momento in cui si lascia il fuoco della TEXT.


Quando verrà scelto un valore dalla lista visualizzata, la lista verrà chiusa e il valore mostrato sulla textBox. Il Framework gestisce un campo text invisibile dove verrà memorizzato il valore del <campo_chiave> di tale tabella. Il data-tag di tale text nascosta sarà  

    parentTable.parentField?childTable.childField.


La tabella dell’autochoose solitamente è padre della tabella principale del dataset di pagina


Per permettere l’edit durante la modifica oppure l’edit durante l’inserimento di un nuovo oggetto nella maschera, di un campo di una tabella che non sia quella principale (main questo caso dovrebbe essere una subentità), bisogna indicare sul controllo html l’attributo “data-subentity=true”.

Il framework, tramite le DataRelation presente sul DataSet sarà in grado di propagare il valore del <campo_chiave> sulla riga principale dopo la scelta. Il framework infatti cerca ricorsivamente una tabella che sia relazionata tramite parent-child o child-parent con una chiave, “singola”, e se la trova inserisce tale valore sul record della tabella individuata. 

Quando verrà effettuato il salvataggio, la nuova riga inserita, che potrebbe anche essere una child a sua volta della riga principale avrà nel <campo_chiave>  l’id numerico del valore scelto nella lista dell’AutoChoose.


### AutoManage

E' un tag che si applica a DIV o SPAN che contengono un controllo TEXT con un data-tag relativo ad una tabella e campo  tableName.fieldName 

Il tag della DIV o SPAN invece sarà del tipo 
        
    AutoManage.idTEXT.editType

L'effetto sarà che quando si cambierà manualmente il contenuto della TEXT apparirà la maschera individuata dalla coppia tableName-editType ove tableName è quella indicata nel data-tag della TEXT, che dovrebbe essere di tipo lista, filtrata con il contenuto della TEXT al momento in cui si lascia il fuoco della TEXT. 

Nella maschera che si aprirà sarà possibile selezionare una riga esattamente come accade con il comando manage.

E' analogo all'AutoChoose ma apre una maschera invece di un elenco.



In fase di impostazione della lettura dei dati e della ricerca, l'effetto dei tag choose/autochoose è creare un controllo nascosto sul campo della tabella principale relazionato con la tabella parent mostrata dall'autochoose/automanage.

In questo modo anche se il tag della TEXT si riferisce alla tabella parent, perché è quel campo che viene mostrato, in effetti sarà un campo della tabella principale ad essere effettivamente modificato e ricercato, che è poi il comportamento atteso quando si seleziona un valore da una tabella di lookup. Tutto questo avviene in maniera del tutto trasparente ed automatica.

Per permettere l’edit durante la modifica oppure l’edit durante l’inserimento di un nuovo oggetto nella maschera, di un campo di una tabella che non sia quella principale (main questo caso dovrebbe essere una subentità), anche in questo caso bisogna indicare sul controllo html l’attributo “data-subentity=true”.








## Custom controller

I custom control sono dei controlli diversi dai precedenti e gestiti con dei comportamenti custom, che dipendono dal controllo, e questo consente di scrivere ed integrare qualsiasi componente visuale che implementi una semplice interfaccia. Una volta creata la classe che lo gestisce, il custom-controller, è possibile inserire nelle maschere delle istanze di tali controlli, semplicemente specificando nell'attributo data-custom-control il codice del controller ad esso associato.

E' ovviamente possibile definire altri attributi a seconda del controller che si intende realizzare.


Tutti i custom controller, nel data-tag, devono avere come primo campo, la tabella a cui si riferiscono.

myKode gestisce diversi controlli implementandoli come custom-control, e ognuno di questi prevede degli attributi specifici, in base alla sua funzione. 

In fase di preScan, ad ogni custom-control è associata una istanza del suo relativo custom-controller, e tale istanza è anche associata al suo attributo data-customController. Di tale istanza è invocato il metodo init in questa fase.

Il costruttore dei CustomController deve avere l'interfaccia:

```js

        new CustomController(el, helpForm, table, primaryTable)
```

ove

- el è l'elemento html a cui è associato il controller
- helpForm è l'istanza di HelpForm associata alla MetaPage
- table è il DataTable a cui si riferisce il controller
- primaryTable è il DataTable della tabella principale della maschera



Il nuovo custom control  per interagire con il resto delle logiche del framewrok, dovrà implementare una serie di metodi, e poi dovrà essere aggiunto alla collection dei custom control tramite l’istruzione:
window.appMeta.CustomControl("grid", <MyControl>);

Quindi ad esempio un nuovo custom control “myControl” avrà la seguente struttura:


```js

    (function() {

        function myControl(el, helpForm, table, primaryTable) {
           if (this.constructor !== myControl) {
               return new myControl(el, helpForm, table, primaryTable);
           }

           return this;
    }



    window.appMeta.CustomControl("myControl", myControl);

    }());
        
```

### funzioni da implementare

Come abbiamo accennato in [MetaPage](MetaPage.md), i principali metodi che un custom controller deve implementare sono:

- fillControl: In base al contenuto della tabella table passata nel parametro del costruttore esegue il popolamento del controllo grafico.

- getControl: In base al solito data-tag impostato sul controllo e al valore che assume, popola il dataset sottostante.

- clearControl: Esegue un reset, sia grafico che delle strutture ausiliarie interne.

preFill: Si lega all’evento preFill della form, quindi bisogna implementare tale metodo se sia ha la necessità di caricare il controllo con dei dati di partenza. Come ad esempio avviene per le combobox

getCurrentRow: Ritorna un oggetto javascript con questa struttura: 
{ result: boolean, changed: DataTable, rowChanged: ObjectRow }, cioè un oggetto dove si indoca eventualmente la riga correntemente selezionata sul controllo. Ricordiamo che il custom control può visualizzare più di una riga di una determinata tabella.

addEvents: in questo metodo si può sottoscrivere il nuovo controllo a reagire ad alcuni eventi del framework stesso, come ad esempio all’avento di ROW_SELECT, e quindi scatenare della logica all’interno del controllo a seguito della selezione di una nuova riga nel form ospitante




### calendar - CalendarControl

Il data-custom-control in questo caso vale "calendar"
Il data-tag invece è nella forma tableName.listType.editType ove;


- tableName: Nome della tabella da cui deve essere preso il dato da visualizzare
- listType: Listing-Type da utilizzare, ossia il nome simbolico dell’elenco desiderato.
- editType:  Edit-Type da utilizzare per la modifica della riga, quando si fa “doppio click” sul calendario o si preme il tasto aggiungi/correggi.

Esempio:

```html

    <div data-tag="lezione.default.default" data-custom-control="calendar"></div>
```

Il costruttore è 
 CalendarControl(el, helpForm, table, primaryTable, listType, isListManager) 

E' un controllo che visualizza un calendario, dove ad ogni data può corrispondere una riga di una tabella.

Come i grid, ha la possibilità di inglobare dei bottoni che abilitano inserimento/modifica/cancellazione:

- data-mdlbuttoninsert: se presente sarà disponibile un bottone per inserire righe
- data-mdlbuttonedit: se presente sarà disponibile un bottone per editare righe
- data-mdlbuttondelete: se presente sarà disponibile un bottone per cancellare righe


Poi vi sono altri attributi:

- data-mdlstartcolumnname: campo usato per l'inizio degli eventi visualizzati (se assente è usato il campo di nome start)
- data-mdlstopcolumnname: campo usato per la fine degli eventi visualizzati (opzionale)
- data-mdltitlecolumnname: campo usato per il titolo degli eventi
- data-mdlmaincolor: colore di fondo, default è #0275d8 (opzionale)
- data-mdlweekend: abilita la selezione dei fine settimana
- data-mdldragdrop: abilitare il drag and drop degli eventi, il quale va quindi ad influire sul datarow sottostante e cambiando i valori di start e stop


```html

  				     <div id="calendar37" data-tag="lezione.attivform.attivform" data-custom-control="calendar"  
                        data-mdldragdrop ></div>
```

Come per la griglia, la pressione del tasto di edit apre una nuova MetaPage per aggiornare l’oggetto dettaglio associato. Al ritorno dalla pagina di dettaglio, tramite tasto “ok”, il controllo verrà rinfrescato con le nuove informazioni modificate. Stessa cosa per l’inserimento.

Quando il calendario è chiamato all’interno di un ListManagerCalendar il parametro isListManager nel costruttore sarà true.




### checklist - CheckBoxListControl

Questo tag è usato per le liste selezionabili/deselezionabili

Il data-tag ha il seguente formato: 
	tableName.listType

ove
- tableName: Tabella da cui devono essere presi i valori da mostrare
- listType: Listing-Type da utilizzare, ossia il nome simbolico dell’elenco desiderato.

Esempio:

```html

    <div id="checklist1" data-tag="childTable.listtype" data-custom-control="checklist"></div>
```


La checkbox list rappresenta il collegamento tra due entità che possiedono una relazione molti a molti. Quando si selezionano righe sulla lista e si salva verrà creato un nuovo record in una tabella di collegamento. La tabella “di collegamento” viene calcolata automaticamente a partire dal dataset. Tale tabella deve avere le seguenti particolarità:
1.	possedere una relazione parent-child con la tabella principale del form, in cui la tabella principale del form sia parent e la tabella di collegamento childTable.
2.	possedere una relazione parent-child con la tabella specificata nel tag del controllo, in cui la tabella del tag è parent , mentre la tabella di collegamento è child.
La tabella di collegamento conterrà quindi gli id delle 2 tabelle parent  a cui è collegata.
Allo stesso modo quando deseleziono una riga nella lista e salvo, verrà cancellata a db una riga da tale tabella di collegamento.

La checklist graficamente si presenta come un grid. Le colonne vengono descritte dalla funzione describeColumns() a seconda del ListType specificato nel tag.

Il controllo ha una prima colonna formata da checkbox che possono essere selezionate o deselezionate.




### combo - ComboManager

Il tag di un data-custom-control "combo" è tableName.field, dove tableName è il nome della tabella principale e field il campo della tabella principale.
Questo custom-control serve a gestire i controlli con tag SELECT.
Le tabelle associate alle SELECT sono automaticamente messe in cache (lette una volta sola) nel DataSet della maschera in cui si trovano

**Nota:**
Non è necessario per il tag  SELECT impostare il tag data-custom-control, poiché vi viene apposto "d'ufficio" (in fase di prescan) ove non sia presente.


Tuttavia è necessario impostare altri attributi affinché il controllo funzioni:

- \{string} data-sourceName : nome tabella usata per le righe visualizzate (obbligatorio)
- \{string} data-value-member: nome del campo di sourceName usato per estrarre il valore  (obbligatorio)
- \{string} data-display-member: nome del campo di sourceName da mostrare nella tendina (obbligatorio)
- \{string} [data-no-blank] : se presente NON è inserita una riga vuota, mentre di default il primo valore selezionabile nella tendina è una riga vuota che fa sì che venga inserito un NULL nel campo corrispondente
- \{string} [data-master]  : nome della master table da cui questa combo dipende, ove presente. Se presente, ogni volta che dalla tabella master è selezionata una riga, il data-source di questa SELECT è ridisegnato filtrando solo le righe della tabella data-sourceName che risultano child di quella riga master


Vediamo un esempio di uso di un combo.
Supponiamo di avere in un form “Anagrafica” il campo “idregistryclass” che indica il tipo di classe. Esiste una tabella di nome “registryclass” che ha due campi: idregistryclass e description, ove idregistryclass è il campo chiave. Il campo “idregistryclass” di “registryclass” è dunque chiave esterna per la tabella registry. Vogliamo usare un ComboBox per selezionare, nel form del Anagrafica, il tipo di classe.

In questo caso gli attributi da impostare sono:
- data-tag : registry.idregistryclass
- data-source-name:    tabella “registryclass”
- data-value-member:   “idregistryclass” ossia il campo chiave della tabella registryclass
- data-display-member: “description”


Di seguito come dovrebbe essere configurata sul’html tale controllo select:


```html

        <select data-tag="registry.idregistryclass"  
            data-source-name="registryclass" 
            data-value-member="idregistryclass"  
            data-display-member="description" 
            data-custom-control="combo">
        </select>

```



#### Meccanismo master detail grid/combo:

La griglia (grid o gridx) e il combo supportano il meccanismo automatico del master detail.

Potremmo avere una combo o una griglia master ed una combo oppure una griglia detail.

Per realizzare questo comportamento bisogna configurare il data-attribute data-master="<nome tabella>". Tale attributo ha il valore di un nome di un DataTable presente sul dataset. Rappresenta la tabella master appunto. 

Dovremmo avere nella form quindi una combo oppure una griglia che abbia come tabella principale impostata proprio quella indicata sul data-master. Quando si seleziona una riga nella griglia o un valore  nella combo o nel grid "master", automaticamente nel controllo figlio saranno filtrate le righe in base alla relazione che intercorre tra la tabella master e la tabella child.



### gridx - GridControlX

E' una griglia con dei piccoli bottoncini a lato, che visualizza una tabella

In questo caso data-custom-control="gridx"

Il data-tag ha il seguente formato: 
	
    tableName.listType.editType

Ove

- tableName: Tabella da cui deve essere preso il dato da visualizzare
- listType: il codice dell’elenco desiderato.
- editType:  Edit-Type da utilizzare per la modifica della riga, quando si fa “doppio click” sul grid o si preme il tasto aggiungi/correggi associato alla griglia. 





Sulla DescribeColumns() possiamo inserire a seconda del listtype differenti configurazioni per quanto riguarda visibilità , posizione e caption da mostrare sull’header.

L’ordinamento invece viene configurato sulla funzione GetSorting().

Esempio:

```html

        <div data-tag="registrypaymethod.default.lista" 
             data-custom-control="gridx">
        </div>

```






#### Button per grid

Se vogliamo che siano mostrati i bottoni per l’edit add o delete sulle righe della griglia dobbiamo aggiungere i seguenti data-attributes:

- data-mdlbuttonedit: Premendo il tasto edit sulla riga della griglia si apre il dettaglio per la modifica della riga. Il form dettaglio sarà una classe derivata da MetaPage. Tale MetaPage sarà identificata da tableName il nome della tabella a cui afferisce la riga della griglia selezionata, mentre l’editType sarà quello del tag della griglia. Attenzione, essendo la MetaPage di "dettaglio", il terzo pareametro nel costruttore dovrà essere passato “true” : MetaPage.apply(this, [<TableName>, <EditType>, true]);  

- data-mdlbuttoninsert: Premendo il tasto insert posizionato a destra sull’header della griglia si apre il dettaglio per l’inserimento della riga. Come per il caso del tasto edit, descritto precedentemente, si apre una nuova MetaPage, identificata da tableName ed editType. La pagina sarà di solito la stessa implementata per il bottone edit. In questo caso il framework, popolerà i controlli presenti con i valori di default letti dal server, anche eventuali id con autoincremento saranno popolati dal server. A video non si ha la necessità di mostrare gli id con autoincremento, ma bisogna sottolineare che il DataSet sottostante avrà tali campi già valorizzati, se pure con valori temporanei.
 
Sia nel caso edit, che nel caso insert, l’utente può premere sulla toolbar il tasto annulla e tornare alla pagina master, oppure premere salva. Il framework si occupa di chiudere la pagina dettaglio e rimpiazzare i controlli della pagina master. Quando si preme salva da un dettaglio inoltre le modifiche non vengono salvate effettitvamente sul database, ma tali informazioni sulle righe modificate saranno salvate sul dataset associato alla metaPage principale. Solo quando si preme il tasto salva dalla pagina master , verrà invocato il servizio lato server che effettua il posting dei dati sul database. 

- data-mdlbuttondelete: Appare il tasto delete in fondo alla riga. Se si preme il tasto delete, tale riga verrà cancellata dal dataset sottostante. A video verrà rinfrescata la griglia, e la riga non apparirà più. Come detto in precedenza, in questa operazione non avviene nessuna modifica del database. Solamente quando verrà premuto il tasto salva dalla pagina principale sulla toolbar, verrà elminata la riga dal Database.

- data-mdlbuttonunlink: Serve a scollegare dalla tabella principale la riga corrente di una griglia. Condizione necessaria perché ciò avvenga è che il DataGrid sia associato ad una tabella FIGLIA della tabella principale, che non sia però subentità. In questo tipo di situazione, la riga non è cancellata dal database, bensì i campi che la rendono “figlia” della tabella principale sono posti a null. L’operazione è l’inversa di quella che accade effettuando un choose dalla tabella stessa, nel qual caso i campi vengono impostati per far si che la riga  (ri)diventi figlia della riga della tabella principale.


Esempio:

```html

       <div id="grid1" 
        data-tag="registrypaymethod.anagrafica.anagrafica" 
        data-custom-control="grid" 
        data-mdlbuttoninsert data-mdlbuttonedit data-mdlbuttondelete>
       </div>

```


Ogni volta che c’è un combo o un gridx o grid che visualizza una tabella T, myKode richiama il metodo client DescribeColumns() che a sua volta chiama il rispettivo metodo DescribeColumns() del MetaDato nel backend di nome T per fargli impostare la tabella in modo appropriato a seconda del ListType specificato. Tale operazione viene fatta una volta per sessione. Le info sulle colonne descritte per una particolare griglia vengono infatti salvate in una “cache” sul  browser.



### Maschere di dettaglio

Le griglie in pagine principali, di solito rappresentano liste di entità associate all’entità principale. Tali griglie possono, come abbiamo visto possedere dei bottoni per l’editing e l’add di nuove righe. Per far questo si deve progettare una nuova metaPage che a seconda del tableName ed editType sarà associato ad un nuovo dataset. La pagina che si apre sarà quindi un dettaglio per la pagina principale. 

Tutte le modifiche fatte sul dettaglio saranno riversate sulle entità figlie dell’entità principale nel dataset.

In particolare tali entità sono dette subentità ed hanno la particolarità che tutta la chiave della tab principale è presente nella chiave di tale tabella subentità. 


Dall’interfaccia grafica quando apriamo un dettaglio da una griglia, saranno mostrati solamente i bottoni ok e annulla. Entrambi riportano sulla maschera principale: se premo ok, le modifiche fatte sul dettaglio verranno riversate sul dataset principale. Solamente nel momento in cui premo salva dalla toolbar però tali modifiche verranno effettivamente salvate sul database. I 2 dataset che entrano in gioco, cioè quello della pagina principale e quello della MetaPage per l’editing della subentità devono avere lo stesso sottoinsieme di tabelle oggetto della modifica, con le stesse chiavi, stesse relazioni. Se così non fosse la propagazione dei dati dal ds “figlio” a quello “padre” non funzionerebbe. In particolare, il DataSet della maschera "padre" è necessario che contenga tutte le tabelle che possono essere modificate nella maschera "figlia", con le stesse relazioni.

Per effettuare un debug veloce e vedere se il ds della pagina principale abbia le righe della subentità che ci aspettiamo dopo un inserimento o un editing, possiamo premere “click + ctrl + shift” su un punto vuoto della pagina web, così da aprire una dialog di debug in cui è possibile visualizzare le tabelle con le righe e le varie proprietà.


### Passaggio di parametri a MetaPage:

Quando si passa da una MetaPage principale ad una meta-page child tramite i tasti di editing del grid, oppure tramite il tasto Manage quando si apre una nuova MetaPage principale è possibile passare dei parametri da una MetaPage all’altra, con due principali metodi:

#### 1 state.setCallingParameter()

E' possibile invocare, nella MetaPage del form chiamante, prima di aprire la maschera di dettaglio, il metodo setCallingParameter della proprietà state (che è una istanza di MetaPageState).

Esempio:

Nella maschera chiamante, ad esempio  in un evento rowSelect():

```js
        this.state.setCallingParameter("parametro", "valore")
```

Sulla MetaPage chiamata sarà possibile accedere a tale parametro usando il metodo getCallingParameter dello state:


In un qualsiasi metodo della maschera chiamata:

```js
        let val = this.state.getCallingParameter("parametro")
```

#### 2 DataTable.extraParameters 

Utilizzare sul DataTable della tabella principale del chiamato, presente su DataSet della pagina chiamante la proprietà extraParameters. 

Quindi sulla MetaPage chiamante avremo un assegnazione del genere:  

```js

    this.state.DS.tables["childTable"].extraParameters.myCustomProperty = "Value". 

```

Sulla MetaPage chiamata avremo disponibile il parametro myCustomProperty sulla proprietà 

```js

      let val = this.state.extraParameters.myCustomProperty 

```


Ad esempio se vogliamo passare il valore di una determinata colonna della riga principale inseriamo sul codice della MetaPage chiamante:

Sul costruttore ci registriam all'evento stopMainRowSelection:

```js
        this.eventManager.subscribe(appMeta.EventEnum.stopMainRowSelectionEvent, this.rowSelected, this);
```


Metodo handler:

```js
rowSelected:function (dataRow) {
    this.state.setCallingParameter("myId",dataRow.current.id);  
    
    // oppure
    
    this.state.DS.tables[<TableNameChild>].extraParameters = {myId:dataRow.current.id}
}
          

```




#### Filtro personalizzato tramite customParentRelation (per grid e gridx)

Le griglie solitamente rappresentano una lista di elementi che sono dettaglio di un’entità principale. Il framework, in maniera automatica a seconda della riga principale del form filtra gli elementi della griglia in base alla relazione che lega la tabella associata al grid, alla tabella principale. Quindi nel dataset dovrà essere presente la relazione parent-child opportunamente configurata.

Possiamo inoltre filtrare le righe della griglia rispetto ad un filtro che decidiamo noi, in maniera automatica.

Nel metodo beforeFill() della metapage potremmo infatti inserire tale filtro. Dobbiamo impostare il seguente data-attribute tramite jQuery:

```js

        $("#ID_ELEMENTO_GRIGLIA").data("customParentRelation", filter);

```

In cui il parametro filter sarà un’espressione jsDataQuery qualsiasi che avremo calcolato in quel momento. Poniamo l’esempio che il grid debba filtrare in base alla riga principale e in più anche mettere in AND con un valore che conosciamo:

```js


        let parentRow = this.state.currentRow;
        let gridParentRels = this.state.DS.getParentChildRelation(‘<nome_tab_principale>’,’<nome_tab_grid>’);
        let parentfilter = gridParentRel.getChildsFilter(parentRow);
        let q = window.jsDataQuery;
        let customFilter = q.eq(“<mia_colonna>”, “valore personalizzato”)
        let filter = q.and(parentfilter, customFilter); 
        $("#ID_ELEMENTO_GRIGLIA").data("customParentRelation", filter);

```

##### Campi calcolati
Su ogni griglia (grid o gridx), è possibile avere colonne in cui i valori sono dei campi calcolati. A tal fine è possibile associare delle formule alle colonne oppure usare il metodo computeRowsAs di MetaModel.
Tale funzione sarà invocata all’interno del framework nei punti necessari per ogni riga della tabella originale.

Nel metadato:

```js

        describeColumns: function (table, listType) {
          appMeta.metaModel.computeRowsAs(table,listType,this.calculateFields);
          return this.superClass.describeColumns(table, listType);
        }

        calculateFields :function (r, listtype) {
          var tableToFill = r.getRow().table;
          var ds = tableToFill.dataset;
          ...
          <codice custom>
          ... 
          r[<Nome colonna da riempire>] = “Valore calcolato”;
        }

```

In alternativa è possibile impostare la proprietà expression di un DataColumn del DataTable, mediante il metodo columnExpression di columnExpression (o assegnando direttamente il campo expression del DataColumn), ed in questo caso:

- se l'espressione che si assegna è di tipo jsDataQuery, questa sarà valutata al momento della lettura o della scrittura della riga
- se l'espressione è una stringa nel formato tabella.campo, tabella sarà una tabella parent, relazionata con la tabella principale, e della riga relazionata sarà preso il campo specificato



### Formattazione valori numerici o date

Se in una griglia se vogliamo che i valori numerici e le date appaiono in un certo modo dobbiamo eseguire una configurazione sulle proprietà delle DataColumn della tabella in questione. Si può effettuare questa configurazione sul metadato sulla funzione DescribeColumns(table, listType).

Quindi ad esempio potremmo scrivere, nel metadato:

```js

    describeColumns: function (table, listType) {
        ...
        table.columns.start.format = “g”
        table.columns.latitude.format = “fixed.7”
    }

```



Il fixed.7 indica un numero con 7 cifre decimali, ad esempio se vogliamo mostrare una latitudine o longitudine.

Come per le formattazioni dei textbox il valore di defualt per le date è “d” e quindi verrà mostrato il valore nella forma dd/MM/yyyy.


### lookup (grid, gridx, checklist)
Sulle griglie e sulle checklist è possibile configurare un ulteriore parametro nel caso si voglia realizzare una visualizzazione codificata su alcune colonne. 

Basta valorizzare l'attributo data-mdlconditionallookup con una stringa avente il seguente formato: “col1,v1,d2;col1,v2,d2;col2,v3,d3;...”. 

Ossia ogni colonna è separata dal punto e virgola, mentre la tripletta di valori separati da virgola indica:
     il nome della colonna col(i), “v(i)” è il valore da rimpiazzare con “d(i)”.



### grouping e funzioni di aggregazione (solo gridx):
Le griglie gridx di default hanno abilitato la possibilità di raggruppare le colonne e configurare tramite il tastino di opzioni che compare in alto a sinistra le funzioni di aggregazioni da calcolare sulle colonne numeriche.
Per inserire la colonna nel gruppo, basta fare un drag and drop dell’header della colonna sull’area apposita, se si vuole togliere, si può premere il tastino di fianco il box della colonna raggruppata oppure fare un drag and drop al contrario, prendendo il box della colonna a trascinandolo in qualsiasi parte della griglia.

Per disabilitare questo comportamento e togliere quindi la possibilità di fare drag and drop sull’area di grouping bisogna aggiungere nel controllo il data-attribute: data-mdlexcludegroup.




### tree - TreeViewManager

Per gestire un treeview è necessario impostare l'attributo data-custom-control a "tree"

Il data-tag avrà il formato tableName.tree

Il caso semplice è quello in cui si voglia mostrare il tree di una tabella dove è presente un autorelazione, ossia una relazione che ha come parentTable e childTable la tabella stessa.

Bisogna quindi indicare sul data-tag il nome della tabella in cui è presente l’autorelazione, senza specificare i campi dell’autorelazione, sarà il framework automaticamente a ricavare la relazione dal dataset, seguito dalla parola chiave “tree”.

Inoltre bisogna indicare sull’attributo  data-custom-control il nome della classe che gestisce il tree (che potrebbe essere "tree" o il codice di un manager custom). 

Nel caso non sia necessario inserire comportamenti particolari basterà inserire la stringa tree e la logica del controllo sarà gestita dalla classe del framework TreeViewManager.

Se invece necessitiamo di comportamenti particolari bisognerà estendere tale classe ed utilizzare una nuova chiave per il nuovo CustomControl.

Ad esempio:

```js

    (function() {
        var TreeViewManager = window.appMeta.TreeViewManager;

        function table1_TreeViewManager() {
            TreeViewManager.apply(this, arguments);
            this.doubleClickForSelect = false;
        }

       table1_TreeViewManager.prototype = _.extend(
           new TreeViewManager(),
           {
               constructor: table1_TreeViewManager,

               superClass: TreeViewManager.prototype

           });

   appMeta.CustomControl("table1", table1_TreeViewManager);
   appMeta.table1_TreeViewManager = table1_TreeViewManager;
}());


```

La logica dei campi da visualizzare e quale nodo e il root da cui partire per la generazione dell’albero, viene effettuata sul metodo DescribeTree() del metadato.

Tale metodo viene invocato all’inizio , quando viene letta la pagina html  e vengono quindi instanziati i vari CustomControl per gestire i controlli griglia, combo e tree.

In questa funzione verrà istanziata la classe che gestisce la creazione dei nodi, il cosidetto TreeNode_Dispatcher, il quale ha il metodo getNode(parentRow, childRow) e il filtro che rappresenta la condizione per la radice dell’albero, che sarà un espressione jsDataQuery.

Il framework mette a disposizione 2 differenti gestioni per i nodi dell’albero:
1.	UnLeveled
2.	Leveled

1.	Nel caso UnLeveled la classe TreeNode_Dispatcher avrà bisogno di 2 informazioni, il campo <campo_label> della tabella <tabella_tree> utilizzato per la visualizzazione, e il campo <campo_chiave_child_autorelazione> che rappresenta la colonna child della autorelazione. La funzione che costruisce e che può essere sovrascritta dalla classe che estende il TreeNodeUnLeveled è nodeText().

Il nodo di tipo UnLeveled di default mostrerà 
“<campo_chiave_child_autorelazione> <campo_label>”


#### Controllo tree-navigator:
Trattasi di una particolare composizione di controlli gridx o grid e tree, in cui uno comanda l’altro, e solitamente è utilizzato in maschere di tipo “manage”, dove si vuole navigare l’albero per una scelta di item:
La configurazione sul html è la seguente (Esempio di tree su accmotive):

La metapage dovrà aver configurato i seguenti booleani:

```js
        this.isList = true;
        this.isTree = true;
        this.mainSelectionEnabled = true; (se si vuole che appaia il bottone selziona, tipico dei controlli con tag “manage”)

```

Il gridx dovrà avere il tag: data-treenavigator. Il quale permetterà una gestione particolare. 

```html
    <div class="row">
      <div class="col-md-8">
         <div id="tree_accmotive" data-tag="accmotive.tree" data-custom-control="tree_accmotive" ></div>
      </div>
      <div class="col-md-4">
         <div id="grid_accmotive" data-tag="applied.tree" 
            data-treenavigator data-custom-control="gridx"></div>
      </div>
    </div>

```

Sulla MetaPage chiamante (della tabella registry, avente una vista di nome registrymainview) avremo invece:


```html

    <div class="row" data-tag="AutoManage.txtCodiceCausaleCredit.tree">
       <div class="col-md-6">
           <button type="button" data-tag="manage.accmotive_credit.tree" >Causale credito</button>
           <br/>
           <label class="col-form-label" for="txt_causalecred_id">Causale credito</label>
           <input type="text" class="form-control" name="txtCodiceCausaleCredit" id="txt_causalecred_id" data-tag="accmotive_credit.codemotive?registrymainview.codemotivecredit" />
       </div>
       <div class="col-md-6">
           <textarea  class="form-control" id="txta_causalecred_id" data-tag="accmotive_credit.motive" />
       </div>
    </div>
```



### grid - GridControl

In questo caso data-custom-control="grid"

Il controllo è molto simile a gridx ma non consente il raggruppamento delle colonne e non prevede l'inglobamento dei bottoni di editing/modifica/cancellazione.


### upload - UploadControl

Data-custom-control = "upload"

UploadControl è un custom control dedicato all’upload dei file attachment sul server. Consiste in un bottone “scegli file” per selezionare il file sul proprio pc locale, una label dove è presente il nome del file, e un bottone che serve per invocare il metodo del modulo Attachment.js per effettuare le chiamate server. Una volta che il file sarà inviato al server, apparirà un etichetta per permettere di rimuovere l’attachment, ed eventualmente quindi caricare un altro file. 

Tutte queste dinamiche avvengono in maniera trasparente per il programmatore di interfaccia e backend, il quale  deve preoccuparsi solo di eseguire la seguente configurazione:

Lato html sarà necessario inserire il seguente tag:

```html
        <div id="custom_id" data-tag=”nomeTabella.nomeColonna” data-custom-control="upload"></div>
```

Affinchè il controllo abbia un corretto funzionamento si devono fare le seguenti assunzioni:

- Il dataset deve avere una tabella “attach” in cui sono presenti tutte le informazioni di ogni allegato, tra le quali l’id ovviamente, il nome file come salvato sul file system del server, la size, il contatore per l’algoritmo di pulizia degli allegati che vedremo in seguito. 

- Inoltre deve essere presente la specifica tabella, quella indicata nel tag html “nomeTabella”, dove sarà presente la colonna del tag “nomeColonna”, in cui andremo ad inserire il riferimento dell’ attachment che il server ci torna dopo la chiamata al server. La cosa fondamentale che tale colonna deve avere come prefisso nel nome “idattach”. Deve esistere quindi una relazione parent-child tra “attach” e “nomeTabella” sui campi “idattach” della tabella padre (“attach”) e “nomeColonna” della tabella figlia (“nomeTabella”).

Fatta tale configurazione il controllo sarà in grado di:
 
1. Caricare il file, di qualsiasi dimensione, poichè il modulo attachment.js effettua un caricamento pacchettizzato (1Mb la packet-size inviata).
2. Associare alla riga principale del form, che deve corrispondere alla “nomeTabella” l’id dell’attachment che viene tornato dal server, che corrisponde nella nostra implementazione esattamente all’id della nuova riga sulla tabella attach.
3. Mostrare link per rimuovere il file caricato.

Quando poi l’utente preme il mainsave sulla toolbar, il metodo del backend avrà la logica, a seconda dello stato della riga di aggiornare il valore della colonna counter su attach. In particolare verrà eseguito il seguente algoritmo:

1.	La riga quando viene creata in upload ha counter = null, cioè attachment inviato ma non ancora referenziato da una riga persistente del db
2.	Quando premo mainsave metto su counter = 1 , cioè quell’allegato diventa associato ad una riga persistente nel db
3.	Se cancello la riga, il contatore dell’attachment collegato sarà esso a zero, che indica quindi che il file potrà essere rimosso
4.	Se modifico una riga, quindi passo da null ad un idattach, o viceversa, oppure scelgo un attachment e ne collego un altro, la vecchia riga avrà counter = 0, mentre la nuova counter = 1.

E’ importante far notare che il salvataggio del DataSet dove è contenuta la tabella attach con le informazioni dei contatori viene fatto nella medesima transazione del dataset di pagina dove è contenuta la riga con il riferimento. Quindi saremo sicuri della sincronizzazione del db con il file system dove sono contenuti gli allegati.

A questo punto una procedura del db, schedulata ad esempio di notte o in momenti prefissati di down del sistema, si preoccuperà di eliminare file zombie, cioè attachment che non hanno nessun riferimento. Tale logica cancellerà quindi tutti i file il cui contatore è zero oppure nullo, e la cui data di inserimento è maggiore di 24 ore. In questo modo siamo certi che non si tratta di un allegato appena inviato e quindi al quale l’utente ancora non ha collegato nessuna riga, ma che supponiamo verrà fatta a breve.

Lato server i file saranno salvati in una cartella locale, configurata sulla variabile privata UploadPath del controllore FileController. Questo potrebbe essere anche cambiata, se ad esempio si deciderà di caricare i file su un filesystem remoto o su altro tipo di memoria.


### bootstrapTab - BootstrapContainerTab

Non è un custom-control ma un custom-container. E' usato per aggiungere ai tag "container" di bootstrap il metodo focusContainer, che serve a selezionare il tab corretto quando si desidera porre il focus su un controllo in esso contenuto.

Per usare controlli inseriti in tabpages di bootstrap è bene usare questo il tag data-custom-container ponendolo uguale al valore "bootstrapTab".

Es.

```html

    <div id="externalTab" class="container" data-custom-container="bootstrapTab">

```






### dropdowngrid - DropDownGridControl

In questo caso il data-custom-control è dropdowngrid

Il data-tag avrà il formato tableName.listtype

Il data-custom-control è da applicare a controlli di tipo input - TEXT. Quando applicato, causa l'apparizione di un grid quando si digita del testo nel TEXT, filtrato in base al testo digitato.

Sebbene il TEXT si riferisca alla tabella parent a cui appartengono i valori mostrati, in fase di lettura e di impostazione del filtro dei dati, sarà utilizzato, come per l'autochoose, il campo della tabella principale legato alla tabella parent, come logicamente ci si aspetta, e questo per mezzo dell'aggiunta, automatica di un textbox invisibile su tale campo.

Attributi per la personalizzazione del controllo:

- data-listtype: listType dell'elenco da visualizzare per la tabella parent
- data-minchar: n. di caratteri per i quali si attiva l'apparizione dell'elenco (default in appMeta.config.dropDownMinCharTyped)
- data-delay: millisecondi di attesa prima dell'apparizione dell'elenco (default  appMeta.config.dropDownDelayKeyUp)





### graph - GraphControl

In questo caso il data-custom-control è graph

Il data-tag non è presente in questo controllo

Attributi per la personalizzazione del controllo:

- data-tname: nome della tabella che contiene i dati per il grafico
- data-ycol: nome del campo che contiene le ordinate 
- data-xcol: nome del campo che contiene le ascisse
- data-type: può essere bar o line
- data-title: colonna da usare per i titoli delle colonne




### gridxmultiselect - GridControlXMultiSelect

E' simile a gridx, ma consente la selezione di una più righe dal grid. Tuttavia la selezione è solo grafica e non ha alcun effetto sui dati - DA CANCELLARE??
