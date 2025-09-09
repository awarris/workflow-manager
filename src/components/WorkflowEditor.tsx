import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflows } from '../hooks/useWorkflows';
import { nodeTypes } from './CustomNodes';
import { NodeEditor } from './NodeEditor';
import { ChatPreview } from './ChatPreview';
import { 
  Plus, 
  Play, 
  Download, 
  Upload, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Zap, 
  Square,
  GitBranch,
  Clock,
  Webhook,
  Variable,
  Image,
  MousePointer,
  MoreHorizontal,
  Share2,
  Copy,
  Check,
  GripVertical,
  X
} from 'lucide-react';

const nodeTypeOptions = [
  { type: 'start', icon: Play, label: 'Début', color: 'text-green-600', description: 'Point de départ du bot' },
  { type: 'text', icon: FileText, label: 'Texte', color: 'text-blue-600', description: 'Message texte simple' },
  { type: 'paragraph', icon: FileText, label: 'Paragraphe', color: 'text-indigo-600', description: 'Message texte long' },
  { type: 'question', icon: HelpCircle, label: 'Question', color: 'text-yellow-600', description: 'Question avec réponses' },
  { type: 'action', icon: Zap, label: 'Action', color: 'text-orange-600', description: 'Action à exécuter' },
  { type: 'condition', icon: GitBranch, label: 'Condition', color: 'text-purple-600', description: 'Logique conditionnelle' },
  { type: 'delay', icon: Clock, label: 'Délai', color: 'text-cyan-600', description: 'Pause temporelle' },
  { type: 'webhook', icon: Webhook, label: 'Webhook', color: 'text-emerald-600', description: 'Appel API externe' },
  { type: 'variable', icon: Variable, label: 'Variable', color: 'text-violet-600', description: 'Gestion de variables' },
  { type: 'media', icon: Image, label: 'Média', color: 'text-amber-600', description: 'Image, vidéo, audio' },
  { type: 'button', icon: MousePointer, label: 'Boutons', color: 'text-lime-600', description: 'Boutons d\'action' },
  { type: 'carousel', icon: MoreHorizontal, label: 'Carrousel', color: 'text-slate-600', description: 'Carrousel d\'éléments' },
  { type: 'end', icon: Square, label: 'Fin', color: 'text-red-600', description: 'Fin de conversation' },
];

