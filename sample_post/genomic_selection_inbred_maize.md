# Genomic Selection in an Inbred Maize Population

## Overview

Inbred maize lines present a different genomic prediction problem than
outbred livestock or hybrid crop populations: individuals within a line are
nearly homozygous, relatedness structure is dominated by pedigree rather
than recent recombination, and the breeding objective is usually general
combining ability (GCA) for a future hybrid cross rather than the inbred
line's own phenotype. This post walks through a small genomic selection
exercise run on a single biparental inbred population, evaluated for
grain yield and days-to-silking.

## Population and Data

- **Population**: 220 recombinant inbred lines (RILs) derived from a
  single biparental cross, advanced to F6 by single-seed descent.
- **Genotyping**: ~4,800 polymorphic SNP markers after filtering for
  minor allele frequency (MAF > 0.05) and missingness (< 10%).
- **Phenotypes**: grain yield (bu/ac) and days-to-silking, each recorded
  across two locations and two years.
- **Training/validation split**: 5-fold cross-validation, repeated 20
  times to smooth out fold-assignment noise on a population this small.

## Model

A standard GBLUP model was fit using a genomic relationship matrix built
from the SNP marker matrix (VanRaden method 1):

```
y = Xb + Zg + e,  g ~ N(0, G * sigma_g^2)
```

where `G` is the realized genomic relationship matrix, `b` captures
location/year fixed effects, and `g` is the vector of genomic breeding
values for grain yield or days-to-silking. Because the population is an
inbred RIL panel rather than an outbred one, `G` was computed treating
each line as fully homozygous at every scored marker, which noticeably
sharpens the relationship matrix compared to treating raw heterozygous
calls as missing data.

## Results

- **Grain yield**: prediction accuracy (correlation between GEBV and
  cross-validated phenotype) averaged 0.52 across folds, consistent with
  the trait's typically moderate heritability and polygenic architecture.
- **Days-to-silking**: prediction accuracy averaged 0.71, reflecting the
  trait's higher heritability and the presence of a few large-effect QTL
  segregating in this cross.
- Restricting the marker set to the top 500 markers by GWAS p-value for
  days-to-silking modestly improved accuracy for that trait, but the same
  approach *hurt* accuracy for grain yield, where signal is spread thinly
  across many small-effect loci rather than concentrated at a handful of
  markers.

## Takeaways

Genomic selection within a single inbred population behaves differently
from genomic selection across a diverse breeding program: relatedness is
higher and less variable, so accuracy is driven less by "how related is
the validation set to training" and more by trait architecture itself. For
a trait like days-to-silking with a few strong QTL, a lighter, curated
marker set can help. For a highly polygenic trait like grain yield, the
full marker set - and likely a larger training population than 220 lines -
remains the safer default.
