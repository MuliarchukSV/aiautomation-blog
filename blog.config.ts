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
    name: 'Sergii Muliarchuk',
    url: 'https://flipfactory.it.com',
    sameAs: [
      'https://www.linkedin.com/in/sergii-muliarchuk/',
      'https://github.com/MuliarchukSV',
    ],
  },
};
export default config;
