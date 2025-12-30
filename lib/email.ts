/**
 * Custom Email API
 * 
 * This module provides email sending functionality.
 * Configure with environment variables:
 * 
 * Option 1: SMTP (Gmail, Outlook, custom server)
 * - SMTP_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password or app password
 * - SMTP_SECURE: Use TLS (true for port 465, false for 587)
 * 
 * Option 2: Custom API (Resend, SendGrid, etc.)
 * - EMAIL_API_URL: Your email API endpoint
 * - EMAIL_API_KEY: API key for authentication
 * 
 * Common:
 * - EMAIL_FROM: Default from address
 * - EMAIL_FROM_NAME: Default from name
 */

import nodemailer from "nodemailer"

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  fromName?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Email templates
export const emailTemplates = {
  // Password Reset Email
  passwordReset: (data: { 
    userName: string
    resetLink: string
    schoolName: string
    expiresIn: string 
  }) => ({
    subject: `Password Reset Request - ${data.schoolName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .content { padding: 40px 20px; }
    .button { display: inline-block; padding: 16px 32px; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
    .warning { background-color: #fff3cd; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; border-left: 4px solid #ffc107; }
    .link-text { word-break: break-all; color: #666; font-size: 13px; background: #f8f9fa; padding: 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${data.userName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="${data.resetLink}" class="button">Reset Password</a>
      </p>
      <div class="warning">
        ⏰ This link will expire in <strong>${data.expiresIn}</strong>. If you didn't request this, please ignore this email.
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="link-text">${data.resetLink}</p>
    </div>
    <div class="footer">
      <p>This email was sent by ${data.schoolName}</p>
      <p style="font-size: 12px; color: #999;">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Password Reset Request

Hello ${data.userName},

We received a request to reset your password. Click the link below to create a new password:

${data.resetLink}

This link will expire in ${data.expiresIn}. If you didn't request this, please ignore this email.

This email was sent by ${data.schoolName}`,
  }),

  // Welcome User Email
  welcomeUser: (data: {
    userName: string
    email: string
    tempPassword: string
    loginLink: string
    schoolName: string
    role: string
  }) => ({
    subject: `Welcome to ${data.schoolName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .content { padding: 40px 20px; }
    .credentials { background-color: #f8f9fa; padding: 24px; border-radius: 12px; margin: 24px 0; }
    .credentials p { margin: 10px 0; }
    .credentials strong { color: #1a1a1a; }
    .button { display: inline-block; padding: 16px 32px; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
    .warning { background-color: #fff3cd; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; border-left: 4px solid #ffc107; }
    .role-badge { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Welcome to ${data.schoolName}! 🎉</h2>
      <p>Hello ${data.userName},</p>
      <p>Your <span class="role-badge">${data.role}</span> account has been created. Here are your login credentials:</p>
      <div class="credentials">
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Temporary Password:</strong> ${data.tempPassword}</p>
      </div>
      <div class="warning">
        🔐 Please change your password after your first login for security.
      </div>
      <p style="text-align: center;">
        <a href="${data.loginLink}" class="button">Login Now</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent by ${data.schoolName}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Welcome to ${data.schoolName}!

Hello ${data.userName},

Your ${data.role} account has been created. Here are your login credentials:

Email: ${data.email}
Temporary Password: ${data.tempPassword}

Please change your password after your first login for security.

Login at: ${data.loginLink}

This email was sent by ${data.schoolName}`,
  }),

  // Announcement Email
  announcement: (data: {
    title: string
    message: string
    schoolName: string
    senderName?: string
    actionLink?: string
    actionText?: string
  }) => ({
    subject: `${data.title} - ${data.schoolName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Announcement</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .content { padding: 40px 20px; }
    .message { background-color: #f8f9fa; padding: 24px; border-radius: 12px; margin: 24px 0; white-space: pre-wrap; }
    .button { display: inline-block; padding: 16px 32px; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
      <div class="badge">📢 Announcement</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${data.title}</h2>
      ${data.senderName ? `<p style="color: #666; font-size: 14px;">From: ${data.senderName}</p>` : ""}
      <div class="message">${data.message}</div>
      ${data.actionLink ? `
      <p style="text-align: center;">
        <a href="${data.actionLink}" class="button">${data.actionText || "View Details"}</a>
      </p>
      ` : ""}
    </div>
    <div class="footer">
      <p>This announcement was sent by ${data.schoolName}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `${data.title}

${data.senderName ? `From: ${data.senderName}\n\n` : ""}${data.message}

${data.actionLink ? `View more: ${data.actionLink}` : ""}

This announcement was sent by ${data.schoolName}`,
  }),

  // Grade/Result Notification
  gradeNotification: (data: {
    studentName: string
    parentName?: string
    schoolName: string
    periodName: string
    subjects: Array<{ name: string; score: number; grade: string }>
    averageScore: number
    position?: number
    viewLink: string
  }) => ({
    subject: `${data.periodName} Results Available - ${data.schoolName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grade Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .content { padding: 40px 20px; }
    .summary { text-align: center; margin: 30px 0; }
    .stat { display: inline-block; padding: 20px 40px; }
    .stat-value { font-size: 36px; font-weight: bold; color: #1a1a1a; }
    .stat-label { font-size: 14px; color: #666; }
    .grades-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .grades-table th, .grades-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .grades-table th { background: #f8f9fa; font-weight: 600; }
    .grade-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; }
    .grade-a { background: #e8f5e9; color: #2e7d32; }
    .grade-b { background: #e3f2fd; color: #1976d2; }
    .grade-c { background: #fff3e0; color: #f57c00; }
    .grade-d { background: #fce4ec; color: #c2185b; }
    .grade-f { background: #ffebee; color: #c62828; }
    .button { display: inline-block; padding: 16px 32px; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">📊 ${data.periodName} Results</h2>
      <p>${data.parentName ? `Dear ${data.parentName},<br><br>` : ""}${data.studentName}'s results for ${data.periodName} are now available.</p>
      
      <div class="summary">
        <div class="stat">
          <div class="stat-value">${data.averageScore.toFixed(1)}%</div>
          <div class="stat-label">Average Score</div>
        </div>
        ${data.position ? `
        <div class="stat">
          <div class="stat-value">#${data.position}</div>
          <div class="stat-label">Class Position</div>
        </div>
        ` : ""}
      </div>

      <table class="grades-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Score</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          ${data.subjects.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>${s.score}%</td>
            <td><span class="grade-badge grade-${s.grade.toLowerCase()}">${s.grade}</span></td>
          </tr>
          `).join("")}
        </tbody>
      </table>

      <p style="text-align: center;">
        <a href="${data.viewLink}" class="button">View Full Report</a>
      </p>
    </div>
    <div class="footer">
      <p>This report was sent by ${data.schoolName}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `${data.periodName} Results - ${data.schoolName}

${data.parentName ? `Dear ${data.parentName},\n\n` : ""}${data.studentName}'s results for ${data.periodName} are now available.

Average Score: ${data.averageScore.toFixed(1)}%
${data.position ? `Class Position: #${data.position}` : ""}

Subjects:
${data.subjects.map(s => `- ${s.name}: ${s.score}% (${s.grade})`).join("\n")}

View full report: ${data.viewLink}

This report was sent by ${data.schoolName}`,
  }),

  // Attendance Alert
  attendanceAlert: (data: {
    studentName: string
    parentName: string
    schoolName: string
    date: string
    status: "ABSENT" | "LATE" | "EXCUSED"
    className: string
    notes?: string
  }) => {
    const statusColors = {
      ABSENT: { bg: "#ffebee", color: "#c62828", icon: "❌" },
      LATE: { bg: "#fff3e0", color: "#f57c00", icon: "⏰" },
      EXCUSED: { bg: "#e3f2fd", color: "#1976d2", icon: "📝" },
    }
    const statusConfig = statusColors[data.status]
    
    return {
      subject: `Attendance Alert: ${data.studentName} - ${data.status} on ${data.date}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .content { padding: 40px 20px; }
    .alert-box { background: ${statusConfig.bg}; border-left: 4px solid ${statusConfig.color}; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .alert-status { font-size: 24px; font-weight: bold; color: ${statusConfig.color}; }
    .info-row { padding: 12px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: 600; color: #666; display: inline-block; width: 100px; }
    .info-value { display: inline-block; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Attendance Notification</h2>
      <p>Dear ${data.parentName},</p>
      <p>This is to inform you about ${data.studentName}'s attendance status:</p>
      
      <div class="alert-box">
        <div class="alert-status">${statusConfig.icon} ${data.status}</div>
      </div>

      <div style="margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Student</span>
          <span class="info-value">${data.studentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${data.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Class</span>
          <span class="info-value">${data.className}</span>
        </div>
        ${data.notes ? `
        <div class="info-row">
          <span class="info-label">Notes</span>
          <span class="info-value">${data.notes}</span>
        </div>
        ` : ""}
      </div>

      <p>If you have any questions, please contact the school administration.</p>
    </div>
    <div class="footer">
      <p>This notification was sent by ${data.schoolName}</p>
    </div>
  </div>
</body>
</html>
      `,
      text: `Attendance Notification - ${data.schoolName}

Dear ${data.parentName},

This is to inform you about ${data.studentName}'s attendance status:

Status: ${data.status}
Student: ${data.studentName}
Date: ${data.date}
Class: ${data.className}
${data.notes ? `Notes: ${data.notes}` : ""}

If you have any questions, please contact the school administration.

This notification was sent by ${data.schoolName}`,
    }
  },

  // Fee Reminder
  feeReminder: (data: {
    parentName: string
    studentName: string
    schoolName: string
    amount: number
    currency: string
    dueDate: string
    feeType: string
    paymentLink?: string
  }) => ({
    subject: `Fee Reminder: ${data.feeType} Due - ${data.schoolName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fee Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .content { padding: 40px 20px; }
    .amount-box { text-align: center; background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 24px 0; }
    .amount { font-size: 42px; font-weight: bold; color: #1a1a1a; }
    .currency { font-size: 20px; color: #666; }
    .due-date { background: #fff3cd; color: #856404; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 12px; font-size: 14px; }
    .info-row { padding: 12px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: 600; color: #666; display: inline-block; width: 100px; }
    .info-value { display: inline-block; }
    .button { display: inline-block; padding: 16px 32px; background-color: #2e7d32; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">💰 Fee Payment Reminder</h2>
      <p>Dear ${data.parentName},</p>
      <p>This is a friendly reminder that a fee payment is due for ${data.studentName}.</p>
      
      <div class="amount-box">
        <div class="amount"><span class="currency">${data.currency}</span> ${data.amount.toLocaleString()}</div>
        <div class="due-date">📅 Due: ${data.dueDate}</div>
      </div>

      <div style="margin: 24px 0;">
        <div class="info-row">
          <span class="info-label">Fee Type</span>
          <span class="info-value">${data.feeType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Student</span>
          <span class="info-value">${data.studentName}</span>
        </div>
      </div>

      ${data.paymentLink ? `
      <p style="text-align: center;">
        <a href="${data.paymentLink}" class="button">Pay Now</a>
      </p>
      ` : ""}

      <p>If you have already made this payment, please disregard this reminder.</p>
    </div>
    <div class="footer">
      <p>This reminder was sent by ${data.schoolName}</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Fee Payment Reminder - ${data.schoolName}

Dear ${data.parentName},

This is a friendly reminder that a fee payment is due for ${data.studentName}.

Amount: ${data.currency} ${data.amount.toLocaleString()}
Fee Type: ${data.feeType}
Due Date: ${data.dueDate}

${data.paymentLink ? `Pay online: ${data.paymentLink}` : ""}

If you have already made this payment, please disregard this reminder.

This reminder was sent by ${data.schoolName}`,
  }),

  // General Notification
  notification: (data: {
    recipientName: string
    title: string
    message: string
    schoolName: string
    actionLink?: string
    actionText?: string
    type?: "info" | "success" | "warning" | "error"
  }) => {
    const typeConfig = {
      info: { bg: "#e3f2fd", color: "#1976d2", icon: "ℹ️" },
      success: { bg: "#e8f5e9", color: "#2e7d32", icon: "✅" },
      warning: { bg: "#fff3e0", color: "#f57c00", icon: "⚠️" },
      error: { bg: "#ffebee", color: "#c62828", icon: "❌" },
    }
    const config = typeConfig[data.type || "info"]
    
    return {
      subject: `${data.title} - ${data.schoolName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .content { padding: 40px 20px; }
    .message-box { background: ${config.bg}; border-left: 4px solid ${config.color}; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .button { display: inline-block; padding: 16px 32px; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 30px 20px; border-top: 2px solid #f0f0f0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${data.schoolName}</div>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">${config.icon} ${data.title}</h2>
      <p>Hello ${data.recipientName},</p>
      <div class="message-box">${data.message}</div>
      ${data.actionLink ? `
      <p style="text-align: center;">
        <a href="${data.actionLink}" class="button">${data.actionText || "View Details"}</a>
      </p>
      ` : ""}
    </div>
    <div class="footer">
      <p>This notification was sent by ${data.schoolName}</p>
    </div>
  </div>
</body>
</html>
      `,
      text: `${data.title}

Hello ${data.recipientName},

${data.message}

${data.actionLink ? `${data.actionText || "View Details"}: ${data.actionLink}` : ""}

This notification was sent by ${data.schoolName}`,
    }
  },
}

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

// Create reusable transporter (cached)
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || "587")
  const secure = process.env.SMTP_SECURE === "true" || port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.")
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  return transporter
}

/**
 * Send email using the configured method
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const fromName = options.fromName || process.env.EMAIL_FROM_NAME || "Sukuu"
  const fromAddress = options.from || process.env.EMAIL_FROM || "noreply@suku.app"
  const from = `${fromName} <${fromAddress}>`
  
  // Check if we have a custom email API configured
  if (process.env.EMAIL_API_URL && process.env.EMAIL_API_KEY) {
    return sendViaAPI({ ...options, from: fromAddress })
  }
  
  // Check if we have SMTP configured
  if (process.env.SMTP_HOST) {
    return sendViaSMTP({ ...options, from })
  }
  
  // Development mode - log email to console
  console.log("\n" + "=".repeat(60))
  console.log("📧 EMAIL (Development Mode)")
  console.log("=".repeat(60))
  console.log(`To:      ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`)
  console.log(`From:    ${from}`)
  console.log(`Subject: ${options.subject}`)
  console.log("-".repeat(60))
  console.log(options.text?.substring(0, 300) || "No text content")
  if (options.text && options.text.length > 300) console.log("...(truncated)")
  console.log("=".repeat(60) + "\n")
  
  return { 
    success: true, 
    messageId: `dev-${Date.now()}` 
  }
}

/**
 * Send email via custom API endpoint (Resend, SendGrid, etc.)
 */
async function sendViaAPI(options: EmailOptions): Promise<EmailResult> {
  try {
    const response = await fetch(process.env.EMAIL_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Email API error:", errorText)
      return { success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.id || data.messageId }
  } catch (error) {
    console.error("Email send error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send email" 
    }
  }
}

/**
 * Send email via SMTP using nodemailer
 */
async function sendViaSMTP(options: EmailOptions): Promise<EmailResult> {
  try {
    const transport = getTransporter()
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: options.from,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    }

    const info = await transport.sendMail(mailOptions)
    
    console.log(`📧 Email sent via SMTP: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("SMTP send error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send email via SMTP" 
    }
  }
}

/**
 * Verify SMTP connection (useful for testing)
 */
export async function verifySMTPConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter()
    await transport.verify()
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "SMTP verification failed" 
    }
  }
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length]
  }
  return token
}
