---
layout: post
date: 'Wed 2016-02-03 14:09:06 +0800'
slug: "on-dropbox"
title: "On Dropbox"
description: ""
category: 
tags: Galaxy, Tips
---

## Install on Linux

Follow the Gentoo ebuild [net-misc/dropbox/dropbox-3.12.6.ebuild](https://gitweb.gentoo.org/repo/gentoo.git/tree/net-misc/dropbox/dropbox-3.12.6.ebuild).

* Unpack `dropbox-lnx.x86_64-3.12.6.tar.gz` and move `.dropbox-dist/dropbox-lnx.x86_64-3.12.6/*` to `/opt/dropbox/`.
* `ldd /opt/dropbox/dropbox` to confirm all `.so` libs are exists at `/lib64/`. Then rm them following:

````bash
	rm -vf libbz2* libpopt.so.0 libpng12.so.0 || die
	rm -vf libdrm.so.2 libffi.so.6 libGL.so.1 libX11* || die
	rm -vf libQt5* libicu* qt.conf || die
	rm -vf wmctrl || die
	rm -vrf PyQt5* *pyqt5* images || die
	# rm -vf librsync.so.1 || die # 删除`librsync.so.1`会报错，因为它需要"net-libs/librsync-1"。
	rm -rf library.zip || die # '*.egg'需要保留。
	ln -s dropbox library.zip || die
````

### For **systemd**

* `/usr/lib/systemd/system/dropbox@.service`:

````ini
[Unit]
Description=Dropbox
After=local-fs.target network.target

[Service]
ExecStart=/opt/dropbox/dropboxd
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=always
User=%I

[Install]
WantedBy=multi-user.target
````
* `systemctl`:

````bash
systemctl enable dropbox@galaxy
systemctl start dropbox@galaxy
systemctl status dropbox@galaxy.service
journalctl -xe

systemctl daemon-reload
systemctl reset-failed
````
* the [Official](http://www.dropboxwiki.com/tips-and-tricks/using-the-official-dropbox-command-line-interface-cli) Dropbox CLI

````bash
wget -O ~/bin/dropbox.py "https://www.dropbox.com/download?dl=packages/dropbox.py"
````
Mirrored [here](/assets/wp-uploads/2016/dropbox.py) due to the GFW.

### for **OpenRC**

* `/etc/init.d/dropbox`

````bash
#!/sbin/runscript
# Copyright 1999-2014 Gentoo Foundation
# Distributed under the terms of the GNU General Public License, v2 or later
# $Id$

depend() {
	need localmount net
	after bootmisc
}

start() {
	local tmpnice="${NICE:+"--nicelevel "}${NICE}"
	local tmpionice="${IONICE:+"--ionice "}${IONICE}"
	local started=""

	ebegin "Starting dropbox"
	for dbuser in ${DROPBOX_USERS}; do
	local homedir=$(eval echo ~${dbuser})
	if test -d "${homedir}" && \
		echo 0 > ${homedir}/.dropbox/dropbox.pid && \
		start-stop-daemon -S -b \
		${tmpnice} ${tmpionice} \
		-u ${dbuser} -v \
		-p ${homedir}/.dropbox/dropbox.pid \
		-e HOME=${homedir} \
		-x /opt/bin/dropbox; then
		started="${started} ${dbuser}"
	else
		eend $?
		eerror "Failed to start dropbox for ${dbuser}"
		if [ -n "${started}" ]; then
		eerror "Stopping already started dropbox"
		DROPBOX_USERS=${started} stop
		fi
		return 1
	fi
	done
	if [ -z "${started}" ];then
	eerror "No dropbox started"
	eend 1
	else
	eend 0
	fi
}

stop() {
	local retval=0
	ebegin "Stopping dropbox"
	for dbuser in ${DROPBOX_USERS}; do
	local homedir=$(eval echo ~${dbuser})
	start-stop-daemon --stop \
		--pidfile ${homedir}/.dropbox/dropbox.pid || retval=$?
	done
	eend ${retval}
}

status() {
	for dbuser in ${DROPBOX_USERS}; do
	local homedir=$(eval echo ~${dbuser})
	if [ -e ${homedir}/.dropbox/dropbox.pid ] ; then
			echo "dropboxd for USER $dbuser: running."
	else
			echo "dropboxd for USER $dbuser: not running."
	fi
	done
}
````

* `/etc/conf.d/dropbox.conf`

````bash
# /etc/conf.d/dropbox.conf: config file for /etc/init.d/dropbox

# Users to run dropbox
DROPBOX_USERS=""

# integer [-20 .. 19 ] default 0
# change the priority of the server -20 (high) to 19 (low)
# see nice(1) for description
#NICE=0

# See start-stop-daemon(8) for possible settings
#IONICE=2

PID_DIR=/var/run/dropbox
````

---

## Multiple Dropbox Accounts/Instances

### Multiple Dropboxen on Mac [the right way](http://www.codeography.com/2011/07/07/multiple-dropboxen-on-mac.html)

* `~/Library/LaunchAgents/com.dropbox.alt.plist`, updating the *USERNAME* for *your username*.

````xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.dropbox.alt</string>
    <key>LowPriorityIO</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
      <key>HOME</key>
      <string>/Users/USERNAME/.dropbox-alt</string>
    </dict>
    <key>ProgramArguments</key>
    <array>
      <string>/Applications/Dropbox.app/Contents/MacOS/Dropbox</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
</plist>
````

* run the following commands:

````bash
launchctl load ~/Library/LaunchAgents/com.dropbox.alt.plist
launchctl start com.dropbox.alt
````

The Dropbox dialog will appear. On the "Setup Type" screen of their installer make sure you change the folder to a custom location that makes sense for you (otherwise it will put it in ~/.dropbox-alt/Dropbox).

![custom location](/assets/wp-uploads/2016/DropboxAdv.png)

Done. No faux app bundles. Everything is controled by launchd, just the way it should be.

注意：Dropbox的邀请会判断是否在同一电脑上关联。所以新帐号如果是邀请的，需要换新用户运行Dropbox才有效。

另外，关于不登录直接运行Dropbox，[有人说](http://superuser.com/questions/549793/starting-dropbox-on-os-x-through-ssh-without-needing-to-log-in-to-desktop)ssh进去后`open -a "Dropbox.app"`就可以了，没测试。

---

### [offical wiki](http://www.dropboxwiki.com/tips-and-tricks/run-multiple-instances-of-dropbox-simultaneously-on-linux-or-mac-os-x) for Mac

````bash
HOME=$HOME/.dropbox-alt /Applications/Dropbox.app/Contents/MacOS/Dropbox &
````

#### Automator Method

1. Open Automator from your Applications folder
2. Choose the ‘Application’ template from the template chooser
3. In the Actions Pane on the right side, Choose ‘Library > Utilities’
4. From the next pane choose ‘Run Shell Script’ and drag it into your workflow.
5. In the Run Shell Script text box, paste the command you used above:<br> `bash HOME=$HOME/.dropbox-alt /Applications/Dropbox.app/Contents/MacOS/Dropbox &`
6. Make sure to include the linebreak.
7. Run the script (button on the top right) to make sure it works.
8. Go to File > Save As and save anywhere.
9. Add the resulting application to your Login items.

#### App Bundle Method

In order to run the second instance automatically on login, you’ll have to create a small app bundle, which you will later add to startup items in the System Preferences “Accounts” pane. Starts by pasting the following command into Terminal. Again, do not include the initial dollar sign of each block:

````bash
mkdir -p ~/<whaveter place you like>/DropboxAltStarter.app/Contents/MacOS/
````

This will create recursively, if they do not exist, the folders “DropboxAltStarter.app”, “Contents” and “MacOS”. If you change the name “DropboxAltStarter” for something else, make sure you change it everywhere relevant in the next lines.

Now, open a text editor, and paste the following code:

````xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
		<key>CFBundlePackageType</key>
		<string>APPL</string>
		<key>CFBundleExecutable</key>
		<string>DropboxAltStarter</string>
		<key>LSUIElement</key>
		<string>1</string>
	</dict>
</plist>
````

And save it with the name “Info.plist” (this is crucial, do not choose another name) and save the file inside “DropboxAltStarter.app/Contents”! Now, open a new text file in the text editor, and paste the following text (warning: make sure you remove the leading whitespaces – I had to put one because of wiki formatting):

````bash
#!/bin/bash  HOME=/Users/$USER/.dropbox-alt /Applications/Dropbox.app/Contents/MacOS/Dropbox
````

and save it with the same name as specified in the Info.plist file (i.e. look at the string just below “`<key>CFBundleExecutable</key>`”). And save the file inside “DropboxAltStarter.app/Contents/MacOS”! (Yes, with “MacOS” this time). You can close your text editor.

Make sure that your script is executable, by typing the following command in a terminal:

````bash
chmod 755 ~/<whatever place you like>/DropboxAltStarter.app/Contents/MacOS/DropboxAltStarter
````

Now, in the “`<whaveter place you like>`” directory, you have a small Mas OS X app bundle. You can add it to your login items in the System Preferences->Accounts. You can also double-click on it everytime you need to start this second instance of Dropbox (i.e. if it crashed).

---

### on Linux, [offical wiki](http://www.dropboxwiki.com/forums-faq/running-multiple-instances-of-dropbox)

````bash
mkdir ~/.dropbox-alt
HOME=~/.dropbox-alt dropbox start -i # run the Dropbox installer in “first use” mode
ln -s ~/.dropbox-alt/Dropbox ~/DropboxAlt

# run the “alternate” Dropbox manually, for testing
HOME=~/.dropbox-alt ~/.dropbox-alt/.dropbox-dist/dropboxd
````

---

## Tips

### Check for 'conflicted copy'

````bash
# https://github.com/chauncey-garrett/osx-launchd-check-for-dropbox-conflicts
# this will look for files with the name "'s conflicted copy YYYY-MM-DD" in it
# except this in the Trash or the .dropbox.cache folder.
find "$HOME/Dropbox" -path "*(*'s conflicted copy [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*" -print |egrep -v "$HOME/Dropbox/.dropbox.cache|$HOME/.Trash/"
````

### 3rd-party Tools

* Dropbox Uploader <https://github.com/andreafabrizi/Dropbox-Uploader>

Dropbox Uploader is a **BASH** script which can be used to upload, download, delete, list files (and more!) from **Dropbox**, an online file sharing, synchronization and backup service.  
It's written in BASH scripting language and only needs **cURL**.


