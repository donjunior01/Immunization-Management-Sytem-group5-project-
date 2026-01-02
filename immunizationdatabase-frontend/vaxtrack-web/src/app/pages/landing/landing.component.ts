import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LandingComponent {
  features = [
    {
      icon: '📴',
      title: 'Offline-First Design',
      description: 'Work without internet. Sync automatically when connected.'
    },
    {
      icon: '📦',
      title: 'Real-Time Inventory',
      description: 'Track vaccine stock from arrival to administration with automatic deduction.'
    },
    {
      icon: '📊',
      title: 'Smart Reporting',
      description: 'Generate coverage reports and identify defaulters instantly.'
    }
  ];

  statistics = [
    { value: '200+', label: 'Health Facilities Using VaxTrack' },
    { value: '50K+', label: 'Children Vaccinated' },
    { value: '100K+', label: 'Vaccine Doses Tracked' },
    { value: '99.9%', label: 'Data Accuracy' }
  ];

  howItWorks = [
    { step: 1, title: 'Register patients quickly', description: 'Simple registration form with duplicate detection' },
    { step: 2, title: 'Record vaccinations offline', description: 'Works without internet, syncs when online' },
    { step: 3, title: 'Track vaccine inventory automatically', description: 'Automatic stock deduction and alerts' },
    { step: 4, title: 'Generate reports instantly', description: 'Real-time coverage and defaulter reports' }
  ];

  testimonials = [
    {
      quote: 'VaxTrack has transformed how we manage vaccinations. The offline capability is a game-changer for rural facilities.',
      author: 'Dr. Sarah Mbah',
      role: 'Health Worker',
      facility: 'Mvog-Ada Health Center'
    },
    {
      quote: 'The automatic stock tracking and alerts have eliminated stock-outs completely. Coverage has improved significantly.',
      author: 'John Keng',
      role: 'Facility Manager',
      facility: 'Essos Health Center'
    }
  ];
}

