import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransPortComponent } from './trans-port.component';

describe('TransPortComponent', () => {
  let component: TransPortComponent;
  let fixture: ComponentFixture<TransPortComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransPortComponent]
    });
    fixture = TestBed.createComponent(TransPortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
