import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';

export interface VaccineBatch {
  id?: number;
  vaccine_name: string;
  batch_number: string;
  manufacturer: string;
  quantity: number;
  expiry_date: string;
  storage_location?: string;
  temperature?: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Centralized Mock Data Service
 * Provides consistent mock data across dashboard and inventory
 * For demo purposes only - remove in production
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private mockBatches: VaccineBatch[] = [
    // COVID-19 Vaccines - High Stock
    {
      id: 1,
      vaccine_name: 'COVID-19 (Pfizer-BioNTech)',
      batch_number: 'PFZ-2024-001',
      manufacturer: 'Pfizer',
      quantity: 5000,
      expiry_date: '2025-06-15',
      storage_location: 'Freezer A-1',
      temperature: -70,
      notes: 'Ultra-cold storage required. Handle with care.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      vaccine_name: 'COVID-19 (Pfizer-BioNTech)',
      batch_number: 'PFZ-2024-002',
      manufacturer: 'Pfizer',
      quantity: 6000,
      expiry_date: '2025-08-20',
      storage_location: 'Freezer A-2',
      temperature: -70,
      notes: 'Second shipment. Excellent condition.',
      created_by: 'Dr. Michael Chen',
      created_at: '2024-02-10T14:20:00Z',
      updated_at: '2024-02-10T14:20:00Z'
    },
    {
      id: 3,
      vaccine_name: 'COVID-19 (Pfizer-BioNTech)',
      batch_number: 'PFZ-2024-003',
      manufacturer: 'Pfizer',
      quantity: 4000,
      expiry_date: '2025-09-10',
      storage_location: 'Freezer A-3',
      temperature: -70,
      notes: 'Latest batch. Priority for vaccination campaigns.',
      created_by: 'Nurse Patricia Miller',
      created_at: '2024-03-05T09:15:00Z',
      updated_at: '2024-03-05T09:15:00Z'
    },

    // COVID-19 Moderna - High Stock
    {
      id: 4,
      vaccine_name: 'COVID-19 (Moderna)',
      batch_number: 'MOD-2024-001',
      manufacturer: 'Moderna',
      quantity: 4500,
      expiry_date: '2025-07-30',
      storage_location: 'Freezer B-1',
      temperature: -20,
      notes: 'Standard freezer storage.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2024-01-20T11:00:00Z',
      updated_at: '2024-01-20T11:00:00Z'
    },
    {
      id: 5,
      vaccine_name: 'COVID-19 (Moderna)',
      batch_number: 'MOD-2024-002',
      manufacturer: 'Moderna',
      quantity: 3800,
      expiry_date: '2025-10-15',
      storage_location: 'Freezer B-2',
      temperature: -20,
      notes: 'Reserved for booster program.',
      created_by: 'Dr. Michael Chen',
      created_at: '2024-02-25T13:45:00Z',
      updated_at: '2024-02-25T13:45:00Z'
    },

    // MMR - Optimal Stock
    {
      id: 6,
      vaccine_name: 'Measles-Mumps-Rubella (MMR)',
      batch_number: 'MMR-2024-001',
      manufacturer: 'Merck',
      quantity: 4200,
      expiry_date: '2025-12-31',
      storage_location: 'Refrigerator C-1',
      temperature: 5,
      notes: 'Pediatric immunization program stock.',
      created_by: 'Nurse Jennifer Davis',
      created_at: '2024-01-10T08:30:00Z',
      updated_at: '2024-01-10T08:30:00Z'
    },
    {
      id: 7,
      vaccine_name: 'Measles-Mumps-Rubella (MMR)',
      batch_number: 'MMR-2024-002',
      manufacturer: 'Merck',
      quantity: 4300,
      expiry_date: '2026-01-15',
      storage_location: 'Refrigerator C-2',
      temperature: 5,
      notes: 'School vaccination campaign supply.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2024-02-15T10:00:00Z',
      updated_at: '2024-02-15T10:00:00Z'
    },

    // Hepatitis B - Adequate Stock
    {
      id: 8,
      vaccine_name: 'Hepatitis B',
      batch_number: 'HEPB-2024-001',
      manufacturer: 'GSK (GlaxoSmithKline)',
      quantity: 1800,
      expiry_date: '2025-09-30',
      storage_location: 'Refrigerator D-1',
      temperature: 4,
      notes: 'Newborn vaccination program.',
      created_by: 'Nurse Patricia Miller',
      created_at: '2024-01-25T09:20:00Z',
      updated_at: '2024-01-25T09:20:00Z'
    },
    {
      id: 9,
      vaccine_name: 'Hepatitis B',
      batch_number: 'HEPB-2024-002',
      manufacturer: 'GSK (GlaxoSmithKline)',
      quantity: 1400,
      expiry_date: '2025-11-20',
      storage_location: 'Refrigerator D-2',
      temperature: 4,
      notes: 'Healthcare worker immunization.',
      created_by: 'Dr. Michael Chen',
      created_at: '2024-03-01T14:30:00Z',
      updated_at: '2024-03-01T14:30:00Z'
    },

    // Tetanus-Diphtheria - Low Stock (WARNING)
    {
      id: 10,
      vaccine_name: 'Tetanus-Diphtheria (Td)',
      batch_number: 'TD-2024-001',
      manufacturer: 'Sanofi Pasteur',
      quantity: 900,
      expiry_date: '2025-07-15',
      storage_location: 'Refrigerator E-1',
      temperature: 5,
      notes: 'Low stock - reorder needed urgently.',
      created_by: 'Nurse Jennifer Davis',
      created_at: '2024-02-05T11:15:00Z',
      updated_at: '2024-03-10T16:20:00Z'
    },
    {
      id: 11,
      vaccine_name: 'Tetanus-Diphtheria (Td)',
      batch_number: 'TD-2024-002',
      manufacturer: 'Sanofi Pasteur',
      quantity: 900,
      expiry_date: '2025-08-10',
      storage_location: 'Refrigerator E-2',
      temperature: 5,
      notes: 'Emergency supply. Monitor closely.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2024-03-15T10:45:00Z',
      updated_at: '2024-03-15T10:45:00Z'
    },

    // Polio - Optimal Stock
    {
      id: 12,
      vaccine_name: 'Polio (IPV)',
      batch_number: 'IPV-2024-001',
      manufacturer: 'Sanofi Pasteur',
      quantity: 5500,
      expiry_date: '2026-02-28',
      storage_location: 'Refrigerator F-1',
      temperature: 4,
      notes: 'Routine immunization program.',
      created_by: 'Dr. Michael Chen',
      created_at: '2024-01-18T09:00:00Z',
      updated_at: '2024-01-18T09:00:00Z'
    },
    {
      id: 13,
      vaccine_name: 'Polio (IPV)',
      batch_number: 'IPV-2024-002',
      manufacturer: 'Sanofi Pasteur',
      quantity: 6500,
      expiry_date: '2026-03-15',
      storage_location: 'Refrigerator F-2',
      temperature: 4,
      notes: 'Excellent stock levels.',
      created_by: 'Nurse Patricia Miller',
      created_at: '2024-02-20T13:30:00Z',
      updated_at: '2024-02-20T13:30:00Z'
    },

    // BCG - CRITICAL (Expiring Soon + Low Stock)
    {
      id: 14,
      vaccine_name: 'BCG (Tuberculosis)',
      batch_number: 'BCG-2023-003',
      manufacturer: 'AJ Vaccines',
      quantity: 950,
      expiry_date: '2024-12-17', // 25 days from Nov 22, 2024
      storage_location: 'Refrigerator G-1',
      temperature: 5,
      notes: 'CRITICAL: Expiring soon! Use immediately or transfer.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2023-12-10T10:00:00Z',
      updated_at: '2024-11-15T08:30:00Z'
    },

    // Influenza - Seasonal Stock
    {
      id: 15,
      vaccine_name: 'Influenza',
      batch_number: 'FLU-2024-001',
      manufacturer: 'Sanofi Pasteur',
      quantity: 3200,
      expiry_date: '2025-05-30',
      storage_location: 'Refrigerator H-1',
      temperature: 4,
      notes: 'Seasonal flu campaign 2024-2025.',
      created_by: 'Nurse Jennifer Davis',
      created_at: '2024-10-01T09:00:00Z',
      updated_at: '2024-10-01T09:00:00Z'
    },
    {
      id: 16,
      vaccine_name: 'Influenza',
      batch_number: 'FLU-2024-002',
      manufacturer: 'Sanofi Pasteur',
      quantity: 2800,
      expiry_date: '2025-06-15',
      storage_location: 'Refrigerator H-2',
      temperature: 4,
      notes: 'Priority for elderly and high-risk groups.',
      created_by: 'Dr. Michael Chen',
      created_at: '2024-10-15T11:30:00Z',
      updated_at: '2024-10-15T11:30:00Z'
    },

    // Pneumococcal - Good Stock
    {
      id: 17,
      vaccine_name: 'Pneumococcal',
      batch_number: 'PCV-2024-001',
      manufacturer: 'Pfizer',
      quantity: 3500,
      expiry_date: '2025-11-30',
      storage_location: 'Refrigerator I-1',
      temperature: 5,
      notes: 'Infant immunization program.',
      created_by: 'Nurse Patricia Miller',
      created_at: '2024-01-30T10:15:00Z',
      updated_at: '2024-01-30T10:15:00Z'
    },
    {
      id: 18,
      vaccine_name: 'Pneumococcal',
      batch_number: 'PCV-2024-002',
      manufacturer: 'Pfizer',
      quantity: 2900,
      expiry_date: '2026-01-31',
      storage_location: 'Refrigerator I-2',
      temperature: 5,
      notes: 'Adult pneumonia prevention program.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2024-03-10T14:00:00Z',
      updated_at: '2024-03-10T14:00:00Z'
    },

    // Meningococcal - Moderate Stock
    {
      id: 19,
      vaccine_name: 'Meningococcal',
      batch_number: 'MEN-2024-001',
      manufacturer: 'GSK (GlaxoSmithKline)',
      quantity: 2200,
      expiry_date: '2025-10-15',
      storage_location: 'Refrigerator J-1',
      temperature: 4,
      notes: 'College campus vaccination drive.',
      created_by: 'Dr. Michael Chen',
      created_at: '2024-02-12T09:45:00Z',
      updated_at: '2024-02-12T09:45:00Z'
    },

    // HPV - Good Stock
    {
      id: 20,
      vaccine_name: 'Human Papillomavirus (HPV)',
      batch_number: 'HPV-2024-001',
      manufacturer: 'Merck',
      quantity: 2800,
      expiry_date: '2026-03-31',
      storage_location: 'Refrigerator K-1',
      temperature: 5,
      notes: 'Adolescent immunization program.',
      created_by: 'Nurse Jennifer Davis',
      created_at: '2024-01-22T11:20:00Z',
      updated_at: '2024-01-22T11:20:00Z'
    },
    {
      id: 21,
      vaccine_name: 'Human Papillomavirus (HPV)',
      batch_number: 'HPV-2024-002',
      manufacturer: 'Merck',
      quantity: 3100,
      expiry_date: '2026-04-15',
      storage_location: 'Refrigerator K-2',
      temperature: 5,
      notes: 'School vaccination campaign.',
      created_by: 'Dr. Sarah Johnson',
      created_at: '2024-02-28T13:15:00Z',
      updated_at: '2024-02-28T13:15:00Z'
    },

    // Varicella - Low Stock (WARNING)
    {
      id: 22,
      vaccine_name: 'Varicella (Chickenpox)',
      batch_number: 'VAR-2024-001',
      manufacturer: 'Merck',
      quantity: 1100,
      expiry_date: '2025-08-20',
      storage_location: 'Refrigerator L-1',
      temperature: 5,
      notes: 'Stock running low - reorder scheduled.',
      created_by: 'Nurse Patricia Miller',
      created_at: '2024-02-18T10:30:00Z',
      updated_at: '2024-03-12T15:45:00Z'
    },

    // Yellow Fever - Critical Expiry
    {
      id: 23,
      vaccine_name: 'Yellow Fever',
      batch_number: 'YF-2023-002',
      manufacturer: 'Sanofi Pasteur',
      quantity: 1500,
      expiry_date: '2024-12-10', // 18 days from Nov 22, 2024
      storage_location: 'Refrigerator M-1',
      temperature: 5,
      notes: 'URGENT: Expiring very soon! Prioritize travel clinic.',
      created_by: 'Dr. Michael Chen',
      created_at: '2023-11-15T09:00:00Z',
      updated_at: '2024-11-18T14:20:00Z'
    }
  ];

