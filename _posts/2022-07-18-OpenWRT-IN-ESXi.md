---
layout: post
title: Running OpenWRT in ESXi 
category: Linux
status: publish
tags: [Galaxy]
---

The offical guide [OpenWrt on x86 hardware (PC / VM / server)](https://openwrt.org/docs/guide-user/installation/openwrt_x86) is a bit out date. Here are some notes.

The downloads link should be (https://downloads.openwrt.org/), which lists the latest version.  
The _Upcoming Stable Release_ should be fine, as many Chinese BBS have use v.22 now. 
And personally, I prefer `nftables` over old `iptables` so that I can skip learning some old fasion things. 
See [OpenWrt 22.03 release notes](https://openwrt.org/releases/22.03/notes-22.03.0-rc1#firewall4_based_on_nftables).

An example download page link for `/x86/64/` is [22.03.0-rc4](https://downloads.openwrt.org/releases/22.03.0-rc4/targets/x86/64/),  
Select _generic-ext4-combined-efi.img.gz_ for a disk image uses a single read-write ext4 partition with no read-only squashfs root filesystem, which allows to enlarge the partition. 
However, features like Failsafe Mode or Factory Reset won't be available as they need a read-only squashfs partition to function. 

The image can boot in UEFI mode. 
As v.22, `VMXNET3` is supported out-of-box, and NVMe SSD support is available since OpenWrt 21.02. 

To convert to vmdk:
```bash
cp openwrt-22.03.0-rc4-x86-64-generic-ext4-combined-efi.img.gz openwrt2203.img.gz -a
gzip -d openwrt2203.img.gz
qemu-img convert -f raw -O vmdk openwrt2203.img openwrt2203.vmdk
scp openwrt2203.vmdk root@x.x.x.x:/vmfs/volumes/datastore1/iso/
```

## Installation

Create a _Linux_ VM for _Other 5.x or later Linux (64-bit)_, named, eg. _OpenWRT22_. 
Remove its _Hard disk 1_ during creation.

On ESXi, terminal:
```bash
cd /vmfs/volumes/datastore1
vmkfstools -d thin -i iso/openwrt2203.vmdk OpenWRT22/OpenWRT22.vmdk
```

Add this `OpenWRT22.vmdk` as an _Existing hard disk_. 
Then, ESXi web page will highlight for a larger size, set it to _256_ MB, or larger as your wish.

## Resizing partitions

The guide use delete-and-create way for a larger one, and then update the GPT partition UUID in the GRUB configuration. It is better to copy the UUID and then set it back with `gdisk`.

## Resizing filesystem

A forum [post](https://forum.openwrt.org/t/expanding-the-squashfs-file-system/97099/4) shows a better [solution](https://github.com/openwrt/openwrt/issues/7729) 
than later post on [#11](https://forum.openwrt.org/t/expanding-the-squashfs-file-system/97099/11). However, the guide follow the `#11` method, risking having two host to write to the same filesystem without knowing each other.

The [solution](https://github.com/openwrt/openwrt/issues/7729#issuecomment-1075445684) also metions `parted` can resize a partition without having to delete it first.

```bash

```

Another way to the resize before convert raw disk image to vmdk under Linux.
```bash
qemu-img resize -f raw openwrt2203.vmdk 256M
sudo losetup -f -P openwrt2203.img
losetup -l
LOOP="$(losetup -ln|cut -d' ' -f1)"
sudo fsck.ext4 -y ${LOOP}p2
sudo resize2fs ${LOOP}p2
sudo losetup -d $LOOP
```

The `fsck.ext4` shows _rootfs: clean, 1444/6656 files, 5072/26624 blocks_, and does not change anything here.  
Since no other one has mount it, the filesystem should be clean.

The `resize2fs` shows _The filesystem is already 26624 (4k) blocks long.  Nothing to do!_.  
However, it acrually write to the partition and change the image file hash value. 
For resized `openwrt2203.img`, SHA1 hash changes from _53eeb2cd54ba2f174429d99c298e4db1b4cf9ed1_ to a new value.

