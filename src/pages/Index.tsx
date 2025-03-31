
import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { ResultsDisplay, FileCheckResult } from "@/components/ResultsDisplay";
import { 
  checkMSSVComment, 
  readFileContent, 
  checkRequirements, 
  RequirementDefinition, 
  generateDefaultRequirements 
} from "@/utils/fileChecker";
import { RequirementsUploader } from "@/components/RequirementsUploader";
import Header from "@/components/Header";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const [results, setResults] = useState<FileCheckResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requirements, setRequirements] = useState<RequirementDefinition[]>(generateDefaultRequirements());
  const { toast } = useToast();

  const handleFilesUploaded = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const newResults: FileCheckResult[] = [];
      
      for (const file of files) {
        try {
          const content = await readFileContent(file);
          const mssvCheck = checkMSSVComment(content);
          
          // Check requirements only if MSSV is present
          const requirementsCheck = mssvCheck.hasMSSV 
            ? checkRequirements(content, requirements)
            : undefined;
          
          newResults.push({
            fileName: file.name,
            content: content,
            hasMSSV: mssvCheck.hasMSSV,
            mssvValue: mssvCheck.mssvValue,
            requirements: requirementsCheck
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast({
            title: "Error processing file",
            description: `Could not read ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      }
      
      setResults(prevResults => [...prevResults, ...newResults]);
      
      const passedMSSV = newResults.filter(r => r.hasMSSV).length;
      const passedReqs = newResults.filter(r => r.requirements && r.requirements.percentage >= 60).length;
      
      toast({
        title: "Files processed successfully",
        description: `${newResults.length} files checked: ${passedMSSV} with MSSV, ${passedReqs} met requirements`,
        variant: passedMSSV === newResults.length ? "default" : "destructive",
      });
      
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: "Something went wrong while processing the files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequirementsLoaded = (newRequirements: RequirementDefinition[]) => {
    setRequirements(newRequirements);
    
    // Re-check existing results if there are any
    if (results.length > 0) {
      const updatedResults = results.map(result => {
        // Only update if the file has MSSV
        if (result.hasMSSV) {
          return {
            ...result,
            requirements: checkRequirements(result.content, newRequirements)
          };
        }
        return result;
      });
      
      setResults(updatedResults);
    }
  };

  const clearResults = () => {
    setResults([]);
    toast({
      title: "Results cleared",
      description: "All check results have been cleared.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>HTML File Grading Tool</AlertTitle>
            <AlertDescription>
              Files need an MSSV comment <code className="bg-gray-100 px-1 py-0.5 rounded text-education">{"<!-- MSSV: XXXXXX -->"}</code> at the beginning and must meet HTML requirements to earn points.
            </AlertDescription>
          </Alert>
          
          <RequirementsUploader onRequirementsLoaded={handleRequirementsLoaded} />
          
          <FileUploader 
            onFilesUploaded={handleFilesUploaded} 
            isProcessing={isProcessing}
          />
          
          {isProcessing && (
            <div className="text-center mt-4">
              <div className="inline-block animate-bounce-light">
                <div className="h-10 w-10 bg-education rounded-full flex items-center justify-center mx-auto">
                  <div className="h-5 w-5 bg-white rounded-full"></div>
                </div>
              </div>
              <p className="text-gray-600 mt-2">Processing files...</p>
            </div>
          )}
          
          {results.length > 0 && (
            <ResultsDisplay 
              results={results} 
              onClear={clearResults} 
              requirements={requirements}
            />
          )}
          
          {results.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Grading Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h4 className="font-medium">Valid Files</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Files with MSSV comment that meet at least 60% of requirements will pass.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-medium">Invalid Files</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Files without MSSV comment or with fewer than 60% of requirements will fail.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          HTML Grading Tool &copy; {new Date().getFullYear()}
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Index;
