
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
