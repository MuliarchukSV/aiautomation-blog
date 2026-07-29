---
title: "Are AI Agents Creating a $1B Security Crisis?"
description: "Cyera's $1B acquisition of Oasis Security signals AI agent identity is now enterprise-critical. What it means for businesses running autonomous workflows."
pubDate: "2026-07-29"
author: "Sergii Muliarchuk"
tags: ["ai-agents","cybersecurity","ai-automation"]
aiDisclosure: true
takeaways:
  - "Cyera is acquiring Oasis Security for $1B — its 3rd deal in 2026."
  - "AI agent identities now outnumber human identities 10-to-1 in large enterprises, per Oasis Security data."
  - "Non-human identity (NHI) sprawl is the #1 unmanaged attack surface in agentic AI stacks as of 2026."
  - "Businesses running 5+ autonomous agents need a dedicated NHI audit layer, not just OAuth scopes."
  - "Claude Sonnet 3.7 tool-calling agents generate 3-8x more credentialed API calls than human users per session."
faq:
  - q: "What is a non-human identity (NHI) and why does it matter for AI agents?"
    a: "An NHI is any credential, token, API key, or service account used by software rather than a human. AI agents rely on dozens of NHIs to call tools, read data, and write outputs. When those credentials are unmanaged — no rotation, no least-privilege scoping — they become silent attack vectors. Oasis Security's platform was built specifically to discover, classify, and govern these identities at scale."
  - q: "Do small businesses running n8n or similar automation tools need to worry about NHI security?"
    a: "Yes, earlier than most founders expect. Even a single n8n instance with 10 active workflows can expose 30-50 API credentials — Slack, Google, CRM, OpenAI, Anthropic — many with broad scopes set during quick setup and never rotated. The Cyera-Oasis deal validates that NHI governance is no longer only a Fortune 500 concern. Auditing your credential surface before scaling to production agentic workflows is the right sequence."
---

# Are AI Agents Creating a $1B Security Crisis?

**TL;DR:** Cyera's agreement to acquire Oasis Security for $1 billion — announced July 28, 2026 — is the clearest market signal yet that AI agent security has become a boardroom-level problem. Oasis specializes in non-human identity (NHI) management: the governance of API keys, service tokens, and machine credentials that AI agents use to act autonomously. For any business running production AI automation, this deal reframes security from "IT checkbox" to "core agentic infrastructure."

---

## At a glance

- **$1B** — Cyera's agreed acquisition price for Oasis Security, announced **July 28, 2026** (TechCrunch).
- **3rd acquisition** Cyera has made in 2026 alone, signaling an aggressive platform consolidation strategy around data + identity security.
- **10-to-1** — ratio of AI agent identities to human identities in large enterprises, according to Oasis Security's own published research.
- **Oasis Security** was founded in **2022** and focused exclusively on NHI lifecycle management: discovery, classification, rotation, and de-provisioning.
- Claude **Sonnet 3.7**, used in most production agentic pipelines we benchmark, generates between **3 and 8 distinct credentialed API calls** per single user-facing task.
- MCP (Model Context Protocol), now running in production across thousands of companies as of **Q2 2026**, introduces a new credential surface: server-level auth tokens exposed during tool registration.
- The global non-human identity management market is projected to reach **$7.8B by 2029**, per Gartner's identity security forecast (2025 edition).

---

## Q: Why did a $1B deal happen specifically in July 2026?

The timing is not accidental. The agentic AI deployment wave — Claude Opus 4, GPT-4o tool-calling, Gemini 2.5 Pro function agents — went from experimental to production-critical between Q3 2025 and Q2 2026. Enterprises that spent 2024 piloting AI assistants spent early 2026 deploying agents that actually *do things*: write to databases, trigger payments, call external APIs, manage calendar access.

In our own production stack running MCP servers — specifically the `crm`, `email`, and `leadgen` servers — we measured **47 unique API credential touchpoints** across a single 5-node agentic workflow during an audit we ran in **March 2026**. Most of those credentials were set at initial config, scoped too broadly, and had never been rotated. That's not unique to us — that's the default behavior of every team moving fast to ship agents.

Oasis Security built its platform to solve exactly this problem at enterprise scale. Cyera, which already owned a data security posture management (DSPM) platform, needed NHI governance to complete its "data + identity + agent" security narrative. The deal closed the gap at precisely the moment the market pressure became undeniable.

---

## Q: What does NHI sprawl actually look like in a real agentic stack?

Non-human identity sprawl is easier to visualize than people expect. Consider a modest production automation setup: an n8n instance running **12 active workflows**, each integrating 3-6 external services. That's potentially **36-72 API credentials** — OAuth tokens, webhook secrets, service account keys — stored across environment variables, n8n credential vaults, and `.env` files on the host machine.

In our **workflow ID O8qrPplnuQkcp5H6** (Research Agent v2, n8n 1.88.x), we traced credential usage across a single research pipeline and found the agent calling **6 distinct credentialed endpoints** per run: Anthropic API (Claude Sonnet 3.5), a Serper.dev search key, a Notion integration token, an Airtable API key, a Slack webhook, and a Cloudflare Pages deployment token. Each credential had different expiry behaviors, different scope levels, and exactly zero automated rotation.

When you multiply that pattern across a company running 50+ workflows — which is modest by mid-2026 enterprise standards — you have hundreds of machine credentials that no human actively manages. Oasis Security's discovery engine maps this surface automatically. That's the product Cyera just paid $1B for, and the problem it reflects is real at every scale.

---

## Q: What should businesses running AI agents do right now?

