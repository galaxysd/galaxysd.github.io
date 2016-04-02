---
layout: post
date: 'Wed 2016-04-03 00:22:06 +0800'
slug: "Make-Windows-Setup-USB-in-CLI"
title: Make indows Setup USB in CLI
description: 
category: 
tags: Galaxy_Original, Tips
---

# How to Make indows Setup USB (mostly) with CLI

## Steps

### Starts with new USB stricks

* Use “Boot Camp Assistant” to format the USB. It is fine to stop its 1st creation step after it starts copy Windows files from ISO.
 - Or, you can follow this:
	 * Prepair the USB stick with a MBR partition that larger than your ISO.

````bash
sudo dd of=/dev/disk3 if=/Applications/Utilities/Boot\ Camp\ Assistant.app/Contents/Resources/applembr.bin bs=440 count=1
````

* 
 - 
	 * Format it as FAT32.
	 * Boot Sector can be write under Windows. DO NOT use `/mbr` BELOW !

````dos
bootsect /nt60 E:
````

* Use "[Brigadier](https://github.com/timsutton/brigadier)" to download Boot Camp ESD ("Electronic Software Distribution")
 - Untill 2016-04, there are 4 BootCampESD.pkg for Intel-based Macs
	 * 031-11269: PostDate 2015-02-09 18:42:38
		 - For MacBook2,1, MacBook3,1, MacBook4,1, MacBook5,1, MacBook5,2, MacBook5,3, MacBook6,1, MacBook7,1, MacBookAir1,1, MacBookAir2,1, MacBookAir3,1, MacBookAir3,2, MacBookPro2,1, MacBookPro2,2, MacBookPro3,1, MacBookPro4,1, MacBookPro5,1, MacBookPro5,2, MacBookPro5,3, MacBookPro5,4, MacBookPro5,5, _MacBookPro6,1, MacBookPro6,2, MacBookPro7,1, MacBookPro8,1, MacBookPro8,2, MacBookPro8,3,_ MacPro1,1, MacPro2,1, MacPro3,1, _MacPro4,1, MacPro5,1,_ Macmini2,1, Macmini3,1, Macmini4,1, iMac5,1, iMac6,1, iMac7,1, iMac8,1, iMac9,1, iMac11,1, iMac11,2, _iMac11,3, iMac12,1, iMac12,2_.
		 - URL <http://swcdn.apple.com/content/downloads/41/25/031-11269/hpi4khg5mrvy75pcamao1thdrwm3qetgk0/BootCampESD.pkg>.
	 * 031-11273: PostDate 2015-02-09 18:42:37
		 - For MacBookAir4,1, MacBookAir4,2, _MacBookAir5,1, MacBookAir5,2,_ MacBookPro6,1, MacBookPro6,2, MacBookPro8,1, MacBookPro8,2, MacBookPro8,3, MacBookPro9,1, MacBookPro9,2, MacPro4,1, MacPro5,1, Macmini5,1, Macmini5,2, Macmini5,3, Macmini6,1, Macmini6,2, iMac11,3, iMac12,1, iMac12,2, _iMac13,1, iMac13,2, iMac13,3_.
		 - URL <http://swcdn.apple.com/content/downloads/49/05/031-11273/5qfjtqt2lcs827m29kn7hv83w570ju9l96/BootCampESD.pkg>.
	 * 031-55710: PostDate 2016-04-01 22:22:52
		 - For MacBook8,1, MacBookAir5,1, MacBookAir5,2, MacBookAir6,1, MacBookAir6,2, MacBookAir7,1, MacBookAir7,2, MacBookPro9,1, MacBookPro9,2, MacBookPro11,1, MacBookPro11,2, MacBookPro11,3, MacBookPro11,4, MacBookPro11,5, MacBookPro12,1, MacPro6,1, Macmini6,1, Macmini6,2, Macmini7,1, iMac13,1, iMac13,2, iMac13,3, iMac14,1, iMac14,2, iMac14,3, iMac14,4, iMac15,1.
		 - URL <http://swcdn.apple.com/content/downloads/39/14/031-55710/u2c6bi4yl91ud1lqc3k53bx9860hvsnf7z/BootCampESD.pkg>.
	 * 031-13951: For iMac16,1, iMac16,2, iMac17,1.
		 - URL <http://swcdn.apple.com/content/downloads/08/53/031-13951/0azyj3l0sl4tkq4p874eibrrbokomwt6qw/BootCampESD.pkg>.
 * The Python script use temp dir like: `/var/folders/yt/vz1gkrnd0h9gmpc5p5pggrfr0000gn/T/bootcamp-unpack_*/`.

