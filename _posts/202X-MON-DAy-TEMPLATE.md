---
layout: post
title: "[Room Name] Writeup"
date: YYYY-MM-DD
categories: [TryHackMe]
tags: [writeup]
---

Technical overview for the [Room Name] TryHackMe room. Room here: [room url]

## Enumeration

Nmap:
```bash
nmap -sV -sC -T4 -p- <TARGET_IP>
```

```
PORT   STATE SERVICE VERSION
...
```

Findings:
 * Port X is running ...
 * Port X is running ..., let's look into this

## Looking for Exploits

...

## Exploitation

...

## Finding Flags

```bash
find . -name user.txt
cat ./path/to/user.txt
THM{...}

find . -name root.txt
cat ./path/to/root.txt
THM{...}
```

## Notes

- CVE reference (if applicable): 
- Additional resources:

Thank you for reading!
