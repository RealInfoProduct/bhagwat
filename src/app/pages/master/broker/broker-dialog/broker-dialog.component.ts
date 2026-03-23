import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-broker-dialog',
  templateUrl: './broker-dialog.component.html',
  styleUrls: ['./broker-dialog.component.scss']
})
export class BrokerDialogComponent implements OnInit {
  brokerForm: FormGroup;
  action: string;
  local_data: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BrokerDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.formBuild()
    if (this.action === 'Edit') {
      this.brokerForm.controls['header'].setValue(this.local_data.header)
      this.brokerForm.controls['subHeader'].setValue(this.local_data.subHeader)
      this.brokerForm.controls['address'].setValue(this.local_data.address)
      this.brokerForm.controls['GSTNo'].setValue(this.local_data.gstNo)
      this.brokerForm.controls['panNo'].setValue(this.local_data.panNo)
      this.brokerForm.controls['mobileNo'].setValue(this.local_data.mobileNo)
      this.brokerForm.controls['personalMobileNo'].setValue(this.local_data.personalMobileNo)
      this.brokerForm.controls['bankName'].setValue(this.local_data.bankName)
      this.brokerForm.controls['accountholdersname'].setValue(this.local_data.accountholdersname)
      this.brokerForm.controls['ifscCode'].setValue(this.local_data.bankIfsc)
      this.brokerForm.controls['bankAccountNo'].setValue(this.local_data.bankAccountNo)
    }
  }

  formBuild() {
    this.brokerForm = this.fb.group({
      header: ['',[Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      subHeader: ['',[Validators.required, Validators.pattern('^[a-zA-Z]+(?: [a-zA-Z]+)*$')]],
      address: [''],
      GSTNo: ['', [Validators.pattern('^([0-3][0-9])([A-Z]{5}[0-9]{4}[A-Z])([1-9A-Z])Z([0-9A-Z])$')]],
      panNo: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      mobileNo: ['',[Validators.required,Validators.pattern(/^\d{10}$/)]],
      personalMobileNo: [],
      bankName: [''],
      accountholdersname: [''],
      ifscCode: [''],
      bankAccountNo: [''],
    })
  }

  doAction(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      header: this.brokerForm.value.header,
      subHeader: this.brokerForm.value.subHeader,
      address: this.brokerForm.value.address,
      GSTNo: this.brokerForm.value.GSTNo,
      panNo: this.brokerForm.value.panNo,
      mobileNo: this.brokerForm.value.mobileNo,
      personalMobileNo: this.brokerForm.value.personalMobileNo,
      bankName: this.brokerForm.value.bankName,
      accountholdersname: this.brokerForm.value.accountholdersname,
      ifscCode: this.brokerForm.value.ifscCode,
      bankAccountNo: this.brokerForm.value.bankAccountNo,
    }
    this.dialogRef.close({ event: this.action, data: payload });

  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

}

