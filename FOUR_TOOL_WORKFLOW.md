# Four-Tool Design-to-Code Workflow

This project (`karm-os`) integrates **Figma**, **Penpot**, **UXPin**, and **GitKraken** into a single UI development workflow for building the app.

## Tool Roles

| Tool | Role | Status |
|------|------|--------|
| **Figma** | Primary design source; MCP server provides design context to Copilot | Configured |
| **Penpot** | Open-source design alternative; self-hosted MCP server | Docker configured |
| **UXPin** | Merge CLI converts designs to React code components | CLI installed |
| **GitKraken** | Git version control for the karm-os repo | Installed + repo tracked |

---

## 1. Prerequisites

### Student Plan Access
- **Figma**: Student plan (Dev or Full seat) - enables Figma MCP tools
- **UXPin**: Student plan - access to UXPin Merge and CLI
- **GitKraken**: Student trial / Pro features active
- **Penpot**: Self-hosted (free, open-source)

### Environment Variables
Create `.env.production` in the project root:
```
POSTGRES_PASSWORD=<secure-password>
PENPOT_DB_PASSWORD=<secure-password>
PENPOT_MCP_PORT=9091
PENPOT_FRONTEND_PORT=9092
SETUP_CODE=<setup-code>
SESSION_SECRET=<secret>
FLUX_AUTH_SECRET=<secret>
FLUX_APPROVAL_SECRET=<secret>
FLUX_AUDIT_KEY=<secret>
```

---

## 2. Starting the Design Infrastructure

### Start Penpot (self-hosted MCP server)
```bash
cd /home/rtabykarm/Desktop/rtaaaaaaaaa/RTAbyKARM
docker compose --profile penpot up -d
```

Penpot services:
- **Backend/MCP**: `http://localhost:9091/mcp`
- **Frontend (UI)**: `http://localhost:9092`

Verify Penpot MCP is reachable:
```bash
curl http://localhost:9091/mcp
```

### VS Code Copilot MCP Servers
Both servers are configured in `~/.config/Code/User/mcp.json`:
- `figma` → `https://mcp.figma.com/mcp`
- `penpot` → `http://localhost:9091/mcp`

Restart VS Code after changes. In Copilot Chat (Agent mode), use `#get_design_context` to confirm tools are available.

---

## 3. Design Workflow (Figma + Penpot)

### Figma (Primary)
1. Open your Figma file (student plan required)
2. Copy a frame/layer URL from Figma
3. In VS Code Copilot Chat: `#get_design_context <figma-url>`
4. Use Code Connect to map Figma components to your React components
5. Generate code: `"Generate React + Tailwind code from this Figma frame"`

### Penpot (Open-source Alternative)
1. Open Penpot at `http://localhost:9092`
2. Create or import a design file
3. In VS Code Copilot Chat: reference Penpot design context
4. Export assets from Penpot to the project

### Syncing Between Figma and Penpot
- Export from Figma → SVG/PNG → Import into Penpot
- Or: Design in Penpot → Export → Reference in Figma for Code Connect
- Use both tools in parallel: Figma for high-fidelity UI, Penpot for component libraries

---

## 4. Design-to-Code (UXPin Merge)

UXPin Merge converts design components into React code. This bridges the gap between your design files (Figma/Penpot) and the karm-os React codebase.

### Initialize UXPin (first time only)
```bash
cd /home/rtabykarm/Desktop/rtaaaaaaaaa/RTAbyKARM/apps/web
npm run uxpin:init
```

### Start UXPin Merge Server
```bash
npm run uxpin:server
```

This starts a local server at `http://localhost:8877` showing your design system components.

### Push Design System to UXPin
```bash
npm run uxpin:push
```

### Dump Design System Info (JSON, no upload)
```bash
npm run uxpin:dump
```

### Workflow: Design → UXPin → Code
1. Create components in Figma or Penpot
2. Export component specs (CSS variables, tokens, assets)
3. Create React components in `apps/web/src/` matching the design tokens
4. Register components in `uxpin.config.js` for UXPin Merge recognition
5. Use UXPin Merge to preview components in the UXPin editor
6. Iterate: design change → update code → push to UXPin → verify

