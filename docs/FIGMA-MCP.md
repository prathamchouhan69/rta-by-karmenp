# Figma MCP integration

KARM OS includes a project-local `.mcp.json` configuration for the official Figma
MCP server:

`https://mcp.figma.com/mcp`

The configuration is intentionally limited to connection metadata. It contains no
Figma tokens, personal credentials, or application secrets.

## Connect

1. Open KARM OS in an MCP-compatible client.
2. Allow the client to load the repository's `.mcp.json`.
3. Authenticate with Figma when the client requests access.
4. Confirm the connection with the Figma `whoami` tool.

If the client does not automatically load project configuration, add the Figma
server manually using the same URL:

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

## Design-to-code workflow

For a Figma-driven implementation:

1. Provide the exact Figma frame or layer URL.
2. Retrieve design context and a screenshot before writing UI code.
3. Reuse existing KARM OS components and tokens where they exist.
4. Keep Figma assets sourced from the MCP response; do not add placeholder icons
   or image packages when an MCP asset is available.
5. Run the relevant typecheck, lint, test, and build commands after implementation.

The upstream integration guide is available in `mcp-server-guide/README.md`.
