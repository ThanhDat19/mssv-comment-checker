import {
  hasColor,
  hasFontFamily,
  hasFontSize,
  hasFontStyle,
  hasLayoutElement,
  hasCustomClasses,
  hasImagesWithAlt
} from './htmlStyleChecker';

export const checkMSSVComment = (content: string): { hasMSSV: boolean; mssvValue?: string } => {
  // Look for MSSV comment at the beginning of the file
  // The pattern will match: <!-- MSSV: XXXXXX --> or <!-- MSSV:XXXXXX -->
  const mssvRegex = /^\s*<!--\s*MSSV:?\s*([A-Za-z0-9]+)\s*-->/;
  const match = content.match(mssvRegex);
  
  if (match && match[1]) {
    return {
      hasMSSV: true,
      mssvValue: match[1].trim()
    };
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

export const checkRequirements = (content: string, requirements: RequirementDefinition[]): {
  results: { requirementId: string; passed: boolean }[];
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
} => {
  const results = requirements.map(req => {
    try {
      const passed = req.checkFn(content);
      return { requirementId: req.id, passed };
    } catch (error) {
      console.error(`Error checking requirement ${req.id}:`, error);
      return { requirementId: req.id, passed: false };
    }
  });
  
  const totalPoints = requirements.reduce((sum, req) => sum + req.points, 0);
  const earnedPoints = results.reduce((sum, result) => {
    const req = requirements.find(r => r.id === result.requirementId);
    return sum + (result.passed && req ? req.points : 0);
  }, 0);
  
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  return { results, totalPoints, earnedPoints, percentage };
};

export const generateDefaultRequirements = (): RequirementDefinition[] => {
  return [
    {
      id: "req1",
      name: "Contains DOCTYPE declaration",
      description: "HTML file must include the DOCTYPE declaration",
      checkFn: (content) => content.includes("<!DOCTYPE html>"),
      points: 10
    },
    {
      id: "req2",
      name: "Contains <html> tag",
      description: "HTML file must have <html> tags",
      checkFn: (content) => /<html.*?>.*?<\/html>/is.test(content),
      points: 10
    },
    {
      id: "req3",
      name: "Contains <head> section",
      description: "HTML file must include a <head> section",
      checkFn: (content) => /<head.*?>.*?<\/head>/is.test(content),
      points: 10
    },
    {
      id: "req4",
      name: "Contains <title> element",
      description: "HTML file must have a title element",
      checkFn: (content) => /<title.*?>.*?<\/title>/is.test(content),
      points: 10
    },
    {
      id: "req5",
      name: "Contains <body> section",
      description: "HTML file must include a <body> section",
      checkFn: (content) => /<body.*?>.*?<\/body>/is.test(content),
      points: 10
    },
    {
      id: "style1",
      name: "Uses blue color",
      description: "HTML file should use blue color somewhere in the design",
      checkFn: (content) => hasColor(content, "blue"),
      points: 5
    },
    {
      id: "style2",
      name: "Uses sans-serif font",
      description: "HTML file should use a sans-serif font family",
      checkFn: (content) => hasFontFamily(content, "sans-serif") || 
                           hasFontFamily(content, "Arial") || 
                           hasFontFamily(content, "Helvetica"),
      points: 5
    },
    {
      id: "style3",
      name: "Uses heading styles",
      description: "HTML file should contain at least one heading (h1-h6)",
      checkFn: (content) => /<h[1-6].*?>.*?<\/h[1-6]>/is.test(content),
      points: 5
    },
    {
      id: "style4",
      name: "Uses bold text",
      description: "HTML file should include bold text styling",
      checkFn: (content) => hasFontStyle(content, "bold"),
      points: 5
    },
    {
      id: "style5",
      name: "Responsive design",
      description: "HTML file should include responsive design techniques",
      checkFn: (content) => hasLayoutElement(content, "responsive"),
      points: 10
    },
    {
      id: "style6",
      name: "Uses flex or grid layout",
      description: "HTML file should use flexbox or grid for layout",
      checkFn: (content) => hasLayoutElement(content, "flex") || hasLayoutElement(content, "grid"),
      points: 10
    },
    {
      id: "style7",
      name: "Custom CSS classes",
      description: "HTML file should have at least 3 custom CSS classes",
      checkFn: (content) => hasCustomClasses(content, 3),
      points: 10
    },
    {
      id: "style8",
      name: "Images with alt text",
      description: "HTML file should include images with alt text for accessibility",
      checkFn: (content) => hasImagesWithAlt(content),
      points: 5
    }
  ];
};
