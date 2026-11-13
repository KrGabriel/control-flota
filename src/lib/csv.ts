export interface CsvParseResult {
  headers: string[];
  filas: Record<string, string>[];
}

function detectarDelimitador(texto: string): string {
  const muestra = texto.slice(0, 2048);
  const conteos: Record<string, number> = {
    ",": 0,
    ";": 0,
    "\t": 0,
  };
  let dentroDeComillas = false;
  for (let i = 0; i < muestra.length; i++) {
    const c = muestra[i];
    if (c === '"') {
      dentroDeComillas = !dentroDeComillas;
    } else if (!dentroDeComillas && c in conteos) {
      conteos[c] += 1;
    }
  }
  const mejor = Object.entries(conteos).sort((a, b) => b[1] - a[1])[0];
  return mejor && mejor[1] > 0 ? mejor[0] : ",";
}

/** Divide una línea (o bloque) CSV respetando comillas RFC 4180. */
function dividirFila(linea: string, delimitador: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let dentroDeComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (dentroDeComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          dentroDeComillas = false;
        }
      } else {
        actual += c;
      }
    } else if (c === '"') {
      dentroDeComillas = true;
    } else if (c === delimitador) {
      campos.push(actual);
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual);
  return campos;
}

export function parsearCsv(texto: string): CsvParseResult {
  const limpio = texto.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const delimitador = detectarDelimitador(limpio);
  const filas: string[][] = [];
  let actual = "";
  let dentroDeComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (dentroDeComillas) {
      actual += c;
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          dentroDeComillas = false;
        }
      }
    } else if (c === '"') {
      dentroDeComillas = true;
      actual += c;
    } else if (c === "\n") {
      filas.push(dividirFila(actual, delimitador));
      actual = "";
    } else {
      actual += c;
    }
  }
  if (actual.trim() !== "") {
    filas.push(dividirFila(actual, delimitador));
  }

  const [cabecera, ...resto] = filas.filter(
    (f) => f.some((c) => c.trim() !== "")
  );
  if (!cabecera) return { headers: [], filas: [] };

  const headers = cabecera.map((h) => h.trim());
  const registros = resto.map((f) => {
    const registro: Record<string, string> = {};
    headers.forEach((h, i) => {
      registro[h] = (f[i] ?? "").trim();
    });
    return registro;
  });
  return { headers, filas: registros };
}

export function serializarCsv(
  headers: string[],
  filas: (string | number | null | undefined)[][]
): string {
  const escapar = (valor: string): string => {
    if (/[",;\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
    return valor;
  };
  const lineas = [
    headers.map((h) => escapar(h)).join(","),
    ...filas.map((f) =>
      f
        .map((v) =>
          v === null || v === undefined ? "" : escapar(String(v))
        )
        .join(",")
    ),
  ];
  return lineas.join("\n");
}

export function descargarCsv(nombre: string, contenido: string) {
  const blob = new Blob([`\uFEFF${contenido}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
