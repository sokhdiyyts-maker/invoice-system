const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. ភ្ជាប់ទៅកាន់ MongoDB Atlas (ប្រើ URI របស់អ្នក)
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://sokhdiyyts_db_user:psAYyZzd4GhtwmXm@cluster0.j5ocwpx.mongodb.net/invoice_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. បង្កើត Schema & Model
const invoiceSchema = new mongoose.Schema({
    invoice_id: { type: String, required: true, unique: true },
    total_amount: Number,
    deposit: Number,
    remaining_balance: Number,
    installments: {
        month_1: { type: String, default: "UNPAID" },
        month_2: { type: String, default: "UNPAID" },
        month_3: { type: String, default: "UNPAID" },
        month_4: { type: String, default: "UNPAID" },
        month_5: { type: String, default: "UNPAID" },
        month_6: { type: String, default: "UNPAID" },
        month_7: { type: String, default: "UNPAID" },
        month_8: { type: String, default: "UNPAID" }
    }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

// 3. API: Get Invoice Data
app.get('/api/get-invoice', async (req, res) => {
    try {
        let invoice = await Invoice.findOne({ invoice_id: "INV-2026-001" });
        
        if (!invoice) {
            invoice = await Invoice.create({
                invoice_id: "INV-2026-001",
                total_amount: 1300.00,
                deposit: 100.00,
                remaining_balance: 1200.00,
                installments: {
                    month_1: "UNPAID", month_2: "UNPAID", month_3: "UNPAID", month_4: "UNPAID",
                    month_5: "UNPAID", month_6: "UNPAID", month_7: "UNPAID", month_8: "UNPAID"
                }
            });
        }
        res.json({ status: "success", data: invoice });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 4. API: Mark Month as Paid
app.post('/api/mark-as-paid', async (req, res) => {
    try {
        const { month_number } = req.body;
        if (!month_number || month_number < 1 || month_number > 8) {
            return res.status(400).json({ status: "error", message: "លេខខែមិនត្រឹមត្រូវ" });
        }

        let invoice = await Invoice.findOne({ invoice_id: "INV-2026-001" });
        if (!invoice) {
            return res.status(404).json({ status: "error", message: "រកមិនឃើញ Invoice" });
        }

        invoice.installments[`month_${month_number}`] = "PAID";

        let paidMonthsCount = 0;
        for (let i = 1; i <= 8; i++) {
            if (invoice.installments[`month_${i}`] === "PAID") {
                paidMonthsCount++;
            }
        }
        invoice.remaining_balance = 1200.00 - (paidMonthsCount * 150.00);

        await invoice.save();

        res.json({
            status: "success",
            message: `បានកត់ត្រាការបង់ប្រាក់ខែទី ${month_number} រួចរាល់`,
            data: invoice
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// Catch-all Route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invoice.html'), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'invoice.html'));
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});