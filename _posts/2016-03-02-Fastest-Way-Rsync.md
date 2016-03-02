---
layout: post
date: 'Wed 2016-03-02 21:27:06 +0800'
slug: "Fastest-Way-Rsync"
title: "The Fastest Way to do Rsync"
description: ""
category: 
tags: Galaxy, Tips
---

## Ref

 * [Rsync over SSH - (40MB/s over 1GB NICs)](https://gist.github.com/KartikTalwar/4393116)
 * [OpenSSH ciphers performance benchmark](http://blog.famzah.net/2010/06/11/openssh-ciphers-performance-benchmark/)

## CLI

````bash
dd if=/dev/urandom of=test-file bs=1048576 count=100
dd if=/dev/urandom of=test-fileG bs=1048576 count=1000

for cipher in arcfour256 arcfour128 blowfish-cbc arcfour ; do
	echo "$cipher"
	for try in 1 2 ; do
		scp -c "$cipher" -P2211 me@192.168.0.201:/bak/tmp/test-fileG /dev/null
	done
done


rsync -aHhP --numeric-ids --stats -e "ssh -p 2211" me@192.168.0.201:/bak/tmp/_sync/ .
[18.08MB/s]

[ssh -T -c arcfour -o Compression=yes]=>[26.12MB/s]

rsync -aHhP --numeric-ids --stats --delete -e "ssh -T -c arcfour -o Compression=no -x -p2211" me@192.168.0.201:/bak/tmp/_sync/ .
[37.25MB/s]

[DsG] nc -l -p 7000 | lz4c -d| tar xv
[Server] tar cf - \[philosophy-raws\]\[Vocaloid\] | lz4c -c0 | nc 192.168.0.3 7000
[seems 80MB/s]

````


---

### The fastest remote directory rsync over ssh archival I can muster (40MB/s over 1gb NICs)

#### This creates an archive that does the following:

**rsync**
(Everyone seems to like -z, but it is much slower for me)

- a: archive mode - rescursive, preserves owner, preserves permissions, preserves modification times, preserves group, copies symlinks as symlinks, preserves device files.
- H: preserves hard-links
- A: preserves ACLs
- X: preserves extended attributes
- x: don't cross file-system boundaries
- v: increase verbosity
- --numeric-ds: don't map uid/gid values by user/group name
- --delete: delete extraneous files from dest dirs (differential clean-up during sync)
- --progress: show progress during transfer

**ssh**
- T: turn off pseudo-tty to decrease cpu load on destination.
- c arcfour: use the weakest but fastest SSH encryption. Must specify "Ciphers arcfour" in sshd_config on destination.
- o Compression=no: Turn off SSH compression.
- x: turn off X forwarding if it is on by default.

**Original**

```sh
rsync -aHAXxv --numeric-ids --delete --progress -e "ssh -T -c arcfour -o Compression=no -x" user@<source>:<source_dir> <dest_dir>
```


**Flip** 

```sh
rsync -aHAXxv --numeric-ids --delete --progress -e "ssh -T -c arcfour -o Compression=no -x" [source_dir] [dest_host:/dest_dir]
```

---

### OpenSSH ciphers performance benchmark

In order to examine their performance, we will transfer the test file twice using each of the ciphers and note the transfer speed and delta. Here are the shell commands that we used:

````bash
for cipher in aes128-ctr aes192-ctr aes256-ctr arcfour256 arcfour128 aes128-cbc 3des-cbc blowfish-cbc cast128-cbc aes192-cbc aes256-cbc arcfour ; do
	echo "$cipher"
	for try in 1 2 ; do
		scp -c "$cipher" test-file root@192.168.100.102:
	done
done
````

You can review the raw results in the “[ssh-cipher-speed-results.txt](http://www.famzah.net/download/openssh-performance/ssh-cipher-speed-results.txt)” file. The delta difference between the one and same benchmark test is within 16%-20%. Not perfect, but still enough for our tests.

Here is a chart which visualizes the results:

![http://famzah.files.wordpress.com/2010/06/ssh-cipher-speed-chart.png](/assets/wp-uploads/2016/ssh-cipher-speed-chart.png)

