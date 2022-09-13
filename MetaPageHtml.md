# HTML di una Pagina 

Affinché una web page sia gestita correttamente nel frontend myKode, è necessario che i controlli HTML relativi ai dati da visualizzare o modificare (quest'ultima opzione solo per le tabelle entità o subentità in relazione 1 a 1 con l'entità principale) siano corredate di specifici attributi. 
Vediamoli nel dettaglio


## INPUT 

I tag input, esclusi LABEL e BUTTON, hanno un attributo di nome data-tag con la struttura 
standard tag[?search tag]

Lo standard tag è usato per la lettura e scrittura nel controllo, mentre il search-tag è usato per estrarre la condizione di ricerca. Entrambi hanno la stessa struttura interna. Il search tag è usato solo in particolari casi in cui la ricerca è effettuata su un campo il cui nome differisce da quello presente nello standard tag.

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


Questo tipo di tag è usato per gli input TEXT e TEXTAREA.

