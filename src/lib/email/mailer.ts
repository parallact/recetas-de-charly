import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

function createTransporter() {
  const host = process.env.SMTP_HOST?.trim()
  const port = process.env.SMTP_PORT?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD?.trim()

  if (!host || !port || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: false,
    auth: { user, pass },
  })
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const transporter = createTransporter()
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER)?.trim()

  if (!transporter) {
    // Dev fallback: log to console if SMTP not configured
    console.log(`[EMAIL - not sent, SMTP not configured]`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${html.replace(/<[^>]+>/g, '')}`)
    return
  }

  await transporter.sendMail({ from, to, subject, html })
}
