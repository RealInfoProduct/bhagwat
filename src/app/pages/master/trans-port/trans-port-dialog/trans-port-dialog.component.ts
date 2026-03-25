import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-trans-port-dialog',
  templateUrl: './trans-port-dialog.component.html',
  styleUrls: ['./trans-port-dialog.component.scss']
})
export class TransPortDialogComponent implements OnInit {
  transPortForm: FormGroup;
  action: string;
  local_data: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TransPortDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.formBuild()
    if (this.action === 'Edit') {
      this.transPortForm.controls['header'].setValue(this.local_data.header)
      this.transPortForm.controls['subHeader'].setValue(this.local_data.subHeader)
      this.transPortForm.controls['address'].setValue(this.local_data.address)
      this.transPortForm.controls['mobileNo'].setValue(this.local_data.mobileNo)
      this.transPortForm.controls['transPortId'].setValue(this.local_data.transPortId)
      this.transPortForm.controls['transPortCompany'].setValue(this.local_data.transPortCompany)
    }
  }

  formBuild() {
    this.transPortForm = this.fb.group({
      header: ['',[Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      subHeader: ['',[Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      address: [''],
      transPortCompany: ['',[Validators.required]],
      transPortId: ['',[Validators.required]],
      mobileNo: ['',[Validators.required,Validators.pattern(/^\d{10}$/)]],
    })
  }

  doAction(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      header: this.transPortForm.value.header,
      subHeader: this.transPortForm.value.subHeader,
      address: this.transPortForm.value.address,
      mobileNo: this.transPortForm.value.mobileNo,
      transPortId: this.transPortForm.value.transPortId,
      transPortCompany: this.transPortForm.value.transPortCompany,
      bankAccountNo: this.transPortForm.value.bankAccountNo,
    }
    this.dialogRef.close({ event: this.action, data: payload });

  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

}


