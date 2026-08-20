const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// បង្ហាញ Static Files ទាំងអស់ (HTML, CSS, JS, Images) ក្នុង Folder
app.use(express.static(__dirname));

// ទិន្នន័យសាកល្បង (Mock Data) សម្រាប់តេស្តលើ Online
let mockInvoiceData = {
    invoice_id: "INV-2026-001",
    remaining_balance: 1200.00,
    total_paid: 0.00,
    installments: {
        month_1: "UNPAID",
        month_2: "UNPAID",
        month_3: "UNPAID",
        month_4: "UNPAID",
        month_5: "UNPAID",
        month_6: "UNPAID",
        month_7: "UNPAID",
        month_8: "UNPAID"
    }
};

// Route ដើម (Home Route '/') សម្រាប់បើក file invoice.html ស្វ័យប្រវត្តិ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'invoice.html'));
});

// 1. API សម្រាប់ Get ទិន្នន័យបង្ហាញលើ Web
app.get('/api/get-invoice', (req, res) => {
    res.json({
        status: 'success',
        data: mockInvoiceData
    });
});

// 2. API សម្រាប់ Update ទិន្នន័យ
app.post('/api/update-invoice', (req, res) => {
    const { remaining_balance, total_paid, installments } = req.body;
    if (remaining_balance !== undefined) mockInvoiceData.remaining_balance = remaining_balance;
    if (total_paid !== undefined) mockInvoiceData.total_paid = total_paid;
    if (installments) mockInvoiceData.installments = installments;

    res.json({ status: 'success', message: 'Saved successfully' });
});

// 3. API សម្រាប់ Mark ថា PAID
app.post('/api/mark-as-paid', (req, res) => {
    const { month_number } = req.body;
    if (month_number) {
        mockInvoiceData.installments[`month_${month_number}`] = 'PAID';
        
        let paidCount = Object.values(mockInvoiceData.installments).filter(status => status === 'PAID').length;
        mockInvoiceData.total_paid = paidCount * 150;
        mockInvoiceData.remaining_balance = 1200 - mockInvoiceData.total_paid;
    }
    res.json({ status: 'success', message: `Month ${month_number} updated to PAID!` });
});

// បើក Server ឱ្យដំណើរការ
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});