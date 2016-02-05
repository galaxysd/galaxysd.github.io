---
layout: post
date: 'Mon 2013-06-17 19:46:51 +0800'
slug: "use-ec2-to-link-to-a-rare-seeder-across-cn-edu-and-cn-public"
title: "用亚马逊云服务来使中国教育网和中国公网间得以连上稀有种子进行传输"
description: ""
category: 
tags: [Galaxy, Story]
---

额，本文只是抱怨的，明明地理位置没多远，教育网到电信间的网速比绕到新加坡走一趟还慢……

种子信息：

	Name:             Frozen Planet 2011 [BD 1920x1080 AVC FLAC] - mawen1250
	Info hash:        64DAA7E6DE0F73A6159C7EA15EDDC1ECF0CC3DA5
	Created:          09/04/2013 12:15:06


从4月9号到现在，都两个月了，原始发布的 mawen1250（馼205）君一直也在seeding，但从5月份开始就是龟速了，最近15天以上都一直是96%。跑去问 mawen1250，才知道一直以来那个seeder就是他……

于是，面对绝境，又不想麻烦 mawen1250 传百度网盘，就打算从国外绕一圈。

众所周知，教育网和公网间，本来就是国与国间的天堑。以前观察的结果是，大部分情况下到深圳进公网。而 mawen1250 在上海电信，上海明显是走日本那边出国的。尽管没调查具体路由情况，但，事实证明，直接连是零传输。

Amazon的EC2，相信通过方校长考验，并且不屑使用车轮教工具的中国人都不会陌生，就是一个提供8G硬盘602M内存的虚拟机。而Galaxy以前测试发现新加坡和日本的速度差不多甚至更快，就选了新加坡。

EC2的流量是按流出的计费，而我是96%进度，单缺EP03，所以差不了多少。这半个月来，下载的人就我一个。所以，要计费的流量其实就是我差的那4%。

装rtorrent不是问题，但下载却遇到磁盘空间不够的难题。这个种子是29G的HDTV的BDrip，每集平均4G。而rtorrent下载时，会把涉及到的 Chunks 全部生成文件。就是说，即使只下EP3，也会生成3集约12G的文件。

当然，不是无解。直接用`touch $f && truncate -s $size $f`就可以生成sparse文件，然后再喂给rt，就能解决rt自己不产生sparse file的问题。

比如现在：

	$ ls -sh bt/Frozen\ Planet\ 2011\ \[BD\ 1920x1080\ AVC\ FLAC\]\ -\ mawen1250/
	total 4.8G
	2.1M Frozen Planet 2011 - EP02 Spring [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv
	4.8G Frozen Planet 2011 - EP03 Summer [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv
	   0 Frozen Planet 2011 - EP04 Autumn [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv
	
	$ ls -lh bt/Frozen\ Planet\ 2011\ \[BD\ 1920x1080\ AVC\ FLAC\]\ -\ mawen1250/
	total 4.8G
	-rw-r--r-- 1 ec2-user ec2-user    0 Jun 17 04:58 Frozen Planet 2011 - EP01 To the End of the Earth [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv
	-rw-r--r-- 1 ec2-user ec2-user 4.0G Jun 17 11:07 Frozen Planet 2011 - EP02 Spring [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv
	-rw-r--r-- 1 ec2-user ec2-user 4.8G Jun 17 12:29 Frozen Planet 2011 - EP03 Summer [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv
	-rw-r--r-- 1 ec2-user ec2-user 4.3G Jun 17 10:15 Frozen Planet 2011 - EP04 Autumn [BD 1920x1080 25.000fps AVC-yuv420p10 FLAC AC3 PGS Chap] - mawen1250.mkv

最后是结果，一下午就熬到99%（ Chunks:7319 / 7354 * 4194304 (35) ），
再花几天就能下完了！


加速结果留影：
（反正国内IP都是公开的秘密，就不打码了。Amazon那边还是码上，毕竟那是对外不对内的存在……）

Edu.CN:

	                             *** Frozen Planet 2011 [BD 1920x1080 AVC FLAC] - mawen1250 ***
	                 IP              UP     DOWN   PEER   CT/RE/LO  QS    DONE  REQ   SNUB  FAILED
	Peer list        54.xxx.xx.xxx   0.0    0.9    6.8    L /Ui/ui  0/2     0   2544               libTorrent 0.12.9.0
	                 114.85.84.150   0.0    0.5    0.0    R /Un/ci  0/2   100   2545               uTorrent 2.2.1.0

EC2:

	                 IP              UP     DOWN   PEER   CT/RE/LO  QS    DONE  REQ   SNUB  FAILED
	Peer list        114.85.84.150   0.0    10.8   0.0    R /Un/ci  0/11  100   2553               uTorrent 2.2.1.0
	                 162.105.250.22  1.6    0.7    0.0    R /Ui/ui  0/2    99   2129               libTorrent 0.13.2.0


嗯，从0提升到1.6kb/s，这已经是难以想象的神迹了，吧。
（好像和南非的信鸽差不多的水平……
