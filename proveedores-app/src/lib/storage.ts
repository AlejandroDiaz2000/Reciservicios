import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

/**
 * Capa de almacenamiento de objetos, compatible con AWS S3, Cloudflare R2,
 * Supabase Storage, MinIO, etc. (cualquier servicio con API compatible S3).
 *
 * Los archivos (documentos de proveedores, informes PDF/Excel) NUNCA se
 * guardan en el servidor de aplicación ni en el navegador: solo se
 * almacenan aquí, y la base de datos guarda una referencia segura
 * (bucket + storageKey), nunca el archivo en sí.
 *
 * Las descargas se sirven mediante URLs firmadas de corta duración
 * (ver getUrlDescargaFirmada), nunca exponiendo el bucket como público.
 */

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Configuración de almacenamiento incompleta. Define S3_ENDPOINT, S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("Falta configurar S3_BUCKET.");
  return bucket;
}

/** Genera una clave de objeto organizada por proceso, evitando colisiones. */
export function generarStorageKey(params: {
  procesoId: string;
  categoria: "documentos" | "informes";
  nombreOriginal: string;
}): string {
  const extension = params.nombreOriginal.includes(".")
    ? params.nombreOriginal.split(".").pop()
    : undefined;
  const nombreSeguro = randomUUID();
  return `procesos/${params.procesoId}/${params.categoria}/${nombreSeguro}${
    extension ? `.${extension}` : ""
  }`;
}

export async function subirObjeto(params: {
  storageKey: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ bucket: string; storageKey: string }> {
  const client = getS3Client();
  const bucket = getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.storageKey,
      Body: params.body,
      ContentType: params.contentType,
      ServerSideEncryption: "AES256",
    })
  );

  return { bucket, storageKey: params.storageKey };
}

/** URL firmada temporal para SUBIR un archivo directamente desde el cliente (carga de soportes). */
export async function getUrlSubidaFirmada(params: {
  storageKey: string;
  contentType: string;
  expiraSegundos?: number;
}): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.storageKey,
    ContentType: params.contentType,
  });
  return getSignedUrl(client, command, { expiresIn: params.expiraSegundos ?? 300 });
}

/** URL firmada temporal para DESCARGAR un archivo privado (informe, documento de soporte). */
export async function getUrlDescargaFirmada(params: {
  bucket?: string;
  storageKey: string;
  nombreDescarga?: string;
  expiraSegundos?: number;
}): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: params.bucket ?? getBucket(),
    Key: params.storageKey,
    ResponseContentDisposition: params.nombreDescarga
      ? `attachment; filename="${params.nombreDescarga}"`
      : undefined,
  });
  return getSignedUrl(client, command, { expiresIn: params.expiraSegundos ?? 300 });
}

export async function eliminarObjeto(storageKey: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
}
