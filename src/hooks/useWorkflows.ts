// chemin/vers/le/fichier/workflow-manager/src/hooks/useWorkflows.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
// Ajout du middleware de persistance de Zustand pour sauvegarder l'état dans le localStorage
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkflowState, Workflow, WorkflowNode, WorkflowEdge, ResponseOption, ConditionRule, WorkflowVariable } from '../types/workflow';

// Importation directe des workflows par défaut depuis les fichiers JSON.
// Vite s'occupe de les transformer en objets JavaScript.
import workflowVenteAssurance from '../../workflows/workflow-vente-assurance.json';
import workflowSupportTechnique from '../../workflows/workflow-support-technique.json';
import workflowRecouvrement from '../../workflows/workflow-recouvrement.json';
import workflowProspection from '../../workflows/workflow-prospection.json';

// L'interface du store reste la même, mais nous ajoutons une fonction pour charger les données initiales
interface WorkflowStore extends WorkflowState {
  // Gestion des workflows
  createWorkflow: (name: string, description: string) => string;
  deleteWorkflow: (id: string) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  setCurrentWorkflow: (id: string | null) => void;
  publishWorkflow: (id: string) => string | undefined;
  getWorkflowByPublishedId: (publishedId: string) => Workflow | undefined;
  loadDefaultWorkflows: () => void; // Fonction pour charger les workflows initiaux

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

// Fonction utilitaire pour s'assurer que les dates sont bien des objets Date après chargement
const parseDates = (workflow: Workflow): Workflow => ({
  ...workflow,
  createdAt: new Date(workflow.createdAt),
  updatedAt: new Date(workflow.updatedAt),
});

export const useWorkflows = create<WorkflowStore>()(
  // On enveloppe notre store avec le middleware `persist`
  persist(
    (set, get) => ({
      // État initial de l'application
      workflows: [],
      currentWorkflow: null,
      selectedNode: null,
      isPreviewMode: false,
      chatMessages: [],
      chatVariables: {},

      // Nouvelle fonction pour charger les workflows par défaut depuis les fichiers JSON importés
      loadDefaultWorkflows: () => {
        // On vérifie s'il y a déjà des workflows pour ne pas écraser les données existantes
        if (get().workflows.length === 0) {
            const defaultWorkflows = [
              workflowVenteAssurance,
              workflowSupportTechnique,
              workflowRecouvrement,
              workflowProspection
            ].map(w => parseDates(w as unknown as Workflow)); // On s'assure que les dates sont correctes
            
            set({ workflows: defaultWorkflows, currentWorkflow: defaultWorkflows[0]?.id || null });
        }
      },

      createWorkflow: (name: string, description: string) => {
        const id = uuidv4();
        const now = new Date();
        const newWorkflow: Workflow = { id, name, description, nodes: [], edges: [], variables: [], createdAt: now, updatedAt: now };
        set((state) => ({ workflows: [...state.workflows, newWorkflow], currentWorkflow: id }));
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

      publishWorkflow: (id: string) => {
        const publishedId = uuidv4();
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, publishedId, updatedAt: new Date() } : w
          ),
        }));
        return publishedId;
      },

      getWorkflowByPublishedId: (publishedId: string) => {
        const { workflows } = get();
        return workflows.find(w => w.publishedId === publishedId);
      },

      addNode: (type: WorkflowNode['type'], position: { x: number; y: number }) => {
        const { currentWorkflow, workflows } = get();
        if (!currentWorkflow) return;
        const id = uuidv4();
        const newNode: WorkflowNode = { id, type, position, data: { ...getNodeDefaults(type), style: { ...defaultNodeStyle } } as WorkflowNode['data'] };
        const updatedWorkflows = workflows.map((w) => w.id === currentWorkflow ? { ...w, nodes: [...w.nodes, newNode], updatedAt: new Date() } : w);
        set({ workflows: updatedWorkflows, selectedNode: id });
      },

