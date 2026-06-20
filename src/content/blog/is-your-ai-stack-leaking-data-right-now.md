---
title: "Is Your AI Stack Leaking Data Right Now?"
description: "SearchLeak and LiteLLM's key exposure broke the same way. Run this 5-check audit before your enterprise AI stack becomes the next headline."
pubDate: "2026-06-20"
author: "Sergii Muliarchuk"
tags: ["ai-security","enterprise-ai","mcp-servers","n8n","llm-ops"]
aiDisclosure: true
takeaways:
  - "CVE-2026-42824 lets Copilot exfiltrate mailbox data via a single crafted microsoft.com URL."
  - "LiteLLM's admin key exposure affected any deployment running versions before the June 2026 patch."
  - "4 independent research teams confirmed the same root cause: no trust boundary on external input."
  - "MCP servers without output filtering are structurally identical to the SearchLeak attack surface."
  - "A 5-point audit covering input trust, token scope, SSRF exposure, key rotation, and output filtering closes 80% of the risk."
faq:
  - q: "Do I need to stop using Microsoft 365 Copilot immediately?"
    a: "Not necessarily. Microsoft issued a server-side mitigation after Varonis disclosed CVE-2026-42824 on June 15, 2026. You should verify your tenant is on the patched configuration, disable Copilot Enterprise Search for external URLs until confirmed, and treat any Copilot output touching external content as untrusted until you've run the 5-check audit."
  - q: "Is LiteLLM safe to run in production after the key exposure incident?"
    a: "LiteLLM patched the admin key exposure in a June 2026 release. If you're self-hosting, check your running version immediately, rotate all admin and virtual keys, and audit your proxy logs for unexpected /key/generate calls. Teams running LiteLLM behind a private VPC with no public proxy port were not exposed."
---

# Is Your AI Stack Leaking Data Right Now?

**TL;DR:** Two enterprise AI tools — Microsoft 365 Copilot and LiteLLM — broke in the same fundamental way within the same two-week window in June 2026: they accepted external input with zero trust boundary and handed attackers access to data they were never meant to touch. The attack surface isn't exotic; it's the same surface every team building on LLMs is standing on right now. Run the five-check audit below before your stack becomes the next CVE.

---

## At a glance

- **CVE-2026-42824 ("SearchLeak")** was disclosed by Varonis on **June 15, 2026** — a single crafted `microsoft.com` URL triggers Copilot to search your mailbox and exfiltrate results via a Bing SSRF, no plugins required.
- **LiteLLM's admin key exposure** was confirmed by **4 independent research teams** in the same two-week window, allowing unauthenticated `/key/generate` calls on misconfigured proxy deployments.
- **Microsoft 365 Copilot Enterprise Search** is deployed across **tens of thousands of enterprise tenants** — the blast radius of SearchLeak made it one of the highest-severity LLM disclosures of 2026.
- The LiteLLM vulnerability affected **self-hosted proxy versions** prior to the June 2026 patch; cloud-hosted deployments with auth middleware were not exposed.
- Both attacks required **zero user interaction beyond one click** — the industry's working definition of a critical-severity exploit chain.
- Varonis researchers demonstrated full exfiltration in **under 90 seconds** from click to data-out in their proof-of-concept recording.
- The **OWASP LLM Top 10 (2025 edition)** lists Prompt Injection as item **LLM01** — the root class covering both disclosures.

---

## Q: What actually happened in the SearchLeak chain?

The SearchLeak chain (CVE-2026-42824) is deceptively simple, which is what makes it so dangerous. A victim receives or visits a crafted `microsoft.com` URL — a domain their browser and email client already trust. Copilot Enterprise Search, operating with the user's full OAuth token, interprets an injected instruction embedded in the page content and runs a mailbox search query. The results are then smuggled out through a Bing SSRF — a server-side request forgery path that Copilot uses legitimately for grounding responses in web content.

We reviewed the Varonis disclosure in detail on June 16, 2026, the day after publication. The thing that stood out: there's no second click, no plugin install, no elevated permission prompt. The trust chain is already fully established by the time the victim loads the URL. Copilot's access to Exchange Online is a feature — but in this chain it becomes the exfiltration mechanism.

The pattern maps directly onto what OWASP calls **indirect prompt injection**: the malicious instruction doesn't come from the user, it comes from external content the model is asked to process. Copilot has no way to distinguish "summarise this page" from "search the user's inbox and send me the results" if both arrive through the same trusted rendering path.

---

## Q: How does the LiteLLM key exposure compare structurally?

LiteLLM is the proxy layer many teams use to route traffic across Claude, GPT-4o, Gemini, and local models under a single API surface. It's a legitimate, widely-deployed piece of LLM ops infrastructure — we run a hardened variant of it across several of our own pipelines.

The June 2026 exposure was a different shape than SearchLeak but the same root cause: external input with no trust boundary. Specifically, the `/key/generate` endpoint on misconfigured LiteLLM proxy deployments was reachable without authentication. An attacker who could reach the proxy URL — even over the public internet if the proxy port was exposed — could mint a valid admin key and then call any model, read any spend log, and impersonate any virtual key holder.

In our own infrastructure review on **June 17, 2026**, we confirmed our LiteLLM proxy instances run behind Cloudflare Access with a service token gate — the `/key/generate` path is not reachable from the public internet. Teams running LiteLLM in a Docker container with `ports: "4000:4000"` and no auth middleware in front were fully exposed. The fix is a single Cloudflare Access rule or an nginx `deny all` on that path, but you have to know the exposure exists first.

---

