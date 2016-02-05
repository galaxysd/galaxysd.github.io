---
layout: post
date: 'Mon 2016-01-11 13:10:27 +0800'
slug: "smtp-with-python"
title: "SMTP with Python"
description: ""
category: 
tags: [ZT]
---

什么“就如同我们和人交谈”，`Telnet`时代，就是人类自己手动通过SMTP来发邮件的呀，当然是交谈呢。

https://gist.github.com/jasonlvhit/28d67a693ffd4f971b4c

在这篇笔记的最前面，我一定要说，**网络协议的设计者都是天才**。

使用SMTP发送邮件其实十分简单，就如同我们和人交谈别无二致。这里我们使用SMTP协议发送一封邮件，小小体会一下网络协议之美。我在这里使用Windows平台上的VS2013 作为编码环境，使用C++，和WinSock中的socket函数通信。

### 什么是SMTP，用Python中的SMTP模块发送一封邮件

SMTP--Simple Mail Transfer Protocol,简单邮件传输协议。这是一个应用层协议，我们可以使用此协议，发送简单的邮件。SMTP基于TCP协议，在不使用SSL，TLS加密的SMTP协议中，我们默认使用端口号25，在使用SSL\TLS的SMTP协议中，使用端口号465\587。

一次传输邮件的过程，其实就是一次和服务器对话的过程。为了标识这些对话中的各种动作，我们需要使用语言来和服务器沟通。例如客户端发送给服务器一条信息**EHLO**（Hello），服务器就知道这个客户端要给我发邮件了，这类似于我们人与人之间打招呼，我和服务器说:**我要发邮件了！！！**，于是服务器知道我要发邮件了，会给我回答一声：**发吧**。在SMTP协议中，也是同样，协议会返回一个**标识码**，来告诉我们服务器现在的状态，在我们打招呼之后，服务器一般会返回**250**，这告诉我们：“一切OK，放马过来吧”。

而这背后的数据传输，不是我们应用层协议需要关心的了，一般，我们可以使用socket传输信息。

在Python中，我们可以很轻松的发送一封邮件，Python中内置了SMTP模块，下面的代码演示了Python中发送一封邮件的过程：

``` python
import smtplib

from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

msg = MIMEMultipart()
msg['From'] = 'me@gmail.com'
msg['To'] = 'you@gmail.com'
msg['Subject'] = 'simple email in python'
message = 'here is the email'
msg.attach(MIMEText(message))

mailserver = smtplib.SMTP('smtp.gmail.com',587)
# identify ourselves to smtp gmail client
mailserver.ehlo()
# secure our email with tls encryption
mailserver.starttls()
# re-identify ourselves as an encrypted connection
mailserver.ehlo()
mailserver.login('me@gmail.com', 'mypassword')

mailserver.sendmail('me@gmail.com','you@gmail.com',msg.as_string())

mailserver.quit()
```

我们用email模块构建一个我们的邮件，然后，使用SMTP连接服务器，如果我们需要SSL或者TLS加密（并且服务器还支持的话，或者服务器强制要求开启TLS），可以看到，使用```starttls```来开启TLS/SSL，其实，在打招呼之后，服务器会返回给我们是否需要SSL，支持的认证类型等等。最后，sendmail，quit，结束。

在Python中，一切都是这么简单，但这也隐藏了很多SMTP的细节，在下面的部分，我们会实现一个SMTP的客户端，我们首先不支持SSL，这会使我们的代码量迅速膨胀，我们在这里仅仅实现SMTP的内核。
### 实现一个SMTP客户端

我们首先浏览一遍客户端与服务器之间交互的流程：

```
S: 220 smtp.example.com ESMTP Postfix
C: HELO relay.example.org
S: 250 Hello relay.example.org, I am glad to meet you
C: MAIL FROM:<bob@example.org>
S: 250 Ok
C: RCPT TO:<alice@example.com>
S: 250 Ok
C: RCPT TO:<theboss@example.com>
S: 250 Ok
C: DATA
S: 354 End data with <CR><LF>.<CR><LF>
C: From: "Bob Example" <bob@example.org>
C: To: "Alice Example" <alice@example.com>
C: Cc: theboss@example.com
C: Date: Tue, 15 January 2008 16:02:43 -0500
C: Subject: Test message
C:
C: Hello Alice.
C: This is a test message with 5 header fields and 4 lines in the message body.
C: Your friend,
C: Bob
C: .
S: 250 Ok: queued as 12345
C: QUIT
S: 221 Bye
{The server closes the connection}
```