// Composant pour la palette déplaçable
const DraggableNodePalette = ({ onPublish, onExport, onImport, publishedLink, workflowData, onPreview }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const paletteRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    
    setIsDragging(true);
    const rect = paletteRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Limiter le déplacement à l'intérieur de la fenêtre
    const maxX = window.innerWidth - paletteRef.current.offsetWidth - 10;
    const maxY = window.innerHeight - paletteRef.current.offsetHeight - 10;
    
    setPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  const handleCopyLink = () => {
    if (!publishedLink) return;
    navigator.clipboard.writeText(publishedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-300 p-2 cursor-move transition-all duration-300 hover:shadow-2xl"
        style={{ left: position.x, top: position.y, width: '40px' }}
        onMouseDown={handleMouseDown}
        ref={paletteRef}
      >
        <div className="flex flex-col items-center">
          <GripVertical size={16} className="text-gray-500 mb-1" />
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
            title="Agrandir la palette"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-300 transition-all duration-300"
      style={{ left: position.x, top: position.y, width: '320px' }}
      onMouseDown={handleMouseDown}
      ref={paletteRef}
    >
      {/* Header avec grip et bouton de réduction */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <div className="flex items-center gap-2 cursor-move">
          <GripVertical size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Palette des Nœuds</h3>
        </div>
        <button 
          onClick={() => setIsMinimized(true)}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="Réduire la palette"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 max-h-96 overflow-y-auto">
        {/* Node Types */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Nœuds disponibles
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {nodeTypeOptions.map(({ type, icon: Icon, label, color, description }) => (
              <div
                key={type}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', type);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                className={`flex flex-col items-center gap-1 p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-sm ${color}`}
                title={description}
              >
                <Icon size={16} />
                <span className="text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Workflow Stats */}
        {workflowData && (
          <div className="mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{workflowData.nodes.length} nœuds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{workflowData.edges.length} connexions</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onPreview}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Play size={14} />
            Tester le bot
          </button>
          
          <button
            onClick={onPublish}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <Share2 size={14} />
            Publier
          </button>

          {publishedLink && (
            <div className="p-2 bg-gray-100 rounded-lg">
              <label className="text-xs font-medium text-gray-600">Lien de partage :</label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="text" 
                  readOnly 
                  value={publishedLink} 
                  className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1" 
                />
                <button onClick={handleCopyLink} className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded transition-colors">
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={onExport}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Exporter le bot"
            >
              <Download size={14} />
              Exporter
            </button>
            <button
              onClick={onImport}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Importer un bot"
            >
              <Upload size={14} />
              Importer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WorkflowEditor: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    workflows,
    currentWorkflow,
    selectedNode,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addEdgeToWorkflow,
    setSelectedNode,
    setPreviewMode,
    exportWorkflow,
    publishWorkflow,
    importWorkflow,
  } = useWorkflows();

  const currentWorkflowData = workflows.find(w => w.id === currentWorkflow);
  const [nodes, setNodes, onNodesChange] = useNodesState(currentWorkflowData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentWorkflowData?.edges || []);
  const [publishedLink, setPublishedLink] = useState<string | null>(null);

  // Update local state when workflow changes
  React.useEffect(() => {
    if (currentWorkflowData) {
      setNodes(currentWorkflowData.nodes);
      setEdges(currentWorkflowData.edges);
      // Met à jour le lien publié s'il existe déjà
      if (currentWorkflowData.publishedId) {
        setPublishedLink(`${window.location.origin}/preview/${currentWorkflowData.publishedId}`);
      } else {
        setPublishedLink(null);
      }
    }
  }, [currentWorkflowData, setNodes, setEdges]);

  const handlePublish = () => {
    if (!currentWorkflow) return;
    const publishedId = publishWorkflow(currentWorkflow);
    if (publishedId) {
      const link = `${window.location.origin}/preview/${publishedId}`;
      setPublishedLink(link);
    }
  };

  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge = {
      id: `${params.source}-${params.target}`,
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      style: { stroke: '#3B82F6', strokeWidth: 2 },
    };
    
    addEdgeToWorkflow(newEdge);
    setEdges(eds => addEdge(params, eds));
  }, [addEdgeToWorkflow, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowWrapper.current) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left - 90,
      y: event.clientY - reactFlowBounds.top - 25,
    };

    addNode(type as any, position);
  }, [addNode]);

  const handleExport = () => {
    if (!currentWorkflow) return;
    
    const jsonString = exportWorkflow(currentWorkflow);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-${currentWorkflowData?.name.replace(/\s+/g, '-').toLowerCase() || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const jsonString = e.target?.result as string;
          try {
            importWorkflow(jsonString);
          } catch (error) {
            alert('Erreur lors de l\'importation du fichier. Vérifiez le format JSON.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (!currentWorkflowData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md">
          <MessageSquare size={64} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Créez votre premier bot</h3>
          <p className="text-gray-500 mb-4">
            Commencez par créer un nouveau workflow pour construire votre bot interactif
          </p>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
            <h4 className="font-medium text-gray-800 mb-2">Types de nœuds disponibles:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• Messages texte</div>
              <div>• Questions interactives</div>
              <div>• Conditions logiques</div>
              <div>• Actions automatiques</div>
              <div>• Médias (images, vidéos)</div>
              <div>• Boutons d'action</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Palette déplaçable */}
      <DraggableNodePalette 
        onPublish={handlePublish}
        onExport={handleExport}
        onImport={handleImport}
        publishedLink={publishedLink}
        workflowData={currentWorkflowData}
        onPreview={() => setPreviewMode(true)}
      />

      <div className="flex-1 relative">
        <div ref={reactFlowWrapper} className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gradient-to-br from-gray-50 to-blue-50"
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Background 
              color="#e5e7eb" 
              gap={20} 
              size={1}
              variant="dots"
            />
            <Controls 
              className="!bg-white !border-gray-200 !shadow-lg"
            />
            <MiniMap 
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  start: '#16a34a',
                  end: '#dc2626',
                  text: '#2563eb',
                  paragraph: '#4f46e5',
                  question: '#d97706',
                  action: '#ea580c',
                  condition: '#9333ea',
                  delay: '#0ea5e9',
                  webhook: '#10b981',
                  variable: '#c084fc',
                  media: '#f59e0b',
                  button: '#22c55e',
                  carousel: '#6b7280',
                };
                return colors[node.type || 'text'] || '#3B82F6';
              }}
              className="!bg-white !border-gray-200 !shadow-lg"
            />
          </ReactFlow>
        </div>
      </div>

      <NodeEditor />
      <ChatPreview />
    </div>
  );
};