
import React, { useState } from "react";
import { Upload, FileDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RequirementDefinition, generateDefaultRequirements } from "@/utils/fileChecker";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RequirementsUploaderProps {
  onRequirementsLoaded: (requirements: RequirementDefinition[]) => void;
}

export const RequirementsUploader: React.FC<RequirementsUploaderProps> = ({ 
  onRequirementsLoaded 
}) => {
  const [requirements, setRequirements] = useState<RequirementDefinition[]>(generateDefaultRequirements());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
          setRequirements(loadedRequirements);
          onRequirementsLoaded(loadedRequirements);
          
          toast({
            title: "Requirements loaded",
            description: `Loaded ${loadedRequirements.length} requirements from file`,
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
    a.download = "html-requirements.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Requirements downloaded",
      description: "Your requirements have been saved to a JSON file",
    });
  };

  const useDefaultRequirements = () => {
    const defaultReqs = generateDefaultRequirements();
    setRequirements(defaultReqs);
    onRequirementsLoaded(defaultReqs);
    
    toast({
      title: "Default requirements loaded",
      description: `Loaded ${defaultReqs.length} default HTML requirements`,
    });
  };

  const viewRequirements = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">HTML Requirements</h2>
        <div className="flex gap-2">
          <label htmlFor="requirements-upload">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <div>
                <Upload size={16} />
                Import
                <input
                  id="requirements-upload"
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
        Upload a JSON file with your custom HTML grading requirements, or use our default HTML checks.
      </p>
      
      <div className="text-sm">
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-blue-50 p-2 rounded text-center">
            <p className="font-medium text-education">
              {requirements.length}
            </p>
            <p className="text-xs text-gray-600">Requirements</p>
          </div>
          <div className="bg-blue-50 p-2 rounded text-center">
            <p className="font-medium text-education">
              {requirements.reduce((sum, req) => sum + req.points, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Points</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={useDefaultRequirements}
          className="w-full"
        >
          Use Default Requirements
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>HTML Requirements</DialogTitle>
            <DialogDescription>
              View and manage the requirements used to check HTML files
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-auto py-4">
            <div className="border rounded-lg mb-4">
              <div className="grid grid-cols-12 bg-gray-100 p-3 rounded-t-lg font-medium text-sm">
                <div className="col-span-4">Name</div>
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Points</div>
                <div className="col-span-1"></div>
              </div>
              
              <ScrollArea className="max-h-[40vh]">
                {requirements.map((req, index) => (
                  <div 
                    key={index} 
                    className={`
                      grid grid-cols-12 p-3 items-center text-sm border-t
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    `}
                  >
                    <div className="col-span-4 truncate" title={req.name}>
                      {req.name}
                    </div>
                    <div className="col-span-5 text-gray-600 truncate" title={req.description}>
                      {req.description}
                    </div>
                    <div className="col-span-2 text-center font-medium">
                      {req.points}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Trash2 size={14} className="text-gray-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          
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
