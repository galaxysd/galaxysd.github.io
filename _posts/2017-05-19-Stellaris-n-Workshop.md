---
layout: post
slug: "Stellaris-n-Workshop"
title: Stellaris & its Workshop
description: 
category: Game
tags: Galaxy, Tips, DIY
---

[Stellaris](https://en.wikipedia.org/wiki/Stellaris_%28video_game%29)是[Paradox Interactive](http://store.steampowered.com/search/?publisher=Paradox%20Interactive)开发的策略游戏。属于[P社](https://zh.moegirl.org/Paradox_Interactive)<ruby>[四](https://www.zhihu.com/question/39732420)<rp>(</rp><rt>[五](https://www.zhihu.com/question/53613277)</rt><rp>)</rp></ruby>萌之[五](https://www.zhihu.com/question/45936905/answer/102261369)。

> 额，刚发现markdown的[写法](https://talk.commonmark.org/t/proper-ruby-text-rb-syntax-support-in-markdown/2279)`P社[四]^(五)萌`还没标准化。只好直接嵌入[HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby)了。

属于探索（eXlore）、扩张（eXpand）、开发（eXploit）和消灭（eXterminate）的[4X](https://en.wikipedia.org/wiki/4X)策略游戏。

现在Steam上的1.6版中，对DLC的确认不再是直接看dlc目录下的文件，而是通过`libsteam_api`来读取购买了的DLC列表。所以，想用最开始时正版本体加自行下载DLC文件的方法就行不通了。但如果使用第三方的`libsteam_api`，就无法自动加载[workshop](https://steamcommunity.com/app/281990/workshop/)中订阅的mod，需要手工处理。

Galaxy在路过一个[下载mod的插件](https://github.com/wisnudir/steam-external-downloader)时，知道了[SKYMODS](http://stellaris.smods.ru/)网站可以下载steam社区的mod。其帮助页面的[说明](http://stellaris.smods.ru/how-to-install-mods-for-stellaris)让人感觉有戏：

> Unpack mod folder in

>> C:\Users\\\*Username\*\Documents\Paradox Interactive\Stellaris\workshop\content\281990\

> Unpack .mod file in

>> C:\Users\\\*Username\*\Documents\Paradox Interactive\Stellaris\mod

随便下载一个`924982139_Better_Technology_Information.zip`，发现其结构是：

````
./924982139/better_tech_info.zip
./924982139.mod
./Readme.txt
````

而`924982139.mod`的内容是：

````INI
name="Better Technology Information"
path="workshop/content/281990/924982139/better_tech_info.zip"
tags={
	"Utilities"
}
picture="thumbnail.jpg"
remote_file_id="924982139"
supported_version="1.6.1"
````

Steam正版在启动游戏时，如果存在`~/Documents/Paradox\ Interactive/Stellaris/mod`，会在mod目录下自动生成`ugc_`开头的描述文件，如`ugc_924982139.mod`。其内容为：

````INI
name="Better Technology Information"
archive="/Applications/Games/Steam/steamapps/workshop/content/281990/924982139/better_tech_info.zip"
tags={
	"Utilities"
}
picture="thumbnail.jpg"
remote_file_id="924982139"
supported_version="1.6.1"
````

因为我把默认的`~/Library/Application\ Support/Steam`改成`/Applications/Games/Steam`以便备份，所以是上面那个。

而ACTiVATED的`libsteam_api.dylib`会在运行时删除mod目录下所有内容包括`archive=`的mod描述文件。

所以，方法就简单了：先订阅workshop上的东西，开Steam客户端下载，然后`~/Documents/Paradox\ Interactive/Stellaris/mod`会产生mod描述文件，cd进去执行：

    perl -pi -e 's/archive="/path="/' *.mod

就可以了。
我之前模仿SKYMODS做过`ln -s /Applications/Games/Steam/steamapps/workshop/content/281990 ~/Documents/Paradox\ Interactive/Stellaris/workshop/content/`，所以执行的是`perl -pi -e 's|archive="/Applications/Games/Steam/steamapps/|path="|' *.mod`。
得到的文件如下：

````INI
name="Better Technology Information"
path="workshop/content/281990/924982139/better_tech_info.zip"
tags={
	"Utilities"
}
picture="thumbnail.jpg"
remote_file_id="924982139"
supported_version="1.6.1"
````

于是，就能实现批量加载mod的了。