---

## 5. Version Control (GitKraken)

The `RTAbyKARM` repo is already tracked in GitKraken (opened previously).

### Open Repo in GitKraken
1. Launch GitKraken (AppImage or snap)
2. Open `~/Desktop/rtaaaaaaaaa/RTAbyKARM`
3. The repo appears in the recent repos list

### Git Workflow for UI Changes
```
1. Design change in Figma/Penpot
2. Implement in React (apps/web/src/)
3. Update UXPin Merge config if new components
4. GitKraken: Stage → Commit → Push
5. Create PR for review
```

### Recommended Branch Strategy
```
main          - Production-ready code
develop       - Integration branch
feature/ui-*  - UI feature branches (e.g., feature/ui-navbar)
fix/uxpin-*   - UXPin Merge fixes
```

---

## 6. Unified Daily Workflow

```
Morning:
  1. Start Penpot: docker compose --profile penpot up -d
  2. Open VS Code with karm-os.code-workspace
  3. Open GitKraken with RTAbyKARM repo
  4. Open Figma (web or desktop) with your design file

Design → Code:
  5. In Figma, select a frame → copy URL
  6. In Copilot Chat: "#get_design_context <url>"
  7. Ask Copilot: "Generate React component from this Figma design"
  8. Review generated code against DESIGN.md tokens

Code → Design System:
  9. Add new components to uxpin.config.js
  10. Run: npm run uxpin:server (preview in UXPin)
  11. Run: npm run uxpin:push (sync to UXPin cloud)

Version Control:
  12. GitKraken: commit changes with descriptive message
  13. Push to remote, create PR if collaborating
```

---

## 7. Design Tokens (DESIGN.md)

The project uses `DESIGN.md` as the single source of truth for design tokens. All four tools should reference this:

```yaml
colors:
  page: "#05070c"      # Background
  cyan: "#00d9eb"      # Primary accent
  violet: "#bd68f6"    # Secondary accent
typography:
  body: 13px, ui-sans-serif
rounded:
  sm: 7px, md: 10px, lg: 14px
```

When generating code from Figma/Penpot, instruct Copilot to use these tokens instead of hardcoded values.

---

## 8. Commands Reference

### Docker (Penpot)
```bash
docker compose --profile penpot up -d      # Start Penpot
docker compose --profile penpot down       # Stop Penpot
docker compose logs penpot-backend         # Check Penpot logs
```

### UXPin (apps/web/)
```bash
npm run uxpin:init      # Initialize config
npm run uxpin:server    # Start local Merge server
npm run uxpin:push      # Push design system to UXPin
npm run uxpin:dump      # Dump design system JSON
npm run uxpin:summary   # Show component summary
```

### Web App
```bash
npm run dev             # Start dev server (port 5173)
npm run build           # Build for production
npm run typecheck       # TypeScript check
npm run lint            # ESLint check
```

### GitKraken
- Launch: `gitkraken` or open the AppImage
- Open repo: `/home/rtabykarm/Desktop/rtaaaaaaaaa/RTAbyKARM`

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| Penpot MCP not reachable | Ensure `docker compose --profile penpot up -d` is running; check `http://localhost:9091/mcp` |
| Figma tools not showing in Copilot | Restart VS Code; verify `mcp.json` has figma server; ensure GitHub Copilot is enabled |
| UXPin CLI ESM error | Ensure `uxpin.config.js` uses `export default` (not `module.exports`) |
| GitKraken repo not showing | Open `~/Desktop/rtaaaaaaaaa/RTAbyKARM` in GitKraken via File → Open Repo |
| VS Code won't launch | Use `--no-sandbox` flag (desktop shortcut already configured) |

---

## 10. Student Plan Notes

- **Figma**: Starter plan limits to 6 tool calls/month for MCP. Dev/Full seat on Professional+ plans have per-minute rate limits matching Figma REST API Tier 1.
- **UXPin**: Student plan includes Merge CLI access. Verify your student status in UXPin account settings.
- **GitKraken**: Student trial includes Pro features. Check `Help → About` for license status.
- **Penpot**: Self-hosted, free, no plan limits.
