userObject = null;
tokensObject = null;
pendingRequest = null;


window.onload = function() {
    replyMessage("Welcome to Ping Identity. How can we help today?");
}

function nowTime() {
    var ts = new Date();

    return `${ts.getHours()}:${String(ts.getMinutes()).padStart(2,'0')}, Today`;
}

function profileImage() {
    if ((userObject) && (userObject.profileImage)) return userObject.profileImage;
    else return "https://cdn-icons-png.freepik.com/256/3177/3177440.png";
}

function sendMessage(message) {
    var chatHistory = document.getElementById('chatHistory');
    
    chatHistory.innerHTML += `<div class="d-flex justify-content-start mb-4">
                <div class="img_cont_msg">
                    <img src="${profileImage()}" class="rounded-circle user_img_msg">
                </div>
                <div class="msg_container">
                    ${message}
                    <span class="msg_time">${nowTime()}</span>
                </div>
            </div>`;
    
    setTimeout(function() {chatHistory.scrollTop = chatHistory.scrollHeight;}, 100);
}


function replyMessage(message) {
    var chatHistory = document.getElementById('chatHistory');
    
    chatHistory.innerHTML += `<div class="d-flex justify-content-end mb-4">
                <div class="msg_container_send">
                    ${message}
                    <span class="msg_time">${nowTime()}</span>
                </div>
                <div class="img_cont_msg">
                     <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg" class="rounded-circle user_img_msg">
                </div>
            </div>`;;
    
    setTimeout(function() {chatHistory.scrollTop = chatHistory.scrollHeight;}, 100);
}


function replyWidget() {
    var chatHistory = document.getElementById('chatHistory');
    
    chatHistory.innerHTML += `<div class="login-widget" id="inline-widget-root"></div>`;
    
    setTimeout(function() {chatHistory.scrollTop = chatHistory.scrollHeight;}, 100);
}


function replyButtons(buttons) {
    var chatHistory = document.getElementById('chatHistory');
    
    var buttonsHTML = "";
    for (let i = 0; i < buttons.length; i++) {
        buttonsHTML += `<button class="btn btn-primary chat-button" id="choice-${i}">${buttons[i]}</button>`;
    };

    console.log(buttonsHTML);

    chatHistory.innerHTML += `<div class="d-flex justify-content-end mb-4">
                <div class="msg_container_send">
                    ${buttonsHTML}
                    <span class="msg_time">${nowTime()}</span>
                </div>
                <div class="img_cont_msg">
                     <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg" class="rounded-circle user_img_msg">
                </div>
            </div>`;;
    
    setTimeout(function() {chatHistory.scrollTop = chatHistory.scrollHeight;}, 100);
}



function onChatInput(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        
        var chatInput = document.getElementById('chatInput').value;
        document.getElementById('chatInput').value = "";
        sendMessage(chatInput);
        setTimeout(() => {
            processMessage(chatInput);
        }, 1500);

        return false;
    } else return true;
}


function loginSuccess(event) {
    console.log("LOGGED IN");
    console.log(JSON.stringify(event));
    document.getElementById('inline-widget-root').remove();
    replyMessage(`Welcome back <strong>${userObject.givenName}.</strong>`);
    document.getElementById('persona').innerHTML = `Persona: <strong>${userObject.givenName} ${userObject.sn}</strong>`;
    if (pendingRequest) {
        var request = pendingRequest;
        pendingRequest = null;
        setTimeout(() => processMessage(request), 1500);
    }
}


function loginFailed(event) {
    console.log("LOGIN ERROR");
    console.log(JSON.stringify(event));
    document.getElementById('inline-widget-root').remove();
    replyMessage(`Sorry, we weren't able to login you in.`);
    if (pendingRequest) {
        var request = pendingRequest;
        pendingRequest = null;
    }
}



function tokenSuccess(event) {
    console.log("TOKEN IN");

    if (event.response.accessToken) {
        tokensObject = event.response;
        var parts = event.response.idToken.split('.');
        var id_token = JSON.parse(atob(parts[1]));

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET",CONFIG.tenant + "/openidm/managed/alpha_user/" + id_token.sub, false);
        xmlhttp.setRequestHeader("Content-type","application/json");
        xmlhttp.setRequestHeader("Authorization","Bearer " + event.response.accessToken);
        xmlhttp.send(null);
        console.log(xmlhttp.responseText);
        userObject = JSON.parse(xmlhttp.responseText);
    }
}


