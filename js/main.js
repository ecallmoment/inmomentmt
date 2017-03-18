/* Set up firebase configuration*/
var config = {
    apiKey: "AIzaSyBH6TFe-uCEqENoAxt3DTc11bm1fO2yScg",
    authDomain: "inmoment-manual-tagging.firebaseapp.com",
    databaseURL: "https://inmoment-manual-tagging.firebaseio.com",
    storageBucket: "inmoment-manual-tagging.appspot.com",
    messagingSenderId: "660936685563"
  };
firebase.initializeApp(config);
var database = firebase.database();
var provider = new firebase.auth.GoogleAuthProvider();
/*Global variables*/
window.loggedin = false
window.uid
window.project_name = "Untitled"

/*Check the authorization state at a given time*/
function checkAuthState(pageName) {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            window.displayName = user.displayName;
            window.email = user.email;
            window.emailVerified = user.emailVerified;
            window.photoURL = user.photoURL;
            window.uid = user.uid;
            localStorage.user = user.uid;
            window.providerData = user.providerData;
            window.loggedin = true;
            document.getElementById("sign-in-status").innerHTML = "Signed In";
            document.getElementById("sign-in").innerHTML = "Sign Out";
            document.getElementById("not-logged-in").setAttribute("style","display:none")
            document.getElementById("logged-in").removeAttribute("style","display:none")
        } else {
            // User is signed out.
            window.loggedin = false;
            document.getElementById("sign-in-status").innerHTML = "Not Signed In";
            document.getElementById("sign-in").innerHTML = "Sign In";
            document.getElementById("not-logged-in").removeAttribute("style","display:none")
            document.getElementById("logged-in").setAttribute("style","display:none")
        }
    }, function(error) {
        console.log(error);
    });
    if (pageName == 'tagging') {
        console.log("checking auth state")
        startTagging()
    } else if (pageName == 'results') {
        console.log("checking auth state")
        displayResults()
    } else if (pageName == 'projects') {
        console.log("checking auth state")
        listProjects()
    }
}

/*Log in and out*/
function logging() {
    if (window.loggedin) {
        firebase.auth().signOut().then(function() {
            window.loggedin = false
            document.getElementById("sign-in-status").innerHTML = "Not Signed In"
            document.getElementById("sign-in").innerHTML = "Sign In"
        }, function(error) {
        });
    } else {
        firebase.auth().signInWithPopup(provider).then(function(result) {
            var token = result.credential.accessToken;
            var user = result.user;
            window.loggedin = true
            document.getElementById("sign-in-status").innerHTML = "Signed In"
            document.getElementById("sign-in").innerHTML = "Sign Out"
        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
        });
    }
}

/*Project Listing/Creating Functions*/

/*List the projects*/
function listProjects(){
    console.log("listing projects")
    database.ref("users").on("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            childSnapshot.forEach(function(anotherSnapShot) {
                var keyNames = Object.keys(anotherSnapShot.val());
                for (var i in keyNames) {
                    
                    /*Project list node*/
                    var listNode = document.createElement("li");
                    listNode.setAttribute('class', "list-group-item")
                    listNode.setAttribute('style', "color:#707b7b;background-color:#f4f7f7;border:0px;")
                    
                    /*Tagging button*/
                    var taggingButtonNode = document.createElement("button")
                    taggingButtonNode.setAttribute("type", "button")
                    taggingButtonNode.setAttribute("class", "btn btn-primary btn-sm")
                    taggingButtonNode.setAttribute("style", "margin-right:2%")
                    taggingButtonNode.appendChild(document.createTextNode("Tagging"))
                    var taggingClick = "pullProjectToTag('" + keyNames[i] + "')"
                    taggingButtonNode.setAttribute("onclick", taggingClick)
                    
                    /*Results button*/
                    var resultsButtonNode = document.createElement("a")
                    resultsButtonNode.setAttribute("role", "button")
                    var resultsClick = "pullToResults('" + keyNames[i] + "')"
                    resultsButtonNode.setAttribute("onclick", resultsClick)
                    resultsButtonNode.setAttribute("class", "btn btn-success btn-sm")
                    resultsButtonNode.appendChild(document.createTextNode("Results"))
                    
                    /*Name of project*/
                    var projectNameNode = document.createElement("span")
                    projectNameNode.setAttribute("class", "project-list-name")
                    projectNameNode.setAttribute("style", "margin-left:5%;")
                    projectNameNode.appendChild(document.createTextNode(keyNames[i]))
                    
                    /*Trash button*/
                    var trashButtonNode = document.createElement("button")
                    trashButtonNode.setAttribute("type", "button")
                    trashButtonNode.setAttribute("class", "pull-right btn btn-danger btn-sm")
                    var trashClick = "deleteProject('" + keyNames[i] + "')"
                    var trashCan = document.createElement("span")
                    trashCan.setAttribute("class","pull-right glyphicon glyphicon-trash")
                    trashButtonNode.setAttribute("onclick", trashClick)
                    trashButtonNode.appendChild(trashCan)
                    
                    listNode.appendChild(taggingButtonNode);
                    listNode.appendChild(resultsButtonNode);
                    listNode.appendChild(projectNameNode);
                    listNode.appendChild(trashButtonNode);
                    
                  
                    document.getElementById('project-list').appendChild(listNode);
                    
                }
            })
        })
    }, function(error) {
    });
}

