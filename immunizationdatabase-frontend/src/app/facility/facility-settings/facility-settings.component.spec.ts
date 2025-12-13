import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FacilitySettingsComponent } from './facility-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('FacilitySettingsComponent', () => {
  let component: FacilitySettingsComponent;
  let fixture: ComponentFixture<FacilitySettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FacilitySettingsComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilitySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load facility data on init', () => {
    expect(component.facility).toBeDefined();
  });

  it('should enable forms when editing', () => {
    component.startEditing();
    expect(component.isEditing).toBe(true);
  });
});
