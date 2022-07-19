const ping = require('ping');
const scales = require('./scalesIPs.json')
const sendEmail = require('./email');

// variables
let previousRemainHours = [24,0,0]
const pingConfig = {
    timeout: 10,
}
let scalesDetails;
let previousBranchName = "البيادر"
let previousEmail = ""
let IPlist = []
let indexList = []
let multi = 0

// functions
const reFillScalesDetails = () => {
    scalesDetails = scales.map(scale => {
        return {
            sentEmails : 0
        }
    })
}

const checkAndEmail = (scale,index) => {
    if(scale == undefined){
        let text = `يرجى العمل على توصبل الموازين التي لها ارقام التالية بالانترنت حتى نتمكن من ترحيل البيانات بشكل صحيح`
        IPlist.forEach(ip => {
            text += "\n" + ip
        })
        const subject = `PLU ${previousBranchName}`
        const toEmail = previousEmail
        indexList.forEach(index => {
            scalesDetails[index].sentEmails += 1
        })
        console.log(indexList)
        if((previousEmail != "") && (indexList.length > 0)){
            setTimeout(() => {
                sendEmail(text,subject,toEmail)
        }, multi*60000);
        }
        IPlist = []
        indexList = []
        previousBranchName = "البيادر"
        multi = 0
        previousEmail = ""
    }else if(scale.branch != previousBranchName){
        let text = `يرجى العمل على توصبل الموازين التي لها ارقام التالية بالانترنت حتى نتمكن من ترحيل البيانات بشكل صحيح`
        IPlist.forEach(ip => {
            text += "\n" + ip
        })
        const subject = `PLU ${previousBranchName}`
        const toEmail = previousEmail
        indexList.forEach(index => {
            scalesDetails[index].sentEmails += 1
        })
        console.log(indexList)
        if((previousEmail != "") && (indexList.length > 0)){
            setTimeout(() => {
                sendEmail(text,subject,toEmail)
        }, multi*60000);
        }
        IPlist = []
        indexList = []
        previousBranchName = scale.branch
        IPlist.push(scale.ip)
        indexList.push(index)
        multi += 1
    }else{
        IPlist.push(scale.ip)
        indexList.push(index)
        previousEmail = scale.email
    }
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
            // console.log(previousRemainHours)
            checkAndEmail()
        }
    }).catch(err => {
        console.log(`${scale.ip} is offline`)
        checkRemainHours(currentRemainHours,scale,index)
        currHours.push(currentRemainHours)
        if(currHours.length == length){
            previousRemainHours = currentRemainHours
            // console.log(previousRemainHours)
            checkAndEmail()
        }
    })
}

const checkScales = () => {
    let currHours = [];
    scales.forEach((scale,index) => {
        pingIP(scale,currHours,scales.length,index)
    })
}

const start = () => {
    reFillScalesDetails()
    setInterval(() => {
        checkScales()
    },3600000)
    // setInterval(() => {
    //     checkScales()
    // },120000)
}
start()

module.exports = start