// Comprehensive Mock Zoho Books seed data matching RULEBOOK P15
// ~25 customers, 12 vendors, 40 items, 120 invoices, GST tax cases

export function generateSeedData() {
  const customerNames = [
    'Dilip Buildcon Ltd', 'Apex Infra', 'Narmada Projects', 'Larsen & Toubro Ltd',
    'Tata Projects Ltd', 'GMR Infrastructure', 'Afcons Infrastructure', 'NCC Limited',
    'Hindustan Construction Co', 'IRB Infrastructure', 'KNR Constructions', 'PNC Infratech',
    'Ashoka Buildcon', 'JMC Projects', 'Simplex Infrastructures', 'Gayatri Projects',
    'Sadbhav Engineering', 'ITD Cementation', 'Ahluwalia Contracts', 'Capacite Infraprojects',
    'Welspun Enterprises', 'HG Infra Engineering', 'PSP Projects', 'Ramky Infrastructure',
    'Bhopal Municipal Corporation'
  ];

  const vendorNames = [
    'Bhopal Quarry Supplies', 'Rewa Cement Traders', 'Indore Steel Yard',
    'Jabalpur Aggregates', 'Ujjain Sand Depot', 'Gwalior Hardware Mart',
    'Satna Crushed Stones', 'Katni Mineral Logistics', 'Sagar Earthmovers',
    'Ratlam Fuel Station', 'Dewas Heavy Spares', 'Chhindwara Explosives Ltd'
  ];

  const itemTemplates = [
    { name: 'Stone dust', hsn: '2517', rate: '950.00' },
    { name: 'River sand', hsn: '2505', rate: '1250.00' },
    { name: '10mm aggregate', hsn: '2517', rate: '1100.00' },
    { name: '20mm aggregate', hsn: '2517', rate: '1150.00' },
    { name: '40mm aggregate', hsn: '2517', rate: '1050.00' },
    { name: 'Granular sub-base (GSB)', hsn: '2517', rate: '850.00' },
    { name: 'Wet mix macadam (WMM)', hsn: '2517', rate: '980.00' },
    { name: 'Crusher run', hsn: '2517', rate: '750.00' },
    { name: 'Fly ash Class F', hsn: '2621', rate: '450.00' },
    { name: 'OPC 53 Grade Cement', hsn: '2523', rate: '380.00' },
    { name: 'PPC Cement', hsn: '2523', rate: '350.00' },
    { name: 'TMT Rebars Fe500D 8mm', hsn: '7214', rate: '62000.00' },
    { name: 'TMT Rebars Fe500D 10mm', hsn: '7214', rate: '61500.00' },
    { name: 'TMT Rebars Fe500D 12mm', hsn: '7214', rate: '60000.00' },
    { name: 'TMT Rebars Fe500D 16mm', hsn: '7214', rate: '59500.00' },
    { name: 'TMT Rebars Fe500D 20mm', hsn: '7214', rate: '59000.00' },
    { name: 'TMT Rebars Fe500D 25mm', hsn: '7214', rate: '59000.00' },
    { name: 'Structural steel ISMC 100', hsn: '7216', rate: '64000.00' },
    { name: 'Structural steel ISMB 200', hsn: '7216', rate: '65000.00' },
    { name: 'MS Angle 50x50x6', hsn: '7216', rate: '63000.00' },
    { name: 'Binding wire 18 gauge', hsn: '7217', rate: '75.00' },
    { name: 'Ready mix concrete M25', hsn: '3824', rate: '4200.00' },
    { name: 'Ready mix concrete M30', hsn: '3824', rate: '4500.00' },
    { name: 'Ready mix concrete M40', hsn: '3824', rate: '5100.00' },
    { name: 'Micro silica / Silica fume', hsn: '2811', rate: '28000.00' },
    { name: 'Superplasticizer admixture', hsn: '3824', rate: '120.00' },
    { name: 'Curing compound acrylic', hsn: '3824', rate: '180.00' },
    { name: 'Precast box culvert 2x2m', hsn: '6810', rate: '48000.00' },
    { name: 'Precast drain cover slab', hsn: '6810', rate: '3500.00' },
    { name: 'Prestressed concrete girder', hsn: '6810', rate: '185000.00' },
    { name: 'Bitumen VG-30', hsn: '2713', rate: '46000.00' },
    { name: 'Bitumen VG-40', hsn: '2713', rate: '48500.00' },
    { name: 'Bitumen emulsion RS-1', hsn: '2715', rate: '39000.00' },
    { name: 'Geotextile non-woven 200gsm', hsn: '5603', rate: '65.00' },
    { name: 'Geogrid biaxial 30kN', hsn: '3926', rate: '110.00' },
    { name: 'PVC Perforated pipe 150mm', hsn: '3917', rate: '450.00' },
    { name: 'HDPE Corrugated pipe 300mm', hsn: '3917', rate: '1250.00' },
    { name: 'Gabion mesh galvanized 10x12', hsn: '7314', rate: '320.00' },
    { name: 'Thermoplastic road marking paint', hsn: '3208', rate: '145.00' },
    { name: 'Retroreflective road sign board', hsn: '8310', rate: '6500.00' }
  ];

  const taxes = [
    { tax_id: 'exempt', tax_name: 'GST Exempt', tax_percentage: '0.000' },
    { tax_id: 'gst0', tax_name: 'GST 0%', tax_percentage: '0.000' },
    { tax_id: 'gst5', tax_name: 'GST 5%', tax_percentage: '5.000' },
    { tax_id: 'gst12', tax_name: 'GST 12%', tax_percentage: '12.000' },
    { tax_id: 'gst18', tax_name: 'GST 18%', tax_percentage: '18.000' },
    { tax_id: 'gst28', tax_name: 'GST 28%', tax_percentage: '28.000' },
    { tax_id: 'cgst_sgst_18', tax_name: 'CGST 9% + SGST 9%', tax_percentage: '18.000' },
    { tax_id: 'igst_18', tax_name: 'IGST 18%', tax_percentage: '18.000' }
  ];

  const contacts = [];
  customerNames.forEach((name, idx) => {
    contacts.push({
      contact_id: `cust-${idx + 1}`,
      contact_name: name,
      contact_type: 'customer',
      outstanding: idx === 0 ? '64944.84' : `${(idx + 1) * 12500}.00`,
      outstanding_formatted: idx === 0 ? '₹64,944.84' : `₹${((idx + 1) * 12500).toLocaleString('en-IN')}.00`
    });
  });

  vendorNames.forEach((name, idx) => {
    contacts.push({
      contact_id: `vend-${idx + 1}`,
      contact_name: name,
      contact_type: 'vendor',
      outstanding: `${(idx + 1) * 8400}.00`,
      outstanding_formatted: `₹${((idx + 1) * 8400).toLocaleString('en-IN')}.00`
    });
  });

  const items = itemTemplates.map((t, idx) => ({
    item_id: `item-${idx + 1}`,
    name: t.name,
    hsn_or_sac: t.hsn,
    rate: t.rate,
    rate_formatted: `₹${Number(t.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }));

  const invoices = [
    {
      invoice_id: 'inv-golden',
      invoice_number: 'INV-KE-270031',
      customer_id: 'cust-1',
      customer_name: 'Dilip Buildcon Ltd',
      date: '2026-10-15',
      due_date: '2026-11-14',
      total: '64944.84',
      total_formatted: '₹64,944.84',
      balance: '64944.84',
      balance_formatted: '₹64,944.84',
      status: 'overdue'
    }
  ];

  const statuses = ['paid', 'overdue', 'sent', 'draft', 'open'];
  for (let i = 2; i <= 120; i++) {
    const custIdx = (i - 1) % customerNames.length;
    const invNum = `INV-KE-${270000 + i}`;
    const status = statuses[i % statuses.length];
    const rawTotal = (i * 1250.75).toFixed(2);
    const balance = status === 'paid' ? '0.00' : rawTotal;
    invoices.push({
      invoice_id: `inv-${i}`,
      invoice_number: invNum,
      customer_id: `cust-${custIdx + 1}`,
      customer_name: customerNames[custIdx],
      date: '2026-11-01',
      due_date: status === 'overdue' ? '2026-11-10' : '2026-12-01',
      total: rawTotal,
      total_formatted: `₹${Number(rawTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      balance: balance,
      balance_formatted: `₹${Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: status
    });
  }

  return { contacts, items, taxes, invoices };
}
