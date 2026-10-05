# Implementation Plan: Restore Original Student Photo System & Resolve Display/Download Issues

Diagnose the root cause of the broken student photos in ID card requests, completely remove all Admin photo-upload controls, and restore the original photo mechanism for displaying, viewing, downloading, and storing teacher-submitted photos.

## Problem Diagnosis & Root Cause Analysis

1. **Relative Path Resolution Failure**:
   - Existing records stored in the database contain storage paths such as `student-photos/4f82df81-fc8c-409a-97b8-f972eeb58138.jpg`.
   - In `AdminPortal.tsx`, the `<img>` tag was directly setting `src={req.photo_data || req.photo_path}` without resolving the relative path against the Supabase Storage endpoint (`${SUPABASE_URL}/storage/v1/object/public/...` or via `supabase.storage`).
   - When running under the Express dev server (`server.ts`), requests to `/student-photos/...` were not handled by a storage route and fell through to the catch-all SPA middleware, returning `index.html` (text/html). When an `<img>` tag receives an HTML response, it triggers an image decoding error and renders a broken image icon.

2. **Download Button Inaccessibility**:
   - The download button in `AdminPortal.tsx` previously checked `{req.photo_data && ...}`. Because existing records from the database only had `photo_path` and not `photo_data`, the download button was completely hidden for all existing records.

3. **Interim Artificial Overwrites**:
   - In the prior turn, an Admin upload overlay, initials badge fallback, and local base64 compression were introduced. The user explicitly requires that Admin has **no** upload/replacement buttons and that the original photo system from teacher submissions is restored.

4. **Teacher Form Storage Synchronization**:
   - When teachers submit new requests in `SchoolsPortal.tsx`, the photo must be uploaded directly to the Supabase Storage bucket (`student-photos`), saving the resulting storage path in `photo_path` so it matches the existing data model.

---

## Proposed Changes

### 1. Revert All Admin Photo Upload / Replacement Controls
- **File**: `src/components/AdminPortal.tsx`
- Remove all Admin photo upload inputs, camera overlay icons, and replacement controls from the request cards.
- Remove `brokenPhotos`, `photoUpdateMsg`, `handleAdminPhotoUpload`, and `compressImageFile` from the Admin Portal.
- Keep the Admin interface strictly read-only for photos, exactly as designed for viewing and downloading teacher submissions.

### 2. Restore Original Photo URL Resolution & Display
- **File**: `src/supabase.ts` and `src/components/AdminPortal.tsx`
- Implement a centralized `getStudentPhotoUrl(pathOrData?: string)` helper:
  - If the string starts with `data:` or `http://` or `https://`, return it directly.
  - If the string is a Supabase storage path (e.g., `student-photos/xxx.jpg` or `xxx.jpg`), resolve it using `supabase.storage.from('student-photos').getPublicUrl(...)` and fallback to `${SUPABASE_URL}/storage/v1/object/public/${path}`.
- Update `AdminPortal.tsx` image rendering to use `getStudentPhotoUrl(req.photo_path || req.photo_data)`.
- If an image has no photo attached, display a simple, clean "No Photo" indicator.

### 3. Restore Photo Viewing & Downloading
- **File**: `src/components/AdminPortal.tsx`
- Ensure the photo can be clicked to view in full resolution (or opened in a new tab/preview modal).
- Update the download button so it works for all existing records with `photo_path` (fetching the file blob if needed or linking directly to the resolved URL with download attribute).

### 4. Restore Storage for Future Teacher Submissions
- **File**: `src/supabase.ts` and `src/components/SchoolsPortal.tsx`
- In `SchoolsPortal.tsx`, when a teacher selects a student photograph, upload the raw file/blob directly to Supabase Storage in the `student-photos` bucket:
  ```ts
  const fileName = `${reqId}.jpg`;
  const { data, error } = await supabase.storage.from('student-photos').upload(fileName, photoFile);
  ```
- Store the resulting storage path (`student-photos/${fileName}`) in `photo_path` on the request record, ensuring full consistency with existing records.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to ensure zero TypeScript errors.
- Run `lint_applet` to confirm no type violations.
- Run `npm run build` to verify production bundling.

### Manual / Browser Verification
- Open the Admin Portal (`?view=admin`) -> ID Card Requests:
  - Confirm **no** upload buttons, camera overlays, or change photo options appear.
  - Confirm existing records (`Khan Ahnaf Shahjad`, `Rafada Rizwan Dukandar`) display their photo URLs through the storage resolver.
  - Test clicking the download icon on existing requests and verify the photo file downloads correctly.
- Open the Schools Portal (`?view=schools`):
  - Submit a new student ID request with a photo.
  - Verify the photo uploads to Supabase Storage and appears in the Admin Portal.
