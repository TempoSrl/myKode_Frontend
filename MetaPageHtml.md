# HTML di una Pagina 

Affinché una web page sia gestita correttamente nel frontend myKode, è necessario che i controlli HTML relativi ai dati da visualizzare o modificare (quest'ultima opzione solo per le tabelle entità o subentità in relazione 1 a 1 con l'entità principale) siano corredate di specifici attributi. 
Vediamoli nel dettaglio


## INPUT 


Tutti i campi INPUT esclusi LABEL e BUTTON hanno un attributo di nome data-tag con la struttura standard tag[?search tag]

Lo standard tag è usato per la lettura e scrittura nel controllo, mentre il search-tag è usato per estrarre la condizione di ricerca. Entrambi hanno la stessa struttura interna. Il search tag è usato solo in particolari casi in cui la ricerca è effettuata su un campo il cui nome differisce da quello presente nello standard tag.


### type TEXT e TEXT AREA

Entrambi i tag, ove presenti, hanno la forma: tabella.campo[.formato]

- tabella è il nome della tabella a cui si riferisce il campo
- campo è il nome del campo visualizzato nel controllo
- formato è una stringa che modifica il modo in cui vengono mostrati i dati

Se il dato è numerico e formato inizia con fixed allora avrà la struttura:

        fixed.pos_decimali.prefix.suffix.scale

dove

- pos_decimali è il numero di cifre decimali da mostrare
- prefix è una eventuale stringa da preporre al numero in fase di visualizzazione 
- suffix è una eventuale stringa da postporre al numero in fase di visualizzazione (es. un simbolo di percentuale %) 
- scale è un fattore di scala da usare ai fini della visualizzazione. Ad esempio se il numero è una percentuale memorizzata come valore compreso tra 0 e 1, ma la si volesse visualizzare come numero compreso tra 0 e 100, scale dovrebbe essere 100


Questo formato è importante per visualizzare numeri con numeri di cifre prefissati o scalati o seguiti o preceduti da prefissi/suffissi. Tali modifiche sono applicate in modo trasparente quando si legge o scrive il dato nella casella interessata.



### type CHECKBOX

Il data-tag del controllo CHECKBOX può assumere due forme:

- tabella.campo:valoreSI:valoreNO se si vuole che il campo assuma valoreSI o valoreNO a seconda che il checkbox sia settato o meno
- tabella.campo:nBit se nBit è il numero del bit da impostare nel campo indicato ove il checkbox sia selezionato, mentre sarà azzerato nel caso opposto
- tabella.campo:#nBit se nBit è il numero del bit da impostare nel campo indicato ove il checkbox sia deselezionato, mentre sarà azzerato nel caso opposto (funziona in logica negata rispetto al caso precedente)

caso particolare, se il controllo ha l'attribute indeterminate impostato, assume un valore indeterminato che non è né vero né falso e rappresenta il valore null

### type RADIO

Il data-tag del controllo RADIO può assumere tre forme:

- tabella.campo:valoreSI  e il campo sarà impostato a valoreSI ove il RADIO corrispondente sia selezionato
- tabella.campo::nBit se nBit è il numero del bit da impostare nel campo ove il radiobutton sia selezionato
- tabella.campo::#nBit se nBit è il numero del bit da resettare nel campo ove il radiobutton sia selezionato

Nulla accade ove il radio non sia selezionato



## DIV e SPAN con attributo valueSigned

In questo caso la DIV o SPAN deve contenere tre componenti: una input text e due input radio:

- la input TEXT è la prima text che viene trovata nella DIV/SPAN (dovrebbe essercene una sola)
- la input RADIO "segno +"  è il primo radio che viene trovato che non abbia il data-tag impostato a "-"
- la input RADIO "segno -"  è il primo radio che viene trovato che abbia il data-tag impostato a "-"

Una DIV o SPAN siffatta è interpretata in questo modo dal framework: l'input TEXT è usata per contenere un valore numerico, che si intenderà avere segno positivo se il radio di segno positivo è selezionato, altrimenti avrà segno meno.

LA DIV o SPAN di suo dovrà avere un data-tag nella forma tabella.campo (cosi come altri INPUT)
Pertanto in fase di visualizzazione, nella TEXT sarà messo il valore assoluto del numero mentre i radio button saranno selezionati o deselezionati in base al segno del valore rappresentato.


## Button

E' possibile associare ai bottoni dei tag con vari comandi, alcuni dei quali sono spesso presenti sulla toolbar.

Una convenzione generale è che se ad un controllo deve essere applicato un filtro, questo è impostato nell'attributo data-filter, da codice, nella MetaPage, con una istruzione del tipo:

Nell'HTML:

```HTML
        <button type="button" id="btn_tratta_spese" class="btn btn-primary mb-2" data-tag="choose.chargehandling.default">Tratt. Spese</button>

```

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

### AutoChoose

E' un tag che si applica a DIV o SPAN che contengono un controllo TEXT con un data-tag relativo ad una tabella e campo  tableName.fieldName 

Il tag della DIV o SPAN invece sarà del tipo 
        
    AutoChoose.idTEXT.listType

L'effetto sarà che quando si cambierà manualmente il contenuto della TEXT apparirà un elenco della tabella indicata nel data-tag della TEXT relativo al listType indicato, filtrato con il contenuto della TEXT al momento in cui si lascia il fuoco della TEXT.


### AutoManage

E' un tag che si applica a DIV o SPAN che contengono un controllo TEXT con un data-tag relativo ad una tabella e campo  tableName.fieldName 

Il tag della DIV o SPAN invece sarà del tipo 
        
    AutoManage.idTEXT.editType

L'effetto sarà che quando si cambierà manualmente il contenuto della TEXT apparirà la maschera individuata dalla coppia tableName-editType ove tableName è quella indicata nel data-tag della TEXT, che dovrebbe essere di tipo lista, filtrata con il contenuto della TEXT al momento in cui si lascia il fuoco della TEXT. 

Nella maschera che si aprirà sarà possibile selezionare una riga esattamente come accade con il comando manage.

E' analogo all'AutoChoose ma apre una maschera invece di un elenco.





## Custom controller

Tutti i custom controller, nel data-tag, devono avere come primo campo, la tabella a cui si riferiscono.

Il tipo di controller va scritto nell'attributo data-custom-control. Specifici altri attributi sono essere richiesti a seconda del controller applicato.


### choose  - AutoChooseControl

Il valore choose nel data-custom-control è 


### calendar - CalendarControl

### checklist - CheckBoxListControl

### combo - ComboManager

### dropdowngrid - DropDownGridControl

### graph - GraphControl

### grid - GridControl

### gridx - GridControlX

### gridxmultiselect - GridControlXMultiSelect

### bootstrapTab - BootstrapContainerTab


