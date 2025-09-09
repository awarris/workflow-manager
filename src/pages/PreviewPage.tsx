import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkflows } from '../hooks/useWorkflows';
import { PublicChat } from '../components/PublicChat';
import { Workflow } from 'lucide-react';

export const PreviewPage: React.FC = () => {
  // Récupère l'ID de publication depuis l'URL (ex: /preview/mon-id)
  const { publishedId } = useParams<{ publishedId: string }>();
  const { getWorkflowByPublishedId } = useWorkflows();
  console.log('voici le publishid: ', publishedId);

  // Recherche le workflow correspondant à cet ID
  const workflow = publishedId ? getWorkflowByPublishedId(publishedId) : undefined;

  // Si le workflow n'est pas trouvé, affiche un message d'erreur
  if (!workflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 text-center">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Workflow non trouvé</h1>
          <p className="text-gray-600 mt-2">
            Le lien de prévisualisation est peut-être invalide ou le workflow a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // Affiche l'interface de chat pour le workflow trouvé
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Workflow size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{workflow.name}</h1>
            <p className="text-sm text-gray-600">{workflow.description}</p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <PublicChat workflow={workflow} />
      </div>
    </div>
  );
};