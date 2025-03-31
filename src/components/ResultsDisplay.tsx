
import React, { useState } from "react";
import { CheckCircle, XCircle, FileText, Download, Eye, EyeOff, ClipboardList, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { RequirementDefinition } from "@/utils/fileChecker";

export interface FileCheckResult {
  fileName: string;
  content: string;
  fileType?: string; // 'html', 'css', or undefined
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
      let reportText = `File: ${result.fileName}\nFile Type: ${result.fileType || 'unknown'}\nMSSV Status: ${result.hasMSSV ? "PASSED ✓" : "FAILED ✗"}\n${result.hasMSSV ? `MSSV: ${result.mssvValue}` : "No MSSV comment found"}\n`;
      
      if (result.requirements) {
        reportText += `\nRequirements Score: ${result.requirements.percentage}%`;
        reportText += `\nEarned Points: ${result.requirements.earnedPoints}/${result.requirements.totalPoints}\n`;
        reportText += "\nRequirement Details:";
        
        result.requirements.results.forEach((req) => {
          const reqDef = requirements.find(r => r.id === req.requirementId);
          if (reqDef) {
            reportText += `\n- ${reqDef.name} (${reqDef.type || 'unknown'}): ${req.passed ? "PASSED ✓" : "FAILED ✗"}`;
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
    a.download = "file-check-report.txt";
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
      case "html":
        return results.filter(file => file.fileType === 'html');
      case "css":
        return results.filter(file => file.fileType === 'css');
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

  const getFileTypeIcon = (fileType?: string) => {
    switch (fileType) {
      case 'html':
        return <FileText size={16} className="text-blue-400" />;
      case 'css':
        return <FileCode size={16} className="text-purple-400" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getFileTypeBadge = (fileType?: string) => {
    switch (fileType) {
      case 'html':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">HTML</Badge>;
      case 'css':
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">CSS</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-300">Unknown</Badge>;
    }
  };

  if (results.length === 0) return null;

  const htmlCount = results.filter(file => file.fileType === 'html').length;
  const cssCount = results.filter(file => file.fileType === 'css').length;

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
      
      <div className="grid grid-cols-5 gap-4 mb-6 text-center">
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{htmlCount}</p>
          <p className="text-sm text-gray-500">HTML Files</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{cssCount}</p>
          <p className="text-sm text-gray-500">CSS Files</p>
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">All ({results.length})</TabsTrigger>
          <TabsTrigger value="passed">MSSV Passed ({passedFiles.length})</TabsTrigger>
          <TabsTrigger value="failed">MSSV Failed ({failedFiles.length})</TabsTrigger>
          <TabsTrigger value="html">HTML ({htmlCount})</TabsTrigger>
          <TabsTrigger value="css">CSS ({cssCount})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-0">
          <div className="border rounded-lg">
            <div className="grid grid-cols-12 bg-gray-100 p-3 rounded-t-lg font-medium text-sm">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">File Name</div>
              <div className="col-span-2">File Type</div>
              <div className="col-span-2">MSSV Status</div>
              <div className="col-span-2">Requirements</div>
              <div className="col-span-1 text-center">Actions</div>
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
                      {getFileTypeIcon(result.fileType)}
                      <span className="truncate" title={result.fileName}>
                        {result.fileName}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      {getFileTypeBadge(result.fileType)}
                    </div>
                    <div className="col-span-2">
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
                            No MSSV
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
                    <div className="col-span-1 flex justify-center gap-2">
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
                    <div className="col-span-12 bg-gray-50 p-4 border-t border-b">
                      <h4 className="font-medium mb-3">Requirement Details</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-blue-800 mb-2">HTML Requirements</h5>
                          <div className="space-y-2">
                            {result.requirements.results.map((req, reqIndex) => {
                              const reqDef = requirements.find(r => r.id === req.requirementId);
                              if (!reqDef || reqDef.type !== 'html') return null;
                              
                              return (
                                <div key={reqIndex} className="flex items-start gap-2 text-sm bg-white p-2 rounded border">
                                  {req.passed ? (
                                    <CheckCircle size={16} className="text-success mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                                  )}
                                  <div>
                                    <p className="font-medium">{reqDef.name} ({reqDef.points} pts)</p>
                                    <p className="text-gray-500 text-xs">{reqDef.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {!result.requirements.results.some(req => {
                              const reqDef = requirements.find(r => r.id === req.requirementId);
                              return reqDef && reqDef.type === 'html';
                            }) && (
                              <p className="text-gray-500 text-sm italic">No HTML requirements checked</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-purple-800 mb-2">CSS Requirements</h5>
                          <div className="space-y-2">
                            {result.requirements.results.map((req, reqIndex) => {
                              const reqDef = requirements.find(r => r.id === req.requirementId);
                              if (!reqDef || reqDef.type !== 'css') return null;
                              
                              return (
                                <div key={reqIndex} className="flex items-start gap-2 text-sm bg-white p-2 rounded border">
                                  {req.passed ? (
                                    <CheckCircle size={16} className="text-success mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <XCircle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                                  )}
                                  <div>
                                    <p className="font-medium">{reqDef.name} ({reqDef.points} pts)</p>
                                    <p className="text-gray-500 text-xs">{reqDef.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {!result.requirements.results.some(req => {
                              const reqDef = requirements.find(r => r.id === req.requirementId);
                              return reqDef && reqDef.type === 'css';
                            }) && (
                              <p className="text-gray-500 text-sm italic">No CSS requirements checked</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t flex justify-between">
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

              {filteredResults().length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No files found matching the current filter
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
