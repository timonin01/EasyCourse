import { useEffect, useState } from 'react';
import type { StepDiffInfo } from '../../../utils/stepikCompare';

function getStorageKey(courseId: string | undefined, key: string) {
  return `step-diffs-${courseId}-${key}`;
}

function loadStepsDiffersFromStorage(courseId: string | undefined): Set<number> {
  if (!courseId) return new Set();
  try {
    const stored = localStorage.getItem(getStorageKey(courseId, 'differs'));
    if (stored) {
      return new Set(JSON.parse(stored) as number[]);
    }
  } catch (error) {
    console.error('Failed to load steps differs from storage:', error);
  }
  return new Set();
}

function loadStepsDiffDetailsFromStorage(courseId: string | undefined): Map<number, StepDiffInfo> {
  if (!courseId) return new Map();
  try {
    const stored = localStorage.getItem(getStorageKey(courseId, 'details'));
    if (stored) {
      return new Map(JSON.parse(stored) as Array<[number, StepDiffInfo]>);
    }
  } catch (error) {
    console.error('Failed to load steps diff details from storage:', error);
  }
  return new Map();
}

export function useStepDiffStorage(courseId: string | undefined) {
  const [stepsDiffersFromStepik, setStepsDiffersFromStepik] = useState<Set<number>>(() =>
    loadStepsDiffersFromStorage(courseId)
  );
  const [stepsDiffDetails, setStepsDiffDetails] = useState<Map<number, StepDiffInfo>>(() =>
    loadStepsDiffDetailsFromStorage(courseId)
  );
  const [stepsChecking, setStepsChecking] = useState<Set<number>>(new Set());
  const [diffModalStepId, setDiffModalStepId] = useState<number | null>(null);

  useEffect(() => {
    if (!courseId) return;
    try {
      localStorage.setItem(
        getStorageKey(courseId, 'differs'),
        JSON.stringify(Array.from(stepsDiffersFromStepik))
      );
    } catch (error) {
      console.error('Failed to save steps differs to storage:', error);
    }
  }, [stepsDiffersFromStepik, courseId]);

  useEffect(() => {
    if (!courseId) return;
    try {
      localStorage.setItem(
        getStorageKey(courseId, 'details'),
        JSON.stringify(Array.from(stepsDiffDetails.entries()))
      );
    } catch (error) {
      console.error('Failed to save steps diff details to storage:', error);
    }
  }, [stepsDiffDetails, courseId]);

  return {
    stepsDiffersFromStepik,
    setStepsDiffersFromStepik,
    stepsDiffDetails,
    setStepsDiffDetails,
    stepsChecking,
    setStepsChecking,
    diffModalStepId,
    setDiffModalStepId,
    loadStepsDiffersFromStorage: () => loadStepsDiffersFromStorage(courseId),
    loadStepsDiffDetailsFromStorage: () => loadStepsDiffDetailsFromStorage(courseId),
  };
}
