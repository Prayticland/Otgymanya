import {describe, expect, it} from 'vitest';
import {exerciseCatalog, mergeCatalogueRows, recordedExercises} from './exercise-data.mjs';

describe('exercise sheet data', () => {
  it('builds one catalog row for every routine or historical exercise', () => {
    expect(exerciseCatalog([['squat', 'Squat'], ['bench', 'Bench Press'], ['squat', 'Squat']], [['row', 'Row']]))
      .toEqual([['bench', 'Bench Press'], ['row', 'Row'], ['squat', 'Squat']]);
  });

  it('includes only exercises that have at least one workout record', () => {
    expect(recordedExercises([['squat'], ['squat'], ['row']], [['bench', 'Bench Press'], ['row', 'Row'], ['squat', 'Squat']]))
      .toEqual([['row', 'Row'], ['squat', 'Squat']]);
  });
});

describe('mergeCatalogueRows', () => {
  it('keeps imported catalogue rows and their guidance, adding only missing derived exercises', () => {
    const existing = [['squat', 'Squat', 'Go deep'], ['zottman-curl', 'Zottman Curl', 'Twist at the top']];
    const derived = [['bench', 'Bench Press'], ['squat', 'Squat']];
    expect(mergeCatalogueRows(existing, derived))
      .toEqual([['bench', 'Bench Press', ''], ['squat', 'Squat', 'Go deep'], ['zottman-curl', 'Zottman Curl', 'Twist at the top']]);
  });

  it('never overwrites an existing catalogue name or guidance', () => {
    expect(mergeCatalogueRows([['v-up', 'V Up', 'Program tip']], [['v-up', 'V-Up']]))
      .toEqual([['v-up', 'V Up', 'Program tip']]);
  });
});
