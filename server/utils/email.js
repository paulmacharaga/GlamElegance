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
            ${booking.loyaltyPointsEarned ? 
              `<div style="margin-top: 15px; padding: 10px; background-color: #e8f5e9; border-radius: 4px;">
                <p style="margin: 0; color: #2e7d32; font-weight: 500;">
                  🎉 You've earned ${booking.loyaltyPointsEarned} loyalty points for this booking!
                </p>
              </div>` 
              : ''}
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2D1B69; margin-top: 0;">Important Information</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Please arrive 10 minutes early for your appointment</li>
              <li>If you need to reschedule, please call us at least 24 hours in advance</li>
              <li>Bring any inspiration photos or specific requests</li>
              ${booking.joinLoyalty ? 
                `<li>You've been enrolled in our Loyalty Program! Check your points balance on your next visit</li>` 
                : ''}
            </ul>
            
            ${booking.joinLoyalty ? `
            <div style="margin-top: 15px; padding: 12px; background-color: #fff3e0; border-radius: 4px; border-left: 4px solid #ff9800;">
              <h4 style="margin: 0 0 10px 0; color: #e65100;">Welcome to Our Loyalty Program!</h4>
              <p style="margin: 0;">
                Thank you for joining! You'll earn points with every visit that can be redeemed for discounts on future services. 
                Keep an eye on your email for special member-only offers!
              </p>
            </div>` : ''}
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

const sendPasswordResetEmail = async (email, resetUrl) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email configuration not set, skipping password reset email');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Hair Studio',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #2D1B69; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Hair Studio</h1>
          <p style="margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2D1B69; margin-top: 0;">Reset Your Password</h2>
          
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #2D1B69; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>If you didn't request this, you can safely ignore this email. Your password won't be changed until you access the link above and create a new one.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendBookingConfirmation,
  sendPasswordResetEmail
};
