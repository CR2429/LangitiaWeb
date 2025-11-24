// utils/syncClient.ts
// ------------------------------------------------------------
// Gère la synchronisation entre le client et le backend Cartage
// ------------------------------------------------------------

export interface LocalFileInfo {
  id: string;
  updated_at: string;
}

export interface SyncResponse {
  token?: string;
  new_files?: any[];
  updated_files?: any[];
  deleted_files?: string[];
}

/**
 * Envoie la liste locale des fichiers au serveur pour comparaison.
 * Le serveur renvoie seulement les fichiers nouveaux, mis à jour ou supprimés.
 */
export async function syncFiles(localFiles: LocalFileInfo[]): Promise<SyncResponse> {
  const token = localStorage.getItem("jwt");

  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ files: localFiles })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("jwt", data.token);
    }

    return data;
  } catch (err) {
    console.error("❌ Erreur de synchronisation :", err);
    return {};
  }
}
