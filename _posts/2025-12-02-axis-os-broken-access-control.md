---
layout: post
title: "AXIS OS: Broken Access Control (CWE-862)"
date: 2025-12-02
categories: [Bug Bounty]
tags: [web, bac, access-control, bugbounty, axis]
---

This is the finding that kicked off my AXIS OS research — a broken access control vulnerability (CWE-862) that granted SSH access to the camera device without valid credentials.

## Discovery

While fuzzing the web management interface, I noticed that certain API endpoints enforced authentication on the UI layer but not on the underlying API routes. A direct request bypassed the session check entirely.

## Proof of Concept

```python
import requests

target = "http://192.168.x.x"
# Endpoint accessible without authentication
r = requests.get(f"{target}/axis-cgi/admin/param.cgi?action=list&group=root")
print(r.text)
```

The response contained sensitive device configuration — including SSH daemon status and permitted users.

## Escalation

With confirmation that SSH was enabled, credential guessing against default credential sets yielded a valid login, resulting in an interactive shell.

## Classification

- **CWE**: CWE-862 (Missing Authorization)
- **CVSS**: Medium
- **Impact**: Unauthorized access to device administration functions

## Takeaways

Always test API endpoints independently of their UI — authentication enforced in JavaScript or frontend routing is not real authentication.
