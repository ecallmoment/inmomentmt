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
            //document.getElementById("show-if-logged").style.display = "inline";
            //document.getElementById("not-logged-in").style.display = "none";
        } else {
            // User is signed out.
            window.loggedin = false;
            document.getElementById("sign-in-status").innerHTML = "Not Signed In";
            document.getElementById("sign-in").innerHTML = "Sign In";
            //document.getElementById("show-if-logged").style.display = "none";
           // document.getElementById("not-logged-in").style.display = "inline";
        }
    }, function(error) {
        // console.log(error);
    });
    /*if (pageName == "tagging") {
        startTagging()
    } else if (pageName == "results") {
        displayResults()
    } else */
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

    var fileInputTagMap = document.getElementById('tagmapfile');
    var tagmap = fileInputTagMap.files[0];
    var fileInputAnnotations = document.getElementById('annotationfile');
    var annotatedComments = fileInputAnnotations.files[0];
    uploadTagMap(projectName, tagmap, function(returnedTagmap){
        //console.log(returnedTagmap)
        tagnameComments(projectName, returnedTagmap,annotatedComments, function(returnedComments){
            console.log(returnedComments)
            for(var s = 0; s<returnedComments.length; s++)
            {
                console.log(returnedComments[s])
            }
            uploadComments(projectName, returnedComments)
            document.location.href = "project.html"
        })
    })
    database.ref("users/" + localStorage.user + "/projects/").push(projectName)
}

function uploadTagMap(projectName, tagmap, callback){
    var tagmapObject = new Array()
    var reader = new FileReader();
    reader.readAsText(tagmap)
    reader.onerror = errorHandler
    reader.onload = function(){
    csv = event.target.result
    var allTextLines = csv.split(/\r\n|\n/);
    //console.log(allTextLines)
    for (var a = 0; a < allTextLines.length; a++){
        var tagLine = allTextLines[a].split(",")
        tagmapObject.push(tagLine)
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
  };
  
  
}

function errorHandler(evt) {
    if (evt.target.error.name == "NotReadableError") {
        alert("Cannot read file !");
    }
}

function tagnameComments(projectName, returnedMap,annotatedcomments, callback){
    var annotated = new Array()
    var reader = new FileReader();
    reader.readAsText(annotatedcomments)
    reader.onerror = errorHandler
    reader.onload = function(){
    csv = event.target.result
    var allTextLines = csv.split(/\r\n|\n/);
    //console.log(allTextLines)
    for (var a = 0; a < allTextLines.length; a++){
        var textLine = allTextLines[a].split(",")
        annotated.push(textLine)
    }
    //console.log(returnedMap)
     cannotated = [];
    cnumber = 0;
    for (var k = 0; k < annotated.length; k++) {
        //console.log(annotated[k][0])
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
            } else if (returnedMap[annotated[k][2]] === undefined) {
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
}

function uploadComments(projectName, returnedComments){
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
            var onClick1 = "tagging('" + projectName + "')"
            listNode.appendChild(textnode);
            var spanNode = document.createElement("span")
            spanNode.setAttribute('class', "pull-right");
            
            var buttonNode1 = document.createElement("button")
                    buttonNode1.setAttribute('class', "btn btn-info btn-sm")
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

function tagging(projectName){
    document.location.href = "tagging.html"
    retrieveComments(projectName, function(retrievedComments){
        //displayProgress(projectName)
        console.log(retrievedComments)
        autoTag(retrievedComments)
       // manualTag(retrievedComments)
    })
}

function retrieveComments(projectName, callback){
    console.log(projectName)
    var retrievedComments = []
    database.ref("projects/" + projectName +"/").on('value', function(snapshot){
       // console.log(snapshot.val())
        var comments = snapshot.val()["comments"]
        for(var g = 0; g < comments.length; g++)
        {
            if(comments[g] != undefined){
                retrievedComments.push(comments[g])
            }
            console.log(comments[g])
        }
        callback(retrievedComments)
    })
    
    
}

function displayProgress(projectName){
  
}

function autoTag(comments){
    console.log(comments)
    for(var a = 0; a < comments.length; a++)
    {
        var tags = comments[a]["tags"]
        console.log(comments[a])
        if(tags != undefined){
            var commentText = comments[a]["fullcomment"]
            var commentInnerHTML;
            for(var tag in tags){
                console.log(tag)
                console.log(tags[tag])
                for(var item in tags[tag])
                {
                    var tagObject = tags[tag][item]
                    var coveredText = tagObject["coveredtext"]
                    var taggedAs = tagObject["taggedas"]
                    var color = findColor(taggedAs)
                    var markedString = '<mark background-color=' + color + '>' + coveredText + "</mark>"
                    commentInnerHTML = commentText.replace(coveredText, markedString)
                   
                }
                console.log

                }
                //document.getElementById("tag-name").innerHTML = tag
                
                
                
            }
            console.log(commentInnerHTML)
        }
    }


function findColor(code){
    if (code === "AT Correct") {
        return "#66ff99"
    } else if (code === "AT Incorrect") {
        return "#ff9933"
    } else if (code === "AT Flagged") {
        return "#ff5050"
    }
    else if (code == ""){
        return "#f6ce3c"
    }
}

function manualTag(comments){
  
}

function listResults(projectName){
  
}