function pullProjectToTag(projectName){
    console.log(projectName)
    document.cookie = "project=" + projectName ;
    
    document.location.href = "tagging.html";
}

function pullToResults(projectName){
    console.log(projectName)
    document.cookie = "project=" + projectName ;
    
    document.location.href = "results.html";
}

function deleteProject(projectName){
    if (confirm('Are you sure you want to delete this project, ' + projectName + '?')) {
        database.ref('users/' + window.uid + '/projects/').child(projectName).remove();
        window.location.reload();
    } else {
        // Do nothing!
    }
}

/*Uploading Projects*/

function setProjectName(value){
    window.project_name = value
    console.log(window.project_name)
}

function tagMapChange(){
    var fileInputTagMap = document.getElementById('tagmapfile');
    var file = fileInputTagMap.files[0];
    window.filetype = 'tagmap';
    getAsText(file);
}

function getAsText(fileToRead) {
    var reader = new FileReader();
    // Read file into memory as UTF-8      
    reader.readAsText(fileToRead);
    // Handle errors load
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
}

function loadHandler(event) {
    var csv = event.target.result;
    processData(csv);
}

function processData(csv) {
    var allTextLines = csv.split(/\r\n|\n/);
    var lines = [];
    for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        var tarr = [];
        for (var j = 0; j < data.length; j++) {
            tarr.push(data[j]);
        }
        lines.push(tarr);
    }
    window[window.filetype] = lines;
   
}

function errorHandler(evt) {
    if (evt.target.error.name == "NotReadableError") {
        alert("Cannot read file !");
    }
}

function rwChange(){
    var fileInputRW = document.getElementById('rwfile');
    var file = fileInputRW.files[0];
    window.filetype = 'rwfile';
    getAsText(file);
}

function writeTagMapToDatabase() {
    var toMap = window['tagmap'];
    for (e in toMap) {
        var f = 1
        var databaseString = []
        while (f < toMap[e].length && toMap[e][f] !== undefined && toMap[e][f] !== "") {
            databaseString.push(toMap[e][f])
            f++
        }
        if (databaseString.length > 0) {
            var newString = databaseString.join("/")
            database.ref('users/' + window.uid + "/projects/" + window.project_name + '/tagmap/' + newString).set({
                end: "this"
            })
        }
    }
}

function writeProjectToDatabase() {
    
    writeTagMapToDatabase();
    comments = saveAndProcess()
    for (var b = 0; b < comments.length; b++) {
        
        database.ref('users/' + window.uid + "/projects/" + window.project_name + '/comments/' + comments[b][3]).push({
            commentnum: comments[b][3],
            commenttag: comments[b][0],
            tagname: comments[b][1],
            commentcovered: comments[b][2],
            commentfull: comments[b][4],
            taggedas: "untagged"
            
        });
    }
    database.ref('users/' + window.uid + "/projects/" + window.project_name + '/info/').set({
        curIndex: 0,
        mtIndex: 0,
        accuracy: 0
    });
}

function saveAndProcess() {
    comment_list = rearrange();
    return comment_list
}

function rearrange() {
    var tags = window['tagmap'];
    var tagsDict = mapTags(tags);
    var annotations = window['rwfile'];
    sorted_comments = compileComments(annotations, tagsDict);
    return sorted_comments;
}

