# RSVP System Plan

## Overview
This project is an **RSVP E-Invitation & QR Code Check-in System** for an event that includes:
- A **dinner** invitation with optional participation in a **cocktail party**.
- Two optional **custom workshops** (Leather / Perfume) with selectable time slots.
- An **RSVP confirmation flow** that issues unique QR code passes.
- A **reception check-in system** for scanning and confirming attendance.

The system must support two invitation types:
1. **Named guests (情況一)** – invitation email shows the guest name directly.
2. **Company invitations (情況二)** – invitation email asks recipient to input the actual attendee name.

---

## 1. Core User Flows

### 1.1 Guest Flow (Frontend)
1. Guest receives invitation email (sent via **Resend**).
2. Guest clicks a unique RSVP link (contains token, e.g. `https://event.byross.design/rsvp?invite=abc123`).
3. System identifies:
   - **Named guest** → pre-filled name, no manual input.
   - **Company invitation** → ask user to fill name (and company if needed).
4. RSVP Form includes:
   - [ ] Attend dinner? (Yes / No)
   - [ ] Attend cocktail party? (Yes / No)
   - [ ] Attend workshop? (Yes / No)
     - If Yes → Choose workshop type:
       - Leather Workshop (1630 / 1700 / 1730 / 1800)
       - Perfume Workshop (1630 / 1700 / 1730 / 1800)
5. Upon submission:
   - Save RSVP data into DB.
   - Send confirmation email (via Resend) with personalized **QR Code**.
   - Display on-screen confirmation summary.

---

### 1.2 Organizer Flow (Admin Panel)
1. Import invitation list via CSV (name, company, email, invite_type).
2. System generates unique tokens for each guest.
3. Organizer can:
   - Preview and send all invitation emails.
   - View RSVP status (responded / not responded).
   - See counts per workshop and time slot.
   - Export guest list (CSV).
   - Re-send invitations or confirmations.

---

### 1.3 Reception Flow (Check-in System)
1. Staff scans guest’s QR code at reception (using laptop or tablet camera).
2. System displays:
   - Guest name / company
   - Workshop type & time
   - Seat number (if assigned)
   - RSVP summary
3. Staff clicks **“Confirm Check-in”** button.
   - DB updates `checked_in = true`
   - If scanned again → show “Already checked-in” alert.
4. If guest has a workshop:
   - Screen shows **“Give: Leather Workshop ticket (17:00)”** as a reminder.
   - Staff gives physical voucher (no further scan required).

---

## 2. Technical Stack

| Component | Technology | Notes |
|------------|-------------|-------|
| Frontend | **Next.js 15 + Tailwind CSS** | RSVP form, confirmation screen, admin UI |
| Backend API | **Cloudflare Workers (Hono)** | Handles token verification, QR generation, email sending |
| Database | **Cloudflare D1** | Guests, RSVP responses, scan logs |
| Email Service | **Resend** | Invitation & confirmation emails (React Email templates) |
| Storage | **R2 (optional)** | For storing QR/PDF files if needed |
| QR Code | **`qrcode` npm package** | PNG or base64 embedded in emails |
| PDF | **`pdf-lib`** | Generates optional printable RSVP pass |
| Auth (Admin) | Simple password or Cloudflare Access | Protect admin endpoints |

---

## 3. Database Schema

### Table: `guests`
| Field | Type | Description |
|--------|------|-------------|
| id | string (UUID) | Unique ID |
| name | string | Guest name |
| company | string | Company name (optional) |
| email | string | Email address |
| token | string | Unique invitation token |
| invite_type | enum('named','company') | Invitation type |
| rsvp_status | enum('pending','confirmed','declined') | RSVP result |
| dinner | boolean | Attend dinner |
| cocktail | boolean | Attend cocktail party |
| workshop_type | string | 'leather' / 'perfume' / null |
| workshop_time | string | '1630' / '1700' / '1730' / '1800' / null |
| seat_no | string | Optional assigned seat |
| checked_in | boolean | Whether scanned at reception |
| created_at | datetime | Record creation |
| updated_at | datetime | Last update |

