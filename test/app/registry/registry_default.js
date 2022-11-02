/*jslint browser:true */
/*global $,appState,MetaPage */
/*jslint bitwise: true */
/*jshint -W097 */

(
  function (){
    function metaRegistryPage(){
      var regPage= new MetaPage("registry","default");
      //TODO: extend metaRegistryPage functionalities
      return regPage;
    }

    "use strict";
   appState.addEditType("registry","default",metaRegistryPage);
   console.log("Edit Type added");
  }()
);
