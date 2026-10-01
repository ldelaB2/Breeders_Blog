import Dropdown from "@/components/ui/Dropdown";
import ShareProviderButton, { ShareTile } from "./ShareProviderButton";

// The share modal's 5th slot: a "more" trigger that reveals whichever
// providers don't fit in the main row. Pure UI chrome, not a provider, so
// it's never listed in lib/share/providers.jsx.
function MoreShareMenu({ providers, post, origin, showToast }) {
  return (
    <Dropdown
      align="right"
      panelClassName="w-40"
      panelProps={{ role: "menu" }}
      renderTrigger={({ open, toggle }) => (
        <ShareTile
          icon="more"
          label="More"
          onClick={toggle}
          aria-label="More share options"
          aria-haspopup="menu"
          aria-expanded={open}
        />
      )}
    >
      {(close) =>
        providers.map((provider) => (
          <ShareProviderButton
            key={provider.id}
            provider={provider}
            post={post}
            origin={origin}
            showToast={showToast}
            variant="row"
            onAfterActivate={close}
          />
        ))
      }
    </Dropdown>
  );
}

export default MoreShareMenu;