function mapTags(tags) {
    var myTagsDict = {}
    for (var i = 0; i < tags.length; i++) {
        var cleanedString = []
        temp = tags[i].filter(function(e) {
            return e
        });
        if (temp.length > 0) {
            var key = temp[0]
            for (var j = 1; j < temp.length; j++) {
                cleanedString.push(temp[j]);
            }
            var value = cleanedString.join(" - ");
            myTagsDict[key] = value;
        }
    }
    return myTagsDict;
}

function compileComments(annotated, tagsDict) {
    cannotated = [];
    cnumber = 0;
    for (var k = 0; k < annotated.length; k++) {
        if (parseInt(annotated[k][0]) > cnumber) {
            cnumber = parseInt(annotated[k][0]);
            ccomment = annotated[k][1]
        } else {
            if (annotated[k][2] == undefined) {
                var linecomment = ccomment;
                var lineannotation = "Z - no annotation";
                var coveredtext = "Z - no covered text";
                var toannotate = [];
                toannotate.push(lineannotation);
                toannotate.push("no annotation name");
                toannotate.push(coveredtext);
                toannotate.push(cnumber);
                toannotate.push(linecomment);
                cannotated.push(toannotate);
            } else if (tagsDict[annotated[k][2]] === undefined) {
                // console.log("tagname not found for ",annotated[k][2]);
            } else {
                var linecomment = ccomment;
                var lineannotation = annotated[k][2];
                var coveredtext = annotated[k][3];
                var toannotate = [];
                toannotate.push(lineannotation);
                toannotate.push(tagsDict[lineannotation]);
                toannotate.push(coveredtext);
                toannotate.push(cnumber);
                toannotate.push(linecomment);
                cannotated.push(toannotate);
            }
        }
    }
    return cannotated;
}

function buildMTObjects(obj1,theURL){
    var tempArray = new Array()
        //console.log(obj1)
    var previousURL = theURL
    if (previousURL === undefined) {
        previousURL = ''
    }
    for (obj2 in obj1) {
        if (obj2 != 'url') {
            var newSection = new Object()
            newSection["name"] = obj2
            var myURL = previousURL + obj2 + "/"
            newSection["url"] = myURL
            if (obj1[obj2].hasOwnProperty("end")) {
                //    console.log(obj2, " reached the end of the node")
            } else {
                var tempSection = new Object()
                tempSection["title"] = obj2
                var myArray = new Array()
                var myObject = obj1[obj2]
                var ThisArray = new Array()
                ThisArray = buildMTObjects(myObject, myURL)
                tempSection["items"] = ThisArray
                newSection["section"] = tempSection
            }
            tempArray.push(newSection)
        }
    }
    return tempArray
}

/************/

