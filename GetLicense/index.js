function log(message){
    var logger = document.getElementById("log");
    logger.innerHTML += message;
    logger.innerHTML += "<br>"; 
}



var LA_URL = "https://test.playready.microsoft.com/service/rightsmanager.asmx";


function prettifyResponse(response){
    var retResponse = response.replaceAll('\n', '<br>')
    return retResponse;
}

function responseToLicense(licenseResponse){
    var parser = new DOMParser();
    var licenseResponseStr = (new TextDecoder("utf-8")).decode(licenseResponse);
    var xmlResponse = parser.parseFromString(licenseResponseStr, "text/xml");
    var licenseB64 = xmlResponse.getElementsByTagName("License")[0].innerHTML;
    
    var license = atob(licenseB64);
    var hexLicense = license.split('').map(val => val.charCodeAt(0).toString(16).padStart(2, '0')).toString().replaceAll(',', '');

    log("License : "+hexLicense);
}

function processMessage(evt){

    var keySession = evt.target;
    const message = evt.message;
    const xmlRequest = new XMLHttpRequest();


    xmlRequest.addEventListener("load", ev =>{
        const target = ev.target;
        if (target.status >= 200 && target.status < 300){
            const response = target.response;

            responseToLicense(response);
            // In a normal EME execution, we would call update() here to pass the license to the CDM
        }else{
            log("Server failed with error : " + target.status + target.statusMessage);
        }
    });

    var params = document.getElementById("params").value;
    xmlRequest.open("POST", LA_URL + "?cfg=(" + params + ")", true);

    xmlRequest.responseType = "arraybuffer";
    xmlRequest.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");


    // To send the challenge, we have to send the "Challenge" tag of the message decoded from base64
    var challengeStr = (new TextDecoder("utf-16")).decode(message);
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(challengeStr, "text/xml");
    var base64Challenge = xmlDoc.getElementsByTagName("Challenge")[0].innerHTML;
    var challenge = atob(base64Challenge);

    var challengeXML = parser.parseFromString(challenge, "text/xml");
    var signaturePK = challengeXML.getElementsByTagName("PublicKey")[0].innerHTML;
    log("Signature Public Key : " + signaturePK); 

    xmlRequest.send(challenge);
}


