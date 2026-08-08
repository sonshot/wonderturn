export function audioBlobFromBase64(encoded: string) {
  const decoded = atob(encoded);
  const bytes = Uint8Array.from(decoded, (character) =>
    character.charCodeAt(0),
  );

  return new Blob([bytes], { type: "audio/mpeg" });
}
