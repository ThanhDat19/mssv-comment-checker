
import React from "react";
import { FileCode, GraduationCap } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-education rounded-lg p-2">
              <FileCode size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">MSSV Comment Checker</h1>
              <p className="text-sm text-gray-500">
                Check HTML files for required MSSV comments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-education">
            <GraduationCap size={20} />
            <span className="font-medium">Academic Tools</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
