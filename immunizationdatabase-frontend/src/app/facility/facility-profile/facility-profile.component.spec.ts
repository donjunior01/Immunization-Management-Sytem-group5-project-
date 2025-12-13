import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FacilityProfileComponent } from './facility-profile.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FacilityProfileComponent', () => {
  let component: FacilityProfileComponent;
  let fixture: ComponentFixture<FacilityProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FacilityProfileComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilityProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load facility profile on init', () => {
    expect(component.facility).toBeDefined();
    expect(component.stats).toBeDefined();
    expect(component.performanceMetrics.length).toBe(4);
    expect(component.staffMembers.length).toBe(3);
  });

  it('should calculate years established correctly', () => {
    const years = component.getYearsEstablished();
    expect(years).toBeGreaterThan(0);
  });

  it('should return correct performance color', () => {
    expect(component.getPerformanceColor(100, 100)).toBe('#38ef7d'); // 100%
    expect(component.getPerformanceColor(85, 100)).toBe('#f093fb'); // 85%
    expect(component.getPerformanceColor(65, 100)).toBe('#ffa726'); // 65%
    expect(component.getPerformanceColor(50, 100)).toBe('#ef5350'); // 50%
  });

  it('should return correct performance status', () => {
    expect(component.getPerformanceStatus(100, 100)).toBe('Excellent');
    expect(component.getPerformanceStatus(85, 100)).toBe('Good');
    expect(component.getPerformanceStatus(65, 100)).toBe('Fair');
    expect(component.getPerformanceStatus(50, 100)).toBe('Needs Improvement');
  });
});
