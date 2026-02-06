import { createContext } from 'react';

export interface ExcelData {
  studentEmail: string;
  studentPassword: string;
}

export const ExcelDataContext = createContext<ExcelData[]>([]);