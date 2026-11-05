<?php
/**
 * Relyco enquiry handler — shared by relycoltd.com, relycotechsolutions.com, relycoindustrial.com.
 * Accepts a POST (urlencoded or multipart) from the site's contact form and emails it to info@relycoltd.com.
 * Responds with JSON: {"ok":true} or {"ok":false,"error":"..."}.
 */

const RECIPIENT = 'info@relycoltd.com';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB total
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];

$SITES = [
    'relycoltd.com'           => ['name' => 'Relyco Co. Ltd.',        'from' => 'noreply@relycoltd.com'],
    'relycotechsolutions.com' => ['name' => 'Relyco Tech Solutions',  'from' => 'noreply@relycotechsolutions.com'],
    'relycoindustrial.com'    => ['name' => 'Relyco Industrial',      'from' => 'noreply@relycoindustrial.com'],
];

$LABELS = [
    'name' => 'Name', 'firstName' => 'First Name', 'lastName' => 'Last Name', 'contact' => 'Contact Person',
    'company' => 'Company', 'email' => 'Email', 'phone' => 'Phone', 'enquiry' => 'Enquiry Type',
    'type' => 'Enquiry Type', 'service' => 'Service', 'category' => 'Product Category',
    'quantity' => 'Quantity & Unit', 'location' => 'Delivery / Project Location',
    'date' => 'Required Delivery Date', 'requirement' => 'Product / Service Requirement', 'message' => 'Message',
];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

function clean_line(string $v): string {
    return trim(preg_replace('/[\r\n\t]+/', ' ', $v));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

// Honeypot: real visitors never fill this hidden field.
if (!empty($_POST['website'])) {
    respond(200, ['ok' => true]);
}

$host = strtolower(preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? ''));
$site = $SITES[$host] ?? $SITES['relycoltd.com'];

$email = clean_line((string)($_POST['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Please enter a valid email address.']);
}

$fields = [];
foreach ($_POST as $key => $value) {
    if ($key === 'website' || is_array($value)) continue;
    $value = trim((string)$value);
    if ($value === '') continue;
    $label = $LABELS[$key] ?? ucfirst(preg_replace('/[^a-zA-Z0-9 _-]/', '', (string)$key));
    $fields[$label] = mb_substr($value, 0, 5000);
}

$hasMessage = isset($fields['Message']) || isset($fields['Product / Service Requirement']);
if (!$hasMessage) {
    respond(422, ['ok' => false, 'error' => 'Please include a message.']);
}

// Optional attachments (Industrial RFQ form).
$attachments = [];
if (!empty($_FILES['files']) && is_array($_FILES['files']['name'])) {
    $total = 0;
    foreach ($_FILES['files']['name'] as $i => $fname) {
        if ($_FILES['files']['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
        if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) {
            respond(422, ['ok' => false, 'error' => 'A file could not be uploaded. Please try again.']);
        }
        $ext = strtolower(pathinfo($fname, PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXT, true)) {
            respond(422, ['ok' => false, 'error' => 'Unsupported file type: ' . $ext]);
        }
        $total += (int)$_FILES['files']['size'][$i];
        if ($total > MAX_UPLOAD_BYTES) {
            respond(422, ['ok' => false, 'error' => 'Attachments exceed the 10MB limit.']);
        }
        $attachments[] = [
            'name' => preg_replace('/[^A-Za-z0-9._ -]/', '_', basename($fname)),
            'data' => file_get_contents($_FILES['files']['tmp_name'][$i]),
        ];
    }
}

$who = $fields['Company'] ?? $fields['Name'] ?? $fields['Contact Person']
    ?? trim(($fields['First Name'] ?? '') . ' ' . ($fields['Last Name'] ?? '')) ?: $email;
$topic = $fields['Enquiry Type'] ?? $fields['Service'] ?? 'Website Enquiry';
$subject = clean_line("[{$site['name']}] {$topic} - {$who}");

$body = "New enquiry from {$host}\n" . str_repeat('-', 40) . "\n\n";
foreach ($fields as $label => $value) {
    $body .= strpos($value, "\n") !== false ? "{$label}:\n{$value}\n\n" : "{$label}: {$value}\n";
}
$body .= "\n" . str_repeat('-', 40) . "\nSubmitted: " . gmdate('Y-m-d H:i') . " UTC\nIP: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n";

$headers = [
    'From: ' . $site['name'] . ' Website <' . $site['from'] . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
];

if ($attachments) {
    $boundary = 'b_' . bin2hex(random_bytes(12));
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    $message = "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n{$body}\r\n";
    foreach ($attachments as $a) {
        $message .= "--{$boundary}\r\nContent-Type: application/octet-stream; name=\"{$a['name']}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n"
            . chunk_split(base64_encode($a['data'])) . "\r\n";
    }
    $message .= "--{$boundary}--";
} else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $message = $body;
}

$sent = mail(RECIPIENT, '=?UTF-8?B?' . base64_encode($subject) . '?=', $message, implode("\r\n", $headers), '-f' . $site['from']);

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'Sorry, your message could not be sent. Please email us at ' . RECIPIENT . '.']);
}
respond(200, ['ok' => true]);