C代表客户端，S代表服务器端。我们可以看见的是，发送邮件的过程就是一个不断的对话的过程，C发送指定的指令，S接受，返回指定的指令，如此反复，在客户端，我们非常清楚，在整个邮件发送过程中发生的一切。

我们就按照这个流程来和服务器对话。

我们首先定义一个类，```SMTPClient```，可想而知的是，类之中肯定有上面Python代码中的那几个函数，所以，我们的类先定义成下面的这个样子：

```cpp
class SMTPClient
{
private:
	SOCKET m_smtpSocket; 
	SOCKADDR_IN m_ServerAddr; 
	...
	...
public:
	~SMTPClient();
	void sayHello();
	void connectServer(std::string server, int port);
	void login(std::string username, std::string password);
	void send(std::string from, std::string to, std::string content);
	...
	...
};

```

想要发送一封邮件，首先我们需要连接邮件服务器。我们在这里使用socket连接服务器，至于邮箱服务器，到各个邮箱的web版的帮助中心都能得到。

使用socket连接服务器如下，windows的socket编程，首先我们需要include两个头文件：

```cpp
#include <WinSock2.h>

#pragma comment(lib, "ws2_32.lib")
```

这之后，我们可以使用socket连接服务器了，这和连接其他的服务器没有任何区别。

```cpp
void SMTPClient::connectServer(std::string server, int port)
{	
	//初始环境创建
	WSADATA wsaD;
	WSAStartup(MAKEWORD(1, 1), &wsaD);
	//建立套接字
	m_smtpSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
	if (INVALID_SOCKET == m_smtpSocket){
		std::cout << "socket init failed" << std::endl;
		WSACleanup();
	}

	m_ServerAddr.sin_family = AF_INET;

	//通过url得到server的IP地址
	hostent* host = gethostbyname(server.data());
	memcpy(&m_ServerAddr.sin_addr.S_un.S_addr, host->h_addr_list[0], host->h_length);

	printf("IP of %s is : %d:%d:%d:%d",
		server.data(),
		m_ServerAddr.sin_addr.S_un.S_un_b.s_b1,
		m_ServerAddr.sin_addr.S_un.S_un_b.s_b2,
		m_ServerAddr.sin_addr.S_un.S_un_b.s_b3,
		m_ServerAddr.sin_addr.S_un.S_un_b.s_b4);

	//初始端口
	m_ServerAddr.sin_port = htons((u_short)port);

	//连接SMTP服务器
	while (connect(m_smtpSocket, (LPSOCKADDR)&m_ServerAddr, sizeof(m_ServerAddr)))
	{
		std::cout << "connect failed!...reconnect after 2 seconds" << std::endl;
		Sleep(2000);
		//closesocket(m_smtpHost);
		//WSACleanup();
	}
	//接收服务器数据
}
```

上面的代码主要展示了windows的socket编程，这其中还有一段IP获取的过程，代码比较清晰。在最后，其实服务器还会返回一段信息，我这里没有写出来，只需要调用```recv```函数就可以把这段数据都出来，这段信息一般是我们所连接到的服务器的概括信息，比如：

```
QQ SMTP coremail server, port .........
```

类似如此

在建立连接之后，我们需要发出我们的第一条指令```EHLO```:
发送指令的思想很简单，效果却很动人，因为这就像对面有一个人和你对话一样,而无论是SayHello，还是发送信息，我们都只需要把信息压在字符串中，通过socket的```send```函数发送出去就OK，**而后面的函数，与SayHello的实现几乎同样，只不过是换了一个发送的字符串**：