      updateNode: (id: string, updates: Partial<WorkflowNode>) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)), updatedAt: new Date() }
              : w
          ),
        }));
      },

      deleteNode: (id: string) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.filter(n => n.id !== id), edges: w.edges.filter(e => e.source !== id && e.target !== id), updatedAt: new Date() }
              : w
          ),
          selectedNode: null,
        }));
      },

      setSelectedNode: (id: string | null) => set({ selectedNode: id }),

      addEdge: (edge: WorkflowEdge) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow ? { ...w, edges: [...w.edges, edge], updatedAt: new Date() } : w
          ),
        }));
      },

      updateEdge: (id: string, updates: Partial<WorkflowEdge>) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, edges: w.edges.map(e => (e.id === id ? { ...e, ...updates } : e)), updatedAt: new Date() }
              : w
          ),
        }));
      },

      deleteEdge: (id: string) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow ? { ...w, edges: w.edges.filter(e => e.id !== id), updatedAt: new Date() } : w
          ),
        }));
      },

      addResponse: (nodeId: string, response: Omit<ResponseOption, 'id'>) => {
        const newResponse = { ...response, id: uuidv4() };
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, responses: [...(n.data.responses || []), newResponse] } } : n), updatedAt: new Date() }
              : w
          ),
        }));
      },

      updateResponse: (nodeId: string, responseId: string, updates: Partial<ResponseOption>) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, responses: (n.data.responses || []).map(r => r.id === responseId ? { ...r, ...updates } : r) } } : n), updatedAt: new Date() }
              : w
          ),
        }));
      },

      deleteResponse: (nodeId: string, responseId: string) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, responses: (n.data.responses || []).filter(r => r.id !== responseId) } } : n), edges: w.edges.filter(e => e.responseId !== responseId), updatedAt: new Date() }
              : w
          ),
        }));
      },

      addCondition: (nodeId: string, condition: Omit<ConditionRule, 'id'>) => {
        const newCondition = { ...condition, id: uuidv4() };
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, conditions: [...(n.data.conditions || []), newCondition] } } : n), updatedAt: new Date() }
              : w
          ),
        }));
      },

      updateCondition: (nodeId: string, conditionId: string, updates: Partial<ConditionRule>) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, conditions: (n.data.conditions || []).map(c => c.id === conditionId ? { ...c, ...updates } : c) } } : n), updatedAt: new Date() }
              : w
          ),
        }));
      },

      deleteCondition: (nodeId: string, conditionId: string) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, nodes: w.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, conditions: (n.data.conditions || []).filter(c => c.id !== conditionId) } } : n), edges: w.edges.filter(e => e.conditionId !== conditionId), updatedAt: new Date() }
              : w
          ),
        }));
      },

      addVariable: (variable: Omit<WorkflowVariable, 'id'>) => {
        const newVariable = { ...variable, id: uuidv4() };
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow ? { ...w, variables: [...w.variables, newVariable], updatedAt: new Date() } : w
          ),
        }));
      },

      updateVariable: (id: string, updates: Partial<WorkflowVariable>) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow
              ? { ...w, variables: w.variables.map(v => (v.id === id ? { ...v, ...updates } : v)), updatedAt: new Date() }
              : w
          ),
        }));
      },

      deleteVariable: (id: string) => {
        set(state => ({
          workflows: state.workflows.map(w =>
            w.id === state.currentWorkflow ? { ...w, variables: w.variables.filter(v => v.id !== id), updatedAt: new Date() } : w
          ),
        }));
      },

      setPreviewMode: (enabled: boolean) => set({ isPreviewMode: enabled, chatMessages: [], chatVariables: {} }),
      
      clearChatMessages: () => set({ chatMessages: [], chatVariables: {} }),

      setChatVariable: (name: string, value: any) => set(state => ({ chatVariables: { ...state.chatVariables, [name]: value } })),

      exportWorkflow: (id: string) => {
        const workflow = get().workflows.find(w => w.id === id);
        return workflow ? JSON.stringify(workflow, null, 2) : '';
      },

      importWorkflow: (jsonString: string) => {
        try {
          const workflowData = JSON.parse(jsonString);
          const newWorkflow: Workflow = {
            ...workflowData,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedId: undefined,
          };
          set(state => ({ workflows: [...state.workflows, newWorkflow], currentWorkflow: newWorkflow.id }));
        } catch (e) {
          console.error("Failed to import workflow", e);
          alert("Erreur lors de l'importation du fichier. Vérifiez le format JSON.");
        }
      },
    }),
    {
      // Configuration de la persistance
      name: 'workflow-manager-storage', // Nom de la clé dans le localStorage
      storage: createJSONStorage(() => localStorage), // Utilisation du localStorage

      // Cette fonction est appelée quand l'application charge les données depuis le localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // On s'assure que les chaînes de caractères des dates sont reconverties en objets Date
          state.workflows = state.workflows.map(parseDates);
          
          // Si, après avoir chargé, il n'y a aucun workflow, on charge les modèles par défaut.
          // Cela ne se produit que la toute première fois que l'utilisateur lance l'app.
          if (state.workflows.length === 0) {
            state.loadDefaultWorkflows();
          }
        }
      },
    }
  )
);

// Au démarrage initial de l'application, on s'assure que les workflows par défaut sont chargés
// si le localStorage est vide.
useWorkflows.getState().loadDefaultWorkflows();