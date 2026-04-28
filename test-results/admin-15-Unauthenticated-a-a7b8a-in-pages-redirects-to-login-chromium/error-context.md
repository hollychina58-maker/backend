# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> 15. Unauthenticated access to admin pages redirects to login
- Location: e2e\admin.spec.ts:446:5

# Error details

```
Error: page.evaluate: SecurityError: Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```