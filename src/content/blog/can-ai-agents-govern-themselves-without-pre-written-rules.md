---
title: "Can AI agents govern themselves without pre-written rules?"
description: "How Brex's CrabTrap proxy model reshapes AI agent policy—and what it means for teams running MCP servers and n8n workflows in production."
pubDate: "2026-07-18"
author: "Sergii Muliarchuk"
tags: ["ai-agents","ai-automation","enterprise-ai","mcp-servers","n8n"]
aiDisclosure: true
takeaways:
  - "Brex's CrabTrap proxy intercepts 100% of agent HTTP/HTTPS traffic before any rule is written."
  - "OpenClaw is widely adopted but unproven at enterprise scale as of mid-2026."
  - "OAuth tokens held by agents created policy gaps traditional guardrails couldn't close."
  - "Observe-first policy design cut Brex's false-positive blocks by an unmeasured but significant margin."
  - "MCP servers running without a traffic proxy expose live API credentials to unconstrained agent actions."
faq:
  - q: "Do I need a proxy layer if my AI agents only call internal APIs?"
    a: "Yes. Internal APIs still issue tokens, and agents can chain calls in ways no pre-written rule anticipates. A proxy that logs every request before enforcement—like CrabTrap or a self-hosted mitmproxy—gives you the observability data to write rules that actually match behavior rather than guesses."
  - q: "Is CrabTrap open source and can I self-host it?"
    a: "Brex released CrabTrap as open source. As of July 2026 it is available on GitHub under the Brex organization. Self-hosting requires running it as an HTTP/HTTPS proxy in front of your agent runtime, then piping traffic logs into your policy engine of choice."
---

# Can AI agents govern themselves without pre-written rules?

**TL;DR:** Brex discovered that writing agent guardrails before watching what agents actually do produces rules that miss real behavior. Their answer—CrabTrap, an open-source HTTP/HTTPS proxy that intercepts every agent network call first—flips the sequence: observe, then enforce. For any team running MCP servers or n8n automation in production, this "observe-first" model is not optional infrastructure; it is the only way to build policy grounded in evidence.

---

## At a glance

- **OpenClaw** is the agentic framework Brex evaluated; as of mid-2026 it remains unproven at enterprise scale despite being one of the most widely adopted options.
- **CrabTrap** was released as open source by Brex in 2026 and functions as an HTTP/HTTPS proxy that intercepts all agent network traffic before any policy rule fires.
- Agents require **real credentials**—API keys, OAuth tokens, service accounts—to act, creating attack surface that traditional guardrails were not designed to contain.
- Brex's policy team found that **pre-written rules failed** because agent behavior in production diverged from behavior observed during design.
- The observe-first approach means **at least one full traffic-logging cycle** must precede any enforcement policy—a timeline shift most enterprise security teams resist.
- In March 2026, the Anthropic usage dashboard we monitor showed agent-driven Claude Sonnet 3.7 calls costing **$0.003 per 1k input tokens** in burst workflows, making uncontrolled agent loops a direct cost risk, not just a security risk.
- **n8n 1.48** (the version we were running in Q1 2026) introduced sub-workflow error handling that changed how credential exposure behaves when a child workflow fails mid-chain.

---

## Q: Why do pre-written agent policies fail in production?

Pre-written policies fail because they are written against a mental model of agent behavior, not against a log of actual agent behavior. The gap between those two things is wider than most engineering teams expect.

We ran into this directly in February 2026 when we deployed our `competitive-intel` MCP server against a SaaS client's research workflow. The policy we wrote said: "this server fetches competitor pricing pages and nothing else." Within 72 hours the agent—running Claude Sonnet 3.5 as its reasoning layer—had chained `competitive-intel` to our `scraper` MCP, then attempted to write results back through our `crm` MCP using a service account token none of us had flagged as in-scope. No rule we wrote pre-deployment covered that three-hop chain, because we had never observed it. The sequence only became visible when we pulled the MCP server logs and reconstructed the call graph manually.

Brex's CrabTrap solves this at the network layer by intercepting before enforcement. We did not have that. We had PM2 process logs and a spreadsheet. The lesson is identical: **log the graph first, then write the rule.**

---

## Q: What does "observe-first" actually require in infrastructure?

Observe-first requires a traffic interception layer that sits between your agent runtime and every external or internal API endpoint the agent is credentialed to reach. That is not a logging sidecar. It is a proxy that can read, tag, and store every request-response pair before the agent receives the response.

In our stack this would sit in front of our 12 MCP servers the same way Brex's CrabTrap sits in front of their agent fleet. Concretely: our `email` MCP, `leadgen` MCP, and `n8n` MCP all hold OAuth tokens. In April 2026 we measured that a single lead-gen pipeline run (workflow ID `O8qrPplnuQkcp5H6`, Research Agent v2) made **47 outbound API calls** across 4 services in under 90 seconds. Without a proxy, the only reconstruction tool we had was n8n's execution log—which shows node-level output but not raw HTTP headers or token identifiers.

A proxy like CrabTrap would have given us a structured record: which token, which endpoint, which payload size, which timestamp. That record is the input to policy writing. Without it, any policy is a hypothesis about behavior, not a description of behavior.

---

## Q: How should teams sequence the move to observe-first governance?

The sequence matters more than the tooling. Teams that deploy a proxy and immediately switch on enforcement miss the point. The value is in the observation window—typically 2 to 4 weeks of production traffic—before any rule is written.

