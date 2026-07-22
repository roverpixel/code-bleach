# 🕵️ Code Sanitizer

Because "I accidentally committed production credentials to a public pastebin" is a terrible origin story.

## 🚨 The Problem
You’re asking for help on a forum because your database connection is failing. You copy-paste your `config.yaml` to get some fresh eyes on it, and *whoops!* You just shared your production database password with the entire internet. We've all been there, and it's a nightmare.

## 🎯 The Purpose
Code Sanitizer is your friendly neighborhood redaction tool. It scrubs your code clean of sensitive information so you can share snippets, logs, and config files safely without the panic attacks.

## ✨ Features
- 🥷 **Comprehensive Redaction:** Automatically scrubs passwords, API keys, tokens, private keys, DB strings, IPs, MAC addresses, cloud domains, emails, user paths, UUIDs, and webhooks!
- 📝 **Custom Words:** Got a top-secret project name? Add your own custom words to the redaction list (we save them locally for you).
- 🎨 **Replacement Styles:** Choose your disguise! Go generic with `***`, keep it clear with `<REDACTED>`, or get specific with tags like `<REDACTED_IP>`.
- 📤 **Easy Exporting:** One click to copy your sanitized code to the clipboard, or download it directly as a text file.

## 🔍 Examples

### Before (The Scary Code)
```json
{
  "db_url": "postgresql://admin:superSecretPassword123@db.prod.example.com:5432/main",
  "api_key": "sk_live_1234567890abcdef",
  "server_ip": "192.168.1.100"
}
```

### After (The Safe Code - Specific Style)
```json
{
  "db_url": "<REDACTED_DB_URL>",
  "api_key": "<REDACTED_API_KEY>",
  "server_ip": "<REDACTED_IP>"
}
```

---

## 🛠️ Admin / Install

Want to run this locally? It's as easy as pie:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

*P.S. Keep your secrets secret!* 🤫
