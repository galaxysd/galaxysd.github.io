---
layout: post
title: LEDE的单线多拨
category: Linux
status: publish
tags: []
---

## 缘起

自打投资了斐讯路由，各种捣鼓就免不了了，毕竟是官方都明确说了会收集用户信息的产品嘛，不刷机不就成了拿自己的隐私换钱的⑨了…

官改刷过几次，但，反正寝室的移动宽带才20M，配上最低挡的K2就够了，所以，官方固件的硬件NAT必要性也不大，再说，LEDE也是国人折腾出来的，驱动部分应该做过处理才对。
反正就是因为官改没有`opkg`，咱也不想再忍受在笔记本上用官方的手机界面，干脆换成目前最新的LEDE算了。
而且，K2与K2P都有官方支持，直接刷官方固件就好了。至于语言问题，这年头，还有不懂英语的大学生么？

另外就是，近期的墙逼得我我折腾了下路由表，开始捣鼓[ZeroTier One](https://www.zerotier.com/manual.shtml)了，所以需要个不隐藏网卡路由细节的系统来折腾。

## 安装

````bash
opkg update
opkg install kmod-macvlan
opkg remove dnsmasq && opkg install dnsmasq-full
opkg install mwan3 luci-app-mwan3
# 如果还想捣鼓ZeroTier的话：
opkg install zerotier
````

[mwan3](https://wiki.openwrt.org/doc/howto/mwan3)，代码在[GitHub](https://github.com/Adze1502/mwan)上。

## 配置

网上有个不愿透露名字的 [MrX的教程](https://blog.mrx.one/2017/06/25/Load-balancing-multiple-PPPoE-on-LEDE/)可以解决重启前的大部分问题，但，重启了你就麻烦了。
然后，当代系统由于简化，没有捆绑完整版的*dnsmasq* ，所以，需要参考一个叫[dianlujitao](https://github.com/dianlujitao)的[咸鱼码农](https://www.dianlujitao.com/about-me)的[帖子](https://www.dianlujitao.com/archives/46)去安装*dnsmasq-full*（这个*自称死宅|咸鱼|百合控的家伙*竟然把主页设置成屏蔽了华大基因的IP，害得Galaxy非得开代理才能补完他的信息！）。
嘛，先看前半截吧：

不知道为啥*LEDE 17*默认是开VLAN的，而且开了却不设tag，额，反正是入乡随俗，咱也懒得折腾VLAN，就按默认的来。检查下WAN对应的设备名，是*eth0.2*。
然后SSH登上去打命令：

````bash
ip link add link eth0.2 name veth1 type macvlan
ifconfig veth1 up
````

这两行最后是得添加到`/etc/rc.local`中去的，现在先手打来测试。`ifconfig veth1`确认添加成功，就可以继续了。

### VWAN

在luci界面下，创建新Interfaces(luci/admin/network/network)*VWAM1*，记得物理界面选刚才新建的*veth1*。基本协议当然是PPPoE，然后，广东移动的账号带上后缀`@139.gd`似乎会比不带后缀的好拨通。
注意高级设置中的*Use gateway metric*得设得每个WAN都不一样。分别设成`1`与`2`就好了。
确定后回*Overview*看能否拨号成功。如果成功了，那么恭喜，否则，说明当前运营商线路不支持多拨，也就没有必要继续往下看了。

实在想尝试并发多拨的，可以去[明月永在](https://www.myopenwrt.org/archives/651)那看他的基于*nwan*和*pppoeup*的(并发)多拨设置。

### 负载均衡

> 即使多拨成功了，也只能说成功了一半。因为有些运营商限制了端口的速度，即使多拨成功，也可能无法超过运营商的限制，无法实现网速叠加，这样的多拨也没什么特别大的意义。至于是否能实现网速叠加，就需要用到mwan3了。
> 
> mwan3是一个强大的软件，能实现路由表级别的负载均衡，通过设定的权重和网关越点来分配流量到不同的WAN口。结合luci-app-mwan3，配置mwan3也是非常简单的事情，主要配置这四个部分：接口、成员、策略和规则。在配置之前，先前往“网络” -> “负载均衡” -> “配置”，删除掉默认的配置项。

网址是：*/luci/admin/network/mwan*，参考默认设置改。

#### 接口，Interfaces

接口的*Tracking IP*可以直接写DNS，比如深圳移动的*211.136.192.6*。

用MrX的旧版图示意下：
![](/assets/images/2017/LEDE-mwan3-add-interface.png)。

他填写的是DNSPod提供的公共DNS服务器：*129.29.29.29*，但Galaxy认为，需要检测的是PPPoE是否拨通，而不是国际网是否能上。所以，还是应该用运营商的IP。

#### 成员，Members

这里直接添加*member_vwan1*就好了，Metric与Weight空着，默认为1。

#### 策略，Policies

照搬默认的名字*balanced*，加入全部成员，*Last resort*选*default (use main routing table)*。

#### 规则，Rules

>规则基于 IP 地址、协议、端口把流量划分到指定的“策略”中。 规则按照从上到下的顺序进行匹配。除了第一条能够匹配一次通信的规则以外，其它规则将被忽略。不匹配任何规则的通信将会由系统默认路由表进行。
> 
> 此处我们添加一个名为default的规则，前四项留空，通讯协议选all，分配的策略选择之前添加的load_balance即可。

继续用MrX的旧版图示意：
![](/assets/images/2017/LEDE-mwan3-add-rule.png)。

如果你需要连服务器，比如网银、SSH、Zerotier啥的，记得把对应的*IP:端口*设为*Sticky*，*Policy assigned*干脆也直接退回*default*。否则，轻则丢包，重则连不上。

额，MrX没讲，Galaxy只好自己截图了：
![](/assets/images/2017/LEDE-mwan3-rules.png)。

### RC

最后，去*/luci/admin/system/startup*，把前面的脚本添加到*Local Startup*，也就是`/etc/rc.local`中去。

如果你的路由器装了许多软件，启动比较慢，就直接加那两行。
否则，像Galaxy这样纯净的系统，只能在前面多加行`sleep 6`了，否则`veth1`比`eth0.2`先启动，那就不行了。

## One more thing

还记得最开始提到的*zerotier*吧，安装后自己改配置文件。
需要注意的就是，在网页上添加`Interfaces`时，*Protocol*必须选*DHCP client*，否则后面没发配路由。

至于你在*Firewall - Zone Settings*那边，是单独给个新`Zone`，还是借用`lan`，都行。

有个没文档的点，如果你的配置文件中写`secret: generate`，那么，`zerotier.init`就会生成新的*secret*。而默认配置文件就是这样。
所以，你可以不用去换掉第一眼见到的*secret*。相关代码在<https://github.com/mwarning/zerotier-openwrt/blob/master/zerotier/files/zerotier.init>。

至于默认配置文件`/etc/config/zerotier`：

````json
config zerotier sample_config
	option enabled 1
	option interface 'wan' # restart ZT when wan status changed
	#option port '9993'
	option secret 'generate' # generate secret on first start
	list join '8056c2e21c000001' # a public network called Earth
````

加入默认的*Earth*意味着啥，肉乎乎的鸡呀。好在默认状态下不分配IP。
所以，第一时间改掉这个编号吧。
