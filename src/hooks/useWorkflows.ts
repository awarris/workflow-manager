import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowState, Workflow, WorkflowNode, WorkflowEdge, ResponseOption, ConditionRule, WorkflowVariable } from '../types/workflow';

interface WorkflowStore extends WorkflowState {
  // Gestion des workflows
  createWorkflow: (name: string, description: string) => string;
  deleteWorkflow: (id: string) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  setCurrentWorkflow: (id: string | null) => void;
  publishWorkflow: (id: string) => string | undefined; // Ajout de la fonction de publication
  getWorkflowByPublishedId: (publishedId: string) => Workflow | undefined; // Ajout du getter

  // Gestion des nœuds
  addNode: (type: WorkflowNode['type'], position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  
  // Gestion des arêtes
  addEdge: (edge: WorkflowEdge) => void;
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void;
  deleteEdge: (id: string) => void;
  
  // Gestion des réponses
  addResponse: (nodeId: string, response: Omit<ResponseOption, 'id'>) => void;
  updateResponse: (nodeId: string, responseId: string, updates: Partial<ResponseOption>) => void;
  deleteResponse: (nodeId: string, responseId: string) => void;
  
  // Gestion des conditions
  addCondition: (nodeId: string, condition: Omit<ConditionRule, 'id'>) => void;
  updateCondition: (nodeId: string, conditionId: string, updates: Partial<ConditionRule>) => void;
  deleteCondition: (nodeId: string, conditionId: string) => void;
  
  // Gestion des variables
  addVariable: (variable: Omit<WorkflowVariable, 'id'>) => void;
  updateVariable: (id: string, updates: Partial<WorkflowVariable>) => void;
  deleteVariable: (id: string) => void;
  
  // Mode prévisualisation
  setPreviewMode: (enabled: boolean) => void;
  clearChatMessages: () => void;
  setChatVariable: (name: string, value: any) => void;
  
  // Import/Export
  exportWorkflow: (id: string) => string;
  importWorkflow: (jsonString: string) => void;
}

const defaultNodeStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderWidth: 2,
  borderRadius: 8,
  textColor: '#374151',
  fontSize: 14,
};

const getNodeDefaults = (type: WorkflowNode['type']) => {
  const defaults: Record<string, Partial<WorkflowNode['data']>> = {
    start: { label: 'Début', content: 'Début du bot' },
    end: { label: 'Fin', content: 'Fin de la conversation' },
    text: { label: 'Message texte', content: 'Votre message ici...' },
    paragraph: { label: 'Paragraphe', content: 'Votre paragraphe détaillé ici...' },
    question: { 
      label: 'Question', 
      content: 'Votre question ici ?',
      responses: []
    },
    action: { label: 'Action', content: 'Action à exécuter' },
    condition: { 
      label: 'Condition', 
      content: 'Condition logique',
      conditions: []
    },
    delay: { 
      label: 'Délai', 
      content: 'Attendre avant de continuer',
      delay: 2000
    },
    webhook: { 
      label: 'Webhook', 
      content: 'Appel API externe',
      webhookUrl: ''
    },
    variable: { 
      label: 'Variable', 
      content: 'Définir une variable',
      variableName: '',
      variableValue: ''
    },
    media: { 
      label: 'Média', 
      content: 'Image, vidéo ou audio',
      mediaUrl: '',
      mediaType: 'image'
    },
    button: { 
      label: 'Boutons', 
      content: 'Boutons d\'action',
      buttons: []
    },
    carousel: { 
      label: 'Carrousel', 
      content: 'Carrousel d\'éléments',
      carouselItems: []
    }
  };
  
  return defaults[type] || {};
};

