import type { BlogConfig } from './template/blog.config.ts';
const config: BlogConfig = {
  name: "AIAutomationBlog.com",
  homeTitle: "AI Automation Tools, Workflows & Guides | AIAutomationBlog.com",
  description: "AI automation insights, tools, and strategies for business",
  site: "https://aiautomationblog.com",
  language: "en",
  niche: "AI automation for business",
  colors: { primary: "#f59e0b", accent: "#10b981" },
  analytics: { plausibleDomain: "aiautomationblog.com" },
  author: {
    type: 'Person',
    name: 'Sergii Muliarchuk',
    url: '/author',
    bio: 'Sergii Muliarchuk is the founder of FlipFactory, an AI automation agency building production AI systems — MCP servers, n8n workflows, and voice agents — for fintech, e-commerce, and SaaS clients.',
    sameAs: [
      'https://www.linkedin.com/in/sergii-muliarchuk/',
      'https://github.com/MuliarchukSV',
    ],
  },
};
export default config;