function startTagging(){
    console.log("starting to tag")
    
    if (window.uid === undefined) {
        window.uid = localStorage.user;
    }
    
    splitCookie = document.cookie.split('=')
    projName = splitCookie[1]
    window.project_name = projName
    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/info').on('value', function(snapshot){
        localStorage.currentMTindex = snapshot.val()["mtIndex"]
        
    })
    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/info').on('value', function(snapshot){
        localStorage.currentATindex = snapshot.val()["curIndex"]
        
    })
    if(isNaN(parseInt(localStorage.currentATindex)))
    {
        localStorage.currentATindex = 0
    }
    if(isNaN(parseInt(localStorage.currentMTindex)))
    {
        localStorage.currentMTindex = 0
    }
    
    tagMenu = new Array();
    toMT = {}
    database.ref('users/' + window.uid + '/projects/' + projName + '/tagmap').on('value', function(lvl1) {
        toMT = lvl1.exportVal()
        tagMenu = buildMTObjects(toMT,"")
    })
    document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
    
    console.log("calling grabComments()")
    var returnArray = new Array();
    var commentsToMT = new Array();
    var commentsToAT = new Array();
    var sortedCommentsToAT;
    console.log(window.project_name)
    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/comments').on('value',
        function(snapshot){
            snapshot.forEach(function(snapshot2){
                snapshot2.forEach(function(snapshot3){
                    var pulledComment = snapshot3.val()
                    var newComment = {}
                    newComment["commenttag"] = pulledComment["commenttag"]
                    newComment["commentcovered"] = pulledComment["commentcovered"]
                    newComment["commentfull"] = pulledComment["commentfull"]
                    newComment["commentnum"] = pulledComment["commentnum"]
                    newComment["tagname"] = pulledComment["tagname"]
                    newComment["taggedas"] = pulledComment["taggedas"]
                    newComment["annotationkey"] = snapshot3.key
                    
                    if(newComment["commenttag"] == "Z - no annotation"){
                        if(findInArray(commentsToMT, newComment["annotationkey"]) == false){
                            commentsToMT.push(newComment)
                        }
                    }
                    else{
                        if(newComment["taggedas"] == "AT Incorrect" ){
                            if(findInArray(commentsToMT, newComment["annotationkey"]) == false){
                                commentsToMT.push(newComment)
                            }
                            if(findInArray(commentsToAT, newComment["annotationkey"]) == false){
                                commentsToAT.push(newComment)
                            }
                        }
                        else if( newComment["taggedas"] == "MT CREATED"){
                            if(findInArray(commentsToMT, newComment["annotationkey"]) == false){
                                commentsToMT.push(newComment)
                            }
                        }
                        else{
                            if(findInArray(commentsToAT, newComment["annotationkey"]) == false){
                                commentsToAT.push(newComment)
                            }
                        }
                        
                    }
                })
            })
            sortedCommentsToAT = commentsToAT.sort(tagNameCompare)
            returnArray.push(commentsToMT)
            returnArray.push(sortedCommentsToAT)
            console.log(returnArray)
    document.getElementById("auto-start").disabled = false
    document.getElementById("manual-start").disabled = false
    
    /*Initialize visibilities*/
    document.getElementById("progress-bars").removeAttribute("style","display:none")
    document.getElementById("initial-tag-buttons").removeAttribute("style","display:none")
   
    document.getElementById("auto-start").addEventListener("click",function(e){
        
        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
        document.getElementById("manual-switch").removeAttribute("style","display:none")
        document.getElementById("auto-tagging").removeAttribute("style","display:none")
        
        beginAT(returnArray[1])
    })
    document.getElementById("manual-start").addEventListener("click",function(e){
        
        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
        document.getElementById("auto-switch").removeAttribute("style","display:none")
        document.getElementById("manual-tagging").removeAttribute("style","display:none")
        document.onmouseup = doSomethingWithSelectedText;
                document.onkeyup = doSomethingWithSelectedText;
        beginMT(returnArray[0],tagMenu)
    })
    document.getElementById("manual-switch").addEventListener("click",function(e){

        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
        document.getElementById("auto-switch").removeAttribute("style","display:none")
        document.getElementById("manual-switch").setAttribute("style","display:none")
        document.getElementById("manual-tagging").removeAttribute("style","display:none")
        document.getElementById("auto-tagging").setAttribute("style","display:none")
        document.onmouseup = doSomethingWithSelectedText;
                document.onkeyup = doSomethingWithSelectedText;
        beginMT(returnArray[0],tagMenu)
    })
    document.getElementById("auto-switch").addEventListener("click",function(e){
        
        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
        document.getElementById("manual-switch").removeAttribute("style","display:none")
        document.getElementById("auto-switch").setAttribute("style","display:none")
        document.getElementById("auto-tagging").removeAttribute("style","display:none")
        document.getElementById("manual-tagging").setAttribute("style","display:none")
       
        beginAT(returnArray[1])
    })
    console.log('grabComments finished')
   
   })
   console.log('outside grabComments')
}


