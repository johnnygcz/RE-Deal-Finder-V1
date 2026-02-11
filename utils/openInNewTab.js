/**
 * Utility to open a property in a new tab with proper naming
 * @param {Object} property - Property object containing name/address
 * @param {string} baseUrl - Base URL (defaults to current origin)
 */
export function openPropertyInNewTab(property, baseUrl = window.location.origin) {
  try {
    if (!property || !property.name) {
      console.error('Property must have a name/address');
      return;
    }

    // Extract address from property name
    const address = property.name.split(',')[0] || property.name;
    
    // Create a window name based on the address (valid URL-safe)
    const windowName = `property_${address.replace(/\s+/g, '_').substring(0, 50)}`;
    
    // Construct property URL with ID parameter
    const url = `${baseUrl}/?propertyId=${encodeURIComponent(property.id)}`;
    
    console.log('🔗 Opening property in new tab:', {
      address,
      id: property.id,
      windowName
    });
    
    // Open in new tab - browser will handle tab naming via document.title
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to open property in new tab:', error);
  }
}

/**
 * Handle Ctrl/Cmd+click to open in new tab
 * @param {Event} event - The click event
 * @param {Function} normalClickHandler - Handler for normal clicks
 * @param {Object} property - Property object
 */
export function handlePropertyClick(event, normalClickHandler, property) {
  const isModifiedClick = event.ctrlKey || event.metaKey;

  if (isModifiedClick && property) {
    event.preventDefault();
    openPropertyInNewTab(property);
  } else {
    normalClickHandler?.();
  }
}
