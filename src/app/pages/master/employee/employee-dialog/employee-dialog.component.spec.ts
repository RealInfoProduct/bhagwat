import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDialogComponent } from './employee-dialog.component';

describe('EmployeeDialogComponent', () => {
  let component: EmployeeDialogComponent;
  let fixture: ComponentFixture<EmployeeDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeDialogComponent]
    });
    fixture = TestBed.createComponent(EmployeeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
