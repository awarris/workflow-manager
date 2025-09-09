import React from 'react';
import { WorkflowManager } from '../components/WorkflowManager';
import { WorkflowEditor } from '../components/WorkflowEditor';
import { Workflow } from 'lucide-react';

export function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Workflow size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestionnaire de Workflows</h1>
            <p className="text-sm text-gray-600">Créez et gérez vos processus visuellement</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <WorkflowManager />
        <WorkflowEditor />
      </div>
    </div>
  );
}