function updateUser(patch) {
    if (tokensObject) {
        var parts = tokensObject.idToken.split('.');
        var id_token = JSON.parse(atob(parts[1]));
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("PATCH",CONFIG.tenant + "/openidm/managed/alpha_user/" + id_token.sub, false);
        xmlhttp.setRequestHeader("Content-type","application/json");
        xmlhttp.setRequestHeader("Authorization","Bearer " + tokensObject.accessToken);
        xmlhttp.send(JSON.stringify(patch));
        console.log(xmlhttp.responseText);
        userObject = JSON.parse(xmlhttp.responseText);
    }
}


function userLogin() {
    replyMessage("Sure, we just need you to login first.<br>Please enter your details below to sign in.");
    replyWidget();
    window.sdkInit();
    setTimeout(function () { window.inlineLogin(loginSuccess, tokenSuccess, loginFailed); }, 500);
}


function userLogout() {
    if (userObject) {
        console.log("LOGGED OUT");
        replyMessage(`Bye <strong>${userObject.givenName}</strong>, and thanks for visiting.`);
        document.getElementById('persona').innerHTML = `Persona: unknown`;
        window.logout();
        userObject = null;
        tokensObject = null;
    } else replyMessage(`You're already logged out!`);
}



function responseMsg(msg) {
        return translation["responses"][msg];
    }


function anyOfTriggers(query, action) {
    query = query.toLowerCase();
    for (var i=0; i < actions["triggers"][action].length; i++)
        if (query.includes(actions["triggers"][action][i])) return true;
    return false;
}


function allOfTriggers(query, action) {
    query = query.toLowerCase();
    result = true;
    for (var i=0; i < actions["triggers"][action].length; i++)
        if (!query.includes(actions["triggers"][action][i])) result = false;
    return result;
}


