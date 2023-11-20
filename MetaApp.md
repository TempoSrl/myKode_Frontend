[![it](https://img.shields.io/badge/lang-it-green.svg)](https://github.com/TempoSrl/myKode_Frontend/blob/master/MetaApp.it.md)

# MetaApp

MetaApp is the class responsible for the high-level management of the application.

It is a singleton and also serves as a mediator between various components. It is the focal point around which the creation, visualization, and closure of pages revolve, along with the associated exchange of information.

myKode contains a series of HTML pages, constituting templates for some basic components used within the framework, such as messageBox, loading indicators, toolbars, etc. Users can redefine their templates and place them in any folder within their project.

It is possible to modify the templates used by the application and their location using the Config.js file, which typically adds the config property with all the settings to the global appMeta instance.

Details on individual customizable properties can be found in the Config.js file.

## Methods

### start()

Starts the application, the method to call after creating and configuring various application properties.

### addMetaPage(tableName, editType, metaPage)

Associates the (tableName, editType) pair with a class (not an instance) derived from metaPage. Typically, there is a call to addMetaPage in every file where the code of a MetaPage is implemented, i.e., the "code-behind" JavaScript of a web page.

### {MetaPage} getMetaPage(tableName, editType)

Returns the MetaPage associated with a pair (tableName, editType).

### getMetaDataPath(tableName)

Returns the path where metadata, metapages, and HTML related to a particular table are located. Typically, it is the "base" address followed by the table name, but it is possible to locate all files in the same folder or in different ways by overriding this method.

### addMeta(tableName, meta)

Associates a class derived from MetaData with its corresponding table. Typically, in the metadata file, you will find something like:

```javascript
(function(_, metaModel, MetaData, Deferred) {
    // ... (boilerplate code)
    
    function meta_tableName() {
        MetaData.apply(this, ["tableName"]);
        this.name = 'meta_tableName';
    }

    meta_tableName.prototype = _.extend(
        new MetaData(),
        {
            constructor: meta_tableName,
            superClass: MetaData.prototype,
            // ... (methods)
        }
    );

    // ... (boilerplate code)
    
})(...);
```

### {MetaData} getMeta(tableName)

Returns an instance of the MetaData for tableName. By default, it is a singleton as normally each module that exposes metadata registers an instance of that metadata, which is then shared by the entire application. To change this behavior, you can act from this method.

### {Deferred<html>} getPage(tableName, editType)

Returns the HTML associated with a pair (tableName, editType). This is usually taken from the folder <base path>/<tableName> if not present in an internal cache. To register pages, it is not necessary to write code; just place them in the appropriate subfolder named "tableName" and name them <tableName>.<editType>.html.

From this interface, it is easy to understand that for each table tableName, one can associate one or more forms, each identified by a code, which is precisely the editType.

### {Deferred<html>} callPage(metaToCall, editType, wantsRow)

Opens a form identified by the pair metaToCall-editType and returns a deferred, which is true if the editing is concluded with an "Ok." wantsRow is a parameter indicating whether the caller requests the return of a row. If wantsRow is true, the opened form appears as a pop-up.

Upon opening and displaying a page, an event of type showPage is also generated, to which you can subscribe to perform specific operations. For example:

```javascript
appMeta.globalEventManager.subscribe(appMeta.EventEnum.showPage, this.showPage, this);

// ...

showPage: function(metaPage) {
    if (metaPage.detailPage) ...
}
```

### Deferred<object> callWebService(method, prms)

Invokes a web service named "method" with the parameters prms. The result is returned as-is to the caller. The "method" must have been previously registered with the method.

### register(prms)

Registers a web service in the system. prms must have the following fields:

- method: the name of the method
- type: can be GET/POST/DELETE
- multipleResult: true if multiple responses are possible
- url: absolute URL, e.g., http://mysite/mypath/method

