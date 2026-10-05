# Implementation Plan: Hide & Protect Admin Password in Settings

Remove the visible plaintext "Current Effective Password" field from the Admin Settings tab to eliminate the security risk of exposing the admin password on screen.

## User Requirement & Security Analysis
- **Problem**: In the Admin Portal settings under "Admin Login Password", the interface displays `Current Effective Password` in an open plaintext input (`@Iprinters23`). Anyone looking at the screen, viewing a screen share, or glancing over a shoulder can see the administrator credentials.
- **Goal**: Completely remove the display of the current active password from the screen so it is never exposed in plaintext.

---

## Proposed Changes

### `src/components/AdminPortal.tsx`

1. **Remove the Plaintext Password Display**:
   - Delete the "Current Effective Password" display block (lines 3451–3461) that prints the plaintext password on screen.
   
2. **Require Current Password Verification for Changes**:
   - Add a secure masked input field: **"Current Password"** (`type={showPassword ? 'text' : 'password'}`) where the user must type their current password to authorize a change.
   - When submitting `handleUpdatePassword`:
     - Validate that the typed current password matches the active admin PIN (`savedCustomPin || 'aradmin2026'`).
     - If it doesn't match, display a clear error: `"Current password is incorrect"`.
   - This prevents anyone from changing the admin password if a computer is left unattended for a moment.

3. **Secure Factory Reset**:
   - Also require entering the current password before performing "Reset to Factory Default", or prompt for confirmation without exposing the password.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to ensure zero TypeScript errors.
- Run `lint_applet` to verify no linting or type violations.

### Manual Verification
- Navigate to Admin Portal -> **Settings** tab -> **Admin Login Password**:
  - Confirm the plaintext "Current Effective Password" input is completely gone.
  - Verify that the current password is never rendered on screen.
  - Test updating the password by entering the current password and the new password.
  - Verify that entering an incorrect current password shows an error and prevents changes.
