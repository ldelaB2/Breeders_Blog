import ExternalLink from "@/components/ui/ExternalLink";
import Page from "@/components/ui/Page";
import { AUTHOR, CONTACT_EMAIL, GITHUB_URL, HEADSHOT, LINKEDIN_URL, YOUTUBE_URL } from "@/config/site";
import { useSeo } from "@/lib/seo/useSeo";

function Contact() {
  useSeo({
    title: "Contact",
    description:
      "About Will de la Bretonne — plant breeding, data science, and how to get in touch with Breeders Blog.",
    path: "/contact",
  });

  return (
    <Page title="Contact">
      <div className="space-y-4 text-gray-700">
        <p>
          Hi, I'm Will de la Bretonne. I'm just a guy passionate about science,
          plants, and learning new things.
        </p>

        {/* Headshot: floats beside the text on desktop, full width on mobile. */}
        <img
          src={HEADSHOT}
          alt={AUTHOR}
          className="mx-auto w-48 rounded-lg object-cover sm:float-right sm:ml-6 sm:mb-4 sm:w-56"
        />

        <p>
          I have a B.S. in Chemistry from Louisiana State University and an M.S.
          in Plant Breeding and Plant Genetics from the University of
          Wisconsin–Madison.
        </p>
        <p>
          My work sits at the intersection of plant breeding, data science, and
          agriculture. I've spent much of my career working directly with
          crops—spending summers as a consulting crop scout in sugarcane and
          working as a research assistant with applied breeding programs in
          rice, corn, beet, and potato. During graduate school, I shifted toward
          the data science side of plant breeding, developing algorithms for
          processing drone imagery.
        </p>
        <p>
          Along the way, I had the opportunity to intern with Syngenta, where I
          worked on machine learning and genomic selection pipelines. Today, I
          work at PepsiCo as a Breeding Data Curator, supporting data management
          and breeding research across the Frito-Lay and Quaker Oats breeding
          programs.
        </p>
        <p>
          For my most up-to-date CV and résumé, visit my{" "}
          <ExternalLink href={LINKEDIN_URL}>LinkedIn profile</ExternalLink>. You can
          also find my projects on <ExternalLink href={GITHUB_URL}>GitHub</ExternalLink>{" "}
          and videos on <ExternalLink href={YOUTUBE_URL}>YouTube</ExternalLink>.
        </p>
        <p className="clear-both">
          If you have a question, a suggestion for the site, or just want to
          connect, feel free to reach out at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </Page>
  );
}

export default Contact;
