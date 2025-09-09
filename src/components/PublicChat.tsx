import React, { useEffect, useState } from 'react';
import { ChatMessage, ResponseOption, Workflow, WorkflowNode } from '../types/workflow';
import { Bot, User, Image, Video, Volume2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PublicChatProps {
  workflow: Workflow;
}

export const PublicChat: React.FC<PublicChatProps> = ({ workflow }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [chatVariables, setChatVariables] = useState<Record<string, any>>({});

  useEffect(() => {
    startChat();
  }, [workflow]);

  // Démarre la conversation
  const startChat = () => {
    if (!workflow.nodes.length) return;

    setMessages([]);
    setCurrentNodeId(null);
    setWaitingForResponse(false);

    const startNode = workflow.nodes.find(n => n.type === 'start') || workflow.nodes[0];
    
    // N'ajoute pas de message système au démarrage
    executeNode(startNode.id, []);
  };

  // Exécute un nœud du workflow
  const executeNode = async (nodeId: string, currentMessages: ChatMessage[]) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCurrentNodeId(nodeId);

    // Gère l'affichage des messages en fonction du type de nœud
    switch (node.type) {
      case 'start':
      case 'action':
      case 'variable':
      case 'webhook':
        // Ces types de nœuds sont silencieux, on passe directement au suivant
        setTimeout(() => proceedToNext(nodeId, currentMessages), 100);
        break;

      case 'delay':
        // Applique le délai puis passe au nœud suivant
        setTimeout(() => proceedToNext(nodeId, currentMessages), node.data.delay || 1000);
        break;

      case 'text':
      case 'paragraph':
      case 'question':
      case 'media':
      case 'button':
        // Affiche un message du bot
        const botMessage: ChatMessage = {
          id: uuidv4(),
          type: 'bot',
          content: node.data.content || node.data.label,
          nodeId: node.id,
          responses: node.type === 'question' ? node.data.responses : undefined,
          buttons: node.type === 'button' ? node.data.buttons : undefined,
          mediaUrl: node.type === 'media' ? node.data.mediaUrl : undefined,
          mediaType: node.type === 'media' ? node.data.mediaType : undefined,
          timestamp: new Date(),
        };
        const newMessages = [...currentMessages, botMessage];
        setMessages(newMessages);

        // Si ce n'est pas une question, on continue
        if (node.type !== 'question' && node.type !== 'button') {
          setTimeout(() => proceedToNext(nodeId, newMessages), 1500);
        } else {
          setWaitingForResponse(true);
        }
        break;
      
      case 'end':
        // Affiche un message de fin propre si le nœud "end" a du contenu
        if (node.data.content) {
            const endMessage: ChatMessage = {
              id: uuidv4(),
              type: 'bot',
              content: node.data.content,
              timestamp: new Date(),
            };
            setMessages([...currentMessages, endMessage]);
        }
        setWaitingForResponse(false);
        break;

      default:
        proceedToNext(nodeId, currentMessages);
    }
  };

  // Passe au nœud suivant dans le workflow
  const proceedToNext = (currentNodeId: string, currentMessages: ChatMessage[]) => {
    const nextEdge = workflow.edges.find(e => e.source === currentNodeId);
    if (nextEdge) {
      setTimeout(() => executeNode(nextEdge.target, currentMessages), 500);
    } else {
      setWaitingForResponse(false);
    }
  };

  // Gère la réponse de l'utilisateur
  const handleResponseClick = (response: ResponseOption) => {
    if (!waitingForResponse || !currentNodeId) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: response.text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setWaitingForResponse(false);
    
    // Trouve le chemin à suivre en fonction de la réponse
    const responseEdge = workflow.edges.find(e => 
      e.source === currentNodeId && e.responseId === response.id
    );

    if (responseEdge) {
      setTimeout(() => executeNode(responseEdge.target, updatedMessages), 1000);
    } else {
      proceedToNext(currentNodeId, updatedMessages);
    }
  };
  
  // Affiche les médias (images, vidéos, etc.)
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

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-end gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.type === 'bot' && <Bot size={24} className="text-gray-400 mb-2 flex-shrink-0" />}
            <div
              className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.type === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
              }`}
            >
              <p>{message.content}</p>
              {renderMediaMessage(message)}
              {message.responses && message.responses.length > 0 && waitingForResponse && (
                <div className="mt-4 space-y-2">
                  {message.responses.map((response) => (
                    <button
                      key={response.id}
                      onClick={() => handleResponseClick(response)}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {response.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {message.type === 'user' && <User size={24} className="text-gray-400 mb-2 flex-shrink-0" />}
          </div>
        ))}

        {waitingForResponse && messages[messages.length-1]?.type === 'bot' && (
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
    </div>
  );
};