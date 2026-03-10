# Feature suggestions (مكتبة المصباح)

Ideas for new functionality, ordered by impact and fit with what you already have. Pick what matters most to your library.

---

## Already in the app (no need to suggest)

- Books, members, loans, diary, categories, publishers, authors  
- Dashboard with stats, reports, global search  
- CSV import/export for books, Excel backup  
- User roles (admin / librarian / viewer), RLS, safe deletes  
- Password change, forgot password  

---

## High value, reasonable effort

### 1. **Loan due-date reminders**
- Store a “due after X days” (e.g. 14) per loan or as a setting.  
- Show on dashboard: “إعارات منتهية أو قريبة من الانتهاء” (overdue or due in next 3 days).  
- Optional later: email reminder (Supabase Edge Function or cron) for overdue loans.  
*Why:* Reduces forgotten returns and keeps circulation clear.

### 2. **Book search by cabinet/shelf**
- You already have global search. Add a quick filter or second search that limits by “الصندوق + الطاق” (cabinet + shelf) so staff can find a book on the physical shelf.  
*Why:* Very practical for daily library work.

### 3. **Member “current loans” on member card**
- On the member list or member detail, show “لديه X إعارات نشطة” and maybe the book titles.  
- Optional: link to the loan records.  
*Why:* Quick answer to “what did this member borrow?”

### 4. **Simple barcode/QR for books (optional)**
- Add an optional field like “رقم الصنف” or “باركود” per book.  
- Show it as a barcode/QR on the book detail or in reports so you can print labels.  
- No need for a scanner at first; just the number + printable code.  
*Why:* First step toward scanning later if you want it.

### 5. **Export loans to CSV/Excel**
- Same idea as book export: export the loans table (with book name, member name, dates, status) for a date range or “all”.  
*Why:* Reports and record-keeping outside the app.

---

## Medium value, medium effort

### 6. **Dashboard “recent activity”**
- Last 5–10 actions: “كتاب X أُعير إلى Y”, “عضو Z أُضيف”, “كتاب W أُرجع”.  
- Requires a simple `activity_log` table (or use diary for part of it) and one new section on the dashboard.  
*Why:* Quick sense of what’s happening without opening every section.

### 7. **Book “نسخ متاحة” (copies available)**
- You have `copies` and `status`. Show “X من Y نسخ متاحة” on the book list or detail, and when all copies are on loan, show “كل النسخ معارة”.  
*Why:* Clearer than inferring from status alone when copies > 1.

### 8. **Member contact quick action**
- Next to a member: “إرسال بريد” or “نسخ رقم الهاتف” (copy phone) so staff can contact them without leaving the app.  
*Why:* Speeds up reminders and follow-ups.

### 9. **Categories/publishers: “عدد الكتب”**
- On the categories and publishers lists, show “X كتب” per category/publisher.  
*Why:* Helps decide what to clean up or expand.

### 10. **Filter loans by status/date**
- Filters on the loans page: “معار فقط”, “مُرجع فقط”, “من تاريخ … إلى …”.  
*Why:* Better than scrolling when you have many loans.

---

## Nice to have (when you have time)

### 11. **Backup/restore (Phase 5)**
- You already planned this in IMPLEMENTATION_ORDER: reliable backup export + restore strategy + audit log.  
*Why:* Recovery and accountability.

### 12. **Book “غلاف” (cover) or document link**
- Optional image URL or file link per book (e.g. stored in Supabase Storage).  
- Show a small thumbnail in the book list or detail.  
*Why:* Easier to recognise books at a glance.

### 13. **Librarian notes on a loan**
- Optional “ملاحظة” field on a loan (e.g. “تم تمديد الإعارة”, “الكتاب مُستعاد يدوياً”).  
*Why:* Better history and follow-up.

### 14. **Simple dashboard chart**
- One chart (e.g. “إعارات في آخر 30 يوم” or “كتب حسب القسم”) using something light like Chart.js.  
*Why:* Visual summary for admins.

### 15. **Print member card**
- A printable “بطاقة عضو” with name, phone, and maybe a QR or ID for the member.  
*Why:* Physical cards for the library desk.

---

## Lower priority / later

- **SMS/email reminders** – needs integration (e.g. Twilio, Resend).  
- **Multi-branch libraries** – would need branch/location in schema.  
- **Public catalog (read-only)** – separate view or subdomain for visitors to search books only.  
- **Fine/overdue fees** – needs rules and maybe payment tracking.

---

## Suggested order if you start adding features

1. **Loan due-date + “overdue / due soon” on dashboard** – high impact for daily use.  
2. **Export loans to CSV/Excel** – easy and useful for reports.  
3. **Member current loans on member card** – quick answer to “what did they borrow?”  
4. **Book search/filter by cabinet/shelf** – very practical for physical layout.  
5. Then pick from “medium” or “nice to have” based on what your library needs most.

If you tell me which feature you want first (e.g. “due-date reminder” or “export loans”), I can outline the exact steps and data changes for your codebase.
