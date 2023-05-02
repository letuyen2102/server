const { convert } = require('html-to-text');
const nodemailer = require('nodemailer');
const pug = require('pug')

const dotenv = require('dotenv')

dotenv.config({path : './../config.env'})


module.exports = class Email {
  constructor(user, url) {
    this.to = user.email,
    this.firstName = user.name.split(' ')[0],
    this.url = url
    this.from = `LETUYEN  <${process.env.EMAIL_FROM}>`
  }
  newTransport() { 
      return nodemailer.createTransport({
        host: "SendGrid",
        auth : {
          user : process.env.SENDGRID_USERNAME ,
          pass : process.env.SENDGRID_PASSWORD
        }
      })
    
  }
  async send(template, subject) {

    const html = pug.renderFile(`${__dirname}/../public/template/${template}.pug` ,{
      firstName: this.firstName,
      url: this.url,
      subject
    })

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html)
    }

    await this.newTransport().sendMail(mailOptions)
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the MYWAYMYFASHION ')
  }
  async resetPassword(){
    await this.send('reset', 'Reset Password')
  }

}



