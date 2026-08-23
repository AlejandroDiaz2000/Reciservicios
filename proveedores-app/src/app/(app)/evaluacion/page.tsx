import { EstadoVacio, Card } from "@/components/ui/Basicos";
import { RefreshCw } from "lucide-react";

export default function EvaluacionPage() {
  return (
    <Card>
      <div className="py-10">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-slate-400" />
          </div>
        </div>
        <EstadoVacio
          titulo="Evaluación y reevaluación de proveedores"
          descripcion="Este módulo estará disponible en una próxima fase de la plataforma, una vez se complete la primera versión del módulo de Selección de proveedores."
        />
      </div>
    </Card>
  );
}
