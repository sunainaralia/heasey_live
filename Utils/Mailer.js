import nodemailer from 'nodemailer';

// Create the transporter with direct configuration
export const transponder = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sunainaralia@gmail.com',
    pass: 'cvmc enfi gizd zfgs'
  }
});

// Create email options
export const options = (email, subject, content) => {
  return {
    from: {
      name: 'Heasey India',
      address: 'sunainaralia@gmail.com'
    },
    replyTo: 'no-reply@heasey.com',
    to: email,
    subject: subject,
    html: content
  };
};

// Send mail function
export const sendMail = async (mailOptions) => {
  try {
    // Send the email
    const info = await transponder.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};