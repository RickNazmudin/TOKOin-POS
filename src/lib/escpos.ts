/**
 * ESC/POS Binary Generator for 58mm Thermal Receipt Printers (e.g. VSC TM-58V, POS-58, GOOJPRT)
 * Standard 58mm roll: 32 characters per line (Font A)
 */

export interface ReceiptItemData {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  invoiceNumber: string;
  createdAt: string | Date;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  cashierName?: string;
  items: ReceiptItemData[];
}

export interface StoreSettingsData {
  storeName?: string;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
}

// ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;

const CMD_INIT = [ESC, 0x40]; // Initialize printer
const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00];
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
const CMD_ALIGN_RIGHT = [ESC, 0x61, 0x02];
const CMD_BOLD_ON = [ESC, 0x45, 0x01];
const CMD_BOLD_OFF = [ESC, 0x45, 0x00];
const CMD_DOUBLE_ON = [GS, 0x21, 0x11]; // Double width & height
const CMD_NORMAL = [GS, 0x21, 0x00]; // Normal text size
const CMD_LINE_FEED = [0x0a];
const CMD_CUT = [GS, 0x56, 0x41, 0x03]; // Paper cut (with feed)

const MAX_COLS = 32; // Standard 58mm printer column width

/**
 * Format currency to Indonesian Rupiah string (e.g., Rp 15.000)
 */
function formatRupiahSimple(amount: number): string {
  return "Rp " + Math.round(amount).toLocaleString("id-ID");
}

/**
 * Pad two text columns across 32 character line (Left aligned & Right aligned)
 */
function formatTwoColumns(left: string, right: string, maxLen: number = MAX_COLS): string {
  const combinedLen = left.length + right.length;
  if (combinedLen >= maxLen) {
    const spaceForLeft = maxLen - right.length - 1;
    if (spaceForLeft > 3) {
      return left.substring(0, spaceForLeft) + " " + right;
    }
    return left + "\n" + right.padStart(maxLen, " ");
  }
  const spaces = " ".repeat(maxLen - combinedLen);
  return left + spaces + right;
}

/**
 * Format a 3-column line (Item name, Qty x Price, Subtotal)
 */
function formatItemLines(name: string, qty: number, price: number, subtotal: number): string {
  const qtyPrice = `${qty}x ${formatRupiahSimple(price)}`;
  const subtotalStr = formatRupiahSimple(subtotal);
  
  // Line 1: Item Name
  // Line 2: Qty x Price (left) ... Subtotal (right)
  const line2 = formatTwoColumns("  " + qtyPrice, subtotalStr);
  return `${name}\n${line2}\n`;
}

/**
 * Encode string to Uint8Array safely for ESC/POS thermal printers
 */
function encodeText(text: string): Uint8Array {
  // Replace unsupported special characters to safe standard ASCII
  const cleanText = text
    .replace(/[^\x00-\x7F]/g, " ") // Clean non-ASCII to space
    .replace(/\r\n/g, "\n");
    
  const encoder = new TextEncoder();
  return encoder.encode(cleanText);
}

/**
 * Combine multiple Uint8Arrays into one
 */
function concatByteArrays(...arrays: (number[] | Uint8Array)[]): Uint8Array {
  const normalized = arrays.map((arr) => (arr instanceof Uint8Array ? arr : new Uint8Array(arr)));
  const totalLength = normalized.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of normalized) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Generate full ESC/POS binary data for 58mm receipt
 */
