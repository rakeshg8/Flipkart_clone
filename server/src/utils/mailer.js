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

const formatItemsForEmail = (items = []) =>
  items
    .map((item) => {
      const name = item?.products?.name || "Product";
      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.price_at_purchase || 0);
      const lineTotal = unitPrice * quantity;
      return {
        name,
        quantity,
        unitPrice,
        lineTotal,
        image: item?.products?.images?.[0] || ""
      };
    })
    .filter((item) => item.quantity > 0);

const buildItemsHtml = (items = []) => {
  if (!items.length) return "";

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb" />` : ""}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;vertical-align:top;">${item.name}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;vertical-align:top;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;vertical-align:top;text-align:right;">INR ${item.lineTotal.toLocaleString("en-IN")}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:12px 0 16px;background:#fff">
      <thead>
        <tr style="background:#f8fafc;color:#334155;text-align:left;">
          <th style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:600;">Image</th>
          <th style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:600;">Item</th>
          <th style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:600;text-align:center;">Qty</th>
          <th style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:600;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

export const sendOrderPlacedEmail = async ({ to, orderId, total, items = [] }) => {
  const formattedTotal = Number(total || 0).toLocaleString("en-IN");
  const normalizedItems = formatItemsForEmail(items);

  const itemsText = normalizedItems
    .map((item) => `${item.name} x${item.quantity} - INR ${item.lineTotal.toLocaleString("en-IN")}`)
    .join("\n");

  await sendMail({
    to,
    subject: `Order Confirmed #${orderId}`,
    text: `Your order #${orderId} has been placed successfully.\n${itemsText ? `\nItems:\n${itemsText}\n` : ""}\nTotal amount: INR ${formattedTotal}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 8px">Order Confirmed</h2>
        <p style="margin:0 0 8px">Your order <strong>#${orderId}</strong> has been placed successfully.</p>
        ${buildItemsHtml(normalizedItems)}
        <p style="margin:0 0 16px">Total amount: <strong>INR ${formattedTotal}</strong></p>
        <p style="margin:0">Thank you for shopping with us.</p>
      </div>
    `
  });
};

export const sendOrderStatusEmail = async ({ to, orderId, status, total, items = [] }) => {
  if (!["delivered", "cancelled"].includes(status)) return;

  const subject =
    status === "delivered"
      ? `Order Delivered #${orderId}`
      : `Order Cancelled #${orderId}`;

  const statusLabel = status === "delivered" ? "delivered" : "cancelled";
  const formattedTotal = Number(total || 0).toLocaleString("en-IN");
  const normalizedItems = formatItemsForEmail(items);

  const itemsText = normalizedItems
    .map((item) => `${item.name} x${item.quantity} - INR ${item.lineTotal.toLocaleString("en-IN")}`)
    .join("\n");

  await sendMail({
    to,
    subject,
    text: `Your order #${orderId} has been ${statusLabel}.\n${itemsText ? `\nItems:\n${itemsText}\n` : ""}\nTotal amount: INR ${formattedTotal}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 8px">Order Update</h2>
        <p style="margin:0 0 8px">Your order <strong>#${orderId}</strong> has been <strong>${statusLabel}</strong>.</p>
        ${buildItemsHtml(normalizedItems)}
        <p style="margin:0 0 16px">Total amount: <strong>INR ${formattedTotal}</strong></p>
        <p style="margin:0">If you need help, contact support.</p>
      </div>
    `
  });
};
