import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmountDialogComponent } from './amount-dialog.component';

describe('AmountDialogComponent', () => {
  let component: AmountDialogComponent;
  let fixture: ComponentFixture<AmountDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AmountDialogComponent]
    });
    fixture = TestBed.createComponent(AmountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
