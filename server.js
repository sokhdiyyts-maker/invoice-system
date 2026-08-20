const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// ការកំណត់ភ្ជាប់ទៅ SQL Server (ទាញពី Environment Variables ពេលឡើង Online)
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123',
    server: process.env.DB_SERVER || 'DESKTOP-9Q444NP', 
    database: process.env.DB_NAME || 'invoice_db',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: true
    }
};

// Route ដើម (Home Route) បង្ហាញ file invoice.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'invoice.html'));
});

// ១. API សម្រាប់ Update ទិន្នន័យទូទៅ
app.post('/api/update-invoice', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const { invoice_id, remaining_balance, total_paid, installments } = req.body;

        if (!invoice_id) {
            return res.status(400).json({ status: 'error', message: 'Missing invoice_id' });
        }

        const query = `
            MERGE INTO invoices AS target
            USING (SELECT @invoice_id AS invoice_id) AS source
            ON (target.invoice_id = source.invoice_id)
            WHEN MATCHED THEN
                UPDATE SET remaining_balance = @remaining_balance, total_paid = @total_paid, installments_status = @installments, updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (invoice_id, remaining_balance, total_paid, installments_status)
                VALUES (@invoice_id, @remaining_balance, @total_paid, @installments);
        `;

        await pool.request()
            .input('invoice_id', sql.VarChar, invoice_id)
            .input('remaining_balance', sql.Decimal(10, 2), remaining_balance)
            .input('total_paid', sql.Decimal(10, 2), total_paid)
            .input('installments', sql.NVarChar, JSON.stringify(installments))
            .query(query);

        res.json({ status: 'success', message: 'Saved successfully' });
    } catch (err) {
        console.error('Save Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ២. API សម្រាប់ Mark ថា PAID ដោយស្វ័យប្រវត្តិ
app.post('/api/mark-as-paid', async (req, res) => {
    try {
        const { invoice_id, month_number } = req.body;
        let pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('invoice_id', sql.VarChar, invoice_id)
            .query('SELECT * FROM invoices WHERE invoice_id = @invoice_id');

        let installments = {};
        if (result.recordset.length > 0) {
            let row = result.recordset[0];
            installments = JSON.parse(row.installments_status);
        } else {
            for (let i = 1; i <= 8; i++) {
                installments[`month_${i}`] = 'UNPAID';
            }
        }

        installments[`month_${month_number}`] = 'PAID';

        let paidCount = Object.values(installments).filter(status => status === 'PAID').length;
        let totalPaid = paidCount * 150;
        let remainingBalance = 1200 - totalPaid;

        const query = `
            MERGE INTO invoices AS target
            USING (SELECT @invoice_id AS invoice_id) AS source
            ON (target.invoice_id = source.invoice_id)
            WHEN MATCHED THEN
                UPDATE SET remaining_balance = @remaining_balance, total_paid = @total_paid, installments_status = @installments, updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (invoice_id, remaining_balance, total_paid, installments_status)
                VALUES (@invoice_id, @remaining_balance, @total_paid, @installments);
        `;

        await pool.request()
            .input('invoice_id', sql.VarChar, invoice_id)
            .input('remaining_balance', sql.Decimal(10, 2), remainingBalance)
            .input('total_paid', sql.Decimal(10, 2), totalPaid)
            .input('installments', sql.NVarChar, JSON.stringify(installments))
            .query(query);

        res.json({ status: 'success', message: `Month ${month_number} updated to PAID successfully!` });
    } catch (err) {
        console.error('Mark Paid Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ៣. API សម្រាប់ Get ទិន្នន័យបង្ហាញលើ Web
app.get('/api/get-invoice', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const invoice_id = req.query.invoice_id || 'INV-2026-001';

        let result = await pool.request()
            .input('invoice_id', sql.VarChar, invoice_id)
            .query('SELECT * FROM invoices WHERE invoice_id = @invoice_id');

        if (result.recordset.length > 0) {
            let row = result.recordset[0];
            res.json({
                status: 'success',
                data: {
                    invoice_id: row.invoice_id,
                    remaining_balance: row.remaining_balance,
                    total_paid: row.total_paid,
                    installments: JSON.parse(row.installments_status)
                }
            });
        } else {
            res.json({ status: 'not_found' });
        }
    } catch (err) {
        console.error('Get Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});