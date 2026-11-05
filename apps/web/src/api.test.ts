import { describe, expect, it } from "vitest";
import {
  formatDate,
  invoiceId,
  invoiceStatus,
  isOpenInvoice,
  recordId,
  recordName,
  statusTone,
  stringField,
} from "./api";

describe("Zoho response display helpers", () => {
  it("uses the supplied record identifiers and names", () => {
    expect(recordId({ invoice_id: "inv-1" })).toBe("inv-1");
    expect(invoiceId({ invoice_id: "inv-1", customer_id: "cust-1" })).toBe("inv-1");
    expect(invoiceId({ customer_id: "cust-1" })).toBe("");
    expect(recordName({ customer_name: "Customer record" })).toBe("Customer record");
    expect(stringField({ outstanding_formatted: "₹1,250.00" }, "outstanding_formatted")).toBe("₹1,250.00");
  });

  it("classifies invoice status without deriving financial values", () => {
    expect(invoiceStatus({ status: "overdue" })).toBe("overdue");
    expect(isOpenInvoice({ status: "overdue" })).toBe(true);
    expect(isOpenInvoice({ status: "paid" })).toBe(false);
    expect(statusTone("overdue")).toBe("amber");
    expect(statusTone("void")).toBe("rose");
  });

  it("formats server-provided dates and preserves unknown values", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate("Not-a-date")).toBe("Not-a-date");
    expect(formatDate("2026-01-05")).toMatch(/Jan/);
  });
});
