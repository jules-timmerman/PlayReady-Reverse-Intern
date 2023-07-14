function log(message){
    var logger = document.getElementById("log");
    logger.innerHTML += message;
    logger.innerHTML += "<br>"; 
}


var LA_URL = "https://test.playready.microsoft.com/service/rightsmanager.asmx"
var results = {};

var currentIndices = [];
var potentialParams = ["begindate", "enddate", "firstexp", "persistant", "sl"];
var potentialValues;
var potentialValuesRandom = [["", randomDate1, randomDateHour1], ["", randomDate2, randomDateHour2], ["", randomSecond], ["false", "true"], [150, 2000]];
var potentialValuesHardcoded = [["", "20230102", "20230102030405"], ["", "20240607", "20240607080910"], ["", "42"], ["false", "true"], [150, 2000]];
var bases = potentialValues.map(val => val.length);

var nbIteration = 3;


// Inspired by : https://medium.com/@RossetPaul/encrypted-media-extension-eme-api-watching-protected-video-content-on-the-web-1ac7b175c92d
function getLicense(params){
    var configuration = { 
        "persistentState":  "optional",
        "sessionTypes":  ["temporary"],
        "initDataTypes":  ["cenc"],
        "distinctiveIdentifier":  "optional",
        "audioCapabilities":  [{"contentType":  "audio/mp4; codecs=\"mp4a.40.2\""}],
        "videoCapabilities":  [
                {"contentType":  "video/mp4; codecs=\"avc1.640033\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640033\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640033\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640033\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640032\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640032\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640032\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640028\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640028\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.64001F\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.64001E\""}, 
                {"contentType":  "video/mp4; codecs=\"avc1.640015\""}], 
        "initDataTypes":  ["cenc"],
        "distinctiveIdentifier":  "optional",
        "persistentState":  "optional",
        "sessionTypes":  ["temporary"]};

        
    navigator.requestMediaKeySystemAccess("com.microsoft.playready.recommendation", [configuration]).then(mediaKeySystem =>{

        mediaKeySystem.createMediaKeys().then(mediaKeys => {
            
            var session = mediaKeys.createSession("temporary");

            function receivedLicense(licenseResponse){
                var parser = new DOMParser();
                var licenseResponseStr = (new TextDecoder("utf-8")).decode(licenseResponse);
                var xmlResponse = parser.parseFromString(licenseResponseStr, "text/xml");
                var licenseB64 = xmlResponse.getElementsByTagName("License")[0].innerHTML;
                
                var license = atob(licenseB64);
                var hexLicense = license.split('').map(val => val.charCodeAt(0).toString(16).padStart(2, '0')).toString().replaceAll(',', '');
                if (results[params] == undefined){
                    results[params] = [];
                } 
                results[params] = results[params].concat(hexLicense);    // On le stock comme une liste

                session.update(licenseResponse);
            
                // We increment and start the next license
                // We prefer not to flood the server too much by starting all license acquisition at the same time
                currentIndices = next(currentIndices, bases);
                if(isZero(currentIndices)){
                    nbIteration--;
                    log("Finished an iteration, " + nbIteration + " left.");
                }
                if(nbIteration > 0){
                    getLicense(toParams(paramsFromIndices(currentIndices)));
                }else{
                    lastLicense();
                }
            }


            session.addEventListener('message', event => {
                const challenge = event.message;
                const xhr = new XMLHttpRequest();
                xhr.open("POST", LA_URL+"?cfg=("+params+")", true);
                xhr.onload = evt => {
                    var target = evt.target;
                    // Success status
                    if (target.status >= 200 && target.status < 300){
                        const license = target.response;
                        receivedLicense(license);
                    }else{
                        log("Error : " + target.status + " " + target.statusText + "\n" + target.response);
                    }
                };
                xhr.responseType = "arraybuffer";

                xhr.setRequestHeader("SOAPAction", "\"http://schemas.microsoft.com/DRM/2007/03/protocols/AcquireLicense\"");
                xhr.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");

                var parser = new DOMParser();
                var challengeStr = (new TextDecoder("utf-16")).decode(challenge);
                var xmlDoc = parser.parseFromString(challengeStr, "text/xml");
                var base64Challenge = xmlDoc.getElementsByTagName("Challenge")[0].innerHTML;
                xhr.send(atob(base64Challenge));
            });

            var initData;
            if(document.getElementById("tos").checked){
                // Tears of Steel 
                initData = [0, 0, 3, 144, 112, 115, 115, 104, 1, 0, 0, 0, 154, 4, 240, 121, 152, 64, 66, 134, 171, 146, 230, 91, 224, 136, 95, 149, 0, 0, 0, 1, 111, 101, 26, 225, 219, 228, 68, 52, 188, 180, 105, 13, 21, 100, 196, 28, 0, 0, 3, 92, 92, 3, 0, 0, 1, 0, 1, 0, 82, 3, 60, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 32, 0, 120, 0, 109, 0, 108, 0, 110, 0, 115, 0, 61, 0, 34, 0, 104, 0, 116, 0, 116, 0, 112, 0, 58, 0, 47, 0, 47, 0, 115, 0, 99, 0, 104, 0, 101, 0, 109, 0, 97, 0, 115, 0, 46, 0, 109, 0, 105, 0, 99, 0, 114, 0, 111, 0, 115, 0, 111, 0, 102, 0, 116, 0, 46, 0, 99, 0, 111, 0, 109, 0, 47, 0, 68, 0, 82, 0, 77, 0, 47, 0, 50, 0, 48, 0, 48, 0, 55, 0, 47, 0, 48, 0, 51, 0, 47, 0, 80, 0, 108, 0, 97, 0, 121, 0, 82, 0, 101, 0, 97, 0, 100, 0, 121, 0, 72, 0, 101, 0, 97, 0, 100, 0, 101, 0, 114, 0, 34, 0, 32, 0, 118, 0, 101, 0, 114, 0, 115, 0, 105, 0, 111, 0, 110, 0, 61, 0, 34, 0, 52, 0, 46, 0, 48, 0, 46, 0, 48, 0, 46, 0, 48, 0, 34, 0, 62, 0, 60, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 75, 0, 69, 0, 89, 0, 76, 0, 69, 0, 78, 0, 62, 0, 49, 0, 54, 0, 60, 0, 47, 0, 75, 0, 69, 0, 89, 0, 76, 0, 69, 0, 78, 0, 62, 0, 60, 0, 65, 0, 76, 0, 71, 0, 73, 0, 68, 0, 62, 0, 65, 0, 69, 0, 83, 0, 67, 0, 84, 0, 82, 0, 60, 0, 47, 0, 65, 0, 76, 0, 71, 0, 73, 0, 68, 0, 62, 0, 60, 0, 47, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 75, 0, 73, 0, 68, 0, 62, 0, 52, 0, 82, 0, 112, 0, 108, 0, 98, 0, 43, 0, 84, 0, 98, 0, 78, 0, 69, 0, 83, 0, 56, 0, 116, 0, 71, 0, 107, 0, 78, 0, 70, 0, 87, 0, 84, 0, 69, 0, 72, 0, 65, 0, 61, 0, 61, 0, 60, 0, 47, 0, 75, 0, 73, 0, 68, 0, 62, 0, 60, 0, 67, 0, 72, 0, 69, 0, 67, 0, 75, 0, 83, 0, 85, 0, 77, 0, 62, 0, 75, 0, 76, 0, 106, 0, 51, 0, 81, 0, 122, 0, 81, 0, 80, 0, 47, 0, 78, 0, 65, 0, 61, 0, 60, 0, 47, 0, 67, 0, 72, 0, 69, 0, 67, 0, 75, 0, 83, 0, 85, 0, 77, 0, 62, 0, 60, 0, 76, 0, 65, 0, 95, 0, 85, 0, 82, 0, 76, 0, 62, 0, 104, 0, 116, 0, 116, 0, 112, 0, 115, 0, 58, 0, 47, 0, 47, 0, 112, 0, 114, 0, 111, 0, 102, 0, 102, 0, 105, 0, 99, 0, 105, 0, 97, 0, 108, 0, 115, 0, 105, 0, 116, 0, 101, 0, 46, 0, 107, 0, 101, 0, 121, 0, 100, 0, 101, 0, 108, 0, 105, 0, 118, 0, 101, 0, 114, 0, 121, 0, 46, 0, 109, 0, 101, 0, 100, 0, 105, 0, 97, 0, 115, 0, 101, 0, 114, 0, 118, 0, 105, 0, 99, 0, 101, 0, 115, 0, 46, 0, 119, 0, 105, 0, 110, 0, 100, 0, 111, 0, 119, 0, 115, 0, 46, 0, 110, 0, 101, 0, 116, 0, 47, 0, 80, 0, 108, 0, 97, 0, 121, 0, 82, 0, 101, 0, 97, 0, 100, 0, 121, 0, 47, 0, 60, 0, 47, 0, 76, 0, 65, 0, 95, 0, 85, 0, 82, 0, 76, 0, 62, 0, 60, 0, 67, 0, 85, 0, 83, 0, 84, 0, 79, 0, 77, 0, 65, 0, 84, 0, 84, 0, 82, 0, 73, 0, 66, 0, 85, 0, 84, 0, 69, 0, 83, 0, 62, 0, 60, 0, 73, 0, 73, 0, 83, 0, 95, 0, 68, 0, 82, 0, 77, 0, 95, 0, 86, 0, 69, 0, 82, 0, 83, 0, 73, 0, 79, 0, 78, 0, 62, 0, 56, 0, 46, 0, 49, 0, 46, 0, 50, 0, 51, 0, 48, 0, 52, 0, 46, 0, 51, 0, 49, 0, 60, 0, 47, 0, 73, 0, 73, 0, 83, 0, 95, 0, 68, 0, 82, 0, 77, 0, 95, 0, 86, 0, 69, 0, 82, 0, 83, 0, 73, 0, 79, 0, 78, 0, 62, 0, 60, 0, 47, 0, 67, 0, 85, 0, 83, 0, 84, 0, 79, 0, 77, 0, 65, 0, 84, 0, 84, 0, 82, 0, 73, 0, 66, 0, 85, 0, 84, 0, 69, 0, 83, 0, 62, 0, 60, 0, 47, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 47, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 62, 0]
            }else if(document.getElementById("xbox").checked){
                // XBox One Commercial Video
                initData = [0, 0, 1, 222, 112, 115, 115, 104, 0, 0, 0, 0, 154, 4, 240, 121, 152, 64, 66, 134, 171, 146, 230, 91, 224, 136, 95, 149, 0, 0, 1, 190, 190, 1, 0, 0, 1, 0, 1, 0, 180, 1, 60, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 32, 0, 120, 0, 109, 0, 108, 0, 110, 0, 115, 0, 61, 0, 34, 0, 104, 0, 116, 0, 116, 0, 112, 0, 58, 0, 47, 0, 47, 0, 115, 0, 99, 0, 104, 0, 101, 0, 109, 0, 97, 0, 115, 0, 46, 0, 109, 0, 105, 0, 99, 0, 114, 0, 111, 0, 115, 0, 111, 0, 102, 0, 116, 0, 46, 0, 99, 0, 111, 0, 109, 0, 47, 0, 68, 0, 82, 0, 77, 0, 47, 0, 50, 0, 48, 0, 48, 0, 55, 0, 47, 0, 48, 0, 51, 0, 47, 0, 80, 0, 108, 0, 97, 0, 121, 0, 82, 0, 101, 0, 97, 0, 100, 0, 121, 0, 72, 0, 101, 0, 97, 0, 100, 0, 101, 0, 114, 0, 34, 0, 32, 0, 118, 0, 101, 0, 114, 0, 115, 0, 105, 0, 111, 0, 110, 0, 61, 0, 34, 0, 52, 0, 46, 0, 51, 0, 46, 0, 48, 0, 46, 0, 48, 0, 34, 0, 62, 0, 60, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 75, 0, 73, 0, 68, 0, 83, 0, 62, 0, 60, 0, 75, 0, 73, 0, 68, 0, 32, 0, 65, 0, 76, 0, 71, 0, 73, 0, 68, 0, 61, 0, 34, 0, 65, 0, 69, 0, 83, 0, 67, 0, 84, 0, 82, 0, 34, 0, 32, 0, 86, 0, 65, 0, 76, 0, 85, 0, 69, 0, 61, 0, 34, 0, 53, 0, 47, 0, 55, 0, 77, 0, 122, 0, 121, 0, 54, 0, 67, 0, 72, 0, 101, 0, 50, 0, 70, 0, 50, 0, 109, 0, 81, 0, 84, 0, 118, 0, 66, 0, 72, 0, 84, 0, 122, 0, 119, 0, 61, 0, 61, 0, 34, 0, 62, 0, 60, 0, 47, 0, 75, 0, 73, 0, 68, 0, 62, 0, 60, 0, 47, 0, 75, 0, 73, 0, 68, 0, 83, 0, 62, 0, 60, 0, 47, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 47, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 47, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 62, 0];
            }

            session.generateRequest("cenc", new Uint8Array(initData)).then(() =>{
            }, reason =>{
                log("Couldn't Generate Request");
                log("Reason : " + reason);
            })
        }, reason =>{
            log("Couldn't retrieve Media Keys.");
            log("Reason : " + reason);
        });
    }, reason => {
        log("Couldn't get Key System Access.");
        log("Reason : " + reason)
    });

}

