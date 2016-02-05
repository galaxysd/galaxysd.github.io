---
layout: post
date: 'Fri 2015-05-08 20:31:31 +0800'
slug: "build-tree-with-mt-sequences"
title: "Build Tree with Mt Sequences"
description: ""
category: bioinformatics
tags: Biology, Galaxy
---

## Sequence Alignment

CLUSTAL 2.1 Multiple Sequence Alignments

```
2. Multiple Alignments -> 
	F. Toggle FASTA format output       =  ON
	1. Do complete multiple alignment now Slow/Accurate
```

生成multi-Fasta文件，自己转nex，保证每条序列一行。

比对结果需要人工检查调整(revise)。

## jModelTest

jModelTest 2 (自带PhyML_3.0)
https://github.com/ddarriba/jmodeltest2

PhyML
https://github.com/stephaneguindon/phyml/

```
Analysis -> Compute likelihood scores -> 设置 Number of substitution schemes = 5（多的通常没必要）
Analysis -> Do AIC calculations -> 勾选Write PAUP* block
同样地，算BIC。
Edit -> Save console
```

## PAUP* 4.0 beta

在`.nex`文件后面追加paup的命令，例：
`less -Sx 30 mt_paup_2.nex`


```
#NEXUS
BEGIN DATA;
Dimensions ntax=11 nchar=15461;
Format datatype=DNA gap=- missing=?;
Matrix
NC_009970_M.ursinus           GTTTACGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTATATAACTCC
NC_003427_U.arctos            GTTTATGTAGCTTAATAGTAAAGCAAGGCACTGAAAATGCCTAGACGAGTTATATAATTCC
NC_003428_U.maritimus         GTTTATGTAGCTTAATAGTAAAGCAAGGCACTGAAAATGCCTAGACGAGTTATATAATTCC
NC_009968_H.malayanus         GTCCATGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTATATAACTCC
NC_003426_U.americanus        GTTTATGTAGCTTAATAGTAAAGCAAGGCACTGAAAATGCCTAGACGAGTTATATAACTCC
AB863014_U.t.japonicus        GTTTATGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTGTATGACCCC
NC_009331_U.t.formosanus      GTTTATGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAAACAAGTTGTATAACCCC
NC_011118_U.t.thibetanus      GTTTATGTAGTTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTGTATAACCCC
NC_008753_U.t.mupinensis      GTTTATGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTGTATAACCCC
NC_011117_U.t.ussuricus       GTTTATGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTGTATAACCCC
EF667005_U.t.ussuricus        GTTTATGTAGCTTAATAATAAAGCAAGGCACTGAAAATGCCTAGACGAGTTGTATAACCCC
;
END;

begin assumptions;
                              usertype 20_1 = 4                                           [weights transversions 20 times transitions]
                                                            a  c  g  t
                              [a]                           .  20 1  20
                              [c]                           20 .  20 1
                              [g]                           1  20 .  20
                              [t]                           20 1  20 .;
end;

begin paup;
set autoclose=yes increase=auto warntree=no warnreset=no;

Lset base=(0.3157 0.2581 0.1503 ) nst=6  rmat=(1.3137 81.4005 2.4087 1.1669 79.3722) rates=gamma shape=0.1760 ncat=4 pinvar=0;
set criterion=distance;
dset distance=ml;
nj;
savetrees file=nj_gtrG.tre brlens=yes;
bootstrap search=nj;
savetrees file=nj_gtrG_bs.tre savebootp=nodelabels from=1 to=1;

set criterion=likelihood;
Lset base=(0.3167 0.2570 0.1500 ) nst=2 tratio=23.4667 rates=gamma shape=0.1770 ncat=4 pinvar=0;
hsearch;
savetrees file=ml_hkyG.tre brlens=yes;
bootstrap search=heuristic;
savetrees file=ml_hkyG_bs.tre savebootp=nodelabels from=1 to=1;

set criterion=distance;
dset distance=ml;
nj;
savetrees file=nj_hkyG.tre brlens=yes;
bootstrap search=nj;
savetrees file=nj_hkyG_bs.tre savebootp=nodelabels from=1 to=1;

set criterion=parsimony;
bandb;
savetrees file=mp.tre brlens=yes;
bootstrap search=heuristic;
savetrees file=mp_bs.tre savebootp=nodelabels from=1 to=1;

ctype 20_1:all;
bandb;
savetrees file=mp_20vs1.tre brlens=yes;
bootstrap search=heuristic;
savetrees file=mp_20vs1_bs.tre savebootp=nodelabels from=1 to=1;

quit;
end;

```

