---
layout: post
slug: "2017-08-04-Wired-8021X-in-Windoes-10"
title: Enable 802.1X authentication in Windows 10
description: 
category: Windows
tags: Galaxy, Tips
---

Our company had set up 802.1X authentication for LAN. And the clerk said to link the LAN, all computers running Windows must join its domain to login with enterprise E-mail account. My PC was running continously before the change made, thus the LAN port keeps open.
However, after moving to another building, the new LAN port just shut me out, `dhcpcd enp2s0` always return with "time out".
I sent a ticket and the clerk told me, all LAN ports require **802.1X authentication** now. If running Linux, I must setup a GUI to start the link.

Knowing the reason, I googled and [find](https://documentation.meraki.com/MS/Access_Control/Configuring_802.1X_Wired_Authentication_on_a_Windows_7_Client): by default, the service named **Wired AutoConfig** is not *Automatic*, after enable it with `services.msc`, the *Properties* of *network adapter* shows a *Authentication* tab.
Choose the network authentication method as the default **Microsoft:Protected EAP (PEAP)**.
Click *Additional Settings* and select *Specify authentication mode* and specify *User authentication*.
I can now *Save credentials*.

Then, everything OK.

And the authentication state remains valid after reboot to Linux setup ISO. Yes, it will keeps valid if I keep the PC on.

---

BTW: Another Windows setting they implied is the Local Windows Update Server, after they block the *offical* server with the excuse of heavy traffic. See image below as they reply me for `WUServer` and `WUStatusServe`:

![](/assets/images/2017/LocalWindowsUpdate.png)
