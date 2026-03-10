# Ideas: Saving and searching pictures of documents (وثائق / أوراق قديمة)

You want to store photos/scans of old documents and papers in the app and be able to search or browse them. Here are several options, from simplest to more capable.

---

## Option A: “Document archive” – standalone section (recommended to start)

**Idea:** A new section in the app, e.g. **“أرشيف الوثائق”** or **“مستندات”**. Each item = one or more images + a bit of text so you can search and organise.

**How it works:**
- You **upload images** (photos/scans of papers).
- For each “document” you add: **title** (عنوان), **short description** (وصف), **optional category** (قسم: خطابات، عقود، صور قديمة، إلخ), **optional date** (تاريخ الوثيقة إن وُجد).
- Images are stored in **Supabase Storage** (bucket مثل `documents` or `archive`).
- A small table in the DB (e.g. `documents`) stores: `id`, `title`, `description`, `category`, `document_date`, `file_paths` (or one path per row in a related table), `created_at`, maybe `created_by`.
- In the app: list documents, filter by category, **search by title/description**. Click to open and view the image(s).

**Pros:** Clear place for all papers; search by what you typed; no need to link to books.  
**Cons:** Search is only on the text you enter (no automatic “read text from image” unless you add it later).

**You need:** Supabase Storage bucket + RLS, one new table, one new app section (list + upload + detail view).

---

## Option B: Attach images to existing “book” or “diary”

**Idea:** Reuse what you have. Treat some “books” as **وثيقة** or add an **“مرفقات” (attachments)** to a book or to a **diary entry**.

- **Variant 1 – Book as document:**  
  Add a type or flag like “كتاب” vs “وثيقة”. For “وثيقة”, the “book” record is really a document: title, description, and one or more images (stored in Storage, paths in DB or in a new `book_attachments` table). Your existing book search then finds these “documents” too.

- **Variant 2 – Attachments per book:**  
  Keep books as books. Add an optional **attachments** table: `book_id`, `file_path`, `caption`, `sort_order`. So one book can have several scans (e.g. صفحات من مخطوطة). Search stays on book title/author; you open the book and see its attachments.

- **Variant 3 – Diary with images:**  
  You already have `diary_entries` with an `images` field. Use it (or extend it) for “يوميات + صور وثائق”. Each entry = one note + one or more document images. Search/filter diary by date or text; documents are found through the diary.

**Pros:** Fewer new concepts; fits “this document belongs to this book/day”.  
**Cons:** Mixing books and documents in one list can get noisy; diary is better for “log + photo” than for a big archive.

**Best for:** When the papers are clearly tied to a specific book or to a specific event/date you already log in the diary.

---

## Option C: Document archive + optional link to a book

**Idea:** Combine A and B. You have a **dedicated archive** (like Option A), but each document can optionally be **linked to a book** (e.g. “هذه صورة من نسخة قديمة من كتاب X”).

- Table `documents`: `id`, `title`, `description`, `category`, `document_date`, `created_at`, optional `book_id` (FK to books).
- Images in Storage; paths stored (e.g. in `documents` or in `document_files`).
- In the UI: in the archive you can filter by category and **search by title/description**; on the book detail page you can show “وثائق مرتبطة” for that book.

**Pros:** Clear archive + connection to your catalogue when useful.  
**Cons:** A bit more schema and UI than Option A alone.

---

## Option D: Later – search inside the image text (OCR)

**Idea:** So you can **search by words that appear in the document image** (e.g. اسم شخص، تاريخ، مكان).

- You still store images (Options A or C).
- You add a step (on upload or in the background): run **OCR** (e.g. Tesseract.js in the browser, or an Edge Function with an OCR API) and save the extracted text in a field like `document_search_text` or in a separate search table.
- Your search then looks in both title/description and this text.

**Pros:** Real “search inside the document”.  
**Cons:** More work (OCR pipeline, language for Arabic), and possibly cost if you use a cloud OCR API.

**Best for:** After you already have the archive (Option A or C) and want to improve search.

---

## Suggested path for you

1. **Start with Option A (document archive):**
   - New section “أرشيف الوثائق”.
   - One table (e.g. `documents`) + Supabase Storage for images.
   - Upload, list, filter by category, **search by title/description**.
2. **If you need “this document belongs to this book”:** add optional `book_id` (Option C) and show “وثائق مرتبطة” on the book page.
3. **When you have many documents and need “search inside the image”:** add OCR (Option D) on top of the same archive.

If you tell me which option you prefer (A only, or A+C, or “attach to book” first), I can outline the exact table(s), Storage bucket, and RLS so you can implement it step by step in your app.
