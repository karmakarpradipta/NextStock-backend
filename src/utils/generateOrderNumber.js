import prisma from "../config/db.js";

export const generateOrderNumber = async (prefix, model) => {
  const last = await prisma[model].findFirst({
    orderBy: { createdAt: "desc" },
    select: { [prefix === "PO" ? "orderNumber" : "invoiceNumber"]: true },
  });

  const field = prefix === "PO" ? "orderNumber" : "invoiceNumber";
  if (!last) return `${prefix}-00001`;

  const num = parseInt(last[field].split("-")[1]) + 1;
  return `${prefix}-${String(num).padStart(5, "0")}`;
};