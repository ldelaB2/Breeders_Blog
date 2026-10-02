import Dropdown, { DropdownItem } from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import ShareTile from "./ShareTile";

// The share modal's 5th slot: a "more" tile that reveals whichever
// providers don't fit in the main row. Pure UI chrome, not a provider, so
// it's never listed in lib/share/providers.jsx.
function MoreShareMenu({ providers, onSelect }) {
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
          <DropdownItem
            key={provider.id}
            role="menuitem"
            onClick={() => {
              onSelect(provider);
              close();
            }}
          >
            <Icon name={provider.icon} className="h-5 w-5" />
            {provider.label}
          </DropdownItem>
        ))
      }
    </Dropdown>
  );
}

export default MoreShareMenu;
