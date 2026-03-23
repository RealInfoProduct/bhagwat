import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineSalaryDialogComponent } from './machine-salary-dialog.component';

describe('MachineSalaryDialogComponent', () => {
  let component: MachineSalaryDialogComponent;
  let fixture: ComponentFixture<MachineSalaryDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MachineSalaryDialogComponent]
    });
    fixture = TestBed.createComponent(MachineSalaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
