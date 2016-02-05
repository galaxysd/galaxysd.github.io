---
date: '2012-03-30 01:39:39'
layout: post
slug: converting-fastq-to-fasta-with-simple-tools
title: "Converting FASTQ to FASTA with simple tools"
description: ""
category: BioInformatics
tags: [Biology, Galaxy_Original, Linux, Tips, Scripts]
wordpress_id: '1150'
---

又一次遇到fq文件要跑BLAST来鉴定物种污染情况，不想输出fasta文件浪费盘阵空间，就上网查on-the-fly的方法。（当然是简单命令走管道的……）

Google指向了老地方：<br>
http://stackoverflow.com/questions/1542306/converting-fastq-to-fasta-with-sed-awk

Converting FASTQ to FASTA with SED/AWK

I have a data in that always comes in block of four in the following format (called FASTQ):

    @SRR018006.2016 GA2:6:1:20:650 length=36 
    NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNGN 
    +SRR018006.2016 GA2:6:1:20:650 length=36 
    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!+! 
    @SRR018006.19405469 GA2:6:100:1793:611 length=36 
    ACCCGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC 
    +SRR018006.19405469 GA2:6:100:1793:611 length=36 
    7);;).;);;/;*.2>/@@7;@77<..;)58)5/>/ 

Is there a simple sed/awk/bash way to convert them into this format (called FASTA):

    >SRR018006.2016 GA2:6:1:20:650 length=36 
    NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNGN 
    >SRR018006.19405469 GA2:6:100:1793:611 length=36 
    ACCCGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC 

In principle we want to extract the first two lines in each block-of-4 and replace `@` with `>`.

* * *

下面是答案，不过Galaxy没直接选被打勾的那个……<br>
This is the fastest I've got, and I stuck it in my .bashrc file:
<pre lang="bash">alias fq2fa="awk '{print \">\" substr(\$0,2);getline;print;getline;getline}'"</pre>
即：
<pre lang="bash">awk '{print ">" substr($0,2);getline;print;getline;getline}'</pre>
It doesn't fail on the infrequent but not impossible quality lines that start with @... but does fail on wrapped FASTQ, if that's even legal (it exists though).

另外有两个功能比较多的相关程序：

<ul>
	<li><a href="http://hannonlab.cshl.edu/fastx_toolkit/commandline.html#fastq_to_fasta_usage">fastq_to_fasta from FASTX-Toolkit (FASTQ/A short-reads pre-processing tools)</a></li>
	<li><a href="http://prinseq.sourceforge.net/">prinseq (Easy and rapid quality control and data preprocessing)</a></li>
</ul>

目前Galaxy断网中，有网且有空时再去考据这两软件。

