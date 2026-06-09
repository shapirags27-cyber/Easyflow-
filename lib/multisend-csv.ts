import { isAddress } from "viem";

export type MultiSendCsvRow = {
  to: string;
  value: string;
  bps: string;
};

const ADDRESS_HEADERS = new Set(["address", "wallet", "to", "recipient", "addr"]);
const AMOUNT_HEADERS = new Set(["amount", "value", "opn", "qty", "quantity"]);
const BPS_HEADERS = new Set(["bps", "percent", "percentage", "share", "%"]);

function detectDelimiter(line: string) {
  const tabs = (line.match(/\t/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(cell: string) {
  return cell.toLowerCase().replace(/[^a-z%]/g, "");
}

function isHeaderRow(cells: string[]) {
  return cells.some((c) => {
    const h = normalizeHeader(c);
    return ADDRESS_HEADERS.has(h) || AMOUNT_HEADERS.has(h) || BPS_HEADERS.has(h);
  });
}

function columnIndex(headers: string[], aliases: Set<string>) {
  return headers.findIndex((h) => aliases.has(normalizeHeader(h)));
}

export function parseMultiSendCsv(text: string): {
  rows: MultiSendCsvRow[];
  errors: string[];
  hasAmounts: boolean;
  hasBps: boolean;
} {
  const errors: string[] = [];
  const rows: MultiSendCsvRow[] = [];
  let hasAmounts = false;
  let hasBps = false;

  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (rawLines.length === 0) {
    return { rows: [], errors: ["File is empty."], hasAmounts: false, hasBps: false };
  }

  const delimiter = detectDelimiter(rawLines[0]!);
  const firstCells = splitCsvLine(rawLines[0]!, delimiter);
  const hasHeader = isHeaderRow(firstCells);
  const startIndex = hasHeader ? 1 : 0;

  const addrCol = hasHeader
    ? columnIndex(firstCells, ADDRESS_HEADERS)
    : firstCells.findIndex((c) => isAddress(c as `0x${string}`));
  const amountCol = hasHeader ? columnIndex(firstCells, AMOUNT_HEADERS) : -1;
  const bpsCol = hasHeader ? columnIndex(firstCells, BPS_HEADERS) : -1;

  const resolvedAddrCol = addrCol >= 0 ? addrCol : 0;
  const resolvedValueCol =
    amountCol >= 0 ? amountCol : bpsCol >= 0 ? -1 : firstCells.length > 1 ? 1 : -1;
  const resolvedBpsCol = bpsCol >= 0 ? bpsCol : -1;

  for (let i = startIndex; i < rawLines.length; i++) {
    const cells = splitCsvLine(rawLines[i]!, delimiter);
    if (cells.every((c) => !c)) continue;

    const address = cells[resolvedAddrCol] ?? cells.find((c) => isAddress(c as `0x${string}`));

    if (!address || !isAddress(address as `0x${string}`)) {
      errors.push(`Line ${i + 1}: invalid address`);
      continue;
    }

    const bpsRaw = resolvedBpsCol >= 0 ? cells[resolvedBpsCol] : "";
    const valueRaw = resolvedValueCol >= 0 ? cells[resolvedValueCol] : "";

    if (bpsRaw) {
      const pct = bpsRaw.includes("%");
      const num = Number(bpsRaw.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(num) || num <= 0) {
        errors.push(`Line ${i + 1}: invalid bps/percent value`);
        continue;
      }
      hasBps = true;
      rows.push({
        to: address,
        value: "0",
        bps: pct ? String(Math.round(num * 100)) : String(Math.round(num))
      });
      continue;
    }

    if (valueRaw) {
      if (valueRaw.includes("%")) {
        const num = Number(valueRaw.replace(/[^0-9.]/g, ""));
        if (!Number.isFinite(num) || num <= 0) {
          errors.push(`Line ${i + 1}: invalid percent value`);
          continue;
        }
        hasBps = true;
        rows.push({ to: address, value: "0", bps: String(Math.round(num * 100)) });
      } else {
        const num = valueRaw.replace(/[^0-9.]/g, "");
        if (!num || Number(num) <= 0) {
          errors.push(`Line ${i + 1}: invalid amount`);
          continue;
        }
        hasAmounts = true;
        rows.push({ to: address, value: num, bps: "0" });
      }
      continue;
    }

    rows.push({ to: address, value: "0", bps: "0" });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No valid wallet addresses found.");
  }

  return { rows, errors, hasAmounts, hasBps };
}
