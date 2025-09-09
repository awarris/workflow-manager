import React, { useEffect, useState } from 'react';
import { useWorkflows } from '../hooks/useWorkflows';
import { ChatMessage, ResponseOption } from '../types/workflow';
import { MessageSquare, Bot, User, X, Play, RotateCcw, Image, Video, Volume2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ChatPreview: React.FC = () => {
  const { 
    workflows, 
    currentWorkflow, 
    isPreviewMode, 
    setPreviewMode, 
    chatVariables, 
    setChatVariable 
  } = useWorkflows();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  const currentWorkflowData = workflows.find(w => w.id === currentWorkflow);

  useEffect(() => {
    if (isPreviewMode && currentWorkflowData) {
      startPreview();
    }
  }, [isPreviewMode, currentWorkflowData]);

  const startPreview = () => {
    if (!currentWorkflowData || !currentWorkflowData.nodes.length) return;

    setMessages([]);
    setCurrentNodeId(null);
    setIsPlaying(true);
    setWaitingForResponse(false);

    // Find start node or use first node
    const startNode = currentWorkflowData.nodes.find(n => n.type === 'start') || currentWorkflowData.nodes[0];
    
    const initialMessage: ChatMessage = {
      id: uuidv4(),
      type: 'system',
      content: `🤖 Début du bot: ${currentWorkflowData.name}`,
      timestamp: new Date(),
    };

    setMessages([initialMessage]);
    setTimeout(() => executeNode(startNode.id, [initialMessage]), 1000);
  };

  const executeNode = async (nodeId: string, currentMessages: ChatMessage[]) => {
    if (!currentWorkflowData) return;

    const node = currentWorkflowData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCurrentNodeId(nodeId);

    // Handle different node types
    switch (node.type) {
      case 'start':
        // Continue to next node immediately
        proceedToNext(nodeId, currentMessages);
        break;

      case 'text':
      case 'paragraph':
        const textMessage: ChatMessage = {
          id: uuidv4(),
          type: 'bot',
          content: node.data.content || node.data.label,
          nodeId: node.id,
          timestamp: new Date(),
        };
        const withText = [...currentMessages, textMessage];
        setMessages(withText);
        setTimeout(() => proceedToNext(nodeId, withText), 1500);
        break;

      case 'question':
        const questionMessage: ChatMessage = {
          id: uuidv4(),
          type: 'bot',
          content: node.data.content || node.data.label,
          nodeId: node.id,
          responses: node.data.responses || [],
          timestamp: new Date(),
        };
        const withQuestion = [...currentMessages, questionMessage];
        setMessages(withQuestion);
        setWaitingForResponse(true);
        break;

      case 'action':
        const actionMessage: ChatMessage = {
          id: uuidv4(),
          type: 'system',
          content: `⚡ Action: ${node.data.content || node.data.label}`,
          nodeId: node.id,
          timestamp: new Date(),
        };
        const withAction = [...currentMessages, actionMessage];
        setMessages(withAction);
        setTimeout(() => proceedToNext(nodeId, withAction), 2000);
        break;

      case 'delay':
        const delayMessage: ChatMessage = {
          id: uuidv4(),
          type: 'system',
          content: `⏱️ Attente de ${(node.data.delay || 2000) / 1000}s...`,
          nodeId: node.id,
          timestamp: new Date(),
        };
        const withDelay = [...currentMessages, delayMessage];
        setMessages(withDelay);
        setTimeout(() => proceedToNext(nodeId, withDelay), node.data.delay || 2000);
        break;

      case 'condition':
        // Simulate condition evaluation
        const conditions = node.data.conditions || [];
        let conditionMet = false;
        let targetNodeId = null;

        for (const condition of conditions) {
          const variableValue = chatVariables[condition.variable];
          conditionMet = evaluateCondition(variableValue, condition.operator, condition.value);
          
          if (conditionMet && condition.targetNodeId) {
            targetNodeId = condition.targetNodeId;
            break;
          }
        }

        const conditionMessage: ChatMessage = {
          id: uuidv4(),
          type: 'system',
          content: `🔀 Condition ${conditionMet ? 'vraie' : 'fausse'}: ${node.data.content}`,
          nodeId: node.id,
          timestamp: new Date(),
        };
        const withCondition = [...currentMessages, conditionMessage];
        setMessages(withCondition);

        setTimeout(() => {
          if (targetNodeId) {
            executeNode(targetNodeId, withCondition);
          } else {
            proceedToNext(nodeId, withCondition);
          }
        }, 1500);
        break;

      case 'variable':
        if (node.data.variableName && node.data.variableValue) {
          setChatVariable(node.data.variableName, node.data.variableValue);
        }
        const variableMessage: ChatMessage = {
          id: uuidv4(),
          type: 'system',
          content: `📝 Variable "${node.data.variableName}" = "${node.data.variableValue}"`,
          nodeId: node.id,
          timestamp: new Date(),
        };
        const withVariable = [...currentMessages, variableMessage];
        setMessages(withVariable);
        setTimeout(() => proceedToNext(nodeId, withVariable), 1500);
        break;

      case 'webhook':
        const webhookMessage: ChatMessage = {
          id: uuidv4(),
          type: 'system',
          content: `🔗 Appel webhook: ${node.data.webhookUrl || 'URL non définie'}`,
          nodeId: node.id,
          timestamp: new Date(),
        };
        const withWebhook = [...currentMessages, webhookMessage];
        setMessages(withWebhook);
        setTimeout(() => proceedToNext(nodeId, withWebhook), 2000);
        break;

      case 'media':
        const mediaMessage: ChatMessage = {
          id: uuidv4(),
          type: 'bot',
          content: node.data.content || `Média ${node.data.mediaType}`,
          nodeId: node.id,
          mediaUrl: node.data.mediaUrl,
          mediaType: node.data.mediaType,
          timestamp: new Date(),
        };
        const withMedia = [...currentMessages, mediaMessage];
        setMessages(withMedia);
        setTimeout(() => proceedToNext(nodeId, withMedia), 2000);
        break;

      case 'button':
        const buttonMessage: ChatMessage = {
          id: uuidv4(),
          type: 'bot',
          content: node.data.content || node.data.label,
          nodeId: node.id,
          buttons: node.data.buttons || [],
          timestamp: new Date(),
        };
        const withButtons = [...currentMessages, buttonMessage];
        setMessages(withButtons);
        setWaitingForResponse(true);
        break;

      case 'end':
        const endMessage: ChatMessage = {
          id: uuidv4(),
          type: 'system',
          content: '🏁 Fin de la conversation',
          nodeId: node.id,
          timestamp: new Date(),
        };
        setMessages([...currentMessages, endMessage]);
        setIsPlaying(false);
        setWaitingForResponse(false);
        break;

      default:
        proceedToNext(nodeId, currentMessages);
    }
  };

  const proceedToNext = (currentNodeId: string, currentMessages: ChatMessage[]) => {
    if (!currentWorkflowData) return;

    const nextEdge = currentWorkflowData.edges.find(e => e.source === currentNodeId);
    if (nextEdge) {
      setTimeout(() => executeNode(nextEdge.target, currentMessages), 500);
    } else {
      // No next node, end conversation
      const endMessage: ChatMessage = {
        id: uuidv4(),
        type: 'system',
        content: '✅ Conversation terminée',
        timestamp: new Date(),
      };
      setMessages([...currentMessages, endMessage]);
      setIsPlaying(false);
      setWaitingForResponse(false);
    }
  };

  const handleResponseClick = (response: ResponseOption) => {
    if (!waitingForResponse || !currentNodeId) return;

    // Add user response
    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: response.text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setWaitingForResponse(false);

    // Store response value as variable if needed
    if (response.value) {
      setChatVariable('last_response', response.value);
    }

    // Find target node for this response
    const responseEdge = currentWorkflowData?.edges.find(e => 
      e.source === currentNodeId && e.responseId === response.id
    );

    if (responseEdge) {
      setTimeout(() => executeNode(responseEdge.target, updatedMessages), 1000);
    } else {
      // No specific target, proceed to next connected node
      setTimeout(() => proceedToNext(currentNodeId, updatedMessages), 1000);
    }
  };

  const evaluateCondition = (value: any, operator: string, expected: string): boolean => {
    switch (operator) {
      case 'equals':
        return String(value) === expected;
      case 'contains':
        return String(value).includes(expected);
      case 'greater':
        return Number(value) > Number(expected);
      case 'less':
        return Number(value) < Number(expected);
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return false;
    }
  };

  const renderMediaMessage = (message: ChatMessage) => {
    if (!message.mediaUrl) return null;

    switch (message.mediaType) {
      case 'image':
        return (
          <div className="mt-2">
            <img 
              src={message.mediaUrl} 
              alt="Media content" 
              className="max-w-xs rounded-lg shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      case 'video':
        return (
          <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <Video size={16} />
            <span className="text-sm">Vidéo: {message.mediaUrl}</span>
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <Volume2 size={16} />
            <span className="text-sm">Audio: {message.mediaUrl}</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isPreviewMode) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold">Prévisualisation Bot</h3>
            {isPlaying && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">En cours...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startPreview}
              disabled={isPlaying}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw size={14} />
              Recommencer
            </button>
            <button
              onClick={() => setPreviewMode(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-100 text-gray-600 text-sm'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'user' ? (
                    <User size={16} className="mt-1 flex-shrink-0" />
                  ) : message.type === 'bot' ? (
                    <Bot size={16} className="mt-1 flex-shrink-0" />
                  ) : null}
                  <div className="flex-1">
                    <p>{message.content}</p>
                    
                    {/* Render media */}
                    {renderMediaMessage(message)}
                    
                    {/* Render response buttons */}
                    {message.responses && message.responses.length > 0 && waitingForResponse && (
                      <div className="mt-3 space-y-2">
                        {message.responses.map((response) => (
                          <button
                            key={response.id}
                            onClick={() => handleResponseClick(response)}
                            className="block w-full text-left px-3 py-2 text-sm bg-white text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            style={{ borderColor: response.color }}
                          >
                            {response.text}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Render action buttons */}
                    {message.buttons && message.buttons.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.buttons.map((button) => (
                          <button
                            key={button.id}
                            className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                              button.style === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                              button.style === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
                              button.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                              'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {waitingForResponse && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">En attente de votre réponse...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Variables display */}
        {Object.keys(chatVariables).length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Variables:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(chatVariables).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};