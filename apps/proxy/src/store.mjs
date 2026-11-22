import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const seed = {
  contacts: [
    { contact_id: 'c1', contact_name: 'Dilip Buildcon Ltd', contact_type: 'customer', outstanding: '64944.84', outstanding_formatted: '₹64,944.84', gstin: '23AAACD1234A1Z5', billing_address: 'Bhopal, Madhya Pradesh', contact_person: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@dilipbuildcon.com' },
    { contact_id: 'c2', contact_name: 'Apex Infra', contact_type: 'customer', outstanding: '18400.00', outstanding_formatted: '₹18,400.00', gstin: '23AABCA5678B2Z6', billing_address: 'Indore, Madhya Pradesh', contact_person: 'Suresh Patel', phone: '9876543211', email: 'suresh@apexinfra.com' },
    { contact_id: 'c3', contact_name: 'Narmada Projects', contact_type: 'customer', outstanding: '9080.00', outstanding_formatted: '₹9,080.00', gstin: '23AACCN9012C3Z7', billing_address: 'Jabalpur, Madhya Pradesh', contact_person: 'Mahesh Singh', phone: '9876543212', email: 'mahesh@narmadaprojects.com' },
    { contact_id: 'c4', contact_name: 'Vindhya Construction', contact_type: 'customer', outstanding: '125000.00', outstanding_formatted: '₹1,25,000.00', gstin: '23AADCV4321D4Z8', billing_address: 'Rewa, Madhya Pradesh', contact_person: 'Vikram Sharma', phone: '9876543213', email: 'vikram@vindhyaconstruction.com' },
    { contact_id: 'c5', contact_name: 'Satpura Builders', contact_type: 'customer', outstanding: '56700.50', outstanding_formatted: '₹56,700.50', gstin: '23AAECS5432E5Z9', billing_address: 'Hoshangabad, Madhya Pradesh', contact_person: 'Deepak Joshi', phone: '9876543214', email: 'deepak@satpurabuilders.com' },
    { contact_id: 'c6', contact_name: 'Mahakoshal Enterprises', contact_type: 'customer', outstanding: '234000.00', outstanding_formatted: '₹2,34,000.00', gstin: '23AAFEM6543F6Z0', billing_address: 'Sagar, Madhya Pradesh', contact_person: 'Ramesh Gupta', phone: '9876543215', email: 'ramesh@mahakoshal.com' },
    { contact_id: 'c7', contact_name: 'Bundelkhand Infra', contact_type: 'customer', outstanding: '89200.75', outstanding_formatted: '₹89,200.75', gstin: '23AAGBI7654G7Z1', billing_address: 'Chhatarpur, Madhya Pradesh', contact_person: 'Anil Verma', phone: '9876543216', email: 'anil@bundelkhandinfra.com' },
    { contact_id: 'c8', contact_name: 'Malwa Construction Co', contact_type: 'customer', outstanding: '156800.25', outstanding_formatted: '₹1,56,800.25', gstin: '23AAHCC8765H8Z2', billing_address: 'Ujjain, Madhya Pradesh', contact_person: 'Sunil Agarwal', phone: '9876543217', email: 'sunil@malwaconstruction.com' },
    { contact_id: 'c9', contact_name: 'Nimar Projects Ltd', contact_type: 'customer', outstanding: '45300.00', outstanding_formatted: '₹45,300.00', gstin: '23AAINP9876I9Z3', billing_address: 'Khandwa, Madhya Pradesh', contact_person: 'Manoj Tiwari', phone: '9876543218', email: 'manoj@nimarprojects.com' },
    { contact_id: 'c10', contact_name: 'Chambal Builders', contact_type: 'customer', outstanding: '201500.00', outstanding_formatted: '₹2,01,500.00', gstin: '23AAJCB0987J0Z4', billing_address: 'Morena, Madhya Pradesh', contact_person: 'Prakash Yadav', phone: '9876543219', email: 'prakash@chambalbuilders.com' },
    { contact_id: 'c11', contact_name: 'Maharashtra State Road Dev Corp', contact_type: 'customer', outstanding: '500000.00', outstanding_formatted: '₹5,00,000.00', gstin: '27AAKMS1234K1Z5', billing_address: 'Mumbai, Maharashtra', contact_person: 'Amit Deshmukh', phone: '9876543220', email: 'amit@msrdc.com' },
    { contact_id: 'c12', contact_name: 'Gujarat Urban Dev Company', contact_type: 'customer', outstanding: '750000.00', outstanding_formatted: '₹7,50,000.00', gstin: '24AALGU2345L2Z6', billing_address: 'Ahmedabad, Gujarat', contact_person: 'Rajesh Modi', phone: '9876543221', email: 'rajesh@gudc.com' },
    { contact_id: 'c13', contact_name: 'Rajasthan State Highway Auth', contact_type: 'customer', outstanding: '1200000.00', outstanding_formatted: '₹12,00,000.00', gstin: '08AAMRA3456M3Z7', billing_address: 'Jaipur, Rajasthan', contact_person: 'Sanjay Singh', phone: '9876543222', email: 'sanjay@rsha.com' },
    { contact_id: 'c14', contact_name: 'UP Expressways Industrial Dev', contact_type: 'customer', outstanding: '950000.00', outstanding_formatted: '₹9,50,000.00', gstin: '09AANUE4567N4Z8', billing_address: 'Lucknow, Uttar Pradesh', contact_person: 'Vivek Singh', phone: '9876543223', email: 'vivek@upeida.com' },
    { contact_id: 'c15', contact_name: 'Bihar Road Construction Dept', contact_type: 'customer', outstanding: '680000.00', outstanding_formatted: '₹6,80,000.00', gstin: '10AABRD5678O5Z9', billing_address: 'Patna, Bihar', contact_person: 'Rajiv Kumar', phone: '9876543224', email: 'rajiv@brd.gov.in' },
    { contact_id: 'c16', contact_name: 'Karnataka PWD', contact_type: 'customer', outstanding: '1100000.00', outstanding_formatted: '₹11,00,000.00', gstin: '29AACPW6789P6Z0', billing_address: 'Bangalore, Karnataka', contact_person: 'Ganesh Rao', phone: '9876543225', email: 'ganesh@karnatakapwd.gov.in' },
    { contact_id: 'c17', contact_name: 'Tamil Nadu Road Dev Corp', contact_type: 'customer', outstanding: '870000.00', outstanding_formatted: '₹8,70,000.00', gstin: '33AADTR7890Q7Z1', billing_address: 'Chennai, Tamil Nadu', contact_person: 'Karthik Rajan', phone: '9876543226', email: 'karthik@tnrdc.com' },
    { contact_id: 'c18', contact_name: 'Telangana R&B Dept', contact_type: 'customer', outstanding: '720000.00', outstanding_formatted: '₹7,20,000.00', gstin: '36AAETR8901R8Z2', billing_address: 'Hyderabad, Telangana', contact_person: 'Venkat Reddy', phone: '9876543227', email: 'venkat@trbd.gov.in' },
    { contact_id: 'c19', contact_name: 'West Bengal Highway Dept', contact_type: 'customer', outstanding: '540000.00', outstanding_formatted: '₹5,40,000.00', gstin: '19AAFWH9012S9Z3', billing_address: 'Kolkata, West Bengal', contact_person: 'Subrata Das', phone: '9876543228', email: 'subrata@wbhd.gov.in' },
    { contact_id: 'c20', contact_name: 'Odisha Works Dept', contact_type: 'customer', outstanding: '380000.00', outstanding_formatted: '₹3,80,000.00', gstin: '21AAGOW0123T0Z4', billing_address: 'Bhubaneswar, Odisha', contact_person: 'Prasad Mohanty', phone: '9876543229', email: 'prasad@owd.gov.in' },
    { contact_id: 'c21', contact_name: 'Assam PWD', contact_type: 'customer', outstanding: '290000.00', outstanding_formatted: '₹2,90,000.00', gstin: '18AAHAP1234U1Z5', billing_address: 'Guwahati, Assam', contact_person: 'Dipak Baruah', phone: '9876543230', email: 'dipak@assampwd.gov.in' },
    { contact_id: 'c22', contact_name: 'Kerala PWD', contact_type: 'customer', outstanding: '430000.00', outstanding_formatted: '₹4,30,000.00', gstin: '32AAIKP2345V2Z6', billing_address: 'Thiruvananthapuram, Kerala', contact_person: 'Nair Kumar', phone: '9876543231', email: 'nair@keralapwd.gov.in' },
    { contact_id: 'c23', contact_name: 'Punjab Mandi Board', contact_type: 'customer', outstanding: '310000.00', outstanding_formatted: '₹3,10,000.00', gstin: '03AAJMB3456W3Z7', billing_address: 'Chandigarh, Punjab', contact_person: 'Harpreet Singh', phone: '9876543232', email: 'harpreet@pmb.gov.in' },
    { contact_id: 'c24', contact_name: 'Haryana PWD', contact_type: 'customer', outstanding: '520000.00', outstanding_formatted: '₹5,20,000.00', gstin: '06AAKHP4567X4Z8', billing_address: 'Panchkula, Haryana', contact_person: 'Amit Sharma', phone: '9876543233', email: 'amit@hpwd.gov.in' },
    { contact_id: 'c25', contact_name: 'Delhi PWD', contact_type: 'customer', outstanding: '980000.00', outstanding_formatted: '₹9,80,000.00', gstin: '07AALDP5678Y5Z9', billing_address: 'New Delhi, Delhi', contact_person: 'Rajesh Gupta', phone: '9876543234', email: 'rajesh@delhipwd.gov.in' },
    { contact_id: 'v1', contact_name: 'Jindal Steel & Power Ltd', contact_type: 'vendor', outstanding: '2500000.00', outstanding_formatted: '₹25,00,000.00', gstin: '23AAJSP1234Z1Z5', billing_address: 'Raigarh, Chhattisgarh', contact_person: 'Naveen Jindal', phone: '9876543301', email: 'procurement@jindalsteel.com' },
    { contact_id: 'v2', contact_name: 'UltraTech Cement Ltd', contact_type: 'vendor', outstanding: '1800000.00', outstanding_formatted: '₹18,00,000.00', gstin: '23AAUTC2345Z2Z6', billing_address: 'Mumbai, Maharashtra', contact_person: 'Kumar Mangalam', phone: '9876543302', email: 'procurement@ultratechcement.com' },
    { contact_id: 'v3', contact_name: 'JSW Steel Ltd', contact_type: 'vendor', outstanding: '3200000.00', outstanding_formatted: '₹32,00,000.00', gstin: '23AAJSW3456Z3Z7', billing_address: 'Vijayanagar, Karnataka', contact_person: 'Sajjan Jindal', phone: '9876543303', email: 'procurement@jswsteel.com' },
    { contact_id: 'v4', contact_name: 'Tata Steel Ltd', contact_type: 'vendor', outstanding: '4100000.00', outstanding_formatted: '₹41,00,000.00', gstin: '23AATSL4567Z4Z8', billing_address: 'Jamshedpur, Jharkhand', contact_person: 'T.V. Narendran', phone: '9876543304', email: 'procurement@tatasteel.com' },
    { contact_id: 'v5', contact_name: 'ACC Limited', contact_type: 'vendor', outstanding: '1500000.00', outstanding_formatted: '₹15,00,000.00', gstin: '23AAACL5678Z5Z9', billing_address: 'Mumbai, Maharashtra', contact_person: 'Neeraj Akhoury', phone: '9876543305', email: 'procurement@acclimited.com' },
    { contact_id: 'v6', contact_name: 'Shree Cement Ltd', contact_type: 'vendor', outstanding: '1200000.00', outstanding_formatted: '₹12,00,000.00', gstin: '23AASCL6789Z6Z0', billing_address: 'Beawar, Rajasthan', contact_person: 'H.M. Bangur', phone: '9876543306', email: 'procurement@shreecement.com' },
    { contact_id: 'v7', contact_name: 'Ambuja Cements Ltd', contact_type: 'vendor', outstanding: '980000.00', outstanding_formatted: '₹9,80,000.00', gstin: '23AAACA7890Z7Z1', billing_address: 'Mumbai, Maharashtra', contact_person: 'Neeraj Akhoury', phone: '9876543307', email: 'procurement@ambujacement.com' },
    { contact_id: 'v8', contact_name: 'Dalmia Cement (Bharat) Ltd', contact_type: 'vendor', outstanding: '750000.00', outstanding_formatted: '₹7,50,000.00', gstin: '23AADCB8901Z8Z2', billing_address: 'New Delhi, Delhi', contact_person: 'Puneet Dalmia', phone: '9876543308', email: 'procurement@dalmiacement.com' },
    { contact_id: 'v9', contact_name: 'India Cements Ltd', contact_type: 'vendor', outstanding: '620000.00', outstanding_formatted: '₹6,20,000.00', gstin: '33AAICL9012Z9Z3', billing_address: 'Chennai, Tamil Nadu', contact_person: 'N. Srinivasan', phone: '9876543309', email: 'procurement@indiacements.com' },
    { contact_id: 'v10', contact_name: 'Ramco Cements Ltd', contact_type: 'vendor', outstanding: '480000.00', outstanding_formatted: '₹4,80,000.00', gstin: '33AARCL0123Z0Z4', billing_address: 'Chennai, Tamil Nadu', contact_person: 'P.R. Venketrama Raja', phone: '9876543310', email: 'procurement@ramcocements.com' },
    { contact_id: 'v11', contact_name: 'Heidelberg Cement India Ltd', contact_type: 'vendor', outstanding: '350000.00', outstanding_formatted: '₹3,50,000.00', gstin: '23AAHCI1234Z1Z5', billing_address: 'Gurugram, Haryana', contact_person: 'Jamshed Cooper', phone: '9876543311', email: 'procurement@heidelbergcement.com' },
    { contact_id: 'v12', contact_name: 'Birla Corporation Ltd', contact_type: 'vendor', outstanding: '280000.00', outstanding_formatted: '₹2,80,000.00', gstin: '23AABIC2345Z2Z6', billing_address: 'Kolkata, West Bengal', contact_person: 'Harsh Lodha', phone: '9876543312', email: 'procurement@birlacorp.com' }
  ],
  items: [
    { item_id: 'i1', name: 'Stone dust', hsn_or_sac: '2517', rate: '950.00', rate_formatted: '₹950.00', unit: 'MT', description: 'Crushed stone dust for concrete' },
    { item_id: 'i2', name: 'River sand', hsn_or_sac: '2505', rate: '1250.00', rate_formatted: '₹1,250.00', unit: 'MT', description: 'Natural river sand for construction' },
    { item_id: 'i3', name: '20mm Aggregate', hsn_or_sac: '2517', rate: '1100.00', rate_formatted: '₹1,100.00', unit: 'MT', description: '20mm crushed stone aggregate' },
    { item_id: 'i4', name: '10mm Aggregate', hsn_or_sac: '2517', rate: '1200.00', rate_formatted: '₹1,200.00', unit: 'MT', description: '10mm crushed stone aggregate' },
    { item_id: 'i5', name: 'M-Sand', hsn_or_sac: '2517', rate: '980.00', rate_formatted: '₹980.00', unit: 'MT', description: 'Manufactured sand for concrete' },
    { item_id: 'i6', name: 'TMT Steel 8mm', hsn_or_sac: '7214', rate: '58000.00', rate_formatted: '₹58,000.00', unit: 'MT', description: 'Fe500 TMT Steel bars 8mm' },
    { item_id: 'i7', name: 'TMT Steel 10mm', hsn_or_sac: '7214', rate: '57000.00', rate_formatted: '₹57,000.00', unit: 'MT', description: 'Fe500 TMT Steel bars 10mm' },
    { item_id: 'i8', name: 'TMT Steel 12mm', hsn_or_sac: '7214', rate: '56000.00', rate_formatted: '₹56,000.00', unit: 'MT', description: 'Fe500 TMT Steel bars 12mm' },
    { item_id: 'i9', name: 'TMT Steel 16mm', hsn_or_sac: '7214', rate: '55000.00', rate_formatted: '₹55,000.00', unit: 'MT', description: 'Fe500 TMT Steel bars 16mm' },
    { item_id: 'i10', name: 'TMT Steel 20mm', hsn_or_sac: '7214', rate: '54000.00', rate_formatted: '₹54,000.00', unit: 'MT', description: 'Fe500 TMT Steel bars 20mm' },
    { item_id: 'i11', name: 'TMT Steel 25mm', hsn_or_sac: '7214', rate: '53500.00', rate_formatted: '₹53,500.00', unit: 'MT', description: 'Fe500 TMT Steel bars 25mm' },
    { item_id: 'i11', name: 'TMT Steel 32mm', hsn_or_sac: '7214', rate: '53000.00', rate_formatted: '₹53,000.00', unit: 'MT', description: 'Fe500 TMT Steel bars 32mm' },
    { item_id: 'i12', name: 'OPC Cement 53 Grade', hsn_or_sac: '2523', rate: '380.00', rate_formatted: '₹380.00', unit: 'Bag', description: 'Ordinary Portland Cement 53 Grade' },
    { item_id: 'i13', name: 'PPC Cement', hsn_or_sac: '2523', rate: '340.00', rate_formatted: '₹340.00', unit: 'Bag', description: 'Portland Pozzolana Cement' },
    { item_id: 'i14', name: 'PSC Cement', hsn_or_sac: '2523', rate: '360.00', rate_formatted: '₹360.00', unit: 'Bag', description: 'Portland Slag Cement' },
    { item_id: 'i15', name: 'White Cement', hsn_or_sac: '2523', rate: '650.00', rate_formatted: '₹650.00', unit: 'Bag', description: 'White Portland Cement' },
    { item_id: 'i16', name: 'Ready Mix Concrete M20', hsn_or_sac: '9954', rate: '4200.00', rate_formatted: '₹4,200.00', unit: 'Cum', description: 'RMC M20 Grade Concrete' },
    { item_id: 'i17', name: 'Ready Mix Concrete M25', hsn_or_sac: '9954', rate: '4500.00', rate_formatted: '₹4,500.00', unit: 'Cum', description: 'RMC M25 Grade Concrete' },
    { item_id: 'i18', name: 'Ready Mix Concrete M30', hsn_or_sac: '9954', rate: '4800.00', rate_formatted: '₹4,800.00', unit: 'Cum', description: 'RMC M30 Grade Concrete' },
    { item_id: 'i19', name: 'Ready Mix Concrete M35', hsn_or_sac: '9954', rate: '5100.00', rate_formatted: '₹5,100.00', unit: 'Cum', description: 'RMC M35 Grade Concrete' },
    { item_id: 'i20', name: 'Ready Mix Concrete M40', hsn_or_sac: '9954', rate: '5400.00', rate_formatted: '₹5,400.00', unit: 'Cum', description: 'RMC M40 Grade Concrete' },
    { item_id: 'i21', name: 'Fly Ash', hsn_or_sac: '2621', rate: '1500.00', rate_formatted: '₹1,500.00', unit: 'MT', description: 'Class F Fly Ash for concrete' },
    { item_id: 'i22', name: 'GGBS', hsn_or_sac: '2618', rate: '2800.00', rate_formatted: '₹2,800.00', unit: 'MT', description: 'Ground Granulated Blast Furnace Slag' },
    { item_id: 'i23', name: 'Silica Fume', hsn_or_sac: '3802', rate: '12000.00', rate_formatted: '₹12,000.00', unit: 'MT', description: 'Microsilica for high strength concrete' },
    { item_id: 'i24', name: 'Superplasticizer', hsn_or_sac: '3824', rate: '180.00', rate_formatted: '₹180.00', unit: 'Ltr', description: 'Polycarboxylate Ether Superplasticizer' },
    { item_id: 'i25', name: 'Retarder', hsn_or_sac: '3824', rate: '150.00', rate_formatted: '₹150.00', unit: 'Ltr', description: 'Concrete Retarding Admixture' },
    { item_id: 'i26', name: 'Accelerator', hsn_or_sac: '3824', rate: '160.00', rate_formatted: '₹160.00', unit: 'Ltr', description: 'Concrete Accelerating Admixture' },
    { item_id: 'i27', name: 'Waterproofing Compound', hsn_or_sac: '3824', rate: '220.00', rate_formatted: '₹220.00', unit: 'Kg', description: 'Integral Waterproofing Admixture' },
    { item_id: 'i28', name: 'Curing Compound', hsn_or_sac: '3824', rate: '180.00', rate_formatted: '₹180.00', unit: 'Ltr', description: 'Concrete Curing Compound' },
    { item_id: 'i29', name: 'Formwork Release Agent', hsn_or_sac: '3824', rate: '95.00', rate_formatted: '₹95.00', unit: 'Ltr', description: 'Mould Release Agent for Formwork' },
    { item_id: 'i30', name: 'Reinforcement Coupler', hsn_or_sac: '7318', rate: '45.00', rate_formatted: '₹45.00', unit: 'Pc', description: 'Mechanical Rebar Coupler' },
    { item_id: 'i31', name: 'Anchor Bolt', hsn_or_sac: '7318', rate: '85.00', rate_formatted: '₹85.00', unit: 'Pc', description: 'Foundation Anchor Bolt' },
    { item_id: 'i32', name: 'HDPE Pipe 110mm', hsn_or_sac: '3917', rate: '180.00', rate_formatted: '₹180.00', unit: 'Mtr', description: 'HDPE Drainage Pipe 110mm' },
    { item_id: 'i33', name: 'HDPE Pipe 160mm', hsn_or_sac: '3917', rate: '320.00', rate_formatted: '₹320.00', unit: 'Mtr', description: 'HDPE Drainage Pipe 160mm' },
    { item_id: 'i34', name: 'RCC Pipe NP2 300mm', hsn_or_sac: '6903', rate: '850.00', rate_formatted: '₹850.00', unit: 'Mtr', description: 'NP2 Class RCC Hume Pipe 300mm' },
    { item_id: 'i35', name: 'RCC Pipe NP3 450mm', hsn_or_sac: '6903', rate: '1450.00', rate_formatted: '₹1,450.00', unit: 'Mtr', description: 'NP3 Class RCC Hume Pipe 450mm' },
    { item_id: 'i36', name: 'RCC Pipe NP4 600mm', hsn_or_sac: '6903', rate: '2200.00', rate_formatted: '₹2,200.00', unit: 'Mtr', description: 'NP4 Class RCC Hume Pipe 600mm' },
    { item_id: 'i37', name: 'Geotextile 200 GSM', hsn_or_sac: '5603', rate: '45.00', rate_formatted: '₹45.00', unit: 'Sqm', description: 'Non-Woven Geotextile 200 GSM' },
    { item_id: 'i38', name: 'Geogrid Uniaxial', hsn_or_sac: '5603', rate: '120.00', rate_formatted: '₹120.00', unit: 'Sqm', description: 'Uniaxial Geogrid for Reinforcement' },
    { item_id: 'i39', name: 'HDPE Geomembrane 1.5mm', hsn_or_sac: '3921', rate: '280.00', rate_formatted: '₹280.00', unit: 'Sqm', description: 'HDPE Geomembrane 1.5mm Thick' },
    { item_id: 'i40', name: 'PVC Waterstop', hsn_or_sac: '3916', rate: '180.00', rate_formatted: '₹180.00', unit: 'Mtr', description: 'PVC Waterstop for Construction Joints' }
  ],
  taxes: [
    { tax_id: 'gst0', tax_name: 'GST 0% (Exempt)', tax_percentage: '0.000', tax_type: 'exempt', cgst_percentage: '0.000', sgst_percentage: '0.000', igst_percentage: '0.000' },
    { tax_id: 'gst5', tax_name: 'GST 5%', tax_percentage: '5.000', tax_type: 'cgst_sgst', cgst_percentage: '2.500', sgst_percentage: '2.500', igst_percentage: '5.000' },
    { tax_id: 'gst12', tax_name: 'GST 12%', tax_percentage: '12.000', tax_type: 'cgst_sgst', cgst_percentage: '6.000', sgst_percentage: '6.000', igst_percentage: '12.000' },
    { tax_id: 'gst18', tax_name: 'GST 18%', tax_percentage: '18.000', tax_type: 'cgst_sgst', cgst_percentage: '9.000', sgst_percentage: '9.000', igst_percentage: '18.000' },
    { tax_id: 'gst28', tax_name: 'GST 28%', tax_percentage: '28.000', tax_type: 'cgst_sgst', cgst_percentage: '14.000', sgst_percentage: '14.000', igst_percentage: '28.000' },
    { tax_id: 'igst5', tax_name: 'IGST 5% (Inter-state)', tax_percentage: '5.000', tax_type: 'igst', cgst_percentage: '0.000', sgst_percentage: '0.000', igst_percentage: '5.000' },
    { tax_id: 'igst12', tax_name: 'IGST 12% (Inter-state)', tax_percentage: '12.000', tax_type: 'igst', cgst_percentage: '0.000', sgst_percentage: '0.000', igst_percentage: '12.000' },
    { tax_id: 'igst18', tax_name: 'IGST 18% (Inter-state)', tax_percentage: '18.000', tax_type: 'igst', cgst_percentage: '0.000', sgst_percentage: '0.000', igst_percentage: '18.000' },
    { tax_id: 'igst28', tax_name: 'IGST 28% (Inter-state)', tax_percentage: '28.000', tax_type: 'igst', cgst_percentage: '0.000', sgst_percentage: '0.000', igst_percentage: '28.000' },
    { tax_id: 'cgst2_5_sgst2_5', tax_name: 'CGST 2.5% + SGST 2.5%', tax_percentage: '5.000', tax_type: 'cgst_sgst', cgst_percentage: '2.500', sgst_percentage: '2.500', igst_percentage: '0.000' },
    { tax_id: 'cgst6_sgst6', tax_name: 'CGST 6% + SGST 6%', tax_percentage: '12.000', tax_type: 'cgst_sgst', cgst_percentage: '6.000', sgst_percentage: '6.000', igst_percentage: '0.000' },
    { tax_id: 'cgst9_sgst9', tax_name: 'CGST 9% + SGST 9%', tax_percentage: '18.000', tax_type: 'cgst_sgst', cgst_percentage: '9.000', sgst_percentage: '9.000', igst_percentage: '0.000' },
    { tax_id: 'cgst14_sgst14', tax_name: 'CGST 14% + SGST 14%', tax_percentage: '28.000', tax_type: 'cgst_sgst', cgst_percentage: '14.000', sgst_percentage: '14.000', igst_percentage: '0.000' }
  ],
  invoices: [
    { invoice_id: 'inv-golden', invoice_number: 'INV-KE-270031', customer_name: 'Dilip Buildcon Ltd', customer_id: 'c1', total: '64944.84', total_formatted: '₹64,944.84', balance: '64944.84', balance_formatted: '₹64,944.84', status: 'overdue', date: '2026-08-15', due_date: '2026-09-14', tax_id: 'gst18', line_items: [{ item_id: 'i6', quantity: '2.5', rate: '58000.00', tax_id: 'gst18' }, { item_id: 'i12', quantity: '50', rate: '380.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-001', invoice_number: 'INV-2026-0001', customer_name: 'Apex Infra', customer_id: 'c2', total: '18400.00', total_formatted: '₹18,400.00', balance: '18400.00', balance_formatted: '₹18,400.00', status: 'sent', date: '2026-10-01', due_date: '2026-10-31', tax_id: 'gst18', line_items: [{ item_id: 'i1', quantity: '10', rate: '950.00', tax_id: 'gst18' }, { item_id: 'i2', quantity: '5', rate: '1250.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-002', invoice_number: 'INV-2026-0002', customer_name: 'Narmada Projects', customer_id: 'c3', total: '9080.00', total_formatted: '₹9,080.00', balance: '9080.00', balance_formatted: '₹9,080.00', status: 'draft', date: '2026-10-15', due_date: '2026-11-14', tax_id: 'gst18', line_items: [{ item_id: 'i3', quantity: '20', rate: '1100.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-003', invoice_number: 'INV-2026-0003', customer_name: 'Vindhya Construction', customer_id: 'c4', total: '125000.00', total_formatted: '₹1,25,000.00', balance: '125000.00', balance_formatted: '₹1,25,000.00', status: 'sent', date: '2026-09-20', due_date: '2026-10-20', tax_id: 'gst18', line_items: [{ item_id: 'i8', quantity: '50', rate: '56000.00', tax_id: 'gst18' }, { item_id: 'i16', quantity: '30', rate: '4200.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-004', invoice_number: 'INV-2026-0004', customer_name: 'Satpura Builders', customer_id: 'c5', total: '56700.50', total_formatted: '₹56,700.50', balance: '56700.50', balance_formatted: '₹56,700.50', status: 'overdue', date: '2026-08-10', due_date: '2026-09-09', tax_id: 'gst18', line_items: [{ item_id: 'i9', quantity: '100', rate: '55000.00', tax_id: 'gst18' }, { item_id: 'i17', quantity: '20', rate: '4500.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-005', invoice_number: 'INV-2026-0005', customer_name: 'Mahakoshal Enterprises', customer_id: 'c6', total: '234000.00', total_formatted: '₹2,34,000.00', balance: '234000.00', balance_formatted: '₹2,34,000.00', status: 'sent', date: '2026-10-05', due_date: '2026-11-04', tax_id: 'gst18', line_items: [{ item_id: 'i10', quantity: '40', rate: '54000.00', tax_id: 'gst18' }, { item_id: 'i18', quantity: '25', rate: '4800.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-006', invoice_number: 'INV-2026-0006', customer_name: 'Bundelkhand Infra', customer_id: 'c7', total: '89200.75', total_formatted: '₹89,200.75', balance: '89200.75', balance_formatted: '₹89,200.75', status: 'paid', date: '2026-07-20', due_date: '2026-08-19', tax_id: 'gst18', line_items: [{ item_id: 'i7', quantity: '25', rate: '57000.00', tax_id: 'gst18' }, { item_id: 'i20', quantity: '15', rate: '5400.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-007', invoice_number: 'INV-2026-0007', customer_name: 'Malwa Construction Co', customer_id: 'c8', total: '156800.25', total_formatted: '₹1,56,800.25', balance: '0.00', balance_formatted: '₹0.00', status: 'paid', date: '2026-06-15', due_date: '2026-07-15', tax_id: 'gst18', line_items: [{ item_id: 'i12', quantity: '200', rate: '380.00', tax_id: 'gst18' }, { item_id: 'i21', quantity: '50', rate: '1500.00', tax_id: 'gst5' }] },
    { invoice_id: 'inv-008', invoice_number: 'INV-2026-0008', customer_name: 'Nimar Projects Ltd', customer_id: 'c9', total: '45300.00', total_formatted: '₹45,300.00', balance: '45300.00', balance_formatted: '₹45,300.00', status: 'overdue', date: '2026-08-25', due_date: '2026-09-24', tax_id: 'gst12', line_items: [{ item_id: 'i2', quantity: '30', rate: '1250.00', tax_id: 'gst12' }, { item_id: 'i4', quantity: '25', rate: '1200.00', tax_id: 'gst12' }] },
    { invoice_id: 'inv-009', invoice_number: 'INV-2026-0009', customer_name: 'Chambal Builders', customer_id: 'c10', total: '201500.00', total_formatted: '₹2,01,500.00', balance: '201500.00', balance_formatted: '₹2,01,500.00', status: 'sent', date: '2026-09-10', due_date: '2026-10-10', tax_id: 'gst18', line_items: [{ item_id: 'i9', quantity: '100', rate: '55000.00', tax_id: 'gst18' }, { item_id: 'i18', quantity: '20', rate: '4800.00', tax_id: 'gst18' }] },
    { invoice_id: 'inv-010', invoice_number: 'INV-2026-0010', customer_name: 'Maharashtra State Road Dev Corp', customer_id: 'c11', total: '500000.00', total_formatted: '₹5,00,000.00', balance: '500000.00', balance_formatted: '₹5,00,000.00', status: 'sent', date: '2026-10-01', due_date: '2026-11-30', tax_id: 'igst18', line_items: [{ item_id: 'i8', quantity: '150', rate: '56000.00', tax_id: 'igst18' }, { item_id: 'i19', quantity: '80', rate: '5100.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-011', invoice_number: 'INV-2026-0011', customer_name: 'Gujarat Urban Dev Company', customer_id: 'c12', total: '750000.00', total_formatted: '₹7,50,000.00', balance: '750000.00', balance_formatted: '₹7,50,000.00', status: 'draft', date: '2026-10-10', due_date: '2026-12-09', tax_id: 'igst18', line_items: [{ item_id: 'i10', quantity: '100', rate: '54000.00', tax_id: 'igst18' }, { item_id: 'i22', quantity: '40', rate: '2800.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-012', invoice_number: 'INV-2026-0012', customer_name: 'Rajasthan State Highway Auth', customer_id: 'c13', total: '1200000.00', total_formatted: '₹12,00,000.00', balance: '1200000.00', balance_formatted: '₹12,00,000.00', status: 'sent', date: '2026-09-01', due_date: '2026-10-31', tax_id: 'igst18', line_items: [{ item_id: 'i9', quantity: '300', rate: '55000.00', tax_id: 'igst18' }, { item_id: 'i17', quantity: '50', rate: '4500.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-013', invoice_number: 'INV-2026-0013', customer_name: 'UP Expressways Industrial Dev', customer_id: 'c14', total: '950000.00', total_formatted: '₹9,50,000.00', balance: '950000.00', balance_formatted: '₹9,50,000.00', status: 'overdue', date: '2026-07-15', due_date: '2026-08-14', tax_id: 'igst18', line_items: [{ item_id: 'i10', quantity: '200', rate: '54000.00', tax_id: 'igst18' }, { item_id: 'i20', quantity: '40', rate: '5400.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-014', invoice_number: 'INV-2026-0014', customer_name: 'Bihar Road Construction Dept', customer_id: 'c15', total: '680000.00', total_formatted: '₹6,80,000.00', balance: '680000.00', balance_formatted: '₹6,80,000.00', status: 'sent', date: '2026-08-01', due_date: '2026-09-30', tax_id: 'igst18', line_items: [{ item_id: 'i11', quantity: '100', rate: '53500.00', tax_id: 'igst18' }, { item_id: 'i23', quantity: '20', rate: '12000.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-015', invoice_number: 'INV-2026-0015', customer_name: 'Karnataka PWD', customer_id: 'c16', total: '1100000.00', total_formatted: '₹11,00,000.00', balance: '1100000.00', balance_formatted: '₹11,00,000.00', status: 'sent', date: '2026-09-20', due_date: '2026-11-19', tax_id: 'igst18', line_items: [{ item_id: 'i12', quantity: '500', rate: '380.00', tax_id: 'igst18' }, { item_id: 'i24', quantity: '100', rate: '180.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-016', invoice_number: 'INV-2026-0016', customer_name: 'Tamil Nadu Road Dev Corp', customer_id: 'c17', total: '870000.00', total_formatted: '₹8,70,000.00', balance: '870000.00', balance_formatted: '₹8,70,000.00', status: 'paid', date: '2026-05-01', due_date: '2026-06-30', tax_id: 'igst18', line_items: [{ item_id: 'i8', quantity: '200', rate: '56000.00', tax_id: 'igst18' }, { item_id: 'i25', quantity: '80', rate: '160.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-017', invoice_number: 'INV-2026-0017', customer_name: 'Telangana R&B Dept', customer_id: 'c18', total: '720000.00', total_formatted: '₹7,20,000.00', balance: '720000.00', balance_formatted: '₹7,20,000.00', status: 'sent', date: '2026-10-10', due_date: '2026-12-09', tax_id: 'igst18', line_items: [{ item_id: 'i9', quantity: '150', rate: '55000.00', tax_id: 'igst18' }, { item_id: 'i26', quantity: '60', rate: '150.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-018', invoice_number: 'INV-2026-0018', customer_name: 'West Bengal Highway Dept', customer_id: 'c19', total: '540000.00', total_formatted: '₹5,40,000.00', balance: '540000.00', balance_formatted: '₹5,40,000.00', status: 'sent', date: '2026-09-15', due_date: '2026-11-14', tax_id: 'igst18', line_items: [{ item_id: 'i10', quantity: '150', rate: '54000.00', tax_id: 'igst18' }, { item_id: 'i27', quantity: '40', rate: '220.00', tax_id: 'igst18' }] },
    { invoice_id: 'inv-019', invoice_number: 'INV-2026-0019', customer_name: 'Odisha Works Dept', customer_id: 'c20', total: '380000.00', total_formatted: '₹3,80,000.00', balance: '380000.00', balance_formatted: '₹3,80,000.00', status: 'overdue', date: '2026-07-25', due_date: '2026-08-24', tax_id: 'igst12', line_items: [{ item_id: 'i3', quantity: '200', rate: '1100.00', tax_id: 'igst12' }, { item_id: 'i28', quantity: '50', rate: '95.00', tax_id: 'igst12' }] },
    { invoice_id: 'inv-020', invoice_number: 'INV-2026-0020', customer_name: 'Assam PWD', customer_id: 'c21', total: '290000.00', total_formatted: '₹2,90,000.00', balance: '290000.00', balance_formatted: '₹2,90,000.00', status: 'sent', date: '2026-10-20', due_date: '2026-12-19', tax_id: 'igst12', line_items: [{ item_id: 'i4', quantity: '150', rate: '1200.00', tax_id: 'igst12' }, { item_id: 'i29', quantity: '30', rate: '45.00', tax_id: 'igst12' }] }
  ],
  estimates: [],
  salesorders: [],
  deliverychallans: [],
  creditnotes: [],
  customerpayments: [],
  purchaseorders: [],
  bills: [],
  vendorcredits: [],
  vendorpayments: [],
  expenses: [],
  journals: [],
  bankaccounts: [],
  banktransactions: []
};

const blankState = () => ({ version: 1, records: structuredClone(seed), idempotency: {}, audit: [] });
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const idKeys = { taxes: 'tax_id' };

export async function createStore(directory, databaseUrl, { seedPracticeData = true } = {}) {
  if (databaseUrl) {
    const { createPostgresStore } = await import('./postgres-store.mjs');
    return createPostgresStore(databaseUrl, seedPracticeData ? seed : {});
  }

  const file = join(directory, 'karm-proxy.json');
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  let state;
  try {
    state = JSON.parse(await readFile(file, 'utf8'));
    if (state.version !== 1 || typeof state.records !== 'object' || typeof state.idempotency !== 'object' || !Array.isArray(state.audit)) {
      throw new Error('Unsupported or invalid practice-store format');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Could not load practice store: ${error.message}`);
    state = blankState();
  }

  let pendingWrite = Promise.resolve();
  const persist = () => {
    const snapshot = JSON.stringify(state);
    const operation = pendingWrite.then(async () => {
      const temporary = `${file}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, snapshot, { mode: 0o600, flag: 'wx' });
        await rename(temporary, file);
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
    });
    pendingWrite = operation.catch(() => {});
    return operation;
  };

  return {
    async list(entity, query = {}) {
      const entries = state.records[entity] ?? [];
      const needle = query.search_text?.toLowerCase();
      const filtered = entries.filter((entry) => {
        if (query.contact_type && entry.contact_type !== query.contact_type) return false;
        if (!needle) return true;
        return JSON.stringify(entry).toLowerCase().includes(needle);
      });
      const page = Math.max(1, Number(query.page) || 1);
      const perPage = Math.min(200, Math.max(1, Number(query.per_page) || 200));
      const start = (page - 1) * perPage;
      return { [entity]: filtered.slice(start, start + perPage), page_context: { page, per_page: perPage, has_more_page: start + perPage < filtered.length } };
    },
    async get(entity, id) {
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      return (state.records[entity] ?? []).find((entry) => String(entry[idKey] ?? entry.id) === id) ?? null;
    },
    async create(entity, body) {
      const id = randomUUID();
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const record = { ...body, [idKey]: id, status: body.status ?? 'draft' };
      state.records[entity] ??= [];
      state.records[entity].unshift(record);
      await persist();
      return record;
    },
    async update(entity, id, body) {
      const entries = state.records[entity] ?? [];
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const index = entries.findIndex((entry) => String(entry[idKey] ?? entry.id) === id);
      if (index < 0) return null;
      entries[index] = { ...entries[index], ...body, [idKey]: id };
      await persist();
      return entries[index];
    },
    async getIdempotency(key) {
      return state.idempotency[key] ?? null;
    },
    async reserveIdempotency(key, request) {
      if (state.idempotency[key]) return { ...state.idempotency[key], created: false };
      state.idempotency[key] = { fingerprint: fingerprint(request), status: 'pending', response: null };
      await persist();
      return { ...state.idempotency[key], created: true };
    },
    async saveIdempotency(key, request, response) {
      state.idempotency[key] = { fingerprint: fingerprint(request), status: 'complete', response };
      await persist();
    },
    async recordAudit(entry) {
      state.audit.unshift({ ...entry, audit_id: randomUUID(), time: new Date().toISOString() });
      state.audit.length = Math.min(state.audit.length, 10000);
      await persist();
    },
    async listAudit(limit = 100) {
      return state.audit.slice(0, Math.min(500, Math.max(1, limit)));
    },
    requestFingerprint: fingerprint
  };
}
