import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineSalaryComponent } from './machine-salary.component';

describe('MachineSalaryComponent', () => {
  let component: MachineSalaryComponent;
  let fixture: ComponentFixture<MachineSalaryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MachineSalaryComponent]
    });
    fixture = TestBed.createComponent(MachineSalaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