function processMessage(message) {
    if (anyOfTriggers(message, 'help')) {
        replyMessage(actions["responses"]['help']);
    } else if (anyOfTriggers(message, 'bookings')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            if (userObject.frUnindexedMultivalued1.length == 0) replyMessage("It looks like you have no bookings with us so far.");
            else {
                var bookings = "Booking references:<br><hr>";
                replyMessage(actions["responses"]['bookings']);
                userObject.frUnindexedMultivalued1.forEach((booking) => {
                    bookings += `<strong>${booking}<br></strong>`;
                });                    
                //bookings += '<strong>321234</strong> - Carribean Cruise - 14th July 2024<br>';
                //bookings += '<strong>937458</strong> - New Zealand - 28th Nov 2024<br>';
                replyMessage(bookings);

            }
        }
    } else if (anyOfTriggers(message, 'login')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            replyMessage(actions["responses"]["hello"].replace("{NAME}",userObject.givenName));
        }
    } else if (anyOfTriggers(message, 'payment')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            var paymentList = userObject["frUnindexedMultivalued1"];
            if (paymentList.length == 0) replyMessage(actions["responses"]["paymentNone"]);
            else {
                var payment = paymentList[paymentList.length-1];
                var paymentJwt = JWTclaims(payment);
                var paymentDetails = JSON.parse(paymentJwt.challenge);
                var msg = actions["responses"]["payment"] + '<br><hr>';
                msg += `<h4 style="color:white;">${paymentDetails.description}</h4>`;
                msg += '<div class="row">';
                msg += '<div class="col-sm text-end"><p style="font-size:12pt;">Date:<br>Amount:<br><span style="font-size:10pt;">Transaction ID:</span><p></div>';
                msg += `<div class="col-sm text-start"><p style="font-size:12pt; color:white;">${paymentDetails.date}<br>£${paymentDetails.amount}<br><span style="font-size:10pt;">${paymentJwt.signedDate}</span><br></p></div>`;
                msg += '</div>';
                /*              
                msg += `<h4 style="color:white;">Samsung QLED 48" TV</h4>`;
                msg += '<div class="row">';
                msg += '<div class="col-sm text-end"><p style="font-size:12pt;">Date:<br>Vendor:<br>Amount:<p></div>';
                msg += `<div class="col-sm text-start"><p style="font-size:12pt; color:white;">Tue, 12th Feb, 15:08<br>Amazon UK<br>£399.99<br></p></div>`;
                msg += '</div>';
                */
                replyMessage(msg);              
            }
        }
    } else if (anyOfTriggers(message, 'lost')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            var patch = [ { "operation": "replace", "field": "/preferences/push", "value": false },
                          { "operation": "replace", "field": "/preferences/sms", "value": false } ];
            updateUser(patch);
            replyMessage(actions["responses"]["lost"].replace("{EMOJI}",String.fromCodePoint(0x1F9D0)));
        }
    } else if (anyOfTriggers(message, 'hello')) {
        if (userObject) replyMessage(actions["responses"]["hello"].replace("{NAME}",userObject.givenName));
        else replyMessage(actions["responses"]["helloanon"]);
    }  else if (anyOfTriggers(message, 'personal')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            var updates = "&#x2713;"
            if ((userObject.preferences) && (!userObject.preferences.marketing)) updates = "&#x2717;";
            var msg = actions["responses"]["personal"] + '<br><hr>';
            msg += `<img width='80px' style='border-radius:50%; border:1px solid grey;' src="${profileImage()}"/>`;
            msg += `<h4 style="color:white;">${userObject.givenName} ${userObject.sn}</h4>`;
            msg += '<div class="row">';
            msg += '<div class="col-sm text-end"><p style="font-size:12pt;">Email Address:<br>Date of Birth:<br>Phone Number:<br>Address:<br>City:<br>Special Offers:<p></div>';
            msg += `<div class="col-sm text-start"><p style="font-size:12pt; color:white;">${userObject.mail}<br>${userObject.frUnindexedString1}<br>${userObject.telephoneNumber}<br>${userObject.postalAddress}<br>${userObject.city}<br>${updates}</p></div>`;
            msg += '</div>';
            replyMessage(msg);          
        }
    } else if (anyOfTriggers(message, 'reset')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            fetch(`${CONFIG.tenant}/am/json/realms/root/realms/alpha/authenticate?authIndexType=service&authIndexValue=DemoUtil%20-%20Password%20Change%20with%20Query%20Param&mail=${userObject.mail}`, { method: "POST", mode: "cors" });
            replyMessage(actions["responses"]['reset']);
        }    
    } else if (anyOfTriggers(message, 'password')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            var d = new Date(userObject.passwordLastChangedTime);
            replyMessage(actions["responses"]['password'].replace("{PASSWORD}", d.toLocaleString()));
        }      
    } else if (anyOfTriggers(message, 'offers')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            var patch = [ { "operation": "replace", "field": "/preferences/marketing", "value": false } ];
            updateUser(patch);
            replyMessage(actions["responses"]["offers"].replace("{EMOJI}",String.fromCodePoint(0x1F9D0)));
        }
    } else if (anyOfTriggers(message, 'bye')) {
        userLogout();
    } else if (anyOfTriggers(message, 'thanks')) {
        replyMessage(actions["responses"]["thanks"]);
    } else if (anyOfTriggers(message, 'cancel')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            replyMessage("No problem. Please check your phone to confirm the cancellation ...");
            var booking = message.split(" ").pop();
            startCIBA(`Cancel booking ${booking}?`, userObject.userName);
        }        
    } else if (anyOfTriggers(message, 'unlock')) {
        if (!userObject) {
            pendingRequest = message;
            userLogin();
        } else {
            replyMessage("No problem. Please check your phone to confirm the unlock ...");
            var booking = message.split(" ").pop();
            startCIBA(`Unlock credit card?`, userObject.userName);
        }        
    } else {
        replyMessage(actions["responses"]["unknown"].replace("{EMOJI}",String.fromCodePoint(0x1F914)));
    }
}



// CIBA Helper functions

function arrayBufferToBase64(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = '';
  byteArray.forEach((byte) => {
    byteString += String.fromCharCode(byte);
  });
  return btoa(byteString);
}

function base64ToUint8Array(base64Contents) {
  base64Contents = base64Contents.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  const content = atob(base64Contents);
  return new Uint8Array(content.split('').map((c) => c.charCodeAt(0)));
}