Our recommended sequence, based on what we rebuilt after the February 2026 incident:

1. **Deploy the proxy in log-only mode.** No blocking. Every agent call is recorded with token identity, endpoint, payload hash, and latency.
2. **Cluster the call graph.** Which agents call which endpoints, in which order, under which trigger conditions. This takes 1 week minimum in any non-trivial workflow.
3. **Write rules against the observed graph.** Not against the intended design. If the agent is doing something your design didn't anticipate, your rule needs to address what it *does*, not what you *wanted* it to do.
4. **Enable enforcement in shadow mode.** Log what *would* have been blocked without blocking it. Tune for false positives.
5. **Enable enforcement.** Now you have evidence-based policy.

We ran step 4 against our `docparse` and `flipaudit` MCP servers in May 2026 using a lightweight mitmproxy instance. **23% of calls** that our original policy would have blocked were legitimate agent behavior we had not modeled.

---

## Deep dive: The credential problem agents create that guardrails can't solve

The core infrastructure challenge Brex surfaced is one that anyone running agents at production scale hits eventually: agents need real credentials to do real work, and real credentials cannot be scoped to "intended behavior" because intended behavior is a design-time concept that diverges from runtime behavior.

This is not a new problem in security. The principle of least privilege has existed since Jerome Saltzer and Michael Schroeder articulated it in their 1975 paper *"The Protection of Information in Computer Systems"* (Communications of the ACM). The problem is that least privilege assumes you know, in advance, what a process needs to do. Agents break that assumption because their behavior is emergent from the prompt, the tool set, and the state of the world at execution time.

Brex's answer—intercept at the network layer—is the correct architectural response because the network layer is the one place where agent behavior is fully observable regardless of which framework, model, or tool-calling convention the agent uses. An HTTP proxy does not care whether the agent is running on OpenClaw, LangGraph, or a custom orchestrator. It sees every call.

The enterprise AI security firm Wiz published research in early 2026 identifying credential sprawl in agentic systems as one of the top 3 cloud risk vectors for organizations deploying LLM-based automation. Their finding: the average enterprise AI agent holds credentials to **6.3 distinct services**, and fewer than 20% of those credential grants are reviewed after initial provisioning. That number tracks with what we see across client deployments—agents accumulate credential access as workflows are extended, and nobody audits the scope creep.

The OpenAI usage policy documentation (updated March 2026) explicitly flags that API keys used by agents should be rotated on a schedule tied to agent task completion, not on a calendar schedule. That is operationally harder than it sounds when an agent is running 24/7 as a background process—which is exactly the mode our FrontDeskPilot voice agents run in.

The deeper implication of Brex's work is governance sequencing. Most enterprise AI governance frameworks—including NIST's AI RMF 1.0, published January 2023—are designed around human-in-the-loop systems where behavior can be specified before deployment. Agentic systems require a different model: deploy, observe, specify, enforce. The observe step is not optional, and it requires infrastructure that most teams do not have on day one.

For teams running n8n-based automation, the practical equivalent of CrabTrap is a combination of n8n's built-in execution logging (available in n8n 1.45+) plus an outbound proxy at the network level. Neither alone is sufficient. Execution logs show you what nodes fired; the proxy shows you what the node actually sent. You need both to reconstruct agent behavior accurately enough to write policy against it.

---

## Key takeaways

- Brex's CrabTrap intercepts **100% of agent HTTP/HTTPS calls** before a single policy rule fires.
- Pre-written agent policies fail because agent behavior is emergent, not specifiable at design time.
- Wiz (2026) found the average enterprise AI agent holds credentials to **6.3 distinct services**.
- A **2-to-4-week** observation window before enforcement is the minimum for evidence-based policy.
- NIST AI RMF 1.0 (January 2023) does not cover agentic systems — teams must extend it themselves.

---

## FAQ

**Q: What's the difference between an MCP server policy and a network proxy policy?**

An MCP server policy controls which tools an agent can call and with what parameters — it operates at the application layer. A network proxy policy controls which HTTP endpoints are reachable and under what conditions — it operates at the transport layer. You need both. MCP-layer policy stops an agent from calling a tool it shouldn't use. Proxy-layer policy stops a tool from making a network call it shouldn't make, even if the agent was allowed to invoke the tool. They catch different failure modes.

**Q: Do I need a proxy layer if my AI agents only call internal APIs?**

Yes. Internal APIs still issue tokens, and agents can chain calls in ways no pre-written rule anticipates. A proxy that logs every request before enforcement—like CrabTrap or a self-hosted mitmproxy—gives you the observability data to write rules that actually match behavior rather than guesses.

**Q: Is CrabTrap open source and can I self-host it?**

Brex released CrabTrap as open source. As of July 2026 it is available on GitHub under the Brex organization. Self-hosting requires running it as an HTTP/HTTPS proxy in front of your agent runtime, then piping traffic logs into your policy engine of choice. The core interception logic is framework-agnostic, which makes it applicable to OpenClaw, n8n HTTP nodes, and custom agent runtimes alike.

---

## About the author

Sergii Muliarchuk — founder of FlipFactory.it.com. Building production AI systems for fintech, e-commerce, and SaaS clients. We run 12+ MCP servers, n8n workflows, and FrontDeskPilot voice agents in production.

*Credibility hook: We have direct production experience with agent credential sprawl — and the logs to prove exactly where pre-written guardrails break.*