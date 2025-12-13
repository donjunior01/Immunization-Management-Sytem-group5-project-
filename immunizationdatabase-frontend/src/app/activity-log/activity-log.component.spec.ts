import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivityLogComponent } from './activity-log.component';
import { LoaderService } from '../services/loader.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

describe('ActivityLogComponent', () => {
  let component: ActivityLogComponent;
  let fixture: ComponentFixture<ActivityLogComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [ActivityLogComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(ActivityLogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load activity log on init', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.activities.length).toBeGreaterThan(0);
      expect(component.filteredActivities.length).toBeGreaterThan(0);
      expect(loaderService.show).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should calculate stats correctly', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.stats.totalActivities).toBe(component.activities.length);
      expect(component.stats.uniqueUsers).toBeGreaterThan(0);
      done();
    }, 1100);
  });

  it('should filter activities by search term', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      const initialCount = component.filteredActivities.length;
      component.filters.search = 'Facility';
      component.applyFilters();
      
      setTimeout(() => {
        expect(component.filteredActivities.length).toBeLessThanOrEqual(initialCount);
        expect(notificationService.success).toHaveBeenCalledWith('Filters applied successfully');
        done();
      }, 900);
    }, 1100);
  });

  it('should filter activities by category', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.filters.category = 'authentication';
      component.applyFilters();
      
      setTimeout(() => {
        const allAuthentication = component.filteredActivities.every(a => a.category === 'authentication');
        expect(allAuthentication).toBe(true);
        done();
      }, 900);
    }, 1100);
  });

  it('should filter activities by action', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.filters.action = 'create';
      component.applyFilters();
      
      setTimeout(() => {
        const allCreate = component.filteredActivities.every(a => a.action === 'create');
        expect(allCreate).toBe(true);
        done();
      }, 900);
    }, 1100);
  });

  it('should filter activities by status', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.filters.status = 'success';
      component.applyFilters();
      
      setTimeout(() => {
        const allSuccess = component.filteredActivities.every(a => a.status === 'success');
        expect(allSuccess).toBe(true);
        done();
      }, 900);
    }, 1100);
  });

  it('should filter activities by date range', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      component.filters.dateFrom = yesterday;
      component.applyFilters();
      
      setTimeout(() => {
        const allAfterDate = component.filteredActivities.every(a => a.timestamp >= yesterday);
        expect(allAfterDate).toBe(true);
        done();
      }, 900);
    }, 1100);
  });

  it('should reset filters', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.filters.search = 'test';
      component.filters.category = 'patient';
      component.filters.action = 'create';
      
      component.resetFilters();
      
      expect(component.filters.search).toBe('');
      expect(component.filters.category).toBe('all');
      expect(component.filters.action).toBe('all');
      done();
    }, 1100);
  });

  it('should update displayed activities on page change', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.handlePageEvent({ pageIndex: 1, pageSize: 20, length: 100 });
      
      expect(component.pageIndex).toBe(1);
      expect(component.pageSize).toBe(20);
      expect(component.displayedActivities.length).toBeLessThanOrEqual(20);
      done();
    }, 1100);
  });

  it('should view activity details', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      const activity = component.activities[0];
      component.viewDetails(activity);
      
      expect(component.selectedActivity).toBe(activity);
      expect(component.showDetailDialog).toBe(true);
      done();
    }, 1100);
  });

  it('should close detail dialog', () => {
    component.selectedActivity = component.activities[0];
    component.showDetailDialog = true;
    
    component.closeDetailDialog();
    
    expect(component.selectedActivity).toBeNull();
    expect(component.showDetailDialog).toBe(false);
  });

  it('should export logs to CSV', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      
      component.exportLogs('csv');
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('Activity log exported to CSV');
        done();
      }, 1100);
    }, 1100);
  });

  it('should export logs to JSON', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      
      component.exportLogs('json');
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('Activity log exported to JSON');
        done();
      }, 1100);
    }, 1100);
  });

  it('should show info for PDF export', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.exportLogs('pdf');
      
      setTimeout(() => {
        expect(notificationService.info).toHaveBeenCalled();
        done();
      }, 1100);
    }, 1100);
  });

  it('should generate CSV correctly', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      const csv = component.generateCSV();
      
      expect(csv).toContain('Timestamp,User,Role,Action,Category');
      expect(csv.split('\n').length).toBeGreaterThan(1);
      done();
    }, 1100);
  });

  it('should refresh log', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.refreshLog();
      
      setTimeout(() => {
        expect(loaderService.show).toHaveBeenCalled();
        expect(notificationService.success).toHaveBeenCalledWith('Activity log refreshed');
        done();
      }, 1100);
    }, 1100);
  });

  it('should get correct category icon', () => {
    expect(component.getCategoryIcon('authentication')).toBe('login');
    expect(component.getCategoryIcon('patient')).toBe('person');
    expect(component.getCategoryIcon('vaccination')).toBe('vaccines');
    expect(component.getCategoryIcon('inventory')).toBe('inventory_2');
  });

  it('should get correct action class', () => {
    expect(component.getActionClass('create')).toBe('action-create');
    expect(component.getActionClass('update')).toBe('action-update');
    expect(component.getActionClass('delete')).toBe('action-delete');
  });

  it('should get correct status class', () => {
    expect(component.getStatusClass('success')).toBe('status-success');
    expect(component.getStatusClass('failure')).toBe('status-failure');
    expect(component.getStatusClass('warning')).toBe('status-warning');
  });

  it('should format timestamp correctly', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 30000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);
    
    expect(component.formatTimestamp(oneMinuteAgo)).toContain('Just now');
    expect(component.formatTimestamp(oneHourAgo)).toContain('h ago');
    expect(component.formatTimestamp(oneDayAgo)).toContain('d ago');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2025-01-20T12:00:00');
    const formatted = component.formatDate(testDate);
    
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('2025');
  });

  it('should get entity name correctly', () => {
    expect(component.getEntityName('authentication')).toBe('User Session');
    expect(component.getEntityName('patient')).toBe('Patient Record');
    expect(component.getEntityName('vaccination')).toBe('Vaccination Record');
    expect(component.getEntityName('inventory')).toBe('Vaccine Batch');
  });

  it('should generate description correctly', () => {
    const createDesc = component.generateDescription('create', 'patient');
    expect(createDesc).toBeTruthy();
    
    const updateDesc = component.generateDescription('update', 'inventory');
    expect(updateDesc).toBeTruthy();
  });

  it('should generate changes correctly', () => {
    const patientChanges = component.generateChanges('patient');
    expect(patientChanges.length).toBeGreaterThan(0);
    
    const inventoryChanges = component.generateChanges('inventory');
    expect(inventoryChanges.length).toBeGreaterThan(0);
  });

  it('should handle multiple filters simultaneously', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.filters.search = 'Facility';
      component.filters.category = 'patient';
      component.filters.status = 'success';
      component.applyFilters();
      
      setTimeout(() => {
        const allMatch = component.filteredActivities.every(a => 
          (a.user.includes('Facility') || a.description.includes('Facility')) &&
          a.category === 'patient' &&
          a.status === 'success'
        );
        expect(allMatch).toBe(true);
        done();
      }, 900);
    }, 1100);
  });

  it('should handle empty search results', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      component.filters.search = 'NonExistentUser12345';
      component.applyFilters();
      
      setTimeout(() => {
        expect(component.filteredActivities.length).toBe(0);
        expect(component.displayedActivities.length).toBe(0);
        done();
      }, 900);
    }, 1100);
  });
});
