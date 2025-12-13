import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageCampaignsComponent } from './manage-campaigns.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ManageCampaignsComponent', () => {
  let component: ManageCampaignsComponent;
  let fixture: ComponentFixture<ManageCampaignsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ManageCampaignsComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageCampaignsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load campaigns on init', () => {
    expect(component.campaigns.length).toBeGreaterThan(0);
    expect(component.stats.total).toBeGreaterThan(0);
  });

  it('should calculate stats correctly', () => {
    component.campaigns = [
      { status: 'ACTIVE' } as any,
      { status: 'PLANNED' } as any,
      { status: 'COMPLETED' } as any
    ];
    component.calculateStats();
    expect(component.stats.total).toBe(3);
    expect(component.stats.active).toBe(1);
    expect(component.stats.planned).toBe(1);
    expect(component.stats.completed).toBe(1);
  });

  it('should filter campaigns by search term', () => {
    component.searchTerm = 'BCG';
    component.applyFilters();
    expect(component.filteredCampaigns.length).toBeGreaterThan(0);
    expect(component.filteredCampaigns.every(c => 
      c.name.toLowerCase().includes('bcg') || 
      c.vaccineName.toLowerCase().includes('bcg')
    )).toBeTruthy();
  });

  it('should return correct coverage color', () => {
    expect(component.getCoverageColor(85)).toBe('#38ef7d'); // >= 80%
    expect(component.getCoverageColor(65)).toBe('#f093fb'); // >= 60%
    expect(component.getCoverageColor(45)).toBe('#ffa726'); // >= 40%
    expect(component.getCoverageColor(30)).toBe('#ef5350'); // < 40%
  });
});