export function generateReceiptEscPos(
  transaction: ReceiptData,
  storeSettings?: StoreSettingsData | null
): Uint8Array {
  const storeName = (storeSettings?.storeName || "TOKOin Warung").toUpperCase();
  const address = storeSettings?.address || "";
  const phone = storeSettings?.phone || "";
  const footer = storeSettings?.receiptFooter || "Terima kasih atas kunjungan Anda!";

  const separatorDash = "-".repeat(MAX_COLS) + "\n";
  const separatorDouble = "=".repeat(MAX_COLS) + "\n";

  const dateObj = new Date(transaction.createdAt);
  const dateFormatted = dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const chunks: (number[] | Uint8Array)[] = [
    CMD_INIT,
    
    // Header (Center aligned)
    CMD_ALIGN_CENTER,
    CMD_BOLD_ON,
    encodeText(`${storeName}\n`),
    CMD_BOLD_OFF,
    CMD_NORMAL,
  ];

  if (address) {
    chunks.push(encodeText(`${address}\n`));
  }
  if (phone) {
    chunks.push(encodeText(`Telp: ${phone}\n`));
  }

  chunks.push(
    encodeText(separatorDouble),

    // Transaction Meta (Left aligned)
    CMD_ALIGN_LEFT,
    encodeText(formatTwoColumns("No. Nota:", transaction.invoiceNumber) + "\n"),
    encodeText(formatTwoColumns("Waktu:", dateFormatted) + "\n"),
    encodeText(formatTwoColumns("Kasir:", transaction.cashierName || "Kasir") + "\n"),
    encodeText(separatorDash),

    // Items list
    encodeText(
      transaction.items
        .map((item) =>
          formatItemLines(item.productName, item.quantity, item.price, item.subtotal)
        )
        .join("")
    ),
    encodeText(separatorDash),

    // Totals
    encodeText(formatTwoColumns("Subtotal:", formatRupiahSimple(transaction.subtotal)) + "\n")
  );

  if (transaction.discount > 0) {
    chunks.push(
      encodeText(formatTwoColumns("Diskon:", `-${formatRupiahSimple(transaction.discount)}`) + "\n")
    );
  }

  chunks.push(
    CMD_BOLD_ON,
    encodeText(formatTwoColumns("TOTAL BAYAR:", formatRupiahSimple(transaction.total)) + "\n"),
    CMD_BOLD_OFF,
    encodeText(
      formatTwoColumns(
        "Metode Bayar:",
        transaction.paymentMethod === "CASH" ? "TUNAI" : "QRIS"
      ) + "\n"
    ),
    encodeText(formatTwoColumns("Diterima:", formatRupiahSimple(transaction.paidAmount)) + "\n"),
    encodeText(formatTwoColumns("Kembalian:", formatRupiahSimple(transaction.changeAmount)) + "\n"),
    encodeText(separatorDouble),

    // Footer (Center aligned)
    CMD_ALIGN_CENTER,
    encodeText(`${footer}\n`),
    encodeText("--- TOKOin POS UMKM ---\n"),
    CMD_LINE_FEED,
    CMD_LINE_FEED,
    CMD_LINE_FEED,
    CMD_CUT
  );

  return concatByteArrays(...chunks);
}

/**
 * Generate a short test print ESC/POS binary to verify connection
 */
export function generateTestReceiptEscPos(connectionType: string, deviceName: string): Uint8Array {
  const now = new Date().toLocaleTimeString("id-ID");
  const separator = "=".repeat(MAX_COLS) + "\n";

  return concatByteArrays(
    CMD_INIT,
    CMD_ALIGN_CENTER,
    CMD_BOLD_ON,
    encodeText("TOKOin POS PRINTER TEST\n"),
    CMD_BOLD_OFF,
    encodeText(separator),
    CMD_ALIGN_LEFT,
    encodeText(formatTwoColumns("Status:", "TERHUBUNG (OK)") + "\n"),
    encodeText(formatTwoColumns("Koneksi:", connectionType) + "\n"),
    encodeText(formatTwoColumns("Perangkat:", deviceName.substring(0, 18)) + "\n"),
    encodeText(formatTwoColumns("Waktu Uji:", now) + "\n"),
    encodeText(formatTwoColumns("Lebar Kertas:", "58mm (32 Col)") + "\n"),
    encodeText(separator),
    CMD_ALIGN_CENTER,
    encodeText("Printer siap digunakan untuk kasir!\n"),
    CMD_LINE_FEED,
    CMD_LINE_FEED,
    CMD_LINE_FEED,
    CMD_CUT
  );
}
