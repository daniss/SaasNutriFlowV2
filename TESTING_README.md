# Testing Guide

## ⚠️ Security Notice

**NEVER commit files containing API keys or sensitive data to the repository.**

## Test Files

Test files have been moved to `.gitignore` to prevent accidental commits of sensitive data.

### Setting up tests

1. Create test files locally (they will be ignored by git)
2. Set environment variables for API keys:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```
3. Use environment variables in test files:
   ```javascript
   const apiKey = process.env.GEMINI_API_KEY;
   if (!apiKey) {
     console.error("❌ No API key found");
     return;
   }
   ```

### Available environment variables

- `GEMINI_API_KEY` - Google Gemini API key for AI meal plan generation
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (use with caution)
- `CLIENT_AUTH_SECRET` - Secret for client JWT tokens

### Running tests

```bash
# Run individual test files
node test-filename.js

# Or with environment variables inline
GEMINI_API_KEY="your_key" node test-filename.js
```

## Security Best Practices

1. **Never hardcode API keys** in source files
2. **Use environment variables** for all secrets
3. **Add test files to .gitignore** if they might contain sensitive data
4. **Review code before committing** to ensure no secrets are included
5. **Use .env.local** for local development (already in .gitignore)

## Recovery from leaked keys

If API keys are accidentally committed:

1. **Immediately revoke/regenerate** the compromised keys
2. **Remove keys from all files** and use environment variables instead
3. **Update .gitignore** to prevent future commits
4. **Remove from git history** if necessary using `git filter-branch` or BFG Repo-Cleaner