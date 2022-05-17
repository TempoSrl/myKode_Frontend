'use strict';
/* global beforeEach, afterEach,describe,jasmine,it,expect,inject */

describe('jsCore',
    function() {

        var appMeta = window.appMeta;
        
        beforeEach(function() {
            jasmine.clock().install();
        });

        afterEach(function () {
            jasmine.clock().uninstall();
        });

        describe("MetaApp class",
            function() {

                it('html + js saved and replaced using jquery. children + html save reference but not events',
                    function() {
                       var mainwin = '<div id="rootelement">root</div>';
                        $("html").html(mainwin);
                       
                        // recupero html pag 1
                        var html1 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page1Nav.html");

                        // simulo MetaPage
                        function mp1() {
                            this.pag1_txt_1 = null;
                            this.name = 'metaPage_registry';
                        }
                        mp1.prototype = {
                                constructor: mp1,
                                saveNode: function() {
                                    this.pag1_txt_1 =  $(".pag1_txt_1");
                                }
                         };

                        window.appMeta.addMetaPage('registry', 'anagrafica', mp1);
                        // appendo al rootelement
                        $("#rootelement").html(html1);
                        var mpref1 = new mp1();
                        mpref1.saveNode();

                        // attacho evento su controllo
                        var myf = function () {
                            $(".pag1_p_1").toggle();
                        }
                        $(".pag1_btn_1").on("click", myf);
                        
                        // invoco evento click e vedo se lo esegue
                        $(".pag1_btn_1").click();
                        
                        jasmine.clock().tick(100);
                        expect( $(".pag1_p_1").is(":visible")).toBe(false);

                        $(".pag1_txt_1").val("txt1val");
                        // salvo nodes pag 1
                        var saveNodes =  $("#rootelement").children();
                        // recupero html pag 2
                        var html2 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page2Nav.html");
                        // rimpiazzo con nuovo html
                        $("#rootelement").html(html2);
                        // verifico elementi presenti/non presenti
                        expect($(".pag1_p_1").length).toBe(0);
                        expect($(".pag2_p_1").length).toBe(1);

                        // ripristino pag1 tramite replaceWith()
                         $("#rootelement").html(saveNodes);
                        
                        // verifico elementi presenti/non presenti
                        // osservo se il text della text è ripristinato
                        expect($(".pag1_p_1").length).toBe(1);
                        expect($(".pag2_p_1").length).toBe(0);
                        expect($(".pag1_txt_1").val()).toBe("txt1val");


                        $(mpref1.pag1_txt_1).val("changed text on ref");

                        // mantiene il riferimento
                        expect($(".pag1_txt_1").val()).toBe("changed text on ref");
                        expect($(mpref1.pag1_txt_1).is($(".pag1_txt_1"))).toBe(true);

                        
                        // invoco emtodo ma evento non viene eseguito. ilp dovrebbe essere vosibiledopo il toggle invece è invisibile
                        $(".pag1_btn_1").click();
                        jasmine.clock().tick(100);
                        expect($(".pag1_p_1").is(":visible")).toBe(false);
                       
                    });

                it('html + js saved and replaced using jquery. clone + replaceWith save events but not reference',
                    function() {
                        var mainwin = '<div id="rootelement">root</div>';
                        $("html").html(mainwin);

                        // recupero html pag 1
                        var html1 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page1Nav.html");

                        // simulo MetaPage
                        function mp1() {
                            this.pag1_txt_1 = null;
                            this.name = 'metaPage_registry';
                        }
                        mp1.prototype = {
                            constructor: mp1,
                            saveNode: function() {
                                this.pag1_txt_1 =  $(".pag1_txt_1");
                            }
                        };

                        window.appMeta.addMetaPage('registry', 'anagrafica', mp1);
                        // appendo al rootelement
                        $("#rootelement").html(html1);
                        var mpref1 = new mp1();
                        mpref1.saveNode();

                        // attacho evento su controllo
                        var myf = function () {
                            $(".pag1_p_1").toggle();
                        }
                        $(".pag1_btn_1").on("click", myf);

                        // invoco evento click e vedo se lo esegue
                        $(".pag1_btn_1").click();

                        jasmine.clock().tick(100);
                        expect( $(".pag1_p_1").is(":visible")).toBe(false);

                        $(".pag1_txt_1").val("txt1val");
                        // salvo nodes pag 1 
                        var saveNodes =  $("#rootelement").clone(true);
                      
                        // recupero html pag 2
                        var html2 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page2Nav.html");
                        // rimpiazzo con nuovo html
                        $("#rootelement").html(html2);
                        // verifico elementi presenti/non presenti
                        expect($(".pag1_p_1").length).toBe(0);
                        expect($(".pag2_p_1").length).toBe(1);

                        // ripristino pag1 tramite replaceWith()
                        $("#rootelement").replaceWith(saveNodes.clone(true));
                        // $("#rootelement").html(saveNodes);
                        // verifico elementi presenti/non presenti
                        // osservo se il text della text è ripristinato
                        expect($(".pag1_p_1").length).toBe(1);
                        expect($(".pag2_p_1").length).toBe(0);
                        expect($(".pag1_txt_1").val()).toBe("txt1val");


                        $(mpref1.pag1_txt_1).val("changed text on ref");

                        // il vecchio riferimento non viene mantenuto, il text è quello non cambiato :(
                        expect($(".pag1_txt_1").val()).toBe("txt1val");
                        expect($(mpref1.pag1_txt_1).is($(".pag1_txt_1"))).not.toBe(true);


                        // invoco evento click dopo il replaceWith() e vedo se lo esegue
                        $(".pag1_btn_1").click();
                        jasmine.clock().tick(100);
                        expect($(".pag1_p_1").is(":visible")).toBe(true);

                    });

                it('html + js saved and replaced using a dynamic node creating on the fly. Events and references are preserved',
                    function() {
                        var mainwin = '<div id="rootelement">root</div>';
                        $("html").html(mainwin);

                        // recupero html pag 1
                        var html1 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page1Nav.html");

                        // simulo MetaPage
                        function mp1() {
                            this.pag1_txt_1 = null;
                            this.name = 'metaPage_registry';
                        }
                        mp1.prototype = {
                            constructor: mp1,
                            saveNode: function() {
                                this.pag1_txt_1 =  $(".pag1_txt_1");
                            }
                        };

                        window.appMeta.addMetaPage('registry', 'anagrafica', mp1);
                        // appendo al rootelement
                        $("#rootelement").html(html1);
                        var mpref1 = new mp1();
                        mpref1.saveNode();

                        // attacho evento su controllo
                        var myf = function () {
                            $(".pag1_p_1").toggle();
                        }
                        $(".pag1_btn_1").on("click", myf);

                        // invoco evento click e vedo se lo esegue
                        $(".pag1_btn_1").click();

                        jasmine.clock().tick(100);
                        expect( $(".pag1_p_1").is(":visible")).toBe(false);
                        $(".pag1_txt_1").val("txt1val");

                        // salvo nodes pag 1
                        var newRoot  =$("<div class='newRoot'></div>");
                        $(newRoot).hide();
                        $(document.body).append(newRoot) ;
                        $(newRoot).append($("#rootelement").children()) ;

                        // recupero html pag 2
                        var html2 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page2Nav.html");
                        // rimpiazzo con nuovo html
                        $("#rootelement").html(html2);
                        // verifico elementi. semrpe presenti ma non tutti visibili
                        expect($(".pag1_p_1").length).toBe(1);
                        expect($(".pag2_p_1").length).toBe(1);

                        // ripristino pag1 tramite replaceWith()
                        $("#rootelement").hide();
                        $(newRoot).show();

                        // verifico elementi presenti/non presenti
                        // verifico elementi. semrpe presenti ma non tutti visibili
                        expect($(".pag1_p_1").length).toBe(1);
                        expect($(".pag2_p_1").length).toBe(1);
                        expect($(".pag1_txt_1").val()).toBe("txt1val");


                        $(mpref1.pag1_txt_1).val("changed text on ref");

                        // il vecchio riferimento  viene mantenuto, il text è quello  cambiato :)
                        expect($(".pag1_txt_1").val()).toBe("changed text on ref");
                        expect($(mpref1.pag1_txt_1).is($(".pag1_txt_1"))).toBe(true);


                        // invoco evento click dopo il replaceWith() e vedo se lo esegue
                        $(".pag1_btn_1").click();
                        jasmine.clock().tick(100);
                        expect($(".pag1_p_1").is(":visible")).toBe(true);

                    });

                // DEPRECATO, cambiati gli html, non hanno metaRoot, lo inserisce appMain. 
                xit('html + js saved and replaced using replaceChild(). Events and references are preserved',
                    function() {
                        // istanzio html parent
                        var mainwin = '<div id="appRoot">root</div>';
                        $("html").html(mainwin);

                        // recupero html pag 1
                        var html1 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page1Nav.html");

                        // simulo MetaPage 1
                        function mp1() {
                            this.rootElement = '#metaRoot';
                            this.name = 'metaPage_registry1';
                        }
                        mp1.prototype = {
                            constructor: mp1,
                            setPropertyToTest: function() {
                                this.pag1_txt_1 =  $(".pag1_txt_1");
                            }
                        };

                        // simulo MetaPage 2
                        function mpDetail() {
                            this.name = 'metaPage_registry2';
                            this.rootElement = '#metaRoot';
                        }
                        mpDetail.prototype = {
                            constructor: mpDetail
                        };

                        var metaPage1 = new mp1();
                        var metaPageDetail = new mpDetail();

                        window.appMeta.addMetaPage('registry', 'anagrafica', mp1);
                        window.appMeta.addMetaPage('registry', 'anagrafica', mpDetail);

                        // appendo al rootElement
                        $("#appRoot").html(html1);

                        metaPage1.setPropertyToTest();

                        /***************************** azioni su pag attuale *****************************************/
                        // attacho evento su controllo
                        var my_handler_on_page1 = function () {
                            $(".pag1_p_1").toggle();
                        }
                        $(".pag1_btn_1").on("click", my_handler_on_page1);

                        // invoco evento click e vedo se lo esegue
                        $(".pag1_btn_1").click();

                        jasmine.clock().tick(100);
                        expect( $(".pag1_p_1").is(":visible")).toBe(false);
                        // imposto un valore, simulo interazione utente, che inserisce qualcosa
                        $(".pag1_txt_1").val("txt1val");
                        /**********************************************************************/

                        // salva il vecchio root node in una proprietà savedRoot di currentMetaPage ove esista
                        // se currentMetaPage è null non deve fare nulla e savedRoot rimane null
                        // ottiene il parent del vecchio root, rimuove il vecchio
                        // ottiene un newChild avente pari id dell'old, e stessi attributes dell'old, ma senza contenuto
                        // esegue una parent.replaceChild(newChild, savedRoot)

                        // ****************** metto pag2 e salvo pag1 *******************************
                        // 1. salvo nodes pag 1
                        metaPage1.savedRoot = $(metaPage1.rootElement);

                        var parentNode = metaPage1.savedRoot.parent();

                        // 3. ottiene un newChild avente pari id dell'old, e stessi attributes dell'old, ma senza contenuto
                        // recupero html pag 2 stesso id di page1Nav.html
                        var html2 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page2Nav.html");

                        // 4. esegue replace del contenuto
                        //$(metaPage1.rootElement).replaceWith($(metaPageDetail.rootElement));
                        $(parentNode)[0].replaceChild($(html2)[0], $(metaPage1.rootElement)[0])

                        // verifico elementi pag 2 presenti
                         expect($(".pag2_p_1").length).toBe(1);
                         expect($(".pag1_p_1").length).toBe(0);


                        // ****************** ripristino pag1 *******************************
                         var savedRoot = $(metaPageDetail.rootElement);
                        // 2. ottiene il parent del vecchio root rimuove il vecchio
                         var parentRoot = savedRoot.parent();
                        // 4. esegue replace del contenuto
                        $(parentNode)[0].replaceChild(metaPage1.savedRoot[0], savedRoot[0])
                        
                        // verifico elementi presenti/non presenti
                        // verifico elementi. semrpe presenti ma non tutti visibili
                        expect($(".pag1_p_1").length).toBe(1);
                        expect($(".pag2_p_1").length).toBe(0);
                        expect($(".pag1_txt_1").val()).toBe("txt1val");


                        $(metaPage1.pag1_txt_1).val("changed text on ref");

                        // il vecchio riferimento viene mantenuto, il text è quello non cambiato :)
                        expect($(".pag1_txt_1").val()).toBe("changed text on ref");
                        expect($(metaPage1.pag1_txt_1).is($(".pag1_txt_1"))).toBe(true);


                        // invoco evento click dopo il replaceWith() e vedo se lo esegue
                        $(".pag1_btn_1").click();
                        jasmine.clock().tick(100);
                        expect($(".pag1_p_1").is(":visible")).toBe(true);

                    });

                it('html + js saved and replaced using replaceChild() in Portale scenario. Events and references are preserved',
                    function() {
                        // istanzio html parent. c'è un qualsiasi appRott esterno e poi metaRoot, che è quello del framewrok
                        var mainwin = '<div id="appRoot">' +
                            '<div id="metaRoot"></div>' +
                            '</div>';
                        $("html").html(mainwin);

                        // -> SIMULO MetaPage1
                        function mp1() {
                            this.rootElement = '#metaRoot';
                            this.name = 'metaPage_registry1';
                        }
                        mp1.prototype = {
                            constructor: mp1,
                            setPropertyToTest: function() {
                                this.pag1_txt_1 =  $(".pag1_txt_1");
                            }
                        };

                        // -> SIMULO MetaPage2
                        function mpDetail() {
                            this.name = 'metaPage_registry2';
                            this.rootElement = '#metaRoot';
                        }
                        mpDetail.prototype = {
                            constructor: mpDetail
                        };

                        // instanzio metaPage classi
                        var metaPage1 = new mp1();
                        var metaPageDetail = new mpDetail();

                        // aggiungo alla callection, non necessario nel test
                        window.appMeta.addMetaPage('registry', 'anagrafica', mp1);
                        window.appMeta.addMetaPage('registry', 'anagrafica', mpDetail);

                        // -> simula la 1a getPage(). appendo al rootElement
                        // recupero html pag 1
                        var html1 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page1Nav.html");
                        $("#metaRoot").html(html1);
                        // invoco metodo per simulare il salvataggio di un riferimento, che poi riprendere in seguito
                        metaPage1.setPropertyToTest();

                        /***********************************************************************************/
                        // -> azioni su pag attuale
                        // attacho evento su controllo
                        var my_handler_on_page1 = function () {
                            $(".pag1_p_1").toggle();
                        }
                        $(".pag1_btn_1").on("click", my_handler_on_page1);
                        // invoco evento click e vedo se lo esegue
                        $(".pag1_btn_1").click();
                        jasmine.clock().tick(100);
                        expect( $(".pag1_p_1").is(":visible")).toBe(false);
                        // imposto un valore, simulo interazione utente, che inserisce qualcosa
                        $(".pag1_txt_1").val("txt1val");
                        /**********************************************************************************/


                        /*************************************************************************************/
                        // -> codice della callPage()
                        // 1. salvo nodes pag 1
                        metaPage1.savedRoot =  $(metaPage1.rootElement);
                        // 2. ottiene il parent del vecchio root
                        var parentNode = metaPage1.savedRoot.parent();
                        //3. ottiene un newChild avente pari id dell'old, e stessi attributes dell'old, ma senza contenuto
                        var newChild = $("#metaRoot")[0].cloneNode(false);
                        // 4. esegue replace del contenuto
                        $(parentNode)[0].replaceChild(newChild,  metaPage1.savedRoot[0])

                        // recupero html pag 2 stesso id di page1Nav.html
                        var html2 = appMeta.getData.cachedSyncGetHtml("base/test/spec_midway/fixtures/page2Nav.html");

                        // simulo ulteriore getPage()
                        $("#metaRoot").html(html2);
                        /*************************************************************************************/

                        // verifico elementi pag 2 presenti
                        expect($(".pag2_p_1").length).toBe(1);
                        expect($(".pag1_p_1").length).toBe(0);

                        /*************************************************************************************/
                        // -> codice della returnToCaller() ripristina la apg 1
                        var currentMetaPageRoot  =  $(metaPageDetail.rootElement);
                        // 2. ottiene il parent del vecchio root
                        var parentRoot = currentMetaPageRoot.parent();
                        // 4. esegue replace del contenuto del vecchio
                        $(parentRoot)[0].replaceChild(metaPage1.savedRoot[0], currentMetaPageRoot[0]);


                        /****************************************************************************************/
                        // -> VERIFICHE
                        // verifico elementi presenti/non presenti
                        expect($(".pag1_p_1").length).toBe(1);
                        expect($(".pag2_p_1").length).toBe(0);
                        expect($(".pag1_txt_1").val()).toBe("txt1val");

                        $(metaPage1.pag1_txt_1).val("changed text on ref");

                        // il vecchio riferimento viene mantenuto, il text è quello non cambiato :)
                        expect($(".pag1_txt_1").val()).toBe("changed text on ref");
                        expect($(metaPage1.pag1_txt_1).is($(".pag1_txt_1"))).toBe(true);

                        // invoco evento click dopo il replaceChild() e vedo se lo esegue
                        $(".pag1_btn_1").click();
                        jasmine.clock().tick(100);
                        expect($(".pag1_p_1").is(":visible")).toBe(true);

                    });
                
            });
    });