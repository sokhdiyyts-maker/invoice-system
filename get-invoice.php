<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ការកំណត់ការភ្ជាប់ទៅកាន់ SQL Server របស់អ្នក
$serverName = "DESKTOP-9Q444NP"; 
$connectionOptions = array(
    "Database" => "invoice_db",
    "Uid" => "sa",            // Username របស់ SQL Server
    "PWD" => "123",        // Password របស់ SQL Server (សូមដូរតាមលេខសម្ងាត់ពិតប្រាកដរបស់អ្នក)
    "CharacterSet" => "UTF-8"
);

// បង្កើតការភ្ជាប់ទៅ Database
$conn = sqlsrv_connect($serverName, $connectionOptions);

if (!$conn) {
    echo json_encode(["status" => "error", "message" => "DB Connection Failed"]);
    exit();
}

$invoice_id = isset($_GET['invoice_id']) ? $_GET['invoice_id'] : 'INV-2026-001';

$sql = "SELECT * FROM invoices WHERE invoice_id = ?";
$params = array($invoice_id);
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    echo json_encode([
        "status" => "success",
        "data" => [
            "invoice_id" => $row['invoice_id'],
            "remaining_balance" => $row['remaining_balance'],
            "total_paid" => $row['total_paid'],
            "installments" => json_decode($row['installments_status'], true)
        ]
    ]);
} else {
    echo json_encode(["status" => "not_found"]);
}

if ($stmt) sqlsrv_free_stmt($stmt);
sqlsrv_close($conn);
?>