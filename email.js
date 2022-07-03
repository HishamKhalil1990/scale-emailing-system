// import module
const nodemailer = require('nodemailer')

// declared variables
const host = "mail.abuodehbros.com" // email provider 
const fromEmail = "alerts@abuodehbros.com" // email sender user
const fromEmailPass = "Aa@123456" // email sender password

const sendEmail = async (text,subject,toEmail,scalesDetails,index) => {
    const transporter = nodemailer.createTransport({
        host: host,
        port: 587,
        secure: false,
        requireTLS: true,
        auth : {
            user : fromEmail,
            pass : fromEmailPass
        },
        tls: { 
            minVersion: 'TLSv1', // -> This is the line that solved my problem
            rejectUnauthorized: false,
        }
    });
    const emailOptions = {
        from : fromEmail,
        to : toEmail,
        subject : subject,
        text : text,
    }
    transporter.sendMail(emailOptions,(error,info) => {
        if (error) throw error;
        console.log('email was sent')
        scalesDetails[index].sentEmails += 1
    })
}

module.exports = sendEmail;