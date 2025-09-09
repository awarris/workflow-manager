import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNode } from '../types/workflow';
import { 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  Zap, 
  Play, 
  Square, 
  GitBranch, 
  Clock, 
  Webhook, 
  Variable, 
  Image, 
  MousePointer, 
  MoreHorizontal 
} from 'lucide-react';

const nodeIcons = {
  text: FileText,
  paragraph: FileText,
  question: HelpCircle,
  action: Zap,
  start: Play,
  end: Square,
  condition: GitBranch,
  delay: Clock,
  webhook: Webhook,
  variable: Variable,
  media: Image,
  button: MousePointer,
  carousel: MoreHorizontal,
};

const nodeColors = {
  start: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  end: { bg: '#fee2e2', border: '#dc2626', text: '#dc2626' },
  text: { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' },
  paragraph: { bg: '#e0e7ff', border: '#4f46e5', text: '#4338ca' },
  question: { bg: '#fef3c7', border: '#d97706', text: '#b45309' },
  action: { bg: '#fed7aa', border: '#ea580c', text: '#c2410c' },
  condition: { bg: '#f3e8ff', border: '#9333ea', text: '#7c3aed' },
  delay: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0284c7' },
  webhook: { bg: '#ecfdf5', border: '#10b981', text: '#059669' },
  variable: { bg: '#fdf4ff', border: '#c084fc', text: '#a855f7' },
  media: { bg: '#fef7ed', border: '#f59e0b', text: '#d97706' },
  button: { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a' },
  carousel: { bg: '#fafafa', border: '#6b7280', text: '#374151' },
};

export const CustomNode: React.FC<NodeProps<WorkflowNode['data']>> = ({ data, selected, type }) => {
  const Icon = nodeIcons[type as keyof typeof nodeIcons] || MessageSquare;
  const colors = nodeColors[type as keyof typeof nodeColors] || nodeColors.text;
  
  const nodeStyle = {
    backgroundColor: data.style.backgroundColor || colors.bg,
    borderColor: data.style.borderColor || colors.border,
    borderWidth: data.style.borderWidth,
    borderRadius: data.style.borderRadius,
    color: data.style.textColor || colors.text,
    fontSize: data.style.fontSize,
  };

  const hasMultipleOutputs = (data.responses && data.responses.length > 0) || 
                            (data.conditions && data.conditions.length > 0);

  return (
    <div
      className={`px-4 py-3 shadow-lg border-2 min-w-[180px] max-w-[250px] transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      style={nodeStyle}
    >
      {type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
        />
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} />
        <span className="font-semibold text-sm truncate">{data.label}</span>
      </div>
      
      {data.content && (
        <div className="text-xs opacity-80 mb-2 line-clamp-2">
          {data.content}
        </div>
      )}

      {/* Show response count for questions */}
      {type === 'question' && data.responses && data.responses.length > 0 && (
        <div className="text-xs opacity-70 mb-1">
          {data.responses.length} réponse{data.responses.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Show condition count */}
      {type === 'condition' && data.conditions && data.conditions.length > 0 && (
        <div className="text-xs opacity-70 mb-1">
          {data.conditions.length} condition{data.conditions.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Show delay time */}
      {type === 'delay' && data.delay && (
        <div className="text-xs opacity-70 mb-1">
          {data.delay / 1000}s
        </div>
      )}

      {/* Show media type */}
      {type === 'media' && data.mediaType && (
        <div className="text-xs opacity-70 mb-1 capitalize">
          {data.mediaType}
        </div>
      )}

      {/* Show button count */}
      {type === 'button' && data.buttons && data.buttons.length > 0 && (
        <div className="text-xs opacity-70 mb-1">
          {data.buttons.length} bouton{data.buttons.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Show carousel items count */}
      {type === 'carousel' && data.carouselItems && data.carouselItems.length > 0 && (
        <div className="text-xs opacity-70 mb-1">
          {data.carouselItems.length} élément{data.carouselItems.length > 1 ? 's' : ''}
        </div>
      )}

      {type !== 'end' && (
        <>
          {hasMultipleOutputs ? (
            // Multiple handles for nodes with multiple outputs
            <div className="flex justify-around">
              {data.responses?.map((response, index) => (
                <Handle
                  key={response.id}
                  type="source"
                  position={Position.Bottom}
                  id={response.id}
                  className="w-2 h-2 !bg-blue-500 hover:!bg-blue-600 transition-colors"
                  style={{ left: `${20 + (index * 60 / (data.responses!.length - 1 || 1))}%` }}
                />
              ))}
              {data.conditions?.map((condition, index) => (
                <Handle
                  key={condition.id}
                  type="source"
                  position={Position.Bottom}
                  id={condition.id}
                  className="w-2 h-2 !bg-purple-500 hover:!bg-purple-600 transition-colors"
                  style={{ left: `${20 + (index * 60 / (data.conditions!.length - 1 || 1))}%` }}
                />
              ))}
            </div>
          ) : (
            // Single handle for simple nodes
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
            />
          )}
        </>
      )}
    </div>
  );
};

export const nodeTypes = {
  text: CustomNode,
  paragraph: CustomNode,
  question: CustomNode,
  action: CustomNode,
  start: CustomNode,
  end: CustomNode,
  condition: CustomNode,
  delay: CustomNode,
  webhook: CustomNode,
  variable: CustomNode,
  media: CustomNode,
  button: CustomNode,
  carousel: CustomNode,
};