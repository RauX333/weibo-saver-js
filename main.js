import  { MailListener }  from "./utils/mail-listener.js";
import dotenv from 'dotenv'
dotenv.config()
import { fetchWeibo } from './fetchWeibo.js'

var mailListener = new MailListener({
    username: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: 993, // imap port
    tls: true,
    connTimeout: 10000, // Default by node-imap
    authTimeout: 50000, // Default by node-imap,
    // debug: console.log, // Or your custom function with only one incoming argument. Default: null
    autotls: 'required', // default by node-imap
    mailbox: "INBOX", // mailbox to monitor
    searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
    markSeen: true, // all fetched email willbe marked as seen and not fetched next time
    fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
    attachments: false, // download attachments as they are encountered to the project directory
    
  });

  mailListener.start(); // start listening
  mailListener.on("server:connected", function(){
    console.log("IMAP Connected");
  });
  
  mailListener.on("server:disconnected", function(){
    console.log("IMAP Disconnected");
    process.exit()
  });
  
  mailListener.on("error", function(err){
    console.log(err);
    process.exit()
  });

  mailListener.on("mail", async function(mail, seqno) {
    console.log("receive mail")
    const fromAddress = mail.from.value[0].address
    const mailDate = mail.date
    const subject = mail.subject
    const mailBody = mail.html
    if(process.env.MAIL_ALLOWED_FROM.includes(fromAddress) && subject.includes("微博分享")){
      try {
        await fetchWeibo({fromAddress:fromAddress,mailDate:mailDate,subject:subject,mailBody:mailBody})
      } catch (error) {
        console.log("fetch weibo error: ",mailBody)
        console.log("error: ",error)
      }
    }
      
  })

// stop listening
//mailListener.stop();