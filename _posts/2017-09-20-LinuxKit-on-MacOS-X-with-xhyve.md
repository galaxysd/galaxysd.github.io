---
layout: post
title: Getting Started with LinuxKit on Mac OS X with xhyve
category: MacOS
status: publish
tags: [ZT, xhyve]
---

Source: <http://www.nebulaworks.com/blog/2017/04/23/getting-started-linuxkit-mac-os-x-xhyve/>.

One of the major announcements last week at [DockerCon 2017](http://www.nebulaworks.com/blog/2017/04/22/docker-captains-dockercon-2017-review/) was LinuxKit, a framework for creating minimal Linux OS images purpose built for containers. Docker has been using the tools that make up LinuxKit for some time and the products derived from the tooling include Docker for Mac.

Sounds cool, and the best way to learn about a tool is to dive into using it! Given the extra time that I had on the plane home from Austin I did just that and would like to share with you an easy way to get started using LinuxKit.

To get going you’ll need a few things:

* A 2010 or later Mac (a CPU that supports EPT)
* OS X 10.10.3 or later
* A Git client
* Docker running (In my case, 17.04.0-ce-mac7 (16352))
* GNU make
* GNU tar
* Homebrew

Let’s get started!

## Installing xhyve

First, we’ll need to install [xhyve](https://github.com/mist64/xhyve). Xhyve is a hypervisor which is built on top of OS X’s Hypervisor.framework that allows us to run virtual machines in user space. It is what Docker for Mac uses under the hood! There are a couple ways to do this, the easiest is to use Homebrew. Fire up your favorite terminal and install:

````bash
$ brew update
$ brew install --HEAD xhyve
````

Once you have that complete, see if it works by

````bash
$ xhyve -h
````

If you get a response with the various available flags, you are ready for the next step.

## Building the moby tool

The next step in getting started is to build the moby tool. This tool is what will provide the functionality to read in the yaml we will specify later, execute the various docker commands to build the Linux OS, and if you’d like, run the image. In this example, we’ll be using xhyve to run the image rather than project moby’s [HyperKit](https://github.com/moby/hyperkit). I found that building the kernel and initrd images takes quite a bit less time than a qcow image, so if you need to iterate quickly xhyve is the way to go.

First, cd into whatever workspace you’d like to use, and clone the LinuxKit repo:

````bash
$ git clone https://github.com/linuxkit/linuxkit.git
````

Then, make and install the moby binary:

````bash
$ cd linuxkit
$ make
$ sudo make install
````

Once you have this complete, you should be ready to build your first Linux image using LinuxKit.

## Customizing and Building a Linux image

With the prerequisites out of the way, let’s build our first image. The LinuxKit project includes a few examples, some of which were demoed at DockerCon. Rather than getting super complicated out of the gate, let’s build a simple image that fires up a redis instance on boot.

First, you’ll need to start with a yaml file that describes your Linux image. Pulling from the examples, we’ll take the base docker image and add an entry for redis:

$ vi [linux-redis.yaml](https://gist.github.com/chrisciborowski/8ca04dede93c5e910012af3d17d9a8ab)

````yaml
kernel:
  image: "linuxkit/kernel:4.9.x"
  cmdline: "console=ttyS0 console=tty0 page_poison=1"
init:
  - linuxkit/init:63eed9ca7a09d2ce4c0c5e7238ac005fa44f564b
  - linuxkit/runc:b0fb122e10dbb7e4e45115177a61a3f8d68c19a9
  - linuxkit/containerd:18eaf72f3f4f9a9f29ca1951f66df701f873060b
  - linuxkit/ca-certificates:eabc5a6e59f05aa91529d80e9a595b85b046f935
onboot:
  - name: sysctl
    image: "linuxkit/sysctl:1f5ec5d5e6f7a7a1b3d2ff9dd9e36fd6fb14756a"
    net: host
    pid: host
    ipc: host
    capabilities:
     - CAP_SYS_ADMIN
    readonly: true
  - name: sysfs
    image: linuxkit/sysfs:6c1d06f28ddd9681799d3950cddf044b930b221c
  - name: binfmt
    image: "linuxkit/binfmt:8881283ac627be1542811bd25c85e7782aebc692"
    binds:
     - /proc/sys/fs/binfmt_misc:/binfmt_misc
    readonly: true
  - name: format
    image: "linuxkit/format:53748000acf515549d398e6ae68545c26c0f3a2e"
    binds:
     - /dev:/dev
    capabilities:
     - CAP_SYS_ADMIN
     - CAP_MKNOD
  - name: mount
    image: "linuxkit/mount:d2669e7c8ddda99fa0618a414d44261eba6e299a"
    binds:
     - /dev:/dev
     - /var:/var:rshared,rbind
    capabilities:
     - CAP_SYS_ADMIN
    rootfsPropagation: shared
    command: ["/mount.sh", "/var/lib/docker"]
services:
  - name: rngd
    image: "linuxkit/rngd:3dad6dd43270fa632ac031e99d1947f20b22eec9"
    capabilities:
     - CAP_SYS_ADMIN
    oomScoreAdj: -800
    readonly: true
  - name: dhcpcd
    image: "linuxkit/dhcpcd:57a8ef29d3a910645b2b24c124f9ce9ef53ce703"
    binds:
     - /var:/var
     - /tmp/etc:/etc
    capabilities:
     - CAP_NET_ADMIN
     - CAP_NET_BIND_SERVICE
     - CAP_NET_RAW
    net: host
    oomScoreAdj: -800
  - name: ntpd
    image: "linuxkit/openntpd:a570316d7fc49ca1daa29bd945499f4963d227af"
    capabilities:
      - CAP_SYS_TIME
      - CAP_SYS_NICE
      - CAP_SYS_CHROOT
      - CAP_SETUID
      - CAP_SETGID
    net: host
  - name: redis
    image: "redis:3.0.7-alpine"
    capabilities:
     - CAP_NET_BIND_SERVICE
     - CAP_CHOWN
     - CAP_SETUID
     - CAP_SETGID
     - CAP_DAC_OVERRIDE
    net: host
files:
  - path: etc/docker/daemon.json
    contents: '{"debug": true}'
trust:
  image:
    - linuxkit/kernel
outputs:
  - format: kernel+initrd
````

Let’s quickly examine this file. Without getting into all of the details (which are available on the LinuxKit git repo) we’ll focus on the major blocks. The beginning of the file spells out the “base” Linux docker image that defines the kernel and kernel command line options. Next, the file describes how the base OCI complaint LinuxKit images that are required for init. After that, the file describes how more base images that will be run by runc sequentially before any other services are started. Next up are the services (again OCI compliant images) that will be started by containerd, which are meant to remain running. And last, the output files which moby will create as part of the build process. With the base file created, let’s build our image!

````bash
$ moby build linux-redis
````

You’ll see output that looks like this:

````
Extract kernel image: linuxkit/kernel:4.9.x
Add init containers:
Process init image: linuxkit/init:63eed9ca7a09d2ce4c0c5e7238ac005fa44f564b
Process init image: linuxkit/runc:b0fb122e10dbb7e4e45115177a61a3f8d68c19a9
Process init image: linuxkit/containerd:18eaf72f3f4f9a9f29ca1951f66df701f873060b
Process init image: linuxkit/ca-certificates:eabc5a6e59f05aa91529d80e9a595b85b046f935
Add onboot containers:
Create OCI config for linuxkit/sysctl:1f5ec5d5e6f7a7a1b3d2ff9dd9e36fd6fb14756a
Create OCI config for linuxkit/sysfs:6c1d06f28ddd9681799d3950cddf044b930b221c
Create OCI config for linuxkit/binfmt:8881283ac627be1542811bd25c85e7782aebc692
Create OCI config for linuxkit/format:53748000acf515549d398e6ae68545c26c0f3a2e
Create OCI config for linuxkit/mount:d2669e7c8ddda99fa0618a414d44261eba6e299a
Add service containers:
Create OCI config for linuxkit/rngd:3dad6dd43270fa632ac031e99d1947f20b22eec9
Create OCI config for linuxkit/dhcpcd:57a8ef29d3a910645b2b24c124f9ce9ef53ce703
Create OCI config for linuxkit/openntpd:a570316d7fc49ca1daa29bd945499f4963d227af
Create OCI config for redis:3.0.7-alpine
Add files:
etc/docker/daemon.json
Create outputs:
linux-redis-bzImage linux-redis-initrd.img linux-redis-cmdline
````

And that’s it! Here are the files that are created:

* The raw kernel image (linux-redis-kernel)
* The init ramdisk (linux-redis-initrd.img)
* The commandline options you’ll need to provide to xhyve in a file

## Running the LinuxKit output with xhyve

Now that we’ve built the image, let’s run it! First, we’ll have to create a script that tells xhyve how to instantiate the image as a virtual machine. Now, I did say before that if you wanted to, you could have set the moby tool to output a qcow image, and then use **moby run** to run the image as a VM. I’d rather use xhyve, as this is how other non-LinuxKit operating systems can be run on the Hypervisor.framework. Let’s do it.

We’ll need one thing to run our image: A script that defines to xhyve the parameters for building our virtual machine. The main items needed in this script are what we got from the moby build process. Here’s and example to fire up our redis server:

$ vi linux-redis.sh

````bash
#!/bin/sh

KERNEL="linux-redis-kernel"
INITRD="linux-redis-initrd.img"
CMDLINE="console=ttyS0 console=tty0 page_poison=1"

MEM="-m 1G"
PCI_DEV="-s 0:0,hostbridge -s 31,lpc"
LPC_DEV="-l com1,stdio"
ACPI="-A"
#SMP="-c 2"

# sudo if you want networking enabled
NET="-s 2:0,virtio-net"

xhyve $ACPI $MEM $SMP $PCI_DEV $LPC_DEV $NET -f kexec,$KERNEL,$INITRD,"$CMDLINE"
````

Once you have the file created, make it executable and run it. A couple things to note at this point:

1. If you have any VPN running to secure your connection to a wireless network, etc., shut it down. There are some known issues with routing traffic when the VPN is up. There may be a fix on the interwebs for this, didn’t have time to research the proper route which needs to be added to operate with VPN networking in place on OS X.
2. You’ll need to execute the script with superuser privileges if you are going to network the virtual machine.

That done, let’s run it:

````bash
$ chown 755 linux-redis.sh
$ sudo ./linux-redis.sh
````

Once you run this, a bunch of output will fly by as the virtual machine is run. At the end, you’ll get a command line prompt on your newly minted VM!

````
Welcome to LinuxKit

                       ##         .
                  ## ## ##        ==
               ## ## ## ## ##    ===
           /"""""""""""""""""\___/ ===
      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
           \______ o           __/
             \    \         __/
              \____\_______/

/ # [ 2.125127] IPVS: Creating netns size=2104 id=1
[ 2.125466] IPVS: ftp: loaded support on port[0] = 21
[ 2.156114] IPVS: Creating netns size=2104 id=2
[ 2.156496] IPVS: ftp: loaded support on port[0] = 21
[ 2.177714] tsc: Refined TSC clocksource calibration: 2193.340 MHz
[ 2.178170] clocksource: tsc: mask: 0xffffffffffffffff max_cycles: 0x1f9d9f9c94d, max_idle_ns: 440795310624 ns
[ 2.399509] IPVS: Creating netns size=2104 id=3
[ 2.400027] IPVS: ftp: loaded support on port[0] = 21
[ 2.670029] IPVS: Creating netns size=2104 id=4
[ 2.670555] IPVS: ftp: loaded support on port[0] = 21
[ 2.773492] random: dhcpcd: uninitialized urandom read (112 bytes read)
[ 2.791653] random: redis-server: uninitialized urandom read (19 bytes read)
[ 2.792066] random: redis-server: uninitialized urandom read (1024 bytes read)
[ 2.911251] IPVS: Creating netns size=2104 id=5
[ 2.911770] IPVS: ftp: loaded support on port[0] = 21
[ 2.935150] random: rngd: uninitialized urandom read (16 bytes read)
[ 2.955187] random: crng init done
[ 3.187797] clocksource: Switched to clocksource tsc

/ #
````

Let’s see if the redis server is running:

````
/ # netstat -an
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address Foreign Address State
tcp 0 0 0.0.0.0:6379 0.0.0.0:* LISTEN
tcp 0 0 :::6379 :::* LISTEN
udp 0 0 192.168.64.17:44773 52.6.160.3:123 ESTABLISHED
udp 0 0 192.168.64.17:44091 208.75.89.4:123 ESTABLISHED
udp 0 0 0.0.0.0:68 0.0.0.0:*
udp 0 0 192.168.64.17:33429 192.96.202.120:123 ESTABLISHED
udp 0 0 192.168.64.17:39584 69.89.207.99:123 ESTABLISHED
raw 0 0 ::%192:58 ::%32631:* 58
Active UNIX domain sockets (servers and established)
Proto RefCnt Flags Type State I-Node Path
unix 2 [ ACC ] STREAM LISTENING 14907 /var/run/dhcpcd.sock
unix 2 [ ACC ] STREAM LISTENING 14909 /var/run/dhcpcd.unpriv.sock
unix 2 [ ACC ] STREAM LISTENING 14248 /run/containerd/debug.sock
unix 2 [ ACC ] STREAM LISTENING 14258 /run/containerd/containerd.sock
unix 2 [ ACC ] STREAM LISTENING 15051 /var/run/ntpd.sock
unix 3 [ ] STREAM CONNECTED 15055
unix 3 [ ] STREAM CONNECTED 15050
unix 2 [ ] DGRAM 15025
unix 3 [ ] STREAM CONNECTED 15054
unix 3 [ ] STREAM CONNECTED 15049
/ #
````

Looks like our machine is listening on 6379, the redis port. Now, let’s see if that is exposed properly on the network and reachable. First, find the IP address of your VM:

````
/ # ip a
1: lo: &lt;LOOPBACK,UP,LOWER_UP&gt; mtu 65536 qdisc noqueue state UNKNOWN qlen 1
link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
inet 127.0.0.1/8 brd 127.255.255.255 scope host lo
valid_lft forever preferred_lft forever
inet6 ::1/128 scope host
valid_lft forever preferred_lft forever
2: bond0: &lt;BROADCAST,MULTICAST400&gt; mtu 1500 qdisc noop state DOWN qlen 1000
link/ether ca:41:0c:a4:ea:c2 brd ff:ff:ff:ff:ff:ff
3: dummy0: &lt;BROADCAST,NOARP&gt; mtu 1500 qdisc noop state DOWN qlen 1000
link/ether 1a:23:2d:47:af:d5 brd ff:ff:ff:ff:ff:ff
4: eth0: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc pfifo_fast state UP qlen 1000
link/ether f2:94:56:b6:96:93 brd ff:ff:ff:ff:ff:ff
inet 192.168.64.17/24 brd 192.168.64.255 scope global eth0
valid_lft forever preferred_lft forever
inet6 fe80::f094:56ff:feb6:9693/64 scope link
valid_lft forever preferred_lft forever
5: teql0: mtu 1500 qdisc noop state DOWN qlen 100
link/void
6: tunl0@NONE: mtu 1480 qdisc noop state DOWN qlen 1
link/ipip 0.0.0.0 brd 0.0.0.0
7: gre0@NONE: mtu 1476 qdisc noop state DOWN qlen 1
link/gre 0.0.0.0 brd 0.0.0.0
8: gretap0@NONE: &lt;BROADCAST,MULTICAST&gt; mtu 1462 qdisc noop state DOWN qlen 1000
link/ether 00:00:00:00:00:00 brd ff:ff:ff:ff:ff:ff
9: ip_vti0@NONE: mtu 1332 qdisc noop state DOWN qlen 1
link/ipip 0.0.0.0 brd 0.0.0.0
10: ip6_vti0@NONE: mtu 1500 qdisc noop state DOWN qlen 1
link/tunnel6 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00 brd 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
11: sit0@NONE: mtu 1480 qdisc noop state DOWN qlen 1
link/sit 0.0.0.0 brd 0.0.0.0
12: ip6tnl0@NONE: mtu 1452 qdisc noop state DOWN qlen 1
link/tunnel6 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00 brd 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
13: ip6gre0@NONE: mtu 1448 qdisc noop state DOWN qlen 1
link/[823] 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00 brd 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
````

Our IP is 192.168.64.17. From the Mac OS X host, we’ll use netcat and test the connection and server status:

````
$ nc 192.168.64.17 6379
ping
+PONG
````

Once you are done poking around, issue halt to shutdown the VM:

````
/ # halt
````

Success! We have a working LinuxKit image that is running a userland VM on OS X! Very cool. This is just the beginning. You can use the templates to create other images, customizing them to your liking. Also, don’t need to use redis. Try using your own docker images with your own services, and stand up the VMs.

In future [posts](http://www.nebulaworks.com/blog/2017/04/23/getting-started-linuxkit-mac-os-x-xhyve/#comments), I’ll explore how to use the other Moby Project tools, like InfraKit and HyperKit, leveraging these to stand up LinuxKit OS images to provide more than just a quick testbed.

Oh, and take a look at the size of the two files created by LinuxKit and represents our Linux OS 🙂

