<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// បើក Display Error ដើម្បីងាយស្រួលមើលពេលមានបញ្ហា
ini_set('display_errors', 1);
error_reporting(E_ALL);

// ការកំណត់ការភ្ជាប់ទៅកាន់ SQL Server របស់អ្នក
$serverName = "DESKTOP-9Q444NP"; 
$connectionOptions = array(
    "Database" => "invoice_db",
    "Uid" => "sa",            // Username របស់ SQL Server
    "PWD" => "123456",        // Password របស់ SQL Server (សូមដូរតាមលេខសម្ងាត់ពិតប្រាកដរបស់អ្នក)
    "CharacterSet" => "UTF-8"
);

// បង្កើតការភ្ជាប់ទៅ Database
$conn = sqlsrv_connect($serverName, $connectionOptions);

if (!$conn) {
    echo json_encode([
        "status" => "error", 
        "message" => "DB Connection Failed: " . print_r(sqlsrv_errors(), true)
    ]);
    exit();
}

// ទទួលទិន្នន័យ JSON ដែលផ្ញើមកពី HTML
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if ($data && isset($data['invoice_id'])) {
    $invoice_id = $data['invoice_id'];
    $remaining_balance = (float)$data['remaining_balance'];
    $total_paid = (float)$data['total_paid'];
    $installments = json_encode($data['installments']);

    // MERGE Query សម្រាប់ SQL Server (Update បើមានស្រាប់ ឬ Insert បើមិនទាន់មាន)
    $sql = "MERGE INTO invoices AS target
            USING (SELECT ? AS invoice_id) AS source
            ON (target.invoice_id = source.invoice_id)
            WHEN MATCHED THEN
                UPDATE SET remaining_balance = ?, total_paid = ?, installments_status = ?, updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (invoice_id, remaining_balance, total_paid, installments_status)
                VALUES (?, ?, ?, ?);";

    $params = array(
        $invoice_id, 
        $remaining_balance, $total_paid, $installments,
        $invoice_id, $remaining_balance, $total_paid, $installments
    );

    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt) {
        echo json_encode(["status" => "success", "message" => "Saved successfully"]);
        sqlsrv_free_stmt($stmt);
    } else {
        echo json_encode([
            "status" => "error", 
            "message" => "Execute Failed: " . print_r(sqlsrv_errors(), true)
        ]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No Data Received"]);
}

sqlsrv_close($conn);
?>