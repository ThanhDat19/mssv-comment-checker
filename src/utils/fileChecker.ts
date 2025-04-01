import {
  hasColor,
  hasFontFamily,
  hasFontSize,
  hasFontStyle,
  hasLayoutElement,
  hasCustomClasses,
  hasImagesWithAlt
} from './htmlStyleChecker';

export const checkMSSVComment = (content: string, fileType?: 'html' | 'css'): { hasMSSV: boolean; mssvValue?: string } => {
  // For CSS files, look for /* MSSV: XXXXXX */
  if (fileType === 'css') {
    const cssMssvRegex = /^\s*\/\*\s*MSSV:?\s*([A-Za-z0-9]+)\s*\*\//;
    const cssMatch = content.match(cssMssvRegex);
    
    if (cssMatch && cssMatch[1]) {
      return {
        hasMSSV: true,
        mssvValue: cssMatch[1].trim()
      };
    }
  } 
  // For HTML files or unspecified type, look for <!-- MSSV: XXXXXX -->
  else {
    const htmlMssvRegex = /^\s*<!--\s*MSSV:?\s*([A-Za-z0-9]+)\s*-->/;
    const htmlMatch = content.match(htmlMssvRegex);
    
    if (htmlMatch && htmlMatch[1]) {
      return {
        hasMSSV: true,
        mssvValue: htmlMatch[1].trim()
      };
    }
  }
  
  return { hasMSSV: false };
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error("Failed to read file content"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
};

export interface RequirementDefinition {
  id: string;
  name: string;
  description: string;
  type?: string; // 'html', 'css', or undefined
  checkFn: (content: string) => boolean;
  points: number;
}

export const readRequirementsFile = (file: File): Promise<RequirementDefinition[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        try {
          const requirements = JSON.parse(event.target.result) as RequirementDefinition[];
          
          // Convert string functions to actual functions
          const processedRequirements = requirements.map(req => {
            if (typeof req.checkFn === 'string') {
              try {
                // eslint-disable-next-line no-new-func
                req.checkFn = new Function('content', `return ${req.checkFn}`)(null);
              } catch (err) {
                console.error(`Error parsing function for requirement ${req.id}:`, err);
                // Provide a default function that returns false
                req.checkFn = () => false;
              }
            }
            
            // Ensure type field exists
            if (!req.type) {
              // Try to infer type from id or name
              const lowerName = (req.name || '').toLowerCase();
              const lowerId = (req.id || '').toLowerCase();
              
              if (lowerId.includes('html') || lowerName.includes('html') || 
                  lowerId.includes('tag') || lowerName.includes('tag') ||
                  lowerId.includes('element') || lowerName.includes('element')) {
                req.type = 'html';
              } else if (lowerId.includes('css') || lowerName.includes('css') ||
                        lowerId.includes('style') || lowerName.includes('style')) {
                req.type = 'css';
              } else {
                req.type = 'html'; // Default to HTML
              }
            }
            
            return req;
          });
          
          resolve(processedRequirements);
        } catch (err) {
          reject(new Error("Invalid requirements JSON format"));
        }
      } else {
        reject(new Error("Failed to read requirements file"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading requirements file"));
    };
    
    reader.readAsText(file);
  });
};

export const determineFileType = (fileName: string, content: string): 'html' | 'css' | undefined => {
  // First check by extension
  if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
    return 'html';
  }
  if (fileName.toLowerCase().endsWith('.css')) {
    return 'css';
  }
  
  // If extension check is inconclusive, try content analysis
  if (content.includes('<!DOCTYPE html>') || /<html.*?>.*?<\/html>/is.test(content)) {
    return 'html';
  }
  
  if (/[\w\s-]+\s*{\s*[\w\-]+\s*:\s*[\w\s-]+;/.test(content)) {
    return 'css';
  }
  
  return undefined; // Could not determine file type
};

export const checkRequirements = (
  content: string, 
  requirements: RequirementDefinition[], 
  fileType?: string
): {
  results: { requirementId: string; passed: boolean }[];
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
} => {
  // Filter requirements based on file type if specified
  const applicableRequirements = fileType 
    ? requirements.filter(req => !req.type || req.type === fileType)
    : requirements;
  
  const results = applicableRequirements.map(req => {
    try {
      const passed = req.checkFn(content);
      return { requirementId: req.id, passed };
    } catch (error) {
      console.error(`Error checking requirement ${req.id}:`, error);
      return { requirementId: req.id, passed: false };
    }
  });
  
  const totalPoints = applicableRequirements.reduce((sum, req) => sum + req.points, 0);
  const earnedPoints = results.reduce((sum, result) => {
    const req = applicableRequirements.find(r => r.id === result.requirementId);
    return sum + (result.passed && req ? req.points : 0);
  }, 0);
  
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  return { results, totalPoints, earnedPoints, percentage };
};