```cpp
void SMTPClient::SayHello()
{
	if (!connected)
	{
		throw SMTPError(UNCONNECTED);
	}
	char ret[MAX_RESPONSE_LENGTH] = { 0 };
	memset(ret, MAX_RESPONSE_LENGTH, 0);
	std::string buffer = "EHLO " + s_hostInfo;
	
	int i = send(m_smtpSocket, buffer.data(), buffer.size(), 0);
	if (i == SOCKET_ERROR) {
		wprintf(L"send failed with error: %d\n", WSAGetLastError());
		closesocket(m_smtpSocket);
		connected = false;
		WSACleanup();
		return;
	}

	do {
		i = recv(m_smtpSocket, ret, MAX_RESPONSE_LENGTH, 0);
		if (i > 0)
			wprintf(L"Bytes received: %d\n", i);
		else if (i == 0)
			wprintf(L"Connection closed\n");
		else
			wprintf(L"recv failed with error: %d\n", WSAGetLastError());
	} while (i > 0);
	std::cout << ret << std::endl;
}
```

在与QQ服务器```EHLO```后，我们会得到下面这串信息:

```
250 smtp.qq.com
PIPELINING
SIZE 52428800
AUTH LOGIN PLAIN
AUTH=LOGIN
MAILCOMPRESS
8BITMIME
STARTTLS
```

这些信息中，有几条非常的重要：

* 250：表示一切正常
* AUTH LOGIN PLAIN，这一排表示了服务器支持的验证类型，一会我们说说这三种类型的验证
* STARTTLS，开启SSL/TLS，我们需要在客户端openssl的支持，本文不会讨论SSL、TLS的实现，这起码还需要一整篇文章来说明编程细节。

#### AUTH

在EHLO后，很重要的一点是认证，SMTP（RFC 2554）有三种认证方式：

* AUTH PLAIN
* AUTH CRAM-MD5
* AUTH LOGIN

这三种方式唯一的区别就是，我们需要发送过去的认证报文是不一样的，必须严格按照这三种格式来走。

如果我们有```username```和```password```两个等待认证的值。

首先 AUTH PLAIN，我们需要发送给服务器的字符串为：

```
"LOGIN PLAIN \0username\0password"
```

第二种，如果是AUTH CRAM-MD5，那么我们需要按照下面的流程发送指令：

```
C: AUTH CRAM-MD5
S: 334
PENCeUxFREJoU0NnbmhNWitOMjNGNndAZWx3b29kLmlubm9zb2Z0LmNvbT4=
C: ZnJlZCA5ZTk1YWVlMDljNDBhZjJiODRhMGMyYjNiYmFlNzg2ZQ==
S: 235 Authentication successful.
```

就是说，我们需要先发送一条：```AUTH CRAM-MD5```,服务器会返回一段base64编码，我们称其为```C```，我们处理来自服务器的这个编码，返回给服务器一个处理后的结果，处理的流程如下：

```
* response = ''
* c = base64.decode(C)
* response = user + ' ' +  hmac.HMAC(password, c).hexdigest()
* response = base64.encode(response)
```

最后是```AUTH LOGIN```，这是现在最常用的认证方法，这个方法按照下面的流程进行：

```
C: AUTH LOGIN ZHVtbXk=
S: 334 UGFzc3dvcmQ6
C: Z2VoZWlt
S: 235 Authentication successful.
```

第一句```AUTH LOGIN ZDASDADH=```,后面的这段base64编码是username的编码，这之后，服务器会返回一个334，之后第二句话，我们发送password的base64编码，如果验证成功，服务器会返回235。

在实现的过程中，我参考了Python的smtplib中login的编码实现，其实同SayHello函数一样，就是简单的```send```字符串（base64处理加密的字符串），```recv```服务器的应答，实现原理是同样的，在这里，Python的编码实现很漂亮，我给出Python的编码：

