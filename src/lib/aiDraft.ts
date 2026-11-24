import { supabase } from "./supabase";

export interface DraftInput {
  tripId: string;
  notes: string;
  title?: string;
  place?: string | null;
  when?: string | null;
  /** neue Fotos aus dem Dialog */
  files?: File[];
  /** bereits hochgeladene Fotos (signierte URLs) beim Bearbeiten */
  urls?: string[];
}

export interface Draft {
  title: string;
  text: string;
}

const MAX_IMAGES = 4;
const MAX_SIDE = 1024;

/** Verkleinert ein Bild für Claude (längste Seite 1024 px, JPEG) und gibt Base64 ohne Präfix zurück. */
const toJpegBase64 = async (blob: Blob): Promise<string | null> => {
  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataUrl.slice(dataUrl.indexOf(",") + 1);
  } catch {
    return null;
  }
};

/** Entwurf für einen Beitrag von Claude – über die Edge Function «ai-draft», der API-Key bleibt auf dem Server. */
export const draftPost = async (input: DraftInput): Promise<Draft> => {
  const blobs: Blob[] = (input.files ?? [])
    .filter((f) => f.type.startsWith("image"))
    .slice(0, MAX_IMAGES);
  for (const url of input.urls ?? []) {
    if (blobs.length >= MAX_IMAGES) break;
    try {
      const res = await fetch(url);
      if (res.ok) blobs.push(await res.blob());
    } catch {
      /* Bild auslassen */
    }
  }
  const images = (await Promise.all(blobs.map(toJpegBase64)))
    .filter((d): d is string => !!d)
    .map((data) => ({ data, mediaType: "image/jpeg" }));

  const { data, error } = await supabase.functions.invoke<
    Draft & { error?: string }
  >("ai-draft", {
    body: {
      tripId: input.tripId,
      notes: input.notes,
      title: input.title ?? "",
      place: input.place ?? "",
      when: input.when ?? "",
      images,
    },
  });
  if (error) {
    // Fehlermeldung der Function auslesen, falls vorhanden
    const ctx = (error as { context?: Response }).context;
    let message = "Claude konnte gerade keinen Entwurf schreiben.";
    try {
      const body = ctx ? await ctx.json() : null;
      if (body?.error) message = body.error;
    } catch {
      /* Standardtext */
    }
    throw new Error(message);
  }
  if (!data?.text)
    throw new Error(
      data?.error ?? "Claude konnte gerade keinen Entwurf schreiben.",
    );
  return { title: data.title ?? "", text: data.text };
};
