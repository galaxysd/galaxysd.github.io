---
layout: post
date: 'Wed 2016-04-03 00:22:06 +0800'
slug: "Make-Windows-Setup-USB-in-CLI"
title: Make Windows Setup USB in CLI
description: 
category: 
tags: Galaxy_Original, Tips
---

# How to Make indows Setup USB (mostly) with CLI

## Steps

### Starts with a new USB Flash Device (UFD)

* Use “Boot Camp Assistant” to format the UFD. It is fine to stop its 1st creation step after it starts copy Windows files from ISO.
  - Or, you can follow this:
	 * Prepair the UFD with a MBR partition that larger than your ISO.

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

According to [Set Boot Camp partition to boot to Windows via command line](http://hints.macworld.com/article.php?story=20110601220925705)

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

According to [TechNet](https://technet.microsoft.com/en-us/library/cc749415(v=ws.10\).aspx), `X:\Unattend.xml` or `X:\Autounattend.xml` will be used for Unattended Windows Setup.

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

````xml
<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
	  <settings pass="windowsPE">
		<component name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<UserData>
				<ProductKey>
					<WillShowUI>Always</WillShowUI>
				</ProductKey>
			</UserData>
		</component>
		<component name="Microsoft-Windows-PnpCustomizationsWinPE" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<DriverPaths>
				<PathAndCredentials wcm:keyValue="1" wcm:action="add">
					<Path>$WinPEDriver$</Path>
				</PathAndCredentials>
			</DriverPaths>
		</component>
	</settings>
	<settings pass="specialize">
		<component name="Microsoft-Windows-Deployment" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<RunSynchronous>
				<RunSynchronousCommand wcm:action="add">
					<Order>1</Order>
					<Path>cmd /c "FOR %i IN (X F E D C) DO (FOR /F "tokens=6" %t in ('vol %i:') do (IF /I %t NEQ "" (IF EXIST %i:\BootCamp\BootCamp.xml Reg ADD "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v AppsRoot /t REG_SZ /d %i /f )))"</Path>
				</RunSynchronousCommand>
			</RunSynchronous>
		</component>
	</settings>
	<settings pass="oobeSystem">
		<component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<FirstLogonCommands>
			  <SynchronousCommand wcm:action="add">
				  <Description>BootCamp setup</Description>
				  <CommandLine>%AppsRoot%:\BootCamp\setup.exe</CommandLine>
				  <Order>1</Order>
				  <RequiresUserInput>false</RequiresUserInput>
			  </SynchronousCommand>
			</FirstLogonCommands>
		</component>
	</settings>
</unattend>
````

### Driver injection with `$WinPeDriver$`

