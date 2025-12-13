import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationsCenterComponent } from './notifications-center.component';
import { LoaderService } from '../services/loader.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

describe('NotificationsCenterComponent', () => {
  let component: NotificationsCenterComponent;
  let fixture: ComponentFixture<NotificationsCenterComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    await TestBed.configureTestingModule({
      imports: [NotificationsCenterComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(NotificationsCenterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', () => {
    spyOn(component, 'loadNotifications');
    component.ngOnInit();
    expect(component.loadNotifications).toHaveBeenCalled();
  });

  it('should load stats correctly', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      expect(component.stats.total).toBe(47);
      expect(component.stats.unread).toBe(23);
      expect(component.stats.criticalAlerts).toBe(5);
      expect(component.stats.stockAlerts).toBe(12);
      done();
    }, 1100);
  });

  it('should load 15 notifications', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      expect(component.notifications.length).toBe(15);
      expect(component.notifications[0].id).toBe('NOT001');
      expect(component.notifications[0].title).toBe('Critical Stock Alert');
      done();
    }, 1100);
  });

  it('should update category counts', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const allCategory = component.categories.find(c => c.value === 'all');
      expect(allCategory?.count).toBe(15);
      const stockCategory = component.categories.find(c => c.value === 'stock');
      expect(stockCategory?.count).toBeGreaterThan(0);
      done();
    }, 1100);
  });

  it('should apply filters and show success notification', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      component.filters.type = 'alert';
      component.applyFilters();
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('Filters applied successfully');
        expect(component.filteredNotifications.every(n => n.type === 'alert')).toBe(true);
        done();
      }, 900);
    }, 1100);
  });

  it('should reset filters', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      component.filters.type = 'alert';
      component.filters.category = 'stock';
      component.filters.priority = 'critical';
      
      spyOn(component, 'applyFilters');
      component.resetFilters();
      
      expect(component.filters.type).toBe('all');
      expect(component.filters.category).toBe('all');
      expect(component.filters.priority).toBe('all');
      expect(component.applyFilters).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should filter by category', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      spyOn(component, 'applyFilters');
      component.filterByCategory('stock');
      
      expect(component.filters.category).toBe('stock');
      expect(component.applyFilters).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should mark notification as read', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const unreadCount = component.stats.unread;
      const notification = component.notifications.find(n => !n.read);
      
      if (notification) {
        component.markAsRead(notification.id);
        
        expect(notification.read).toBe(true);
        expect(component.stats.unread).toBe(unreadCount - 1);
        expect(notificationService.success).toHaveBeenCalledWith('Notification marked as read');
      }
      done();
    }, 1100);
  });

  it('should mark notification as unread', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const unreadCount = component.stats.unread;
      const notification = component.notifications.find(n => n.read);
      
      if (notification) {
        component.markAsUnread(notification.id);
        
        expect(notification.read).toBe(false);
        expect(component.stats.unread).toBe(unreadCount + 1);
        expect(notificationService.success).toHaveBeenCalledWith('Notification marked as unread');
      }
      done();
    }, 1100);
  });

  it('should mark all as read', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      component.markAllAsRead();
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(component.notifications.every(n => n.read)).toBe(true);
        expect(component.stats.unread).toBe(0);
        expect(notificationService.success).toHaveBeenCalledWith('All 15 notifications marked as read');
        done();
      }, 900);
    }, 1100);
  });

  it('should delete notification', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const initialCount = component.notifications.length;
      const notification = component.notifications[0];
      
      component.deleteNotification(notification.id);
      
      expect(component.notifications.length).toBe(initialCount - 1);
      expect(notificationService.success).toHaveBeenCalledWith('Notification deleted');
      done();
    }, 1100);
  });

  it('should toggle selection', () => {
    component.toggleSelection('NOT001');
    expect(component.selectedNotifications.has('NOT001')).toBe(true);
    
    component.toggleSelection('NOT001');
    expect(component.selectedNotifications.has('NOT001')).toBe(false);
  });

  it('should toggle select all', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      component.toggleSelectAll();
      
      expect(component.allSelected).toBe(true);
      expect(component.selectedNotifications.size).toBe(component.filteredNotifications.length);
      
      component.toggleSelectAll();
      
      expect(component.allSelected).toBe(false);
      expect(component.selectedNotifications.size).toBe(0);
      done();
    }, 1100);
  });

  it('should mark selected as read', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const unreadNotifications = component.notifications.filter(n => !n.read);
      unreadNotifications.slice(0, 3).forEach(n => component.selectedNotifications.add(n.id));
      
      component.markSelectedAsRead();
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(component.selectedNotifications.size).toBe(0);
        expect(notificationService.success).toHaveBeenCalledWith(jasmine.stringContaining('marked as read'));
        done();
      }, 900);
    }, 1100);
  });

  it('should delete selected notifications', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const initialCount = component.notifications.length;
      component.selectedNotifications.add('NOT001');
      component.selectedNotifications.add('NOT002');
      
      component.deleteSelected();
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(component.notifications.length).toBe(initialCount - 2);
        expect(component.selectedNotifications.size).toBe(0);
        expect(notificationService.success).toHaveBeenCalledWith('2 notification(s) deleted');
        done();
      }, 900);
    }, 1100);
  });

  it('should view notification', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      const notification = component.notifications.find(n => !n.read && n.actionUrl);
      
      if (notification) {
        component.viewNotification(notification);
        
        expect(notification.read).toBe(true);
        expect(notificationService.info).toHaveBeenCalledWith(`Navigating to ${notification.actionUrl}`);
      }
      done();
    }, 1100);
  });

  it('should return correct priority class', () => {
    expect(component.getPriorityClass('critical')).toBe('priority-critical');
    expect(component.getPriorityClass('high')).toBe('priority-high');
    expect(component.getPriorityClass('medium')).toBe('priority-medium');
    expect(component.getPriorityClass('low')).toBe('priority-low');
  });

  it('should return correct category icon', () => {
    expect(component.getCategoryIcon('stock')).toBe('inventory_2');
    expect(component.getCategoryIcon('vaccine')).toBe('vaccines');
    expect(component.getCategoryIcon('campaign')).toBe('campaign');
    expect(component.getCategoryIcon('system')).toBe('info');
  });

  it('should return correct type class', () => {
    expect(component.getTypeClass('alert')).toBe('type-alert');
    expect(component.getTypeClass('notification')).toBe('type-notification');
    expect(component.getTypeClass('update')).toBe('type-update');
    expect(component.getTypeClass('reminder')).toBe('type-reminder');
  });

  it('should format timestamp correctly', () => {
    const now = new Date();
    const justNow = new Date(now.getTime() - 30000);
    const minutesAgo = new Date(now.getTime() - 5 * 60000);
    const hoursAgo = new Date(now.getTime() - 3 * 3600000);
    const daysAgo = new Date(now.getTime() - 2 * 86400000);

    expect(component.formatTimestamp(justNow)).toBe('Just now');
    expect(component.formatTimestamp(minutesAgo)).toBe('5m ago');
    expect(component.formatTimestamp(hoursAgo)).toBe('3h ago');
    expect(component.formatTimestamp(daysAgo)).toBe('2d ago');
  });

  it('should refresh notifications', () => {
    spyOn(component, 'loadNotifications');
    component.refreshNotifications();
    
    expect(component.loadNotifications).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Notifications refreshed');
  });

  it('should generate CSV export', (done) => {
    component.loadNotifications();
    
    setTimeout(() => {
      spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy('click')
      } as any);
      
      component.exportNotifications('csv');
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('CSV exported successfully');
        done();
      }, 1100);
    }, 1100);
  });

  it('should show info for PDF export', (done) => {
    component.exportNotifications('pdf');
    
    setTimeout(() => {
      expect(notificationService.info).toHaveBeenCalledWith('PDF generation would require additional library (e.g., jsPDF)');
      done();
    }, 1100);
  });

  it('should show info when no notifications selected for bulk actions', () => {
    component.selectedNotifications.clear();
    component.markSelectedAsRead();
    
    expect(notificationService.info).toHaveBeenCalledWith('No notifications selected');
    
    component.deleteSelected();
    
    expect(notificationService.info).toHaveBeenCalledWith('No notifications selected');
  });
});
