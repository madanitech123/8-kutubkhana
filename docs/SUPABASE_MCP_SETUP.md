# Connect Supabase MCP server to Cursor (step-by-step)

Once connected, the AI in Cursor can use Supabase tools (run SQL, list tables, apply migrations, etc.) for your projects.

---

## Your questions answered

- **One-time set, then forever?**  
  **Yes.** You do the browser login **once**. After that, the AI can interact with Supabase whenever you use Cursor, until you disconnect the MCP server or your session expires. You don’t need to log in again each time.

- **Works for any project I have in Supabase?**  
  **Yes.** If you use the hosted MCP **without** locking to a single project, the connection sees your Supabase account (your orgs and projects). The AI can then work with **any** of your projects—e.g. 8-kutubkhana, or another one—depending on what you ask (“use 8-kutubkhana”, “list my projects”, “run this on project X”, etc.). So one setup covers all your Supabase projects.

---

## Prerequisites

- **Cursor IDE** (recent version)
- **Node.js 18+** (for the command-based option)
- Your **8-kutubkhana** project ref: `iqjajofqaimnqvrxgdzc`

---

## Browser login (recommended) — one-time setup, use with any project

Use Supabase’s **hosted MCP** and log in once in the browser. No tokens to copy. After that, the AI can use Supabase for **any** of your projects.

### Step 1: Open Supabase’s MCP guide and pick Cursor

1. Open: **https://supabase.com/docs/guides/getting-started/mcp**
2. Find the **configuration / setup panel** on that page.
3. Select **Cursor** as your MCP client.
4. If there is a **“Project”** dropdown, you can either:
   - Leave it **unspecified** (recommended) so the AI can work with **any** of your Supabase projects, or  
   - Choose **8-kutubkhana** (or one project) to limit to that project only.
5. Follow the exact steps Supabase shows (e.g. “Add server in Cursor”, or “Open this link”).

### Step 2: Log in once in the browser

1. When Cursor or Supabase asks you to **authorize**, a **browser window** will open.
2. **Log in to Supabase** (if you aren’t already).
3. **Approve** access for the MCP client (Cursor).
4. You only need to do this **once**; the connection stays until you remove it or the session expires.

### Step 3: Restart Cursor and enable the server

1. **Quit Cursor completely** (not just close the window), then open it again.
2. Open **Cursor Settings**: `Ctrl + ,` (Windows) or `Cmd + ,` (Mac).
3. Go to **Tools & MCP** (or **Features** → **MCP**).
4. Make sure the **Supabase** MCP server is **enabled** (toggle on).
5. If Supabase’s page told you to “Add new MCP server”, add it with the URL or config they gave (often `https://mcp.supabase.com/mcp`; don’t add `?project_ref=...` if you want access to all projects).

### Step 4: Verify

In Cursor chat, ask:

- *“What tables are in my Supabase database? Use MCP tools.”*  
  or  
- *“List my Supabase projects using MCP.”*

If the AI can list projects or tables, the Supabase MCP server is connected and you’re set. From then on, you can ask for any project (e.g. “run this SQL on 8-kutubkhana” or “use project X”).

---

## Option B: Manual config with Personal Access Token (PAT)

Use this if you prefer a project-scoped config with a token (e.g. for CI or no-browser setups).

### Step 1: Create a Supabase access token

1. Go to **https://supabase.com/dashboard/account/tokens**
2. Click **“Generate new token”**.
3. Name it (e.g. **“Cursor MCP – 8-kutubkhana”**).
4. Copy the token and store it somewhere safe (you won’t see it again).

### Step 2: Add MCP server in Cursor (UI)

1. Open Cursor Settings: `Ctrl + ,` / `Cmd + ,`.
2. Go to **Tools & MCP** → **Add new MCP server**.
3. Use:
   - **Name:** `supabase`
   - **Type:** choose **HTTP** / **URL** if available, or **Command** (see below).
   - **URL** (if HTTP):  
     `https://mcp.supabase.com/mcp?project_ref=iqjajofqaimnqvrxgdzc`
   - **Headers** (if your client supports them):  
     `Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN`
   - Or use the **Command** option with `npx` and env (see Option C).

### Step 3: Scope to 8-kutubkhana

- If you set a URL, include:  
  `?project_ref=iqjajofqaimnqvrxgdzc`  
  so the MCP server only sees this project.

---

## Option C: Project config file (mcp.json)

You can define the server in the project so Cursor uses it when this folder is open.

### Step 1: Create `.cursor/mcp.json`

Create the file **`.cursor/mcp.json`** in your project root (same level as `IMPLEMENTATION_ORDER.md`).

**If Cursor supports HTTP MCP with a URL and headers:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=iqjajofqaimnqvrxgdzc",
      "headers": {
        "Authorization": "Bearer YOUR_SUPABASE_ACCESS_TOKEN"
      }
    }
  }
}
```

Replace `YOUR_SUPABASE_ACCESS_TOKEN` with the token from Step 1 of Option B.

**If Cursor expects a command-based server:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_ACCESS_TOKEN"
      }
    }
  }
}
```

Again, replace the token. Do **not** commit real tokens to git. Use a placeholder in the file and set the real token in Cursor’s env or in a local override.

### Step 2: Restart Cursor

Close and reopen Cursor (or reload the window) so it loads the new MCP config.

### Step 3: Verify

Same as Option A Step 3: ask the AI to list tables using MCP tools.

---

## Security (from Supabase docs)

- Use MCP with **development / test** projects, not production.
- Prefer **project scoping** (`project_ref=iqjajofqaimnqvrxgdzc`) so the AI only sees this project.
- You can enable **read-only** mode:  
  `?project_ref=iqjajofqaimnqvrxgdzc&read_only=true`
- In Cursor, keep **“Confirm before running MCP tools”** (or equivalent) on, and review each request.

---

## What the AI can do with Supabase MCP

Once connected, the AI can use tools such as:

- **Database:** run SQL, list tables, list migrations, apply migrations
- **Development:** generate TypeScript types, get project URL / keys
- **Debugging:** fetch logs, security/performance advisors
- **Docs:** search Supabase docs

So you can ask things like: *“Run this SQL on my database”*, *“List my migrations”*, *“What tables exist?”*, and the AI will use the MCP server (when you approve the tool call).

---

## If something doesn’t work

1. **Restart Cursor** after changing MCP config.
2. Confirm the **Supabase** server is **enabled** under **Tools & MCP**.
3. Use the **official Supabase MCP guide** and configuration panel:  
   https://supabase.com/docs/guides/getting-started/mcp  
   (They may show Cursor-specific steps that override the above.)
4. If you use a PAT, ensure the token has the right scopes and isn’t expired.

If you tell me your OS and whether you prefer “browser login” or “token in config”, I can narrow this to exact clicks for your setup.