export const generateDefaultRequirements = (): RequirementDefinition[] => {
  return [
    {
      id: "req1",
      type: "html",
      name: "Contains DOCTYPE declaration",
      description: "HTML file must include the DOCTYPE declaration",
      checkFn: (content) => content.includes("<!DOCTYPE html>"),
      points: 10
    },
    {
      id: "req2",
      type: "html",
      name: "Contains <html> tag",
      description: "HTML file must have <html> tags",
      checkFn: (content) => /<html.*?>.*?<\/html>/is.test(content),
      points: 10
    },
    {
      id: "req3",
      type: "html",
      name: "Contains <head> section",
      description: "HTML file must include a <head> section",
      checkFn: (content) => /<head.*?>.*?<\/head>/is.test(content),
      points: 10
    },
    {
      id: "req4",
      type: "html",
      name: "Contains <title> element",
      description: "HTML file must have a title element",
      checkFn: (content) => /<title.*?>.*?<\/title>/is.test(content),
      points: 10
    },
    {
      id: "req5",
      type: "html",
      name: "Contains <body> section",
      description: "HTML file must include a <body> section",
      checkFn: (content) => /<body.*?>.*?<\/body>/is.test(content),
      points: 10
    },
    {
      id: "style1",
      type: "css",
      name: "Uses blue color",
      description: "HTML file should use blue color somewhere in the design",
      checkFn: (content) => hasColor(content, "blue"),
      points: 5
    },
    {
      id: "style2",
      type: "css",
      name: "Uses sans-serif font",
      description: "HTML file should use a sans-serif font family",
      checkFn: (content) => hasFontFamily(content, "sans-serif") || 
                           hasFontFamily(content, "Arial") || 
                           hasFontFamily(content, "Helvetica"),
      points: 5
    },
    {
      id: "style3",
      type: "html",
      name: "Uses heading styles",
      description: "HTML file should contain at least one heading (h1-h6)",
      checkFn: (content) => /<h[1-6].*?>.*?<\/h[1-6]>/is.test(content),
      points: 5
    },
    {
      id: "style4",
      type: "css",
      name: "Uses bold text",
      description: "HTML file should include bold text styling",
      checkFn: (content) => hasFontStyle(content, "bold"),
      points: 5
    },
    {
      id: "style5",
      type: "css",
      name: "Responsive design",
      description: "HTML file should include responsive design techniques",
      checkFn: (content) => hasLayoutElement(content, "responsive"),
      points: 10
    },
    {
      id: "style6",
      type: "css",
      name: "Uses flex or grid layout",
      description: "HTML file should use flexbox or grid for layout",
      checkFn: (content) => hasLayoutElement(content, "flex") || hasLayoutElement(content, "grid"),
      points: 10
    },
    {
      id: "style7",
      type: "html",
      name: "Custom CSS classes",
      description: "HTML file should have at least 3 custom CSS classes",
      checkFn: (content) => hasCustomClasses(content, 3),
      points: 10
    },
    {
      id: "style8",
      type: "html",
      name: "Images with alt text",
      description: "HTML file should include images with alt text for accessibility",
      checkFn: (content) => hasImagesWithAlt(content),
      points: 5
    }
  ];
};

export const generateCssRequirements = (): RequirementDefinition[] => {
  return [
    {
      id: "css1",
      type: "css",
      name: "Uses CSS variables",
      description: "CSS should use CSS variables (custom properties)",
      checkFn: (content) => /--[a-zA-Z0-9-_]+\s*:/.test(content),
      points: 10
    },
    {
      id: "css2",
      type: "css",
      name: "Uses flexbox layout",
      description: "CSS should use flexbox for layout",
      checkFn: (content) => /display\s*:\s*flex/.test(content),
      points: 10
    },
    {
      id: "css3",
      type: "css",
      name: "Uses grid layout",
      description: "CSS should use grid for layout",
      checkFn: (content) => /display\s*:\s*grid/.test(content),
      points: 10
    },
    {
      id: "css4",
      type: "css",
      name: "Uses media queries",
      description: "CSS should include media queries for responsive design",
      checkFn: (content) => /@media\s*\(/.test(content),
      points: 15
    },
    {
      id: "css5",
      type: "css",
      name: "Uses color variables",
      description: "CSS should use color variables or custom properties",
      checkFn: (content) => /--[a-zA-Z0-9-_]*color[a-zA-Z0-9-_]*\s*:/.test(content),
      points: 10
    },
    {
      id: "css6",
      type: "css",
      name: "Uses transitions",
      description: "CSS should include transitions for animations",
      checkFn: (content) => /transition\s*:/.test(content),
      points: 5
    },
    {
      id: "css7",
      type: "css",
      name: "Uses pseudo-elements",
      description: "CSS should use ::before or ::after pseudo-elements",
      checkFn: (content) => /::?(before|after)/.test(content),
      points: 5
    },
    {
      id: "css8",
      type: "css",
      name: "Uses proper box-sizing",
      description: "CSS should set box-sizing: border-box",
      checkFn: (content) => /box-sizing\s*:\s*border-box/.test(content),
      points: 5
    },
    {
      id: "css9",
      type: "css",
      name: "Uses relative units",
      description: "CSS should use relative units like em, rem, %, vh, vw",
      checkFn: (content) => /(\d+)(em|rem|%|vh|vw)/.test(content),
      points: 10
    },
    {
      id: "css10",
      type: "css",
      name: "Uses proper CSS selectors",
      description: "CSS should use class selectors instead of just element selectors",
      checkFn: (content) => /\.[a-zA-Z][a-zA-Z0-9_-]*\s*{/.test(content),
      points: 10
    }
  ];
};
