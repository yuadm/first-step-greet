import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DateSimulatorContextType {
  simulatedDate: Date | null;
  isSimulating: boolean;
  setSimulatedDate: (date: Date | null) => void;
  resetSimulation: () => void;
  getCurrentDate: () => Date;
}

const DateSimulatorContext = createContext<DateSimulatorContextType | undefined>(undefined);

export function DateSimulatorProvider({ children }: { children: ReactNode }) {
  const [simulatedDate, setSimulatedDateState] = useState<Date | null>(null);

  const setSimulatedDate = useCallback((date: Date | null) => {
    setSimulatedDateState(date);
    if (date) {
      sessionStorage.setItem('simulatedDate', date.toISOString());
    } else {
      sessionStorage.removeItem('simulatedDate');
    }
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulatedDateState(null);
    sessionStorage.removeItem('simulatedDate');
  }, []);

  const getCurrentDate = useCallback(() => {
    return simulatedDate || new Date();
  }, [simulatedDate]);

  const isSimulating = simulatedDate !== null;

  return (
    <DateSimulatorContext.Provider
      value={{
        simulatedDate,
        isSimulating,
        setSimulatedDate,
        resetSimulation,
        getCurrentDate,
      }}
    >
      {children}
    </DateSimulatorContext.Provider>
  );
}

export function useDateSimulator() {
  const context = useContext(DateSimulatorContext);
  if (context === undefined) {
    throw new Error('useDateSimulator must be used within a DateSimulatorProvider');
  }
  return context;
}
