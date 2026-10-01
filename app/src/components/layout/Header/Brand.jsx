import { Link } from "react-router-dom";
import { AUTHOR, LOGO, SITE_NAME } from "@/config/site";

// Logo + site name. On mobile the logo links home; on larger screens it
// opens the full-size logo image instead.
function Brand() {
  return (
    <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
      <Link to="/" className="shrink-0 sm:hidden" aria-label={`${SITE_NAME} home`}>
        <img src={LOGO} alt={`${SITE_NAME} logo`} className="h-10 w-10 rounded-full object-cover" />
      </Link>
      <a href={LOGO} target="_blank" rel="noopener noreferrer" className="hidden shrink-0 sm:inline-flex">
        <img src={LOGO} alt={`${SITE_NAME} logo`} className="rounded-full object-cover sm:h-16 sm:w-16 md:h-20 md:w-20" />
      </a>
      <div className="flex min-w-0 flex-col items-center sm:items-start">
        <span className="truncate text-sm font-semibold text-gray-900 sm:text-lg md:text-xl">{SITE_NAME}</span>
        <span className="hidden truncate text-sm text-gray-500 sm:block">{AUTHOR}</span>
      </div>
    </div>
  );
}

export default Brand;
