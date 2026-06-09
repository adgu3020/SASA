/**
 * ═══════════════════════════════════════════════════════════════════════
 * SASA CORDS — Google Apps Script Webhook
 * ═══════════════════════════════════════════════════════════════════════
 *
 * HOW TO INSTALL:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Open the Google Sheet linked to your Google Form
 * 2. Click Extensions → Apps Script
 * 3. Delete any existing code in the editor
 * 4. Paste THIS ENTIRE FILE into the editor
 * 5. Update WEBHOOK_URL and WEBHOOK_SECRET below
 * 6. Click Save (Ctrl+S / Cmd+S)
 * 7. Click the "+" next to "Triggers" in the left sidebar
 * 8. Configure:
 *      - Choose function: onFormSubmit
 *      - Event source: From spreadsheet
 *      - Event type: On form submit
 * 9. Click Save, then authorize the script when prompted
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

// ── CONFIGURATION ──────────────────────────────────────────────────────
// Replace with your actual Vercel deployment URL
var WEBHOOK_URL = 'https://your-sasa-cords.vercel.app/api/webhook/google-form';

// Replace with the WEBHOOK_SECRET from your .env file
var WEBHOOK_SECRET = 'your-webhook-secret-here';

// ── COLUMN MAPPING ─────────────────────────────────────────────────────
// These map to the column headers in your linked Google Sheet.
// The first column (index 0) is always "Timestamp" — don't change that.
// Update these to match your EXACT Google Form question titles.
var COLUMN_MAP = {
  timestamp:       0,  // Column A — auto-generated
  full_name:       1,  // Column B — "Full Name"
  email:           2,  // Column C — "Email Address"
  graduation_year: 3,  // Column D — "Graduation Year"
  comments:        4,  // Column E — "Comments / Notes (Optional)"
};

// ── MAIN HANDLER ──────────────────────────────────────────────────────
function onFormSubmit(e) {
  try {
    var responses = e.values; // array of form values in sheet column order
    var responseId = e.triggerUid + '_' + new Date().getTime(); // unique ID

    // Build payload matching what the webhook expects
    var payload = {
      response_id:     responseId,
      full_name:       getColumn(responses, COLUMN_MAP.full_name),
      email:           getColumn(responses, COLUMN_MAP.email),
      graduation_year: getColumn(responses, COLUMN_MAP.graduation_year),
      comments:        getColumn(responses, COLUMN_MAP.comments),
      submitted_at:    new Date().toISOString(),
    };

    // Validate required fields before sending
    if (!payload.email || !payload.full_name) {
      Logger.log('Missing required fields, skipping: ' + JSON.stringify(payload));
      return;
    }

    // Send to webhook
    var options = {
      method:             'post',
      contentType:        'application/json',
      headers:            { 'X-Webhook-Secret': WEBHOOK_SECRET },
      payload:            JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var code     = response.getResponseCode();
    var body     = response.getContentText();

    Logger.log('Webhook response ' + code + ': ' + body);

    if (code !== 200 && code !== 201) {
      Logger.log('ERROR: Webhook returned ' + code + ': ' + body);
    }

  } catch (err) {
    Logger.log('ERROR in onFormSubmit: ' + err.toString());
  }
}

// ── HELPER ────────────────────────────────────────────────────────────
function getColumn(values, index) {
  if (index === null || index === undefined) return null;
  var val = values[index];
  return (val !== undefined && val !== '') ? String(val).trim() : null;
}

// ── TEST FUNCTION ─────────────────────────────────────────────────────
// Run this manually from the Apps Script editor to test your webhook
// before the first real form submission.
function testWebhook() {
  var testPayload = {
    response_id:     'test_' + new Date().getTime(),
    full_name:       'Test Student',
    email:           'test@university.edu',
    graduation_year: '2025',
    comments:        'This is a test submission from Apps Script.',
  };

  var options = {
    method:             'post',
    contentType:        'application/json',
    headers:            { 'X-Webhook-Secret': WEBHOOK_SECRET },
    payload:            JSON.stringify(testPayload),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  Logger.log('Test response: ' + response.getResponseCode() + ' — ' + response.getContentText());
}
