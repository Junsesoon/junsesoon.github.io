'use server';

import nodemailer from 'nodemailer';
import { emailConfig } from '@/constants';


export type ContactEmailResult = {
  success: boolean;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendContactEmail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactEmailResult> {
  const name = input.name?.trim() ?? '';
  const email = input.email?.trim() ?? '';
  const message = input.message?.trim() ?? '';

  if (!name || !email || !message) {
    return {
      success: false,
      message: '이름, 이메일, 메시지를 모두 입력해 주세요.',
    };
  }

  const {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser,
    pass: smtpPass,
    from: smtpFrom,
    to: recipient,
  } = emailConfig;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return {
      success: false,
      message: '이메일 전송 설정이 아직 구성되지 않았습니다. 서버 환경 변수(CONTACT_SMTP_HOST, CONTACT_SMTP_USER, CONTACT_SMTP_PASS, CONTACT_TO_EMAIL)를 설정해 주세요.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort || 587),
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom || smtpUser,
      to: recipient,
      replyTo: email,
      subject: `[Portfolio Contact] ${name}님으로부터 메시지`,
      text: `이름: ${name}\n이메일: ${email}\n\n메시지:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h3 style="margin-bottom: 8px;">새로운 연락 메시지</h3>
          <p><strong>이름:</strong> ${escapeHtml(name)}</p>
          <p><strong>이메일:</strong> ${escapeHtml(email)}</p>
          <p><strong>메시지:</strong></p>
          <div style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 8px;">${escapeHtml(message)}</div>
        </div>
      `,
    });

    return {
      success: true,
      message: '메시지가 성공적으로 전송되었습니다.',
    };
  } catch (error) {
    console.error('Contact email send failed:', error);
    return {
      success: false,
      message: '메시지 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }
}
