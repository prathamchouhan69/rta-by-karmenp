# Zoho Books endpoint map

The proxy exposes versioned app routes and delegates to the Zoho Books API in live mode. API support, granted OAuth scopes, and availability must be confirmed against the owner's organization and data center before production writes.

| App resource | Zoho Books resource | API operations |
|---|---|---|
| Contacts | `/contacts` | List, read, create, update |
| Items | `/items` | List, read, create, update |
| Taxes | `/settings/taxes` | List, read, create, update |
| Invoices | `/invoices` | List, read, create, update; email and status actions |
| Estimates | `/estimates` | List, read, create, update |
| Sales orders | `/salesorders` | List, read, create, update |
| Delivery challans | `/deliverychallans` | List, read, create, update — verify availability |
| Credit notes | `/creditnotes` | List, read, create, update |
| Customer payments | `/customerpayments` | List, read, create, update |
| Purchase orders | `/purchaseorders` | List, read, create, update |
| Bills | `/bills` | List, read, create, update |
| Vendor credits | `/vendorcredits` | List, read, create, update |
| Vendor payments | `/vendorpayments` | List, read, create, update |
| Expenses | `/expenses` | List, read, create, update |
| Journals | `/journals` | List, read, create, update |
| Bank accounts | `/bankaccounts` | List, read, create, update |
| Bank transactions | `/banktransactions` | List, read, create, update |

The app also proxies a selected set of Zoho report endpoints: profit and loss, balance sheet, cash flow, aged receivables, aged payables, and tax summary. Statements/ledgers and bank-reconciliation workflows must be confirmed against the organization's available APIs; this map does not claim that every Zoho Books operation is supported.

All writes require an idempotency key. Computed financial totals remain Zoho-owned. The API does not expose a general delete route.
