import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Show, UserButton } from "@clerk/react";
import Brand from "./Brand";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import AuthButtons from "./AuthButtons";
import IconButton from "@/components/ui/IconButton";
import Tooltip from "@/components/ui/Tooltip";
import SearchModal from "@/components/search/SearchModal";
import { navRoutes } from "@/config/routes";
import { useCurrentUser } from "@/lib/auth/currentUser";
import { postPath } from "@/lib/seo/seo";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { hasRole } = useCurrentUser();
  const navigate = useNavigate();
  const links = navRoutes(hasRole);

  function handleSelectSearchResult(post) {
    setSearchOpen(false);
    navigate(postPath(post));
  }

  return (
    <>
      <header className="relative flex flex-col items-center bg-canvas px-6 py-4">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 pb-4">
          {/* Left: hamburger on mobile */}
          <div className="flex items-center">
            <IconButton
              icon={menuOpen ? "close" : "menu"}
              label="Toggle navigation menu"
              aria-expanded={menuOpen}
              size="lg"
              tone={null}
              className="inline-flex items-center justify-center text-gray-700 hover:bg-gray-100 sm:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
            />
          </div>

          <Brand />

          {/* Search + auth */}
          <div className="flex items-center justify-end gap-4 sm:gap-6">
            <Tooltip label="Search">
              <IconButton
                icon="search"
                label="Search"
                size="lg"
                tone={null}
                className="text-gray-700 hover:bg-gray-200 sm:p-2.5"
                iconClassName="h-6 w-6 sm:h-7 sm:w-7"
                onClick={() => setSearchOpen(true)}
              />
            </Tooltip>

            <AuthButtons variant="desktop" />

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>

        <div className="w-full border-t border-canvas-border" />
        <DesktopNav links={links} />
        <div className="hidden w-full border-t border-canvas-border sm:block" />

        {menuOpen && <MobileMenu links={links} onClose={() => setMenuOpen(false)} />}
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} onSelectPost={handleSelectSearchResult} />}
    </>
  );
}

export default Header;
