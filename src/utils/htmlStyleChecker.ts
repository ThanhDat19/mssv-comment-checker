
/**
 * Utility functions to check HTML/CSS styling aspects
 */

/**
 * Checks if the content contains a specific color (hex, rgb, rgba, or named color)
 */
export const hasColor = (content: string, color: string): boolean => {
  // Normalize color input - removing spaces and converting to lowercase
  const normalizedColor = color.toLowerCase().replace(/\s+/g, '');
  const normalizedContent = content.toLowerCase();
  
  // Check for various color formats
  const patterns = [
    // Hex colors
    new RegExp(`#${normalizedColor}\\b`, 'i'),
    new RegExp(`#${normalizedColor};`, 'i'),
    // RGB and RGBA colors
    new RegExp(`rgb\\(${normalizedColor}\\)`, 'i'),
    new RegExp(`rgba\\(${normalizedColor}\\)`, 'i'),
    // Named color
    new RegExp(`color:\\s*${normalizedColor}\\b`, 'i'),
    new RegExp(`background-color:\\s*${normalizedColor}\\b`, 'i'),
    new RegExp(`background:\\s*${normalizedColor}\\b`, 'i'),
    // Named color in class
    new RegExp(`class="[^"]*\\b${normalizedColor}\\b[^"]*"`, 'i')
  ];
  
  return patterns.some(pattern => pattern.test(normalizedContent));
};

/**
 * Checks if the content uses a specific font family
 */
export const hasFontFamily = (content: string, fontFamily: string): boolean => {
  // Normalize font family name
  const normalizedFont = fontFamily.toLowerCase().replace(/['"]/g, '');
  const normalizedContent = content.toLowerCase();
  
  const patterns = [
    // In CSS
    new RegExp(`font-family:\\s*['"]?${normalizedFont}['"]?\\b`, 'i'),
    // In style attribute
    new RegExp(`style="[^"]*font-family:\\s*['"]?${normalizedFont}['"]?[^"]*"`, 'i'),
    // In CSS link
    new RegExp(`href="[^"]*${normalizedFont}[^"]*\\.css"`, 'i'),
    // Google Fonts import
    new RegExp(`googleapis\\.com/css[^"]*family=${normalizedFont}`, 'i')
  ];
  
  return patterns.some(pattern => pattern.test(normalizedContent));
};

/**
 * Checks if the content has specific font size
 */
export const hasFontSize = (content: string, fontSize: string): boolean => {
  // Normalize font size
  const normalizedFontSize = fontSize.toLowerCase().replace(/\s+/g, '');
  const normalizedContent = content.toLowerCase();
  
  const patterns = [
    // In CSS
    new RegExp(`font-size:\\s*${normalizedFontSize}\\b`, 'i'),
    // In style attribute
    new RegExp(`style="[^"]*font-size:\\s*${normalizedFontSize}[^"]*"`, 'i')
  ];
  
  return patterns.some(pattern => pattern.test(normalizedContent));
};

/**
 * Checks if the content has specific font weight or style
 */
export const hasFontStyle = (content: string, styleType: 'bold' | 'italic' | 'underline'): boolean => {
  const normalizedContent = content.toLowerCase();
  
  let patterns: RegExp[] = [];
  
  switch (styleType) {
    case 'bold':
      patterns = [
        // HTML tags
        /<b>[^<]+<\/b>/i,
        /<strong>[^<]+<\/strong>/i,
        // CSS properties
        /font-weight:\s*(bold|700|800|900)/i,
        /style="[^"]*font-weight:\s*(bold|700|800|900)[^"]*"/i
      ];
      break;
    case 'italic':
      patterns = [
        // HTML tags
        /<i>[^<]+<\/i>/i,
        /<em>[^<]+<\/em>/i,
        // CSS properties
        /font-style:\s*italic/i,
        /style="[^"]*font-style:\s*italic[^"]*"/i
      ];
      break;
    case 'underline':
      patterns = [
        // HTML tags
        /<u>[^<]+<\/u>/i,
        // CSS properties
        /text-decoration:\s*underline/i,
        /style="[^"]*text-decoration:\s*underline[^"]*"/i
      ];
      break;
  }
  
  return patterns.some(pattern => pattern.test(normalizedContent));
};

/**
 * Checks if the content has a specific layout element
 */
export const hasLayoutElement = (content: string, layout: 'flex' | 'grid' | 'table' | 'responsive'): boolean => {
  const normalizedContent = content.toLowerCase();
  
  let patterns: RegExp[] = [];
  
  switch (layout) {
    case 'flex':
      patterns = [
        /display:\s*flex/i,
        /style="[^"]*display:\s*flex[^"]*"/i,
        /class="[^"]*flex[^"]*"/i
      ];
      break;
    case 'grid':
      patterns = [
        /display:\s*grid/i,
        /style="[^"]*display:\s*grid[^"]*"/i,
        /class="[^"]*grid[^"]*"/i
      ];
      break;
    case 'table':
      patterns = [
        /<table[^>]*>/i,
        /display:\s*table/i,
        /style="[^"]*display:\s*table[^"]*"/i
      ];
      break;
    case 'responsive':
      patterns = [
        /@media\s*\(/i,
        /meta\s+name="viewport"/i,
        /class="[^"]*container[^"]*"/i,
        /class="[^"]*responsive[^"]*"/i,
        /class="[^"]*mobile[^"]*"/i
      ];
      break;
  }
  
  return patterns.some(pattern => pattern.test(normalizedContent));
};

/**
 * Checks if the content uses custom CSS classes
 */
export const hasCustomClasses = (content: string, minClassCount: number = 3): boolean => {
  const matches = content.match(/class="([^"]*)"/g) || [];
  
  // Extract all class names
  const allClasses: string[] = [];
  matches.forEach(match => {
    const classString = match.replace(/class="(.*)"/, '$1');
    const classes = classString.split(/\s+/).filter(c => c.trim().length > 0);
    allClasses.push(...classes);
  });
  
  // Count unique classes
  const uniqueClasses = new Set(allClasses);
  return uniqueClasses.size >= minClassCount;
};

/**
 * Checks if the content includes an image with alt text
 */
export const hasImagesWithAlt = (content: string): boolean => {
  const imgTags = content.match(/<img[^>]*>/g) || [];
  
  // Look for images with alt attribute
  return imgTags.some(tag => /alt="[^"]+"/i.test(tag));
};