  constructor() {}

  /**
   * Get all mock batches with simulated API delay
   */
  getAllBatches(): Observable<VaccineBatch[]> {
    return of([...this.mockBatches]).pipe(delay(800));
  }

  /**
   * Get batch by ID
   */
  getBatchById(id: number): Observable<VaccineBatch> {
    const batch = this.mockBatches.find(b => b.id === id);
    if (!batch) {
      throw new Error(`Batch with ID ${id} not found`);
    }
    return of({ ...batch }).pipe(delay(500));
  }

  /**
   * Create new batch
   */
  createBatch(batch: Partial<VaccineBatch>): Observable<VaccineBatch> {
    const newId = Math.max(...this.mockBatches.map(b => b.id || 0)) + 1;
    const newBatch: VaccineBatch = {
      id: newId,
      vaccine_name: batch.vaccine_name || '',
      batch_number: batch.batch_number || '',
      manufacturer: batch.manufacturer || '',
      quantity: batch.quantity || 0,
      expiry_date: batch.expiry_date || '',
      storage_location: batch.storage_location,
      temperature: batch.temperature,
      notes: batch.notes,
      created_by: 'Demo User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockBatches.unshift(newBatch);
    return of({ ...newBatch }).pipe(delay(1000));
  }

  /**
   * Update batch
   */
  updateBatch(id: number, updates: Partial<VaccineBatch>): Observable<VaccineBatch> {
    const index = this.mockBatches.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Batch with ID ${id} not found`);
    }

    this.mockBatches[index] = {
      ...this.mockBatches[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return of({ ...this.mockBatches[index] }).pipe(delay(800));
  }

  /**
   * Delete batch
   */
  deleteBatch(id: number): Observable<void> {
    const index = this.mockBatches.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Batch with ID ${id} not found`);
    }

