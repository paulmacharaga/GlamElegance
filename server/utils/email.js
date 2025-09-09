const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmation = async (booking) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email configuration not set, skipping email send');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.customerEmail,
    subject: 'Booking Confirmation - Hair Studio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #2D1B69; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Hair Studio</h1>
          <p style="margin: 10px 0 0 0;">Booking Confirmation</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2D1B69; margin-top: 0;">Hello ${booking.customerName}!</h2>
          
          <p>Thank you for booking with us. Your appointment has been confirmed with the following details:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2D1B69; margin-top: 0;">Appointment Details</h3>
            <p><strong>Service:</strong> ${booking.service.charAt(0).toUpperCase() + booking.service.slice(1)}</p>
            ${booking.stylist ? `<p><strong>Stylist:</strong> ${booking.stylist}</p>` : ''}
            <p><strong>Date:</strong> ${new Date(booking.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.appointmentTime}</p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2D1B69; margin-top: 0;">Important Information</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Please arrive 10 minutes early for your appointment</li>
              <li>If you need to reschedule, please call us at least 24 hours in advance</li>
              <li>Bring any inspiration photos or specific requests</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">We look forward to seeing you!</p>
            <p style="color: #2D1B69; font-weight: bold;">Hair Studio Team</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation
};
