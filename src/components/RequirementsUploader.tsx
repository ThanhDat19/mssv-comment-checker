
import React, { useState } from "react";
import { Upload, FileDown, Plus, Trash2, Palette, Code, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RequirementDefinition, generateDefaultRequirements, generateCssRequirements } from "@/utils/fileChecker";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import stylingRequirementsExample from "../data/styling-requirements-example.json";
import htmlRequirementsExample from "../data/html-requirements-example.json";
import cssRequirementsExample from "../data/css-requirements-example.json";

interface RequirementsUploaderProps {
  onRequirementsLoaded: (requirements: RequirementDefinition[]) => void;
  fileType?: "html" | "css";
  title?: string;
}

export const RequirementsUploader: React.FC<RequirementsUploaderProps> = ({ 
  onRequirementsLoaded,
  fileType = "html",
  title = "Requirements Checker" 
}) => {
  const [requirements, setRequirements] = useState<RequirementDefinition[]>(
    fileType === "css" ? generateCssRequirements() : generateDefaultRequirements()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const { toast } = useToast();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        try {
          const loadedRequirements = JSON.parse(event.target.result);
          
          // Filter for the current file type if specified
          const filteredRequirements = fileType 
            ? loadedRequirements.filter((req: RequirementDefinition) => 
                !req.type || req.type === fileType
              )
            : loadedRequirements;
          
          setRequirements(filteredRequirements);
          onRequirementsLoaded(filteredRequirements);
          
          toast({
            title: "Requirements loaded",
            description: `Loaded ${filteredRequirements.length} ${fileType} requirements from file`,
          });
        } catch (error) {
          console.error("Error parsing requirements file:", error);
          toast({
            title: "Invalid file format",
            description: "The requirements file is not in valid JSON format",
            variant: "destructive",
          });
        }
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Failed to read the requirements file",
        variant: "destructive",
      });
    };
    
    reader.readAsText(file);
    
    // Reset the input value so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const downloadCurrentRequirements = () => {
    // Prepare requirements for download (convert functions to strings)
    const downloadReqs = requirements.map(req => ({
      ...req,
      checkFn: req.checkFn.toString()
    }));
    
    const blob = new Blob([JSON.stringify(downloadReqs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileType}-requirements.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Requirements downloaded",
      description: `Your ${fileType} requirements have been saved to a JSON file`,
    });
  };

  const useDefaultRequirements = () => {
    const defaultReqs = fileType === "css" 
      ? generateCssRequirements() 
      : generateDefaultRequirements();
    
    setRequirements(defaultReqs);
    onRequirementsLoaded(defaultReqs);
    
    toast({
      title: "Default requirements loaded",
      description: `Loaded ${defaultReqs.length} default ${fileType.toUpperCase()} requirements`,
    });
  };

  const viewRequirements = () => {
    setIsDialogOpen(true);
    setSelectedTab("all");
  };

  const downloadExampleFile = (type: string) => {
    let exampleData;
    let fileName;
    
    switch (type) {
      case "styling":
        exampleData = stylingRequirementsExample;
        fileName = "styling-requirements-example.json";
        break;
      case "html":
        exampleData = htmlRequirementsExample;
        fileName = "html-requirements-example.json";
        break;
      case "css":
        exampleData = cssRequirementsExample;
        fileName = "css-requirements-example.json";
        break;
      default:
        exampleData = fileType === "css" ? cssRequirementsExample : htmlRequirementsExample;
        fileName = `${fileType}-requirements-example.json`;
    }
    
    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} requirements downloaded`,
      description: `Example requirements for checking ${type} elements`,
    });
  };

  const getRequirementsByType = (type: string) => {
    if (type === "all") return requirements;
    return requirements.filter(req => req.type === type);
  };

  const useExampleRequirements = (type: string) => {
    let newRequirements;
    
    switch (type) {
      case "styling":
        newRequirements = stylingRequirementsExample;
        break;
      case "html":
        newRequirements = htmlRequirementsExample;
        break;
      case "css":
        newRequirements = cssRequirementsExample;
        break;
      default:
        newRequirements = requirements;
    }
    
    // Filter for the current file type if specified
    if (fileType) {
      newRequirements = newRequirements.filter((req: RequirementDefinition) => 
        !req.type || req.type === fileType
      );
    }
    
    // Convert string functions to actual functions
    const processedRequirements = newRequirements.map((req: any) => {
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

    setRequirements(processedRequirements);
    onRequirementsLoaded(processedRequirements);
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} requirements loaded`,
      description: `Loaded ${processedRequirements.length} ${type} requirements`,
    });
  };

  const getFileTypeIcon = () => {
    return fileType === "css" ? <Code size={20} className="text-purple-600" /> : <FileText size={20} className="text-blue-600" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-6 ${fileType === "css" ? "border-l-4 border-purple-400" : "border-l-4 border-blue-400"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getFileTypeIcon()}
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <div className="flex gap-2">
          <label htmlFor={`requirements-upload-${fileType}`}>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <div>
                <Upload size={16} />
                Import
                <input
                  id={`requirements-upload-${fileType}`}
                  type="file"
                  accept=".json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </Button>
          </label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadCurrentRequirements}
            className="gap-2"
          >
            <FileDown size={16} />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={viewRequirements}
            className="gap-2"
          >
            View ({requirements.length})
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Upload a JSON file with your custom {fileType.toUpperCase()} requirements for checking files, or use our predefined templates.
      </p>
      
      <div className="text-sm">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className={`${fileType === "css" ? "bg-purple-50" : "bg-blue-50"} p-2 rounded text-center`}>
            <p className="font-medium text-education">
              {requirements.length}
            </p>
            <p className="text-xs text-gray-600">Requirements</p>
          </div>
          <div className={`${fileType === "css" ? "bg-purple-50" : "bg-blue-50"} p-2 rounded text-center`}>
            <p className="font-medium text-education">
              {requirements.reduce((sum, req) => sum + req.points, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Points</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={useDefaultRequirements}
            className="w-full"
          >
            Use Default {fileType.toUpperCase()} Requirements
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadExampleFile(fileType)}
            className="text-xs"
          >
            Download {fileType.toUpperCase()} Example
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{fileType.toUpperCase()} Requirements</DialogTitle>
            <DialogDescription>
              View and manage the requirements used to check {fileType} files
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-1 mb-4">
              <TabsTrigger value="all">All Requirements ({requirements.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTab} className="flex-1 min-h-0 overflow-hidden">
              <div className="border rounded-lg mb-4 h-full">
                <div className="grid grid-cols-12 bg-gray-100 p-3 rounded-t-lg font-medium text-sm">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-center">Type</div>
                  <div className="col-span-1 text-center">Points</div>
                  <div className="col-span-1"></div>
                </div>
                
                <ScrollArea className="h-[40vh]">
                  {getRequirementsByType(selectedTab).map((req, index) => (
                    <div 
                      key={index} 
                      className={`
                        grid grid-cols-12 p-3 items-center text-sm border-t
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      `}
                    >
                      <div className="col-span-3 truncate" title={req.name}>
                        {req.name}
                      </div>
                      <div className="col-span-5 text-gray-600 truncate" title={req.description}>
                        {req.description}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          req.type === 'html' ? 'bg-blue-100 text-blue-800' : 
                          req.type === 'css' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {req.type || 'unknown'}
                        </span>
                      </div>
                      <div className="col-span-1 text-center font-medium">
                        {req.points}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Trash2 size={14} className="text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {getRequirementsByType(selectedTab).length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      No {selectedTab} requirements found
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