export const useWorkflows = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  selectedNode: null,
  isPreviewMode: false,
  chatMessages: [],
  chatVariables: {},

  createWorkflow: (name: string, description: string) => {
    const id = uuidv4();
    const now = new Date();
    
    const newWorkflow: Workflow = {
      id,
      name,
      description,
      nodes: [],
      edges: [],
      variables: [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      workflows: [...state.workflows, newWorkflow],
      currentWorkflow: id,
    }));

    return id;
  },

  deleteWorkflow: (id: string) => {
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
      currentWorkflow: state.currentWorkflow === id ? null : state.currentWorkflow,
    }));
  },

  updateWorkflow: (id: string, updates: Partial<Workflow>) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w
      ),
    }));
  },

  setCurrentWorkflow: (id: string | null) => {
    set({ currentWorkflow: id, selectedNode: null, isPreviewMode: false, chatVariables: {} });
  },
   // Nouvelle fonction pour publier un workflow
  publishWorkflow: (id: string) => {
    const publishedId = uuidv4();
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id
          ? { ...w, publishedId, updatedAt: new Date() }
          : w
      ),
    }));
    return publishedId;
  },

  // Nouvelle fonction pour récupérer un workflow par son ID de publication
  getWorkflowByPublishedId: (publishedId: string) => {
    const { workflows } = get();
    console.log('voici les workflows: ', workflows);
    return workflows.find(w => w.publishedId === publishedId);
  },


  addNode: (type: WorkflowNode['type'], position: { x: number; y: number }) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const id = uuidv4();
    const nodeDefaults = getNodeDefaults(type);
    
    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data: {
        ...nodeDefaults,
        style: { ...defaultNodeStyle },
      } as WorkflowNode['data'],
    };

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? { ...w, nodes: [...w.nodes, newNode], updatedAt: new Date() }
        : w
    );

    set({ workflows: updatedWorkflows, selectedNode: id });
  },

  updateNode: (id: string, updates: Partial<WorkflowNode>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  deleteNode: (id: string) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.filter((n) => n.id !== id),
            edges: w.edges.filter((e) => e.source !== id && e.target !== id),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows, selectedNode: null });
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNode: id });
  },

  addEdge: (edge: WorkflowEdge) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? { ...w, edges: [...w.edges, edge], updatedAt: new Date() }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            edges: w.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  deleteEdge: (id: string) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            edges: w.edges.filter((e) => e.id !== id),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  addResponse: (nodeId: string, response: Omit<ResponseOption, 'id'>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const newResponse: ResponseOption = {
      ...response,
      id: uuidv4(),
    };

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      responses: [...(n.data.responses || []), newResponse],
                    },
                  }
                : n
            ),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  updateResponse: (nodeId: string, responseId: string, updates: Partial<ResponseOption>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      responses: (n.data.responses || []).map((r) =>
                        r.id === responseId ? { ...r, ...updates } : r
                      ),
                    },
                  }
                : n
            ),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  deleteResponse: (nodeId: string, responseId: string) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      responses: (n.data.responses || []).filter((r) => r.id !== responseId),
                    },
                  }
                : n
            ),
            edges: w.edges.filter((e) => e.responseId !== responseId),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  addCondition: (nodeId: string, condition: Omit<ConditionRule, 'id'>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const newCondition: ConditionRule = {
      ...condition,
      id: uuidv4(),
    };

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      conditions: [...(n.data.conditions || []), newCondition],
                    },
                  }
                : n
            ),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  updateCondition: (nodeId: string, conditionId: string, updates: Partial<ConditionRule>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      conditions: (n.data.conditions || []).map((c) =>
                        c.id === conditionId ? { ...c, ...updates } : c
                      ),
                    },
                  }
                : n
            ),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  deleteCondition: (nodeId: string, conditionId: string) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      conditions: (n.data.conditions || []).filter((c) => c.id !== conditionId),
                    },
                  }
                : n
            ),
            edges: w.edges.filter((e) => e.conditionId !== conditionId),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  addVariable: (variable: Omit<WorkflowVariable, 'id'>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const newVariable: WorkflowVariable = {
      ...variable,
      id: uuidv4(),
    };

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? { ...w, variables: [...w.variables, newVariable], updatedAt: new Date() }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  updateVariable: (id: string, updates: Partial<WorkflowVariable>) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            variables: w.variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  deleteVariable: (id: string) => {
    const { currentWorkflow, workflows } = get();
    if (!currentWorkflow) return;

    const updatedWorkflows = workflows.map((w) =>
      w.id === currentWorkflow
        ? {
            ...w,
            variables: w.variables.filter((v) => v.id !== id),
            updatedAt: new Date(),
          }
        : w
    );

    set({ workflows: updatedWorkflows });
  },

  setPreviewMode: (enabled: boolean) => {
    set({ isPreviewMode: enabled, chatMessages: [], chatVariables: {} });
  },

  clearChatMessages: () => {
    set({ chatMessages: [], chatVariables: {} });
  },

  setChatVariable: (name: string, value: any) => {
    set((state) => ({
      chatVariables: { ...state.chatVariables, [name]: value },
    }));
  },

  exportWorkflow: (id: string) => {
    const { workflows } = get();
    const workflow = workflows.find((w) => w.id === id);
    return workflow ? JSON.stringify(workflow, null, 2) : '';
  },

  importWorkflow: (jsonString: string) => {
    try {
      const workflow: Workflow = JSON.parse(jsonString);
      workflow.id = uuidv4(); // Generate new ID to avoid conflicts
      workflow.createdAt = new Date();
      workflow.updatedAt = new Date();

      set((state) => ({
        workflows: [...state.workflows, workflow],
        currentWorkflow: workflow.id,
      }));
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  },
}));