According to [KB2686316](https://support.microsoft.com/en-us/kb/2686316):

#### Summary

When adding a driver into installation media, do not mix versions. Use the same version of each driver throughout the media.

There are several different methods for including out-of-box drivers into Winpe (boot.wim) and the target installing operating system (install.wim). If the driver versions do not match, the first driver loaded into memory will be used regardless of PNP ranking rules. Other versions may be marked as ‘Bad’ drivers which will prevent these drivers from being selected by PNP at a later time. Thisincludes any driver loaded into memory during the boot to WinPE (Winpe phase) of installation. Examples could include injecting drivers into boot.wim via DISM.exe or loading a driver using Drvload.exe to manually load the driver.

#### Introduction

Consider the following scenario: you are creating a custom Windows Pre-installation Environment (WinPE) image for the purposes of installing Windows operating systems that needs an out-of-box storage controller driver prior to running Setup.exe in order to manipulate the disks.  Additionally, you want to provide “up-to-date” drivers for inclusion via the `\$WinPEDriver$` folder feature of Setup, to include later versions of the same driver.

The $WinPEDriver$ feature is intended as a method to provide drivers at installation time.  However, it is a feature of Setup.exe, and as such is not invoked until after Setup.exe launches.  Drivers for present devices which are injected manually into the WinPE boot.wim driverstore using DISM are loaded into memory at boot time.  These two mechanisms are separate, and there are some caveats to using them together.   

WinPE does not have a built in mechanism to unload drivers which have been loaded into memory, so any drivers for devices which have already been loaded will not be reloaded once setup.exe starts, as there are already drivers for the device loaded. This error will cause Setup to mark the driver in the $WinPEDriver$ folder as a bad driver, even if it is newer than the driver version injected into WinPE and would otherwise outrank it. Setup has no explicit knowledge of drivers that have been loaded into the boot.wim.

This behavior is by design; however this article will identify a method of accommodating this scenario so these drivers can still be included in the deployable operating system.

In this document we are going to be highlighting methods for injecting drivers and launching windows.

#### The following chart briefly depicts methods and results of including drivers.

WinPE (in-box native or injected) | (out-box drivers in $WinPEDriver$) | Result (Post OS)
:--- | :--- | :---
If WinPE contains driver version X1 injected via Dism.exe | contains X2 version of driver with same driver name | X1 will be carried in post OS installation and X2 will be ignored
If WinPE installs driver X2 using Drvload.exe from `\$WinPEDriver$` | contains X2 version of driver with same driver name | X2 will be carried in post OS installation
if WinPE contains driver X1 which is not boot-critical (in-box native) | contains no driver | Will use in-box native driver X1. No out of box driver will be available for that device post OS installation

#### Methods for adding drivers to Windows:

* Dism.exe
 1. Dism /get-wiminfo /wimfile:_pathto_Install.wim 
 2. Dism /mount-wim /wimfile:_pathto_Install.wim /index:n /mountdir:_pathto_mount
 3. Dism /add-driver [and conversely /remove-driver] /image:_pathto_mount /driverpath:_pathto_driverINF
 4. Dism /unmounts-wim /commit /mountdir:_pathto_mount
* \$WinPEDriver$
* Running a script during unattended installation
 1. unattend.xml (driverstore) in WinPE and Audit Mode (more information is in the References and Links section).
 2. Setupcomplete.cmd ‘can’ be used for driver injection, but is strongly advised against as it is a poor user experience and can cause delays in booting to the desktop for the first time.
* Drvload.exe
 1. Only injects drivers into the currently running OS, which in the case of WinPE is typically RAM disk.
 2. Drvload _pathto_.INF (can be scripted in startnet.cmd (see [examples](https://support.microsoft.com/en-us/kb/2686316)))

#### Manual integration and installation question from [driverpacks.net](http://forum.driverpacks.net/viewtopic.php?id=4725)

##### METHOD 1 (too long):

first, you HAVE to dism mass storage drivers (and lan - if you enabled network for pe in answer file) into boot.wim (2nd index only needed for setup) cause it runs completely from memory and copies nothing to hdd (and dvd drive could be ANY letter at this point) - it is equivalent to integrating them in I386 folder as before for xp

but know that the injected drivers are automaticaly expanded within image, and multiple copies of them are kept separately if there are more than one .inf files per folder (or multiple entries in a single *.inf), so integrate only boot critical drivers this way (chipset, storage and lan) or your image may not fit on a dvd - and you can actualy run out of ram when booting from it

* mount image (must be writable, so copy to hdd first):

	`Dism /Mount-Wim /WimFile:C:\test\boot.wim /Index:2 /MountDir:C:\test\offline`

* remove old drivers (skip if this is the first time):

	`Dism /Image:C:\test\offline /Remove-Driver /Driver:OEM1.inf /Driver:OEM2.inf ...  /Driver:OEM99.inf`

  - how ever many there are third party drivers in `C:\test\offline\Windows\Inf` folder, you cant uninstall default ones

* inject all the drivers from C:\D folder, including in subfolders and even unsigned ones:

	`Dism /Image:C:\test\offline /Add-Driver /Driver:C:\D /Recurse /ForceUnsigned`

* dismount image (and then replace boot.wim from where you got it):

	`Dism /Unmount-Wim /MountDir:C:\test\offline /Commit`

second, you create a `$OEM$\$$\Inf\D` folder INSIDE sources folder on install dvd/usb (not in root anymore) and add ALL the drivers there (`dvd:\sources\$OEM$\$$\Inf\D`) - they get automaticaly copied to `C:\Windows\Inf\D` folder during install (and windows already searches for drivers there on its own, including subfolders), only needed ones also get copied to windows driverstore folder, so you can safely delete `C:\Windows\Inf\D` after install if you wish

##### METHOD 2 (but only for vista/2008 with any integrated service pack, or 7 and 2008 R2):

at install windows automaticaly searches ALL the available drives for `$WinPEDriver$` folder (not $WinPEDriverS$) in its root, so copy only boot critical drivers there (`dvd:\$WinPEDriver$`), they can be in subfolders too and are used during the whole install

but beware not to run out of ram as before, cause WinPE doesnt have anywhere else to keep its driverstore folder but memory

also - if a driver fails to inject in boot.wim with dism tool (as in previous method) the setup WILL fail if you put it in $WinPEDriver$ folder, so i suggest that you test all the drivers with dism FIRST (you can see the failed ones in C:\Windows\Logs\DISM\dism.log file) and move the bad ones to dvd:\sources\$OEM$\$$\Inf\D folder (as in previous method)

winpe supports cabbed drivers - but i had to expand some to work with dism (only 2 or 3 out of ALL the available driverpacks, but just one can fuck you up)

##### METHOD 3 (too large):

forget everything from above and in the answer file for install.wim image, under Microsoft-Windows-Setup in WinPE pass just set UseConfigurationSet to true - now you have a system variable %configsetroot% which always points to the drive containing autounattend.xml in its root (doesnt need to be the install drive)

add the `%configsetroot%\your_drivers_path` to Microsoft-Windows-PnpCustomizationWinPE as a device driver path, and they are immediately available from the very start

but know that ALL the files from `%configsetroot%` drive WILL be automaticaly copied to `C:\Windows\configsetroot` folder, which can safely be deleted afterwards


EDIT: corrected $OEM$\$$\Windows\Inf\D to $OEM$\$$\Inf\D (but $OEM$\$1\Windows\Inf\D would work too)

Last edited by pOcHa (2010-10-31 12:10:48)

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

* <http://seafre.co.uk/blog/2015/05/guide-windows-to-go-10-install-via-cmd/>
* <http://superuser.com/questions/581972/how-to-restore-windows-7-boot-sector-from-linux>
* <http://userpages.uni-koblenz.de/~krienke/ftp/noarch/geteltorito/>
* a demo [Windows Server 2012 R2 Autounattend.xml](https://gist.github.com/sneal/a1ef4e9d5c2f86f8580b):

````xml
<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
	<settings pass="windowsPE">
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-International-Core-WinPE" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<SetupUILanguage>
				<UILanguage>en-US</UILanguage>
			</SetupUILanguage>
			<InputLocale>en-US</InputLocale>
			<SystemLocale>en-US</SystemLocale>
			<UILanguage>en-US</UILanguage>
			<UILanguageFallback>en-US</UILanguageFallback>
			<UserLocale>en-US</UserLocale>
		</component>
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<DiskConfiguration>
				<Disk wcm:action="add">
					<CreatePartitions>
						<CreatePartition wcm:action="add">
							<Order>1</Order>
							<Size>350</Size>
							<Type>Primary</Type>
						</CreatePartition>
						<CreatePartition wcm:action="add">
							<Extend>true</Extend>
							<Order>2</Order>
							<Type>Primary</Type>
						</CreatePartition>
					</CreatePartitions>
					<ModifyPartitions>
						<ModifyPartition wcm:action="add">
							<Active>true</Active>
							<Format>NTFS</Format>
							<Label>Boot</Label>
							<Order>1</Order>
							<PartitionID>1</PartitionID>
						</ModifyPartition>
						<ModifyPartition wcm:action="add">
							<Format>NTFS</Format>
							<Label>System</Label>
							<Order>2</Order>
							<PartitionID>2</PartitionID>
						</ModifyPartition>
					</ModifyPartitions>
					<DiskID>0</DiskID>
					<WillWipeDisk>true</WillWipeDisk>
				</Disk>
			</DiskConfiguration>
			<ImageInstall>
				<OSImage>
					<InstallFrom>
						<MetaData wcm:action="add">
							<Key>/IMAGE/NAME </Key>
							<Value>Windows Server 2012 R2 SERVERSTANDARD</Value>
						</MetaData>
					</InstallFrom>
					<InstallTo>
						<DiskID>0</DiskID>
						<PartitionID>2</PartitionID>
					</InstallTo>
				</OSImage>
			</ImageInstall>
			<UserData>
				<ProductKey>
					<Key>KKT38-NXVDQ-FYHJT-YKKJG-8TXCB</Key>
					<WillShowUI>OnError</WillShowUI>
				</ProductKey>
				<AcceptEula>true</AcceptEula>
				<FullName>Vagrant</FullName>
				<Organization>Vagrant</Organization>
			</UserData>
		</component>
	</settings>
	<settings pass="specialize">
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<OEMInformation>
				<HelpCustomized>false</HelpCustomized>
			</OEMInformation>
			<ComputerName>vagrant-2012r2</ComputerName>
			<TimeZone>Pacific Standard Time</TimeZone>
			<RegisteredOwner/>
		</component>
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-ServerManager-SvrMgrNc" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<DoNotOpenServerManagerAtLogon>true</DoNotOpenServerManagerAtLogon>
		</component>
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-IE-ESC" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<IEHardenAdmin>false</IEHardenAdmin>
			<IEHardenUser>false</IEHardenUser>
		</component>
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-OutOfBoxExperience" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<DoNotOpenInitialConfigurationTasksAtLogon>true</DoNotOpenInitialConfigurationTasksAtLogon>
		</component>
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-Security-SPP-UX" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<SkipAutoActivation>true</SkipAutoActivation>
		</component>
	</settings>
	<settings pass="oobeSystem">
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<AutoLogon>
				<Password>
					<Value>vagrant</Value>
					<PlainText>true</PlainText>
				</Password>
				<Enabled>true</Enabled>
				<Username>vagrant</Username>
			</AutoLogon>
			<FirstLogonCommands>
				<SynchronousCommand wcm:action="add">
					<CommandLine>cmd.exe /c powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force"</CommandLine>
					<Description>Set Execution Policy 64 Bit</Description>
					<Order>1</Order>
					<RequiresUserInput>true</RequiresUserInput>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>C:\Windows\SysWOW64\cmd.exe /c powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force"</CommandLine>
					<Description>Set Execution Policy 32 Bit</Description>
					<Order>2</Order>
					<RequiresUserInput>true</RequiresUserInput>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\reg.exe ADD HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced\ /v HideFileExt /t REG_DWORD /d 0 /f</CommandLine>
					<Order>16</Order>
					<Description>Show file extensions in Explorer</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\reg.exe ADD HKCU\Console /v QuickEdit /t REG_DWORD /d 1 /f</CommandLine>
					<Order>17</Order>
					<Description>Enable QuickEdit mode</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\reg.exe ADD HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced\ /v Start_ShowRun /t REG_DWORD /d 1 /f</CommandLine>
					<Order>18</Order>
					<Description>Show Run command in Start Menu</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\reg.exe ADD HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced\ /v StartMenuAdminTools /t REG_DWORD /d 1 /f</CommandLine>
					<Order>19</Order>
					<Description>Show Administrative Tools in Start Menu</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\reg.exe ADD HKLM\SYSTEM\CurrentControlSet\Control\Power\ /v HibernateFileSizePercent /t REG_DWORD /d 0 /f</CommandLine>
					<Order>20</Order>
					<Description>Zero Hibernation File</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\reg.exe ADD HKLM\SYSTEM\CurrentControlSet\Control\Power\ /v HibernateEnabled /t REG_DWORD /d 0 /f</CommandLine>
					<Order>21</Order>
					<Description>Disable Hibernation Mode</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>cmd.exe /c wmic useraccount where "name='vagrant'" set PasswordExpires=FALSE</CommandLine>
					<Order>22</Order>
					<Description>Disable password expiration for vagrant user</Description>
				</SynchronousCommand>
				<SynchronousCommand wcm:action="add">
					<CommandLine>%SystemRoot%\System32\netsh.exe advfirewall set allprofiles state off</CommandLine>
					<Order>23</Order>
					<Description>Disable Windows Firewall</Description>
				</SynchronousCommand>  
				<SynchronousCommand wcm:action="add">
					<CommandLine>c:\windows\system32\WindowsPowerShell\v1.0\powershell.exe a:\configure-winrm.ps1</CommandLine>
					<Description>Configure WinRM</Description>
					<Order>24</Order>
					<RequiresUserInput>true</RequiresUserInput>
				</SynchronousCommand>
			</FirstLogonCommands>
			<OOBE>
				<HideEULAPage>true</HideEULAPage>
				<HideLocalAccountScreen>true</HideLocalAccountScreen>
				<HideOEMRegistrationScreen>true</HideOEMRegistrationScreen>
				<HideOnlineAccountScreens>true</HideOnlineAccountScreens>
				<HideWirelessSetupInOOBE>true</HideWirelessSetupInOOBE>
				<NetworkLocation>Home</NetworkLocation>
				<ProtectYourPC>1</ProtectYourPC>
			</OOBE>
			<UserAccounts>
				<AdministratorPassword>
					<Value>vagrant</Value>
					<PlainText>true</PlainText>
				</AdministratorPassword>
				<LocalAccounts>
					<LocalAccount wcm:action="add">
						<Password>
							<Value>vagrant</Value>
							<PlainText>true</PlainText>
						</Password>
						<Group>administrators</Group>
						<DisplayName>Vagrant</DisplayName>
						<Name>vagrant</Name>
						<Description>Vagrant User</Description>
					</LocalAccount>
				</LocalAccounts>
			</UserAccounts>
			<RegisteredOwner/>
		</component>
	</settings>
	<settings pass="offlineServicing">
		<component xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="Microsoft-Windows-LUA-Settings" processorArchitecture="amd64" publicKeyToken="31bf3856ad364e35" language="neutral" versionScope="nonSxS">
			<EnableLUA>false</EnableLUA>
		</component>
	</settings>
	<cpi:offlineImage xmlns:cpi="urn:schemas-microsoft-com:cpi" cpi:source="wim:c:/wim/install.wim#Windows Server 2012 R2 SERVERSTANDARD"/>
</unattend>
````
