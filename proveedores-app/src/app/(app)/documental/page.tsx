import { EstadoVacio, Card } from "@/components/ui/Basicos";
import { FolderKanban } from "lucide-react";

export default function DocumentalPage() {
  return (
    <Card>
      <div className="py-10">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-slate-400" />
          </div>
        </div>
        <EstadoVacio
          titulo="Gestión documental"
          descripcion="Este módulo estará disponible en una próxima fase. La arquitectura de almacenamiento en la nube (compatible con S3) ya está preparada para soportarlo."
        />
      </div>
    </Card>
  );
}