function afterKeySystem(mediaKeySystem){
        
        // We create a particular Media Key Object
        mediaKeySystem.createMediaKeys().then(mediaKeys=>{
            var session = mediaKeys.createSession("temporary");
            session.addEventListener("message", processMessage);

            
            // We can either hard code a PlayReady header to be sent to the License Server 
            // Or we can get a header from a HTMLMediaElement onEncrypted event
            // Tears of Steel hardcoded
            var initDataToS = [0, 0, 3, 144, 112, 115, 115, 104, 1, 0, 0, 0, 154, 4, 240, 121, 152, 64, 66, 134, 171, 146, 230, 91, 224, 136, 95, 149, 0, 0, 0, 1, 111, 101, 26, 225, 219, 228, 68, 52, 188, 180, 105, 13, 21, 100, 196, 28, 0, 0, 3, 92, 92, 3, 0, 0, 1, 0, 1, 0, 82, 3, 60, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 32, 0, 120, 0, 109, 0, 108, 0, 110, 0, 115, 0, 61, 0, 34, 0, 104, 0, 116, 0, 116, 0, 112, 0, 58, 0, 47, 0, 47, 0, 115, 0, 99, 0, 104, 0, 101, 0, 109, 0, 97, 0, 115, 0, 46, 0, 109, 0, 105, 0, 99, 0, 114, 0, 111, 0, 115, 0, 111, 0, 102, 0, 116, 0, 46, 0, 99, 0, 111, 0, 109, 0, 47, 0, 68, 0, 82, 0, 77, 0, 47, 0, 50, 0, 48, 0, 48, 0, 55, 0, 47, 0, 48, 0, 51, 0, 47, 0, 80, 0, 108, 0, 97, 0, 121, 0, 82, 0, 101, 0, 97, 0, 100, 0, 121, 0, 72, 0, 101, 0, 97, 0, 100, 0, 101, 0, 114, 0, 34, 0, 32, 0, 118, 0, 101, 0, 114, 0, 115, 0, 105, 0, 111, 0, 110, 0, 61, 0, 34, 0, 52, 0, 46, 0, 48, 0, 46, 0, 48, 0, 46, 0, 48, 0, 34, 0, 62, 0, 60, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 75, 0, 69, 0, 89, 0, 76, 0, 69, 0, 78, 0, 62, 0, 49, 0, 54, 0, 60, 0, 47, 0, 75, 0, 69, 0, 89, 0, 76, 0, 69, 0, 78, 0, 62, 0, 60, 0, 65, 0, 76, 0, 71, 0, 73, 0, 68, 0, 62, 0, 65, 0, 69, 0, 83, 0, 67, 0, 84, 0, 82, 0, 60, 0, 47, 0, 65, 0, 76, 0, 71, 0, 73, 0, 68, 0, 62, 0, 60, 0, 47, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 75, 0, 73, 0, 68, 0, 62, 0, 52, 0, 82, 0, 112, 0, 108, 0, 98, 0, 43, 0, 84, 0, 98, 0, 78, 0, 69, 0, 83, 0, 56, 0, 116, 0, 71, 0, 107, 0, 78, 0, 70, 0, 87, 0, 84, 0, 69, 0, 72, 0, 65, 0, 61, 0, 61, 0, 60, 0, 47, 0, 75, 0, 73, 0, 68, 0, 62, 0, 60, 0, 67, 0, 72, 0, 69, 0, 67, 0, 75, 0, 83, 0, 85, 0, 77, 0, 62, 0, 75, 0, 76, 0, 106, 0, 51, 0, 81, 0, 122, 0, 81, 0, 80, 0, 47, 0, 78, 0, 65, 0, 61, 0, 60, 0, 47, 0, 67, 0, 72, 0, 69, 0, 67, 0, 75, 0, 83, 0, 85, 0, 77, 0, 62, 0, 60, 0, 76, 0, 65, 0, 95, 0, 85, 0, 82, 0, 76, 0, 62, 0, 104, 0, 116, 0, 116, 0, 112, 0, 115, 0, 58, 0, 47, 0, 47, 0, 112, 0, 114, 0, 111, 0, 102, 0, 102, 0, 105, 0, 99, 0, 105, 0, 97, 0, 108, 0, 115, 0, 105, 0, 116, 0, 101, 0, 46, 0, 107, 0, 101, 0, 121, 0, 100, 0, 101, 0, 108, 0, 105, 0, 118, 0, 101, 0, 114, 0, 121, 0, 46, 0, 109, 0, 101, 0, 100, 0, 105, 0, 97, 0, 115, 0, 101, 0, 114, 0, 118, 0, 105, 0, 99, 0, 101, 0, 115, 0, 46, 0, 119, 0, 105, 0, 110, 0, 100, 0, 111, 0, 119, 0, 115, 0, 46, 0, 110, 0, 101, 0, 116, 0, 47, 0, 80, 0, 108, 0, 97, 0, 121, 0, 82, 0, 101, 0, 97, 0, 100, 0, 121, 0, 47, 0, 60, 0, 47, 0, 76, 0, 65, 0, 95, 0, 85, 0, 82, 0, 76, 0, 62, 0, 60, 0, 67, 0, 85, 0, 83, 0, 84, 0, 79, 0, 77, 0, 65, 0, 84, 0, 84, 0, 82, 0, 73, 0, 66, 0, 85, 0, 84, 0, 69, 0, 83, 0, 62, 0, 60, 0, 73, 0, 73, 0, 83, 0, 95, 0, 68, 0, 82, 0, 77, 0, 95, 0, 86, 0, 69, 0, 82, 0, 83, 0, 73, 0, 79, 0, 78, 0, 62, 0, 56, 0, 46, 0, 49, 0, 46, 0, 50, 0, 51, 0, 48, 0, 52, 0, 46, 0, 51, 0, 49, 0, 60, 0, 47, 0, 73, 0, 73, 0, 83, 0, 95, 0, 68, 0, 82, 0, 77, 0, 95, 0, 86, 0, 69, 0, 82, 0, 83, 0, 73, 0, 79, 0, 78, 0, 62, 0, 60, 0, 47, 0, 67, 0, 85, 0, 83, 0, 84, 0, 79, 0, 77, 0, 65, 0, 84, 0, 84, 0, 82, 0, 73, 0, 66, 0, 85, 0, 84, 0, 69, 0, 83, 0, 62, 0, 60, 0, 47, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 47, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 62, 0]
            // Xbox commercial hardcoded
            var initDataXbox = [0, 0, 1, 222, 112, 115, 115, 104, 0, 0, 0, 0, 154, 4, 240, 121, 152, 64, 66, 134, 171, 146, 230, 91, 224, 136, 95, 149, 0, 0, 1, 190, 190, 1, 0, 0, 1, 0, 1, 0, 180, 1, 60, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 32, 0, 120, 0, 109, 0, 108, 0, 110, 0, 115, 0, 61, 0, 34, 0, 104, 0, 116, 0, 116, 0, 112, 0, 58, 0, 47, 0, 47, 0, 115, 0, 99, 0, 104, 0, 101, 0, 109, 0, 97, 0, 115, 0, 46, 0, 109, 0, 105, 0, 99, 0, 114, 0, 111, 0, 115, 0, 111, 0, 102, 0, 116, 0, 46, 0, 99, 0, 111, 0, 109, 0, 47, 0, 68, 0, 82, 0, 77, 0, 47, 0, 50, 0, 48, 0, 48, 0, 55, 0, 47, 0, 48, 0, 51, 0, 47, 0, 80, 0, 108, 0, 97, 0, 121, 0, 82, 0, 101, 0, 97, 0, 100, 0, 121, 0, 72, 0, 101, 0, 97, 0, 100, 0, 101, 0, 114, 0, 34, 0, 32, 0, 118, 0, 101, 0, 114, 0, 115, 0, 105, 0, 111, 0, 110, 0, 61, 0, 34, 0, 52, 0, 46, 0, 51, 0, 46, 0, 48, 0, 46, 0, 48, 0, 34, 0, 62, 0, 60, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 75, 0, 73, 0, 68, 0, 83, 0, 62, 0, 60, 0, 75, 0, 73, 0, 68, 0, 32, 0, 65, 0, 76, 0, 71, 0, 73, 0, 68, 0, 61, 0, 34, 0, 65, 0, 69, 0, 83, 0, 67, 0, 84, 0, 82, 0, 34, 0, 32, 0, 86, 0, 65, 0, 76, 0, 85, 0, 69, 0, 61, 0, 34, 0, 53, 0, 47, 0, 55, 0, 77, 0, 122, 0, 121, 0, 54, 0, 67, 0, 72, 0, 101, 0, 50, 0, 70, 0, 50, 0, 109, 0, 81, 0, 84, 0, 118, 0, 66, 0, 72, 0, 84, 0, 122, 0, 119, 0, 61, 0, 61, 0, 34, 0, 62, 0, 60, 0, 47, 0, 75, 0, 73, 0, 68, 0, 62, 0, 60, 0, 47, 0, 75, 0, 73, 0, 68, 0, 83, 0, 62, 0, 60, 0, 47, 0, 80, 0, 82, 0, 79, 0, 84, 0, 69, 0, 67, 0, 84, 0, 73, 0, 78, 0, 70, 0, 79, 0, 62, 0, 60, 0, 47, 0, 68, 0, 65, 0, 84, 0, 65, 0, 62, 0, 60, 0, 47, 0, 87, 0, 82, 0, 77, 0, 72, 0, 69, 0, 65, 0, 68, 0, 69, 0, 82, 0, 62, 0];
            var initData = [];
            if(document.getElementById("tos").checked){
                initData = initDataToS;
            }else if(document.getElementById("xbox")){
                initData = initDataXbox;
            }else{
                log("Couldn't find the associated initData");
                return;
            }
            
            var initDataType = "cenc";
            session.generateRequest(initDataType, new Uint8Array(initData)).then(()=>{
                // log("Request Generated");
            }, reason =>{
                log("Request Generation failed");
                log("Reason : " + reason);
            })
            


        }, reason =>{
            log("Couldn't create Media Keys");
            log("Reason : " + reason);
        })
}