然后，`nohup paup mt_paup_2.nex &`。

## MrBayes

http://mrbayes.sourceforge.net/

同上，改`.nex`文件，加：

```

begin mrbayes;
lset nst=6 ploidy=haploid rates=gamma;
mcmc ngen=10000000 samplefreq=1000 printfreq=10000 diagnfreq=10000 nruns=3;
sump;
sumt;
end;
```

```
$ cat /opt/bin/mb
#!/usr/bin/perl
die "usage: mb <number of threads> <input.nex>\n" if @ARGV<2;
exec ("module add mpi/openmpi-x86_64 && mpirun -np $ARGV[0] /opt/mrbayes_3.2.2/src/mb $ARGV[1]");

mb 12 mt_GTR-G.nex
```

默认每个run有4条chains，MPI线程数必须是`3x4=12`的因数，即1,2,3,4,6,12。否则报错。

结果是`mt_GTR-G.log`和`mt_GTR-G.nex.con.tre`。

检查log，要求`nruns=3`的3个run间方差稳定小于0.01，否则就是`ngen=10000000`太小，或者模型参数太多。例：

```
      Chain results (10000000 generations requested):

         0 -- [-65946.127] [...11 remote chains...]
      10000 -- (-40726.293) [...11 remote chains...] -- 0:49:56

      Average standard deviation of split frequencies: 0.037717

      20000 -- (-40726.746) [...11 remote chains...] -- 0:41:35

      Average standard deviation of split frequencies: 0.024056

      30000 -- [-40719.331] [...11 remote chains...] -- 0:38:46

      Average standard deviation of split frequencies: 0.005346

      40000 -- (-40717.835) [...11 remote chains...] -- 0:37:21

      Average standard deviation of split frequencies: 0.012416

      50000 -- [-40719.091] [...11 remote chains...] -- 0:36:29

      Average standard deviation of split frequencies: 0.013159

      60000 -- (-40719.444) [...11 remote chains...] -- 0:35:53

      Average standard deviation of split frequencies: 0.006973

      70000 -- (-40722.172) [...11 remote chains...] -- 0:35:27

      Average standard deviation of split frequencies: 0.006389

      80000 -- (-40716.393) [...11 remote chains...] -- 0:35:08

      Average standard deviation of split frequencies: 0.005937

      90000 -- (-40718.560) [...11 remote chains...] -- 0:34:52

      Average standard deviation of split frequencies: 0.012203

      100000 -- (-40722.171) [...11 remote chains...] -- 0:34:39

      Average standard deviation of split frequencies: 0.006121

      110000 -- (-40731.146) [...11 remote chains...] -- 0:34:27

      Average standard deviation of split frequencies: 0.002850

      120000 -- (-40717.502) [...11 remote chains...] -- 0:34:18

      Average standard deviation of split frequencies: 0.005112

	  省略n行

      Average standard deviation of split frequencies: 0.001247

      9990000 -- (-40723.895) [...11 remote chains...] -- 0:00:02

      Average standard deviation of split frequencies: 0.001277
      10000000 -- (-40724.333) [...11 remote chains...] -- 0:00:00

      Average standard deviation of split frequencies: 0.001194

      Analysis completed in 39 mins 36 seconds
      Analysis used 2373.21 seconds of CPU time on processor 0
      Likelihood of best state for "cold" chain of run 1 was -40707.40
      Likelihood of best state for "cold" chain of run 2 was -40707.40
      Likelihood of best state for "cold" chain of run 3 was -40707.78
```

## 树图整理

如果所有树拓扑一致，就说一致，然后直接选一个放上去。

将`*_bs.tre`的 bootstrap 值写下来，然后标到正常树上面。

---

以上。
