# Other useful MCP servers to connect to Cursor

After Supabase, here are more MCPs that work well with Cursor. Add them in **Cursor Settings → Tools & MCP** (or via `.cursor/mcp.json`). One-time setup per server; then the AI can use them when you ask.

---

## Quick add (Cursor UI)

1. **Cursor Settings** → **Tools & MCP** → **Add new MCP server** or browse **Discover**.
2. Many servers appear by name (e.g. "GitHub", "Fetch"); pick one and follow the prompts (login or env vars).
3. Restart Cursor if the server doesn’t show up right away.

---

## Recommended MCPs (by category)

### 1. **GitHub** — repos, issues, PRs, search

- **What it does:** Create issues, list PRs, search code, read repo info.
- **Add:** In Cursor, look for **GitHub** in MCP discovery, or use the official [GitHub MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/github) (may require token). Often: sign in with GitHub when Cursor prompts you.
- **Use:** *“List open PRs in this repo”*, *“Create an issue for…”*

---

### 2. **Git** — local repository

- **What it does:** Read git history, status, diff; create commits (no GitHub token).
- **Add:** Official reference server. In Cursor Discover look for **Git**, or add via config:
  ```json
  "git": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-git"]
  }
  ```
- **Use:** *“What changed in the last 3 commits?”*, *“Show git status”*

---

### 3. **Fetch** — read any URL or API

- **What it does:** Fetches a URL and returns the content (docs, APIs, web pages) so the AI can read it.
- **Add:** Official server. Look for **Fetch** in Cursor, or:
  ```json
  "fetch": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"]
  }
  ```
- **Use:** *“Fetch the content of https://…”*, *“What does this API return?”*

---

### 4. **Brave Search** — real-time web search

- **What it does:** Web search so the AI can look up docs, errors, and latest info.
- **Add:** [Brave Search MCP](https://github.com/brave/brave-search-mcp-server). You need a free [Brave Search API key](https://brave.com/search/api/). Then in Cursor add the server and set env `BRAVE_API_KEY=your_key`.
- **Use:** *“Search for how to…”*, *“Find the latest Supabase RLS docs”*

---

### 5. **Filesystem** — read/write files (with limits)

- **What it does:** Lets the AI read/write files in allowed directories (useful for multi-folder or script output). Cursor already has strong file access; this MCP can extend or scope it.
- **Add:** Official server. Look for **Filesystem** in Cursor, or:
  ```json
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
  }
  ```
  Restrict to a specific folder for safety.
- **Use:** *“Save this script to scripts/backup.js”*, *“List files in docs/”*

---

### 6. **SQLite** — local database

- **What it does:** Run queries on local `.sqlite` files (great for dev DBs or small tools).
- **Add:** Search for **SQLite** in Cursor MCP discovery or [registry](https://registry.modelcontextprotocol.io/). Often:
  ```json
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "path/to/db.sqlite"]
  }
  ```
- **Use:** *“Query my local SQLite DB for…”* (you already have Supabase for remote.)

---

### 7. **Slack** — team chat (if you use it)

- **What it does:** Read channels, send messages, search (needs Slack app + token).
- **Add:** Search **Slack MCP** in Cursor or use [Zencoder Slack MCP](https://github.com/zencoderai/slack-mcp-server). Configure with Slack OAuth or token.
- **Use:** *“Post this to #dev”*, *“Summarize recent messages in…”*

---

### 8. **Browser** (Cursor built-in)

- **What it does:** You may already have **cursor-ide-browser**: navigate, click, fill forms, take snapshots for testing.
- **Check:** In **Tools & MCP**, see if **cursor-ide-browser** is listed and enabled.
- **Use:** *“Open my app and check the login page”*, *“Take a snapshot of this URL”*

---

## Where to find more

- **MCP Registry (official):** https://registry.modelcontextprotocol.io/ — browse and filter by category.
- **Awesome list:** https://github.com/wong2/awesome-mcp-servers — community list.
- **Cursor:** In **Tools & MCP**, use **Discover** to see installable servers with one click where available.

---

## Tips

- Start with **Fetch** and **Git** (no keys). Add **Brave Search** when you need web search. Add **GitHub** when you want issues/PRs from the AI.
- Don’t enable every server at once; more servers = more tokens. Enable what you actually use.
- For any server that needs a key or login, set it once in Cursor (env vars or OAuth); then it’s set until you remove it.

If you tell me your stack (e.g. “I use Notion” or “I use Linear”), I can suggest one or two more that fit.
