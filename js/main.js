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

function checkAuthState(pageName) {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
           // console.log(user)
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
        // console.log(error);
    });
    if (pageName == "tagging") {
        tagging()
    } else if (pageName == "results") {
        displayResults()
    } else 
        if (pageName == "project") {
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
            document.getElementById("not-logged-in").setAttribute("style","display:none")
            document.getElementById("logged-in").removeAttribute("style","display:none")
        }, function(error) {
        });
    } else {
        firebase.auth().signInWithPopup(provider).then(function(result) {
            var token = result.credential.accessToken;
            var user = result.user;
            window.loggedin = true
            document.getElementById("sign-in-status").innerHTML = "Signed In"
            document.getElementById("sign-in").innerHTML = "Sign Out"
            document.getElementById("not-logged-in").removeAttribute("style","display:none")
            document.getElementById("logged-in").setAttribute("style","display:none")
            
        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
        });
    }
}

function parseData(file, callback)
{
    var lines = new Array()
   // for(var a = 0; a < files.length; a++){
       
        //console.log(files[a])
        Papa.parse(file, {
       // worker: true,
            step: function(results) {
                //console.log("Row:", results.data);
                
                lines.push(results.data)
            },
            complete: function(results){
                //console.log(lines)
                callback(lines)
                
            }
        })
  //  }
  //  callback(lines)
}
function uploadProject(){
    var projectName = document.getElementById("new-project-name").value
    console.log(projectName)
    console.log("projects/" + projectName + "/info/users")
    //substitute userID
    database.ref("projects/" + projectName + "/info/users/").push(localStorage.user)
    
 
    var newProjectData = {currentATindex: 0,
        currentMTindex: 0,
        ATprogress: 0,
        MTprogress: 0,
        accuracy: 0,
        creator: localStorage.user}
    database.ref("projects/" + projectName).child("info").update(newProjectData);
    var files = new Array()
    var fileInputTagMap = document.getElementById('tagmapfile');
    files.push(fileInputTagMap.files[0]);
    var fileInputAnnotations = document.getElementById('annotationfile');
    files.push(fileInputAnnotations.files[0]);
    dataArray = new Array()
    parseData(files[0], function(tagmap){
        
            console.log(tagmap)
             parseData(files[1], function(data2){
                 console.log(data2)
                 uploadTagMap(projectName, tagmap, function(returnedTagmap){
                     console.log(returnedTagmap)
                     tagnameComments(projectName, returnedTagmap,data2, function(returnedComments){
                         //console.log(returnedComments)
                        uploadComments(projectName, returnedComments, function(doneData){
                            document.location.href = "project.html"
                        })
                     })
                     
                     
                 })
                 
             })
    })
    
    
    /*Papa.parse(document.getElementById('annotationfile').files[0], {
        worker: true,
	step: function(results) {
		console.log("Row:", results.data);
	}
    })*/
    //uploadTagMap(projectName, tagmap, function(returnedTagmap){
    //    console.log(returnedTagmap)
        /*tagnameComments(projectName, returnedTagmap,annotatedComments, function(returnedComments){
            console.log(returnedComments)
            for(var s = 0; s<returnedComments.length; s++)
            {
                console.log(returnedComments[s])
            }
            uploadComments(projectName, returnedComments)
            document.location.href = "project.html"
        })*/
    //})
    database.ref("users/" + localStorage.user + "/projects/").push(projectName)
}

