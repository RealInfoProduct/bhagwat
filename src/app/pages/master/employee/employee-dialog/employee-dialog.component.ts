import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-employee-dialog',
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss']
})
export class EmployeeDialogComponent  implements OnInit {
  employeeForm: FormGroup;
  action: string;
  local_data: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EmployeeDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.buildForm()
    if (this.action === 'Edit') {
      this.employeeForm.controls['firstName'].setValue(this.local_data.firstName)
      this.employeeForm.controls['lastName'].setValue(this.local_data.lastName)
      this.employeeForm.controls['salary'].setValue(this.local_data.salary)
      this.employeeForm.controls['phoneNo'].setValue(this.local_data.phoneNo)
      this.employeeForm.controls['bankName'].setValue(this.local_data.bankName)
      this.employeeForm.controls['bankIFSC'].setValue(this.local_data.bankIFSC)
      this.employeeForm.controls['bankAccountNo'].setValue(this.local_data.bankAccountNo)
      this.employeeForm.controls['date'].setValue(new Date(this.local_data.date.seconds * 1000))
    }
  }

  buildForm() {
    this.employeeForm = this.fb.group({
      firstName: ['',Validators.required],
      lastName: ['',Validators.required],
      salary: ['',Validators.required],
      phoneNo: ['',[Validators.required,Validators.pattern(/^\d{10}$/)]],
      bankName: [''],
      bankIFSC: [''],
      bankAccountNo: [''],
      date: [new Date()],
    })
  }

  doAction(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      firstName: this.employeeForm.value.firstName,
      lastName: this.employeeForm.value.lastName,
      salary: this.employeeForm.value.salary,
      phoneNo: this.employeeForm.value.phoneNo,
      bankName: this.employeeForm.value.bankName,
      bankIFSC: this.employeeForm.value.bankIFSC,
      bankAccountNo: this.employeeForm.value.bankAccountNo,
      date: this.employeeForm.value.date,
    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}