* Query [MSDN](https://msdn.microsoft.com/subscriptions/securedownloads/#searchTerm=&ProductFamilyId=636&Languages=en&Architectures=x64&PageSize=10&PageIndex=0&FileId=0) for ISO file names and their SHA1 hashes, Google for downloading.
 - One place I find useful is [Windows ISO Download – #1 Windows ISO mirror](http://windowsiso.net/windows-10-iso/windows-10-th2-u1-download-build-10586-104/windows-10-th2-u1-iso-download-standard/).

### Update to another Windows ISO

* Copy files from `ISO` and `WindowsSupport.dmg` to USB:

````bash
rsync -ah /Volumes/J_CCSA_X64FRE_ZH-CN_DV5/ /Volumes/WININSTALL/
rsync -ah --progress --stats /Volumes/Boot\ Camp/ /Volumes/WININSTALL/
````

### Set Boot Order

Accroding to [Set Boot Camp partition to boot to Windows via command line](http://hints.macworld.com/article.php?story=20110601220925705)

````bash
/usr/sbin/bless --device /dev/disk0s3 --setBoot --legacy --nextonly 
````

It will set the partition that lives on `/dev/disk0s3` to boot for next restart only, and the `-legacy` option supports booting an OS that does not support EFI boot loaders. Since Windows still requires older technology like a BIOS to actually load from, the `-legacy` option gives that support.

In the end I wrapped this command up in a Casper policy and allowed users to execute it via self service, which is a web-like app that users can execute policies on their own, and they run as root. So, the user just clicked on the dual boot policy and hit install. The Self Service app ran the `bless` command and a command to force a reboot. 

## Notes

### MBR

The MBR partition table stores the partitions info in the first sector of a hard disk [as follows](https://wiki.archlinux.org/index.php/Master_Boot_Record):

Location in the HDD | Purpose of the Code
:--- | :---
001-440 bytes | MBR boot code that is launched by the BIOS.
441-446 bytes | MBR disk signature.
447-510 bytes | Partition table (of primary and extended partitions, not logical).
511-512 bytes | MBR boot signature 0xAA55.

So people write [this](http://unix.stackexchange.com/questions/111895/copy-mbr-and-boot-partition-to-a-smaller-disk) to transfer MBR:

	dd if=/dev/mmcblk0 of=mbr_image bs=512 count=1
	dd if=mbr_image of=/dev/mmcblk0 bs=446 count=1

### AutoUnattend.xml

Accroding to [TechNet](https://technet.microsoft.com/en-us/library/cc749415(v=ws.10\).aspx), `X:\Unattend.xml` or `X:\Autounattend.xml` will be used for Unattended Windows Setup.

Search Order | Location | Description
:--- | :--- | :---
1 | Registry `HKLM\System\Setup!UnattendFile` | Specifies a pointer in the registry to an answer file. The answer file is not required to be named Unattend.xml.
2 | `%WINDIR%\Panther\Unattend` | The name of the answer file **must be** Unattend.xml or Autounattend.xml. | Note   Windows Setup only searches this directory on downlevel installations. If Windows Setup starts from Windows PE, the %WINDIR%\Panther\Unattend directory is not searched.
3 | `%WINDIR%\Panther` | Windows Setup caches answer files to this location.<br>_Important:_ **Do not overwrite the answer files in these directories.**
4* | Removable read/write media in order of drive letter, at the root of the drive. | The name of the answer file **must be** `Unattend.xml` or `Autounattend.xml`, and the answer file **must be** located at the root of the drive.
5* | Removable read-only media in order of drive letter, at the root of the drive. | The name of the answer file **must be** `Unattend.xml` or `Autounattend.xml`, and **must be** located at the root of the drive.
6 | windowsPE and offlineServicing passes: `\Sources` directory in a Windows distribution;<br>All other passes: `%WINDIR%\System32\Sysprep` | In the windowsPE and offlineServicing passes, the name of the answer file **must be** Autounattend.xml. _For all other configuration passes, the file name **must be** Unattend.xml._
7 | `%SYSTEMDRIVE%` | The answer file name **must be** Unattend.xml or Autounattend.xml

\* The name of the answer file must be Unattend.xml or Autounattend.xml, and must be located at the root of the drive.

## Other unused methods

* [How to Copy an ISO to a USB Drive from Mac OS X with dd](http://osxdaily.com/2015/06/05/copy-iso-to-usb-drive-mac-os-x-command/)

````bash
sudo umount /dev/disk3s2
sudo dd if=~/Desktop/Windows10_x64_EN-US.iso of=/dev/rdisk3s2 bs=1m
diskutil eject /dev/disk3s2
####
sudo umount /dev/disk3s2
sudo dd if=~/Desktop/Windows10_x64_EN-US.iso of=/dev/rdisk3 bs=1m
diskutil eject /dev/disk3
````

Note that an ‘r’ signifier is placed in front of the disk identifier, this makes the command much faster. The ‘bs=1m’ at the end is for blocksize, which also speeds up the process. Neither of these adjustments are necessary to copy the ISO to the disk image successfully, it just results in a notably faster experience.

## etc

* <http://superuser.com/questions/581972/how-to-restore-windows-7-boot-sector-from-linux>
* <http://userpages.uni-koblenz.de/~krienke/ftp/noarch/geteltorito/>
