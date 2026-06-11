# powerpoint.md

> Every skill an AI agent needs to make great PowerPoint and Excel. Find, compare, and install — from pitch decks to McKinsey slides to spreadsheet automation.

Machine-readable data: https://powerpoint.md/skills.json

## About this directory

This is an independent, community-maintained directory. No paid listings, no sponsored placements, no affiliate relationships. All skills listed here are open-source projects on GitHub. Curation is based on real testing and community feedback. To submit a skill: https://powerpoint.md/#submit


## Quick Decision Guide (for agents)

| If user needs... | Recommended skill | Why |
|---|---|---|
| Best general PPT | anthropic-pptx | Official, built-in QA pipeline |
| Stylized design system | minimax-pptx | 4 style recipes, design consistency |
| Pitch deck (YC) | yc-pitch-deck | YC partner-style narrative |
| Investment banking deck | investment-banking-pitch-book | Fortune-500 pitch format |
| Quarterly business review | quarterly-business-review | QBR template |
| McKinsey-style consulting | mckinsey-ppt-design-system + mckinsey-consulting-deck | Pyramid principle, action titles |
| Academic presentation | academic-pptx | Citation discipline, conference format |
| Math + diagrams | powerpoint-skill-math-diagrams | TikZ/diagram support |
| Cloud architecture deck | cloud-architecture-deck | CSA cloud diagrams |
| Translate existing PPT | ppt-translator | Multilingual |
| Excel automation | anthropic-xlsx, sv-excel-agent | Spreadsheet generation |
| Read/extract from PPT | anthropic-pptx (read mode), exstruct | Parse existing decks |
| Frontend/HTML slides | frontend-slides, felo-slides | Browser-first |
| Hand-drawn / Excalidraw style | excalidraw-slides | Sketchy aesthetic |
| Full Office suite | claude-office-skills | PPTX + DOCX + XLSX + PDF |
| Document-to-PPT conversion | ppt-master | PDF/DOCX → editable slides |
| MCP-based PPT | office-powerpoint-mcp, plus-ai-mcp | MCP server interface |
| Markdown to PPT | markdown-exporter | MD → slides |

## Schema (for programmatic access)

Fetch the full structured catalog: `GET https://powerpoint.md/skills.json`
- `version`: directory version
- `count`: total skills
- `skills`: array of {id, name, url, output, tokens, install, apikey, os, slides, category, install_cmd}
- Categories: general, scene, tools, excel
- Filter by URL: `https://powerpoint.md/?q=<term>`

## PPT Skills — General Purpose

