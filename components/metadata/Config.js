/**
 * @class Config
 * @description
 * Contains global variables for the configuration
 */
(function () {

    /**
     * Indicates the environment. Some feature or debug option are enabled for example only in some cases
     * @type {{DEV: number, QA: number, PROD: number}}
     */
    var envEnum = {
        DEV : 0,
        QA : 1,
        PROD : 2
    };

    // path all'interno dei file del fmw dove sono contenuti i template
    var path_rootTemplate = "components/template/";

    /**
     * Contains the global variables for the configuration
     * @type {{path_maintoolBarTemplate: string, path_multiSelectTemplate: string, path_loaderTemplate: string, path_procedureMessagesTemplate: string, env: number}}
     */
    var config = {

        MDLW_VERSION : "0.0.1",

        // ********** path dei template dei controlli ******
        // template della toobar principale dei bottoni
        path_maintoolBarTemplate: path_rootTemplate + "mainToolBar_Template.html",

        // template del controllo per lo spostamento di righe da una griglia ad un’altra
        path_multiSelectTemplate: path_rootTemplate + "multiSelect_Template.html",

        // template che contiene un indicatore di caricamento
        path_loaderTemplate : path_rootTemplate + "loader_Template.html",

        // template della modale in cui viene ospitata la griglia degli errori che si ottengono quando si effettua un salvataggio dei dati
        path_procedureMessagesTemplate :  path_rootTemplate + "listProcedureMessages_Template.html",

        // template della modale che contiene indicatore di caricamento, 
        //  richiamata all’interno del framewrok quando si vuole attendere il termine di un’operazione
        path_modalLoaderTemplate:  path_rootTemplate + "modalLoader_Template.html",
        path_gridOption_Template:  path_rootTemplate + "gridOption_Template.html",
        env: envEnum.DEV,
        forceShowErrorInfo: false,
        //******************************************************

        //************* url backend ****************************
        webSocketAddress: "ws://localhost:54471/WebSocket/WSServer.ashx",
        //******************************************************
        
        // ********** var globali di classe ******
        // List Manager
        listManager_nRowPerPage : 100, // numero di righe nelle liste paginate.
        listManager_numberOfPagesInFooter : 5, // numero di pulsanti visibili in un form di tipo list per gestire la paginazione
        // Combo manager
        minimumResultsForSearch : 5, // numero di record oltre il quale la combo mostra la riga di filtro.
        // DropDownControl
        dropDownMinCharTyped : 2, // numero di caratteri da quale scatta la ricerca nel drop down
        dropDownDelayKeyUp : 500, // ritardo in ms per cui scatta la query nel dropdown
        // *************************************//

        // timeout delle chiamate ajax.
        ajax_timeout: 60000,

        enableSearchLikeOnTextBox: false, // Abilita/Disabilita la ricerca tramite la like su tutti i text della app
        defaultDecimalFormat: 'c', // Formato di default per colonne di tipo Decimal
        defaultDecimalPrecision : '2', // Numero di cifre decimali di default per colonne di tipo decimal
        selectedRowColor : 'rgb(255, 255, 153)', // colore riga selezionata
        // separatore tra guid e nome file per gli allegati
        separatorFileName: "$__$"

    };

    appMeta.config = config;
    appMeta.config.envEnum = envEnum;
}());


