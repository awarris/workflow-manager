export interface WorkflowNode {
  id: string;
  type: 'text' | 'paragraph' | 'question' | 'action' | 'start' | 'end' | 'condition' | 'delay' | 'webhook' | 'variable' | 'media' | 'button' | 'carousel';
  position: { x: number; y: number };
  data: {
    label: string;
    content: string;
    responses?: ResponseOption[];
    conditions?: ConditionRule[];
    delay?: number;
    webhookUrl?: string;
    variableName?: string;
    variableValue?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    buttons?: ButtonOption[];
    carouselItems?: CarouselItem[];
    style: {
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      borderRadius: number;
      textColor: string;
      fontSize: number;
    };
  };
}

export interface ResponseOption {
  id: string;
  text: string;
  value: string;
  targetNodeId?: string;
  color: string;
}

export interface ConditionRule {
  id: string;
  variable: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: string;
  targetNodeId?: string;
}

export interface ButtonOption {
  id: string;
  text: string;
  action: 'navigate' | 'url' | 'phone' | 'email';
  value: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
}

export interface CarouselItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttons: ButtonOption[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  responseId?: string;
  conditionId?: string;
  style?: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  createdAt: Date;
  updatedAt: Date;
  publishedId?: string; // Ajout du champ pour l'ID de publication
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  defaultValue: any;
  description: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'bot';
  content: string;
  nodeId?: string;
  responses?: ResponseOption[];
  buttons?: ButtonOption[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  timestamp: Date;
}

export interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: string | null;
  selectedNode: string | null;
  isPreviewMode: boolean;
  chatMessages: ChatMessage[];
  chatVariables: Record<string, any>;
}