function beginAT(ATcomments){
    console.log("beginning AT")
   document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
    var ATindex = parseInt(localStorage.currentATindex)
    checkATEdges(ATcomments.length)
    try{
                changeATComment(ATcomments[ATindex])
            }catch(err){
                
            }
    /*Initialize listeners*/
    document.getElementById("atyes").addEventListener("click", function(e) {
        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
        ATcomments[ATindex]["taggedas"] = "AT Correct"
        console.log(ATindex + 1)
        ATclick(1,"AT Correct",ATcomments[ATindex],function(data){
        ATindex = parseInt(localStorage.currentATindex)
           checkATEdges(ATcomments.length)
            try{
                changeATComment(ATcomments[ATindex])
            }catch(err){
                
            }
        })
       
    })
    document.getElementById("atno").addEventListener("click", function(e) {
        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
        ATcomments[ATindex]["taggedas"] = "AT Incorrect"
        console.log(ATindex + 1)
        ATclick(1, "AT Incorrect", ATcomments[ATindex],function(data){
        ATindex = parseInt(localStorage.currentATindex)
           checkATEdges(ATcomments.length)
            try{
                changeATComment(ATcomments[ATindex])
            }catch(err){
                
            }
        })
        //also add to MT
    })
    document.getElementById("atflag").addEventListener("click", function(e) {
        document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
         ATcomments[ATindex]["taggedas"] = "AT Flagged"
        console.log(ATindex + 1)
        ATclick(1, "AT Flagged", ATcomments[ATindex], function(data){
            ATindex = parseInt(localStorage.currentATindex)
           checkATEdges(ATcomments.length)
            try{
                changeATComment(ATcomments[ATindex])
            }catch(err){
                
            }
        })
        
    })
    document.getElementById("atback").addEventListener("click", function(e) {
        console.log(ATindex - 1)
        ATclick(-1, "", ATcomments[ATindex])
        ATindex = parseInt(localStorage.currentATindex)
           checkATEdges(ATcomments.length)
            try{
                changeATComment(ATcomments[ATindex])
            }catch(err){
                
            }
    })
    document.getElementById("atforward").addEventListener("click", function(e) {
        console.log(ATindex + 1)
        ATclick(1, "", ATcomments[ATindex])
        ATindex = parseInt(localStorage.currentATindex)
           checkATEdges(ATcomments.length)
            try{
                changeATComment(ATcomments[ATindex])
            }catch(err){
                
            }
            
    })
    
    //return ATcomments?
}

function ATclick(indexChange,code,comment, callback){
    localStorage.currentATindex = parseInt(localStorage.currentATindex) + indexChange
    console.log(comment)
    if(code != "")
    {
        database.ref('users/' + window.uid + '/projects/' + window.project_name + '/comments/' + comment["commentnum"] + "/" + comment["annotationkey"]).update({"taggedas" : code})
    }
    
    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/info').update({
        "curIndex": parseInt(localStorage.currentATindex)
    })
}

function checkATEdges(ATsize){
     
    var ATindex = parseInt(localStorage.currentATindex);
    
    if(ATindex < 0)
    {
        localStorage.currentATindex = 0
        ATindex = 0
    }
    else if(ATindex > ATsize){
        ATindex = ATsize
        localStorage.currentATindex = ATindex
    }

        
    if (ATindex == 0){
        document.getElementById("atback").style.visibility = "hidden"
    }
    else if (ATindex >= ATsize){
        document.getElementById("color-buttons").setAttribute("style","display:none")
        document.getElementById("tag-name").setAttribute("style","display:none")
        document.getElementById("atforward").style.visibility = "hidden"
        document.getElementById("comment").innerHTML = "You have reached the end of the autotagged comments."
    }
    else{
        document.getElementById("atback").style.visibility = "visible"
        document.getElementById("color-buttons").removeAttribute("style","display:none")
        document.getElementById("tag-name").removeAttribute("style","display:none")
        document.getElementById("atforward").style.visibility = "visible"
    }
}

function changeATComment(comment){
    document.getElementById("tag-name").innerHTML = comment["tagname"]
    var commentSubstring = comment["commentcovered"]
    var markedString = '<mark id="marking">' + commentSubstring + '</mark>'
    var commentInnerHTML = comment["commentfull"].replace(commentSubstring, markedString)
    document.getElementById("comment").innerHTML = commentInnerHTML
    updateColors(comment["taggedas"])
}

