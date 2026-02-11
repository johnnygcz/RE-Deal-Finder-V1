import { useState } from 'react';
import { openPropertyInNewTab } from '../utils/openInNewTab';

export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleCardClick = (e, property, onSelect) => {
    if (contextMenu) {
      closeContextMenu();
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      openPropertyInNewTab(property);
      return;
    }
    onSelect && onSelect();
  };

  return { contextMenu, handleContextMenu, closeContextMenu, handleCardClick };
}
