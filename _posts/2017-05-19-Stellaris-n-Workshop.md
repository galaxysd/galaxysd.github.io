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

而[ACTiVATED](http://macgames-download.com/2017/04/stellaris-utopia-macosx-activated-cracked-download/)的[libsteam_api.dylib](/assets/wp-uploads/2017/libsteam_api.rar)会在运行时删除mod目录下所有内容包括`archive=`的mod描述文件。

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

---

顺道附下两家的第三方api配置，额，咱只是为了学习～

`stellaris.app/Contents/Resources/activated.ini`:

````INI
###
### Game data is stored at ~/Library/Application Support/Steam/ACTiVATED/393780
###

[Settings]
###
### Game identifier - http://store.steampowered.com/app/393780
###
AppId=393780
###
### Name of the current player
###
UserName=ACTiVATED
###
### Language that will be used in the game
###
Language=english
###

[Interfaces]
###
### Steam Client API interface versions
###
SteamAppList=STEAMAPPLIST_INTERFACE_VERSION001
SteamApps=STEAMAPPS_INTERFACE_VERSION007
SteamClient=SteamClient017
SteamController=SteamController003
SteamFriends=SteamFriends015
SteamGameServer=SteamGameServer012
SteamGameServerStats=SteamGameServerStats001
SteamHTMLSurface=STEAMHTMLSURFACE_INTERFACE_VERSION_003
SteamHTTP=STEAMHTTP_INTERFACE_VERSION002
SteamInventory=STEAMINVENTORY_INTERFACE_V001
SteamMatchMaking=SteamMatchMaking009
SteamMatchMakingServers=SteamMatchMakingServers002
SteamMusic=STEAMMUSIC_INTERFACE_VERSION001
SteamMusicRemote=STEAMMUSICREMOTE_INTERFACE_VERSION001
SteamNetworking=SteamNetworking005
SteamRemoteStorage=STEAMREMOTESTORAGE_INTERFACE_VERSION013
SteamScreenshots=STEAMSCREENSHOTS_INTERFACE_VERSION002
SteamUGC=STEAMUGC_INTERFACE_VERSION007
SteamUser=SteamUser018
SteamUserStats=STEAMUSERSTATS_INTERFACE_VERSION011
SteamUtils=SteamUtils007
SteamVideo=STEAMVIDEO_INTERFACE_V001
###

[DLC]
###
### Automatically unlock all DLCs
###
DLCUnlockall=0
###
### Identifiers for DLCs
###
#ID=Name
###
462720=462720
498870=498870
518910=518910
553280=553280
554350=554350
````

与`Stellaris.Galaxy.Edition.v1.6.1.Incl.All.Dlcs-ALI213/Stellaris/ALI213.ini`:

````INI
[Settings]
#############################################
#			模拟参数
#############################################
;应用程序ID,不是必须,但有可能会检测.
AppID = 281990

;尽量使用正确的API版本
API = 3.4.27.90

;玩家名称,如果你修改了存档类型,请注意修改对应的存档玩家名称.
PlayerName = ALI213

;游戏语言
;english	german		french		italian		koreana
;spanish	schinese	tchinese	russian		thai
;japanese	portuguese	polish		danish		dutch
;finnish	norwegian	swedish		hungarian	czech
;romanian	turkish

Language = english

;存档类型:
; ALI213(游戏目录)		0
; ALI213(我的文档)		1
; RELOADED			2
; SKIDROW			3
; FLT				4
; CODEX(3.0.4+/我的文档)	5
; CODEX(1.0.0.0+/APPDATA)	6
SaveType = 0

;是否使用回调相关代码
;UseCALLBACK=0

;成就数量限制
;AchievementsCount=0
#############################################
#			用户相关
#############################################
;用户的低位ID(设置固定用户ID的目的在于部分游戏存档会检测用户ID.)
;SteamUserID  =12345678

;用户的高位ID(当在多人游戏下,可能相同ID无法联机)
;SteamUserIDH =12345678

;用户是否处于登录状态
;IsLoggedOn=0

;用户是否处于在线状态
;Online=0

#############################################
#			DLC  相关
#############################################
;单独的DLC ID,使用格式为DLC???=数字ID
;UnLockListedDLCOnly=1
[DLC]
;SET DLC USE "APPID=NAME"
447680=Stellaris: Symbols of Domination
447681=Stellaris: Sign-up Campaign Bonus
447682=Stellaris: Digital Artbook
447683=Stellaris: Arachnoid Portrait Pack
447684=Stellaris: Digital OST
447685=Stellaris: Signed High-res Wallpaper
447686=Stellaris: Novel by Steven Savile
447687=Stellaris: Ringtones
447688=Unknown App 447688
447750=Unknown App 447750
461070=Unknown App 461070
461071=Stellaris (Pre-Order) (99330)
461072=Unknown App 461072
461073=Stellaris - Nova (Pre-Order)
461460=Unknown App 461460
461461=Stellaris - Galaxy (Pre-Order)
462720=Stellaris: Creatures of the Void
483050=Unknown App 483050
483060=Unknown App 483060
483070=Unknown App 483070
483080=Unknown App 483080
483090=Unknown App 483090
483100=Unknown App 483100
483110=Unknown App 483110
483130=Unknown App 483130
483140=Unknown App 483140
483150=Unknown App 483150
483160=Unknown App 483160
483170=Unknown App 483170
483180=Unknown App 483180
483190=Unknown App 483190
483200=Unknown App 483200
483210=Unknown App 483210
483220=Unknown App 483220
483230=Unknown App 483230
483240=Unknown App 483240
483250=Unknown App 483250
483270=Unknown App 483270
483310=Unknown App 483310
483320=Unknown App 483320
492740=Stellaris: Original Game Soundtrack
497660=Stellaris: Infinite Frontiers eBook
498870=Stellaris: Plantoids Species Pack
508700=Unknown App 508700
516690=Unknown App 516690
518910=Stellaris: Leviathans Story Pack
539210=Unknown App 539210
545080=Unknown App 545080
553280=Stellaris: Utopia
554350=Stellaris: Horizon Signal
604620=Unknown App 604620
616190=Stellaris: Nova Edition Upgrade Pack
616191=Stellaris: Galaxy Edition Upgrade Pack
618910=Unknown App 618910
618911=Unknown App 618911
619830=Unknown App 619830
619840=Unknown App 619840
626720=SteamDB Unknown App 626720
633310=Stellaris: Anniversary Portraits
#############################################
#			UBISOFT UPLAY EMU
#############################################
[UPLAY]
;GAMECDKEY=



#############################################
#			其它选项
#############################################
[Option]
;skip some binkvideo file(.bik)
;SkipMovie=

;存档自动备份
UseSavesBackup=0

;Block any Network link.
;FullBlockNetwork=1

;Redirect File Handle "ANY" to "ANY.ali213"
;FileRedirectCheck=1
````
