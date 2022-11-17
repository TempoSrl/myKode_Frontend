(function() {
    appMeta.basePath = "../../../";
    appMeta.rootElement = "#metaRoot";
    appMeta.routing.setUrlPrefix("http://localhost:54471");
    appMeta.start();
    appMeta.basePathMetadata = "../../../test/common/metadata/";
    appMeta.callPage("registry", "anagrafica", true)
        .then(function () {
            console.log("DEBUG: Pagina chiusa");
        });
}());
