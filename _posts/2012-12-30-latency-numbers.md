---
layout: post
title: "Latency Numbers Every Programmer Should Know"
tagline:
description: ""
category: Coding
tags: [System, ZT]
comments: true
published: true
---

本文的灌水动机来自于5天前HN十大的一篇[Latency Numbers Every Programmer Should Know](http://news.ycombinator.com/item?id=4966363),
一名UCB的学生将计算机系统中的延迟时间(latency time)进行了数据图形化[猛击这里](http://www.eecs.berkeley.edu/~rcs/research/interactive_latency.html). 通过拖动标记年份的滚动条, 我们可以很直观地看到CPU cache, main memory, network上的科技进步对系统延迟时间的影响. 然而看完这幅图, 我不禁有点好奇这些数字的来源, 所以我对其进行了一下小调查.

虽然说是调查, 但如果有人细心观察过[页面](http://www.eecs.berkeley.edu/~rcs/research/interactive_latency.html)源代码的话, 其实就能发现作者已经在注释里做了很详细的引用说明了, 所以这篇大抵只是对注释的整理罢了XDDD

------------------------------------------------

总的来说, 作者用到的数据大部分来自Peter Norvig的[Teach Yourself Programming in Ten Years](http://norvig.com/21-days.html#answers)和Jeff Dean的[Building Software Systems at Google and Lessons Learned](http://static.googleusercontent.com/external_content/untrusted_dlcp/research.google.com/en//people/jeff/Stanford-DL-Nov-2010.pdf), 也算是rule of thumb了.
同时, 描述硬件的进步趋势时, 大家都爱用"X年翻一倍"这种描述, 所以计算时也是用了简单的指数函数
`\(y = a * b ^ x\)`.

------------------------------------------------

首先是CPU主频的变化: 在2005之前, CPU的主频每两年就会翻倍([source](www.cs.berkeley.edu/~pattrsn/talks/sigmod98-keynote.ppt), 38页; 其实摩尔定律更流行的说法是"每一美元所能买到的电脑性能，将每隔18个月翻两倍以上", 这也是slides里面用的时间单位, 不过摩尔本人否认自己有这样说过, 而他的论文上确实写的是每两年一翻); 但是到了2005年, CPU的主频就停止在了3GHz([source](http://www.kmeme.com/2010/09/clock-speed-wall.html)).

既然主频已经无法再提高了, 芯片设计师开始把注意力放在了别的方面. 这里也涉及到摩尔定律好玩的地方. 摩尔定律的原话其实是: "半导体芯片上集成的晶体管和电阻数量将每两年增加一倍". 因为CPU主频已经达到极限了,所以芯片设计师就开始利用剩下来的"晶体管预算"来改进CPU的其他方面, 例如往CPU塞更多的核.
而其实2005年也是第一个桌面双核CPU出现的年份: [Athlon 64 X2](http://en.wikipedia.org/wiki/Athlon_64_X2).

-----------------------------------------------

当知道CPU的主频后, 就可以大致估算cache上的延迟时间了. 作者选用了PowerPC™
MPC7451来进行估算([source](http://cache.freescale.com/files/32bit/doc/app_note/AN2180.pdf)):

- L1访问大概需要3个时钟周期
- 分支预测错误的话会用掉10个时钟周期
- L2访问需要13个时钟周期
- Mutex锁/解锁需要50个时钟周期

------------------------------------------------

相比起CPU的进步速度, 总线等待时间上的改善进度一直都算是很糟糕([source](http://download.micron.com/pdf/presentations/events/winhec_klein.pdf))...15年前(1998年)的数据是: 内存等待时间以每年7%的速度下降, 内存带宽以20%的速度增长([source](www.cs.berkeley.edu/~pattrsn/talks/sigmod98-keynote.ppt)).

作者将内存访问的延迟时间从2000年后就定在了100ns. 虽然作者没有明确说明, 不过100ns这个数字最早应该是来自Peter Norvig的[Teach Yourself Programming in Ten Years](http://norvig.com/21-days.html#answers), 而之后也被Jeff Dean沿用下来了, 如[Building Software Systems at Google and Lessons Learned](http://static.googleusercontent.com/external_content/untrusted_dlcp/research.google.com/en//people/jeff/Stanford-DL-Nov-2010.pdf), 所以这个数字就当做rule of thumb好了.

------------------------------------------------

周边的带宽增长趋势的数据大部分来自[Warehouse-Scale Computing and the BDAS Stack](http://ampcamp.berkeley.edu/wp-content/uploads/2012/06/Ion-stoica-amp-camp-21012-warehouse-scale-computing-intro-final.pdf).

- 网卡(Network Interface Controller, NIC)带宽是每两年翻一倍, 作者认为在2003年是网卡带宽达到了1Gb/s
- DRAM带宽每三年翻一倍, 在2001年从内存读1MB需要用250,000 ns
- SSD带宽每三年翻一倍, 在2012年时达到3GB/s
- 硬盘的带宽增长速度颇为杯具...在2002年时大概每两年翻一倍, 之后需要五年才翻一倍; 在2002年时带宽约为100MB/s

-------------------------------------------------

剩下的部分:

- 关于硬盘, 寻找+旋转的等待时间每十年减少一半([source](http://www.storagenewsletter.com/news/disk/hdd-technology-trends-ibm)), 在2000年时这数字大约是10ms
- 至于SDD, 在2012年之前, 三个翻倍周期(doubling cycle, 即18个月)可以使访问等待时间降低20倍([source](http://cseweb.ucsd.edu/users/swanson/papers/FAST2012BleakFlash.pdf)), 而在2012年是该数字是20us. 而之后的进步空间看似也不大了
- 数据中心的RTT(Round-Trip Time)估计是500000ns, 估计也不会有太大改变了
- 根据[Moving Beyond End-to-End Path Information to Optimize CDN Performance](http://research.google.com/pubs/pub35590.html), 路由似乎还有提升的空间. Wan RTT现在估计是150000000ns.

## Reference

-------------------------------------------------

- [Latency Numbers Every Programmer Should Know](http://news.ycombinator.com/item?id=4966363) 原帖
- [Teach Yourself Programming in Ten Years](http://norvig.com/21-days.html#answers) 大部分数据都出自这里
- [Building Software Systems at Google and Lessons Learned](http://static.googleusercontent.com/external_content/untrusted_dlcp/research.google.com/en//people/jeff/Stanford-DL-Nov-2010.pdf)
- [Aurojit Panda's spreadsheet](http://www.eecs.berkeley.edu/~rcs/research/hw_trends.xlsx) 更精确的性能翻倍速度的数据
- [Latency Comparison Numbers](https://gist.github.com/raw/2841832/0a6e14cda5d6cc8b2eb304a895b0f2ba9b9b75c8/latency.txt) 说了那么多废话, 都没有这张cheatsheet有用..=_=

## History

-------------------------------------------------

- 12:17 AM Sunday, December 31, 2012 First commit
