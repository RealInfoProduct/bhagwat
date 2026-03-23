import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerDialogComponent } from './broker-dialog.component';

describe('BrokerDialogComponent', () => {
  let component: BrokerDialogComponent;
  let fixture: ComponentFixture<BrokerDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BrokerDialogComponent]
    });
    fixture = TestBed.createComponent(BrokerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
