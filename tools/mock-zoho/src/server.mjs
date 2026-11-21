import { createServer } from 'node:http';
import { generateSeedData } from './seed.mjs';

const seed = generateSeedData();
const port = parseInt(process.env.PORT || '4010', 10);

const sendJson = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key'
  });
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key'
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  const path = url.pathname.replace(/^\/api\/v1\//, '/');

  // Support failure switch for testing (P5, P6)
  if (req.headers['x-mock-fail'] === '401') {
    return sendJson(res, 401, { code: 401, message: 'Invalid OAuth token' });
  }
  if (req.headers['x-mock-fail'] === '429') {
    return sendJson(res, 429, { code: 429, message: 'Too many requests to Zoho Books' });
  }
  if (req.headers['x-mock-fail'] === '500') {
    return sendJson(res, 500, { code: 500, message: 'Internal Zoho Books error' });
  }

  // /organizations
  if (path === '/organizations' || path === '/organization') {
    return sendJson(res, 200, {
      code: 0,
      message: 'success',
      organizations: [{ organization_id: 'org-karm-01', name: 'Karm Enterprises', currency_code: 'INR', time_zone: 'Asia/Kolkata' }],
      organization: { organization_id: 'org-karm-01', name: 'Karm Enterprises', currency_code: 'INR', time_zone: 'Asia/Kolkata' }
    });
  }

  // /contacts
  if (path === '/contacts') {
    return sendJson(res, 200, { code: 0, message: 'success', contacts: seed.contacts, page_context: { page: 1, per_page: 200, has_more_page: false } });
  }
  if (path.startsWith('/contacts/')) {
    const id = path.slice('/contacts/'.length);
    const item = seed.contacts.find(c => c.contact_id === id || c.contact_name === id) || seed.contacts[0];
    return sendJson(res, 200, { code: 0, message: 'success', contact: item });
  }

  // /items
  if (path === '/items') {
    return sendJson(res, 200, { code: 0, message: 'success', items: seed.items, page_context: { page: 1, per_page: 200, has_more_page: false } });
  }
  if (path.startsWith('/items/')) {
    const id = path.slice('/items/'.length);
    const item = seed.items.find(i => i.item_id === id) || seed.items[0];
    return sendJson(res, 200, { code: 0, message: 'success', item });
  }

  // /settings/taxes or /taxes
  if (path === '/settings/taxes' || path === '/taxes') {
    return sendJson(res, 200, { code: 0, message: 'success', taxes: seed.taxes });
  }

  // /invoices
  if (path === '/invoices') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const invNum = `INV-KE-${Date.now().toString().slice(-6)}`;
        const created = {
          invoice_id: `inv-created-${Date.now()}`,
          invoice_number: invNum,
          customer_name: 'Created via Mock',
          total: '1000.00',
          total_formatted: '₹1,000.00',
          balance: '1000.00',
          balance_formatted: '₹1,000.00',
          status: 'draft'
        };
        sendJson(res, 201, { code: 0, message: 'The invoice has been created.', invoice: created });
      });
      return;
    }
    return sendJson(res, 200, {
      code: 0,
      message: 'success',
      invoices: seed.invoices,
      page_context: { page: 1, per_page: 200, has_more_page: false }
    });
  }

  if (path.startsWith('/invoices/')) {
    const id = path.slice('/invoices/'.length);
    if (id.endsWith('/pdf')) {
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      res.end('%PDF-1.4\n%mock zoho invoice pdf\n%%EOF');
      return;
    }
    const item = seed.invoices.find(i => i.invoice_id === id || i.invoice_number === id) || seed.invoices[0];
    return sendJson(res, 200, { code: 0, message: 'success', invoice: item });
  }

  // Generic fallback for any other entity (estimates, bills, etc.)
  return sendJson(res, 200, {
    code: 0,
    message: 'success',
    data: seed.invoices[0],
    invoices: seed.invoices
  });
});

server.listen(port, () => {
  console.log(`Practice Zoho listening on http://localhost:${port} (seed: ${seed.contacts.length} contacts, ${seed.items.length} items, ${seed.invoices.length} invoices)`);
});