function beginMT(MTcomments, tagOptions){
 $('#mobileMenu').mobileMenu({
                    section: {
                        title: 'options',
                        items: tagOptions
                    }
                })
                document.getElementById('mtback').addEventListener('click', function(e) {
                    localStorage.MTINDEX = parseInt(localStorage.MTINDEX) - 1
                    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/info').update({
                        "mtIndex": parseInt(localStorage.MTINDEX)
                    })
                    localStorage.commentNumber = MTcomments[localStorage.MTINDEX]["number"]
                    localStorage.commentKey = MTcomments[localStorage.MTINDEX]["annokey"]
                    localStorage.coveredText = ""
                    $('#mobileMenu').mobileMenu({
                        section: {
                            title: 'options',
                            items: tagOptions
                        }
                    })
                    console.log("Current MTIndex set to: ", localStorage.MTINDEX, " on BACK CLICK")
                    localStorage.commentNumber = MTcomments[localStorage.MTINDEX]["number"]
                    localStorage.commentKey = MTcomments[localStorage.MTINDEX]["annokey"]
                    MTboundCheck(MTcomments)
                })
                document.getElementById('mtforward').addEventListener('click', function(e) {
                    localStorage.MTINDEX = parseInt(localStorage.MTINDEX) + 1
                    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/info').update({
                        "mtIndex": parseInt(localStorage.MTINDEX)
                    })
                    try {
                        localStorage.commentNumber = MTcomments[localStorage.MTINDEX]["number"]
                        localStorage.commentKey = MTcomments[localStorage.MTINDEX]["annokey"]
                    } catch (err) {
                        localStorage.commentNumber = ""
                        localStorage.commentKey = ""
                    }
                    //localStorage.commentNumber = MTcomments[localStorage.MTINDEX]["number"]
                    //localStorage.commentKey = MTcomments[localStorage.MTINDEX]["annokey"]
                    localStorage.coveredText = ""
                    $('#mobileMenu').mobileMenu({
                        section: {
                            title: 'options',
                            items: tagOptions
                        }
                    })
                    console.log("Current MTIndex set to: ", localStorage.MTINDEX, " on FORWARD CLICK")
                    MTboundCheck(MTcomments)
                })
                MTboundCheck(MTcomments)
}

function manualTag(MTComments) {
    // console.log(MTComments)
    //tagOptions = new Array()
    var indexMT = parseInt(localStorage.MTINDEX)
    localStorage.commentNumber = MTComments[indexMT]["number"]
    localStorage.commentKey = MTComments[indexMT]["annokey"]
    MTboundCheck(MTComments)
}

function manualClick(mtindex, mtcomments) {
    //this line below often returns undefined for comment at that index. make sure it runs after MTboundCheck
    localStorage.commentNumber = mtcomments[mtindex]["number"]
    localStorage.commentKey = mtcomments[mtindex]["annokey"]
    if (mtcomments[mtindex]["TAGGED"] == "untagged") {
        document.getElementById("manual-comment").innerHTML = mtcomments[mtindex]["commentfull"]
    } else {
        var subString = mtcomments[mtindex]["covered"];
        var markedString = subString;
        var code = mtcomments[mtindex]["TAGGED"]
        if (code === "MT CREATED") {
            markedString = '<mark style="background-color:#79c7f2">' + subString + "</mark>"
        }
        var fullComment = mtcomments[mtindex]["commentfull"];
        try{
            var commentInnerHTML = fullComment.replace(subString, markedString)
        }
        catch(err){
            var commentInnerHTML = fullComment
        }
            //console.log(commentInnerHTML)
        document.getElementById("manual-comment").innerHTML = commentInnerHTML;
    }
}

function MTboundCheck(mtComments) {
    // console.log("WITHIN BOUND CHECK: ")
    //console.log(mtComments)
    var indexMT = parseInt(localStorage.MTINDEX)
    if (indexMT < 0) {
        indexMT = 0
        localStorage.MTINDEX = indexMT
        console.log("Current MTIndex set to: 0")
        localStorage.commentNumber = mtComments[indexMT]["number"]
        localStorage.commentKey = mtComments[indexMT]["annokey"]
        manualClick(indexMT, mtComments);
    } else if (indexMT > mtComments.length) {
        indexMT = mtComments.length
        localStorage.MTINDEX = indexMT
        console.log("Current MTIndex set to: end")
        localStorage.commentNumber = ""
        localStorage.commentKey = ""
    }
    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/info').update({
        "mtIndex": parseInt(localStorage.MTINDEX)
    })
    if (indexMT === 0) {
        manualClick(indexMT, mtComments);
        document.getElementById("mtback").disabled = true;
        document.getElementById("mtforward").disabled = false;
        localStorage.commentNumber = mtComments[indexMT]["number"]
        localStorage.commentKey = mtComments[indexMT]["annokey"]
    } else if (indexMT === mtComments.length) {
        document.getElementById("mtback").disabled = false;
        document.getElementById("mtforward").disabled = true;
        document.getElementById('manual-comment').innerHTML = "You reached the end of the manual tagged comments!";
        localStorage.commentNumber = ""
        localStorage.commentKey = ""
    } else {
        localStorage.commentNumber = mtComments[indexMT]["number"]
        localStorage.commentKey = mtComments[indexMT]["annokey"]
        manualClick(indexMT, mtComments);
        document.getElementById("mtback").disabled = false;
        document.getElementById("mtforward").disabled = false;
        document.getElementById("mtforward").style.visibility = "visible"
    }
}

