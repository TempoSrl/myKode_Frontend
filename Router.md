[![it](https://img.shields.io/badge/lang-it-green.svg)](https://github.com/TempoSrl/myKode_Frontend/blob/master/Router.it.md)

# Routing

The Routing class manages the access modes for all services, both custom and framework-related. It is responsible for knowing the addresses to access, the service names, URLs, and access methods (POST/GET).



## Methods

### setUrlPrefix(prefixUrl)

Uses prefixUrl as a prefix to access all services. This is the first part of the "endpoint" physical URL.



### getMethod(serviceName)

Given the name of a service, returns the parameters to access it:

- Method:
- Type: HTTP method such as POST, GET, DELETE...
- URL: relative path to access the service
- MultipleResult: if true, it is managed with a protocol using Deferred notifications
- Auth: if true, authentication is required

This method is used by the callWebService method of MetaApp to invoke a web service, along with specific parameters.



### register(service)

The service has a structure similar to what is returned by getMethod.



### init

A method that registers all standard backend web services, used by myKode. It is invoked automatically.