// Pad the number n with leading zeros so it has k digits
function pad(n,k){
    return String(n).padStart(k,'0');
}


// Return a random Integer in [begin; end[
function randInt(begin, end){
    return Math.floor(Math.random() * (end-begin)) + begin;
}

// We use two different version to have dates in a correct order
function randomDate1(){
    return "" + randInt(2020, 2030) + pad(randInt(1, 13), 2) + pad(randInt(1,29),2);
}

function randomDate2(){
    return "" + randInt(2031, 2040) + pad(randInt(1, 13), 2) + pad(randInt(1,29),2);
}

function randomDateHour1(){
    return randomDate1() + pad(randInt(0,24), 2) + pad(randInt(0,60), 2) + pad(randInt(0,60), 2);
}

function randomDateHour2(){
    return randomDate2() + pad(randInt(0,24), 2) + pad(randInt(0,60), 2) + pad(randInt(0,60), 2);
}

function randomSecond(){
    return randInt(1,301);
}

// Add 1 (from the left) to the number represented by tab, where digit i is in base bases[i]
function next(tab, bases){
    var i = 0;
    // Il va y avoir une retenu
    while(i < tab.length && (tab[i] == (bases[i] - 1))){
        tab[i] = 0;
        i++;
    }
    if(i != tab.length){
        tab[i]++;
    }
    return tab;
}