```python
def login(self, user, password):
        """Log in on an SMTP server that requires authentication.

        The arguments are:
            - user:     The user name to authenticate with.
            - password: The password for the authentication.

        If there has been no previous EHLO or HELO command this session, this
        method tries ESMTP EHLO first.

        This method will return normally if the authentication was successful.

        This method may raise the following exceptions:

         SMTPHeloError            The server didn't reply properly to
                                  the helo greeting.
         SMTPAuthenticationError  The server didn't accept the username/
                                  password combination.
         SMTPException            No suitable authentication method was
                                  found.
        """

        def encode_cram_md5(challenge, user, password):
            challenge = base64.decodestring(challenge)
            response = user + " " + hmac.HMAC(pa
                ssword, challenge).hexdigest()
            return encode_base64(response, eol="")

        def encode_plain(user, password):
            return encode_base64("\0%s\0%s" % (user, password), eol="")


        AUTH_PLAIN = "PLAIN"
        AUTH_CRAM_MD5 = "CRAM-MD5"
        AUTH_LOGIN = "LOGIN"

        self.ehlo_or_helo_if_needed()

        if not self.has_extn("auth"):
            raise SMTPException("SMTP AUTH extension not supported by server.")

        # Authentication methods the server supports:
        authlist = self.esmtp_features["auth"].split()

        # List of authentication methods we support: from preferred to
        # less preferred methods. Except for the purpose of testing the weaker
        # ones, we prefer stronger methods like CRAM-MD5:
        preferred_auths = [AUTH_CRAM_MD5, AUTH_PLAIN, AUTH_LOGIN]

        # Determine the authentication method we'll use
        authmethod = None
        for method in preferred_auths:
            if method in authlist:
                authmethod = method
                break

        if authmethod == AUTH_CRAM_MD5:
            (code, resp) = self.docmd("AUTH", AUTH_CRAM_MD5)
            if code == 503:
                # 503 == 'Error: already authenticated'
                return (code, resp)
            (code, resp) = self.docmd(encode_cram_md5(resp, user, password))
        elif authmethod == AUTH_PLAIN:
            (code, resp) = self.docmd("AUTH",
                AUTH_PLAIN + " " + encode_plain(user, password))
        elif authmethod == AUTH_LOGIN:
            (code, resp) = self.docmd("AUTH",
                "%s %s" % (AUTH_LOGIN, encode_base64(user, eol="")))
            if code != 334:
                raise SMTPAuthenticationError(code, resp)
            (code, resp) = self.docmd(encode_base64(password, eol=""))
        elif authmethod is None:
            raise SMTPException("No suitable authentication method found.")
        if code not in (235, 503):
            # 235 == 'Authentication successful'
            # 503 == 'Error: already authenticated'
            raise SMTPAuthenticationError(code, resp)
        return (code, resp)
```

如果认证成功，我们就可以发送邮件的主题内容了，这段的实现方法和前面的实现原理都是类似的，发送，接收，发送，接收，我们能够体会到那种和服务器对话的过程。在实现中，我们可以发现，发送和接受，是可以用复用的函数进行实现的，所以在这之后的过程我们可以大概的写成下面的样子：

```cpp
_sendString(("MAIL FROM:<" + m_fromAddr + ">\r\n"));
_sendString(("RCPT TO:<" + m_toAddr +">\r\n"));
_sendString("DATA\r\n");
_sendString("From:\"Jason\"<847383158@qq.com>\r\nTo: \"Nick\"<1835857335@qq.com>\r\nSubject: " + 
	subject + "\r\n\r\n" +content + "\r\n.\r\n");
_sendString("QUIT\r\n");
```

函数```_sendString```负责发送参数中的数据，并接受服务器返回的数据，判断异常，若有异常，则抛出。

```DATA``` 指令，标识着正文数据的开始，注意在正文数据中，我们还有一个```From：....```，这个From是邮件接收方看到的那个发信人名称，不过，如果这个发信人From和前面的Mail From标签中的不一致，收信方会弹出警告。

最后，终结正文使用标签```\r\n.\r\n```。

使用```QUIT```结束这次会话，服务器还会返回数据,一般是：

```
221 Bye
```

So cute ，我们始终希望计算机能像人一样工作，一样思考，**在写程序时，与SMTP协议这之间的交互真真切切是激动人心的**。

实际上，发送一封邮件没有这么简单，虽然这看起来已经有一些吓人（虽然很有趣），在实现SMTP客户端的过程中，我们还必须解决几个问题：

* SSL/TLS支持，Windows这一部分的编程略微复杂。但绝大多数的SMTP服务器必须使用SSL/TLS。
* Multipurpose Internet Mail Extensions (MIME)，也就是附件，扩展文本的支持（HTML等）

而上述两点是我们在发送邮件的过程中不可或缺的。

如果我们需要的是一个邮件客户端呢？那么我们还需要POP3协议和IMAP。

网络协议，也能如此动人。