function uploadTagMap(projectName, tagmap, callback){
    var tagmapObject = new Array()
   // var reader = new FileReader();
    //reader.readAsText(tagmap)
   // reader.readAsText(tagmap.slice(0, 10 * 1024 * 1024));
   // reader.onerror = errorHandler
  //  reader.onload = function(event){
   // csv = event.target.result
   // var allTextLines = csv.split(/\r\n|\n/);
    //console.log(allTextLines)
    for (var a = 0; a < tagmap.length; a++){
       // console.log(tagmap[a])
        try{
        for(var b = 0; b < tagmap[a].length; a++){
          //  console.log(tagmap[a][b])
            tagmapObject.push(tagmap[a][b])
        }
        }catch(err){
            
        }
       
    }
   // console.log(tagmapObject)
    for (e in tagmapObject) {
        var f = 1
        var databaseString = []
        while (f < tagmapObject[e].length && tagmapObject[e][f] !== undefined && tagmapObject[e][f] !== "") {
            //console.log(toMap[e][f])
            databaseString.push(tagmapObject[e][f])
            f++
        }
        if (databaseString.length > 0) {
            var newString = databaseString.join("/")
                //console.log(newString);
            database.ref("/projects/" + projectName + '/tagmap/' + newString).set({
                end: "this"
            })
        }
    }
    var myTagsDict = {}
    for (var i = 0; i < tagmapObject.length; i++) {
        var cleanedString = []
        temp = tagmapObject[i].filter(function(e) {
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
    console.log(myTagsDict)
    callback(myTagsDict)
}

function errorHandler(evt) {
    if (evt.target.error.name == "NotReadableError") {
        alert("Cannot read file !");
    }
}

function tagnameComments(projectName, returnedMap,annotatedcomments, callback){
    var annotated = new Array()
    for (var a = 0; a < annotatedcomments.length; a++){
        //console.log(annotatedcomments[a])
        try{
        for(var b = 0; b < annotatedcomments[a].length; a++){
            //console.log(annotatedcomments[a][b])
            annotated.push(annotatedcomments[a][b])
        }
        }catch(err){
            
        }
       
    }
    console.log(annotated)
     cannotated = [];
    cnumber = 0;
    for (var k = 0; k < annotated.length; k++) {
        console.log(annotated[k])
        if (parseInt(annotated[k][0]) > cnumber) {
            cnumber = parseInt(annotated[k][0]);
            ccomment = annotated[k][1]
        } else {
            if (annotated[k][2] == undefined) {
                var linecomment = ccomment;
                var lineannotation = "";
                var coveredtext = "";
               var toannotate = [cnumber, linecomment, coveredtext, lineannotation, ""];
                
                //console.log(toannotate)
                cannotated.push(toannotate);
            }
            else if (returnedMap[annotated[k][2]] === undefined) {
                // console.log("tagname not found for ",annotated[k][2]);
            } else {
                var linecomment = ccomment;
                var lineannotation = annotated[k][2];
                var coveredtext = annotated[k][3];
                var toannotate = [cnumber, linecomment, coveredtext, lineannotation, returnedMap[annotated[k][2]]];
               
                cannotated.push(toannotate);
            }
        }
    
    
       
    }
     callback(cannotated)


}

function uploadComments(projectName, returnedComments, callback){
  for(var y = 0; y<returnedComments.length; y++){
      var comment = returnedComments[y]
        database.ref("projects/" + projectName + "/comments/" + comment[0]).update({fullcomment: comment[1]})
        if(comment[4] != ""){
        database.ref("projects/" + projectName + "/comments/" + comment[0] + "/tags/").child(comment[4]).push({coveredtext: comment[2],taggedas: ""})
        }
      }
  }
 
function listProjects(){
  
  var user = localStorage.user
  //console.log(user)
  database.ref("users/" + user + "/projects/").on('value',function(snapshot){
      snapshot.forEach(function(anotherSnapShot) {
            var projectName = anotherSnapShot.val()
            
            //PLEASEEE fix the formatting on this
            var listNode = document.createElement("li");
            listNode.setAttribute('class', "list-group-item")
            var textnode = document.createTextNode(projectName)
            var onClick1 = "beforeTagging('" + projectName + "')"
            listNode.appendChild(textnode);
            var spanNode = document.createElement("span")
            spanNode.setAttribute('class', "pull-right");
            
            var buttonNode1 = document.createElement("button")
                    buttonNode1.setAttribute('class', "btn btn-info btn-sm")
                    buttonNode1.setAttribute('href', "tagging.html")
                    buttonNode1.setAttribute('onclick', onClick1)
                    
                    buttonNode1.appendChild(document.createTextNode("Tagging"))
                    spanNode.appendChild(buttonNode1)
                    
                    var buttonNode2 = document.createElement("a")
                    buttonNode2.setAttribute('class', "btn btn-primary btn-sm")
                    buttonNode2.setAttribute('href', "results.html")
                    buttonNode2.setAttribute('role', 'button')
                    buttonNode2.appendChild(document.createTextNode("Results"))
                    spanNode.appendChild(buttonNode2)
                    
                    var buttonNode4 = document.createElement("a")
                    buttonNode4.setAttribute('class', "btn btn-success btn-sm")
                    buttonNode4.setAttribute('href', "share.html")
                    buttonNode4.setAttribute('role', 'button')
                    buttonNode4.appendChild(document.createTextNode("Share"))
                    spanNode.appendChild(buttonNode4)
                    
                    var spanButton = document.createElement("button")
                    spanButton.setAttribute("type", "button")
                    spanButton.setAttribute("class", "btn btn-danger btn-sm")
                    var onClick2 = "deleteProject('" + projectName + "')"
                    var buttonNode3 = document.createElement("span")
                    buttonNode3.setAttribute('class', "glyphicon glyphicon-trash")
                    buttonNode3.setAttribute('onclick', onClick2)
                    spanButton.appendChild(buttonNode3)
                    spanNode.appendChild(spanButton)
                    listNode.appendChild(spanNode)
                    listNode.appendChild(document.createElement("span"))
                    
                   
                        document.getElementById('project-list').appendChild(listNode);
      })

  })
}
function beforeTagging(projectName){
    localStorage.projectName = projectName
    document.location.href = "tagging.html"
    tagging(projectName)
}

function tagging(projectName){
    projectName = localStorage.projectName
    console.log(projectName)
    retrieveComments(projectName, function(retrievedComments){
        document.getElementById("auto-start").addEventListener('click',function(){
            document.getElementById("auto-start").setAttribute("style","display:none")
            document.getElementById("auto-tagging").removeAttribute("style","display:none")
            document.getElementById("initial-tag-buttons").style.display = "none";
            autoTag(retrievedComments, projectName)
        })
        document.getElementById("manual-start").addEventListener('click',function(){
            document.getElementById("manual-start").setAttribute("style","display:none")
            document.getElementById("manual-tagging").removeAttribute("style","display:none")
            document.getElementById("initial-tag-buttons").setAttribute("style","display:none")
            manualTag(retrievedComments, localStorage.projectName)
        })
    })
}

function retrieveComments(projectName, callback){
    console.log(projectName)
    var retrievedComments = []
    database.ref("projects/" + projectName +"/").on('value', function(snapshot){
       // console.log(snapshot.val())
        snapshot.forEach(function(snapshot2){
         //   console.log(snapshot2.val())
            if(snapshot2.key == "comments")
            {
                
                snapshot2.forEach(function(snapshot3){
                 //console.log(snapshot3.val())
                 //  console.log(snapshot3.key)
                   var comment = snapshot3.val()
                   
                       
                        if(comment != undefined){
                            comment["key"] = snapshot3.key
                            retrievedComments.push(comment)
                        }
                        //console.log(comments[g])
                    
            })
            }
            
            
        })
        
        callback(retrievedComments)
    })
    
    
}

function displayProgress(projectName){
  
}

function autoTag(comments, projectName){
    var markedComments = markAllTags(comments)
   // document.getElementById("manual-switch").removeAttribute("style","display:none")
   /* document.getElementById("manual-switch").addEventListener('click',function(e){
        document.getElementById("auto-tagging").setAttribute("style","display:none")
        document.getElementById("manual-tagging").removeAttribute("style","display:none")
        manualTag(comments, projectName)
    })*/
    document.getElementById("auto-switch").setAttribute("style","display:none")
    //can change whether turned on or off
    //console.log(markedComments)
    //something's coming back undefined here??
    
    var organizedComments = organizeCommentsByTag(markedComments)
    console.log(organizedComments)
    getIndex("AT",projectName,function(thisIndex){
        console.log(thisIndex)
        //need to do bound checks here. this can also be cleaned up. later.
        document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
        console.log(organizedComments[thisIndex])
        document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
        
        //navigation(organizedComments,thisIndex,projectName)
        document.getElementById("atback").addEventListener('click',function(e){
            thisIndex = thisIndex - 1;
            updateIndex("AT",projectName,thisIndex,function(data2){
                if(thisIndex > 0){
                    document.getElementById("atback").style.visibility = "visible"
                    document.getElementById("color-buttons").style.visibility = "visible"
                     document.getElementById("atforward").style.visibility = "visible"
                    document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                    document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
                }
                else{
                    document.getElementById("atback").style.visibility = "hidden"
                    thisIndex = 0
                    document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                    document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
                }
            })
            
        })
        document.getElementById("atyes").addEventListener('click',function(e){
            
            organizedComments[thisIndex]["taggedas"] = ["AT Correct"]
            updateTaggedAs(organizedComments[thisIndex],projectName,function(data){
                thisIndex = thisIndex + 1;
                updateIndex("AT",projectName,thisIndex,function(data2){
            if(thisIndex < organizedComments.length){
                document.getElementById("atback").style.visibility = "visible"
                document.getElementById("color-buttons").style.visibility = "visible"
                 document.getElementById("atforward").style.visibility = "visible"
                document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
            }
            else{
                document.getElementById("atback").style.visibility = "visible"
                 document.getElementById("color-buttons").style.visibility = "hidden"
                 document.getElementById("atforward").style.visibility = "hidden"
                document.getElementById("comment").innerHTML = "You've reached the end of autotagged comments!"
                document.getElementById("tag-name").innerHTML = ""
            }
                })
            })
        })
        document.getElementById("atno").addEventListener('click',function(e){
            organizedComments[thisIndex]["taggedas"] = ["AT Incorrect"]
            updateTaggedAs(organizedComments[thisIndex],projectName,function(data){
             thisIndex = thisIndex + 1;
                updateIndex("AT",projectName,thisIndex,function(data2){
            if(thisIndex < organizedComments.length){
                document.getElementById("atback").style.visibility = "visible"
                document.getElementById("color-buttons").style.visibility = "visible"
                 document.getElementById("atforward").style.visibility = "visible"
                document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
            }
            else{
                document.getElementById("atback").style.visibility = "visible"
                 document.getElementById("color-buttons").style.visibility = "hidden"
                 document.getElementById("atforward").style.visibility = "hidden"
                document.getElementById("comment").innerHTML = "You've reached the end of autotagged comments!"
                document.getElementById("tag-name").innerHTML = ""
            }
                })
            })
        })
        document.getElementById("atflag").addEventListener('click',function(e){
            organizedComments[thisIndex]["taggedas"] = ["AT Flagged"]
            updateTaggedAs(organizedComments[thisIndex],projectName,function(data){
             thisIndex = thisIndex + 1;
                updateIndex("AT",projectName,thisIndex,function(data2){
            if(thisIndex < organizedComments.length){
                document.getElementById("atback").style.visibility = "visible"
                document.getElementById("color-buttons").style.visibility = "visible"
                 document.getElementById("atforward").style.visibility = "visible"
                document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
            }
            else{
                document.getElementById("atback").style.visibility = "visible"
                 document.getElementById("color-buttons").style.visibility = "hidden"
                 document.getElementById("atforward").style.visibility = "hidden"
                document.getElementById("comment").innerHTML = "You've reached the end of autotagged comments!"
                document.getElementById("tag-name").innerHTML = ""
            }
                })
            })
        })
        document.getElementById("atforward").addEventListener('click',function(e){
            thisIndex = thisIndex + 1;
            updateIndex("AT",projectName,thisIndex,function(data2){
                if(thisIndex < organizedComments.length){
                    document.getElementById("atback").style.visibility = "visible"
                    document.getElementById("color-buttons").style.visibility = "visible"
                     document.getElementById("atforward").style.visibility = "visible"
                    document.getElementById("comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                    document.getElementById("tag-name").innerHTML = "<b>" + organizedComments[thisIndex]["tag"] + "</b>"
                }
                else{
                    document.getElementById("atback").style.visibility = "visible"
                     document.getElementById("color-buttons").style.visibility = "hidden"
                     document.getElementById("atforward").style.visibility = "hidden"
                    document.getElementById("comment").innerHTML = "You've reached the end of autotagged comments!"
                    document.getElementById("tag-name").innerHTML = ""
                }
            })
        })
    })

}



function updateIndex(indexType,projectName,newIndex, callback){
    if(indexType == "AT")
    {
        database.ref("projects/" + projectName + "/info/").update({"currentATindex" : newIndex })
    }
    else{
        database.ref("projects/" + projectName + "/info/").update({"currentMTindex" : newIndex })
    }
   callback()
}

function updateTaggedAs(comment,projectName,callback){
    database.ref("projects/" + projectName + "/comments/" + comment["commentkey"] + "/tags/" + comment["tag"] + "/" + comment["key"] +"/").update({"taggedas" : comment["taggedas"][0] })
    callback()
}

function getIndex(indexType,projectName,callback){
    console.log(projectName)
    database.ref("projects/" + projectName + "/info").on('value',function(snapshot){
        console.log(snapshot.val())
        if(indexType == "AT")
        {
            callback(snapshot.val()["currentATindex"])
        }
        else{
            callback(snapshot.val()["currentMTindex"])
        }
    })
}

function organizeCommentsByTag(comments){
    var organizedStep1 = new Array();
    for(var a = 0; a < comments.length; a++)
    {
        var tags = comments[a]["tags"]
        if(tags != undefined){
            
            for(var tag in tags){
               
                for(var item in tags[tag])
                {
                   if(tags[tag][item]["taggedas"] != "MT Created"){
                       var newObject = {}
                       newObject["fullcomment"] = comments[a]["fullcomment"]
                       
                       var markString = comments[a]["marked-comment"]
                       console.log(markString)
                       var newString = "<b><em>" + tags[tag][item]["coveredtext"] + "</em></b>"
                       console.log(newString)
                       markString = markString.replace(tags[tag][item]["coveredtext"], newString)
                       newObject["marked-comment"] = markString
                       console.log(markString)
                       newObject["tag"] = tag
                       newObject["coveredtext"] = tags[tag][item]["coveredtext"]
                       newObject["taggedas"] = tags[tag][item]["taggedas"]
                       newObject["commentkey"] = comments[a]["key"]
                       newObject["key"] = item
                       organizedStep1.push(newObject)
                       console.log(newObject)
                   }
                }
                

            }
        }
           
    }
    var organizedComments = organizedStep1.sort(Comparator)
    return organizedComments
}

function Comparator(a, b) {
    return a["tag"].localeCompare(b["tag"])
}

function Comparator2(a, b) {
    return a["commentkey"].localeCompare(b["commentkey"])
}

function markAllTags(comments){
    console.log(comments)
    var newComments = new Array()
    for(var a = 0; a < comments.length; a++)
    {
        var tags = comments[a]["tags"]
        //console.log(comments[a])
        if(tags != undefined){
            var commentText = comments[a]["fullcomment"]
            var commentInnerHTML = commentText;
            var i = 1
            for(var tag in tags){
               // console.log(commentInnerHTML)
               // console.log(tag)
               // console.log(tags[tag])
               
                for(var item in tags[tag])
                {
                    //console.log(commentInnerHTML)
                    var tagObject = tags[tag][item]
                    var coveredText = tagObject["coveredtext"]
                    var taggedAs = tagObject["taggedas"]
                    var color = findColor(taggedAs)
                    var markedString = '<span id="marked' + i + '" style="line-height:150%;background-color:' + color + '" title="' + tag + '">' + coveredText + "</span>"
                    commentInnerHTML = commentInnerHTML.replace(coveredText, markedString)
                  // console.log(commentInnerHTML)
                  i++
                }
                

            }
            comments[a]["marked-comment"] = commentInnerHTML
        }
            //console.log(commentInnerHTML)
            
            newComments.push(comments[a])
    }
    return newComments
}

function findColor(code){
    if (code === "AT Correct") {
        return "rgba(102,255,153,.5)"
    } else if (code === "AT Incorrect") {
        return "rgba(255,153,51,.5)"
    } else if (code === "AT Flagged") {
        return "rgba(255,80,80,.5)"
    }
    else if (code == ""){
        return "rgba(246,206,60,.5)"
    }
    else if (code == "MT Created"){
        return "rgba(118,209,255,.5)"
    }
    
}

function organizeCommentsByNumber(comments){
    var organizedStep1 = new Array();
    for(var a = 0; a < comments.length; a++)
    {
        //console.log(comments[a])
        var commentNumber = comments[a]["key"]
        
        var tags = comments[a]["tags"]
        if(tags != undefined){
            
            for(var tag in tags){
               // console.log(tag)
                for(var item in tags[tag])
                {
                   if(tags[tag][item]["taggedas"] == "MT Created" || tags[tag][item]["taggedas"] == "AT Incorrect" || tags[tag][item]["taggedas"] == "AT Flagged")
                   {
                       var newObject = {}
                       newObject["fullcomment"] = comments[a]["fullcomment"]
                       var markString = comments[a]["marked-comment"]
                      // console.log(markString)
                       var newString = "<b><em>" + tags[tag][item]["coveredtext"] + "</em></b>"
                      // console.log(newString)
                       markString = markString.replace(tags[tag][item]["coveredtext"], newString)
                       newObject["marked-comment"] = markString
                      // console.log(markString)
                       newObject["tag"] = tag
                       newObject["coveredtext"] = tags[tag][item]["coveredtext"]
                       newObject["taggedas"] = tags[tag][item]["taggedas"]
                       newObject["commentkey"] = comments[a]["key"]
                       newObject["key"] = item
                       organizedStep1.push(newObject)
                   }
                   
                }
                

            }
        }
        else{
            comments[a]["commentkey"] = comments[a]["key"]
             comments[a]["marked-comment"] = comments[a]["fullcomment"]
            organizedStep1.push(comments[a])
            
        }
           
    }
    var organizedComments = organizedStep1.sort(Comparator2)
    return organizedComments
}

function manualTag(comments,projectName){
    //document.getElementById("manual-switch").setAttribute("style","display:none")
   /* document.getElementById("auto-switch").removeAttribute("style","display:none")
    document.getElementById("auto-switch").addEventListener('click',function(e){
        document.getElementById("auto-tagging").removeAttribute("style","display:none")
        document.getElementById("manual-tagging").setAttribute("style","display:none")
        autoTag(comments, projectName)
    })*/
    var markedComments = markAllTags(comments)

    var organizedComments = organizeCommentsByNumber(markedComments)
    console.log(organizedComments)
    
    
        getIndex("MT",projectName,function(thisIndex){
                localStorage.coveredText = ""
                var selectedTags = new Array()
                database.ref('/projects/' + localStorage.projectName + '/comments/' + comment["commentkey"] + "/tags/").on('value', function(snapshot){
            //console.log(snapshot.val())
                    snapshot.forEach(function(snapshot2){
                //console.log(snapshot2.key)
                        snapshot2.forEach(function(snapshot3){
                    if(snapshot3.val()["taggedas"] == "MT Created")
                    {
                        if($.inArray(snapshot2.key,selectedTags) != -1)
                        {
                            selectedTags.push(snapshot2.key)
                        }
                    }
                        })
                        })
                    localStorage.currentMTtags = JSON.stringify(selectedTags)
                    getTagMenu(localStorage.projectName, function(tagMenu){
                    $('#mobileMenu').mobileMenu({
                            section: {
                                title: 'options',
                                items: tagMenu
                        }
                          
                    })
                //var commentInnerHTML = comment["fullcomment"].replace(selectedText, markedString)
                //console.log(commentInnerHTML)
                //comment["marked-comment"] = commentInnerHTML
                localStorage.currentMTcomment = JSON.stringify(comment)
                document.getElementById("manual-comment").innerHTML = comment["fullcomment"]
               
            
        
                $('#mobileMenu').mobileMenu({
                        section: {
                            title: 'options',
                            items: tagMenu
                    }
                })
                
                 if(thisIndex >= organizedComments.length){
                    document.getElementById("mtback").style.visibility = "visible"
                     document.getElementById("mtforward").style.visibility = "hidden"
                    document.getElementById("manual-comment").innerHTML = "You've reached the end of manual comments!"
               
                }
                else if (thisIndex <= 0){
                    document.getElementById("mtback").style.visibility = "hidden"
                    thisIndex = 0
                  
                    document.getElementById("manual-comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                }
                else{
                    document.getElementById("mtback").style.visibility = "visible"
                     document.getElementById("mtforward").style.visibility = "visible"
                   
                    document.getElementById("manual-comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                }
                    
                
                localStorage.currentMTcomment = JSON.stringify(organizedComments[thisIndex])
                document.getElementById("mtback").addEventListener('click',function(e){
            thisIndex = thisIndex - 1;
            updateIndex("MT",projectName,thisIndex,function(data2){
                if(thisIndex > 0){
                    document.getElementById("mtback").style.visibility = "visible"
                     document.getElementById("mtforward").style.visibility = "visible"
                   
                    document.getElementById("manual-comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
               
                }
                else{
                    document.getElementById("mtback").style.visibility = "hidden"
                    thisIndex = 0
                  
                    document.getElementById("manual-comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
                }
            })
            
        })
        
        document.getElementById("mtforward").addEventListener('click',function(e){
            thisIndex = thisIndex + 1;
            updateIndex("MT",projectName,thisIndex,function(data2){
                if(thisIndex < organizedComments.length){
                    document.getElementById("mtback").style.visibility = "visible"
                     document.getElementById("mtforward").style.visibility = "visible"
                    
                    document.getElementById("manual-comment").innerHTML = organizedComments[thisIndex]["marked-comment"]
               
                }
                else{
                    document.getElementById("mtback").style.visibility = "visible"
                     document.getElementById("mtforward").style.visibility = "hidden"
                    document.getElementById("manual-comment").innerHTML = "You've reached the end of manual comments!"
                }
            })
        })
                    })
                })
                
            
        })
  
}

function getTagMenu(projectName,callback){
    tagOptions = new Array();
    toMT = {}
    database.ref('/projects/' + projectName + '/tagmap').on('value', function(lvl1) {
        toMT = lvl1.exportVal()
        tagOptions = buildObjects(toMT,"")
        callback(tagOptions)
    })
}

function buildObjects(obj1, theURL) {
    var tempArray = new Array()
        //console.log(obj1)
    var previousURL = theURL
    if (previousURL === undefined) {
        previousURL = ''
    }
    //console.log(previousURL)
    for (obj2 in obj1) {
        if (obj2 != 'url') {
            //console.log("obj 2 ",obj2)
            var newSection = new Object()
            newSection["name"] = obj2
            var myURL = previousURL + obj2 + " - "
            newSection["url"] = myURL
                //console.log(newSection["url"])
            if (obj1[obj2].hasOwnProperty("end")) {
                
                newSection["url"] = newSection["url"].slice(0,newSection["url"].length - 3);
                
            } else {
                var tempSection = new Object()
                tempSection["title"] = obj2
                var myArray = new Array()
                var myObject = obj1[obj2]
                var ThisArray = new Array()
                ThisArray = buildObjects(myObject, myURL)
                tempSection["items"] = ThisArray
                newSection["section"] = tempSection
            }
            tempArray.push(newSection)
        }
    }
    return tempArray
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
        console.log(localStorage.projectName)
        
        localStorage.coveredText = selectedText;
        console.log("Highlighted Text to Tag: ", localStorage.coveredText)
        var comment = JSON.parse(localStorage.currentMTcomment)
        comment["coveredtext"] = selectedText
        localStorage.currentMTcomment = JSON.stringify(comment)
        console.log(comment)
        var markedString = '<span style="background-color:rgba(118,209,255,.5)">' + selectedText + '</span>'
        var selectedTags = new Array()
        database.ref('/projects/' + localStorage.projectName + '/comments/' + comment["commentkey"] + "/tags/").on('value', function(snapshot){
            //console.log(snapshot.val())
            snapshot.forEach(function(snapshot2){
                //console.log(snapshot2.key)
                snapshot2.forEach(function(snapshot3){
                    if(snapshot3.val()["taggedas"] == "MT Created")
                    {
                        if($.inArray(snapshot2.key,selectedTags) != -1)
                        {
                            selectedTags.push(snapshot2.key)
                        }
                    }
                })
            })
            localStorage.currentMTtags = JSON.stringify(selectedTags)
            getTagMenu(localStorage.projectName, function(tagMenu){
                $('#mobileMenu').mobileMenu({
                        section: {
                            title: 'options',
                            items: tagMenu
                    }
                      
                })
                var commentInnerHTML = comment["fullcomment"].replace(selectedText, markedString)
                console.log(commentInnerHTML)
                comment["marked-comment"] = commentInnerHTML
                localStorage.currentMTcomment = JSON.stringify(comment)
                document.getElementById("manual-comment").innerHTML = commentInnerHTML
               
            })
        })
        
    }
}

function listResults(projectName){
  
}