function isZero(tab){
    for(var i = 0; i < tab.length; i++){
        if(tab[i] != 0){
            return false;
        }
    }
    return true;
}

function paramsFromIndices(indices){
    var currentParams = [];
    for(var i = 0; i < potentialParams.length; i++){
        var val = potentialValues[i][indices[i]];
        if(val instanceof Function){
            val = val();
        }
        currentParams[i] = val;
    }
    return currentParams;
}

function toParams(tab){
    retStr = "";
    for(var i = 0;i < tab.length; i++){
        if (tab[i] != ''){
            retStr += potentialParams[i];
            retStr += ':';
            retStr += tab[i];
            retStr += ",";
        } 
    }
    return retStr.slice(0,-1);
}

function lastLicense(){
    Object.keys(results).forEach(key => {
        log(key);
        results[key].forEach(license =>{
            log(license);
        });
        log("");
    });
}

function main(){
    // We use an array representing the current parameters and increment by 1 each round
    // looping over all possibilites
    for (var i = 0; i < potentialParams.length; i++){
        currentIndices[i] = 0;
    }
    if(document.getElementById("preset").checked){
        potentialValues = potentialValuesHardcoded;
    }else if(document.getElementById("fullrandom").checked){
        potentialValues = potentialValuesRandom;
    }else{
        log("Error selecting values");
        return;
    }
    
	nbIteration = document.getElementById("nbiteration").value;
    log("Starting...");
    getLicense(toParams(paramsFromIndices(currentIndices)));
}
