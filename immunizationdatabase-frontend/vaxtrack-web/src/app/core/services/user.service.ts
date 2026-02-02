import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: string, user: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  getFacilityStaff(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/facility/staff`).pipe(
      timeout(8000), // 8 second timeout
      catchError(error => {
        console.error('Error fetching facility staff:', error);
        return throwError(() => error);
      })
    );
  }

  deactivateUser(id: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}/deactivate`, {});
  }
}

