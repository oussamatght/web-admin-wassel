"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CarFront,
  FileUp,
  Pencil,
  Save,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface VehicleRecord {
  _id: string;
  brand: string;
  model: string;
  version: string;
  engineCode: string;
  engineFamily?: string;
  vinPrefix?: string;
  vinRule?: string;
  typeMine?: string;
  motorisation?: string;
  generation?: string;
  yearFrom: number;
  yearTo: number;
  group?: string;
}

interface CsvValidationIssue {
  row: number;
  status: "VALID" | "WARNING" | "INVALID" | "DUPLICATE";
  field: string;
  reason: string;
}

interface CsvImportSummary {
  total: number;
  valid: number;
  warnings: number;
  invalid: number;
  duplicates: number;
  created: number;
  updated: number;
  ignored: number;
  rows?: number;
  errors?: CsvValidationIssue[];
}

const CANONICAL_CSV_COLUMNS = [
  "brand",
  "model",
  "version",
  "engineCode",
  "engineFamily",
  "vinPrefix",
  "vinRule",
  "typeMine",
  "generation",
  "motorisation",
  "yearFrom",
  "yearTo",
  "group",
];

const normalizeCsvHeader = (header: string) => {
  const cleaned = header.trim().toLowerCase();
  const canonical = CANONICAL_CSV_COLUMNS.find(
    (column) => column.toLowerCase() === cleaned,
  );
  if (canonical) return canonical;
  if (cleaned === "startyear") return "yearFrom";
  if (cleaned === "endyear") return "yearTo";
  if (cleaned === "fueltype") return "fuelType";
  return cleaned;
};

const normalizeCsvRowForSubmission = (row: Record<string, string | number>) => {
  const normalized: Record<string, string | number> = {};

  Object.entries(row).forEach(([rawKey, value]) => {
    const key = normalizeCsvHeader(rawKey);
    if (
      key === "yearfrom" &&
      !Object.prototype.hasOwnProperty.call(normalized, "yearFrom")
    ) {
      normalized.yearFrom = value;
      return;
    }
    if (
      key === "yearto" &&
      !Object.prototype.hasOwnProperty.call(normalized, "yearTo")
    ) {
      normalized.yearTo = value;
      return;
    }
    if (key === "fueltype") {
      normalized.fuelType = value;
      return;
    }
    if (key === "displacement") {
      normalized.displacement = value;
      return;
    }
    if (CANONICAL_CSV_COLUMNS.includes(key)) {
      normalized[key] = value;
    }
  });

  if (
    Object.prototype.hasOwnProperty.call(row, "startYear") ||
    Object.prototype.hasOwnProperty.call(row, "endYear")
  ) {
    if (!normalized.yearFrom && row.startYear !== undefined)
      normalized.yearFrom = row.startYear;
    if (!normalized.yearTo && row.endYear !== undefined)
      normalized.yearTo = row.endYear;
  }

  return normalized;
};

const emptyForm = {
  brand: "",
  model: "",
  version: "",
  engineCode: "",
  engineFamily: "",
  vinPrefix: "",
  vinRule: "",
  typeMine: "",
  generation: "",
  motorisation: "",
  yearFrom: 2000,
  yearTo: 2025,
  group: "Other",
};

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

function parseCsvText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    return { rowNumber: index + 2, ...row };
  });

  return rows;
}

