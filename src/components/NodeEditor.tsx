import React, { useState } from 'react';
import { useWorkflows } from '../hooks/useWorkflows';
import { ResponseOption, ConditionRule, ButtonOption, CarouselItem } from '../types/workflow';
import { 
  Palette, 
  Type, 
  Trash2, 
  Plus, 
  Settings, 
  MessageSquare, 
  GitBranch, 
  Clock,
  Link,
  Variable,
  Image,
  MousePointer,
  MoreHorizontal
} from 'lucide-react';

export const NodeEditor: React.FC = () => {
  const { 
    workflows, 
    currentWorkflow, 
    selectedNode, 
    updateNode, 
    deleteNode,
    addResponse,
    updateResponse,
    deleteResponse,
    addCondition,
    updateCondition,
    deleteCondition
  } = useWorkflows();
  
  const [activeTab, setActiveTab] = useState<'basic' | 'responses' | 'conditions' | 'advanced' | 'style'>('basic');
  
  const currentWorkflowData = workflows.find(w => w.id === currentWorkflow);
  const selectedNodeData = currentWorkflowData?.nodes.find(n => n.id === selectedNode);

  if (!selectedNodeData) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Type size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">Sélectionnez un nœud pour modifier ses propriétés</p>
        </div>
      </div>
    );
  }

  const handleUpdateNode = (updates: any) => {
    updateNode(selectedNode!, updates);
  };

  const handleStyleUpdate = (styleUpdates: any) => {
    handleUpdateNode({
      data: {
        ...selectedNodeData.data,
        style: { ...selectedNodeData.data.style, ...styleUpdates }
      }
    });
  };

  const handleDataUpdate = (dataUpdates: any) => {
    handleUpdateNode({
      data: { ...selectedNodeData.data, ...dataUpdates }
    });
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce nœud ?')) {
      deleteNode(selectedNode!);
    }
  };

  const handleAddResponse = () => {
    const newResponse: Omit<ResponseOption, 'id'> = {
      text: 'Nouvelle réponse',
      value: 'response_value',
      color: '#3b82f6'
    };
    addResponse(selectedNode!, newResponse);
  };

  const handleAddCondition = () => {
    const newCondition: Omit<ConditionRule, 'id'> = {
      variable: 'variable_name',
      operator: 'equals',
      value: 'expected_value'
    };
    addCondition(selectedNode!, newCondition);
  };

  const tabs = [
    { id: 'basic', label: 'Général', icon: Settings },
    ...(selectedNodeData.type === 'question' ? [{ id: 'responses', label: 'Réponses', icon: MessageSquare }] : []),
    ...(selectedNodeData.type === 'condition' ? [{ id: 'conditions', label: 'Conditions', icon: GitBranch }] : []),
    { id: 'advanced', label: 'Avancé', icon: Type },
    { id: 'style', label: 'Style', icon: Palette },
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Propriétés</h3>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer le nœud"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Libellé
              </label>
              <input
                type="text"
                value={selectedNodeData.data.label}
                onChange={(e) => handleDataUpdate({ label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu
              </label>
              <textarea
                value={selectedNodeData.data.content}
                onChange={(e) => handleDataUpdate({ content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'responses' && selectedNodeData.type === 'question' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Réponses possibles</h4>
              <button
                onClick={handleAddResponse}
                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {(selectedNodeData.data.responses || []).map((response, index) => (
                <div key={response.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Réponse {index + 1}</span>
                    <button
                      onClick={() => deleteResponse(selectedNode!, response.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Texte de la réponse"
                      value={response.text}
                      onChange={(e) => updateResponse(selectedNode!, response.id, { text: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="Valeur (optionnel)"
                      value={response.value}
                      onChange={(e) => updateResponse(selectedNode!, response.id, { value: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Couleur:</label>
                      <input
                        type="color"
                        value={response.color}
                        onChange={(e) => updateResponse(selectedNode!, response.id, { color: e.target.value })}
                        className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'conditions' && selectedNodeData.type === 'condition' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Conditions logiques</h4>
              <button
                onClick={handleAddCondition}
                className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {(selectedNodeData.data.conditions || []).map((condition, index) => (
                <div key={condition.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Condition {index + 1}</span>
                    <button
                      onClick={() => deleteCondition(selectedNode!, condition.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nom de la variable"
                      value={condition.variable}
                      onChange={(e) => updateCondition(selectedNode!, condition.id, { variable: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    />
                    
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(selectedNode!, condition.id, { operator: e.target.value as any })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="equals">Égal à</option>
                      <option value="contains">Contient</option>
                      <option value="greater">Supérieur à</option>
                      <option value="less">Inférieur à</option>
                      <option value="exists">Existe</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Valeur attendue"
                      value={condition.value}
                      onChange={(e) => updateCondition(selectedNode!, condition.id, { value: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {selectedNodeData.type === 'delay' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai (ms): {selectedNodeData.data.delay || 2000}
                </label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={selectedNodeData.data.delay || 2000}
                  onChange={(e) => handleDataUpdate({ delay: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {selectedNodeData.type === 'webhook' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL du Webhook
                </label>
                <input
                  type="url"
                  value={selectedNodeData.data.webhookUrl || ''}
                  onChange={(e) => handleDataUpdate({ webhookUrl: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {selectedNodeData.type === 'variable' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la variable
                  </label>
                  <input
                    type="text"
                    value={selectedNodeData.data.variableName || ''}
                    onChange={(e) => handleDataUpdate({ variableName: e.target.value })}
                    placeholder="nom_variable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur
                  </label>
                  <input
                    type="text"
                    value={selectedNodeData.data.variableValue || ''}
                    onChange={(e) => handleDataUpdate({ variableValue: e.target.value })}
                    placeholder="valeur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {selectedNodeData.type === 'media' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de média
                  </label>
                  <select
                    value={selectedNodeData.data.mediaType || 'image'}
                    onChange={(e) => handleDataUpdate({ mediaType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du média
                  </label>
                  <input
                    type="url"
                    value={selectedNodeData.data.mediaUrl || ''}
                    onChange={(e) => handleDataUpdate({ mediaUrl: e.target.value })}
                    placeholder="https://example.com/media.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur de fond
              </label>
              <input
                type="color"
                value={selectedNodeData.data.style.backgroundColor}
                onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur de bordure
              </label>
              <input
                type="color"
                value={selectedNodeData.data.style.borderColor}
                onChange={(e) => handleStyleUpdate({ borderColor: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur du texte
              </label>
              <input
                type="color"
                value={selectedNodeData.data.style.textColor}
                onChange={(e) => handleStyleUpdate({ textColor: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Épaisseur bordure: {selectedNodeData.data.style.borderWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="8"
                value={selectedNodeData.data.style.borderWidth}
                onChange={(e) => handleStyleUpdate({ borderWidth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rayon bordure: {selectedNodeData.data.style.borderRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={selectedNodeData.data.style.borderRadius}
                onChange={(e) => handleStyleUpdate({ borderRadius: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille police: {selectedNodeData.data.style.fontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="24"
                value={selectedNodeData.data.style.fontSize}
                onChange={(e) => handleStyleUpdate({ fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};