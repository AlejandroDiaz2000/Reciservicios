import { z } from "zod";

export const proveedorSchema = z.object({
  // Información general
  razonSocial: z.string().trim().min(1, "La razón social es obligatoria").max(300),
  nit: z
    .string()
    .trim()
    .min(1, "El NIT es obligatorio")
    .max(30)
    .regex(/^[0-9A-Za-z.\-]+$/, "El NIT contiene caracteres no válidos"),
  nombreComercial: z.string().trim().max(300).optional().nullable(),
  nombreContacto: z.string().trim().max(200).optional().nullable(),
  cargoContacto: z.string().trim().max(200).optional().nullable(),
  telefono: z.string().trim().max(50).optional().nullable(),
  correo: z.string().trim().email("Correo electrónico no válido").optional().nullable().or(z.literal("")),
  ciudad: z.string().trim().max(200).optional().nullable(),
  direccion: z.string().trim().max(300).optional().nullable(),
  paginaWeb: z.string().trim().max(300).optional().nullable(),
  tiempoMercado: z.string().trim().max(100).optional().nullable(),
  productoServicio: z.string().trim().min(1, "Debes describir el producto o servicio ofrecido"),

  // Información comercial
  valorCotizacion: z.coerce.number().min(0).optional().nullable(),
  moneda: z.string().trim().max(10).optional().default("COP"),
  condicionesComerciales: z.string().trim().max(3000).optional().nullable(),
  formaPagoPropuesta: z.string().trim().max(300).optional().nullable(),
  descuentosOfrecidos: z.string().trim().max(300).optional().nullable(),
  observacionesComerciales: z.string().trim().max(3000).optional().nullable(),

  // Información adicional
  certificacionCalidad: z.boolean().optional().default(false),
  certificacionAmbiental: z.boolean().optional().default(false),
  certificacionSST: z.boolean().optional().default(false),
  otrasCertificaciones: z.string().trim().max(500).optional().nullable(),
  observacionesAdicionales: z.string().trim().max(3000).optional().nullable(),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;
