(function() {
    appMeta.basePath = "../../../";
    appMeta.currApp.rootElement = "#metaRoot";
    appMeta.routing.setUrlPrefix("http://localhost:54471");
    appMeta.start();
    appMeta.basePathMetadata = "../../../test/common/metadata/";
    appMeta.currApp.callPage("registry", "anagrafica", true)
        .then(function () {
            console.log("DEBUG: Pagina chiusa");
        });
}());
