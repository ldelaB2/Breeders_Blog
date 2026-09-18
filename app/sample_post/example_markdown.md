# Notes on Genomic Selection Accuracy

Genomic selection accuracy depends heavily on the size and relatedness of the training population used to build the prediction model. A `.md` file like this one is just plain text - no special software or YAML header required, just headings, emphasis, lists, and links like you'd use anywhere else.

## Key Observations

- Accuracy improves quickly as the training population grows from very small (n < 200) to moderate (n ~ 1000), then levels off.
- Close relatedness between the training and validation sets can inflate *apparent* accuracy without actually improving real-world prediction.
- Trait heritability sets a practical ceiling - low-heritability traits (many disease-resistance scores, for example) rarely exceed an accuracy of about 0.4-0.5, no matter how large the training population gets.

## Why This Matters

A breeding program that understands where its prediction accuracy plateaus can stop over-investing in genotyping more individuals and instead put that budget toward phenotyping, new traits, or expanding into new environments.

| Training population size | Typical accuracy (moderate heritability trait) |
| --- | --- |
| 200  | 0.35-0.45 |
| 1000 | 0.55-0.65 |
| 5000 | 0.65-0.70 |

## Further Reading

If you want to go deeper on the statistics behind this, [Meuwissen, Hayes, and Goddard (2001)](https://doi.org/10.1093/genetics/157.4.1819) is the original paper that introduced genomic selection.
