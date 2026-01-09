
export interface SalaryData {
  career: string;
  min: number;
  avg: number;
  max: number;
}

export interface UniversityInfo {
  name: string;
  location: string;
  type: 'Pública' | 'Privada';
  reputation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { title: string; uri: string }[];
}
