export function exerciseCatalog(routineRows, workoutRows = []) {
  const exercises = new Map();
  for (const row of [...routineRows, ...workoutRows]) {
    const id = String(row[0] ?? '').trim();
    const name = String(row[1] ?? '').trim();
    if (!id || !name) continue;
    const existing = exercises.get(id);
    if (existing && existing !== name) throw new Error(`Conflicting names for exercise ${id}`);
    exercises.set(id, name);
  }
  return [...exercises].sort((a, b) => a[1].localeCompare(b[1]));
}

export function recordedExercises(workoutRows, catalogRows) {
  const catalog = new Map(catalogRows.filter(row => row[0] && row[1]).map(row => [String(row[0]), String(row[1])]));
  const ids = new Set(workoutRows.map(row => String(row[0] ?? '')).filter(Boolean));
  return [...ids].sort().map(id => {
    const name = catalog.get(id);
    if (!name) throw new Error(`Recorded exercise ${id} is missing from Exercises`);
    return [id, name];
  });
}

export function mergeCatalogueRows(existingRows, derivedRows) {
  const byId = new Map();
  for (const row of existingRows) {
    const id = String(row[0] ?? '').trim();
    const name = String(row[1] ?? '').trim();
    if (!id || !name) continue;
    byId.set(id, [id, name, String(row[2] ?? '')]);
  }
  for (const [id, name] of derivedRows) {
    if (!byId.has(id)) byId.set(id, [id, name, '']);
  }
  return [...byId.values()].sort((a, b) => a[1].localeCompare(b[1]));
}
