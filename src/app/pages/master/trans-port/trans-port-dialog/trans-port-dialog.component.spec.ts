import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransPortDialogComponent } from './trans-port-dialog.component';

describe('TransPortDialogComponent', () => {
  let component: TransPortDialogComponent;
  let fixture: ComponentFixture<TransPortDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransPortDialogComponent]
    });
    fixture = TestBed.createComponent(TransPortDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
