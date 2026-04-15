import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const isMailEnabled = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.smtpFrom);

let transporter;
const getTransporter = () => {
  if (!isMailEnabled()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx || !to) return;

  await tx.sendMail({
    from: env.smtpFromName ? `${env.smtpFromName} <${env.smtpFrom}>` : env.smtpFrom,
    to,
    subject,
    text,
    html
  });
};

export const sendOrderPlacedEmail = async ({ to, orderId, total }) => {
  const formattedTotal = Number(total || 0).toLocaleString("en-IN");

  await sendMail({
    to,
    subject: `Order Confirmed #${orderId}`,
    text: `Your order #${orderId} has been placed successfully. Total amount: INR ${formattedTotal}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 8px">Order Confirmed</h2>
        <p style="margin:0 0 8px">Your order <strong>#${orderId}</strong> has been placed successfully.</p>
        <p style="margin:0 0 16px">Total amount: <strong>INR ${formattedTotal}</strong></p>
        <p style="margin:0">Thank you for shopping with us.</p>
      </div>
    `
  });
};

export const sendOrderStatusEmail = async ({ to, orderId, status }) => {
  if (!["delivered", "cancelled"].includes(status)) return;

  const subject =
    status === "delivered"
      ? `Order Delivered #${orderId}`
      : `Order Cancelled #${orderId}`;

  const statusLabel = status === "delivered" ? "delivered" : "cancelled";

  await sendMail({
    to,
    subject,
    text: `Your order #${orderId} has been ${statusLabel}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 8px">Order Update</h2>
        <p style="margin:0 0 8px">Your order <strong>#${orderId}</strong> has been <strong>${statusLabel}</strong>.</p>
        <p style="margin:0">If you need help, contact support.</p>
      </div>
    `
  });
};
