
import React, { useState } from "react";
import { CheckCircle, XCircle, FileText, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FileCheckResult {
  fileName: string;
  content: string;
  hasMSSV: boolean;
  mssvValue?: string;
}

interface ResultsDisplayProps {
  results: FileCheckResult[];
  onClear: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onClear }) => {
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  
  const passedFiles = results.filter((file) => file.hasMSSV);
  const failedFiles = results.filter((file) => !file.hasMSSV);
  
  const downloadReport = () => {
    const report = results.map((result) => {
      return `File: ${result.fileName}\nStatus: ${result.hasMSSV ? "PASSED ✓" : "FAILED ✗"}\n${result.hasMSSV ? `MSSV: ${result.mssvValue}` : "No MSSV comment found"}\n------------------------`;
    }).join("\n\n");
    
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mssv-check-report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredResults = () => {
    switch (selectedTab) {
      case "passed":
        return passedFiles;
      case "failed":
        return failedFiles;
      default:
        return results;
    }
  };

  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Check Results</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadReport}
            className="flex items-center gap-1"
          >
            <Download size={16} />
            Download Report
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClear}
            className="flex items-center gap-1"
          >
            <XCircle size={16} />
            Clear Results
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-2xl font-bold">{results.length}</p>
          <p className="text-sm text-gray-500">Total Files</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-success">{passedFiles.length}</p>
          <p className="text-sm text-gray-500">Files with MSSV</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-destructive">{failedFiles.length}</p>
          <p className="text-sm text-gray-500">Files without MSSV</p>
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">All Files ({results.length})</TabsTrigger>
          <TabsTrigger value="passed">Passed ({passedFiles.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedFiles.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-0">
          <div className="border rounded-lg">
            <div className="grid grid-cols-12 bg-gray-100 p-3 rounded-t-lg font-medium text-sm">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6">File Name</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            
            <ScrollArea className="h-[400px]">
              {filteredResults().map((result, index) => (
                <div 
                  key={index} 
                  className={`
                    grid grid-cols-12 p-3 items-center text-sm border-t
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  `}
                >
                  <div className="col-span-1 text-center text-gray-500">{index + 1}</div>
                  <div className="col-span-6 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="truncate" title={result.fileName}>
                      {result.fileName}
                    </span>
                  </div>
                  <div className="col-span-3">
                    {result.hasMSSV ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-success" />
                        <Badge variant="outline" className="bg-green-50 text-success border-success">
                          {result.mssvValue}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle size={16} className="text-destructive" />
                        <Badge variant="outline" className="bg-red-50 text-destructive border-destructive">
                          No MSSV Found
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => 
                        setViewContent(viewContent === result.fileName ? null : result.fileName)
                      }
                      className="p-1 h-8 w-8"
                    >
                      {viewContent === result.fileName ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </Button>
                  </div>
                  
                  {viewContent === result.fileName && (
                    <div className="col-span-12 mt-2 mb-1 bg-gray-50 rounded p-3 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all text-left">
                        {result.content.slice(0, 500)}
                        {result.content.length > 500 && "..."}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
