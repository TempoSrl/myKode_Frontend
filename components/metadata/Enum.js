/**
 * @class Config
 * @description
 * Contains global variables for the configuration
 */
(function () {

    /**
     * Type of position of listManager control
     * inpage: such as for the list on search.
     * modal: for example in autochoose
     * relative: for droDowncontrol
     * @type {{inpage: string, modal: string, relative: string}}
     */
    var E_LISTMANAGER_POSITION_TYPE = {
        inpage: "inpage",
        modal: "modal",
        relative: "relative"
    };

    appMeta.E_LISTMANAGER_POSITION_TYPE = E_LISTMANAGER_POSITION_TYPE;
}());