### Table: `scan_logs`
| Field | Type | Description |
|--------|------|-------------|
| id | string | UUID |
| guest_id | string | Reference to guests.id |
| scan_time | datetime | Time of scan |
| staff_id | string | Optional staff operator |
| status | string | 'success' / 'duplicate' / 'error' |

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/api/rsvp/:token` | Fetch guest data by token |
| `POST` | `/api/rsvp/:token` | Submit RSVP form |
| `POST` | `/api/email/invite` | Send bulk invitations (admin only) |
| `POST` | `/api/email/confirm` | Send confirmation email with QR |
| `POST` | `/api/scan` | Validate QR and mark as checked-in |
| `GET` | `/api/admin/guests` | List all guests (admin) |
| `POST` | `/api/admin/import` | Upload CSV of guest list |
| `GET` | `/api/admin/export` | Export RSVP data |

---

## 5. Email Templates (Resend + React Email)

1. **Invitation – Named Guest (情況一)**
   - “Dear {{guest_name}}, you are invited…”
   - Button: “RSVP Now”
2. **Invitation – Company (情況二)**
   - “Your company is invited… Please confirm who will attend.”
3. **RSVP Confirmation**
   - Shows summary of responses.
   - Embeds QR Code image (base64).
   - Attach RSVP Pass (PDF).
4. **Reminder / Update**
   - Optional resend for guests who haven’t replied or need updates.

---

## 6. QR Code Design
QR Code encodes:
{
"id": "<guest_id>",
"token": "<token>",
"checksum": "<sha256>"
}
Verification logic:
- On scan → API verifies token + checksum.
- Returns guest details.
- Prevents re-use (if `checked_in = true`).

---

## 7. Frontend Pages (Next.js)

| Route | Purpose |
|--------|----------|
| `/` | Landing / event overview (optional) |
| `/rsvp` | RSVP form page |
| `/rsvp/confirmed` | Thank-you page |
| `/admin` | Admin dashboard |
| `/admin/import` | Import CSV page |
| `/admin/guests` | RSVP list / export |
| `/checkin` | QR scan page for reception |

---

## 8. Workflow Summary

### Stage 1: Setup
- Import guest list → generate tokens → send invitations via Resend.

### Stage 2: Guest Response
- Guests fill RSVP form → system stores responses and sends QR confirmation.

### Stage 3: Event Day
- Reception scans QR codes → marks checked-in → shows workshop info.

### Stage 4: Reporting
- Admin exports final attendee list and workshop counts.

---

## 9. Development Tasks (TODO)

### Phase 1 – Setup & DB ✅ COMPLETED
- [x] Define D1 schema & migrations.
- [x] Implement token generator.
- [x] Create data seeding script for sample guests.
- **Commit**: `fea9140` - feat: Complete Phase 1 - Project setup and infrastructure (2025-10-08)

### Phase 2 – Frontend RSVP Form ✅ COMPLETED
- [x] Build RSVP form page (Next.js + Tailwind).
- [x] Add dynamic workshop time selector.
- [x] Handle "情況一 / 情況二" logic.
- [x] Connect to API endpoint.
- **Commit**: `685e2dc` - feat: Complete Phase 2 - RSVP form implementation (2025-10-09)

### Phase 3 – Email System
- [ ] Setup Resend domain + API key.
- [ ] Create invitation + confirmation React Email templates.
- [ ] Implement Worker endpoint for sending confirmation with QR/PDF.

### Phase 4 – Admin Panel
- [ ] Build guest list table + CSV import/export.
- [ ] Add resend invitation buttons.
- [ ] Display RSVP statistics (e.g., per workshop slot).

### Phase 5 – Check-in Page
- [ ] Implement QR scan page (html5-qrcode).
- [ ] Fetch guest info via API.
- [ ] Add “Confirm Check-in” button + duplicate scan warning.

### Phase 6 – QA / Polish
- [ ] Test all email templates across clients.
- [ ] Test duplicate scans.
- [ ] Test offline mode (local cache for reception).

---

## 10. Notes & Considerations
- Each token can only be used once for submission.
- QR code cannot be reused after check-in.
- Workshop time slots may have capacity limits (optional enhancement).
- Admin auth should be password-protected or behind Cloudflare Access.
- All personal data stored only until event completion, then anonymized.

---

**Owner:** byRoss Design & Tech  
**Tech Lead:** Ross Chang  
**Status:** Phase 1 Complete ✅ / Phase 2 In Progress  
**Last Updated:** 2025-10-09