    this.mockBatches.splice(index, 1);
    return of(void 0).pipe(delay(600));
  }

  /**
   * Get batches by vaccine name
   */
  getBatchesByVaccine(vaccineName: string): Observable<VaccineBatch[]> {
    const filtered = this.mockBatches.filter(b => 
      b.vaccine_name.toLowerCase().includes(vaccineName.toLowerCase())
    );
    return of([...filtered]).pipe(delay(500));
  }

  /**
   * Get expiring batches
   */
  getExpiringBatches(days: number = 30): Observable<VaccineBatch[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const expiring = this.mockBatches.filter(b => {
      const expiryDate = new Date(b.expiry_date);
      return expiryDate <= targetDate;
    });

    return of([...expiring]).pipe(delay(500));
  }

  /**
   * Get low stock batches
   */
  getLowStockBatches(threshold: number = 1000): Observable<VaccineBatch[]> {
    const lowStock = this.mockBatches.filter(b => b.quantity < threshold);
    return of([...lowStock]).pipe(delay(500));
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<any> {
    const uniqueVaccines = new Set(this.mockBatches.map(b => b.vaccine_name)).size;
    const totalDoses = this.mockBatches.reduce((sum, b) => sum + b.quantity, 0);
    
    // Low stock items
    const vaccineQuantities = new Map<string, number>();
    this.mockBatches.forEach(b => {
      const current = vaccineQuantities.get(b.vaccine_name) || 0;
      vaccineQuantities.set(b.vaccine_name, current + b.quantity);
    });
    const lowStockItems = Array.from(vaccineQuantities.values())
      .filter(qty => qty < 1000).length;

    // Expiring soon
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = this.mockBatches.filter(b => {
      const expiryDate = new Date(b.expiry_date);
      return expiryDate <= thirtyDaysLater;
    }).length;

    return of({
      totalVaccineTypes: uniqueVaccines,
      totalDoses,
      lowStockItems,
      expiringSoon
    }).pipe(delay(600));
  }

  /**
   * Reset to initial mock data (useful for demos)
   */
  resetMockData(): void {
    console.log('Mock data reset to initial state');
    // The mockBatches array maintains its initial state
    // In a real implementation, you might want to deep clone the initial data
  }

  /**
   * Get current mock data count
   */
  getMockDataCount(): number {
    return this.mockBatches.length;
  }
}