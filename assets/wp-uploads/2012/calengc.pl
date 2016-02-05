#!/usr/bin/perl -w
use strict;
use warnings;
use Getopt::Long;
my %opts;
my ($List,$Len_th,$GC_th,$Help);
GetOptions(\%opts,"list:s"=>\$List,"len_theshold:s"=>\$Len_th,"gc_theshold:s"=>\$GC_th,"help"=>\$Help);
if ((defined $Help)||(@ARGV==0))
{
	die "perl calengc.pl <IN:fasta|fastq> [-list calculate-contig-list] [len_theshold: length-theshold] [gc_theshold: GC-content-theshold] [-help]
Author: BENM <binxiaofeng\@gmail.com> Version: 1.2 alpha 2009-10-08\n
Example: perl calgc.pl contigs.fasta -list contigs.list -len_theshold 100 -gc_theshold 0.2-0.6\n
Note:
calculate contig list example:

 >Contigs1
 >Contigs2

or

 \@Contigs1
 \@Contigs2

which must the same as the FASTA/FASTQ contigs/reads name\n
len_theshold can be set as \"num\", for example: 500, or \"min-max\": 500-1000
gc_theshold can be set as \"num\", for example: 0.3, or \"min-max\": 0.1-0.5
"
}
my ($Len_min,$Len_max)=split/\-/,$Len_th if (defined $Len_th);
my ($GC_min,$GC_max)=split/-/,$GC_th if (defined $GC_th);
$Len_min ||= 0;
$GC_min ||= -1;
my ($chr,$gc,$len,$tgc,$tlen,$n)=("",0,0,0,0,0);
my @x=();
my @y=();
my $len_add_square=0;
my $gc_add_square=0;
my $gc_total=0;
my %hash=readlist($List) if (defined $List);
open (IN,$ARGV[0]) || die $!;
while(<IN>)
{
	s/\s*$//;
	next if ($_ eq "");
	if ($_=~/^[\>\@](.*)/)
	{
		if (($chr ne "")&&($chr ne $_)
			&&($len>0)&&($len>=$Len_min)&&($gc>=$GC_min)
			&&((!defined $Len_max)||($len<=$Len_max))&&((!defined $GC_max)||($gc<=$GC_max))
			&&((!defined $List)||(exists $hash{$chr})))
		{
			$tgc+=$gc;
			$tlen+=$len;
			my $gc_rate=int($gc*10000/$len+0.5)/100;
			push @x,$len;
			push @y,$gc/$len;
			$gc_total+=$gc/$len;
			$len_add_square+=$len*$len;
			$gc_add_square+=($gc*$gc)/($len*$len);
			print "$chr\tLength: $len\tGC_Content: $gc_rate%\n";
			$n++;
		}
		$gc=0;
		$len=0;	
		$chr=$1;
	}
	else
	{
		if (($_=~/^\+$/)||($_=~/^\+$chr/))
		{
			<IN>;next;
		}
		my ($len1,$len2)=cal_GC($_) unless ($_ =~ /\d+/);
		$gc+=$len1;
		$len+=$len2;
	}
}
close IN;
if (($len>0)&&($len>=$Len_min)&&($gc>=$GC_min)
	&&((!defined $Len_max)||($len<=$Len_max))&&((!defined $GC_max)||($gc<=$GC_max))
	&&((!defined $List)||(exists $hash{$chr})))
{
	my $last_gc=int($gc*10000/$len+0.5)/100;
	$tgc+=$gc;
	$tlen+=$len;
	push @x,$len;
	$len_add_square+=$len*$len;
	push @y,$gc/$len;
	$gc_add_square+=($gc*$gc)/($len*$len);
	print "$chr\tLength: $len\tGC_Content: $last_gc%\n";
	$n++;
}

my $GC=int($tgc*10000/$tlen+0.5)/100;
print "\n$n sequences Total Length: $tlen\tGC Content: $GC%\n";

@x=sort{$b<=>$a}@x;
my $count=0;
my ($n50,$n80,$n90);
my $len_mean=$tlen/$n;
foreach my $i(@x)
{
	$count+=$i;
	$n50=$i if (($count>=$tlen*0.5)&&(!defined $n50));
	$n80=$i if (($count>=$tlen*0.8)&&(!defined $n80));
	$n90=$i if (($count>=$tlen*0.9)&&(!defined $n90));
}
my $len_sd=sqrt($len_add_square-$n*$len_mean*$len_mean)/$n;
my $j=($n<=1)?int($n/2):int($n/2+0.5);
print "\n--- Length Statistics ---\n\n";
print " total number:\t$n\n";
print " total value:\t$tlen\n";
print " mean value:\t$len_mean\n";
print " median value:\t$x[$j]\n";
print " SD value:\t$len_sd\n";
print " max value:\t$x[0]\n";
print " min value:\t$x[-1]\n";
print " N50 value:\t$n50\n";
print " N80 value:\t$n80\n";
print " N90 value:\t$n90\n";

@y=sort{$b<=>$a}@y;
$count=0;
my ($g50,$g80,$g90);
my $gc_mean=$gc_total/$n;
foreach my $k(@y)
{
	$count+=$k;
	$g50=$k if (($count>=$gc_total/100*0.5)&&(!defined $g50));
	$g80=$k if (($count>=$gc_total/100*0.8)&&(!defined $g80));
	$g90=$k if (($count>=$gc_total/100*0.9)&&(!defined $g90));
}
my $gc_sd=sqrt($gc_add_square-$n*$gc_mean*$gc_mean)/$n;
print "\n--- GC content Statistics ---\n\n";
print " total number:\t$n\n";
print " total value:\t$gc_total\n";
print " mean value:\t$gc_mean\n";
print " median value:\t$y[$j]\n";
print " SD value:\t$gc_sd\n";
print " max value:\t$y[0]\n";
print " min value:\t$y[-1]\n";
print " N50 value:\t$g50\n";
print " N80 value:\t$g80\n";
print " N90 value:\t$g90\n";


sub cal_GC {
	my $seq=shift;
	$seq=~ s/[NX-]//gi;
	my $length=length($seq);
	$seq=~ s/[AT]//gi;
	my $length_GC=length($seq);
	return ($length_GC,$length);
}

sub readlist {
	my $file =shift;
	my %hash;
	open (IN,$file) || die $!;
	while (<IN>)
	{
		s/\s+$//;
		s/^\s+//;
		my $key = ($_ =~ /[\>\@](.*)/) ? $1 : $_;
		$hash{$key}=1;
	}
	close IN;
	return %hash;
}