function getSelectedText() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
        text = document.selection.createRange().text;
    }
    return text;
}

function doSomethingWithSelectedText() {
    var selectedText = getSelectedText();
    if (selectedText) {
        localStorage.coveredText = selectedText;
        console.log("Highlighted Text to Tag: ", localStorage.coveredText)
            //database.ref('users/' + window.uid + '/projects/' + window.project_name + '/comments/' + localStorage.commentNumber).push(newComment)
            // console.log(newComment)
        localStorage.subString = selectedText;
        var markedString = '<mark style="background-color:#79c7f2">' + localStorage.subString + "</mark>"
        var fullComment = ''
        database.ref('users/' + window.uid + '/projects/' + window.project_name + '/comments/' + localStorage.commentNumber + "/" + localStorage.commentKey).on('value', function(snapshot) {
            fullComment = snapshot.val()["commentfull"]
        })
        var commentInnerHTML = fullComment.replace(localStorage.subString, markedString)
            // console.log(commentInnerHTML)
        document.getElementById("manualtag").innerHTML = commentInnerHTML;
        localStorage.currentColor = "blue"
        tagOptions = new Array();
        toMT = {}
        database.ref('users/' + window.uid + '/projects/' + projName + '/tagmap').on('value', function(lvl1) {
            toMT = lvl1.exportVal()
            console.log(toMT)
            tagOptions = buildObjects(toMT)
        })
        console.log(localStorage.coveredText)
        $('#mobileMenu').mobileMenu({
                section: {
                    title: 'options',
                    items: tagOptions
                }
            })
            //okay, now it actually needs to add it into the index, too.
    }
}








/* Helper functions */
function findInArray(arrayToCheck, newCommentKey){
    var found = false;
    for(var a = 0; a < arrayToCheck.length; a++) {
        if (arrayToCheck[a].annotationkey == newCommentKey) {
            found = true;
            return found;
        }
    }
    return found;
}

function tagNameCompare(a, b) {
    return a["tagname"].localeCompare(b["tagname"])
}

function updateColors(code){
    if (code === "AT Correct") {
        document.getElementById("marking").style.backgroundColor = "#79bd42"
    } else if (code === "AT Incorrect") {
        document.getElementById("marking").style.backgroundColor = "#db8823"
    } else if (code === "AT Flagged") {
        document.getElementById("marking").style.backgroundColor = "#cc340e"
    } else if (code === "MT CREATED") {
        document.getElementById("marking").style.backgroundColor = "#5fa8cc"
    } 
}





/************/