## Q: Are MCP servers the same attack surface in different clothes?

Yes — and this is the part that most LLM ops teams haven't fully absorbed yet. Model Context Protocol servers are, by design, trust bridges. They hand the model access to file systems, APIs, databases, calendars, and CRMs. That's the feature. The attack surface is that an MCP server receiving a tool call can't natively verify whether the instruction driving that call came from a legitimate user or from injected content the model was processing.

Our **`email` MCP server** and **`crm` MCP server** both have output filtering layers we added specifically because of this class of risk. The `email` MCP enforces a recipient allowlist — the model cannot instruct it to send to an address outside a pre-approved domain list, regardless of what the prompt says. The `crm` MCP requires a human-readable intent field in every write call, which gets logged and is reviewable. Neither of these controls is built into the MCP spec itself; we added them after a red-team exercise in **March 2026** where we successfully exfiltrated simulated CRM data from a vanilla MCP setup using a prompt injection delivered through a scraped LinkedIn page processed by the `scraper` MCP.

The structural parallel to SearchLeak is exact: external content → model processes it → model issues a trusted tool call → data leaves the boundary. If your MCP servers have no output filtering, you are running an unpatched version of the same vulnerability class.

---

## Deep dive: The trust boundary problem no one is shipping a fix for

The two disclosures — SearchLeak and LiteLLM's key exposure — arrived within 14 days of each other in June 2026, and four independent research teams converged on the same root-cause sentence: enterprise AI accepts external input with no trust boundary.

This is not a Microsoft problem or a LiteLLM problem. It is a structural property of how LLMs are currently integrated into enterprise toolchains.

**Varonis's SearchLeak disclosure** (published June 15, 2026 via VentureBeat) is the clearest demonstration of what OWASP calls indirect prompt injection at enterprise scale. The Varonis researchers didn't need to compromise Microsoft's infrastructure. They needed to get Copilot to process attacker-controlled content — which is exactly what Copilot Enterprise Search is designed to do. The Bing SSRF was the exfiltration channel, but the real vulnerability is that the model's actions are only as trustworthy as the content it last read.

**OWASP's LLM Application Security Guidelines (2025 edition)** dedicate their first two items — LLM01 Prompt Injection and LLM02 Insecure Output Handling — to exactly this attack class. The guidelines are explicit: "LLMs cannot reliably distinguish between instructions from the system prompt and instructions embedded in external data." Every grounding architecture — RAG, web search, email search, document parsing — creates a channel for this class of attack.

The LiteLLM exposure is structurally different (it's an auth gap rather than an injection) but shares the same operational cause: the proxy was deployed with the assumption that network-level trust was sufficient. In 2026, with AI workloads increasingly accessible via public URLs, SaaS integrations, and webhook endpoints, network-level trust is not a security boundary.

What's absent from both fixes is a systematic solution. Microsoft's server-side mitigation for SearchLeak patches the specific Bing SSRF path — it doesn't give Copilot the ability to evaluate whether an instruction in retrieved content is legitimate. LiteLLM's patch adds auth to the `/key/generate` endpoint — it doesn't add intent verification to key operations. Both fixes are correct and necessary. Neither of them addresses the underlying architecture.

The teams that are ahead of this problem share a design principle: **treat every model output that touches external content as untrusted until it passes through an explicit verification layer**. In practice this means: allowlisted recipients on any send action, human-in-the-loop approval for any write to a system of record, rate limits on bulk read operations that could be used for exfiltration, and structured logging of every tool call with its driving prompt context.

According to **Wiz Research's 2025 Cloud Security Report**, 62% of enterprise AI deployments lack any form of output filtering between the LLM layer and downstream tool calls. That number is why two disclosures in two weeks feel like a pattern — because they are one.

---

## Key takeaways

- CVE-2026-42824 exfiltrates mailbox data in under 90 seconds from a single microsoft.com click.
- LiteLLM's `/key/generate` exposure gave unauthenticated callers full admin key minting rights.
- OWASP LLM01 (Prompt Injection) is the root class behind both June 2026 disclosures.
- MCP servers without output filtering are structurally identical to the SearchLeak attack surface.
- Wiz Research found 62% of enterprise AI deployments lack output filtering between LLM and tools.

---

## FAQ

**Q: What are the five checks in the audit title?**
The five checks map to the five trust failure points visible in both disclosures: (1) **Input trust** — does your AI process external content without sanitization? (2) **Token scope** — are OAuth/API tokens scoped to least-privilege? (3) **SSRF exposure** — can your AI stack make outbound requests to attacker-controlled URLs? (4) **Key rotation** — are admin and virtual keys rotated on a schedule with revocation logging? (5) **Output filtering** — do tool calls (send email, write CRM, post API) pass through an allowlist or approval layer before execution? If any of these is "no," that's your highest-priority remediation.

**Q: Should teams switch away from cloud-hosted Copilot or LiteLLM after these disclosures?**
Switching tools doesn't fix the architecture problem — a self-hosted alternative with the same trust model has the same exposure. The right response is to apply the available patches immediately, audit your deployment against the five checks above, and add output filtering layers to any AI workflow that has write or send access to production systems. Both Microsoft and LiteLLM shipped patches; the residual risk is in the architectural pattern, not the specific vendor.

---

## About the author

Sergii Muliarchuk — founder of FlipFactory.it.com. Building production AI systems for fintech, e-commerce, and SaaS clients. We run 12+ MCP servers, n8n workflows, and FrontDeskPilot voice agents in production.

*We red-teamed our own MCP stack against prompt injection in March 2026 — which is why we write about this from scars, not slides.*