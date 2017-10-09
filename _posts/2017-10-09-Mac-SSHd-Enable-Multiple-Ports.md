---
layout: post
title: Enable Multiple Ports for SSHd on Mac
category: Server
status: publish
tags: [Mac, Galaxy]
---

See
<https://apple.stackexchange.com/questions/82750/how-do-i-enable-multiple-sshd-ports-in-mountain-lion> and
<http://hints.macworld.com/article.php?story=20050707140439980>.

## Contents

The original *Sockets* settings in the `/System/Library/LaunchDaemons/ssh.plist` file:

````xml
	<key>Sockets</key>
	<dict>
		<key>Listeners</key>
		<dict>
			<key>SockServiceName</key>
			<string>ssh</string>
			<key>Bonjour</key>
			<array>
				<string>ssh</string>
				<string>sftp-ssh</string>
			</array>
		</dict>
	</dict>
````

To add port *222*, add the content of the middle box below:

````xml
	<key>Sockets</key>
	<dict>
		<key>Listeners</key>
		<dict>
			<key>SockServiceName</key>
			<string>ssh</string>
			<key>Bonjour</key>
			<array>
				<string>ssh</string>
				<string>sftp-ssh</string>
			</array>
		</dict>
````

````xml
		<key>ListenersFW</key>
		<dict>
			<key>SockServiceName</key>
			<string>222</string>
		</dict>
````

````xml
	</dict>
````

If you are *EP* (EggPain) enough to use **SockServiceName**s, modify `/etc/services` to add the name as:

````
#                          Jon Postel <postel@isi.edu>
ssh              22/udp     # SSH Remote Login Protocol
ssh              22/tcp     # SSH Remote Login Protocol
ssh-alt        4790/udp
ssh-alt        4790/tcp
````

, and then use this middle box instead.

````xml
		<key>Alternate Listeners</key>
		<dict>
			<key>SockServiceName</key>
			<string>ssh-alt</string>
		</dict>
````

To restart sshd service:

````bash
sudo launchctl unload /System/Library/LaunchDaemons/ssh.plist ;
sudo launchctl load /System/Library/LaunchDaemons/ssh.plist
````

It seems that `launchctl unload` will not terminate current SSH session, thus it is safe to run it.
Also, for safty, you can run like *A && B*, or even *A;B*.

## One More Thing, ...

For *OS X El Capitan 10.11* or later, you must disable the rootless feature, SIP (System Integrity Protection) to modify `ssh.plist`.
As System Integrity Protection locks down the following system level directories in Mac OS X:

````
/System
/sbin
/usr (with the exception of /usr/local subdirectory)
````

Simply speaking, execute `csrutil disable`.

### a bit history

<https://gist.github.com/djtech42/7233c602fda912d96fdf>

````bash
#!/bin/bash
#OS X El Capitan Beta 4 to Final Public Release (Must be run in Recovery Mode)
csrutil disable

#OS X El Capitan Beta 1-3
sudo nvram boot-args="rootless=0";sudo reboot
````

### the Guide

1. Reboot the Mac and hold down Command + R keys simultaneously after you hear the startup chime, this will boot OS X into Recovery Mode
2. When the “OS X Utilities” screen appears, pull down the ‘Utilities’ menu at the top of the screen instead, and choose “Terminal”
3. Type the following command into the terminal then hit return: `csrutil disable; reboot`.
4. You’ll see a message saying that System Integrity Protection has been disabled and the Mac needs to restart for changes to take effect, and the Mac will then reboot itself automatically, just let it boot up as normal

### Another thing

If you are wondering how to disable the Gatekeeper, execute `sudo spctl --master-disable`.