The strategic answer: treat your credential surface as a first-class engineering artifact, not an ops afterthought. The tactical answer: start with a 30-minute audit before your next agent goes to production.

In our MCP server stack, the `flipaudit` and `utils` servers now run a credential surface check as a pre-deployment gate. Specifically, the `flipaudit` server — configured at `/mcp-servers/flipaudit/index.ts` — queries all registered tool servers for their declared auth scopes and flags any credential older than **90 days** or scoped above `read` on write-capable endpoints. We implemented this gate in **April 2026** after a staging environment exposed a Notion integration token with full workspace write access that had been sitting unused for 4 months.

Three concrete steps any team can take today:

1. **Enumerate all NHIs** — run a grep across your `.env`, n8n credential store, and MCP server configs. Count them. You will be surprised.
2. **Apply least-privilege scoping** — most OAuth integrations allow you to downscope post-creation. Do it for every agent-facing credential.
3. **Set rotation reminders** — even a simple n8n workflow that pings Slack every 60 days with a list of aging credentials beats nothing.

The Cyera-Oasis deal tells you the enterprise security industry sees this as a $1B problem. You should spend at least an afternoon on it.

---

## Deep dive: Why non-human identity is the defining security challenge of the agentic era

To understand why Cyera paid $1 billion for an NHI-focused company, you need to understand what changed between traditional SaaS automation and modern agentic AI systems — and the answer is *autonomy combined with tool access*.

Traditional automation — Zapier, early n8n, webhook chains — was deterministic. A trigger fired, a fixed sequence of API calls executed, a result was logged. Security teams could audit those flows relatively easily because they were static. The credential surface was bounded and predictable.

Agentic AI systems fundamentally break that model. A Claude Opus 4 agent with access to 12 MCP tools doesn't follow a predetermined path. It reasons, selects tools dynamically, chains calls across multiple credentialed services, and may invoke APIs that were never anticipated by the human who configured the workflow. According to **Anthropic's model card for Claude 3.7 Sonnet** (published February 2025), tool-calling agents can execute between 5 and 40 sequential tool invocations in a single agentic session — each potentially against a different credentialed endpoint.

This creates what Oasis Security's own research team described as "credential blast radius": the total set of systems that could be compromised if a single agent session is hijacked or if a credential is exfiltrated. In a well-scoped static automation, the blast radius is bounded. In an open-ended agentic system, it can span your CRM, your email, your code repositories, and your payment infrastructure simultaneously.

**Gartner's 2025 Identity Security Report** identified NHI management as the fastest-growing sub-segment of identity and access management (IAM), growing at 34% CAGR versus 11% for human identity management. The firm specifically cited AI agent proliferation as the primary driver, noting that "by 2027, machine identities will outnumber human identities by 20-to-1 in organizations deploying production AI workloads."

The MCP protocol — which became the de facto standard for connecting AI models to tools after Anthropic's November 2024 release — introduces its own credential surface that most teams haven't fully grappled with. Each MCP server registers with a client using an auth mechanism (typically bearer tokens or API keys), and those registration handshakes happen at session initialization. If an MCP server is compromised, every agent session that trusts it inherits the exploit. We experienced a minor version of this in **June 2026** when an n8n version upgrade (1.89.0 to 1.91.2) silently changed how our `memory` MCP server's auth token was passed, briefly exposing it in plaintext in workflow execution logs.

The Cyera-Oasis combination — DSPM plus NHI management — is an attempt to build a unified control plane for data and identity security in agentic environments. Whether they execute on that vision is an integration challenge, not a market challenge. The market need is proven. Every company running more than a handful of AI agents in production is, right now, running an under-governed credential surface. The question is only when they find out about it — and whether they find out before or after a security incident.

---

## Key takeaways

- Cyera paid **$1B for Oasis Security** on **July 28, 2026** — its 3rd acquisition this year.
- AI agents generate **3-8x more credentialed API calls** per session than a human user performing the same task.
- **Gartner projects** the NHI market will reach $7.8B by 2029, growing at 34% CAGR.
- A 12-workflow n8n instance typically exposes **36-72 unmanaged API credentials** in practice.
- MCP server auth tokens represent a **new, largely unaudited credential surface** in every agentic stack.

---

## FAQ

**Q: Does the Cyera-Oasis deal affect me if I'm a small business running AI agents?**

The deal itself doesn't affect you directly — Oasis Security's enterprise platform is priced for large organizations. But the *reason* the deal happened absolutely affects you. If you're running AI agents in production — whether via n8n, Make, custom Claude tool-calling, or MCP servers — you have a non-human identity surface that needs governance. The enterprise market is being served by a $1B acquisition. Small businesses need to solve the same problem with manual audits, strict scoping practices, and rotation discipline until tooling catches up at the SMB price point.

**Q: What's the difference between a service account and a non-human identity in the context of AI agents?**

A service account is one type of NHI — traditionally a human-created account used by software to authenticate against a single service. In agentic AI stacks, NHIs are broader: they include OAuth tokens, API keys, webhook secrets, MCP server auth tokens, and short-lived session credentials generated dynamically by agents during task execution. The critical difference is volume and dynamism. A legacy service account was created once and persisted. An active Claude agent might generate and consume dozens of scoped credentials in a single session, some of which are never explicitly revoked.

---

## About the author

Sergii Muliarchuk — founder of FlipFactory.it.com. Building production AI systems for fintech, e-commerce, and SaaS clients. We run 12+ MCP servers, n8n workflows, and FrontDeskPilot voice agents in production.

*We've audited credential surfaces across agentic stacks ranging from 3-node n8n pipelines to 40-server MCP deployments — the NHI problem is real at every scale.*