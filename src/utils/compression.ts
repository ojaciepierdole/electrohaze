import pako from 'pako';

export function compressData(data: any): Uint8Array {
  const jsonString = JSON.stringify(data);
  const uint8Array = new TextEncoder().encode(jsonString);
  return pako.deflate(uint8Array, { level: 6 });
}

export function decompressData<T>(compressedData: Uint8Array): T {
  const decompressed = pako.inflate(compressedData);
  const jsonString = new TextDecoder().decode(decompressed);
  return JSON.parse(jsonString);
}

export async function compressFile(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const compressed = pako.deflate(new Uint8Array(arrayBuffer), { level: 6 });
  return new Blob([compressed], { type: 'application/octet-stream' });
}

export async function compressFiles(files: File[]): Promise<Blob[]> {
  return Promise.all(files.map(compressFile));
} 