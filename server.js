const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database ក្លែងក្លាយ (In-Memory Database)
let invoiceData = {
    invoice_id: "INV-2026-001",
    total_amount: 1300.00,
    deposit: 100.00,
    remaining_balance: 1200.00,
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

// API: Get Invoice Status
app.get('/api/get-invoice', (req, res) => {
    res.json({
        status: "success",
        data: invoiceData
    });
});

// API: Mark Month as Paid
app.post('/api/mark-as-paid', (req, res) => {
    const { month_number } = req.body;

    if (!month_number || month_number < 1 || month_number > 8) {
        return res.status(400).json({
            status: "error",
            message: "លេខខែមិនត្រឹមត្រូវ (Invalid month number)"
        });
    }

    const monthKey = `month_${month_number}`;
    invoiceData.installments[monthKey] = "PAID";

    // គណនាប្រាក់នៅខ្វះឡើងវិញ
    let paidMonthsCount = 0;
    for (let i = 1; i <= 8; i++) {
        if (invoiceData.installments[`month_${i}`] === "PAID") {
            paidMonthsCount++;
        }
    }
    invoiceData.remaining_balance = 1200.00 - (paidMonthsCount * 150.00);

    res.json({
        status: "success",
        message: `បានកត់ត្រាការបង់ប្រាក់ខែទី ${month_number} រួចរាល់`,
        data: invoiceData
    });
});

// Default Catch-all Route (កែប្រែត្រង់នេះដើម្បីការពារ Error)
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invoice.html'), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'invoice.html'));
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});