function stringToUint8Array(contents) {
  const encoded = btoa(unescape(encodeURIComponent(contents)));
  return base64ToUint8Array(encoded);
}

function uint8ArrayToString(unsignedArray) {
  const base64string = btoa(String.fromCharCode(...unsignedArray));
  return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}


function initCIBA(requestJWT) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST",CONFIG.tenant + "/am/oauth2/realms/root/realms/alpha/bc-authorize", false);
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Authorization","Basic " + btoa(CONFIG.ciba_client.id + ":" + CONFIG.ciba_client.secret)); 
    xmlhttp.send("request=" + requestJWT);
    var json = JSON.parse(xmlhttp.responseText);
    console.log(json);
    if (json.hasOwnProperty("auth_req_id")) setTimeout(function() { pollCIBA(json.auth_req_id)}, 4000);
}


function signJWT(jwk, header, payload) {

    const stringifiedHeader = JSON.stringify(header);
    const stringifiedPayload = JSON.stringify(payload);

    const headerBase64 = uint8ArrayToString(stringToUint8Array(stringifiedHeader));
    const payloadBase64 = uint8ArrayToString(stringToUint8Array(stringifiedPayload));
    const headerAndPayload = `${headerBase64}.${payloadBase64}`;

    const messageAsUint8Array = stringToUint8Array(headerAndPayload);

    window.crypto.subtle.importKey(
        "jwk", jwk, 
        {   
            name: "RSASSA-PKCS1-v1_5",
            hash: {name: "SHA-256"}
        },
        false, 
        ["sign"] 
    ).then(function(privateKey){
        window.crypto.subtle.sign(
            {
                name: "RSASSA-PKCS1-v1_5",
            },
            privateKey, 
            messageAsUint8Array
        )
        .then(function(signature){        
            const base64Signature = uint8ArrayToString(new Uint8Array(signature));
            console.log(`Signed JWT: ${headerAndPayload}.${base64Signature}`);
            initCIBA(`${headerAndPayload}.${base64Signature}`);
        })
        .catch(function(err){
            console.error(err);
        });
    })
    .catch(function(err){
        console.error(err);
    });
}


function startCIBA(value, user) {
    // Set headers for JWT
    var header = {
        'typ': 'JWT',
        'alg': 'RS256'
    };

    // Prepare timestamp in seconds
    var currentTimestamp = Math.floor(Date.now() / 1000)

    var payload = {
        'iss': CONFIG.ciba_client.id,
        'iat': currentTimestamp,
        'exp': currentTimestamp + 300, 
        'jti': 'jwt_nonce',
        'login_hint': '',
        'scope': 'openid profile fr:idm:*',
        'acr_values': CONFIG.ciba_acr,
        'aud': CONFIG.tenant + ':443/am/oauth2/realms/root/realms/alpha',
        'binding_message': CONFIG.ciba_mesg
    }

    payload.binding_message = value;
    payload.login_hint = user;
    console.log("CIBA REQUEST " + JSON.stringify(payload));
    signJWT(CONFIG.jwk, header, payload);
}


function pollCIBA(auth_req_id) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST",CONFIG.tenant + "/am/oauth2/realms/root/realms/alpha/access_token", false);
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Authorization","Basic " + btoa(CONFIG.ciba_client.id + ":" + CONFIG.ciba_client.secret)); 
    xmlhttp.send(`auth_req_id=${auth_req_id}&grant_type=urn:openid:params:grant-type:ciba`);
    var json = JSON.parse(xmlhttp.responseText);
    console.log(json);
    if (json.hasOwnProperty("access_token")) {
        console.log(JSON.stringify(json));
        replyMessage("Thank you - that's now confirmed.")
    }
    else if (json.hasOwnProperty("error")) {
        if (json.error == "unknown_auth_req_id") replyMessage("Sorry, request expired.");
        else if (json.error == "access_denied") replyMessage("Sorry, that request was rejected.");
        else if (json.error == "authorization_pending") {
            replyMessage("Waiting for you to approve ...");
            setTimeout(function() { pollCIBA(auth_req_id)}, 4000);
        }
    }
}


function JWTclaims(jwt) {
    var parts = jwt.split(".");
    return JSON.parse(atob(parts[1]));
}

