---
layout: post
slug: zt-use-iproute2-to-multihoming
title: "[ZT]使用 iproute2 进行 MultiHoming 设置"
description: ""
category: Linux
tags: [ZT, Tips, TCP/IP, net]
---

http://wangxu.me/blog/p/675<br>
April 21st, 2012 by gnawux

<font color="navy">有机会用的话，是很有用的……<br>博客应该是北邮某人的，内容不错。</font>
* * *

iproute2，也就是ip(8)这个命令的功能是非常强大的，之前就曾经用它建隧道之类的，但从来没涉及过路由，毕竟找不到什么不用 route(8) 命令的理由。不过，这次我们找到了一个——当你需要两个缺省路由的时候，该怎么配置？

    按：这个是新研究出来的，有什么不对的地方敬请指出哈

## iproute2 ##

iproute2 是一整套网络设置工具，涵盖从网口（link, address）、ARP（neigh）、路由（rule, route）、隧道（tunnel）等各个方面，是 Linux 2.2 （如果没记错的话，应该有十三四年了吧）以来的网络“新”特性的用户态工具，可以替代 arp、ifconfig、route 这些经典但不够完善的工具。

如果你要搭 ipip 或 gre 隧道，无疑要使用 iproute2 的 ip tunnel 命令了，除此之外，你还能想到第二个用 iproute2 的场景么？我就遇到了一个——

## 问题背景：两张路由表 ##

如果你有一台服务器，有两张网卡，对应了两个网络出口，都能连到目标网络，这时，怎么设置下一跳路由呢？经典的 route 设置，只有一个缺省路由条目可以生效的。你当然可以设置，让一部分目标地址走一个路由，另一部分目标地址走另一个路由，但是有两个问题：

<ul>
	<li>这样，流量很难均衡使用两个路由</li>
	<li>包从哪个网口进来是无法通过自己的路由表选择的，所以，如果按照上面那种划分方法，只要进入的包没有按照我们的期待分区划分，那么就无法正确地回复，也可能会被 rp_filter 直接过滤掉。</li>
</ul>

嗯，那么，怎么同时用上两块网卡呢——

    我们需要按照出发 IP 划分，使用源 IP1 的包，走第一块网卡，使用 IP2 的包，走第二块网卡。（先不考虑未指定的）

但是，IP路由的基本哲学是——按照目的地址，从路由表里查询，不可能按照源地址来整路由表，于是，问题就变成了这样——

    我们需要为每个 src IP 建立一张路由表：从第一个IP出来的包，进第一张路由表，出第一块网卡；从第二个IP出来的包，进第二张路由表，出第二块网卡。

思路很简单，但是 route(8) 命令在这里就束手无策了，嗯，看 iproute2 的：

## 多张路由表（rule） ##

好了，不卖关子了，iproute2 本来就支持多张路由表，配置文件位于这里：
{% highlight bash %}
root@swipe:~# cat /etc/iproute2/rt_tables
#
# reserved values
#
255 local
254 main
253 default
0   unspec
#
# local
#
#1  inr.ruhep
{% endhighlight %}

已经有三张表了：
{% highlight bash %}
root@swipe:~# ip rule ls
0:  from all lookup local
32766:  from all lookup main
32767:  from all lookup default
{% endhighlight %}

这三张表都对所有的IP来源生效（from all），这其中，main 就是我们通常设置的路由规则，
{% highlight bash %}
root@swipe:~# ip route ls table main
default via 192.168.12.1 dev eth0  proto static
169.254.0.0/16 dev eth0  scope link  metric 1000
192.168.12.0/24 dev eth0  proto kernel  scope link  src 192.168.12.104  metric 1
root@swipe:~# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         localhost       0.0.0.0         UG    0      0        0 eth0
link-local      *               255.255.0.0     U     1000   0        0 eth0
192.168.12.0    *               255.255.255.0   U     1      0        0 eth0
{% endhighlight %}

default表是空的，而local表则是本机链路的设置。如果我们需要，可以人为加入新规则（路由表）
{% highlight bash %}
root@swipe:~# echo "200 rt2" >> /etc/iproute2/rt_tables
root@swipe:~# ip rule add from 192.168.12.111 table rt2
root@swipe:~# ip rule ls
0:  from all lookup local
32765:  from 192.168.12.111 lookup rt2
32766:  from all lookup main
32767:  from all lookup default
{% endhighlight %}

这样，来自 192.168.12.111 的包就可以先进入 rt2 这张表了

## 路由设置 ##

现在要做的是为每张表设置路由
{% highlight bash %}
root@swipe:~# ip route add 192.168.12.0/24 dev eth1 table rt2
root@swipe:~# ip route add default via 192.168.12.254 dev eth1 table rt2
root@swipe:~# ip route flush cache
{% endhighlight %}

对于本机发出的包，应该可以以某种机会，比较均衡地选择任意路由出去
{% highlight bash %}
root@swipe:~# ip route add default scope global nexthop via XX.XX.XX.XX dev eth0 weight 1 \
 nexthop via XX.XX.XX.XX dev eth1 weight 1
{% endhighlight %}

当然，这种基于路由表的负载均衡并不能做到完全均匀，毕竟路由表是可以被缓存的。

说明：上面的设置例子是在一台只有一块网卡的机器上码的，不过在写blog之前是在有两块网卡的机器上操作的，就是那个机器不方便写blog，所以看着细节上可能有点味道不太对，没关系哈

## 参考 ##

下面是一些参考文献：

1.  Linux Advanced Routing & Traffic Control HOWTO ： http://lartc.org/howto/index.html
2.  ip-cref ： http://users.cis.fiu.edu/~esj/cnt4504/reading/ip-cref.pdf
