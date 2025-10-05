import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TestModeContextType {
  isTestMode: boolean;
  simulatedDate: Date;
  setTestMode: (enabled: boolean) => void;
  setSimulatedDate: (date: Date) => void;
  getTestDate: () => Date;
}

const TestModeContext = createContext<TestModeContextType | undefined>(undefined);

export function TestModeProvider({ children }: { children: ReactNode }) {
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('testMode');
    return saved === 'true';
  });

  const [simulatedDate, setSimulatedDateState] = useState<Date>(() => {
    const saved = localStorage.getItem('testModeDate');
    return saved ? new Date(saved) : new Date();
  });

  useEffect(() => {
    localStorage.setItem('testMode', String(isTestMode));
  }, [isTestMode]);

  useEffect(() => {
    localStorage.setItem('testModeDate', simulatedDate.toISOString());
  }, [simulatedDate]);

  const setTestMode = (enabled: boolean) => {
    setIsTestMode(enabled);
    if (!enabled) {
      // Reset to current date when disabling test mode
      setSimulatedDateState(new Date());
    }
  };

  const setSimulatedDate = (date: Date) => {
    setSimulatedDateState(date);
  };

  const getTestDate = () => {
    return isTestMode ? simulatedDate : new Date();
  };

  return (
    <TestModeContext.Provider
      value={{
        isTestMode,
        simulatedDate,
        setTestMode,
        setSimulatedDate,
        getTestDate,
      }}
    >
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode() {
  const context = useContext(TestModeContext);
  if (context === undefined) {
    throw new Error('useTestMode must be used within a TestModeProvider');
  }
  return context;
}

export function useTestDate(): Date {
  const { getTestDate } = useTestMode();
  return getTestDate();
}
