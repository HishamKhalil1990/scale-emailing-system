const ping = require('ping');
const scales = require('./scalesIPs.json')
const sendEmail = require('./email');

// variables
let previousRemainHours = [24,0,0]
const pingConfig = {
    timeout: 10,
}
let scalesDetails;

// functions
const reFillScalesDetails = () => {
    scalesDetails = scales.map(scale => {
        return {
            sentEmails : 0
        }
    })
}

const checkAndEmail = (scale,index) => {
    const text = "يرجى العمل على توصبل الميزان بالانترنت حتى نتمكن من ترحيل البيانات بشكل صحيح"
    const subject = "PLU"
    const toEmail = scale.email
    sendEmail(text,subject,toEmail,scalesDetails,index)
}

const checkRemainHours = (currentRemainHours,scale,index) => {
    let toSend;
    if(scalesDetails[index].sentEmails < 3){
        toSend = true
    }else{
        toSend = false
    }
    if(previousRemainHours[0] > currentRemainHours[0]){
        if(toSend){
            checkAndEmail(scale,index)
        }
    }else if((previousRemainHours[0] == currentRemainHours[0]) && (previousRemainHours[1] > currentRemainHours[1])){
        if(toSend){
            checkAndEmail(scale,index)
        }
    }else if((previousRemainHours[0] == currentRemainHours[0]) && (previousRemainHours[1] == currentRemainHours[1]) && (previousRemainHours[2] > currentRemainHours[2])){
        if(toSend){
            checkAndEmail(scale,index)
        }
    }else{
        reFillScalesDetails()
    }
}

const getRemainHours = () => {
    const beginningHour = [8,0,0];
    let hour = beginningHour[0];
    let minute = beginningHour[1]
    let current = new Date();
    current = [current.getHours(),current.getMinutes(),current.getSeconds()]
    let reSecond = 0;
    let reMinute = 0;
    let reHour = 0;
    if(current[2] > beginningHour[2]){
        reSecond = 60 - current[2]
        minute = minute - 1
    }
    if(current[1] > minute){
        reMinute = (60 + minute) - current[1]
        hour = hour - 1;
    }if(current[0] <= hour){
        reHour = hour - current[0]
    }else{
        reHour = 24 - (current[0] - hour)
    }
    const remainnigHours = [reHour,reMinute,reSecond]
    return remainnigHours
}

const pingIP = (scale,currHours,length,index) => {
    const currentRemainHours = getRemainHours()
    new Promise((resolve,reject) => {
        ping.sys.probe(scale.ip, function(isAlive){
            if(isAlive){
                resolve()
            }else{
                reject()
            }
        }, pingConfig);
    }).then(() => {
        console.log(`${scale.ip} is online`)
        scalesDetails[index].sentEmails = 0
        currHours.push(currentRemainHours)
        if(currHours.length == length){
            previousRemainHours = currentRemainHours
        }
    }).catch(err => {
        console.log(`${scale.ip} is offline`)
        checkRemainHours(currentRemainHours,scale,index)
        currHours.push(currentRemainHours)
        if(currHours.length == length){
            previousRemainHours = currentRemainHours
        }
    })
}

const checkScales = () => {
    let currHours = [];
    scales.forEach((scale,index) => {
        pingIP(scale,currHours,scales.length,index)
    })
}

reFillScalesDetails()
// setInterval(checkScales,86400000)
setInterval(checkScales,10000)