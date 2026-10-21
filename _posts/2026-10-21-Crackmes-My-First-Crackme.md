---
layout: post
title: "Crackmes.one [TrynaToBe6for6Def's My First Crackme] Writeup"
date: 2026-10-21
categories: [Crackmes]
tags: [writeup, ghidra]
---

Technical overview for the [TrynaToBe6for6Def's My First Crackme] Crackmes.one room. Room here: [(https://crackmes.one/crackme/6ac65258cdee6e086a17364d)]

### Ghidra

Extract and open the exe:

<img width="973" height="282" alt="image" src="https://github.com/user-attachments/assets/27f9a226-c98f-47bb-93df-537f9b076e53" />

I looked for main, but that was not present. Ghidra did find entry, and it is where we will start:

<img width="812" height="221" alt="image" src="https://github.com/user-attachments/assets/148bb0fd-2a99-490b-8a8c-94e1fada889c" />

I think this is where we start, it takes in 4 parameters and then calls a function `FUN_140...` with them!

<img width="1072" height="858" alt="image" src="https://github.com/user-attachments/assets/c47ec124-fc0a-4033-a12e-0502784fea74" />

We get dropped into a pretty big function, luckily ghidra made some comments saying which calls return nothing, my guess is to trace the one that actually has a return:

<img width="656" height="151" alt="image" src="https://github.com/user-attachments/assets/1446aa3b-30f9-4a44-8747-92bd0bb970cd" />

This one seemingly does, lets try and figure it out.

will return later.

