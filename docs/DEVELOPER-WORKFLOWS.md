# Developer workflows

Flux is the deployed business assistant. Coding-agent workflow tools belong to
the development environment and must not be added to Flux's runtime tools,
permissions, or production container.

## gstack for GitHub Copilot CLI

[gstack](https://github.com/garrytan/gstack) provides coding workflows such as
engineering review, code review, QA, and release preparation. It is separate
from the Flux business agent and does not run inside the production app.

To install the upstream gstack skills for GitHub Copilot CLI on your machine,
follow gstack's current [host installation instructions](https://github.com/garrytan/gstack#other-ai-agents).
The documented install is:

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack
./setup --host copilot --no-browser
```

This is a user-level Copilot CLI installation, not a shared repository
installation. Review gstack's current requirements and setup behavior before
running it; its workflows may run commands, inspect or modify code, and use a
browser when invoked. Do not give it Flux production credentials or enable
browser access to authenticated business systems.

To use the full browser-based QA workflow, follow gstack's current browser
setup instructions separately. The optional `--no-browser` flag above avoids
installing browser components during the initial skills setup.