/*Display results*/
function displayResults(){
    console.log("displaying results")
    if (window.uid === undefined) {
        window.uid = localStorage.user;
    }

    splitCookie = document.cookie.split('=')
    console.log(splitCookie)
    projName = splitCookie[1]
    window.project_name = projName
    var returnArray = new Array();
    var commentsToMT = new Array();
    var commentsToAT = new Array();
    var sortedCommentsToAT;
    console.log(window.project_name)
    database.ref('users/' + window.uid + '/projects/' + window.project_name + '/comments').on('value',
        function(snapshot){
            snapshot.forEach(function(snapshot2){
                snapshot2.forEach(function(snapshot3){
                    var pulledComment = snapshot3.val()
                    var newComment = {}
                    newComment["commenttag"] = pulledComment["commenttag"]
                    newComment["commentcovered"] = pulledComment["commentcovered"]
                    newComment["commentfull"] = pulledComment["commentfull"]
                    newComment["commentnum"] = pulledComment["commentnum"]
                    newComment["tagname"] = pulledComment["tagname"]
                    newComment["taggedas"] = pulledComment["taggedas"]
                    newComment["annotationkey"] = snapshot3.key
                    
                    if(newComment["commenttag"] == "Z - no annotation"){
                        if(findInArray(commentsToMT, newComment["annotationkey"]) == false){
                            commentsToMT.push(newComment)
                        }
                    }
                    else{
                        if(newComment["taggedas"] == "AT Incorrect" ){
                            if(findInArray(commentsToMT, newComment["annotationkey"]) == false){
                                commentsToMT.push(newComment)
                            }
                            if(findInArray(commentsToAT, newComment["annotationkey"]) == false){
                                commentsToAT.push(newComment)
                            }
                        }
                        else if( newComment["taggedas"] == "MT CREATED"){
                            if(findInArray(commentsToMT, newComment["annotationkey"]) == false){
                                commentsToMT.push(newComment)
                            }
                        }
                        else{
                            if(findInArray(commentsToAT, newComment["annotationkey"]) == false){
                                commentsToAT.push(newComment)
                            }
                        }
                        
                    }
                })
            })
            sortedCommentsToAT = commentsToAT.sort(tagNameCompare)
            returnArray.push(commentsToMT)
            returnArray.push(sortedCommentsToAT)
            console.log(returnArray)
        var comment_results = returnArray[0].concat(returnArray[1])
        console.log(comment_results)
        var toSortMT = new Array()
        var toSortCorrect = new Array()
        var toSortIncorrect = new Array()
        var toSortFlagged = new Array()
        for (var v = 0; v < comment_results.length; v++) {
            var tagResult = comment_results[v]["taggedas"]
            if (tagResult == "AT Correct") {
                toSortCorrect.push(comment_results[v])
            } else if (tagResult == "AT Incorrect") {
                toSortIncorrect.push(comment_results[v])
            } else if (tagResult == "AT Flagged") {
                toSortFlagged.push(comment_results[v])
            } else if (tagResult == "MT CREATED") {
                for (var t in comment_results[v]["commentMT"]) {
                    if (comment_results[v]["commentMT"][t] != undefined && comment_results[v]["commentcovered"] != undefined) {
                        var newMTComment = comment_results[v]
                        newMTComment["tagname"] = comment_results[v]["commentMT"][t]
                        toSortMT.push(newMTComment)
                    }  
                    else {
                        if (comment_results[v]["commentMT"]) {
                            if (comment_results[v]["commentMT"][t] != undefined && comment_results[v]["commentcovered"] != undefined) {
                                var newMTComment = comment_results[v]
                                newMTComment["tagname"] = comment_results[v]["commentMT"][t]
                                toSortMT.push(newMTComment)
                            }
                        }
                    }
                }
            }
        }
        var sortedCorrect = toSortCorrect.sort(tagNameCompare)
        var sortedIncorrect = toSortIncorrect.sort(tagNameCompare)
        var sortedFlagged = toSortFlagged.sort(tagNameCompare)
        var sortedMT = toSortMT.sort(tagNameCompare)
        var toExport = new Array()
        for (var z = 0; z < sortedCorrect.length; z++) {
            resultDisplay("yesResults", sortedCorrect[z], "79bd42")
            toExport.push(resultToExport(sortedCorrect[z]))
        }
        for (var y = 0; y < sortedIncorrect.length; y++) {
            resultDisplay("noResults", sortedIncorrect[y], "db8823")
            toExport.push(resultToExport(sortedIncorrect[y]))    
        }
        for (var x = 0; x < sortedFlagged.length; x++) {
            resultDisplay("flagResults", sortedFlagged[x], "cc340e")
            toExport.push(resultToExport(sortedFlagged[x]))           
        }
        for (var w = 0; w < sortedMT.length; w++) {
            resultDisplay("MTResults", sortedMT[w], "5fa8cc")
            toExport.push(resultToExport(sortedMT[w]))           
        }
        var csv = new CSV(toExport, {
                        header: true
                    });
        var encodedCSV = csv.encode()
        link = document.createElement('a');
        link.textContent = 'Download Results';
        link.download = "manual-tagging-results.csv";
        link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(encodedCSV));
        document.getElementById("download").appendChild(link);   
        })
        
        
  
  
}

function resultDisplay(id, comment, color){
    console.log(id)
    var commentSubstring = comment["commentcovered"]
    var markedString = '<mark style="background-color:#' + color + '">' + commentSubstring + '</mark>'
    var fullComment = comment["commentfull"]
    var commentInnerHTML = "<li><b>" + comment["tagname"] + "</b> " + fullComment.replace(commentSubstring, markedString) + "</li>"
    document.getElementById(id).innerHTML += commentInnerHTML
}

function resultToExport(comment){
    var exportedComment = {
        "comment-number": comment["commentnum"],
        "result": comment["taggedas"],
        "tag-name": comment["commentname"],
        "covered-text": comment["commentcovered"],
        "full-comment": comment["commentfull"]
    }
    return exportedComment
}