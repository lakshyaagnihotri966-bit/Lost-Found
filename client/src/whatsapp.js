// Opens WhatsApp with a ready-made message. The person only presses Send.
export const waLink = (phone, text) =>
  `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
