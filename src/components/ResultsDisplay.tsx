import React, { useState } from "react";
import { CheckCircle, XCircle, FileText, Download, Eye, EyeOff, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { RequirementDefinition } from "@/utils/fileChecker";

export interface FileCheckResult {
  fileName: string;
  content: string;
  hasMSSV: boolean;
  mssvValue?: string;
  requirements?: {
    results: { requirementId: string; passed: boolean }[];
    totalPoints: number;
    earnedPoints: number;
    percentage: number;
  };
}

interface ResultsDisplayProps {
  results: FileCheckResult[];
  onClear: () => void;
  requirements?: RequirementDefinition[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onClear, requirements = [] }) => {
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [expandedRequirements, setExpandedRequirements] = useState<string | null>(null);
  
  const passedFiles = results.filter((file) => file.hasMSSV);
  const failedFiles = results.filter((file) => !file.hasMSSV);
  
  const downloadReport = () => {
    const report = results.map((result) => {
      let reportText = `File: ${result.fileName}\nMSSV Status: ${result.hasMSSV ? "PASSED ✓" : "FAILED ✗"}\n${result.hasMSSV ? `MSSV: ${result.mssvValue}` : "No MSSV comment found"}\n`;
      
      if (result.requirements) {
        reportText += `\nRequirements Score: ${result.requirements.percentage}%`;
        reportText += `\nEarned Points: ${result.requirements.earnedPoints}/${result.requirements.totalPoints}\n`;
        reportText += "\nRequirement Details:";
        
        result.requirements.results.forEach((req) => {
          const reqDef = requirements.find(r => r.id === req.requirementId);
          if (reqDef) {
            reportText += `\n- ${reqDef.name}: ${req.passed ? "PASSED ✓" : "FAILED ✗"}`;
          }
        });
      }
      
      reportText += "\n------------------------";
      return reportText;
    }).join("\n\n");
    
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "html-check-report.txt";
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

  const toggleRequirements = (fileName: string) => {
    setExpandedRequirements(expandedRequirements === fileName ? null : fileName);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-success";
    if (percentage >= 60) return "bg-amber-500";
    return "bg-destructive";
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
              <div className="col-span-4">File Name</div>
              <div className="col-span-3">MSSV Status</div>
              <div className="col-span-2">Requirements</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            
            <ScrollArea className="h-[400px]">
              {filteredResults().map((result, index) => (
                <React.Fragment key={index}>
                  <div 
                    className={`
                      grid grid-cols-12 p-3 items-center text-sm border-t
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    `}
                  >
                    <div className="col-span-1 text-center text-gray-500">{index + 1}</div>
                    <div className="col-span-4 flex items-center gap-2">
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
                    <div className="col-span-2">
                      {result.requirements ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${result.requirements.percentage >= 60 ? 'text-success' : 'text-destructive'}`}>
                              {result.requirements.percentage}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRequirements(result.fileName)}
                              className="ml-auto p-1 h-6 w-6"
                            >
                              <ClipboardList size={14} />
                            </Button>
                          </div>
                          <Progress
                            value={result.requirements.percentage}
                            className={`h-2 ${getProgressColor(result.requirements.percentage)}`}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">Not checked</span>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          setViewContent(viewContent === result.fileName ? null : result.fileName)
                        }
                        className="p-1 h-8 w-8"
                        title="View content"
                      >
                        {viewContent === result.fileName ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {expandedRequirements === result.fileName && result.requirements && (
                    <div className="col-span-12 bg-gray-50 p-3 border-t border-b">
                      <h4 className="font-medium mb-2">Requirement Details</h4>
                      <div className="space-y-2">
                        {result.requirements.results.map((req, reqIndex) => {
                          const reqDef = requirements.find(r => r.id === req.requirementId);
                          if (!reqDef) return null;
                          
                          return (
                            <div key={reqIndex} className="flex items-start gap-2 text-sm">
                              {req.passed ? (
                                <CheckCircle size={16} className="text-success mt-0.5" />
                              ) : (
                                <XCircle size={16} className="text-destructive mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium">{reqDef.name} ({reqDef.points} pts)</p>
                                <p className="text-gray-500 text-xs">{reqDef.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-between">
                        <span className="text-sm font-medium">Total Score:</span>
                        <span className="text-sm font-medium">
                          {result.requirements.earnedPoints}/{result.requirements.totalPoints} points ({result.requirements.percentage}%)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {viewContent === result.fileName && (
                    <div className="col-span-12 p-3 bg-gray-50 border-t border-b font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all text-left">
                        {result.content.slice(0, 500)}
                        {result.content.length > 500 && "..."}
                      </pre>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