export default function VehicleCatalogPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [csvText, setCsvText] = useState("");
  const [csvRows, setCsvRows] = useState<
    Array<Record<string, string | number>>
  >([]);
  const [csvImportSummary, setCsvImportSummary] =
    useState<null | CsvImportSummary>(null);
  const [csvValidationRows, setCsvValidationRows] = useState<
    CsvValidationIssue[]
  >([]);
  const [vinLookup, setVinLookup] = useState("");
  const [vinResult, setVinResult] = useState<null | {
    vin: string;
    validFormat: boolean;
    prefix: string;
    matchedVehicles: VehicleRecord[];
    compatibleProducts: Record<string, unknown>[];
  }>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicle-catalog"],
    queryFn: async () => {
      const res = await apiGet<{ vehicles: VehicleRecord[] }>(
        "/admin/vehicles",
      );
      return res.vehicles ?? [];
    },
  });

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return vehicles;
    return vehicles.filter((v) =>
      `${v.brand} ${v.model} ${v.version} ${v.engineCode} ${v.vinPrefix ?? ""} ${v.generation ?? ""}`
        .toLowerCase()
        .includes(text),
    );
  }, [vehicles, query]);

  const createMutation = useMutation({
    mutationFn: (payload: typeof emptyForm) =>
      apiPost("/admin/vehicles", payload),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["vehicle-catalog"] });
      toast.success("Véhicule ajouté");
    },
    onError: () => toast.error("Erreur lors de l’ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof emptyForm }) =>
      apiPatch(`/admin/vehicles/${id}`, payload),
    onSuccess: () => {
      setEditingId(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["vehicle-catalog"] });
      toast.success("Véhicule mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-catalog"] });
      toast.success("Véhicule supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const importMutation = useMutation({
    mutationFn: (rows: Array<Record<string, string | number>>) =>
      apiPost<{
        summary: CsvImportSummary;
        invalidRows: CsvValidationIssue[];
        validationResults: CsvValidationIssue[];
      }>("/admin/vehicles/import-csv", { rows }),
    onSuccess: (data) => {
      const normalizedSummary = {
        total: data.summary?.total ?? data.summary?.rows ?? csvRows.length,
        valid: data.summary?.valid ?? 0,
        warnings: data.summary?.warnings ?? 0,
        invalid: data.summary?.invalid ?? 0,
        duplicates: data.summary?.duplicates ?? 0,
        created: data.summary?.created ?? 0,
        updated: data.summary?.updated ?? 0,
        ignored: data.summary?.ignored ?? 0,
        rows: data.summary?.rows ?? csvRows.length,
        errors: data.validationResults ?? data.invalidRows ?? [],
      };
      setCsvImportSummary(normalizedSummary);
      setCsvValidationRows(normalizedSummary.errors ?? []);
      queryClient.invalidateQueries({ queryKey: ["vehicle-catalog"] });
      toast.success("Import CSV terminé");
    },
    onError: () => toast.error("Erreur lors de l’import CSV"),
  });

  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsvText(text);
    setCsvText(text);
    setCsvRows(parsed);
  };

  const handleImport = () => {
    if (!csvRows.length) {
      toast.error("Aucune donnée CSV valide à importer.");
      return;
    }
    const submittedRows = csvRows.map((row) =>
      normalizeCsvRowForSubmission(row),
    );
    importMutation.mutate(submittedRows);
  };

  const lookupVin = async () => {
    const cleaned = vinLookup.trim();
    if (!cleaned) {
      toast.error("Saisissez un VIN à auditer.");
      return;
    }

    try {
      const result = await apiGet<{
        vin: string;
        validFormat: boolean;
        prefix: string;
        matchedVehicles: VehicleRecord[];
        compatibleProducts: Record<string, unknown>[];
      }>(`/admin/vehicles/lookup?vin=${encodeURIComponent(cleaned)}`);
      setVinResult(result);
    } catch {
      toast.error("Erreur lors de la recherche VIN");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      yearFrom: Number(form.yearFrom),
      yearTo: Number(form.yearTo),
    };

    if (
      !payload.brand ||
      !payload.model ||
      !payload.version ||
      !payload.engineCode
    ) {
      toast.error("Les champs marqués requis sont obligatoires.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const startEdit = (vehicle: VehicleRecord) => {
    setEditingId(vehicle._id);
    setForm({
      brand: vehicle.brand,
      model: vehicle.model,
      version: vehicle.version,
      engineCode: vehicle.engineCode,
      engineFamily: vehicle.engineFamily ?? "",
      vinPrefix: vehicle.vinPrefix ?? "",
      vinRule: vehicle.vinRule ?? "",
      typeMine: vehicle.typeMine ?? "",
      generation: vehicle.generation ?? "",
      motorisation: vehicle.motorisation ?? "",
      yearFrom: vehicle.yearFrom,
      yearTo: vehicle.yearTo,
      group: vehicle.group ?? "Other",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#FF6B00]">
            Administration
          </p>
          <h1 className="text-3xl font-bold text-[#0D1B2A]">
            Catalogue véhicules / VIN
          </h1>
        </div>
        <Badge className="w-fit bg-orange-100 text-orange-700 border-orange-200">
          VIN • moteur • compatibilité
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CarFront className="h-5 w-5 text-[#FF6B00]" />
              {editingId ? "Modifier le véhicule" : "Ajouter un véhicule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marque</Label>
                  <Input
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    placeholder="VW"
                  />
                </div>
                <div>
                  <Label>Modèle</Label>
                  <Input
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                    placeholder="Golf 7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Génération</Label>
                  <Input
                    value={form.generation}
                    onChange={(e) =>
                      setForm({ ...form, generation: e.target.value })
                    }
                    placeholder="Golf 7"
                  />
                </div>
                <div>
                  <Label>Motorisation</Label>
                  <Input
                    value={form.motorisation}
                    onChange={(e) =>
                      setForm({ ...form, motorisation: e.target.value })
                    }
                    placeholder="2.0 TDI 150"
                  />
                </div>
              </div>

              <div>
                <Label>Version / motorisation détaillée</Label>
                <Input
                  value={form.version}
                  onChange={(e) =>
                    setForm({ ...form, version: e.target.value })
                  }
                  placeholder="2.0 TDI 150"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code moteur</Label>
                  <Input
                    value={form.engineCode}
                    onChange={(e) =>
                      setForm({ ...form, engineCode: e.target.value })
                    }
                    placeholder="CRBC"
                  />
                </div>
                <div>
                  <Label>Famille moteur</Label>
                  <Input
                    value={form.engineFamily}
                    onChange={(e) =>
                      setForm({ ...form, engineFamily: e.target.value })
                    }
                    placeholder="04L"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Préfixe VIN</Label>
                  <Input
                    value={form.vinPrefix}
                    onChange={(e) =>
                      setForm({ ...form, vinPrefix: e.target.value })
                    }
                    placeholder="AUZ"
                  />
                </div>
                <div>
                  <Label>Type mine</Label>
                  <Input
                    value={form.typeMine}
                    onChange={(e) =>
                      setForm({ ...form, typeMine: e.target.value })
                    }
                    placeholder="1KZ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>VIN rule</Label>
                  <Input
                    value={form.vinRule}
                    onChange={(e) =>
                      setForm({ ...form, vinRule: e.target.value })
                    }
                    placeholder="WVW, AUZ, 1KZ"
                  />
                </div>
                <div>
                  <Label>Groupe</Label>
                  <Input
                    value={form.group}
                    onChange={(e) =>
                      setForm({ ...form, group: e.target.value })
                    }
                    placeholder="VAG"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Année de</Label>
                  <Input
                    type="number"
                    value={form.yearFrom}
                    onChange={(e) =>
                      setForm({ ...form, yearFrom: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>À</Label>
                  <Input
                    type="number"
                    value={form.yearTo}
                    onChange={(e) =>
                      setForm({ ...form, yearTo: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="bg-[#FF6B00] hover:bg-[#e65f00]">
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? "Enregistrer" : "Ajouter"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5 text-[#FF6B00]" />
                  Référentiel moteur / VIN
                </CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher marque, modèle, moteur..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-slate-500">Chargement...</p>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucun véhicule trouvé.
                  </p>
                ) : (
                  filtered.map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-semibold text-[#0D1B2A]">
                              {vehicle.brand}
                            </span>
                            <span className="text-lg text-slate-500">
                              {vehicle.model}
                            </span>
                            {vehicle.generation && (
                              <Badge variant="secondary">
                                {vehicle.generation}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {vehicle.version}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>Code: {vehicle.engineCode}</span>
                            {vehicle.engineFamily && (
                              <span>Famille: {vehicle.engineFamily}</span>
                            )}
                            {vehicle.vinPrefix && (
                              <span>VIN: {vehicle.vinPrefix}</span>
                            )}
                            {vehicle.typeMine && (
                              <span>Type mine: {vehicle.typeMine}</span>
                            )}
                            <span>
                              {vehicle.yearFrom}–{vehicle.yearTo}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(vehicle)}>
                            <Pencil className="mr-1 h-4 w-4" /> Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(vehicle._id)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileUp className="h-5 w-5 text-[#FF6B00]" />
                Import CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  handleCsvFile(file);
                }}
              />

              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Colonnes attendues : brand, model, version, engineCode,
                engineFamily, vinPrefix, vinRule, typeMine, generation,
                motorisation, yearFrom, yearTo, group
              </div>

              {csvRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Aperçu ({csvRows.length} lignes)
                  </p>
                  <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                    {csvRows.slice(0, 5).map((row, idx) => (
                      <div
                        key={idx}
                        className="mb-2 border-b border-slate-200 pb-1">
                        {Object.entries(row).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {value || "—"}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={handleImport}
                    className="bg-[#FF6B00] hover:bg-[#e65f00]">
                    Importer les lignes validées
                  </Button>
                </div>
              )}

              {csvImportSummary && (
                <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <div>
                    CSV TEST — Total: {csvImportSummary.total} | Valid:{" "}
                    {csvImportSummary.valid} | Invalid:{" "}
                    {csvImportSummary.invalid} | Duplicates:{" "}
                    {csvImportSummary.duplicates} | Created:{" "}
                    {csvImportSummary.created} | Updated:{" "}
                    {csvImportSummary.updated} | Ignored:{" "}
                    {csvImportSummary.ignored} | Warnings:{" "}
                    {csvImportSummary.warnings}
                  </div>
                  {csvValidationRows.length > 0 && (
                    <div className="space-y-1 border-t border-emerald-200 pt-2 text-xs">
                      {csvValidationRows.map((issue, index) => (
                        <div key={`${issue.row}-${index}`}>
                          Row {issue.row}: Status: {issue.status} | Field:{" "}
                          {issue.field} | Error: {issue.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-[#FF6B00]" />
                Audit VIN / compatibilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={vinLookup}
                  onChange={(e) => setVinLookup(e.target.value)}
                  placeholder="Entrez un VIN 17 caractères"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={lookupVin}
                  className="bg-[#FF6B00] hover:bg-[#e65f00]">
                  Vérifier
                </Button>
              </div>

              {vinResult && (
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>VIN:</strong> {vinResult.vin}
                  </p>
                  <p>
                    <strong>Format valide:</strong>{" "}
                    {vinResult.validFormat ? "Oui" : "Non"}
                  </p>
                  <p>
                    <strong>Préfixe:</strong> {vinResult.prefix || "—"}
                  </p>

                  <div>
                    <p className="font-semibold text-[#0D1B2A]">
                      Véhicules correspondants
                    </p>
                    {vinResult.matchedVehicles.length ? (
                      <ul className="mt-2 list-disc pl-5 text-slate-600">
                        {vinResult.matchedVehicles.map((vehicle) => (
                          <li key={vehicle._id}>
                            {vehicle.brand} {vehicle.model} {vehicle.version} (
                            {vehicle.engineCode})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">
                        Aucune correspondance interne.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-[#0D1B2A]">
                      Produits compatibles
                    </p>
                    {vinResult.compatibleProducts.length ? (
                      <ul className="mt-2 list-disc pl-5 text-slate-600">
                        {vinResult.compatibleProducts.map((product, idx) => (
                          <li key={idx}>
                            {String((product as any).title ?? "Produit")}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">
                        Aucun produit compatible trouvé.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