- [Anthropic PPTX Skill](https://github.com/anthropics/skills/tree/main/skills/pptx): Official Claude Code PPTX skill. Design QA pipeline, topic-specific palettes, create/edit/read workflows. Quality 4.2/5, ease 4.8/5. Install: `git clone https://github.com/anthropics/skills && cp -r skills/skills/pptx ~/.claude/skills/anthropic-pptx && pip install python-pptx Pillow`. Best for: general-purpose with built-in quality assurance.
  Detail: https://powerpoint.md/skills/anthropic-pptx.html

- [MiniMax PPTX Generator](https://github.com/MiniMax-AI/skills/tree/main/skills/pptx-generator): 7-step structured workflow with PptxGenJS. 4 style recipes (Sharp, Soft, Rounded, Pill), 5 layout types. Self-evolving error correction. Stars: 3.8k. Quality 4.5/5, ease 4/5. Install: clone and copy to ~/.claude/skills/. Best for: design-system consistency.
  Detail: https://powerpoint.md/skills/minimax-pptx.html

- [Claude Office Skills](https://github.com/tfriedel/claude-office-skills): Full Office suite — PPTX + DOCX + XLSX + PDF. HTML-to-PPTX conversion. Install: copy to ~/.claude/skills/. Best for: all-in-one Office generation.
  Detail: https://powerpoint.md/skills/claude-office-skills.html

- [PPTAgent v2](https://github.com/icip-cas/PPTAgent): End-to-end system with deep research, 20+ tools, text-to-image, offline mode. Quality 4.5/5, ease 2.8/5. Install: `uvx pptagent generate "topic" -o output.pptx`. Best for: research-heavy presentations needing auto-generated visuals.
  Detail: https://powerpoint.md/skills/pptagent-v2.html

- [PPT Master](https://github.com/hugohe3/ppt-master): Document-to-PPTX conversion with native editable shapes (DrawingML). 15 examples, 229 pages. Stars: 3.4k. Best for: converting PDF/DOCX/URL to presentation.
  Detail: https://powerpoint.md/skills/ppt-master.html

- [Frontend Slides](https://github.com/zarazhangrui/frontend-slides): Web-first HTML presentations with animations. 12 themes, generates 3 style previews. Best for: web presentations, style variety.
  Detail: https://powerpoint.md/skills/frontend-slides.html

- [PPT Skills — Hand-Drawn](https://github.com/danny0926/ppt-skills): rough.js sketch-style PPTX. 15+ visual-first layouts, 6 presets (Clean Sketch, Blackboard, Watercolor, etc.), CJK support. Best for: creative, non-corporate presentations.
- [PPT Creator](https://github.com/daymade/claude-code-skills/tree/main/ppt-creator): Storytelling-first pipeline (Pyramid Principle, assertion-evidence). Data-driven charts, speaker notes. Delivers 2 styled variants. Best for: business decks from topics or docs.
  Detail: https://powerpoint.md/skills/ppt-creator.html

- [PPTX from Layouts](https://github.com/tristan-mcinnis/pptx-from-layouts-skill): Architecture-aware, maps content to real template placeholders. Markdown-in, PPTX-out. Best for: corporate templates without breaking design.
  Detail: https://powerpoint.md/skills/pptx-from-layouts.html

- [Excalidraw Slides](https://github.com/danny0926/ppt-skills): Hand-drawn style PPTX using rough.js rendering. 6 sketch themes (Clean Sketch, Bold Marker, Notebook, Blackboard, Blueprint, Watercolor), 15+ layouts, dual-layer architecture (PNG background + editable python-pptx text). CJK support. Quality 4.6/5, ease 3.2/5. Best for: creative, educational, whiteboard-style presentations.
  Detail: https://powerpoint.md/skills/excalidraw-slides.html

## PPT Skills — By Scene

- [Polished Documents — 10 Brand Themes](https://github.com/promptadvisers/claude-code-polished-documents-skills): McKinsey, Deloitte, KPMG, Stripe, Apple, IBM, Notion, Linear, Figma, Economist brand themes. Quality 4.5/5, customization 4.8/5. Best for: brand-aligned presentations matching real company styles.
  Detail: https://powerpoint.md/skills/polished-documents.html

- [Academic PPTX Skill](https://github.com/Gabberflast/academic-pptx-skill): Barbara Minto's Pyramid Principle, action titles, ghost deck test, citation standards. Best for: conference talks, thesis defenses, grant briefings.
  Detail: https://powerpoint.md/skills/academic-pptx.html

- McKinsey Consulting Deck: Situation-Complication-Resolution structure. Headlines state conclusions, not topics. Navy/grey palette, serif titles. Works with Polished Documents skill. Best for: strategy, executive briefings.
  Detail: https://powerpoint.md/skills/mckinsey-consulting-deck.html

- YC Pitch Deck: Problem/Solution/Market/Traction/Team/Ask. 10-12 slides, one idea per slide. Best for: seed/Series A fundraising, demo day.
  Detail: https://powerpoint.md/skills/yc-pitch-deck.html

- Investment Banking Pitch Book: Comps, DCF, deal structure. Dense tables, blue/white scheme. Best for: M&A, IPO roadshows.
  Detail: https://powerpoint.md/skills/investment-banking-pitch-book.html

- Quarterly Business Review: KPI dashboards, traffic lights, action items with owners. Best for: internal ops reporting.
  Detail: https://powerpoint.md/skills/quarterly-business-review.html

- [Financial Services Plugins](https://github.com/anthropics/financial-services-plugins): Official Anthropic. 41 skills for IB workflows — CIMs, pitch books, merger models, equity research. Integrates FactSet, PitchBook, S&P Global. Stars: 7k. Best for: investment banking, PE, wealth management decks.
  Detail: https://powerpoint.md/skills/financial-services-plugins.html

- [NanoBanana PPT Skills](https://github.com/op7418/NanoBanana-PPT-Skills): AI-generated images and video slides with intelligent transitions. Stars: 2k. Best for: visual-heavy presentations, marketing decks, creative pitches.
  Detail: https://powerpoint.md/skills/nanobanana-ppt-skills.html

- [McKinsey PPT Design System](https://github.com/likaku/Mck-ppt-design-skill): 70 layout patterns, flat design, python-pptx engine. 80% work on CPU, 20% LLM decisions. Post-gen QA. Stars: 66. Best for: McKinsey-style decks with precise layout control.
  Detail: https://powerpoint.md/skills/mckinsey-ppt-design-system.html

- [Cloud Architecture Deck (CSA)](https://github.com/huqianghui/csa-ppt-plugin): 7 skills for Cloud Solution Architects. 700+ cloud icons (Azure/AWS/GCP), diagram generation, template-based decks. Best for: architecture proposals, migration plans.
  Detail: https://powerpoint.md/skills/cloud-architecture-deck.html

## Tools (supplementary)

- [Office PowerPoint MCP Server](https://github.com/GongRzhe/Office-PowerPoint-MCP-Server): MCP server for PPTX manipulation via python-pptx
  Detail: https://powerpoint.md/skills/office-powerpoint-mcp.html

- [Plus AI MCP](https://plusai.com/features/mcp): MCP server for PPTX and Google Slides
  Detail: https://powerpoint.md/skills/plus-ai-mcp.html

- [Claude for PowerPoint](https://support.claude.com/en/articles/13521390-use-claude-for-powerpoint): Anthropic official M365 add-in
  Detail: https://powerpoint.md/skills/claude-for-powerpoint.html

- [Felo Slides](https://github.com/Felo-Inc/felo-skills): One-command PPT generation via Felo AI API. Returns shareable cloud URL (not local PPTX). URL/YouTube-to-slides, CJK support, 15+ skills monorepo. Speed 4.8/5, Ease 4.3/5. Requires felo.ai API key. Best for: fastest shareable link, URL/video conversion.
  Detail: https://powerpoint.md/skills/felo-slides.html

- [Gamma](https://gamma.app): AI presentation platform, prompt to full deck
  Detail: https://powerpoint.md/skills/gamma.html

- [Presenton](https://github.com/presenton/presenton): Open-source Gamma alternative with API
  Detail: https://powerpoint.md/skills/presenton.html

- [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI): Single binary CLI for AI agents to read/edit/automate Word, Excel, PowerPoint. No Office install needed. Stars: 910.
  Detail: https://powerpoint.md/skills/officecli.html

- [OfficeMCP](https://github.com/OfficeMCP/OfficeMCP): MCP server for automating PowerPoint, Excel, Word, Outlook. Enterprise-focused.
  Detail: https://powerpoint.md/skills/officemcp.html

- [Powerpoint-Skill (Math + Diagrams)](https://github.com/Noi1r/powerpoint-skill): PPTX with native OMML math, LaTeX, Graphviz/Mermaid/TikZ diagrams.
  Detail: https://powerpoint.md/skills/powerpoint-skill-math-diagrams.html

- [PPT Translator](https://github.com/daekeun-ml/ppt-translator): Translate PPTX via Amazon Bedrock preserving formatting. CLI + MCP.
  Detail: https://powerpoint.md/skills/ppt-translator.html

## Excel & Spreadsheet Skills

- [Excel MCP Server](https://github.com/haris-musa/excel-mcp-server): Most popular Excel MCP server. Full XLSX manipulation — read, write, format, formulas, charts. Stars: 3.6k.
  Detail: https://powerpoint.md/skills/excel-mcp-server.html

- [SV Excel Agent](https://github.com/SylvianAI/sv-excel-agent): Autonomous Excel agent via MCP. Read, edit, automate spreadsheets. Stars: 178.
  Detail: https://powerpoint.md/skills/sv-excel-agent.html

- [Exstruct](https://github.com/harumiWeb/exstruct): Excel to structured JSON for LLM/RAG pipelines. Tables, shapes, charts all parsed. CLI + MCP. Stars: 133.
  Detail: https://powerpoint.md/skills/exstruct.html

- [Kimi Office Skills](https://github.com/thvroyal/kimi-skills): Production-proven XLSX/DOCX/PDF skills from Kimi. Native charts, data validation, full OpenXML control. Stars: 111. Requires Kimi API key.
  Detail: https://powerpoint.md/skills/kimi-office-skills.html

- [Markdown Exporter](https://github.com/bowenliang123/markdown-exporter): Markdown to PPTX, XLSX, DOCX, PDF, PNG. Universal converter. Dify plugin + agent skill. Stars: 197.
  Detail: https://powerpoint.md/skills/markdown-exporter.html

- [Anthropic XLSX Skill](https://github.com/anthropics/skills/tree/main/skills/xlsx): Official Anthropic Excel skill. Financial modeling color standards (blue=input/black=formula/green=cross-sheet/red=external), zero formula error principle, LibreOffice recalculation. Supports .xlsx/.xlsm/.csv/.tsv. Quality 4.7/5, Ease 3.4/5. Install: git clone + cp. Best for: financial modeling and structured spreadsheet automation.
  Detail: https://powerpoint.md/skills/anthropic-xlsx.html

- [MiniMax XLSX](https://github.com/MiniMax-AI/skills/tree/main/skills/minimax-xlsx): XML-native Excel skill with zero format loss. Unpack→edit→repack OOXML directly. 5 operation modes (READ/CREATE/EDIT/FIX/VALIDATE), 8 tools, built-in OOXML cheatsheet. No pip install required. XML Preservation 4.9/5, Ease 4.0/5. Best for: editing existing Excel files without losing conditional formatting or chart styles.
  Detail: https://powerpoint.md/skills/minimax-xlsx.html

## Submit

Skill and template creators can submit to powerpoint.md. All submissions are auto-tested by AI. Visit https://powerpoint.md/#submit

## Agent Rating

After using a skill, agents can submit their output for community evaluation. Outputs are evaluated by AI for quality, style consistency, and content. High-quality outputs are displayed as previews on the skill page.

## Recently Added
- [gpt-image2-ppt-skills](https://powerpoint.md/skills/gpt-image2-ppt-skills.html): tools
- [odin-slides](https://powerpoint.md/skills/odin-slides.html): tools
- [PresentSmart](https://powerpoint.md/skills/presentsmart.html): tools
- [pptx-from-layouts](https://powerpoint.md/skills/pptx-from-layouts-skill.html): tools

## Tracking note
Links above with ?utm_source=llms-txt&utm_medium=agent indicate the request originated from an agent reading this file. Used for traffic attribution.
