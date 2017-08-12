---
layout: post
slug: "2017-08-12-phicomm-k2-k2p-firmwares"
title: PHICOMM(斐讯)K2/K2P固件与刷机
description: 
category: Linux, OpenWRT
tags: Galaxy, Tips
---

## OpenWrt

### 在国内的演化：DreamBox -> PandoraBox

#### OpenWrt中文网的[记载](https://dev.openwrt.org.cn/wiki)

[OpenWrt](https://dev.openwrt.org/)是一个高度模块化、高度自动化的嵌入式Linux系统，拥有强大的网络组件，常常被用于工控设备、电话、小型机器人、智能家居、路由器以及VOIP设备中。 

[​OpenWrt](https://wiki.openwrt.org/about/history)支持各种处理器架构，无论是对ARM，X86，PowerPC或者MIPS都有很好的支持。 其多达3000多种软件包，囊括从工具链(toolchain)，到内核(linux kernel)，到软件包(packages)，再到根文件系统(rootfs)整个体系，使得用户只需简单的一个make命令即可方便快速地定制一个具有特定功能的嵌入式系统来制作固件。 其模块化设计也可以方便的移植各类功能到OpenWrt下，加快开发速度。

[OpenWrt中文网](http://www.openwrt.org.cn/)创建于2010年2月14日。[OpenWRT](https://wiki.openwrt.org/zh-cn/about/history) 12.09 开始的 DreamBox，内部代号 [PandoraBox](https://forum.openwrt.org/viewtopic.php?id=49938) (潘多拉魔盒)。

#### [知乎](https://www.zhihu.com/question/33277589/answer/59817065)的介绍

> Linksys 放出了WRT54G的源代码之后，开源爱好者便清楚了Linksys是如何操作这些硬件的，这样WRT54G就从黑盒子变为了白盒子。OpenWRT的和WRT54G相关的内核驱动的代码都经过了重写，以保证其版权100%属于OpenWRT的版权所有人。

> tomato和ddwrt的代码与OpenWrt的源代码并无直接的联系，虽然ddwrt有在使用OpenWrt的GPL的内核补丁，但是应用层的软件、启动代码等都有很大不同。

据知乎[报道](https://www.zhihu.com/question/33277589/answer/60825547)，OpenWrt-DreamBox(梦想之盒)是 *由 [OpenWrt中国](www.openwrt.org.cn) 创始人之一的 [Lintel](lintel.huang@gmail.com) 所带领的技术团队维护。*

> PB是基于OP深度定制的路由器系统，系统底层部分采用了原厂原声驱动，而非开源驱动，使其相比OP有更好的稳定性。由于OP配置及二次开发的方便性，加上Lintel根据中国网络环境对PB作出的调整及优化，受到不少互联网大咖的关注（听说还有橄榄枝）。在中国深圳，不少公司厂家推出的“基于OP深度定制的系统”，使用的是当时开源的DreamBox源码或者泄漏的早期PB源码。现时PB已得到OP的官方支持，而PB的成员也向OP贡献代码。

## 其他固件

### Padavan(华硕固件/老毛子)

出处：Andy [Padavan](https://bitbucket.org/padavan/) 写的<https://bitbucket.org/padavan/rt-n56u/src>。JackyBao做的 斐讯 K2 PSG1218[完美适配](http://www.right.com.cn/forum/thread-187561-1-1.html)最后更新于[2017-02-03](https://bitbucket.org/JackyBao/padavan/commits/all)。重点是 *开启了2.4G和5G外置PA & LNA支持 and 使用斐讯原厂的增益参数优化无线信号和传输速率*。

## 斐讯[相关固件命名](http://www.right.com.cn/forum/thread-204532-1-1.html)

````
斐讯  K1    （PSG 1208  A1）
斐讯  K1S   （PSG 1208  B1）
斐讯  K2    （PSG 1218  A1/A2/A6）
斐讯  K2C   （PSG 1218  B1）
````

因为斐讯的英文是phicomm, **[潘多拉固件](http://bbs.pandorabox.com.cn/pandorabox-16-10-stable/targets/ralink/mt7620/)**对应的是phicomm-k1（斐讯K1）、phicomm-k2（斐讯K2）:

* <http://bbs.pandorabox.com.cn/pandorabox-16-10-stable/targets/ralink/mt7620/PandoraBox-ralink-mt7620-phicomm-k1-2017-01-03-git-6c24a7a-squashfs-sysupgrade.bin>
* <http://bbs.pandorabox.com.cn/pandorabox-16-10-stable/targets/ralink/mt7620/PandoraBox-ralink-mt7620-phicomm-k2-2017-01-03-git-6c24a7a-squashfs-sysupgrade.bin> [本地镜像](/assets/wp-uploads/2018/PandoraBox-ralink-mt7620-phicomm-k2-2017-01-03-git-6c24a7a-squashfs-sysupgrade.rar)
* 因为斐讯 K1S 和斐讯 K2C 用的人少，所以K1S就用K1的固件，K2C就用K2的固件。

K1是PSG1208，K2是PSG1218。所以 **华硕hiboy固件** 对应的是PSG1208（斐讯K1）、[PSG1218](https://bitbucket.org/JackyBao/padavan/downloads/)（斐讯K2）

因为斐讯K1、K2的主控soc是MT7620+MT7612E，网口顺序都是LLLLW，不同点是K2多了PA。
所以 **[Tomato Phoenix](http://dl.tomato.org.cn/mt7620/V105/) 不死鸟固件** 对应的是：

````
斐讯 K1 —— MT7620-MT7612E-LLLLW
斐讯 K2 —— MT7620-MT7612E-LLLLW-PA
````

* <http://dl.tomato.org.cn/mt7620/V105/Tomato-Phoenix-MT7620-MT7612E-LLLLW-V105@2017-07-25.trx>
* <http://dl.tomato.org.cn/mt7620/V105/Tomato-Phoenix-MT7620-MT7612E-LLLLW-PA-V105@2017-07-25.trx>
* 固件默认登录用户名:root 密码:tomato.org.cn


## 路由器[硬件](https://wiki.openwrt.org/doc/hardware/soc/soc.mediatek)配置



### K2


### K2P







Since [DSM 6](https://www.synology.com/en-us/dsm/6.1), there is no longer `/usr/syno/etc.defaults/rc.d/S01iptables.sh` as mentioned in [2013](https://forum.synology.com/enu/viewtopic.php?f=39&t=62014) and [2014](https://forum.synology.com/enu/viewtopic.php?f=3&t=70083). The later thread mentioned the message, `insmod: ERROR: could not insert module /lib/modules/nf_nat.ko: Unknown symbol in module`, but till [2017](https://forum.synology.com/enu/viewtopic.php?f=3&t=70083&start=30#p490276), no one solve this problem.
