import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Datos iniciales del sistema:
 * - Usuarios de prueba (uno por rol)
 * - Los 7 criterios de la matriz de selección con sus pesos y guías (sección 6)
 *   NOTA: suman 95%, tal como especifica el documento de requisitos (sección 7).
 *   El sistema debe alertar de esto y NO debe cerrar procesos hasta que se
 *   complete el 100% (o un administrador autorice una excepción).
 * - Listas configurables: tipos de proveedor y categorías de ejemplo.
 */
async function main() {
  console.log("Sembrando usuarios de prueba...");

  const passwordHash = await bcrypt.hash("Cambiar123!", 10);

  await prisma.usuario.upsert({
    where: { correo: "admin@empresa.com" },
    update: {},
    create: {
      nombre: "Administrador del Sistema",
      correo: "admin@empresa.com",
      cargo: "Oficial de Cumplimiento",
      passwordHash,
      rol: "ADMINISTRADOR",
    },
  });

  await prisma.usuario.upsert({
    where: { correo: "responsable@empresa.com" },
    update: {},
    create: {
      nombre: "Responsable de Selección",
      correo: "responsable@empresa.com",
      cargo: "Analista de Compras",
      passwordHash,
      rol: "RESPONSABLE_SELECCION",
    },
  });

  await prisma.usuario.upsert({
    where: { correo: "consulta@empresa.com" },
    update: {},
    create: {
      nombre: "Usuario de Consulta",
      correo: "consulta@empresa.com",
      cargo: "Auditor Interno",
      passwordHash,
      rol: "CONSULTA",
    },
  });

  console.log("Sembrando criterios de evaluación (suman 95%, ver sección 7)...");

  const criterios = [
    {
      nombre: "Tiempos de entrega",
      peso: 20,
      orden: 1,
      descripcion: "Tiempo estimado de entrega del producto o servicio ofrecido.",
      guia5: "Excelente / condición favorable: entrega entre 2 y 15 días.",
      guia3: "Aceptable / condición intermedia: entrega entre 15 y 30 días.",
      guia1: "Desfavorable / condición no favorable: entrega mayor a 30 días.",
    },
    {
      nombre: "Capacidad de suministro",
      peso: 20,
      orden: 2,
      descripcion:
        "Capacidad del proveedor para sostener el suministro requerido. Los rangos son configurables desde este módulo.",
      guia5: "Excelente / condición favorable: capacidad de suministro entre 2 y 15 días.",
      guia3: "Aceptable / condición intermedia: capacidad de suministro entre 15 y 30 días.",
      guia1: "Desfavorable / condición no favorable: capacidad de suministro mayor a 30 días.",
    },
    {
      nombre: "Garantía",
      peso: 15,
      orden: 3,
      descripcion: "Cobertura de garantía ofrecida sobre el producto o servicio.",
      guia5: "Excelente / condición favorable: garantía superior a 1 año.",
      guia3: "Aceptable / condición intermedia: garantía superior a 30 días.",
      guia1: "Desfavorable / condición no favorable: no ofrece garantía.",
    },
    {
      nombre: "Servicio postventa",
      peso: 5,
      orden: 4,
      descripcion: "Servicios complementarios ofrecidos después de la venta.",
      guia5: "Excelente / condición favorable: brinda servicios complementarios.",
      guia3: "Aceptable / condición intermedia: ofrece servicio postventa parcial o limitado.",
      guia1: "Desfavorable / condición no favorable: no tiene servicios complementarios.",
    },
    {
      nombre: "Atención pre-venta",
      peso: 15,
      orden: 5,
      descripcion: "Atención comercial antes de la contratación.",
      guia5: "Excelente / condición favorable: atención inmediata.",
      guia3: "Aceptable / condición intermedia: atención en un día.",
      guia1: "Desfavorable / condición no favorable: atención superior a un día.",
    },
    {
      nombre: "Atención de PQR",
      peso: 10,
      orden: 6,
      descripcion: "Atención a peticiones, quejas y reclamos.",
      guia5: "Excelente / condición favorable: atención inmediata.",
      guia3: "Aceptable / condición intermedia: atención en un día.",
      guia1: "Desfavorable / condición no favorable: atención superior a un día.",
    },
    {
      nombre: "Formas de pago",
      peso: 10,
      orden: 7,
      descripcion: "Condiciones de pago, precios y facilidades de pago ofrecidas.",
      guia5: "Excelente / condición favorable: plazo de pago superior a 30 días.",
      guia3: "Aceptable / condición intermedia: plazo de pago de 30 días.",
      guia1: "Desfavorable / condición no favorable: pago de contado.",
    },
  ];

  for (const criterio of criterios) {
    const existente = await prisma.criterioEvaluacion.findFirst({ where: { nombre: criterio.nombre } });
    if (!existente) {
      await prisma.criterioEvaluacion.create({ data: criterio });
    }
  }

  console.log("Sembrando listas configurables...");

  const tiposProveedor = ["Bienes", "Servicios", "Transporte subcontratado", "Mantenimiento", "Tecnología"];
  for (let i = 0; i < tiposProveedor.length; i++) {
    await prisma.opcionConfigurable.upsert({
      where: { lista_valor: { lista: "TIPO_PROVEEDOR", valor: tiposProveedor[i] } },
      update: {},
      create: { lista: "TIPO_PROVEEDOR", valor: tiposProveedor[i], orden: i },
    });
  }

  const categorias = [
    "Repuestos y mantenimiento vehicular",
    "Combustibles y lubricantes",
    "Llantas",
    "Seguros",
    "GPS y monitoreo satelital",
    "Dotación y elementos de protección personal",
    "Servicios logísticos",
  ];
  for (let i = 0; i < categorias.length; i++) {
    await prisma.opcionConfigurable.upsert({
      where: { lista_valor: { lista: "CATEGORIA_PRODUCTO_SERVICIO", valor: categorias[i] } },
      update: {},
      create: { lista: "CATEGORIA_PRODUCTO_SERVICIO", valor: categorias[i], orden: i },
    });
  }

  const monedas = ["COP", "USD", "EUR"];
  for (let i = 0; i < monedas.length; i++) {
    await prisma.opcionConfigurable.upsert({
      where: { lista_valor: { lista: "MONEDA", valor: monedas[i] } },
      update: {},
      create: { lista: "MONEDA", valor: monedas[i], orden: i },
    });
  }

  console.log("Listo. Usuarios de prueba (contraseña: Cambiar123!):");
  console.log("  - admin@empresa.com          (Administrador)");
  console.log("  - responsable@empresa.com    (Responsable de selección)");
  console.log("  - consulta@empresa.com       (Consulta)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
