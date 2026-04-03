import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-raw-material-dialog',
  templateUrl: './raw-material-dialog.component.html',
  styleUrls: ['./raw-material-dialog.component.scss']
})
export class RawMaterialDialogComponent implements OnInit {

  rowMaterialForm: FormGroup;
  local_data: any;
  action: string;

  constructor(
    private fb: FormBuilder, public dialogRef: MatDialogRef<RawMaterialDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.rowMateriallist(this.action === 'Edit' ? this.local_data : undefined);
  }

  rowMateriallist(data:any) {
    this.rowMaterialForm = this.fb.group({
      name: [data ? data?.name :'', Validators.required],
      quantity: [data ? data?.quantity :'', Validators.required],
      price: [data ? data?.price :'', Validators.required],
      creditDate: [data ? this.convertTimestampToDate(data?.creditDate) : new Date()],
    })
  }

   convertTimestampToDate(element: any): Date | null {
    if (element instanceof Timestamp) {
      return element.toDate();
    }
    return null;
  }

  doAction(): void {
    const payload = {
        id: this.local_data.id ? this.local_data.id : '',
      name: this.rowMaterialForm.value.name,
      quantity: this.rowMaterialForm.value.quantity,
      price: this.rowMaterialForm.value.price,
      creditDate: this.rowMaterialForm.value.creditDate,
      totalAmount: this.rowMaterialForm.value.creditDate,
    }
    this.dialogRef.close({ event: this.action, data: payload })
  }

}