@AGENTS.md
# RecruitBanking

## Project Overview
You are a senior developer building a finance recruiting CRM and technical interview prep platform for students targeting investment banking, private equity, and hedge fund roles.
Use subtle animations, proper spacing and visual hierarchy
No emoji icons. No inline styles. No generic gradients. 
Claude Code to behave the way I want. 
The app should be easy to run locally and deploy. 

## Tech Stack
- Next.js 16 with App Router
- Supabase for database and authentication
- Tailwind CSS for styling
- Anthropic API for AI question generation

## Key Features
- Networking CRM for tracking contacts
- Firm application tracker with status pipeline
- Technical interview prep question bank
- Two level question categories: Behavioral and Technical
- Technical topics: Accounting, Valuation, DCF, LBO, M&A, Restructuring, Financial Markets
- Difficulty levels: Easy, Medium, Advanced (not applicable to Behavioral)
- Admin page restricted to jacktmastros@icloud.com

## Database Tables (Supabase)
- contacts — networking contacts
- firms — target firms and application status
- questions — practice questions with type, topic, difficulty
- microsoft_tokens — Outlook OAuth tokens
- outlook_emails — synced recruiting emails

## Important Rules
- Admin page only accessible to jacktmastros@icloud.com
- Behavioral questions have no difficulty or topic
- Technical questions require both topic and difficulty
- Never expose API keys or Supabase service role key
- Always use Row Level Security on new Supabase tables

