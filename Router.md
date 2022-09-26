
# Routing

La classe Routing conserva le modalità di accesso a tutti i servizi, custom e del framework, ed è lei che conosce l'indirizzo a cui accedere, il nome dei servizi, gli url, le modalità di accesso (POST/GET)





## Metodi

### setUrlPrefix(prefixUrl)

Usa prefixUrl come prefisso per accedere a tutti i servizi. Questa è la prima parte dell'url fisico "finito"


### getMethod(serviceName)

Dato il nome di un servizio, restituisce i parametri per accedervi:

- Method: 
- type:  HTTP method come POST, GET, DELETE..
- url: relative path per accedere al servizio
- multipleResult: se true è gestito con un protocollo con delle notify del Deferred
- auth: se true, è necessario inserire 


Questa metodo è utilizzato dal metodo callWebService di MetaApp per invocare un web service, unitamente ai parametri specifici.


### register(service)

service ha la struttura simile a quella restituita da getMethod


### init

Metodo che registra tutti i web service del backend standard, usato da myKode. E' invocato in automatico.




