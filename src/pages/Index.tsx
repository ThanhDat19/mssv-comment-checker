
import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { ResultsDisplay, FileCheckResult } from "@/components/ResultsDisplay";
import { checkMSSVComment, readFileContent } from "@/utils/fileChecker";
import Header from "@/components/Header";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const [results, setResults] = useState<FileCheckResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
          
          newResults.push({
            fileName: file.name,
            content: content,
            hasMSSV: mssvCheck.hasMSSV,
            mssvValue: mssvCheck.mssvValue
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
      
      const passCount = newResults.filter(r => r.hasMSSV).length;
      const failCount = newResults.length - passCount;
      
      toast({
        title: "Files processed successfully",
        description: `${newResults.length} files checked: ${passCount} passed, ${failCount} failed`,
        variant: passCount === newResults.length ? "default" : "destructive",
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
            <AlertTitle>MSSV Comment Format</AlertTitle>
            <AlertDescription>
              HTML files should include <code className="bg-gray-100 px-1 py-0.5 rounded text-education">{"<!-- MSSV: XXXXXX -->"}</code> at the beginning of the file. Files without this comment will be marked as failed.
            </AlertDescription>
          </Alert>
          
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
            <ResultsDisplay results={results} onClear={clearResults} />
          )}
          
          {results.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h4 className="font-medium">Valid Files</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Files with proper MSSV comment at the beginning will receive full credit.
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
                        Files without the required MSSV comment will receive zero points.
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
          MSSV Comment Checker Tool &copy; {new Date().getFullYear()}
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Index;
