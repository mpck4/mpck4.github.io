---
layout: post
title: "Crackmes.one [TrynaToBe6for6Def's My First Crackme] Writeup"
date: 2026-10-21
categories: [Crackmes]
tags: [writeup, ghidra]
---

Technical overview for the [TrynaToBe6for6Def's My First Crackme] Crackmes.one room. Room here: [TrynaToBe6for6Def's My First Crackme](https://crackmes.one/crackme/6ac65258cdee6e086a17364d)

### Ghidra

Extract and open the exe:

<img width="973" height="282" alt="image" src="https://github.com/user-attachments/assets/27f9a226-c98f-47bb-93df-537f9b076e53" />

I looked for main, but that was not present. Ghidra did find entry, and it is where we will start:

<img width="877" height="233" alt="image" src="https://github.com/user-attachments/assets/6f1a89b9-fe30-4ee5-a778-bffcc671980b" />

I think this is where we start, it takes in 4 parameters and then calls a function `FUN_140...` with them!

<img width="1072" height="858" alt="image" src="https://github.com/user-attachments/assets/c47ec124-fc0a-4033-a12e-0502784fea74" />

We get dropped into a pretty big function, luckily ghidra made some comments saying which calls return nothing, my guess is to trace the one that actually has a return:

This one does, lets move forwards and see where it brings us. 

After many dead ends, I finally find where the logic brings us:

<img width="804" height="621" alt="image" src="https://github.com/user-attachments/assets/bf4b5b98-ec4b-46f4-8e67-f3c2121549ba" />

From here, it looks like we are close, and from here I try to understand the password logic:

<img width="755" height="795" alt="image" src="https://github.com/user-attachments/assets/fc016d9e-00aa-4d91-80ed-7e4ef3225e67" />

Ok, so I kept tracing the functions until I found this:

<img width="832" height="798" alt="image" src="https://github.com/user-attachments/assets/a825f042-5ddc-4ea4-8339-6368956fc3cf" />

From there, went through naming vars until we found the pass_checker func:

<img width="900" height="382" alt="image" src="https://github.com/user-attachments/assets/b30d386b-20d4-49c6-b389-dfd025a43dc3" />

From there, the in_checker func led us to: 

<img width="595" height="344" alt="image" src="https://github.com/user-attachments/assets/53928dc5-4ba4-42ba-ad8b-5ec3ba0db52c" />

From here, we find the final logic!

The decoder XORs 13 bytes at DAT_1400030e4 with 0x2a to build the expected password at runtime, then pass_checker strcmps your input against it. 

<img width="1287" height="702" alt="image" src="https://github.com/user-attachments/assets/070e6c14-e0f2-4e5d-b17e-f0ce3f0367ba" />

To get those values, I did:

<img width="931" height="409" alt="image" src="https://github.com/user-attachments/assets/ac56c15e-ea70-491f-a0c0-be18e32368e7" />

I originally tried the plain ascii column, but the second byte (0x19) is non-printable, so I tried to get the flag from hex.

In Cyberchef:

<img width="860" height="514" alt="image" src="https://github.com/user-attachments/assets/7ccfd0a5-1fa7-4de5-88e2-bdda3bc20902" />

And we found the answer, nice.

<img width="474" height="110" alt="image" src="https://github.com/user-attachments/assets/cc9e57cf-d82c-4c36-8c1e-527505f04c70" />

Thank you for reading!

*(AI disclosure, I used Claude as a hint-giver while learning Ghidra. It helped me interpret decompiler output and suggested CyberChef for decoding, but didn’t give me the answer.)*

