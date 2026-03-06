# mpck4 — Jekyll Blog

Dark terminal-aesthetic cybersecurity blog. Built from scratch — no external theme dependency.

## Quick Start

### Prerequisites
- Ruby >= 3.0
- Bundler: `gem install bundler`

### Local development

```bash
bundle install
bundle exec jekyll serve --livereload
# → http://localhost:4000
```

### Build for production

```bash
bundle exec jekyll build
# Output in _site/
```

## GitHub Pages deploy

1. Push this repo to `github.com/<username>/<username>.github.io`
2. Go to **Settings → Pages → Source → Deploy from branch → main / root**
3. Your site will be live at `https://<username>.github.io`

> **Note:** GitHub Pages runs Jekyll automatically — no CI needed for a basic setup.

## Customization

### Add your avatar
Drop your image at `assets/img/avatar.png` and add this to `_config.yml`:
```yaml
author:
  avatar: /assets/img/avatar.png
```

### Write a post
Create a file in `_posts/` named `YYYY-MM-DD-your-title.md`:

```markdown
---
layout: post
title: "TryHackMe: Some Room"
date: 2025-01-15
categories: [TryHackMe]
tags: [web, sqli, privesc]
---

Your writeup here...
```

### Update stats
The right sidebar stats block is in `_includes/sidebar-right.html`. Edit the hardcoded values (THM rooms, rank) to match your current stats.

## Structure

```
.
├── _config.yml          # Site settings
├── _layouts/
│   ├── default.html     # Outer shell (sidebar, topbar, footer)
│   ├── home.html        # Post list
│   └── post.html        # Individual writeup
├── _includes/
│   ├── head.html        # <head> meta/CSS
│   ├── sidebar-left.html
│   └── sidebar-right.html
├── _sass/               # Modular SCSS
│   ├── _variables.scss
│   ├── _base.scss
│   ├── _layout.scss
│   ├── _sidebar.scss
│   ├── _archives.scss
│   └── _post.scss
├── assets/css/main.scss # SCSS entry point
├── _pages/
│   ├── archives.html
│   ├── tags.html
│   ├── categories.html
│   └── about.md
└── _posts/              # Your writeups go here
```
