# FastQ Files

From: <https://help.basespace.illumina.com/files-used-by-basespace/fastq-files>, [Refer Page](https://knowledge.illumina.com/software/general/software-general-reference_material-list/000002211).

------

BaseSpace Sequence Hub converts *.bcl files into FASTQ files, which contain base call and quality information for all reads that pass filtering.  
BaseSpace Sequence Hub automatically generates FASTQ files in sample sheet-driven workflow apps. Other apps that perform alignment and variant calling also automatically use FASTQ files.  
FASTQ files can be used as sequence input for alignment and other secondary analysis software. Do not use them with tools that are not compatible with the FASTQ format.

## Detailed Description

### Naming

FASTQ files are named with the sample name and the sample number, which is a numeric assignment based on the order that the sample is listed in the sample sheet. Example: Data\Intensities\BaseCalls\samplename_S1_L001_R1_001.fastq.gz

 * samplename - The sample name provided in the sample sheet. If a sample name is not provided, the file name includes the sample ID, which is a required field in the sample sheet and must be unique.
 * S1 — The sample number based on the order that samples are listed in the sample sheet starting with 1. In this example, S1 indicates that this sample is the first sample listed in the sample sheet.

> Reads that cannot be assigned to any sample are written to a FASTQ file for sample number 0, and excluded from downstream analysis.

 * L001—The lane number.
 * R1—The read. In this example, R1 means Read 1. For a paired-end run, there is at least one file with R2 in the file name for Read 2.
 * 001—The last segment is always 001.

### Compression

FASTQ files are saved compressed in the GNU zip format (an open source file compression program), indicated by the .gz file extension.

### Format

Each entry in a FASTQ file consists of four lines:

 * Sequence identifier
 * Sequence
 * Quality score identifier line (consisting only of a +)
 * Quality score

> For the Undetermined FASTQ files only, the sequence observed in the index read is written to the FASTQ header in place of the sample number. This information can be useful for troubleshooting demultiplexing.
>
> `@<instrument>:<run number>:<flowcell ID>:<lane>:<tile>:<x-pos>:<y-pos> <read>:<is filtered>:<control number>:<sample number>`

The following table describes the elements:

| Element | Requirements | Description |
| --- | --- | --- |
| @ | @ | Each sequence identifier line starts with @ |
| \<instrument> | Characters allowed: a–z, A–Z, 0–9 and underscore | Instrument ID |
| \<run number> | Numerical | Run number on instrument |
| \<flowcell ID> | Characters allowed: a–z, A–Z, 0–9 | Flowcell ID |
| \<lane> | Numerical | Lane number |
| \<tile> | Numerical | Tile number |
| \<x_pos> | Numerical | X coordinate of cluster |
| \<y_pos> | Numerical | Y coordinate of cluster |
| \<read> | Numerical | Read number. 1 can be single read or Read 2 of paired-end |
| \<is filtered> | Y or N | Y if the read is filtered (did not pass), N otherwise |
| \<control number> | Numerical | 0 when none of the control bits are on, otherwise it is an even number. On HiSeq X systems, control specification is not performed and this number is always 0. |
| \<sample number> | Numerical | Sample number from sample sheet |

An example of a valid entry is as follows; note the space preceding the read number element:

```
	@SIM:1:FCX:1:15:6329:1045 1:N:0:2
	TCGCACTCAACGCCCTGCATATGACAAGACAGAATC
	+
	<>;##=><9=AAAAAAAAAA9#:<#<;<<<????#=
```

#### Control values

If the read is not identified as a control, then the 10th column (\<control number>) is zero. If the read is identified as a control, the number is greater than zero, and the value specifies what type of control it is. The value is the decimal representation of a bit-wise encoding scheme. In that scheme bit 0 has a decimal value of 1, bit 1 a value of 2, bit 2 a value of 4, and so on.

------

Illumina:
`@<instrument>:<run number>:<flowcell ID>:<lane>:<tile>:<x-pos>:<y-pos> <read>:<is filtered>:<control number>:<sample number>`

Salus:
`@<machine_SN>:<Not_Use>:<FC_lD>:<Lane_ID>:<Reads_ID>:<FOV_Row_number>:<FOV_Column_number>:<X coordinate of cluster>:<Y coordinate of cluster> <Reads>:<Not_Use>:<Not_Use>:Index1_i7+Index2_i5>`
