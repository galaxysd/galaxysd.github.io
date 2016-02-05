---
date: '2014-03-13 22:25:51'
layout: post
title: "Twitter和国内服务的区别"
slug: twitter-n-weibo
category: network
status: publish
type: post
tags: [Twitter, ZT]
published: true
---

\[ZT\]Twitter和国内服务的区别

尝试下直接转raw的。来自： https://github.com/moenayuki/SimpleGray/blob/234d565809dcd18396842fdd13c2602562ace4ef/_posts/2011-12-21-tt.markdown

额，本地测试发现日期是会按文件头的`date`值来定的，`slug`没试，应该也是以声明的为准。没写才会默认从文件名取。

<font color="navy">下面,除了结尾Galaxy的评论,都是原文，咱啥都没改。</font>

###推特和国内服务的区别

- 字数的限制

最显然也是最重要的区别是，推特对**字数的限制**非常严格。富媒体如图片、视频等，weibo的插入是不算在140字数里的，而推特要将其以短链接的形式折算入正文字数中。

- 转发

weibo是保留被转微博的基础上再另外计算评论的140字，转发不允许不带文字（就算你不输入评论也会默认加上“转发微博”四个字）。推特的转发可以保留原post的原汁原味，下详。

- 用户名

推特的用户名（@username）只能由英文（大小写不敏感）、数字、下划线组成，而weibo可以有中文（@用户名）以及某些特殊符号。

- 就某一话题的讨论

比如我发了一条关于某游戏的感想，然后有一些人和我在这条信息下展开了一对一讨论。

weibo的「评论」和「转发」功能都可以留下评论，但**评论**中没有能追溯二人互动的讨论线的功能，需要在所有**按时间排序**的评论的汪洋大海中寻找某条对话参与者的ID；而**转发**的内容往往是给所有粉丝看的，没有针对性。

在推特中，正常使用回复（reply）功能便会生成一条**讨论串**，其中每一个推文都可以有上下的关联，可以由讨论串中间的任意一条推拎出整条讨论线，每条推文既是独立的又是统一的。我和A的讨论串与我和B的讨论串是独立的。

- 标识符号的用法

微博使用`@用户名`来提及某人，用`#标签#`来给该条信息加上tag。twitter与其类似。

> twitter中，需注意`#tag`是用空格来标识标签的结尾，而不是第二个`#`。良好的习惯是在提及（mention）和标签（hashtag）的前后分别加上一个半角空格，保证不出错。

###timeline、fo、unfo、B、锁

时间线（timeline），简称TL，即你打开推特首页或客户端能看到的每个人的动态拼接起来的列表。 

可以简单地把推特的每一个用户理解为一个不断更新推文的RSS源，而你可以订阅他们。使他们的新推文显示在你的timeline里的动作就是follow。反动作就是unfollow。 阻止某人收听你就是block，简称B。以上概念均与weibo类似。腾讯微博将其称作「收听」，是一个非常形象的表达。

用户名旁加锁的用户说明他设置了protected状态。加锁的效用如下：假设你已经设置了给自己加锁，他人便

- 不能在没有fo你时查看你的推文、收藏、列表，只能看到你的基本资料。
- 在fo你前需要先向你发送请求（send request），待你同意后才能follow。
- 不能转推你的推文。
- 在mention你时，你收不到通知（不会被打扰）。

###转推

推特的转发分为两种：官方RT（官RT）和非官方RT（民间RT，民RT）。

官方RT将原推的一切信息丝毫不差地搬到你的TL里。个人倾向于翻译为“锐推”。非官方Retweet有时也被称为Quoted retweet（评论式转推），其性质归根结底是自己发送的普通推文。非官方RT目前常见有两种格式：

- `评论 RT @原推主: 原推文` （少数客户端不是RT而是QT，甚至有的能自己编辑）

- `"@原推主: 原推文" 评论` （常见于官方推特客户端）

官RT和民RT的特点分别是：

- 官RT可以原汁原味地把原推分享给fo你的人看，而且极为迅速，且是最尊重原作者的转发方法。
- 民RT虽然能评论，但是旁人无法断定原推是否完整无修改，或是根本就是杜撰的。

> twitter的早期版本没有转发功能，因此在群众的智慧下诞生了民RT的公认结构（上述的格式1），但这个产物在现在转发功能完备的系统下已经成为阻碍，因为其推文的上下关系无法体现，且有上述的篡改问题。

###礼仪与快速上手要领

- ID（username）是twitter使用者最能辨识自己身份的东西，在初次注册时应考虑尽量将其取短一些（便于辨识和记忆、对话时节省字数），且将来不宜频繁变动。
- 除非特殊情况，必须使用官方retweet来转发，以及用reply向原作者交流，这些都是尊敬原作者的体现。自觉抵制民RT。
- 不要向他人求回fo。follow是一个单向的行为，你fo他是因为你觉得他很有趣，同理他fo不fo你也取决于你有不有趣。如果你想和他互动，直接mention他就好，大多数推特核心用户对新人都是比较友好的，除了那些foer太多忙不过来的公知/名媛/营销号外。
- 一般用户都会follow自己感兴趣的圈里人，因此当你想扩大自己的兴趣圈时，就看看你现在fo的人的following都有谁，通常很准确。

---

### Galaxy的观点

其实RT便于备份，按照国内习惯，还是RT引用的好。

说用“RT”不好是考虑到它无法保证内容没被修改，如果不在回复链上就以追查。
但国内微博上常见的“抱歉，此微博已被作者删除。查看帮助：[网页链接 http://t.cn/zWSudZc](http://help.weibo.com/faq/q/1028/13193#13193)”，让人感到只有自己备份的，才是能留存的。

现在官方的`RT`可以自动附加`/status/`链接，完全可以点RT后，手工附加RT的内容。

关于推特删推的效果，见图：
![This Tweet is unavailable.](/assets/images/2015/TwitterDeleted.png)

话说rMBP下用`Awesome Screenshot`截图，明明框的是`600x670`，结果保存后是`1200x1340`。果然是大家都默认放大两倍么？

查了下，HiDPI模式下，即使是`More Space`的`1920x1200`，显卡也是按照两倍的`3840x2400`来处理。而非物理上的`2880x1800`。[出处](https://forum.parallels.com/threads/force-native-resolution-in-windows-2880x1800-on-rmbp-15-with-more-space.299398/#post-723471):

> You can use SwitchResX to create scaled resolutions that are larger than your monitor's native resolution. For example, the MacBook Pro includes a scaled resolution of 3840 x 2400 even though the display is only 2880 x 1800. 3840 x 2400 allows a HiDPI mode of 1920 x 1200.
