---
layout: post
date: 'Fri 2015-07-03 14:15:59 +0800'
slug: "NanocoreGlimmer"
title: "纳米核心Nanocore主题歌Glimmer & 用YouTube API做网页外挂字幕"
description: "Nanocore OP Glimmer and YouTube API Lyrics"
category: 
tags: ACG, Galaxy, Google, API
---

额，懒，直接转自己的推文……

<blockquote class="twitter-tweet" lang="en"><p lang="zh" dir="ltr">纳米核心7出了，于是搜索下，发现某日本动漫博客发现它竟然有网页外挂字幕。&#10;惊讶之余，看源码，找到iframe：<a href="/assets/wp-uploads/2015/glimmer.html">http://tianyi.jp/etc/youtube/glimmer.html</a>&#10;用的是YouTube的player.getCurrentTime。&#10;&#10;嘛，谷歌开放API就是好。</p>&mdash; Yuuki Galaxy (@galaxy001) <a href="https://twitter.com/galaxy001/status/616842656727986176">July 3, 2015</a></blockquote>

iframe内的源文件为[http://tianyi.jp/etc/youtube/glimmer.html](/assets/wp-uploads/2015/glimmer.html)，我下面用的是修改框架尺寸为[720p的版本](/assets/wp-uploads/2015/glimmer720.html)。

	$ diff assets/wp-uploads/2015/glimmer*
	7,8c7,8
	<          #playerbox { width:640; height:390; margin-bottom:10px; }
	<          #status { width:640px; height:3em; margin-bottom:10px; }
	---
	>          #playerbox { width:1280; height:750; margin-bottom:10px; }
	>          #status { width:1280px; height:3em; margin-bottom:10px; }
	82,83c82,83
	<                         width: '640',
	<                         height: '390',
	---
	>                         width: '1280',
	>                         height: '750',

调用YouTube API大概的代码是：

````HTML
	<iframe src="http://tianyi.jp/etc/youtube/glimmer.html" width="690" height="480" frameborder="0" allowfullscreen=""> </iframe>
````

````JavaScript
var lyrics = [
	0,	"「Glimmer」", 
	2000,	"",
	2100,	"魂は逃れられない運命の束縛に囚われ",
	2420,	"",
	2440,	"四散した空虚な瞳は冷酷と隔たりを作り上げた",
	2740,	"",
	2760,	"時代は一体誰が仕掛けた因果によって動いているのだろうか",
	3040,	"",
	6940,	"希望を紡ぎだしてゆく",
	7450,	"",
	,
	1000000,	"",
];
var getStatus=function(){
	var current_time=player.getCurrentTime()*100+offset;

	if(current_time < lyrics[lyrics_count*2]) {
		lyrics_count=0;
	}
	while(current_time > lyrics[lyrics_count*2+2] && lyrics_count<lyrics_count_end) {
		lyrics_count++;
	}
	$("#status").html(lyrics[lyrics_count*2+1]);
	//$("#time").html(Math.round(current_time));
}
````

那篇博客是：[中国アニメブログ ちゃにめ！](http://chinanime.blog.fc2.com/) 的 [「Glimmer」 中国アニメ「納米核心 NANO CORE」の主題歌　歌詞と日本語訳 【kors k X 祈inory】](http://chinanime.blog.fc2.com/blog-entry-558.html), 内容如下：

![Glimmer 作詞沈病娇 作曲kors k 歌手祈Inory](/assets/images/2015/NanocoreGlimmer.ap61.jpg)

中国フル3DCGアニメ「纳米核心 NANO CORE」のオープニングテーマ曲「Glimmer」 

<iframe src="/assets/wp-uploads/2015/glimmer720.html" width="1282" height="800" frameborder="0"> </iframe>


曲名：Glimmer  
作詞：沈病娇  
作曲：kors k  
歌手：祈Inory  


灵魂囚禁在命运不可抗力的枷锁  
四散空洞眼眸铸就了冷漠与隔阂  
时代的起源来自谁埋下的因果  
尚锐利的轮廓 凝视着别闪躲  
<font color="#0066FF">魂は逃れられない運命の束縛に囚われ  
四散した空虚な瞳は冷酷と隔たりを作り上げた  
時代は一体誰が仕掛けた因果によって動いているのだろうか  
まだ鋭利なその輪郭　目を逸らさずに受け止めて</font>

重塑的自我 扭曲对与错  
星辰已陨殁 剩微芒闪烁  
分秒停在此刻 吞噬或存活  
无惧挣脱  
<font color="#0066FF">再構築された自我は　是と非を捻じ曲げ  
星々は微かな煌きを残して燃え尽きていった  
僅かに静止した時間のなかで　呑み込むのか、或いは生き残るのか  
恐れることなく切り抜けろ</font>

擦拭发烫信仰 伴随痛楚 跨越时间屏障  
隐匿的情绪 却在瞬间肆意冲撞  
舍弃繁重捆绑 不屑回望 曾经狼狈模样  
还能否紧握 手心残余梦想  
<font color="#0066FF">熱を帯びる信念を拭い　苦痛を伴いながらも　時間の障壁を乗り越え  
押し殺していた感情　この瞬間思いのままに解き放て  
ふり返るにも値しない　脆弱だったかつての自分の姿など捨て去り  
手のひらに余韻が残る夢は　まだ掴むことが出来るのだろうか</font>

未知的彼方 谁点亮 被人遗忘的曙光  
拾起沿途散落的骄傲  
汇成希望  
<font color="#0066FF">まだ見ぬかなたで　忘れられていた夜明けの光を灯しているのは誰？  
道端に散り落ちた誇りを拾い集め  
希望を紡ぎだしてゆく</font>





纳米核心のストーリーに沿った感じの歌詞になっているようです。

言葉に含まれている意味が表現しづらくて難しいところがありますが、「吞噬或存活」の「吞噬（呑み込む）」には敵の領土に攻め込んで領土の飲む込むといった意味が含まれていて、「存活（生き延びる）」には敵から逃げ回って惨めに逃げ回るといった意味が含まれているのだと思います。
僅かに与えられた時間のなかで、攻勢に出て敵に立ち向かうのか、逃惑うのか決断しろ！といった感じでしょうか。


ちなみに気になる今後の放送スケジュールですが、どうも夏頃に4～6話、冬頃に7～10話の公開を予定しているようです。
視聴者からの意見を十分に考慮・反映し、じっくりと作品のクオリティを高めてみんな満足するものに仕上げていきたいとのことです。こういった作品作りをするアニメはなかなか今までには無かったのではないでしょうか。
うーむ、待ち遠しい感じですが、気長に待つことにしましょう。

Entry ⇒ 2014.04.03 ｜ Category ⇒ 中国アニメ　納米核心 NANO CORE ｜ Comments (0)