function main(){
    // We first choose a certain configuration (a bit arbitrary)
    var configurations = [
        { 
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
            "sessionTypes":  ["temporary"]},
        {
            "persistentState":  "optional",
            "sessionTypes":  ["temporary"],
            "initDataTypes":  ["cenc"],
            "distinctiveIdentifier":  "optional",
            "initDataTypes":  ["cenc"],
            "audioCapabilities":  [{"contentType":  "audio/mp4;codecs=\"mp4a.40.2\""}],
            "videoCapabilities":  [{"contentType":  "video/mp4;codecs=\"avc1.4d401e\""}], 
        },
        {
            "initDataTypes":  ["cenc"],
            "videoCapabilities":  [
                    {"contentType":  "video/mp4;codecs=\"avc1.4d401e\""},
                    {"contentType":  "video/mp4;codecs=\"avc1.42e01e\""},
                    {"contentType":  "video/webm;codecs=\"vp8\""}],
            "audioCapabilities":  [
                    {"contentType":  "audio/mp4;codecs=\"mp4a.40.2\""}]
        },
    
    ];

	LA_URL = document.getElementById("laurl").value;
    var ks = document.getElementById("keysystem").value;
    navigator.requestMediaKeySystemAccess(ks, configurations).then(afterKeySystem, 
        reason =>{
            log("Failed with " + ks)
        });
}