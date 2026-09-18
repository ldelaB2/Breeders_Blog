<!--
BREEDERS BLOG .md TEMPLATE
===========================
A plain Markdown post: prose, headings, lists, tables, links, images, and
equations - but no runnable code. If you want code chunks, start from one of
the .qmd or .Rmd templates instead.

Before you start
- Nothing to install. Write in any text editor (VS Code, Obsidian, Notepad...).
- Syntax reference:  https://www.markdownguide.org/basic-syntax/
- Quarto's version:  https://quarto.org/docs/authoring/markdown-basics.html
- The moderator renders your file with Quarto, so LaTeX math works here too.
- Optional: preview it yourself with `quarto render my_post.md`.

Delete these comment blocks before submitting - anything between <!-- and -->
is invisible to readers but clutters the file.
-->

# Your Title Goes Here

<!-- One or two paragraphs: what question are you looking at, and why does it
matter? Readers decide whether to keep going right here. -->

Open with the problem. For example: genomic selection accuracy depends heavily
on the size and relatedness of the training population, but most programs
never measure where their own accuracy plateaus.

## Background

<!-- Optional. Enough context that a reader from another discipline can follow.
Use *italics* for emphasis, **bold** for key terms, and `code` for names of
software, packages, or variables. -->

Introduce any terms you rely on. **Genomic estimated breeding values** (GEBVs)
are predictions made from a plant's *markers* rather than its measured
performance.

### Equations

<!-- Inline math goes between single dollar signs; a display equation on its
own line goes between double dollar signs. Standard LaTeX math syntax:
https://www.overleaf.com/learn/latex/Mathematical_expressions -->

Narrow-sense heritability is $h^2 = \sigma_A^2 / \sigma_P^2$, and the
breeder's equation predicts the response to selection as

$$
R = i \, h^2 \, \sigma_P
$$

where $i$ is the selection intensity.

## Main Argument

<!-- Split the body into ## sections; each one becomes a table-of-contents
entry. Lists and tables are often clearer than paragraphs. -->

Key observations:

- Accuracy improves quickly as the training population grows from small
  (n < 200) to moderate (n ~ 1000), then levels off.
- Close relatedness between training and validation sets can inflate
  *apparent* accuracy without improving real-world prediction.
- Trait heritability sets a practical ceiling.

| Training population size | Typical accuracy (moderate $h^2$) |
| --- | --- |
| 200  | 0.35-0.45 |
| 1000 | 0.55-0.65 |
| 5000 | 0.65-0.70 |

<!-- Images: put them in an images/ folder next to this file, reference them by
relative path, and upload everything together as a single .zip.
Compress large photos first (see the About page for an ffmpeg one-liner). -->

![Caption describing the figure.](images/my_figure.png)

## Takeaways

<!-- Two to four sentences. What should the reader do or think differently? -->

Summarize the point. What would you tell a colleague in the hallway?

## References

<!-- Link papers by DOI. A short "further reading" list is more useful than an
exhaustive bibliography. -->

- Meuwissen, T. H. E., Hayes, B. J., & Goddard, M. E. (2001). Prediction of
  total genetic value using genome-wide dense marker maps. *Genetics*, 157(4),
  1819-1829. <https://doi.org/10.1093/genetics/157.4.1819>
