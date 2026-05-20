/**
 * @fileoverview Servicio de correo electrónico para LearningCards.
 * Configura Nodemailer para enviar correos transaccionales (como la recuperación de contraseña).
 * Cuenta con un fallback seguro que imprime los datos en consola en entornos de desarrollo sin SMTP.
 */

import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configuración SMTP desde variables de entorno
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const mailFrom = process.env.SMTP_FROM || '"LearningCards" <no-reply@learningcards.com>';

// Verificar si la configuración SMTP está completa
const isSmtpConfigured = Boolean(
  smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass
);

let transporter = null;

if (isSmtpConfigured) {
  console.log(`[MAILER] SMTP configurado en ${smtpConfig.host}:${smtpConfig.port}`);
  transporter = nodemailer.createTransport(smtpConfig);
} else {
  console.warn(
    '[MAILER] ADVERTENCIA: Las variables SMTP (.env) no están completamente configuradas. Los correos se imprimirán únicamente en la consola del servidor.'
  );
}

/**
 * Envía un correo electrónico con el código de recuperación.
 * @param {string} to - Dirección de correo electrónico del destinatario.
 * @param {string} code - Código de recuperación de 6 dígitos.
 * @param {string} userName - Nombre del usuario.
 * @returns {Promise<boolean>} Retorna true si el envío fue exitoso o simulado con éxito.
 */
export const sendRecoveryEmail = async (to, code, userName) => {
  const subject = 'Código de recuperación de contraseña - LearningCards';
  
  const textContent = `Hola ${userName},\n\nHas solicitado restablecer tu contraseña en LearningCards.\nTu código de recuperación es: ${code}\n\nEste código expira en 15 minutos.\nSi no solicitaste este cambio, puedes ignorar este correo.\n\nSaludos,\nEl equipo de LearningCards.`;
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">✦ LearningCards</h2>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Tu camino de aprendizaje continuo</p>
      </div>
      <div style="padding: 10px 0;">
        <h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">¡Hola, ${userName}! 👋</h3>
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en LearningCards. Usa el siguiente código de verificación temporal para continuar:
        </p>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px;">Código de verificación</span>
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; font-family: monospace; background-color: #e0e7ff; padding: 8px 20px; border-radius: 8px; display: inline-block;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; background-color: #f8fafc; border-left: 4px solid #e2e8f0; padding: 12px 16px; border-radius: 4px; margin-bottom: 25px;">
          <strong>Nota:</strong> Este código es válido por <strong>15 minutos</strong>. Si expira, tendrás que solicitar uno nuevo. Si tú no realizaste esta solicitud, puedes ignorar este correo con total tranquilidad.
        </p>
      </div>
      <div style="border-top: 2px solid #f1f5f9; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} LearningCards. Todos los derechos reservados.</p>
        <p style="margin: 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`[PASSWORD RECOVERY] ENVÍO DE CORREO SIMULADO A: ${to}`);
  console.log(`[PASSWORD RECOVERY] CÓDIGO GENERADO: ${code}`);
  console.log(`======================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: mailFrom,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[MAILER] Correo de recuperación enviado con éxito a ${to}`);
      return true;
    } catch (err) {
      console.error(`[MAILER] Error al enviar correo de recuperación a ${to}:`, err.message);
      return false;
    }
  }

  return true;
};
