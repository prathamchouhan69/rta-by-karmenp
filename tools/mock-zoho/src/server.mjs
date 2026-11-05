import { createServer } from 'node:http';
const golden = { invoice_id:'inv-golden', invoice_number:'INV-KE-270031', total:'64944.84', total_formatted:'₹64,944.84', status:'overdue' };
createServer((req,res)=>{ const body=JSON.stringify({code:0,message:'success', invoices:[golden], data:golden}); res.writeHead(200,{'Content-Type':'application/json'}); res.end(body); }).listen(4010,()=>console.log('Practice Zoho listening on http://localhost:4010'));
