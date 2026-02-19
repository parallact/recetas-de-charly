const APP_NAME = 'Recetas de Charly'

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9f5f0;
  margin: 0;
  padding: 0;
`

const containerStyle = `
  max-width: 560px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`

const headerStyle = `
  background: #c0392b;
  padding: 32px 40px;
  text-align: center;
`

const bodyStyle = `
  padding: 40px;
  color: #333333;
`

const buttonStyle = `
  display: inline-block;
  background: #c0392b;
  color: #ffffff !important;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  margin: 24px 0;
`

const footerStyle = `
  padding: 24px 40px;
  text-align: center;
  color: #888888;
  font-size: 13px;
  border-top: 1px solid #f0ebe5;
`

export function verifyEmailTemplate(verifyUrl: string): string {
  return `
    <html>
    <body style="${baseStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🍳 ${APP_NAME}</h1>
        </div>
        <div style="${bodyStyle}">
          <h2 style="margin-top:0;">Verificá tu email</h2>
          <p>Gracias por registrarte. Hacé click en el botón para verificar tu dirección de email y activar tu cuenta.</p>
          <div style="text-align:center;">
            <a href="${verifyUrl}" style="${buttonStyle}">Verificar email</a>
          </div>
          <p style="color:#888888;font-size:13px;">Este link expira en 24 horas. Si no creaste una cuenta, podés ignorar este email.</p>
          <p style="color:#888888;font-size:13px;">Si el botón no funciona, copiá este link:<br><a href="${verifyUrl}" style="color:#c0392b;">${verifyUrl}</a></p>
        </div>
        <div style="${footerStyle}">
          <p>${APP_NAME} — Compartí tu pasión por la cocina</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function passwordResetTemplate(resetUrl: string): string {
  return `
    <html>
    <body style="${baseStyle}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🍳 ${APP_NAME}</h1>
        </div>
        <div style="${bodyStyle}">
          <h2 style="margin-top:0;">Resetear contraseña</h2>
          <p>Recibimos una solicitud para resetear la contraseña de tu cuenta. Hacé click en el botón para crear una nueva contraseña.</p>
          <div style="text-align:center;">
            <a href="${resetUrl}" style="${buttonStyle}">Resetear contraseña</a>
          </div>
          <p style="color:#888888;font-size:13px;">Este link expira en 1 hora. Si no solicitaste resetear tu contraseña, podés ignorar este email — tu cuenta está segura.</p>
          <p style="color:#888888;font-size:13px;">Si el botón no funciona, copiá este link:<br><a href="${resetUrl}" style="color:#c0392b;">${resetUrl}</a></p>
        </div>
        <div style="${footerStyle}">
          <p>${APP_NAME} — Compartí tu pasión por la cocina</p>
        </div>
      </div>
    </body>
    </html>
  `
}
