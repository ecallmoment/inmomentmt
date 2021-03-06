"use strict";

(function($) {

    $.fn.mobileMenu = function(structure, options) {
        
        //create array of tags selected already on a comment
       // var selectedTags = new Array()
      // console.log(localStorage.currentMTtags)
       var selectedTags = new Array()
        if(localStorage.currentMTtags != undefined){
            selectedTags = JSON.parse(localStorage.currentMTtags)
        }
       // console.log(selectedTags)
        //go through all of the comments and check for "MT Created"
        //make projectName dynamic
        //console.log(localStorage.projectName)
        
        var o = options || {};
        var self = this;
        var subOpen = 1;
        var closeAdded = 0;
        var settings = $.extend({
            animation: {
                speed: 200,
                easing: 'easeOutSine'
            },
            closeAll: true,
            mainOpenFrom: 'left',
            shadow: true,
            opener: '.mobileMenuOpener',
            closeStatic: true
        }, o );
        var subOpenFrom = 'left';
        
        // init menu creation
        createmenuPage(structure.section);
        initOpenButton();
        self.css('height', getDeviceSize().height);
   
        function createmenuPage(section, back) {
            var items = section.items;
            var sub = back !== undefined ? true : false;
            var page = addPage(sub); // add a new page
            var backButton = createBackButton(back, page);

            // Add title to pages
            var sectionTitle = addTitle(section.title);
            page.append(sectionTitle);

            // Add back button if it is submenu
            if(sub) page.append(backButton);

            // Add Close button
            var closeBtn = closeButton(page);
            if (settings.closeStatic){
                closeBtn.addClass('static');
                page.addClass('closeStatic');
                if(closeAdded === 1) {
                    $('#mobileMenuWrapper').append(closeBtn);
                }
            }
            else{
                page.prepend(closeBtn);
            }

            // Add animation to submenu
            animatePage(sub, page);

            $.each(items, function(key, value) {
                var item = templates().item;
                if ('section' in value) {
                    item.addClass('more');
                } 
                else {
                    if(localStorage.coveredText == ""){
                        for(var q = 0; q < selectedTags.length; q++){
                            if(selectedTags[q] == value.url){
                                item[0].style.backgroundColor = 'rgb(12,90,173)'
                                item[0].style.color = 'rgb(244,247,247)'
                            }
                        }
                    }
                    
                    if (value.url) {
                        addUrlToItem(item, value.url); // <--- check if has URL
                    }
                }
            
                item.append(value.name);
                page.append(item);

                item.on('click', function(e) {
                    if ('section' in value) {
                        subOpen++;
                        var back = section.title;
                        createmenuPage(value.section, back);
                    }
                });
            });

      if (!sub) {
        var direction = getDirection(settings.mainOpenFrom, false);
        self.css(direction);
      }

    }
        
        function createOpenButton(){
            var openBtn = templates().open;

            for (var i = 0; i < 3; i++) {
                var line = templates().line;
                openBtn.append(line);
            }
            $('#mobileMenuWrapper').append(openBtn);

            return openBtn;
        }   

        function initOpenButton(){

            // if(settings.opener === '.mobileMenuOpener') createOpenButton();

            var a = settings.animation;
            var direction = getDirection(settings.mainOpenFrom, true);
            self.css('display', 'inline-block');
            $(this).animate({ opacity: 0 }, a.speed, function(){
                $(this).css('display', 'none');
            });
            $('.close').css('display', 'block');
            $('.close').animate({ opacity: 1 }, a.speed );
            self.animate(direction , a.speed, a.easing );
    
        }

        function addTitle(sectionName) {
            var tit = templates().title;
            tit.append(sectionName);
            return tit;
        }

        function addUrlToItem(item, url) {
            item.on('click', function(){
                var clickedComment = JSON.parse(localStorage.currentMTcomment)
                console.log(clickedComment)
                if(clickedComment["taggedas"] != "MT Created")
                {
                    localStorage.coveredText = clickedComment["coveredtext"]
                }
                console.log(url)
                console.log(localStorage.coveredText)
                if (item[0].style.backgroundColor == "rgb(244,247,247)" || item[0].style.backgroundColor == "" ){
                    item[0].style.backgroundColor = 'rgb(12, 90, 173)'
                    item[0].style.color = 'rgb(244,247,247)'
                    
                    if(localStorage.coveredText != ""){
                       database.ref('projects/' + localStorage.projectName + "/comments/" + clickedComment["commentkey"] + "/tags/" + url + "/").push({
                            coveredtext: localStorage.coveredText,
                            taggedas: "MT Created"
                        }).then(function(snapshot){
                            clickedComment["key"] = snapshot.key
                            localStorage.currentMTcomment = JSON.stringify(clickedComment)
                        })
                        
                      
                    }
                    else{
                        database.ref('projects/' + localStorage.projectName + "/comments/" + clickedComment["commentkey"] + "/tags/" + url + "/").push({
                            coveredtext: "",
                            taggedas: "MT Created"
                        }).then(function(snapshot){
                            clickedComment["key"] = snapshot.key
                            localStorage.currentMTcomment = JSON.stringify(clickedComment)
                        })
                    }
                }
                else{
                    item[0].style.backgroundColor = 'rgb(244,247,247)'
                    item[0].style.color = 'rgb(12,90,173)'
                    
                    database.ref('projects/' + localStorage.projectName + "/comments/" + clickedComment["commentkey"] + "/tags/" + url + "/" + clickedComment["key"] ).on('value', function(snapshot) {
                        console.log(snapshot.val())
                        
                               snapshot.ref.remove()
                            
                        })
                      
                }
            })
        }

        function addPage(sub) {
          var page = templates().page;
          page.css( 'height', getDeviceSize().height );
          if(sub) page.css( getDirection(subOpenFrom) );
          // if(sub) page.css('left', getDeviceSize().width );

          self.append(page); // add page to DOM

          return page;
        }

        function animatePage(sub, page) {
          if(!sub) return;
          var a = settings.animation;
          var direction = getDirection(subOpenFrom, true);
          page.animate(direction, a.speed, a.easing);
        }

        function createBackButton(name, page) {
          var btn = templates().btn;

          btn.append('<span>' + name + '</span>');
          btn.on('click', function(e){
            closePage(page);
            //btn.css(backgroundColor : "white")
            //btn.css(color:'30c5aad')
          });

          return btn;
        }

        function closePage(page){
          var a = settings.animation;
          var direction = getDirection(subOpenFrom);
          page.animate(direction, a.speed, a.easing, function() {
            page.remove();
          });
        }

        function closeButton(page) {
          var btn = templates().close;
          var a = settings.animation;
          var direction = getDirection(settings.mainOpenFrom);

          btn.on('click', function(e){

            btn.animate({ opacity: 0 }, a.speed*0.2, function(){
              btn.css('display', 'none');
            });
            self.animate(direction, a.speed, a.easing, function(){
              self.css('display', 'none');
              $(settings.opener).css('display', 'block');
              $(settings.opener).animate({ opacity: 1 }, a.speed );

              /* close all submenus when close */
              if (settings.closeAll) {
                for (var i = 1; i < subOpen; i++) {
                  var findPages = $('.page').not($('.page').eq(0));
                  closePage(findPages);
                }
              }
            });
          });
          closeAdded++;
          return btn;
        }

        function getDirection(set, opening){
          var direction = {};
          switch (set) {
            case 'top':
              direction = { top: opening ? 0 : getDeviceSize().height * -1 };
              break;
            case 'right':
              direction = { left: opening ? 0 : getDeviceSize().width * 2 }
              break;
            case 'left':
              direction = { left: opening ? 0 : getDeviceSize().width * -1 }
          }
          return direction;
        }

        function getDeviceSize() {
          return {
            height: $(document).height(),
            width: $(document).width()
          }
        }

        function templates() {
          var pageClass = settings.shadow ? 'page shadow' : 'page';
          return {
            page: $('<div class="'+ pageClass +'"></div>'),
            item: $('<div class="item"></div>'),
            btn: $('<div class="button back"></div>'),
            close: $('<div class="button close"></div>'),
            open: $('<div class="mobileMenuOpener"></div>'),
            line: $('<div class="line"></div>'),
            title: $('<div class="title"></div>')
          }
        }

    };

}(jQuery));
