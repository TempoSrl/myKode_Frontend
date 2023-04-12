/**
 * @module LocalResourceEn
 * @description
 * Collection of the localized strings ENGLISH
 */
(function () {

    /**
     * @constructor LocalResourceEn
     * @description
     */
    const LocalResourceEn = {
        yes : "Yes",
        no : "No",
        error : "Error",
        and : "and",
        alert : "Alert",
        ok : "Ok",
        of : "of",
        cancel : "Cancel",
        eliminate : "Delete",
        confirm: "Confirm",
        close : "Close",
        changesUnsaved : "There are changes on data not saved. Discard the changes?",
        emptyKeyMsg : "Key field cannot be empty or duplicated",
        emptyFieldMsg : "A field could be empty",
        stringTooLong : "Value field value too long",
        noDataSelected : "No data selected" ,
        saveLayout: "Save layout",
        visible: 'visible',
        column : 'column',
        from: "from",
        to : "to",
        start: 'Start',
        end: 'End',
        infoevent: 'Event info',
        loading: 'Loading...',
        eq: '=',
        like : 'like',
        cambioRuolo : 'Role choice',
        
        logoutMsg : "Do you confirm the app logout?",
        logoutSSOMsg : "Do you confirm logout of \"Single Sign On\" system?",
        
        noNetwork : "Your device is not connected to any network! Try to connect and try again",
        networkConnectionError : "Network error. Please check the connection and retry",
        itemChooseNotSelectable : "Item not selectable",

        toast_login_success : "Login succeeded",
        toast_reg_success : "Registration succeeded",
        info_not_avalilable : "row info not available for this object",

        rowSelectedNoMoreInDb : "Selected row has been deleted from the database",
        noElementFound:"No item found",

        sameValuesForTheKey: "A row with the same primary key has been already added." +
        " Need changes to save it!",

        noPrimaryDataSelected: "No main row selected",
        selectRowInAGrid: "Select a row to modify",

        requiredRow_not_found: "Row not found on the teee",
        selectedRowIsNotOperative: "Selected row it is not operative",
        gridEmpty : "No data",

        // label bottoni standard
        editButton : "Update",
        deleteButton : "Delete",
        insertButton : "Add",
        unlinkButton : "Unlink",

        // form title suffux
        searchTitle : "Search",
        changeTitle : "Update",
        insertTitle : "Insert",

        insertFilterSearch : "Insert search filter",

        // Main Command button label, la chiave è il tag
        mainsetsearch : "Go to search",
        maindosearch : "Do search",
        maininsert : "New",
        maininsertcopy : "Create copy",
        mainsave : "Save",
        mainselect : "Select",
        maindelete : "Delete",
        editnotes : "Edit note",
        mainclose : "Close",
        showlast: "Row info",
        mainexportpdf: "Print",

        emptyField: "Empty fields",

        isValidFieldMandatory: "Attention! The field S%field%S is mandatory",
        isValidMaxLength: "Attention! The field S%field%S can be almost of S%maxlenght%S characters",

        multiSelect_addRows: "Add",
        multiSelect_removeRows : "Remove",
        multiSelect_addRowsTitle: "To add",
        multiSelect_toolbarButtonsTitle:  "It is possible to select",
        multiSelect_lbl_toAdd: "To add",
        multiSelect_lbl_added: "Added",
        multiSelect_lbl_descrtiption: "With Ctrl/Shift + Click it is possible to select or deselect one or more row on a list. \<BR\> Con il tasto destro &egrave; possibile selezionare o deselezionare tutte le righe di un elenco",
        multiSelect_lbl_wait: "Wait table loading",

        procedureMessage_btn_nosave : "No save",
        procedureMessage_btn_ignoreandsave : "Ignore the messages and save it",
        procedureMessage_modal_title: "Errors and advertisements list",

        // header columns
        prodMess_id: "Id",
        prodMess_lonMsg: "Message",
        prodMess_type: "Type",

        // messaggi su indicatori di attesa
        loader_waitListLoading:"Result Loading",

        modalLoader_wait_search: "Searching..",
        modalLoader_wait_save: "Saving...",
        modalLoader_wait_insertcopy: "Coping, wait to modify and save",
        modalLoader_wait_metapage_loading: "Page loading",
        modalLoader_wait_metapageDetail_loading: "Detail page loading",
        modalLoader_wait_insert: "Creating new row, waiting for changes",
        modalLoader_wait_delete: "Deleting row ... please wait!",
        modalLoader_wait_page_update:"Wait for page updating",
        modalLoader_wait_tree_updating: "Tree updating",
        modalLoader_wait_tree_node_search : "Searching tree node",
        modalLoader_wait_unlink_row : "Unlink of the selected row",
        modalLoader_wait_valuesSearching : "Searching values ... please wait!",
        modalLoader_wait_for_registration: "Waiting for the user registration",
        modalLoader_wait_for_save_layout:  "Waiting for save layout",
        modalLoader_wait_page_init : "Page initialization",
        modalLoader_wait_tree_navigation : "Tree navigation running",
        modalLoader_wait_waiting: "Waiting...",
        
        // server error
        serverUnracheable: "Server unreachable or network not available ",
        serverErrorInternal : "Internal server error, method: ",

        saveSuccesfully: "Data saved succesfully",

        adding_row: "Adding new row...",
        newEvent: "New event for",

        calendarWrongConfig: "Calendar table doesn't contain the configured columns. Please contatc the web admin!",
        calendarNotRowCorrect : "In the calendar control the events aren't table object. Please contact the web admin!",
        agenda : "Agenda",
        details: "Details",

        dragHereColumns: "Drag here grouping columns",
        configAggrTitle: "Select the options on the columns. Press confirm to apply changes",

        // Attachment
        download_attach: "Download attachment",
        upload_attach : "Load",
        noAttachmentToUpload: "You have to specify an attachment",
        attachment : "attachment",
        tableAttachNotAvailable: "S%cname%S column it is not on the main table of the page",
        waitAttachLoading: "Wait for the attachment loading",
        attachSent : "Attachment was sent succesfully, do the changes and press save to confirm",
        downloadAttachWaiting: "Downloading ...",
        removeAttachWaiting : "Removing attachment... please wait",
        removeAttach : "Remove attachment",
        tableNotMatch: "The main table name does not match with the table configured on control tag",
        //attachRemoved : "L'allegato è stato rimosso."

        // BEGIN STRING with the replacement
        calendarEventResizeEnd:  "Do you want really modify the end date of the event S%eventTitle%S, end-date: S%endDate%S",
        calendarEventMoveEventQuestion : "You are modifing the start date of the event S%eventTitle%S. new start date: S%startDate%S, end-date: S%endDate%S",

        errorListingTypeNull : "ListingType is null on table S%searchTableName%S with filter S%filter%S in MetaPage S%title%S",
        errorLoadingMetaData: "Error loading metadata S%searchTableName%S you need to restart the application",
        commandExecutionError: "Error on the execution of the S%command%S command",
        entityNotfound: "Entity S%unaliased%S not found on the page S%formTitle%S",
        gridControlTagWrong : "DataGrid with tag S%gridTag%S in the form  S%formTitle%S is wrong!",
        deleteRowConfirm : "Do you confirm the deleting of the row on the table?",
        cantUnlinkDataTable: "Impossible unlink. DataTable S%sourceTableName%S  not " + decodeURI('%C3%A8') + " child of  S%primaryTableName%S",
        missingTableDataSet: "S%tableName%S  table isn't on the DataSet",
        moreThenRow: "Error: there is more than one row in table S%tableName%S",
        gridDataNoValid : "Table S%tableName%S contains invalid data. Contact the after-sales service",
        cancelObjInsert: "Cancel the adding of S%formTitle%S object",
        deleteObjInsert : "Do you confirm the deleting of the S%formTitle%S object from the database?",
        formNoMainTreeView : "The form S%formTitle%S has not a main tree",
        invalidData : "Table S%tableName%S contains unvalid data. Contact the support",
        noRowSelected : "No selected row on the S%tableName%S table",
        minNumrowRequired : "At least S%numrows%S S%msg%S must be entered",
        unvalidEMail: "Email S%email%S is incorrect, please enter a valid email",
        unvalidIp : "The entered ip address S%ip%S is incorrect",

        filterDateString: "Date between S%date1%S and S%date2%S",

        rowCouldBeDetached: "Selected row should be in detached status",
        rowCouldBeDetachedOrDeleted: "Selected row should be in detached or deleted status",
        copyPressedMsg : "Copy insert has been pressed. Do you want create a copy of the data?",
        noRowOnTable: "In the S%searchTableName%S table there is no row.\r\n",
        filterWas: "the search condition was S%mergedFilter%S \r\n",
        listName: "List name",
        onDate: "on",
        createdByStr:  "Create by S%user%S",
        createdOnStr:  "Create on S%time%S",
        modifiedByStr:  "Modified by S%user%S",
        modifiedOnStr: "Modified on S%time%S",
        result: "Results: S%count%S",

        noNumericColumnForAggregation: "There aren't numeric column to calc aggregation functions",
        sum:"sum",
        avg: "average",
        max: "max",
        min : "min",

        passwordMismatched: "Password mismatched",

        // errori server
        serverErrorDataNotPermitted  : "Access denied, based on date manage by security",
        serverErrorNoCredential  : "Insert the credential!",
        serverErrorExpiredCredential  : "Credential expired, please retry to login!",
        serverErrorExpiredSession  : "Session expired, please retry to login!",
        serverErrorBadCredential  : "Username or password not correct, please retry!",
        serverErrorTokenEmpty : "Logout should be done in another window, or token should be removed from browser cache",
        serverErrorUserNotSecurity: "User out of security management." +
            "1. Contact the administrators for inserting the user, and inserting it in the organization chart (Organigramma ->  profilo -> tab utenti). " +
            "2. You may need to close the previous year and generate the new org chart for the new year.",
        serverErrorAnonymous : "Anonymous operation not allowed, try to login again",
        serverErrorSSO: "Failed to authenticate via SSO",
        dataContabileMissing : "Need to specify a fiscal date",
        filterWithUndefined : "The filter condition contains errors:",
 
        gridoption_tab1 : "Column options",
        gridoption_tab2 : "Save layout",
        savingLayoutError : "Saving layout error",
        savingLayoutSucceded : "Layout saved succesfully!",

        pressSaveAfterDelete : "Press ok to delete the object <br><br><strong> S%valuecell%S </strong><br>, then press save on page to confirm the changes!",

        confirmSelection: "Confirm selection",
        selectedRows: "selected rows"
    };
    let resource = LocalResourceEn;


    if (typeof appMeta !== "undefined") {
        appMeta.LocalResource.prototype.registerDictionary("en", resource);
    }
    else {
        module.exports = resource;
    }

}());


